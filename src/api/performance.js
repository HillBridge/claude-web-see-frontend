import request from '../utils/request';

export const performanceApi = {
  // 某项目 Web Vitals 实时均值(长格式原始表按指标分组求均值)
  getAvg: (apikey) => request.get(`/api/performance/avg/${apikey}`),
  // 某项目每日聚合趋势(宽聚合服务层 performance_daily_stats)
  getStats: (apikey, params) => request.get(`/api/performance/stats/${apikey}`, { params }),
};
