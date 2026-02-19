import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_PORT
  ? `${process.env.REACT_APP_BACKEND_URL}:${process.env.REACT_APP_BACKEND_PORT}`
  : process.env.REACT_APP_BACKEND_URL;

console.log('API Base URL:', API_BASE_URL);
console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
console.log('Backend Port:', process.env.REACT_APP_BACKEND_PORT);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// User APIs
export const userAPI = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  updatePassword: (userId, passwordData) => api.put(`/api/users/${userId}/password`, passwordData),
  getUser: (userId) => api.get(`/api/users/${userId}`),
};

// Ticket APIs
export const ticketAPI = {
  create: (formData) => api.post('/api/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  getUserTickets: (userId) => api.get(`/api/tickets/user/${userId}`),

  getAllTickets: () => api.get('/api/tickets'),

  getAllUsers: () => api.get('/api/users'),

  getTicket: (ticketId) => api.get(`/api/tickets/${ticketId}`),

  update: (ticketId, formData) => api.put(`/api/tickets/${ticketId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // ✅ NEW: Separate route for feedback submission only
  submitFeedback: (ticketId, feedbackData) => api.put(`/api/tickets/${ticketId}/feedback`, feedbackData, {
    headers: { 'Content-Type': 'application/json' }
  }),

  // ✅ NEW: Add more images to an existing ticket
  addImages: (ticketId, formData) => api.post(`/api/tickets/${ticketId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  delete: (ticketId) => api.delete(`/api/tickets/${ticketId}`),
};

// Feedback APIs
export const feedbackAPI = {
  create: (feedbackData) => api.post('/api/feedback', feedbackData),
  getUserFeedbacks: (userId) => api.get(`/api/feedback/user/${userId}`),
  getAllFeedbacks: () => api.get('/api/feedback'),
  getTicketFeedbacks: (ticketId) => api.get(`/api/feedback/ticket/${ticketId}`),
  delete: (feedbackId) => api.delete(`/api/feedback/${feedbackId}`),
};

export default api;


// import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_BACKEND_PORT
//   ? `${process.env.REACT_APP_BACKEND_URL}:${process.env.REACT_APP_BACKEND_PORT}`
//   : process.env.REACT_APP_BACKEND_URL;

// console.log('API Base URL:', API_BASE_URL);
// console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
// console.log('Backend Port:', process.env.REACT_APP_BACKEND_PORT);

// const api = axios.create({
//   baseURL: API_BASE_URL,
// });

// // User APIs
// export const userAPI = {
//   register: (userData) => api.post('/api/users/register', userData),
//   login: (credentials) => api.post('/api/users/login', credentials),
//   updatePassword: (userId, passwordData) => api.put(`/api/users/${userId}/password`, passwordData),
//   getUser: (userId) => api.get(`/api/users/${userId}`),
// };

// // Ticket APIs
// export const ticketAPI = {
//   create: (formData) => api.post('/api/tickets', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' }
//   }),

//   getUserTickets: (userId) => api.get(`/api/tickets/user/${userId}`),

//   getAllTickets: () => api.get('/api/tickets'),

//   getAllUsers: () => api.get('/api/users'),

//   getTicket: (ticketId) => api.get(`/api/tickets/${ticketId}`),

//   // update: (ticketId, formData) => api.put(`/api/tickets/${ticketId}`, formData, {
//   //   headers: { 'Content-Type': 'multipart/form-data' }
//   // }),

//   // ✅ UPDATED: Handle both FormData (with image) and JSON (feedback only)
//   update: (ticketId, data) => {
//     // If it's FormData, use multipart
//     if (data instanceof FormData) {
//       return api.put(`/api/tickets/${ticketId}`, data, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//     }
//     // Otherwise, send as JSON (for feedback-only updates)
//     return api.put(`/api/tickets/${ticketId}`, data, {
//       headers: { 'Content-Type': 'application/json' }
//     });
//   },


//   // ✅ NEW: Add more images to an existing ticket
//   addImages: (ticketId, formData) => api.post(`/api/tickets/${ticketId}/images`, formData, {
//     headers: { 'Content-Type': 'multipart/form-data' }
//   }),

//   delete: (ticketId) => api.delete(`/api/tickets/${ticketId}`),
// };

// // Feedback APIs
// export const feedbackAPI = {
//   create: (feedbackData) => api.post('/api/feedback', feedbackData),
//   getUserFeedbacks: (userId) => api.get(`/api/feedback/user/${userId}`),
//   getAllFeedbacks: () => api.get('/api/feedback'),
//   getTicketFeedbacks: (ticketId) => api.get(`/api/feedback/ticket/${ticketId}`),
//   delete: (feedbackId) => api.delete(`/api/feedback/${feedbackId}`),
// };

// export default api;
