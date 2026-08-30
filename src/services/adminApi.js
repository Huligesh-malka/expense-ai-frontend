// services/adminApi.js

import API from "./api";

// =====================================
// ADMIN DASHBOARD
// =====================================

export const getAdminDashboard = () => {
    return API.get("/admin/dashboard");
};

export const getAdminBusinesses = () => {
    return API.get("/admin/businesses");
};

export const getAdminUsers = () => {
    return API.get("/admin/users");
};


// =====================================
// SECURITY ENGINE
// =====================================

export const getSecurityOverview = () => {
    return API.get("/admin/security/overview");
};


export const getSecurityEvents = (limit = 100) => {
    return API.get(
        `/admin/security/events?limit=${limit}`
    );
};


export const getSecurityAI = () => {
    return API.get("/admin/security/ai");
};