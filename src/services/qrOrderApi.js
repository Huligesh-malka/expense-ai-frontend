import API from "./api";
import axios from "axios";

// =====================================
// PUBLIC API
// =====================================
// Used only by customers scanning QR.
// No JWT.
// No automatic owner logout.
// =====================================

const PUBLIC_API = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "https://expense-ai-backend-0sh8.onrender.com/api",

    headers: {
        "Content-Type": "application/json",
    },

    timeout: 15000,
});


// =====================================
// OWNER QR CODE
// =====================================

export const getQR = () => {
    return API.get("/qr-order/qr");
};

export const updateQRStatus = (status) => {
    return API.put("/qr-order/qr/status", {
        status,
    });
};


// =====================================
// OWNER TABLES
// =====================================

export const getTables = () => {
    return API.get("/qr-order/tables");
};

export const createTable = (data) => {
    return API.post("/qr-order/tables", data);
};

export const updateTable = (id, data) => {
    return API.put(
        `/qr-order/tables/${id}`,
        data
    );
};

export const deleteTable = (id) => {
    return API.delete(
        `/qr-order/tables/${id}`
    );
};


// =====================================
// OWNER QR ORDERS
// =====================================

export const getQROrders = (params = "") => {
    return API.get(
        `/qr-order/orders${params}`
    );
};

export const getQROrder = (id) => {
    return API.get(
        `/qr-order/orders/${id}`
    );
};

export const updateQROrderStatus = (
    id,
    status
) => {
    return API.put(
        `/qr-order/orders/${id}/status`,
        {
            status,
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
            payment_status,
        }
    );
};


// =====================================
// PUBLIC CUSTOMER QR MENU
// =====================================
// NO LOGIN
// NO JWT
// =====================================

export const getPublicQRMenu = (token) => {
    return PUBLIC_API.get(
        `/qr-order/public/${encodeURIComponent(
            token
        )}/menu`
    );
};


// =====================================
// PUBLIC CUSTOMER PLACE ORDER
// =====================================

export const createQROrder = (data) => {
    return PUBLIC_API.post(
        "/qr-order/public/order",
        data
    );
};


export default API;