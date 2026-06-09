<template>
  <div class="test-view">
    <h2 class="page-title">错误触发测试</h2>
    <div class="btn-group">
      <el-button type="primary" @click="codeErr">js错误</el-button>
      <el-button type="success" @click="asyncError">异步错误</el-button>
      <el-button type="danger" @click="promiseErr">promise错误</el-button>
      <el-button type="info" @click="xhrError">xhr请求报错</el-button>
      <el-button type="warning" @click="fetchError">fetch请求报错</el-button>
      <el-button type="danger" @click="resourceError">加载资源报错</el-button>
      <el-button type="info" @click="postError">POST请求报错</el-button>
      <el-button type="warning" @click="patchError">PATCH请求报错</el-button>
      <el-button type="danger" @click="deleteError">DELETE请求报错</el-button>
    </div>
    <p class="tip">触发错误后，前往 <router-link to="/errors">报错统计</router-link> 页面查看结果。</p>
  </div>
</template>

<script>
export default {
  name: 'TestView',
  methods: {
    fetchError() {
      fetch('https://jsonplaceholder.typicode.com/posts/a').catch(() => { });
    },
    asyncError() {
      setTimeout(() => {
        JSON.parse('');
      });
    },
    codeErr() {
      let a = undefined;
      if (a.length) {
        console.log('1');
      }
    },
    resourceError() {
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://abc.com/index.js';
      document.body.appendChild(script);
    },
    promiseErr() {
      new Promise((resolve) => {
        let person = {};
        person.name.age();
        resolve();
      });
    },
    xhrError() {
      let ajax = new XMLHttpRequest();
      ajax.open('GET', 'https://abc.com/test/api');
      ajax.setRequestHeader('content-type', 'application/json');
      ajax.send();
    },
    // 以下三个用于演示 POST / PATCH / DELETE 的网络请求错误收集。
    // 目标 https://api.github.com/<未知路径> 对所有方法稳定返回 404 且带 JSON 响应体、支持 CORS,
    // 因此能被 web-see 的 httpTransform 判为请求失败(Status>=400)并上报,
    // 同时保留请求参数(requestData)与响应体(response), 在「报错统计」的「请求详情」中可见。
    postError() {
      fetch('https://tapi-dev.transfersmile.com/api/v1/login/google_code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "username": "abai@qq.com",
          "password": "12121212",
          "code": "333333"
        })
      }).catch(() => { });
    },
    patchError() {
      let ajax = new XMLHttpRequest();
      ajax.open('PATCH', 'https://api.github.com/web-see/patch-error');
      ajax.setRequestHeader('content-type', 'application/json');
      ajax.send(JSON.stringify({ action: 'update', id: 1, name: 'web-see-demo' }));
    },
    deleteError() {
      fetch('https://api.github.com/web-see/delete-error', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: 1 })
      }).catch(() => { });
    }
  }
};
</script>

<style lang="less">
.test-view {
  padding: 20px 0;

  .page-title {
    text-align: left;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 700;
  }

  .btn-group {
    text-align: left;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tip {
    margin-top: 20px;
    text-align: left;
    color: #888;
    font-size: 14px;

    a {
      color: #42b983;
      font-weight: bold;
    }
  }
}
</style>
