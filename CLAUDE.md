# CLAUDE.md

本文件为 Claude Code 在本仓库工作的行为约定。**开始任何任务前请先完整阅读。**

项目：Web-See 前端监控平台（演示项目）。Vue 2 + Vue CLI 5 的纯前端 SPA，配套一个独立的 Node 后端（**不在本仓库内**）。

---

## 一、红线规则（禁止/谨慎改动）

以下是核心基础设施，被多处依赖，改动影响面大。**未经我明确确认，禁止改动：**

| 文件 | 原因 |
|------|------|
| [src/main.js](src/main.js) | @websee 监控 SDK 初始化入口。`dsn`/`apikey`/`beforeDataReport`/`handleHttpStatus` 直接决定监控行为；末尾 `setTimeout(1000)` 才挂载 app 的逻辑是有意为之，不要随手删。 |
| [src/utils/request.js](src/utils/request.js) | 全局 Axios 实例，所有 API 都基于它（token 注入、响应只返回 `response.data`）。改动影响所有网络请求。 |
| [src/router/index.js](src/router/index.js) | 路由表 + `beforeEach` 登录守卫（基于 localStorage `auth-token` + `meta.public`）。 |
| [src/utils/sourcemap.js](src/utils/sourcemap.js) | 源码还原核心逻辑，**含已做过的 XSS 转义（`escapeHtml`）**。改动必须保留全部安全处理。 |
| [src/utils/recordScreen.js](src/utils/recordScreen.js) | 录屏解压逻辑，含防内存溢出分片处理，与 rrweb 数据格式强耦合。 |

**严禁触碰的目录/文件：**

- `.env` / `.env.local` — 含 `SOURCEMAP_UPLOAD_SECRET`、apikey、Perfsee token 等敏感信息。**禁止读出明文、禁止提交、禁止改动。**
- `dist/` — 构建产物，不手改。
- `node_modules/`、`package-lock.json`、`pnpm-lock.yaml` — 不手改；依赖变更走包管理器并先与我确认。
- `scripts/upload-sourcemaps.js`、`server.js`、`vue.config.js` — 构建/部署链路，改动前必须说明并确认。

**关键约定（改动相关代码时必须遵守）：**

- 后端即使业务异常也返回 **HTTP 200**，成功与否靠业务字段 **`code === 200`** 判断（见 [src/views/ErrorsView.vue](src/views/ErrorsView.vue) `handleDelete`、main.js `handleHttpStatus`）。不要假设非 2xx 才是错误。
- 认证状态统一存 localStorage：`auth-token`、`auth-user-id`。

---

## 二、架构说明（真实结构）

```
src/
├── main.js              # 入口 + @websee SDK 初始化（核心）
├── App.vue              # 根组件：顶部导航 + 退出登录 + 全局样式
├── api/                 # 接口层（按业务拆分，导出 xxxApi 对象）
│   ├── projects.js      #   项目 CRUD + 重置 apikey
│   └── errors.js        #   错误分组删除
├── utils/               # 基础设施/工具层
│   ├── request.js       #   Axios 封装（token 注入 + 响应拦截）
│   ├── recordScreen.js  #   录屏解压（pako/base64）
│   └── sourcemap.js     #   sourcemap 源码还原（含 XSS 转义）
├── router/index.js      # 路由表 + 登录守卫
├── store/index.js       # Vuex（当前为空壳，未使用）
└── views/               # 页面（每个路由一个）
    ├── LoginView / RegisterView   # 认证
    ├── HomeView                   # 控制台首页（卡片导航）
    ├── ErrorsView (~441行)        # 报错统计（最复杂页面）
    ├── PerformanceView            # 性能监控（当前为 echarts 示例占位）
    ├── ProjectsView (~296行)      # 项目管理
    ├── TestView                   # 手动触发错误测试 SDK
    └── AboutView                  # 关于页（几乎为空）

scripts/upload-sourcemaps.js  # 构建后上传 sourcemap 到后端
server.js                     # 生产环境 Express 静态托管 dist/
vue.config.js                 # dev 代理 + Perfsee 插件
table-design.md               # 后端数据库表设计文档（参考）
```

**分层与数据流：** `views/*.vue` → `api/*.js`（业务 RESTful 接口 `/api/*`）或直接用 `request`（SDK 老接口 `/getErrorList`、`/getmap`、`/getRecordScreenId`，dev 环境靠 vue.config.js 代理转发）→ `utils/request.js`（统一 Axios 实例）。

**全局注入：** `Vue.prototype.$echarts`（ECharts）；Element UI 的 `$message` / `$confirm` 全局可用。
**环境变量：** `VUE_APP_BACKEND_URL`、`VUE_APP_APIKEY`。

