import API from "./api";

// =====================================
// SECURITY ENGINE
// =====================================

// Security overview
export const getSecurityOverview = () => {
    return API.get("/admin/security/overview");
};


// Security events
export const getSecurityEvents = (limit = 100) => {
    return API.get("/admin/security/events", {
        params: {
            limit
        }
    });
};


// AI security analysis
export const getSecurityAI = () => {
    return API.get("/admin/security/ai");
};