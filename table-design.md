# Web-See 前端监控平台 — 数据库表设计

> 数据库：MySQL 8.0+  
> 字符集：utf8mb4  
> 排序规则：utf8mb4_unicode_ci  
> 将以下 SQL 在 MySQL 中执行可完整创建所有表

---

## 执行前准备

```sql
-- 创建数据库（开发环境）
CREATE DATABASE IF NOT EXISTS `web_see_dev`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `web_see_dev`;

-- 生产环境请修改为 web_see
-- CREATE DATABASE IF NOT EXISTS `web_see` ...
```

---

## 一、用户表 `users`

**对应接口：**
- `POST /api/auth/register` — 注册时写入
- `POST /api/auth/login`    — 登录时查询
- `GET  /api/auth/profile`  — 查当前用户
- `GET  /api/users`         — 用户列表（Admin）
- `PATCH /api/users/:id`    — 更新用户
- `DELETE /api/users/:id`   — 删除用户（Admin）

```sql
CREATE TABLE `users` (
  `id`         INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username`   VARCHAR(50)  NOT NULL                COMMENT '用户名（唯一）',
  `email`      VARCHAR(100) NOT NULL                COMMENT '邮箱（唯一）',
  `password`   VARCHAR(255) NOT NULL                COMMENT 'bcrypt 加密密码',
  `role`       ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER' COMMENT '角色',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | 登录用户名，唯一 |
| email | VARCHAR(100) | 邮箱，唯一 |
| password | VARCHAR(255) | bcryptjs 哈希值（saltRounds=10） |
| role | ENUM | ADMIN=管理员, USER=普通用户 |
| created_at | DATETIME | 注册时间 |
| updated_at | DATETIME | 最后更新时间 |

---

## 二、项目表 `projects`

**对应接口：**
- `POST /api/projects`               — 创建项目，自动生成 apikey
- `GET  /api/projects`               — 查询项目列表（自己的 / Admin 全部）
- `GET  /api/projects/:id`           — 项目详情
- `PATCH /api/projects/:id`          — 更新项目信息
- `DELETE /api/projects/:id`         — 删除项目
- `POST /api/projects/:id/regenerate-apikey` — 重新生成 apikey

```sql
CREATE TABLE `projects` (
  `id`          INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name`        VARCHAR(100) NOT NULL                COMMENT '项目名称',
  `apikey`      VARCHAR(64)  NOT NULL                COMMENT '项目唯一标识（UUID去横线）',
  `description` VARCHAR(255)                         COMMENT '项目描述',
  `owner_id`    INT          NOT NULL                COMMENT '所属用户 ID',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_apikey` (`apikey`),
  KEY `idx_owner_id` (`owner_id`),
  CONSTRAINT `fk_projects_owner` FOREIGN KEY (`owner_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='监控项目表';
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(100) | 项目名称 |
| apikey | VARCHAR(64) | UUID 生成，唯一，SDK 接入时使用 |
| description | VARCHAR(255) | 项目描述（可选）|
| owner_id | INT | 关联 users.id，级联删除 |

---

## 三、错误上报表 `error_reports`

**对应接口：**
- `POST /reportData` (type ≠ performance/recordScreen/whiteScreen) — SDK 上报，写入
- `GET  /getErrorList`         — 旧接口兼容，前端 HomeView.vue 调用
- `GET  /api/errors`           — 错误列表（分页+过滤）
- `GET  /api/errors/:id`       — 错误详情（含用户行为轨迹）

**type 枚举值：**
- `error` — JS 运行时错误
- `unhandledrejection` — Promise 未捕获拒绝
- `resourceError` — 静态资源加载失败
- `httpError` — XHR/Fetch 请求失败

```sql
CREATE TABLE `error_reports` (
  `id`               INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type`             VARCHAR(50)  NOT NULL                COMMENT '错误类型',
  `sub_type`         VARCHAR(50)                          COMMENT '子类型（如 js/promise/resource）',
  `message`          TEXT                                 COMMENT '错误信息',
  `page_url`         VARCHAR(500)                         COMMENT '发生错误的页面 URL',
  `time`             BIGINT                               COMMENT '错误发生时间戳（毫秒）',
  `apikey`           VARCHAR(64)  NOT NULL                COMMENT '项目 apikey',
  `monitor_user_id`  VARCHAR(100)                         COMMENT '被监控应用的用户 ID',
  `sdk_version`      VARCHAR(20)                          COMMENT 'web-see SDK 版本',
  `device_info`      JSON                                 COMMENT '设备信息 {browser, browserVersion, os, ua}',
  `record_screen_id` VARCHAR(64)                          COMMENT '关联录屏 ID',
  `stack`            TEXT                                 COMMENT '错误堆栈',
  `filename`         VARCHAR(500)                         COMMENT '错误所在 JS 文件名',
  `line_no`          INT                                  COMMENT '错误行号',
  `col_no`           INT                                  COMMENT '错误列号',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apikey`           (`apikey`),
  KEY `idx_type`             (`type`),
  KEY `idx_record_screen_id` (`record_screen_id`),
  KEY `idx_created_at`       (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错误上报数据表';
```

