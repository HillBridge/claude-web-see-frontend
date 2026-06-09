<template>
  <div class="logs-view">
    <h2 class="page-title">系统日志</h2>

    <el-form :inline="true" :model="filters" class="filter-form" @submit.native.prevent="handleSearch">
      <el-form-item label="级别">
        <el-select v-model="filters.level" placeholder="全部" clearable style="width: 120px">
          <el-option label="警告(warn)" value="warn"></el-option>
          <el-option label="错误(error)" value="error"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="来源">
        <el-input v-model="filters.context" placeholder="如 ReportController" clearable style="width: 180px"></el-input>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="filters.keyword" placeholder="消息内容模糊匹配" clearable style="width: 200px"></el-input>
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="filters.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="timestamp"
          style="width: 360px"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <el-table-column type="index" width="50"></el-table-column>
      <el-table-column prop="createdAt" label="时间" width="180">
        <template slot-scope="scope">
          <span>{{ formatTime(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="level" label="级别" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="levelTagType(scope.row.level)" size="small">{{ scope.row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="context" label="来源" width="180"></el-table-column>
      <el-table-column prop="message" label="日志内容" show-overflow-tooltip></el-table-column>
    </el-table>

    <el-pagination style="margin-top: 16px; text-align: right" background
      layout="total, sizes, prev, pager, next, jumper" :total="total" :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]" :current-page="currentPage" @current-change="handlePageChange"
      @size-change="handleSizeChange"></el-pagination>
  </div>
</template>

<script>
import { logsApi } from '../api/logs';

export default {
  name: 'LogsView',
  data() {
    return {
      tableData: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      loading: false,
      filters: {
        level: '',
        context: '',
        keyword: '',
        timeRange: null
      }
    };
  },
  created() {
    this.getTableData();
  },
  methods: {
    getTableData() {
      this.loading = true;
      const query = {
        page: this.currentPage,
        pageSize: this.pageSize
      };
      if (this.filters.level) query.level = this.filters.level;
      if (this.filters.context) query.context = this.filters.context;
      if (this.filters.keyword) query.keyword = this.filters.keyword;
      if (this.filters.timeRange) {
        // 后端 @IsDateString 校验,时间戳转 ISO8601
        query.startTime = new Date(this.filters.timeRange[0]).toISOString();
        query.endTime = new Date(this.filters.timeRange[1]).toISOString();
      }
      logsApi
        .list(query)
        .then((res) => {
          // 统一响应 { code, data }; 非 200(如非 admin 的 403)给出提示
          if (res.code === 200) {
            this.tableData = res.data.list;
            this.total = res.data.total;
          } else {
            this.$message.error(res.message || '查询失败');
            this.tableData = [];
            this.total = 0;
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    levelTagType(level) {
      if (level === 'error') return 'danger';
      if (level === 'warn') return 'warning';
      return 'info';
    },
    formatTime(val) {
      if (!val) return '-';
      return new Date(val).toLocaleString();
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.getTableData();
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.getTableData();
    },
    handleSearch() {
      this.currentPage = 1;
      this.getTableData();
    },
    handleReset() {
      this.filters = { level: '', context: '', keyword: '', timeRange: null };
      this.currentPage = 1;
      this.getTableData();
    }
  }
};
</script>

<style lang="less" scoped>
.logs-view {
  .filter-form {
    margin-bottom: 12px;
  }
}
</style>
