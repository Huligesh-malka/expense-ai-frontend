import API from "./api";

// =====================================
// REPORT SUMMARY
// =====================================

export const getReportSummary = async (from = "", to = "") => {
    const params = {};

    if (from) params.from = from;
    if (to) params.to = to;

    const response = await API.get("/reports/summary", {
        params,
    });

    return response.data;
};


// =====================================
// SALES REPORT
// =====================================

export const getSalesReport = async (from = "", to = "") => {
    const params = {};

    if (from) params.from = from;
    if (to) params.to = to;

    const response = await API.get("/reports/sales", {
        params,
    });

    return response.data;
};


// =====================================
// PURCHASE REPORT
// =====================================

export const getPurchaseReport = async (from = "", to = "") => {
    const params = {};

    if (from) params.from = from;
    if (to) params.to = to;

    const response = await API.get("/reports/purchases", {
        params,
    });

    return response.data;
};


// =====================================
// PROFIT REPORT
// =====================================

export const getProfitReport = async (from = "", to = "") => {
    const params = {};

    if (from) params.from = from;
    if (to) params.to = to;

    const response = await API.get("/reports/profit", {
        params,
    });

    return response.data;
};


// =====================================
// STOCK REPORT
// =====================================

export const getStockReport = async () => {
    const response = await API.get("/reports/stock");

    return response.data;
};