<template>
  <div class="home-view">
    <h2 class="page-title">前端监控 · 控制台</h2>
    <el-row :gutter="20" class="cards">
      <el-col :span="8">
        <el-card shadow="hover" @click.native="$router.push('/errors')">
          <div class="card-content">
            <i class="el-icon-warning-outline card-icon error-icon"></i>
            <div>
              <p class="card-label">报错统计</p>
              <p class="card-desc">查看所有已上报的 JS 错误、Promise 异常等</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" @click.native="$router.push('/performance')">
          <div class="card-content">
            <i class="el-icon-data-line card-icon perf-icon"></i>
            <div>
              <p class="card-label">性能监控</p>
              <p class="card-desc">查看页面性能指标与图表</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" @click.native="$router.push('/test')">
          <div class="card-content">
            <i class="el-icon-magic-stick card-icon test-icon"></i>
            <div>
              <p class="card-label">错误测试</p>
              <p class="card-desc">手动触发各类前端错误以测试 SDK 采集</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
};
</script>

<style lang="less">
.home-view {
  padding: 20px 0;

  .page-title {
    text-align: left;
    margin-bottom: 24px;
    font-size: 22px;
    font-weight: 700;
  }

  .cards {
    .el-card {
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-4px);
      }
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
    }

    .card-icon {
      font-size: 36px;
    }

    .error-icon {
      color: #f56c6c;
    }

    .perf-icon {
      color: #409eff;
    }

    .test-icon {
      color: #67c23a;
    }

    .card-label {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .card-desc {
      font-size: 12px;
      color: #888;
    }
  }
}
</style>
