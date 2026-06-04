import request from '../utils/request';

export const errorsApi = {
  // 删除错误分组及其全部关联数据(录屏 / 用户行为 / sourcemap)
  removeGroup: (groupId) => request.delete(`/errorGroups/${groupId}`),
};