**技术栈：** Vue 2.6 + Vue Router 3 + Vuex 3 + Element UI 2.15（全局 `size: mini`）+ ECharts 5 + Axios + @websee SDK + rrweb-player。构建：Vue CLI 5 / webpack / Babel。

> 注意：`package.json` 中 `web-see`、`raven-js`、`web-vitals`、`ua-parser-js` 等依赖在 src 中未实际 import，属历史遗留——不要因为它们存在就引入使用，需要时先与我确认。

---

## 三、执行前 / 中 / 后的行为规范

### 执行前必须
1. **列出受影响的文件**（路径清单）。
2. **说明实现方案**：改什么、为什么、是否触及上面的红线文件/约定。
3. **等我确认后再动手。** 涉及红线文件或第一节"关键约定"的，必须显式指出并获得确认。

### 执行中必须
1. **小步推进、阶段性暂停**，便于我审阅。
2. **遇到分叉点让我决策**（例如多种实现方式、可能改变现有行为、需要新增依赖），不擅自替我选。
3. **不顺手改无关代码**：不做未要求的重构、改名、格式化、删"无用"依赖。只改任务范围内的内容。
4. 保持现有代码风格（见第四节），不引入与项目不一致的写法。

### 执行后必须
1. **补测试**（见第五节——当前无测试框架，按约定处理）。
2. **列出改动清单**：逐文件说明改了什么。
3. **说明副作用与风险**：是否影响其他页面/全局行为、是否改变了网络请求或认证逻辑、是否需要重新构建或上传 sourcemap。
4. 若运行了 lint/构建，**如实报告结果**（含失败输出）；跳过的步骤要说明。

---

## 四、编码规范（基于现有风格提炼）

- **ESLint**：`plugin:vue/essential` + `eslint:recommended`，parser 为 `@babel/eslint-parser`。提交前可运行 `npm run lint`。
- **组件写法**：统一 Vue 2 **Options API**（`data` / `created` / `mounted` / `methods`），每个组件带 `name` 字段。不要引入 Composition API / `<script setup>`（与 Vue 2.6 + 现有风格不符）。
- **缩进**：2 空格。
- **引号**：项目现状不统一（`main.js`/`sourcemap.js` 用双引号，其余多为单引号）。**改某文件时跟随该文件已有风格**，不要全局统一。
- **命名约定**：
  - 事件处理：`handleXxx`（如 `handleDelete`、`handleSearch`、`handlePageChange`）。
  - 数据加载：`getTableData`、弹窗：`openCreate` / `openEdit`。
  - API 层：`export const xxxApi = { list, create, update, remove, ... }`，每个方法返回 `request.xxx()` 的 Promise。
- **请求约定**：业务接口走 `/api/*`（RESTful）；SDK 老接口走根路径并依赖 dev 代理。新增业务接口优先放进 `src/api/` 对应模块，不在组件里散落裸 URL（ErrorsView 中的 `/getErrorList` 等是历史遗留）。
- **错误处理**：遵循"HTTP 200 + 业务 `code === 200`"约定；用户提示统一用 Element UI 的 `$message` / `$confirm`。
- **样式**：现状 less 与 scss 混用（App.vue 用 scss，views 多用 less）。**跟随所改文件已有的 `lang`**，不要替换。复用全局样式（`.page-title`、`.page-content`、`.el-table` 等定义在 App.vue）。
- **注释**：保留并延续中文注释风格，尤其是解释"为什么"的注释（防溢出、防 XSS、避免空页等），不要删。

---

## 五、测试规范

**现状：本项目当前没有单元/集成测试框架。** `package.json` 的 `test` 脚本是 `concurrently "npm run serve" "npm run start"`（同时起前端与静态服务），不是真正的测试。没有 Jest / Vitest / Vue Test Utils 等依赖。

因此"执行后补测试"按以下方式落实：

1. **不擅自引入测试框架。** 如果某项改动确实需要自动化测试，先向我说明建议的方案（如 Vitest + @vue/test-utils）和涉及的依赖/配置改动，**经我确认后再加**。
2. **默认以手动验证替代单测**，并在交付时明确写出验证步骤，例如：
   - `npm run lint` 通过；
   - `npm run serve` 起本地、走到相关页面，描述应观察到的预期行为（如：删除后列表刷新、最后一条删除时回退一页、`code !== 200` 时弹错误提示）；
   - 必要时 `npm run build` 验证可构建。
3. **改动涉及 sourcemap / 录屏解压 / SDK 上报**等核心逻辑时，说明如何在 [src/views/TestView.vue](src/views/TestView.vue) 触发错误来端到端验证。
4. 如实报告每一步验证结果；无法验证的部分要明确指出，不要默认"应该没问题"。
