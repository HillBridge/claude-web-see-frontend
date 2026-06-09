import request from '../utils/request';

export const logsApi = {
  // 系统运行日志查询(管理端,ADMIN 专属;非 admin 后端返回 code 403)
  list: (params) => request.get('/api/logs', { params }),
};
