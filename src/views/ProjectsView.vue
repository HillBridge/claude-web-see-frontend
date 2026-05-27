<template>
  <div class="projects-view">
    <div class="page-header">
      <h2 class="page-title">项目管理</h2>
      <el-button type="primary" icon="el-icon-plus" @click="openCreate">新建项目</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <el-table-column type="index" width="50" />
      <el-table-column prop="name" label="项目名称" width="160" />
      <el-table-column label="ApiKey" min-width="260">
        <template slot-scope="{ row }">
          <span class="apikey-text">{{ row.apikey }}</span>
          <el-button
            type="text"
            icon="el-icon-document-copy"
            style="margin-left:6px"
            @click="copyApikey(row.apikey)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
      <el-table-column label="允许上报域名" min-width="200">
        <template slot-scope="{ row }">
          <span v-if="!row.allowedOrigins || !row.allowedOrigins.length" class="text-muted">不限制</span>
          <el-tag
            v-for="origin in row.allowedOrigins"
            :key="origin"
            size="mini"
            style="margin: 2px"
          >{{ origin }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template slot-scope="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="240">
        <template slot-scope="{ row }">
          <div style="display:flex; gap:4px; flex-wrap:nowrap">
            <el-button type="primary" size="mini" @click="openEdit(row)">编辑</el-button>
            <el-button type="warning" size="mini" @click="handleRegenerate(row)">重置Key</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px; text-align:right"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50]"
      :current-page="currentPage"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 新建 / 编辑 Dialog -->
    <el-dialog
      :title="isEdit ? '编辑项目' : '新建项目'"
      :visible.sync="dialogVisible"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="2-50 个字符" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="选填，最多 200 字"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="允许域名" prop="allowedOrigins">
          <div class="origin-input-wrap">
            <el-input
              v-model="originInput"
              placeholder="如 https://example.com，回车添加"
              @keyup.enter.native="addOrigin"
            >
              <el-button slot="append" @click="addOrigin">添加</el-button>
            </el-input>
            <div class="origin-tags" v-if="form.allowedOrigins.length">
              <el-tag
                v-for="(o, i) in form.allowedOrigins"
                :key="i"
                closable
                size="small"
                style="margin: 4px 4px 0 0"
                @close="removeOrigin(i)"
              >{{ o }}</el-tag>
            </div>
            <div class="origin-hint">不填则不限制上报来源</div>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { projectsApi } from '../api/projects';

export default {
  name: 'ProjectsView',
  data() {
    return {
      tableData: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      loading: false,
      dialogVisible: false,
      isEdit: false,
      saving: false,
      editId: null,
      originInput: '',
      form: { name: '', description: '', allowedOrigins: [] },
      rules: {
        name: [
          { required: true, message: '请输入项目名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度 2-50 个字符', trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      projectsApi
        .list({ page: this.currentPage, pageSize: this.pageSize })
        .then((res) => {
          this.tableData = res.data.list;
          this.total = res.data.total;
        })
        .finally(() => { this.loading = false; });
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.loadData();
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.loadData();
    },
    openCreate() {
      this.isEdit = false;
      this.editId = null;
      this.dialogVisible = true;
    },
    openEdit(row) {
      this.isEdit = true;
      this.editId = row.id;
      this.form = {
        name: row.name,
        description: row.description || '',
        allowedOrigins: [...(row.allowedOrigins || [])]
      };
      this.dialogVisible = true;
    },
    resetForm() {
      this.form = { name: '', description: '', allowedOrigins: [] };
      this.originInput = '';
      this.$refs.form && this.$refs.form.resetFields();
    },
    addOrigin() {
      const val = this.originInput.trim();
      if (!val) return;
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        this.$message({ type: 'warning', message: '域名须以 http:// 或 https:// 开头' });
        return;
      }
      if (this.form.allowedOrigins.includes(val)) {
        this.$message({ type: 'warning', message: '已存在该域名' });
        return;
      }
      this.form.allowedOrigins.push(val);
      this.originInput = '';
    },
    removeOrigin(index) {
      this.form.allowedOrigins.splice(index, 1);
    },
    handleSave() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.saving = true;
        const api = this.isEdit
          ? projectsApi.update(this.editId, this.form)
          : projectsApi.create(this.form);
        api
          .then(() => {
            this.$message({ type: 'success', message: this.isEdit ? '更新成功' : '创建成功' });
            this.dialogVisible = false;
            this.loadData();
          })
          .finally(() => { this.saving = false; });
      });
    },
    handleDelete(row) {
      this.$confirm(`确认删除项目「${row.name}」？删除后数据无法恢复。`, '警告', {
        type: 'warning',
        confirmButtonText: '确认删除',
        confirmButtonClass: 'el-button--danger'
      }).then(() => {
        this.loading = true;
        projectsApi
          .remove(row.id)
          .then(() => {
            this.$message({ type: 'success', message: '已删除' });
            this.loadData();
          })
          .finally(() => { this.loading = false; });
      }).catch(() => {});
    },
    handleRegenerate(row) {
      this.$confirm(`重置后旧 ApiKey 立即失效，SDK 需同步更新。确认重置「${row.name}」的 ApiKey？`, '提示', {
        type: 'warning'
      }).then(() => {
        projectsApi.regenerateApikey(row.id).then(() => {
          this.$message({ type: 'success', message: '重置成功' });
          this.loadData();
        });
      }).catch(() => {});
    },
    copyApikey(apikey) {
      navigator.clipboard.writeText(apikey).then(() => {
        this.$message({ type: 'success', message: 'ApiKey 已复制' });
      }).catch(() => {
        this.$message({ type: 'error', message: '复制失败，请手动复制' });
      });
    },
    formatDate(val) {
      if (!val) return '-';
      const d = new Date(val);
      return d.toLocaleDateString('zh-CN').replace(/\//g, '-') + ' ' + d.toTimeString().slice(0, 8);
    }
  }
};
</script>

<style lang="less" scoped>
.projects-view {
  padding: 20px 0;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 18px;
    font-weight: 700;
  }

  .apikey-text {
    font-family: monospace;
    font-size: 14px;
    color: #606266;
  }

  .text-muted {
    color: #c0c4cc;
    font-size: 14px;
  }
}

.origin-input-wrap {
  .origin-tags {
    margin-top: 6px;
  }

  .origin-hint {
    margin-top: 6px;
    font-size: 14px;
    color: #c0c4cc;
  }
}
</style>
