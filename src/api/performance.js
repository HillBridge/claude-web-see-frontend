import request from '../utils/request';

export const performanceApi = {
  // 某项目的页面列表(归一化,供选择器)
  getPages: (apikey) => request.get(`/api/performance/pages/${apikey}`),
  // 性能快照: p75/p95 + good 占比(可选按页面 pageUrl)
  getSummary: (apikey, params) => request.get(`/api/performance/summary/${apikey}`, { params }),
  // 某指标按天趋势: p75 + good 占比(name 指标名, 可选 pageUrl)
  getTrend: (apikey, params) => request.get(`/api/performance/trend/${apikey}`, { params }),
};
