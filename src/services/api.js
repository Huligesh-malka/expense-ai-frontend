import axios from "axios";

const API = axios.create({
    baseURL: "https://expense-ai-backend-0sh8.onrender.com/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Attach JWT Token Automatically
API.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

export default API;