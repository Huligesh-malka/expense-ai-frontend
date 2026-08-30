import API from "./api";

// =====================================
// ADMIN DASHBOARD
// =====================================

export const getAdminDashboard = () => {
    return API.get("/admin/dashboard");
};


// =====================================
// ADMIN BUSINESSES
// =====================================

export const getAdminBusinesses = () => {
    return API.get("/admin/businesses");
};


// =====================================
// ADMIN USERS
// =====================================

export const getAdminUsers = () => {
    return API.get("/admin/users");
};


// =====================================
// SECURITY OVERVIEW
// =====================================

export const getSecurityOverview = () => {
    return API.get("/admin/security/overview");
};


// =====================================
// SECURITY EVENTS
// =====================================

export const getSecurityEvents = (limit = 100) => {
    return API.get(
        `/admin/security/events?limit=${limit}`
    );
};


// =====================================
// SECURITY AI ENGINE
// =====================================

export const getSecurityAI = () => {
    return API.get("/admin/security/ai");
};