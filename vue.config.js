const { defineConfig } = require('@vue/cli-service');
const { PerfseePlugin } = require('@perfsee/webpack')

const BACKEND_URL = process.env.VUE_APP_BACKEND_URL;
// Perfsee token 从环境变量读取,不再硬编码进仓库;未配置则不启用插件
const PERFSEE_TOKEN = process.env.PERFSEE_TOKEN;

module.exports = defineConfig({
  // 不在生产包中输出 sourcemap(避免原始源码随静态站公开泄露)
  productionSourceMap: false,
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
