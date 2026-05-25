<template>
  <div id="app">
    <div v-if="$route.name !== 'login'" class="logoHeader">
      <img class="logo" src="./assets/logo.png" alt="logo" />
      <span class="title">前端监控</span>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/errors">报错统计</router-link>
        <router-link to="/performance">性能监控</router-link>
        <router-link to="/projects">项目管理</router-link>
        <router-link to="/test">错误测试</router-link>
      </nav>
      <el-button class="logout-btn" type="text" icon="el-icon-switch-button" @click="logout">退出</el-button>
    </div>
    <div :class="{ 'page-content': $route.name !== 'login' }">
      <router-view />
    </div>
  </div>
</template>

<script>
import request from './utils/request';

export default {
  methods: {
    logout() {
      this.$confirm('确认退出登录？', '提示', { type: 'warning' })
        .then(() => {
          request.post('/api/auth/logout').finally(() => {
            localStorage.removeItem('auth-token');
            this.$router.push('/login');
            this.$message({ type: 'success', message: '已退出登录' });
          });
        })
        .catch(() => {});
    }
  }
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.logoHeader {
  width: 100%;
  padding: 0 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  box-sizing: border-box;

  .logo {
    width: 70px;
    height: 42px;
    flex-shrink: 0;
  }

  .title {
    margin-left: 10px;
    font-weight: bold;
    font-size: 16px;
    flex-shrink: 0;
  }

  .logout-btn {
    margin-left: auto;
    color: #909399;

    &:hover {
      color: #f56c6c;
    }
  }

  nav {
    margin-left: 40px;
    display: flex;
    gap: 8px;

    a {
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: 500;
      color: #606266;
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s;

      &:hover {
        background-color: #f0f2f5;
        color: #409eff;
      }

      &.router-link-exact-active {
        background-color: #ecf5ff;
        color: #409eff;
      }
    }
  }
}

.page-content {
  padding: 0 20px;
}

* {
  margin: 0;
}
</style>
