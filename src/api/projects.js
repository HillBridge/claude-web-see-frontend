import request from '../utils/request';

export const projectsApi = {
  list: (params) => request.get('/api/projects', { params }),
  create: (data) => request.post('/api/projects', data),
  update: (id, data) => request.patch(`/api/projects/${id}`, data),
  remove: (id) => request.delete(`/api/projects/${id}`),
  regenerateApikey: (id) => request.post(`/api/projects/${id}/regenerate-apikey`),
};
