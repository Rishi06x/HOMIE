import axios from 'axios';

const API_BASE = 'http://13.201.29.187:5000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('homie_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('homie_token');
            // Optional: window.location.href = '/login'; or trigger a custom event
            // For now, we'll just clear the token; App.jsx might not react immediately 
            // but the next interval call will fail and App.jsx's auth check could help.
        }
        return Promise.reject(error);
    }
);

// ── Auth API ──────────────────────────────────────

export const registerUser = async (name, email, password, role, location, specialization, pricePerHour) => {
    const res = await api.post('/auth/register', {
        name, email, password, role, location, specialization,
        price_per_hour: pricePerHour,
    });
    const { token, user } = res.data;
    sessionStorage.setItem('homie_token', token);
    return user;
};

export const loginUser = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    sessionStorage.setItem('homie_token', token);
    return user;
};

export const getMe = async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
};

export const verifyUser = async () => {
    const res = await api.put('/api/users/verify');
    return res.data;
};

export const logout = () => {
    sessionStorage.removeItem('homie_token');
};

export const isLoggedIn = () => {
    return !!sessionStorage.getItem('homie_token');
};

// ── Professionals API ─────────────────────────────

export const getNearbyProfessionals = async (category = '', search = '', radius = 50) => {
    const params = {};
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    if (radius) params.radius = radius;

    const res = await api.get('/api/professionals/nearby', { params });
    return res.data;
};

export const updateOnlineStatus = async (isOnline) => {
    const res = await api.put('/api/professionals/status', { is_online: isOnline });
    return res.data;
};

export const getProfessionalStats = async () => {
    const res = await api.get('/api/professionals/stats');
    return res.data.stats;
};

export const updateProProfile = async (bio, portfolioImages) => {
    const res = await api.put('/api/professionals/profile', { bio, portfolio_images: portfolioImages });
    return res.data;
};

// ── Bookings API ──────────────────────────────────

export const getBookings = async () => {
    const res = await api.get('/api/bookings');
    return res.data.bookings;
};

export const autoMatchBooking = async (category, services = [], totalAmount = 0, scheduledDate = null, scheduledTime = null) => {
    const res = await api.post('/api/bookings/auto-match', { 
        category,
        services,
        total_amount: totalAmount,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime
    });
    return res.data;
};

export const createBooking = async (providerId, issueDescription = "", services = [], totalAmount = 0, scheduledDate = null, scheduledTime = null) => {
    const res = await api.post('/api/bookings', { 
        provider_id: providerId, 
        issue_description: issueDescription,
        services,
        total_amount: totalAmount,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime
    });
    return res.data;
};

export const updateBookingStatus = async (bookingId, status) => {
    const res = await api.put(`/api/bookings/${bookingId}/status`, { status });
    return res.data;
};

export const cancelBooking = async (bookingId) => {
    const res = await api.put(`/api/bookings/${bookingId}/cancel`);
    return res.data;
};

export const rescheduleBooking = async (bookingId, newDate, newTime) => {
    const res = await api.put(`/api/bookings/${bookingId}/reschedule`, {
        scheduled_date: newDate,
        scheduled_time: newTime
    });
    return res.data;
};

export const addDiagnostics = async (bookingId, imageUrl, details) => {
    const res = await api.put(`/api/bookings/${bookingId}/diagnostics`, { image_url: imageUrl, details });
    return res.data;
};

export const startJobWithOtp = async (bookingId, otp) => {
    const res = await api.post(`/api/bookings/${bookingId}/start`, { otp });
    return res.data;
};

export const getBookingMessages = async (bookingId) => {
    const res = await api.get(`/api/bookings/${bookingId}/messages`);
    return res.data.messages;
};

// ── Catalog & Reviews API ─────────────────────────

export const getCatalog = async () => {
    const res = await api.get('/api/catalog');
    return res.data.categories;
};

export const submitReview = async (providerId, bookingId, rating, text) => {
    const res = await api.post('/api/reviews', { provider_id: providerId, booking_id: bookingId, rating, text });
    return res.data;
};

export const getProviderReviews = async (providerId) => {
    const res = await api.get(`/api/professionals/${providerId}/reviews`);
    return res.data.reviews;
};

export default api;
