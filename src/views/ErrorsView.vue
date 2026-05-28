<template>
  <div class="errors-view">
    <h2 class="page-title">报错统计</h2>
    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <el-table-column type="index" width="50"></el-table-column>
      <el-table-column prop="message" label="报错信息" width="300"></el-table-column>
      <el-table-column prop="pageUrl" label="报错页面"></el-table-column>
      <el-table-column prop="time" label="报错时间" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.time ? format(scope.row.time) : scope.row.date }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="apikey" label="项目编号"></el-table-column>
      <el-table-column prop="userId" label="用户id"></el-table-column>
      <el-table-column prop="type" label="错误类型" width="160">
        <template slot-scope="scope">
          <el-tag :type="errorTagType(scope.row.type)" size="small">{{ errorTagLabel(scope.row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="环境信息" width="160">
        <template slot-scope="scope">
          <div>SDK: {{ scope.row.sdkVersion }}</div>
          <div>{{ scope.row.deviceInfo.browser }}</div>
          <div>{{ scope.row.deviceInfo.os }}</div>
        </template>
      </el-table-column>
      <el-table-column fixed="right" prop="recordScreenId" label="还原错误代码" width="120">
        <template slot-scope="scope">
          <el-button v-if="scope.row.type == 'error' || scope.row.type == 'unhandledrejection'" type="primary"
            @click="revertCode(scope.row)">查看源码</el-button>
        </template>
      </el-table-column>
      <el-table-column fixed="right" prop="recordScreenId" label="播放录屏" width="100">
        <template slot-scope="scope">
          <el-button v-if="scope.row.recordScreenId" type="primary"
            @click="playRecord(scope.row.recordScreenId)">播放录屏</el-button>
        </template>
      </el-table-column>
      <el-table-column fixed="right" prop="breadcrumbs" label="用户行为记录" width="125">
        <template slot-scope="scope">
          <el-button v-if="scope.row.breadcrumbs" type="primary" @click="revertBehavior(scope.row)">查看用户行为</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination style="margin-top: 16px; text-align: right" background
      layout="total, sizes, prev, pager, next, jumper" :total="total" :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]" :current-page="currentPage" @current-change="handlePageChange"
      @size-change="handleSizeChange"></el-pagination>

    <el-dialog :title="dialogTitle" :class="{ 'revert-disalog': fullscreen }" top="10vh" :fullscreen="fullscreen"
      :visible.sync="revertdialog" width="90%" :destroy-on-close="true">
      <div id="revert" ref="revert" v-if="dialogTitle != '查看用户行为'"></div>
      <el-timeline v-else>
        <el-timeline-item v-for="(activity, index) in activities" :key="index" :icon="activity.icon"
          :color="activity.color" :timestamp="format(activity.time)">{{ activity.content }}</el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script>
import { findCodeBySourceMap } from '../utils/sourcemap';
import { unzip } from '../utils/recordScreen.js';
import request from '../utils/request';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

export default {
  name: 'ErrorsView',
  data() {
    return {
      fullscreen: true,
      revertdialog: false,
      dialogTitle: '',
      activities: [],
      tableData: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      loading: false
    };
  },
  created() {
    this.getTableData();
  },
  methods: {
    getTableData() {
      this.loading = true;
      const params = new URLSearchParams({
        page: this.currentPage,
        pageSize: this.pageSize
      });
      request
        .get(`/getErrorList?${params}`)
        .then((res) => {
          this.tableData = res.data.list;
          this.total = res.data.total;
        })
        .finally(() => {
          this.loading = false;
        });
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
    revertBehavior({ breadcrumbs }) {
      this.dialogTitle = '查看用户行为';
      this.fullscreen = false;
      this.revertdialog = true;
      breadcrumbs.forEach((item) => {
        item.color = item.status == 'ok' ? '#5FF713' : '#F70B0B';
        item.icon = item.status == 'ok' ? 'el-icon-check' : 'el-icon-close';
        if (item.category == 'Click') {
          item.content = `用户点击dom: ${item.data}`;
        } else if (item.category == 'Http') {
          item.content = `调用接口: ${item.data.url}, ${item.status == 'ok' ? '请求成功' : '请求失败'}`;
        } else if (item.category == 'Code_Error') {
          item.content = `代码报错：${item.data.message}`;
        } else if (item.category == 'Resource_Error') {
          item.content = `加载资源报错：${item.message}`;
        } else if (item.category == 'Route') {
          item.content = `路由变化：从 ${item.data.from}页面 切换到 ${item.data.to}页面`;
        }
      });
      this.activities = breadcrumbs;
    },
    revertCode(row) {
      findCodeBySourceMap(row, (res) => {
        this.dialogTitle = '查看源码';
        this.fullscreen = false;
        this.revertdialog = true;
        this.$nextTick(() => {
          this.$refs.revert.innerHTML = res;
        });
      });
    },
    playRecord(id) {
      request.get(`/getRecordScreenId?id=${id}`).then((res) => {
        let { code, data } = res;
        if (code == 200 && Array.isArray(data) && data[0] && data[0].events) {
          let events = unzip(data[0].events);
          this.fullscreen = true;
          this.dialogTitle = '播放录屏';
          this.revertdialog = true;
          this.$nextTick(() => {
            new rrwebPlayer({
              target: document.getElementById('revert'),
              props: {
                events,
                UNSAFE_replayCanvas: true
              }
            });
          });
        } else {
          this.$message({
            message: '暂无数据，请稍后重试~',
            type: 'warning',
            duration: 5000
          });
        }
      });
    },
    errorTagType(type) {
      const map = {
        error: 'danger',
        unhandledrejection: 'warning',
        resource: 'info',
        http: ''
      };
      return map[type] ?? 'info';
    },
    errorTagLabel(type) {
      const map = {
        error: 'JS错误',
        unhandledrejection: 'Promise错误',
        resource: '资源错误',
        http: '请求错误'
      };
      return map[type] ?? type;
    },
    format(time) {
      let str = new Date(time);
      return str.toLocaleDateString().replace(/\//g, '-') + ' ' + str.toTimeString().substr(0, 8);
    }
  }
};
</script>

<style lang="less">
.errors-view {
  padding: 20px 0;

  .page-title {
    text-align: left;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: 700;
  }
}

.el-dialog__header {
  font-size: 20px;
  font-weight: 800;
}

.el-timeline {
  text-align: left;

  .el-timeline-item__icon {
    font-size: 12px;
  }
}

.revert-disalog {
  .el-dialog__body {
    height: 720px;
  }
}

.rr-player {
  margin: 0 auto;
}

#revert {
  width: 100%;
  display: flex;
}

.errdetail {
  text-align: left;
  width: 100%;
  font-size: 16px;
}

.code-line {
  padding: 5px 0;
}

.heightlight {
  background-color: yellowgreen;
}

.errheader {
  padding: 10px;
  border-bottom: 1px solid rgb(214, 210, 210);
}
</style>
