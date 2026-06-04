<template>
  <div class="errors-view">
    <h2 class="page-title">报错统计</h2>

    <el-form :inline="true" :model="filters" class="filter-form" @submit.native.prevent="handleSearch">
      <el-form-item label="项目编号">
        <el-input v-model="filters.projectId" placeholder="请输入项目编号" clearable style="width: 140px"></el-input>
      </el-form-item>
      <el-form-item label="错误类型">
        <el-select v-model="filters.type" placeholder="全部" clearable style="width: 130px">
          <el-option label="JS错误" value="error"></el-option>
          <el-option label="Promise错误" value="unhandledrejection"></el-option>
          <el-option label="资源错误" value="resource"></el-option>
          <el-option label="Fetch请求错误" value="fetch"></el-option>
          <el-option label="XHR请求错误" value="xhr"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="用户ID">
        <el-input v-model="filters.userId" placeholder="请输入用户ID" clearable style="width: 140px"></el-input>
      </el-form-item>
      <el-form-item label="报错时间">
        <el-date-picker
          v-model="filters.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="timestamp"
          :picker-options="timePickerOptions"
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
      <el-table-column prop="count" label="发生次数" width="100" align="center">
        <template slot-scope="scope">
          <el-tag type="danger" size="small">{{ scope.row.count || 1 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="firstSeen" label="首次出现" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.firstSeen ? format(scope.row.firstSeen) : '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="lastSeen" label="最近出现" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.lastSeen ? format(scope.row.lastSeen) : '-' }}</span>
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
      <el-table-column fixed="right" label="操作" width="90">
        <template slot-scope="scope">
          <el-button type="danger" size="mini" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination style="margin-top: 16px; text-align: right" background
      layout="total, sizes, prev, pager, next, jumper" :total="total" :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]" :current-page="currentPage" @current-change="handlePageChange"
      @size-change="handleSizeChange"></el-pagination>

    <el-dialog :title="dialogTitle" :class="{ 'revert-disalog': fullscreen }" top="10vh" :fullscreen="fullscreen"
      :visible.sync="revertdialog" width="90%" :destroy-on-close="true" @close="handleDialogClose">
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
import { errorsApi } from '../api/errors';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

export default {
  name: 'ErrorsView',
  data() {
    return {
      fullscreen: true,
      revertdialog: false,
      dialogTitle: '',
      player: null,
      activities: [],
      tableData: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      loading: false,
      filters: {
        projectId: '',
        type: '',
        userId: '',
        timeRange: [Date.now() - 7 * 24 * 3600 * 1000, Date.now()]
      },
      timePickerOptions: {
        shortcuts: [
          {
            text: '今天',
            onClick(picker) {
              picker.$emit('pick', [new Date().setHours(0, 0, 0, 0), Date.now()]);
            }
          },
          {
            text: '昨天',
            onClick(picker) {
              const start = new Date();
              start.setDate(start.getDate() - 1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setDate(end.getDate() - 1);
              end.setHours(23, 59, 59, 999);
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近一周',
            onClick(picker) {
              const end = Date.now();
              const start = end - 7 * 24 * 3600 * 1000;
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = Date.now();
              const start = end - 30 * 24 * 3600 * 1000;
              picker.$emit('pick', [start, end]);
            }
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const end = Date.now();
              const start = end - 90 * 24 * 3600 * 1000;
              picker.$emit('pick', [start, end]);
            }
          }
        ]
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
      if (this.filters.projectId) query.projectId = this.filters.projectId;
      if (this.filters.type) query.type = this.filters.type;
      if (this.filters.userId) query.userId = this.filters.userId;
      if (this.filters.timeRange) {
        query.startTime = this.filters.timeRange[0];
        query.endTime = this.filters.timeRange[1];
      }
      const params = new URLSearchParams(query);
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
    handleSearch() {
      this.currentPage = 1;
      this.getTableData();
    },
    handleReset() {
      this.filters = { projectId: '', type: '', userId: '', timeRange: [new Date().setHours(0, 0, 0, 0), Date.now()] };
      this.currentPage = 1;
      this.getTableData();
    },
    handleDelete(row) {
      this.$confirm('确认删除该错误？将一并删除其全部发生记录、录屏、用户行为数据，删除后无法恢复。', '警告', {
        type: 'warning',
        confirmButtonText: '确认删除',
        confirmButtonClass: 'el-button--danger'
      })
        .then(() => {
          this.loading = true;
          errorsApi
            .removeGroup(row.groupId)
            .then(() => {
              this.$message({ type: 'success', message: '已删除' });
              // 删除当前页最后一条时回退一页, 避免停留在空页
              if (this.tableData.length === 1 && this.currentPage > 1) {
                this.currentPage -= 1;
              }
              this.getTableData();
            })
            .catch(() => {
              this.$message({ type: 'error', message: '删除失败' });
            })
            .finally(() => {
              this.loading = false;
            });
        })
        .catch(() => {});
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
            this.destroyPlayer();
            this.player = new rrwebPlayer({
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
    // 销毁回放器实例, 避免弹窗关闭后回放循环继续操作已移除的 DOM (Node not found / replayer destroyed 告警)
    destroyPlayer() {
      if (!this.player) return;
      // 先暂停内部回放循环, 再销毁 Svelte 组件; 各步骤独立 try, 互不影响
      try {
        this.player.pause();
      } catch (e) {
        /* ignore */
      }
      try {
        this.player.$destroy();
      } catch (e) {
        /* ignore */
      }
      this.player = null;
    },
    handleDialogClose() {
      this.destroyPlayer();
    },
    errorTagType(type) {
      const map = {
        error: 'danger',
        unhandledrejection: 'warning',
        resource: 'info',
        fetch: '',
        xhr: ''
      };
      return map[type] ?? 'info';
    },
    errorTagLabel(type) {
      const map = {
        error: 'JS错误',
        unhandledrejection: 'Promise错误',
        resource: '资源错误',
        fetch: 'Fetch请求错误',
        xhr: 'XHR请求错误'
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

  .filter-form {
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 0;
  }

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
