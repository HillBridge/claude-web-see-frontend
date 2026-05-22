<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <img src="../assets/logo.png" alt="logo" class="login-logo" />
        <h2 class="login-title">前端监控平台</h2>
      </div>
      <el-form ref="loginForm" :model="form" :rules="rules" class="login-form" @submit.native.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="el-icon-user" :disabled="loading"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" prefix-icon="el-icon-lock" show-password
            :disabled="loading"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" native-type="submit" @click="handleLogin">登
            录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      loading: false,
      form: {
        username: 'admin',
        password: 'password123'
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    };
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (!valid) return;
        this.loading = true;
        fetch('http://localhost:8083/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.form.username, password: this.form.password })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.code === 200) {
              localStorage.setItem('auth-token', data.data?.token || 'logged_in');
              this.$message({ type: 'success', message: '登录成功，正在跳转…', duration: 1500 });
              setTimeout(() => {
                this.$router.push('/');
              }, 1000);
            } else {
              this.$message({ type: 'error', message: data.message || '用户名或密码错误', duration: 3000 });
            }
          })
          .catch(() => {
            this.$message({ type: 'error', message: '网络异常，请稍后重试', duration: 3000 });
          })
          .finally(() => {
            this.loading = false;
          });
      });
    }
  }
};
</script>

<style lang="less">
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1d2b64 0%, #f8cdda 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 380px;
  padding: 40px 40px 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);

  .login-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;

    .login-logo {
      width: 64px;
      height: auto;
      margin-bottom: 12px;
    }

    .login-title {
      font-size: 20px;
      font-weight: 700;
      color: #303133;
    }
  }

  .login-form {
    .el-input__inner {
      height: 42px;
    }

    .login-btn {
      width: 100%;
      height: 42px;
      font-size: 16px;
      letter-spacing: 4px;
      margin-top: 4px;
    }
  }
}
</style>
