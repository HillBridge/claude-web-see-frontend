# Web-See 前端监控平台

基于 [@websee](https://github.com/xy-sea/web-see) SDK 构建的前端监控平台演示项目，提供错误采集、性能监控、录屏回放、白屏检测等能力的可视化管理界面。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 2 + Vue Router 3 + Vuex 3 |
| UI 组件库 | Element UI 2 |
| 图表 | ECharts 5 |
| HTTP 请求 | Axios |
| 监控 SDK | @websee/core · @websee/performance · @websee/recordscreen |
| 录屏回放 | rrweb-player |
| 源码还原 | source-map-js |
| 构建工具 | Vue CLI 5 |

## 功能模块

- **报错统计** — 展示 JS 运行时错误、Promise 未捕获异常、资源加载失败、XHR/Fetch 请求报错，支持分页与错误详情查看，可关联录屏回放
- **性能监控** — 展示 Web Vitals（FP / FCP / LCP / FID / CLS / TTFB）及 DNS、TCP、SSL、页面加载总耗时，支持 ECharts 趋势图
- **错误测试** — 手动触发各类前端错误，用于验证 SDK 采集效果
- **项目管理** — 创建/管理监控项目，生成并维护项目 apikey
- **用户认证** — JWT 登录/注册，路由守卫保护受限页面

## 目录结构

```
web-see-demo/
├── public/                 # 静态资源
├── src/
│   ├── api/
│   │   └── projects.js     # 项目管理相关接口
│   ├── router/
│   │   └── index.js        # 路由配置及登录守卫
│   ├── store/
│   │   └── index.js        # Vuex 状态管理
│   ├── utils/
│   │   ├── request.js      # Axios 封装（含 token 注入）
│   │   ├── recordScreen.js # 录屏回放工具
│   │   └── sourcemap.js    # Source map 解析工具
│   ├── views/
│   │   ├── LoginView.vue       # 登录页
│   │   ├── RegisterView.vue    # 注册页
│   │   ├── HomeView.vue        # 控制台首页
│   │   ├── ErrorsView.vue      # 报错统计
│   │   ├── PerformanceView.vue # 性能监控
│   │   ├── ProjectsView.vue    # 项目管理
│   │   ├── TestView.vue        # 错误测试
│   │   └── AboutView.vue       # 关于页
│   ├── App.vue
│   └── main.js             # SDK 初始化入口
├── scripts/
│   └── upload-sourcemaps.js  # Source map 上传脚本
├── .env                    # 环境变量配置
├── vue.config.js           # Vue CLI 配置（代理 + Perfsee）
└── table-design.md         # 数据库表结构设计文档
```

## 快速开始

**安装依赖**

```bash
npm install
# 或
pnpm install
```

**配置环境变量**

复制 `.env` 并按实际情况修改：

```env
BACKEND_URL=http://localhost:8083
SOURCEMAP_UPLOAD_SECRET=<与后端保持一致>
UPLOAD_APIKEY=<项目 apikey>
```

**启动开发服务器**

```bash
npm run serve
```

前端默认运行在 `http://localhost:8080`，开发服务器已配置代理将 `/getErrorList`、`/getmap` 转发至后端（`http://localhost:8083`）。

**构建生产包**

```bash
# 仅构建
npm run build

# 构建并上传 source map
npm run build:prod
```

**手动上传 source map**

```bash
npm run upload:sourcemaps
```

脚本读取 `dist/js/*.map` 并通过 `POST /api/uploadmap` 上传至后端，需确保 `.env` 中 `SOURCEMAP_UPLOAD_SECRET` 与后端一致。

## SDK 配置说明

SDK 在 [src/main.js](src/main.js) 中初始化，关键配置项：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `dsn` | `http://localhost:8083/reportData` | 数据上报地址 |
| `apikey` | — | 项目唯一标识，需与后端项目对应 |
| `silentWhiteScreen` | `true` | 开启白屏检测 |
| `skeletonProject` | `true` | 项目含骨架屏时需设为 true |
| `repeatCodeError` | `true` | 相同错误去重上报 |
| `recordScreentime` | `20` (秒) | 录屏缓存时长 |

## 数据库

详细的表结构设计（MySQL 8.0+）及完整建表 SQL 见 [table-design.md](table-design.md)，涵盖以下 7 张表：

- `users` — 系统用户
- `projects` — 监控项目
- `error_reports` — 错误上报数据
- `breadcrumbs` — 用户行为轨迹
- `performance_reports` — 性能指标数据
- `record_screens` — 录屏数据（rrweb 事件流）
- `white_screens` — 白屏检测记录

## 相关仓库

- 前端监控 SDK：[@websee/core](https://github.com/xy-sea/web-see)
- 后端服务：配套 Node.js/Express 服务，提供 `/reportData`、`/api/*` 等接口
