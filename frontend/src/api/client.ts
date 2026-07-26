import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hb_token')
      localStorage.removeItem('hb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  validate: (token: string) =>
    api.get(`/auth/validate?token=${token}`),
}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  list: () => api.get('/products'),
  mine: () => api.get('/products/mine'),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: number, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoryApi = {
  list: () => api.get('/categories'),
  get: (id: number) => api.get(`/categories/${id}`),
  create: (data: { name: string }) => api.post('/categories', data),
  update: (id: number, data: { name: string }) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  get: (productId: number) => api.get(`/inventory/${productId}`),
  set: (productId: number, quantity: number) =>
    api.put(`/inventory/${productId}`, { quantity }),
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: (userId: number) => api.get(`/cart/${userId}`),
  addItem: (userId: number, item: { productId: number; quantity: number; price: number }) =>
    api.post(`/cart/${userId}/items`, item),
  updateItem: (userId: number, productId: number, quantity: number) =>
    api.put(`/cart/${userId}/items/${productId}?quantity=${quantity}`),
  removeItem: (userId: number, productId: number) =>
    api.delete(`/cart/${userId}/items/${productId}`),
  clear: (userId: number) => api.delete(`/cart/${userId}`),
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderApi = {
  checkout: (userId: number, paymentMethod: string) =>
    api.post(`/orders/checkout/${userId}`, { paymentMethod }),
  get: (id: number) => api.get(`/orders/${id}`),
  listByUser: (userId: number) => api.get(`/orders/user/${userId}`),
  updateStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}?status=${status}`),
  mySales: () => api.get('/orders/my-sales'),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentApi = {
  process: (data: { orderId: number; userId: number; amount: number; method: string }) =>
    api.post('/payments', data),
  getByOrder: (orderId: number) => api.get(`/payments/order/${orderId}`),
}

// ─── Backup ───────────────────────────────────────────────────────────────────
export const backupApi = {
  list: () => api.get('/backup'),
  trigger: () => api.post('/backup/trigger'),
  report: () => api.get('/backup/report'),
  download: (id: number) =>
    api.get(`/backup/${id}/download`, { responseType: 'blob' }),
  delete: (id: number) => api.delete(`/backup/${id}`),
}
