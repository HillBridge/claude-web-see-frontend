<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <img src="../assets/logo.png" alt="logo" class="login-logo" />
        <h2 class="login-title">注册账号</h2>
      </div>
      <el-form ref="registerForm" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="el-icon-user" :disabled="loading"></el-input>
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="form.email" placeholder="邮箱" prefix-icon="el-icon-message" :disabled="loading"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" prefix-icon="el-icon-lock" show-password :disabled="loading"></el-input>
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" placeholder="确认密码" prefix-icon="el-icon-lock" show-password :disabled="loading"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleRegister">注 册</el-button>
        </el-form-item>
      </el-form>
      <div class="form-footer">
        已有账号？<router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import request from '../utils/request';

export default {
  name: 'RegisterView',
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.form.password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    return {
      loading: false,
      form: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码不少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    handleRegister() {
      this.$refs.registerForm.validate((valid) => {
        if (!valid) return;
        this.loading = true;
        request
          .post('/api/auth/register', {
            username: this.form.username,
            email: this.form.email,
            password: this.form.password
          })
          .then((data) => {
            if (data.code === 200) {
              this.$message({ type: 'success', message: '注册成功，请登录', duration: 1500 });
              setTimeout(() => this.$router.push('/login'), 1000);
            } else {
              this.$message({ type: 'error', message: data.message || '注册失败，请稍后重试', duration: 3000 });
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
.form-footer {
  text-align: center;
  margin-top: 8px;
  font-size: 13px;
  color: #909399;

  a {
    color: #409eff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
