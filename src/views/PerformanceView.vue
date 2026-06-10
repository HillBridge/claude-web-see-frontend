<template>
  <div class="performance-view">
    <h2 class="page-title">性能监控</h2>

    <el-form :inline="true" class="filter-form">
      <el-form-item label="项目">
        <el-select v-model="selectedApikey" placeholder="请选择项目" style="width: 200px" @change="onProjectChange">
          <el-option v-for="p in projects" :key="p.apikey" :label="p.name" :value="p.apikey"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="页面">
        <el-select v-model="selectedPage" style="width: 280px" @change="loadSummary">
          <el-option label="全部页面" value=""></el-option>
          <el-option v-for="pg in pages" :key="pg.page" :label="`${pg.page} (${pg.count})`" :value="pg.page"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="!selectedApikey" @click="reload">刷新</el-button>
      </el-form-item>
    </el-form>

    <div v-loading="loading">
      <template v-if="hasData">
        <!-- 核心三件套: 只看 p75 + 颜色评级 -->
        <el-row :gutter="16" class="stat-cards">
          <el-col v-for="m in coreMetrics" :key="m.key" :span="8">
            <div class="stat-card">
              <p class="stat-label">{{ m.label }}</p>
              <p class="stat-value" :style="{ color: p75Color(m.key) }">
                {{ fmtP75(m.key) }}<span class="stat-unit" v-if="metric(m.key).p75 !== null && m.unit">{{ m.unit }}</span>
              </p>
            </div>
          </el-col>
        </el-row>

        <div class="sample-line">
          <span>基于最近 <b>{{ totalSamples }}</b> 次采样</span>
          <el-tag
            :type="confidence.type"
            :effect="confidence.vivid ? 'dark' : 'plain'"
            size="small"
            :class="{ 'conf-vivid': confidence.vivid }"
          >{{ confidence.label }}</el-tag>
          <span class="legend">
            · p75 颜色：<span style="color:#67c23a">良好</span> /
            <span style="color:#e6a23c">待改进</span> /
            <span style="color:#f56c6c">差</span>（CWV 阈值）
          </span>
        </div>

        <!-- 可信度图例: 四档,高亮当前所处档位 -->
        <div class="conf-legend">
          <span class="legend-title">可信度图例：</span>
          <el-tag
            v-for="(t, i) in confTiers"
            :key="t.range"
            :type="t.type"
            :effect="t.vivid ? 'dark' : 'plain'"
            size="mini"
            :class="{ 'conf-vivid': t.vivid, 'tier-active': i === activeTierIndex }"
          >{{ t.range }} {{ t.label }}</el-tag>
          <span class="legend-note">（样本量越多，p75 越可信）</span>
        </div>

        <!-- 诊断指标默认折叠 -->
        <div class="diag">
          <span class="diag-toggle" @click="showDiag = !showDiag">
            {{ showDiag ? '▾ 收起诊断' : '▸ 展开诊断 (FCP / TTFB)' }}
          </span>
          <el-row v-show="showDiag" :gutter="16" class="stat-cards diag-cards">
            <el-col v-for="m in diagMetrics" :key="m.key" :span="8">
              <div class="stat-card">
                <p class="stat-label">{{ m.label }}</p>
                <p class="stat-value" :style="{ color: p75Color(m.key) }">
                  {{ fmtP75(m.key) }}<span class="stat-unit" v-if="metric(m.key).p75 !== null && m.unit">{{ m.unit }}</span>
                </p>
              </div>
            </el-col>
          </el-row>
        </div>
      </template>

      <el-empty v-else-if="selectedApikey" description="该项目暂无性能数据"></el-empty>
      <el-empty v-else description="请选择一个项目查看性能指标"></el-empty>
    </div>
  </div>
</template>

<script>
import { projectsApi } from '../api/projects';
import { performanceApi } from '../api/performance';

// Core Web Vitals 阈值 [good 上界, poor 上界]；CLS 无量纲,其余 ms
const CORE_METRICS = [
  { key: 'LCP', label: 'LCP 最大内容绘制', unit: ' ms', good: 2500, poor: 4000 },
  { key: 'CLS', label: 'CLS 布局偏移', unit: '', good: 0.1, poor: 0.25 },
  { key: 'FID', label: 'FID 首次输入延迟', unit: ' ms', good: 100, poor: 300 }
];
const DIAG_METRICS = [
  { key: 'FCP', label: 'FCP 首次内容绘制', unit: ' ms', good: 1800, poor: 3000 },
  { key: 'TTFB', label: 'TTFB 首字节', unit: ' ms', good: 800, poor: 1800 }
];
const GREEN = '#67c23a';
const ORANGE = '#e6a23c';
const RED = '#f56c6c';

