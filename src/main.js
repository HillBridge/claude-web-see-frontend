import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import * as echarts from "echarts";

import webSee from "@websee/core";
import performance from "@websee/performance";
import recordscreen from "@websee/recordscreen";

Vue.use(webSee, {
  dsn: `${process.env.VUE_APP_BACKEND_URL}/reportData`,
  apikey: "bbd026ecf55e4511b00a901634bcb67b",
  silentWhiteScreen: true, // 开启白屏检测
  skeletonProject: true, // 项目有骨架屏
  repeatCodeError: true, // 开启错误上报去重
  silentXhr: true, // 监听xhr请求报错
  silentFetch: true, // 监听fetch请求报错
  beforeDataReport(data) {
    const userId = localStorage.getItem("auth-user-id");
    if (userId) data.userId = userId;
    return Promise.resolve(data);
  },
  handleHttpStatus(data) {
    // 这里只需要关注http 200成功但是业务 response失败的情况(code !== 200 && code !== 401)
    let { response } = data;

    // response 可能是字符串(fetch)或对象(xhr)，解析失败按无响应处理
    let parsed;
    try {
      parsed = typeof response === "string" ? JSON.parse(response) : response;
    } catch (e) {
      parsed = null;
    }
    // 拿不到带 code 的 JSON 响应（空响应/二进制/非标准接口）时不视为错误，避免误报
    if (!parsed || typeof parsed.code === "undefined") {
      return true;
    }
    // 401 为未登录/Token 过期，已由 request.js 拦截器统一跳登录处理，不计入监控错误
    if (parsed.code === 401) {
      return true;
    }
    // 业务约定：code===200 接口正常，其余一律上报
    return parsed.code === 200;
  },
});
webSee.use(performance); // 安装性能插件
webSee.use(recordscreen, { recordScreentime: 20 }); // 安装录屏插件

Vue.prototype.$echarts = echarts;
Vue.use(ElementUI, { size: "mini" });
Vue.config.productionTip = false;

setTimeout(() => {
  new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount("#app");
}, 1000);
