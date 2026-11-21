import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  getPreferences: () => api.get('/profile/preferences/'),
  updatePreferences: (data) => api.patch('/profile/preferences/', data),
  getAddresses: () => api.get('/addresses/'),
  addAddress: (data) => api.post('/addresses/', data),
  updateAddress: (id, data) => api.patch(`/addresses/${id}/`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}/`),
  requestOtp: (phone) => api.post('/auth/otp/request/', { phone }),
  verifyOtp: (phone, otp, name) => api.post('/auth/otp/verify/', { phone, otp, name }),
  resetPassword: (email) => api.post('/auth/password-reset/', { email }),
};

export const restaurantService = {
  getCuisines: () => api.get('/cuisines/'),
  getRestaurants: (params) => api.get('/restaurants/', { params }),
  getRestaurant: (id) => api.get(`/restaurants/${id}/`),
  getOffers: () => api.get('/offers/'),
};

export const menuService = {
  getRestaurantMenu: (restaurantId, params) => api.get(`/restaurants/${restaurantId}/menu/`, { params }),
  getFoodItems: (params) => api.get('/food-items/', { params }),
  getFoodItem: (id) => api.get(`/food-items/${id}/`),
};

export const cartService = {
  getCart: () => api.get('/cart/'),
  addItem: (data) => api.post('/cart/items/', data),
  updateItem: (id, data) => api.patch(`/cart/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/cart/items/${id}/`),
  clearCart: () => api.delete('/cart/clear/'),
  applyCoupon: (code) => api.post('/cart/coupon/', { code }),
  removeCoupon: () => api.delete('/cart/coupon/'),
};

export const orderService = {
  createOrder: (data) => api.post('/orders/', data),
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
  getOrderTracking: (id) => api.get(`/orders/${id}/tracking/`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel/`),
  reorder: (id) => api.post(`/orders/${id}/reorder/`),
  advanceStage: (id) => api.post(`/admin/orders/${id}/advance/`),
};

export const reviewService = {
  createReview: (data) => api.post('/reviews/', data),
  editReview: (id, data) => api.patch(`/reviews/${id}/`, data),
  getRestaurantReviews: (restaurantId) => api.get(`/restaurants/${restaurantId}/reviews/`),
  getFavorites: () => api.get('/favorites/'),
  toggleFavorite: (type, id) => api.post('/favorites/', { type, id }),
  deleteFavorite: (id) => api.delete(`/favorites/${id}/`),
  getRecentSearches: () => api.get('/search/recent/'),
  addRecentSearch: (term) => api.post('/search/recent/', { term }),
  clearRecentSearches: () => api.delete('/search/recent/'),
};

export const assistantService = {
  getConversations: () => api.get('/assistant/conversations/'),
  createConversation: (title) => api.post('/assistant/conversations/', { title }),
  getConversation: (id) => api.get(`/assistant/conversations/${id}/`),
  updateConversation: (id, title) => api.patch(`/assistant/conversations/${id}/`, { title }),
  deleteConversation: (id) => api.delete(`/assistant/conversations/${id}/`),
  sendMessage: (id, message) => api.post(`/assistant/conversations/${id}/messages/`, { message }),
  clearMessages: (id) => api.delete(`/assistant/conversations/${id}/clear/`),
};