// 可信度四档(与说明表一致):区间 + 短标签 + 徽标样式
const CONF_TIERS = [
  { range: '<30', label: '暂不可参考', type: 'info', vivid: false },
  { range: '30–99', label: '方向性', type: 'warning', vivid: false },
  { range: '100–499', label: '可参考', type: 'success', vivid: true },
  { range: '≥500', label: '高可信', type: 'success', vivid: true }
];

export default {
  name: 'PerformanceView',
  data() {
    return {
      projects: [],
      selectedApikey: '',
      pages: [],
      selectedPage: '',
      summary: null,
      loading: false,
      showDiag: false,
      coreMetrics: CORE_METRICS,
      diagMetrics: DIAG_METRICS,
      confTiers: CONF_TIERS
    };
  },
  computed: {
    hasData() {
      return this.summary && this.summary.metrics && Object.keys(this.summary.metrics).length > 0;
    },
    // 各 Web Vital 约每次页面加载上报一次,取最大样本数近似"采样次数"
    totalSamples() {
      if (!this.hasData) return 0;
      return Math.max(0, ...Object.values(this.summary.metrics).map((m) => m.sampleCount || 0));
    },
    // 可信度分档(基于样本量): <30 暂不可参考 / 30-99 方向性 / >=100 可参考(鲜艳) / >=500 高可信
    confidence() {
      const n = this.totalSamples;
      if (n < 30) return { type: 'info', vivid: false, label: '样本不足，暂不可参考（建议 ≥100）' };
      if (n < 100) return { type: 'warning', vivid: false, label: '方向性参考（样本偏少）' };
      if (n < 500) return { type: 'success', vivid: true, label: '✓ 数据可参考（p75 稳定）' };
      return { type: 'success', vivid: true, label: '✓ 高可信（p75 / p95 稳定）' };
    },
    // 当前样本量落在图例的哪一档(用于高亮)
    activeTierIndex() {
      const n = this.totalSamples;
      if (n < 30) return 0;
      if (n < 100) return 1;
      if (n < 500) return 2;
      return 3;
    }
  },
  created() {
    this.loadProjects();
  },
  methods: {
    loadProjects() {
      projectsApi.list({ page: 1, pageSize: 100 }).then((res) => {
        if (res.code === 200) {
          this.projects = res.data.list || [];
          if (this.projects.length) {
            this.selectedApikey = this.projects[0].apikey;
            this.reload();
          }
        }
      });
    },
    onProjectChange() {
      this.selectedPage = '';
      this.reload();
    },
    reload() {
      if (!this.selectedApikey) return;
      this.loadPages();
      this.loadSummary();
    },
    loadPages() {
      performanceApi.getPages(this.selectedApikey).then((res) => {
        if (res.code === 200) this.pages = res.data || [];
      });
    },
    loadSummary() {
      if (!this.selectedApikey) return;
      this.loading = true;
      const params = this.selectedPage ? { pageUrl: this.selectedPage } : {};
      performanceApi
        .getSummary(this.selectedApikey, params)
        .then((res) => {
          this.summary = res.code === 200 ? res.data : null;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    metric(key) {
      return (this.summary && this.summary.metrics && this.summary.metrics[key]) || { p75: null, sampleCount: 0 };
    },
    fmtP75(key) {
      const v = this.metric(key).p75;
      if (v === null || v === undefined) return '—';
      return key === 'CLS' ? Number(v).toFixed(3) : String(Math.round(v));
    },
    p75Color(key) {
      const def = [...CORE_METRICS, ...DIAG_METRICS].find((m) => m.key === key);
      const v = this.metric(key).p75;
      if (v === null || v === undefined || !def) return '#303133';
      if (v <= def.good) return GREEN;
      if (v <= def.poor) return ORANGE;
      return RED;
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
    .stat-card {
      background: #f7f9fc;
      border-radius: 6px;
      padding: 18px 16px;
      text-align: left;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 30px;
      font-weight: 700;
    }

    .stat-unit {
      font-size: 13px;
      font-weight: 400;
      color: #909399;
    }
  }

  .sample-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    text-align: left;
    font-size: 12px;
    color: #909399;
    margin: 14px 0;

    b {
      color: #303133;
    }

    .legend {
      color: #909399;
    }

    // 样本足够时:鲜艳醒目的"可参考"徽标
    .conf-vivid {
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25);
    }
  }

  .conf-legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    text-align: left;
    margin: -4px 0 16px;

    .legend-title {
      font-size: 12px;
      color: #606266;
      font-weight: 600;
    }

    .legend-note {
      font-size: 12px;
      color: #c0c4cc;
    }

    .conf-vivid {
      font-weight: 700;
    }

    // 高亮当前所处档位
    .tier-active {
      outline: 2px solid #409eff;
      outline-offset: 1px;
      border-radius: 4px;
    }
  }

  .diag {
    text-align: left;

    .diag-toggle {
      font-size: 13px;
      color: #409eff;
      cursor: pointer;
      user-select: none;
    }

    .diag-cards {
      margin-top: 10px;
    }
  }
}
</style>
