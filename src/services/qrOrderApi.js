const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        ""
    );
};

const request = async (url, options = {}) => {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Something went wrong"
        );
    }

    return data;
};


// ==========================================
// OWNER
// ==========================================

export const getQR = () =>
    request("/qr-order/qr");

export const updateQRStatus = (status) =>
    request("/qr-order/qr/status", {
        method: "PUT",
        body: JSON.stringify({ status })
    });


// ==========================================
// TABLES
// ==========================================

export const getTables = () =>
    request("/qr-order/tables");

export const createTable = (data) =>
    request("/qr-order/tables", {
        method: "POST",
        body: JSON.stringify(data)
    });

export const updateTable = (id, data) =>
    request(`/qr-order/tables/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });

export const deleteTable = (id) =>
    request(`/qr-order/tables/${id}`, {
        method: "DELETE"
    });


// ==========================================
// QR ORDERS
// ==========================================

export const getQROrders = (params = "") =>
    request(`/qr-order/orders${params}`);

export const getQROrder = (id) =>
    request(`/qr-order/orders/${id}`);

export const updateQROrderStatus = (id, status) =>
    request(`/qr-order/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
    });

export const updateQRPayment = (
    id,
    payment_method,
    payment_status
) =>
    request(`/qr-order/orders/${id}/payment`, {
        method: "PUT",
        body: JSON.stringify({
            payment_method,
            payment_status
        })
    });


// ==========================================
// CUSTOMER PUBLIC
// ==========================================

export const getPublicQRMenu = (token) =>
    request(`/qr-order/public/${token}/menu`, {
        headers: {
            // Public request
            Authorization: ""
        }
    });

export const createQROrder = (data) =>
    request("/qr-order/public/order", {
        method: "POST",
        headers: {
            Authorization: ""
        },
        body: JSON.stringify(data)
    });