<template>
  <div class="performance-view">
    <h2 class="page-title">性能监控</h2>

    <el-form :inline="true" class="filter-form">
      <el-form-item label="项目">
        <el-select
          v-model="selectedApikey"
          placeholder="请选择项目"
          style="width: 220px"
          @change="loadAvg"
        >
          <el-option
            v-for="p in projects"
            :key="p.apikey"
            :label="p.name"
            :value="p.apikey"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="!selectedApikey" @click="loadAvg">刷新</el-button>
      </el-form-item>
    </el-form>

    <div v-loading="loading">
      <template v-if="hasData">
        <el-row :gutter="16" class="stat-cards">
          <el-col v-for="m in msMetrics" :key="m.key" :span="4">
            <div class="stat-card">
              <p class="stat-label">{{ m.label }}</p>
              <p class="stat-value">
                {{ metricAvg(m.key) === null ? '—' : metricAvg(m.key).toFixed(0) }}
                <span class="stat-unit" v-if="metricAvg(m.key) !== null">ms</span>
              </p>
              <p class="stat-sub">样本 {{ metricCount(m.key) }}</p>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card">
              <p class="stat-label">CLS 布局偏移</p>
              <p class="stat-value">{{ metricAvg('CLS') === null ? '—' : metricAvg('CLS').toFixed(3) }}</p>
              <p class="stat-sub">样本 {{ metricCount('CLS') }}</p>
            </div>
          </el-col>
        </el-row>

        <div ref="chart" class="chart" style="width: 100%; height: 360px"></div>
        <p class="total-tip">总样本数：{{ avgData.total }}</p>
      </template>

      <el-empty v-else-if="selectedApikey" description="该项目暂无性能数据"></el-empty>
      <el-empty v-else description="请选择一个项目查看性能指标"></el-empty>
    </div>
  </div>
</template>

<script>
import { projectsApi } from '../api/projects';
import { performanceApi } from '../api/performance';

// 时延类指标(ms)；CLS 为无量纲小数,单独展示
const MS_METRICS = [
  { key: 'FCP', label: 'FCP 首次内容绘制' },
  { key: 'LCP', label: 'LCP 最大内容绘制' },
  { key: 'FID', label: 'FID 首次输入延迟' },
  { key: 'TTFB', label: 'TTFB 首字节' },
  { key: 'FSP', label: 'FSP 首屏渲染' }
];

export default {
  name: 'PerformanceView',
  data() {
    return {
      projects: [],
      selectedApikey: '',
      avgData: null,
      loading: false,
      chart: null,
      msMetrics: MS_METRICS
    };
  },
  computed: {
    hasData() {
      return this.avgData && this.avgData.avg && Object.keys(this.avgData.avg).length > 0;
    }
  },
  created() {
    this.loadProjects();
  },
  beforeDestroy() {
    if (this.chart) this.chart.dispose();
  },
  methods: {
    loadProjects() {
      projectsApi.list({ page: 1, pageSize: 100 }).then((res) => {
        if (res.code === 200) {
          this.projects = res.data.list || [];
          if (this.projects.length) {
            this.selectedApikey = this.projects[0].apikey;
            this.loadAvg();
          }
        }
      });
    },
    loadAvg() {
      if (!this.selectedApikey) return;
      this.loading = true;
      performanceApi
        .getAvg(this.selectedApikey)
        .then((res) => {
          if (res.code === 200) {
            this.avgData = res.data;
            this.$nextTick(this.renderChart);
          } else {
            this.avgData = null;
            this.$message.error(res.message || '查询失败');
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    metricAvg(key) {
      const m = this.avgData && this.avgData.avg && this.avgData.avg[key];
      return m && m.avg != null ? Number(m.avg) : null;
    },
    metricCount(key) {
      const m = this.avgData && this.avgData.avg && this.avgData.avg[key];
      return m ? m.count : 0;
    },
    renderChart() {
      if (!this.$refs.chart) return;
      if (!this.chart) this.chart = this.$echarts.init(this.$refs.chart);
      const labels = MS_METRICS.map((m) => m.key);
      const values = MS_METRICS.map((m) => {
        const v = this.metricAvg(m.key);
        return v === null ? null : Math.round(v);
      });
      this.chart.setOption({
        title: { text: 'Web Vitals 平均耗时 (ms)', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis' },
        grid: { top: 50, left: 50, right: 20, bottom: 30 },
        xAxis: { type: 'category', data: labels },
        yAxis: { type: 'value', name: 'ms' },
        series: [
          {
            type: 'bar',
            data: values,
            barWidth: '45%',
            itemStyle: { color: '#409eff' },
            label: { show: true, position: 'top', formatter: (p) => (p.value == null ? '无数据' : p.value) }
          }
        ]
      });
      this.chart.resize();
    }
  }
};
</script>

<style lang="less">
.performance-view {
  padding: 20px 0;

  .page-title {
    text-align: left;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 700;
  }

  .filter-form {
    text-align: left;
  }

  .stat-cards {
    margin-bottom: 16px;

    .stat-card {
      background: #f7f9fc;
      border-radius: 6px;
      padding: 14px 12px;
      text-align: left;
    }

    .stat-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #303133;
    }

    .stat-unit {
      font-size: 12px;
      font-weight: 400;
      color: #909399;
      margin-left: 2px;
    }

    .stat-sub {
      font-size: 12px;
      color: #c0c4cc;
      margin-top: 4px;
    }
  }

  .total-tip {
    text-align: right;
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
  }
}
</style>
