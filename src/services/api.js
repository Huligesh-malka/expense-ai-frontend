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
            config.headers = config.headers || {};
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
    (response) => response,

    (error) => {
        // =====================================
        // NETWORK ERROR
        // =====================================

        if (!error.response) {
            console.error("Network error:", error.message);
            return Promise.reject(error);
        }

        const status = error.response.status;
        const url = error.config?.url || "";
        const backendMessage =
            error.response.data?.message || "";

        // =====================================
        // 401 - AUTHENTICATION
        // =====================================

        if (status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("businessId");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        // =====================================
        // 403 - PERMISSION
        // =====================================

        else if (status === 403) {
            console.error(
                "Access denied:",
                backendMessage || "Permission denied"
            );
        }

        // =====================================
        // 404 - RESOURCE NOT FOUND
        // =====================================

        else if (status === 404) {

            // Barcode lookup 404 is expected when
            // checking whether a barcode is available.
            if (url.includes("/products/barcode/")) {
                // Do not report this as an API endpoint error.
                // The endpoint exists; the product simply wasn't found.
            } else {
                console.error(
                    "Resource not found:",
                    url,
                    backendMessage
                );
            }
        }

        // =====================================
        // 400 - VALIDATION / BAD REQUEST
        // =====================================

        else if (status === 400) {
            console.error(
                "Bad request:",
                backendMessage || "Invalid request"
            );
        }

        // =====================================
        // 500+ - SERVER ERROR
        // =====================================

        else if (status >= 500) {
            console.error(
                "Server error:",
                backendMessage || "Internal server error"
            );
        }

        return Promise.reject(error);
    }
);

export default API;