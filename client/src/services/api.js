import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const etablissementAPI = {
  getAll: () => api.get('/etablissements'),
  getById: (id) => api.get(`/etablissements/${id}`),
  create: (data) => api.post('/etablissements', data),
  update: (id, data) => api.put(`/etablissements/${id}`, data),
  toggleStatut: (id, statut) => api.patch(`/etablissements/${id}/statut`, { statut }),
  remove: (id) => api.delete(`/etablissements/${id}`)
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.patch(`/users/${id}/reset-password`, data),
  remove: (id) => api.delete(`/users/${id}`)
};

export const filiereAPI = {
  getAll: (params) => api.get('/filieres', { params }),
  getById: (id) => api.get(`/filieres/${id}`),
  create: (data) => api.post('/filieres', data),
  update: (id, data) => api.put(`/filieres/${id}`, data),
  remove: (id) => api.delete(`/filieres/${id}`)
};

export const matiereAPI = {
  getAll: (params) => api.get('/matieres', { params }),
  create: (data) => api.post('/matieres', data),
  update: (id, data) => api.put(`/matieres/${id}`, data),
  remove: (id) => api.delete(`/matieres/${id}`)
};

export const etudiantAPI = {
  getAll: (params) => api.get('/etudiants', { params }),
  getById: (id) => api.get(`/etudiants/${id}`),
  create: (data) => api.post('/etudiants', data),
  update: (id, data) => api.put(`/etudiants/${id}`, data),
  remove: (id) => api.delete(`/etudiants/${id}`)
};

export const noteAPI = {
  getByEtudiant: (id, params) => api.get(`/notes/etudiant/${id}`, { params }),
  getByNiveau: (id, params) => api.get(`/notes/niveau/${id}`, { params }),
  getBulletin: (id, params) => api.get(`/notes/bulletin/${id}`, { params }),
  create: (data) => api.post('/notes', data),
  createBulk: (data) => api.post('/notes/bulk', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  remove: (id) => api.delete(`/notes/${id}`)
};

export const absenceAPI = {
  getAll: (params) => api.get('/absences', { params }),
  getStats: (etudiantId) => api.get(`/absences/stats/${etudiantId}`),
  create: (data) => api.post('/absences', data),
  createBulk: (data) => api.post('/absences/bulk', data),
  update: (id, data) => api.put(`/absences/${id}`, data),
  remove: (id) => api.delete(`/absences/${id}`)
};

export const paiementAPI = {
  getAll: (params) => api.get('/paiements', { params }),
  getById: (id) => api.get(`/paiements/${id}`),
  create: (data) => api.post('/paiements', data),
  update: (id, data) => api.put(`/paiements/${id}`, data),
  remove: (id) => api.delete(`/paiements/${id}`)
};

export const statsAPI = {
  getSuperAdmin: () => api.get('/stats/superadmin'),
  getDirecteur: () => api.get('/stats/directeur'),
  getProfesseur: () => api.get('/stats/professeur'),
  getSecretaire: () => api.get('/stats/secretaire')
};

export const pdfAPI = {
  getBulletin: (etudiantId, params) =>
    api.get(`/pdf/bulletin/${etudiantId}`, { params, responseType: 'blob' }),
  getRecu: (paiementId) =>
    api.get(`/pdf/recu/${paiementId}`, { responseType: 'blob' })
};

export default api;
