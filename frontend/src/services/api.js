import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData),
    updateProfile: (data) => api.put('/auth/profile', data),
};

export const chatAPI = {
    sendMessage: (message, chatId) => api.post('/ai/chat', { message, chatId }),
    getChats: () => api.get('/ai/chats'),
    getMessages: (chatId) => api.get(`/ai/chats/${chatId}/messages`),
    deleteChat: (chatId) => api.delete(`/ai/chats/${chatId}`),
};

export default api;
