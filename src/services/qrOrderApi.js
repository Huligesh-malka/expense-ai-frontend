import API from "./api";

// =====================================
// QR CODE
// =====================================

export const getQR = () => {
    return API.get("/qr-order/qr");
};

export const updateQRStatus = (status) => {
    return API.put("/qr-order/qr/status", {
        status
    });
};


// =====================================
// TABLES
// =====================================

export const getTables = () => {
    return API.get("/qr-order/tables");
};

export const createTable = (data) => {
    return API.post("/qr-order/tables", data);
};

export const updateTable = (id, data) => {
    return API.put(`/qr-order/tables/${id}`, data);
};

export const deleteTable = (id) => {
    return API.delete(`/qr-order/tables/${id}`);
};


// =====================================
// QR ORDERS
// =====================================

export const getQROrders = (params = "") => {
    return API.get(`/qr-order/orders${params}`);
};

export const getQROrder = (id) => {
    return API.get(`/qr-order/orders/${id}`);
};

export const updateQROrderStatus = (
    id,
    status
) => {
    return API.put(
        `/qr-order/orders/${id}/status`,
        {
            status
        }
    );
};

export const updateQRPayment = (
    id,
    payment_method,
    payment_status
) => {
    return API.put(
        `/qr-order/orders/${id}/payment`,
        {
            payment_method,
            payment_status
        }
    );
};


// =====================================
// PUBLIC CUSTOMER QR
// =====================================

export const getPublicQRMenu = (token) => {
    return API.get(
        `/qr-order/public/${token}/menu`
    );
};

export const createQROrder = (data) => {
    return API.post(
        "/qr-order/public/order",
        data
    );
};