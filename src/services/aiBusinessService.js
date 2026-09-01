import API from "./api";

// ============================================================
// AI BUSINESS ANALYTICS SERVICE
// ============================================================

// Get complete business analytics for the logged-in business
export const getBusinessAnalytics = async () => {
    const response = await API.get("/ai-business/analytics");

    return response.data;
};