**device_info JSON 示例：**
```json
{
  "browser": "Chrome",
  "browserVersion": "120.0.0",
  "os": "Windows 10",
  "ua": "Mozilla/5.0 ..."
}
```

---

## 四、用户行为轨迹表 `breadcrumbs`

**对应接口：**  
- 随 `error_reports` 写入（`POST /reportData`）  
- `GET /api/errors/:id` — 查询错误详情时一并返回

**category 枚举值：**
- `Click` — 用户点击 DOM
- `Http` — XHR/Fetch 请求
- `Code_Error` — 代码报错
- `Resource_Error` — 资源加载失败
- `Route` — 路由跳转

```sql
CREATE TABLE `breadcrumbs` (
  `id`              INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `error_report_id` INT          NOT NULL                COMMENT '关联错误记录 ID',
  `category`        VARCHAR(50)                          COMMENT '行为类型',
  `data`            JSON                                 COMMENT '行为数据（因 category 不同而结构各异）',
  `status`          VARCHAR(20)                          COMMENT '状态 ok/error',
  `time`            BIGINT                               COMMENT '行为时间戳（毫秒）',
  `message`         TEXT                                 COMMENT '描述信息',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_error_report_id` (`error_report_id`),
  CONSTRAINT `fk_breadcrumbs_error` FOREIGN KEY (`error_report_id`)
    REFERENCES `error_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为轨迹表';
```

**data JSON 示例（不同 category）：**
```json
// Click
{ "selector": "button.submit", "text": "提交" }

// Http
{ "url": "/api/login", "method": "POST", "statusCode": 401 }

// Route
{ "from": "/home", "to": "/about" }

// Code_Error
{ "message": "TypeError: Cannot read properties of undefined" }
```

---

## 五、性能数据上报表 `performance_reports`

**对应接口：**
- `POST /reportData` (type = 'performance') — SDK 上报，写入
- `GET  /api/performance`          — 性能数据列表
- `GET  /api/performance/:id`      — 单条详情
- `GET  /api/performance/avg/:apikey` — 聚合平均值

**Web Vitals 字段说明：**

| 字段 | 全名 | 说明 |
|------|------|------|
| fp | First Paint | 首次绘制（ms）|
| fcp | First Contentful Paint | 首次内容绘制（ms）|
| lcp | Largest Contentful Paint | 最大内容绘制（ms）|
| fid | First Input Delay | 首次输入延迟（ms）|
| cls | Cumulative Layout Shift | 累积布局偏移（无单位）|
| ttfb | Time to First Byte | 首字节时间（ms）|

