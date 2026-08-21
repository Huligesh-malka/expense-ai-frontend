import axios from "axios";

const API = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "https://expense-ai-backend-0sh8.onrender.com/api",

    headers: {
        "Content-Type": "application/json",
    },

    timeout: 15000,
});

// =====================================
// REQUEST INTERCEPTOR
// Automatically attach JWT
// =====================================

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =====================================
// RESPONSE INTERCEPTOR
// Centralized API error handling
// =====================================

API.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        if (!error.response) {
            console.error("Network error:", error.message);
            return Promise.reject(error);
        }

        const status = error.response.status;

        // Authentication expired / invalid
        if (status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("businessId");

            // Don't force navigation if already on login
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        // Permission denied
        if (status === 403) {
            console.error(
                "Access denied:",
                error.response.data?.message
            );
        }

        // Resource not found
        if (status === 404) {
            console.error(
                "API endpoint not found:",
                error.config?.url
            );
        }

        // Server error
        if (status >= 500) {
            console.error(
                "Server error:",
                error.response.data?.message || "Internal server error"
            );
        }

        return Promise.reject(error);
    }
);

export default API;