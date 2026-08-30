import API from "./api";

// =====================================
// ADMIN DASHBOARD
// =====================================

export const getAdminDashboard = () => {
    return API.get("/admin/dashboard");
};


// =====================================
// ALL BUSINESSES
// =====================================

export const getAdminBusinesses = () => {
    return API.get("/admin/businesses");
};


// =====================================
// ALL USERS
// =====================================

export const getAdminUsers = () => {
    return API.get("/admin/users");
};