```sql
CREATE TABLE `performance_reports` (
  `id`              INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `page_url`        VARCHAR(500)                         COMMENT '页面 URL',
  `time`            BIGINT                               COMMENT '采集时间戳（毫秒）',
  `apikey`          VARCHAR(64)  NOT NULL                COMMENT '项目 apikey',
  `monitor_user_id` VARCHAR(100)                         COMMENT '被监控应用的用户 ID',
  `sdk_version`     VARCHAR(20)                          COMMENT 'SDK 版本',
  `device_info`     JSON                                 COMMENT '设备信息',
  -- Web Vitals（毫秒，DECIMAL 保留两位小数）
  `fp`              DECIMAL(10,2)                        COMMENT 'First Paint (ms)',
  `fcp`             DECIMAL(10,2)                        COMMENT 'First Contentful Paint (ms)',
  `lcp`             DECIMAL(10,2)                        COMMENT 'Largest Contentful Paint (ms)',
  `fid`             DECIMAL(10,2)                        COMMENT 'First Input Delay (ms)',
  `cls`             DECIMAL(10,4)                        COMMENT 'Cumulative Layout Shift',
  `ttfb`            DECIMAL(10,2)                        COMMENT 'Time to First Byte (ms)',
  -- 网络时序（毫秒）
  `dns`             DECIMAL(10,2)                        COMMENT 'DNS 解析耗时 (ms)',
  `tcp`             DECIMAL(10,2)                        COMMENT 'TCP 连接耗时 (ms)',
  `ssl`             DECIMAL(10,2)                        COMMENT 'SSL 握手耗时 (ms)',
  `load_time`       DECIMAL(10,2)                        COMMENT '页面加载总耗时 (ms)',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apikey`     (`apikey`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='性能数据上报表';
```

---

## 六、录屏数据表 `record_screens`

**对应接口：**
- `POST /reportData` (type = 'recordScreen') — SDK 上报，写入
- `GET  /getRecordScreenId?id=xxx` — 旧接口，按 recordScreenId 查询（前端播放录屏使用）
- `GET  /api/record-screens`       — 录屏列表（列表不返回 events 大字段）
- `GET  /api/record-screens/:id`   — 录屏详情（含 events）

```sql
CREATE TABLE `record_screens` (
  `id`               INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `record_screen_id` VARCHAR(64)  NOT NULL                COMMENT '录屏唯一 ID（由 SDK 生成）',
  `events`           LONGTEXT     NOT NULL                COMMENT 'rrweb 事件流（pako 压缩后 base64）',
  `apikey`           VARCHAR(64)                          COMMENT '项目 apikey',
  `monitor_user_id`  VARCHAR(100)                         COMMENT '被监控应用的用户 ID',
  `page_url`         VARCHAR(500)                         COMMENT '录屏页面 URL',
  `time`             BIGINT                               COMMENT '录屏时间戳（毫秒）',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_screen_id` (`record_screen_id`),
  KEY `idx_apikey` (`apikey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录屏数据表';
```

**说明：**
- `record_screen_id`：同一次录屏会话的唯一标识，由 `@websee/recordscreen` SDK 生成
- `events`：rrweb 事件流经 pako 压缩再 base64 编码的字符串，前端用 `unzip(events)` 还原后传给 `rrweb-player`
- 使用 `UPSERT (ON DUPLICATE KEY UPDATE)` 确保同 ID 只存一条

---

## 七、白屏检测数据表 `white_screens`

**对应接口：**
- `POST /reportData` (type = 'whiteScreen') — SDK 上报，写入
- `GET  /api/white-screens`     — 白屏记录列表
- `GET  /api/white-screens/:id` — 单条详情

```sql
CREATE TABLE `white_screens` (
  `id`              INT          NOT NULL AUTO_INCREMENT COMMENT '主键',
  `page_url`        VARCHAR(500)                         COMMENT '发生白屏的页面 URL',
  `time`            BIGINT                               COMMENT '时间戳（毫秒）',
  `apikey`          VARCHAR(64)                          COMMENT '项目 apikey',
  `monitor_user_id` VARCHAR(100)                         COMMENT '被监控应用的用户 ID',
  `sdk_version`     VARCHAR(20)                          COMMENT 'SDK 版本',
  `device_info`     JSON                                 COMMENT '设备信息',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apikey`     (`apikey`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='白屏检测数据表';
```

---

## 完整建表 SQL（一次性执行）

```sql
-- ============================================================
-- web_see 数据库全量建表脚本
-- MySQL 8.0+，utf8mb4，按外键依赖顺序执行
-- ============================================================

CREATE DATABASE IF NOT EXISTS `web_see_dev`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `web_see_dev`;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50)  NOT NULL,
  `email`      VARCHAR(100) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `role`       ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- 2. 项目表
CREATE TABLE IF NOT EXISTS `projects` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `apikey`      VARCHAR(64)  NOT NULL,
  `description` VARCHAR(255),
  `owner_id`    INT          NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_apikey` (`apikey`),
  KEY `idx_owner_id` (`owner_id`),
  CONSTRAINT `fk_projects_owner`
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='监控项目表';

-- 3. 错误上报表
CREATE TABLE IF NOT EXISTS `error_reports` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `type`             VARCHAR(50)  NOT NULL,
  `sub_type`         VARCHAR(50),
  `message`          TEXT,
  `page_url`         VARCHAR(500),
  `time`             BIGINT,
  `apikey`           VARCHAR(64)  NOT NULL,
  `monitor_user_id`  VARCHAR(100),
  `sdk_version`      VARCHAR(20),
  `device_info`      JSON,
  `record_screen_id` VARCHAR(64),
  `stack`            TEXT,
  `filename`         VARCHAR(500),
  `line_no`          INT,
  `col_no`           INT,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apikey`           (`apikey`),
  KEY `idx_type`             (`type`),
  KEY `idx_record_screen_id` (`record_screen_id`),
  KEY `idx_created_at`       (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='错误上报数据表';

-- 4. 用户行为轨迹表
CREATE TABLE IF NOT EXISTS `breadcrumbs` (
  `id`              INT      NOT NULL AUTO_INCREMENT,
  `error_report_id` INT      NOT NULL,
  `category`        VARCHAR(50),
  `data`            JSON,
  `status`          VARCHAR(20),
  `time`            BIGINT,
  `message`         TEXT,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_error_report_id` (`error_report_id`),
  CONSTRAINT `fk_breadcrumbs_error`
    FOREIGN KEY (`error_report_id`) REFERENCES `error_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行为轨迹表';

-- 5. 性能数据表
CREATE TABLE IF NOT EXISTS `performance_reports` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `page_url`        VARCHAR(500),
  `time`            BIGINT,
  `apikey`          VARCHAR(64)  NOT NULL,
  `monitor_user_id` VARCHAR(100),
  `sdk_version`     VARCHAR(20),
  `device_info`     JSON,
  `fp`              DECIMAL(10,2),
  `fcp`             DECIMAL(10,2),
  `lcp`             DECIMAL(10,2),
  `fid`             DECIMAL(10,2),
  `cls`             DECIMAL(10,4),
  `ttfb`            DECIMAL(10,2),
  `dns`             DECIMAL(10,2),
  `tcp`             DECIMAL(10,2),
  `ssl`             DECIMAL(10,2),
  `load_time`       DECIMAL(10,2),
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apikey`     (`apikey`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='性能数据上报表';

-- 6. 录屏数据表
CREATE TABLE IF NOT EXISTS `record_screens` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `record_screen_id` VARCHAR(64)  NOT NULL,
  `events`           LONGTEXT     NOT NULL,
  `apikey`           VARCHAR(64),
  `monitor_user_id`  VARCHAR(100),
  `page_url`         VARCHAR(500),
  `time`             BIGINT,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_screen_id` (`record_screen_id`),
  KEY `idx_apikey` (`apikey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录屏数据表';

-- 7. 白屏检测表
CREATE TABLE IF NOT EXISTS `white_screens` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `page_url`        VARCHAR(500),
  `time`            BIGINT,
  `apikey`          VARCHAR(64),
  `monitor_user_id` VARCHAR(100),
  `sdk_version`     VARCHAR(20),
  `device_info`     JSON,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apikey`     (`apikey`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='白屏检测数据表';
```

---

## 接口 ↔ 数据表 完整对照

| 接口路径 | HTTP方法 | 操作表 | 鉴权 | 说明 |
|---------|---------|-------|------|------|
| `/reportData` | POST | error_reports / breadcrumbs / performance_reports / record_screens / white_screens | 无 | SDK 上报路由分发 |
| `/getErrorList` | GET | error_reports + breadcrumbs | 无 | 兼容旧接口 |
| `/getRecordScreenId` | GET | record_screens | 无 | 兼容旧接口，播放录屏 |
| `/getmap` | GET | 文件系统（dist/js/*.map） | 无 | 源码还原 |
| `/api/auth/register` | POST | users | 无 | 注册 |
| `/api/auth/login` | POST | users | 无（密码鉴权） | 登录，返回 JWT |
| `/api/auth/profile` | GET | users | JWT | 当前用户信息 |
| `/api/users` | GET | users | JWT + Admin | 用户列表 |
| `/api/users/:id` | GET | users | JWT | 用户详情 |
| `/api/users/:id` | PATCH | users | JWT | 更新用户 |
| `/api/users/:id` | DELETE | users | JWT + Admin | 删除用户 |
| `/api/projects` | POST | projects | JWT | 创建项目 |
| `/api/projects` | GET | projects + users | JWT | 项目列表 |
| `/api/projects/:id` | GET | projects | JWT | 项目详情 |
| `/api/projects/:id` | PATCH | projects | JWT | 更新项目 |
| `/api/projects/:id` | DELETE | projects | JWT | 删除项目 |
| `/api/projects/:id/regenerate-apikey` | POST | projects | JWT | 重新生成 apikey |
| `/api/errors` | GET | error_reports + breadcrumbs | JWT | 错误列表（分页+过滤）|
| `/api/errors/:id` | GET | error_reports + breadcrumbs | JWT | 错误详情 |
| `/api/performance` | GET | performance_reports | JWT | 性能数据列表 |
| `/api/performance/:id` | GET | performance_reports | JWT | 性能详情 |
| `/api/performance/avg/:apikey` | GET | performance_reports | JWT | 聚合平均值 |
| `/api/record-screens` | GET | record_screens | JWT | 录屏列表（不含 events）|
| `/api/record-screens/:id` | GET | record_screens | JWT | 录屏详情（含 events）|
| `/api/white-screens` | GET | white_screens | JWT | 白屏记录列表 |
| `/api/white-screens/:id` | GET | white_screens | JWT | 白屏详情 |
