const { defineConfig } = require('@vue/cli-service');
const { PerfseePlugin } = require('@perfsee/webpack')

const BACKEND_URL = process.env.VUE_APP_BACKEND_URL;
// Perfsee token 从环境变量读取,不再硬编码进仓库;未配置则不启用插件
const PERFSEE_TOKEN = process.env.PERFSEE_TOKEN;

module.exports = defineConfig({
  // 生产构建生成 sourcemap 供上传后端做源码还原。
  // 配合下方 chainWebpack 改用 hidden-source-map:不在 JS 中注入 //# sourceMappingURL= 注释,
  // 浏览器不会自动拉取;且 scripts/upload-sourcemaps.js 上传后会从 dist 删除 .map,
  // 因此不会随静态站公开泄露源码。
  productionSourceMap: true,
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      config.devtool('hidden-source-map');
    } else {
      // dev 改用 source-map 生成独立 .map(dev-server 以 /js/xxx.js.map 提供),
      // 配合 sourcemap.js 的 dev 分支可在本地直接"查看源码",无需上传后端
      config.devtool('source-map');
    }
  },
  devServer: {
    proxy: {
      '/getErrorList': {
        target: BACKEND_URL,
        changeOrigin: false, //  target是域名的话，需要这个参数，
        secure: false //  设置支持https协议的代理,
      },
      '/getmap': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false
      },
      '/getmgetRecordScreenIdp': {
        target: BACKEND_URL,
        changeOrigin: false,
        secure: false
      }
    }
  },
  configureWebpack: {
    plugins: [
      ...(PERFSEE_TOKEN
        ? [
            new PerfseePlugin({
              project: 'web-see-demo',
              token: PERFSEE_TOKEN,
              artifactName: 'main'
            })
          ]
        : [])
    ]
  }
})
