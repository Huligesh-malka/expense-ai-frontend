import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getQROrders,
    updateQROrdOrderStatus,
    updateQRPayment
} from "../services/qrOrderApi";


// =========================================================
// ORDER STATUSES
// =========================================================

const statusFilters = [
    "new",
    "accepted",
    "processing",
    "ready",
    "completed",
    "rejected",
    "cancelled",
    "all"
];

const statusLabels = {
    new: "New",
    accepted: "Accepted",
    processing: "Processing",
    ready: "Ready",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled"
};


// =========================================================
// FIND ORDERS ARRAY SAFELY
// =========================================================

function extractOrders(response) {

    console.log(
        "QR ORDERS RAW RESPONSE:",
        response
    );


    // -----------------------------------------
    // Direct array
    // -----------------------------------------

    if (
        Array.isArray(response)
    ) {

        return response;

    }


    // -----------------------------------------
    // Axios response
    //
    // response.data
    // -----------------------------------------

    const axiosData =
        response?.data;


    if (
        Array.isArray(axiosData)
    ) {

        return axiosData;

    }


    // -----------------------------------------
    // response.data.data
    // -----------------------------------------

    if (
        Array.isArray(
            axiosData?.data
        )
    ) {

        return axiosData.data;

    }


    // -----------------------------------------
    // response.data.data.data
    // -----------------------------------------

    if (
        Array.isArray(
            axiosData?.data?.data
        )
    ) {

        return axiosData.data.data;

    }


    // -----------------------------------------
    // response.data.orders
    // -----------------------------------------

    if (
        Array.isArray(
            axiosData?.orders
        )
    ) {

        return axiosData.orders;

    }


    // -----------------------------------------
    // response.data.data.orders
    // -----------------------------------------

    if (
        Array.isArray(
            axiosData?.data?.orders
        )
    ) {

        return axiosData.data.orders;

    }


    // -----------------------------------------
    // response.orders
    // -----------------------------------------

    if (
        Array.isArray(
            response?.orders
        )
    ) {

        return response.orders;

    }


    // -----------------------------------------
    // Nothing found
    // -----------------------------------------

    console.warn(
        "QR ORDERS: No array found in response",
        response
    );

    return [];

}


// =========================================================
// COMPONENT
// =========================================================

export default function QROrders() {

    const navigate = useNavigate();


    // ALWAYS START AS ARRAY

    const [orders, setOrders] =
        useState([]);


    const [filter, setFilter] =
        useState("new");


    const [loading, setLoading] =
        useState(true);


    const [actionId, setActionId] =
        useState(null);


    const [errorMessage, setErrorMessage] =
        useState("");


    // =========================================================
    // LOAD ORDERS
    // =========================================================

    const loadOrders = async () => {

        try {

            setLoading(true);

            setErrorMessage("");


            const query =
                filter === "all"
                    ? ""
                    : `?status=${encodeURIComponent(
                        filter
                    )}`;


            const response =
                await getQROrders(
                    query
                );


            console.log(
                "QR ORDERS:",
                response
            );


            // -----------------------------------------
            // IMPORTANT
            //
            // Never directly do:
            //
            // setOrders(response.data)
            //
            // because response.data may be an object.
            // -----------------------------------------

            const receivedOrders =
                extractOrders(
                    response
                );


            console.log(
                "QR ORDERS ARRAY:",
                receivedOrders
            );


            // -----------------------------------------
            // FINAL SAFETY CHECK
            // -----------------------------------------

            if (
                Array.isArray(
                    receivedOrders
                )
            ) {

                setOrders(
                    receivedOrders
                );

            } else {

                setOrders([]);

            }

        } catch (error) {

            console.error(
                "Load QR Orders Error:",
                error
            );


            setOrders([]);


            setErrorMessage(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load QR orders"
            );

        } finally {

            setLoading(false);

        }

    };


    // =========================================================
    // AUTO REFRESH
    // =========================================================

    useEffect(() => {

        loadOrders();


        const timer =
            setInterval(
                loadOrders,
                5000
            );


        return () => {

            clearInterval(
                timer
            );

        };

    }, [filter]);


    // =========================================================
    // CHANGE ORDER STATUS
    // =========================================================

    const changeStatus = async (
        order,
        status
    ) => {

        try {

            if (
                !order?.id
            ) {

                alert(
                    "Order ID is missing."
                );

                return;

            }


            setActionId(
                order.id
            );


            await updateQROrdOrderStatus(
                order.id,
                status
            );


            await loadOrders();

        } catch (error) {

            console.error(
                "Change Order Status Error:",
                error
            );


            alert(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update order"
            );

        } finally {

            setActionId(
                null
            );

        }

    };


    // =========================================================
    // MARK PAYMENT PAID
    // =========================================================

    const markPaid = async (
        order
    ) => {

        const amount =
            Number(
                order?.total_amount || 0
            ).toFixed(2);


        const confirmed =
            window.confirm(
                `Confirm that payment of ₹${amount} has been received from the customer?`
            );


        if (
            !confirmed
        ) {

            return;

        }


        try {

            setActionId(
                order.id
            );


            await updateQRPayment(
                order.id,
                "UPI",
                "paid"
            );


            alert(
                "Payment confirmed successfully."
            );


            await loadOrders();

        } catch (error) {

            console.error(
                "Confirm Payment Error:",
                error
            );


            alert(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to confirm payment"
            );

        } finally {

            setActionId(
                null
            );

        }

    };


    // =========================================================
    // REJECT ORDER
    // =========================================================

    const rejectOrder = async (
        order
    ) => {

        const orderNumber =
            order?.order_no ||
            order?.id ||
            "";


        const confirmed =
            window.confirm(
                `Reject order #${orderNumber}?`
            );


        if (
            !confirmed
        ) {

            return;

        }


        await changeStatus(
            order,
            "rejected"
        );

    };


    // =========================================================
    // STATUS LABEL
    // =========================================================

    const getStatusLabel = (
        status
    ) => {

        return (
            statusLabels?.[status] ||
            status ||
            "Unknown"
        );

    };


    // =========================================================
    // DATE
    // =========================================================

    const formatDate = (
        date
    ) => {

        if (
            !date
        ) {

            return "-";

        }


        try {

            return new Date(
                date
            ).toLocaleString(
                "en-IN",
                {
                    dateStyle:
                        "medium",
                    timeStyle:
                        "short"
                }
            );

        } catch {

            return String(
                date
            );

        }

    };


    // =========================================================
    // MONEY
    // =========================================================

    const money = (
        value
    ) => {

        const number =
            Number(
                value || 0
            );


        return `₹${number.toFixed(2)}`;

    };


    // =========================================================
    // PAYMENT LABEL
    // =========================================================

    const getPaymentLabel = (
        status
    ) => {

        if (
            status === "paid"
        ) {

            return "✓ Paid";

        }


        if (
            status === "failed"
        ) {

            return "✕ Failed";

        }


        return "Payment Pending";

    };


    // =========================================================
    // SAFE ORDERS ARRAY
    // =========================================================

    const safeOrders =
        Array.isArray(
            orders
        )
            ? orders
            : [];


    // =========================================================
    // LOADING
    // =========================================================

    if (
        loading &&
        safeOrders.length === 0
    ) {

        return (

            <div className="qr-loading-page">

                <div className="loading-spinner">
                    ⟳
                </div>

                <h2>
                    Loading QR orders...
                </h2>

                <p>
                    Checking for new customer orders.
                </p>

            </div>

        );

    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="qr-orders-page">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="orders-header">

                <div>

                    <div className="page-eyebrow">
                        CUSTOMER ORDERS
                    </div>

                    <h1>
                        QR Orders
                    </h1>

                    <p>
                        Orders placed by customers
                        through your business QR code.
                    </p>

                </div>


                <div className="header-actions">

                    <button
                        type="button"
                        className="header-btn blue"
                        onClick={() =>
                            navigate(
                                "/qr-ordering"
                            )
                        }
                    >
                        QR Ordering
                    </button>


                    <button
                        type="button"
                        className="header-btn dark"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        Dashboard
                    </button>


                    <button
                        type="button"
                        className="header-btn"
                        onClick={
                            loadOrders
                        }
                        disabled={
                            loading
                        }
                    >

                        {
                            loading
                                ? "Refreshing..."
                                : "↻ Refresh"
                        }

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {
                errorMessage && (

                    <div className="error-box">

                        <strong>
                            Unable to load orders
                        </strong>

                        <span>
                            {errorMessage}
                        </span>

                        <button
                            type="button"
                            onClick={
                                loadOrders
                            }
                        >
                            Try Again
                        </button>

                    </div>

                )
            }


            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="order-filters">

                {
                    Array.isArray(
                        statusFilters
                    ) &&
                    statusFilters.map(
                        (status) => (

                            <button
                                type="button"
                                key={
                                    status
                                }
                                className={
                                    filter === status
                                        ? "filter active"
                                        : "filter"
                                }
                                onClick={() =>
                                    setFilter(
                                        status
                                    )
                                }
                            >

                                {
                                    status === "all"
                                        ? "All"
                                        : getStatusLabel(
                                            status
                                        )
                                }

                            </button>

                        )
                    )
                }

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="order-summary">

                <strong>
                    {
                        safeOrders.length
                    }
                </strong>

                <span>

                    {
                        filter === "all"
                            ? "total orders"
                            : `${getStatusLabel(
                                filter
                            ).toLowerCase()} orders`
                    }

                </span>

                <span className="live-dot">
                    ● Live
                </span>

            </div>


            {/* =================================================
                ORDERS
            ================================================= */}

            {
                safeOrders.length === 0 ? (

                    <div className="empty-orders">

                        <div className="empty-icon">
                            🛒
                        </div>

                        <h2>
                            No QR orders
                        </h2>

                        <p>
                            New customer orders will
                            appear here automatically.
                        </p>

                        <button
                            type="button"
                            className="empty-btn"
                            onClick={
                                loadOrders
                            }
                        >
                            Refresh Orders
                        </button>

                    </div>

                ) : (

                    <div className="orders-list">

                        {
                            safeOrders.map(
                                (
                                    order,
                                    orderIndex
                                ) => {

                                    const items =
                                        Array.isArray(
                                            order?.items
                                        )
                                            ? order.items
                                            : [];


                                    return (

                                        <div
                                            className="order-card"
                                            key={
                                                order?.id ||
                                                order?.order_no ||
                                                orderIndex
                                            }
                                        >


                                            {/* =================================
                                                HEADER
                                            ================================= */}

                                            <div className="order-card-header">

                                                <div>

                                                    <strong>

                                                        #

                                                        {
                                                            order?.order_no ||
                                                            order?.id ||
                                                            "N/A"
                                                        }

                                                    </strong>

                                                    <span>
                                                        Customer Order
                                                    </span>

                                                    <small>
                                                        {
                                                            formatDate(
                                                                order?.created_at
                                                            )
                                                        }
                                                    </small>

                                                </div>


                                                <span
                                                    className={
                                                        `order-status ${
                                                            order?.order_status ||
                                                            "new"
                                                        }`
                                                    }
                                                >

                                                    {
                                                        getStatusLabel(
                                                            order?.order_status ||
                                                            "new"
                                                        )
                                                    }

                                                </span>

                                            </div>


                                            {/* =================================
                                                CUSTOMER
                                            ================================= */}

                                            <div className="customer-info">

                                                <div className="customer-icon">
                                                    👤
                                                </div>

                                                <div>

                                                    <strong>
                                                        {
                                                            order?.customer_name ||
                                                            "Customer"
                                                        }
                                                    </strong>


                                                    {
                                                        order?.customer_phone && (

                                                            <span>
                                                                📞{" "}

                                                                {
                                                                    order.customer_phone
                                                                }
                                                            </span>

                                                        )
                                                    }

                                                </div>

                                            </div>


                                            {/* =================================
                                                PAYMENT
                                            ================================= */}

                                            <div className="payment-status-row">

                                                <span>
                                                    Payment
                                                </span>

                                                <strong
                                                    className={
                                                        order?.payment_status ===
                                                        "paid"
                                                            ? "payment-paid"
                                                            : order?.payment_status ===
                                                              "failed"
                                                            ? "payment-failed"
                                                            : "payment-pending"
                                                    }
                                                >

                                                    {
                                                        getPaymentLabel(
                                                            order?.payment_status
                                                        )
                                                    }

                                                </strong>

                                            </div>


                                            {/* =================================
                                                ITEMS
                                            ================================= */}

                                            <div className="order-items">

                                                <h3>
                                                    Order Items
                                                </h3>


                                                {
                                                    items.length > 0
                                                        ? (

                                                            items.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => {

                                                                    const quantity =
                                                                        Number(
                                                                            item?.quantity ||
                                                                            0
                                                                        );


                                                                    const unitPrice =
                                                                        Number(
                                                                            item?.unit_price ||
                                                                            0
                                                                        );


                                                                    const calculatedTotal =
                                                                        quantity *
                                                                        unitPrice;


                                                                    const itemTotal =
                                                                        item?.total ??
                                                                        calculatedTotal;


                                                                    return (

                                                                        <div
                                                                            className="order-item"
                                                                            key={
                                                                                item?.id ||
                                                                                `${order?.id}-${index}`
                                                                            }
                                                                        >

                                                                            <div>

                                                                                <strong>
                                                                                    {
                                                                                        item?.product_name ||
                                                                                        item?.name ||
                                                                                        "Product"
                                                                                    }
                                                                                </strong>

                                                                                <span>

                                                                                    {
                                                                                        quantity
                                                                                    }

                                                                                    {" "}

                                                                                    {
                                                                                        item?.unit ||
                                                                                        "pcs"
                                                                                    }

                                                                                    {" × "}

                                                                                    {
                                                                                        money(
                                                                                            unitPrice
                                                                                        )
                                                                                    }

                                                                                </span>

                                                                            </div>


                                                                            <strong>
                                                                                {
                                                                                    money(
                                                                                        itemTotal
                                                                                    )
                                                                                }
                                                                            </strong>

                                                                        </div>

                                                                    );

                                                                }
                                                            )

                                                        )
                                                        : (

                                                            <div className="no-items">
                                                                No items found
                                                            </div>

                                                        )
                                                }

                                            </div>


                                            {/* =================================
                                                TOTAL
                                            ================================= */}

                                            <div className="order-total">

                                                <div>

                                                    <span>
                                                        Subtotal
                                                    </span>

                                                    <strong>
                                                        {
                                                            money(
                                                                order?.subtotal
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Tax
                                                    </span>

                                                    <strong>
                                                        {
                                                            money(
                                                                order?.tax
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="grand-total">

                                                    <span>
                                                        Total
                                                    </span>

                                                    <strong>
                                                        {
                                                            money(
                                                                order?.total_amount
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* =================================
                                                NOTES
                                            ================================= */}

                                            {
                                                order?.notes && (

                                                    <div className="order-notes">

                                                        <strong>
                                                            Note:
                                                        </strong>

                                                        <span>
                                                            {
                                                                order.notes
                                                            }
                                                        </span>

                                                    </div>

                                                )
                                            }


                                            {/* =================================
                                                ACTIONS
                                            ================================= */}

                                            <div className="order-actions">


                                                {/* NEW */}

                                                {
                                                    order?.order_status ===
                                                    "new" && (

                                                        <>

                                                            <button
                                                                type="button"
                                                                className="reject-btn"
                                                                disabled={
                                                                    actionId ===
                                                                    order.id
                                                                }
                                                                onClick={() =>
                                                                    rejectOrder(
                                                                        order
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="accept-btn"
                                                                disabled={
                                                                    actionId ===
                                                                    order.id
                                                                }
                                                                onClick={() =>
                                                                    changeStatus(
                                                                        order,
                                                                        "accepted"
                                                                    )
                                                                }
                                                            >

                                                                {
                                                                    actionId ===
                                                                    order.id
                                                                        ? "Accepting..."
                                                                        : "✓ Accept Order"
                                                                }

                                                            </button>

                                                        </>

                                                    )
                                                }


                                                {/* ACCEPTED */}

                                                {
                                                    order?.order_status ===
                                                    "accepted" && (

                                                        <>

                                                            {
                                                                order?.payment_status !==
                                                                "paid" && (

                                                                    <button
                                                                        type="button"
                                                                        className="payment-btn"
                                                                        disabled={
                                                                            actionId ===
                                                                            order.id
                                                                        }
                                                                        onClick={() =>
                                                                            markPaid(
                                                                                order
                                                                            )
                                                                        }
                                                                    >

                                                                        {
                                                                            actionId ===
                                                                            order.id
                                                                                ? "Confirming..."
                                                                                : "₹ Confirm Payment"
                                                                        }

                                                                    </button>

                                                                )
                                                            }


                                                            {
                                                                order?.payment_status ===
                                                                "paid" && (

                                                                    <button
                                                                        type="button"
                                                                        className="primary-btn"
                                                                        disabled={
                                                                            actionId ===
                                                                            order.id
                                                                        }
                                                                        onClick={() =>
                                                                            changeStatus(
                                                                                order,
                                                                                "processing"
                                                                            )
                                                                        }
                                                                    >
                                                                        🔄 Start Processing
                                                                    </button>

                                                                )
                                                            }

                                                        </>

                                                    )
                                                }


                                                {/* PROCESSING */}

                                                {
                                                    order?.order_status ===
                                                    "processing" && (

                                                        <button
                                                            type="button"
                                                            className="primary-btn"
                                                            disabled={
                                                                actionId ===
                                                                order.id
                                                            }
                                                            onClick={() =>
                                                                changeStatus(
                                                                    order,
                                                                    "ready"
                                                                )
                                                            }
                                                        >
                                                            📦 Mark Ready
                                                        </button>

                                                    )
                                                }


                                                {/* READY */}

                                                {
                                                    order?.order_status ===
                                                    "ready" && (

                                                        <button
                                                            type="button"
                                                            className="primary-btn"
                                                            disabled={
                                                                actionId ===
                                                                order.id
                                                            }
                                                            onClick={() =>
                                                                changeStatus(
                                                                    order,
                                                                    "completed"
                                                                )
                                                            }
                                                        >
                                                            ✓ Complete Order
                                                        </button>

                                                    )
                                                }


                                                {/* PAYMENT PAID */}

                                                {
                                                    order?.payment_status ===
                                                    "paid" && (

                                                        <span className="paid-badge">
                                                            ✓ Payment Confirmed
                                                        </span>

                                                    )
                                                }


                                                {/* COMPLETED */}

                                                {
                                                    order?.order_status ===
                                                    "completed" && (

                                                        <span className="completed-badge">
                                                            ✓ Order Completed
                                                        </span>

                                                    )
                                                }


                                                {/* REJECTED */}

                                                {
                                                    order?.order_status ===
                                                    "rejected" && (

                                                        <span className="rejected-badge">
                                                            ✕ Order Rejected
                                                        </span>

                                                    )
                                                }


                                                {/* CANCELLED */}

                                                {
                                                    order?.order_status ===
                                                    "cancelled" && (

                                                        <span className="cancelled-badge">
                                                            Order Cancelled
                                                        </span>

                                                    )
                                                }

                                            </div>

                                        </div>

                                    );

                                }
                            )
                        }

                    </div>

                )
            }


            {/* =================================================
                CSS
            ================================================= */}

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .qr-orders-page {
                    min-height: 100vh;
                    padding: 25px;
                    background: #f5f7fb;
                    color: #172033;
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                }

                .orders-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 25px;
                }

                .page-eyebrow {
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    margin-bottom: 6px;
                }

                .orders-header h1 {
                    margin: 0 0 7px;
                    font-size: 32px;
                    font-weight: 700;
                }

                .orders-header p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .header-btn {
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #374151;
                    padding: 10px 16px;
                    border-radius: 9px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: 0.2s;
                }

                .header-btn:hover {
                    transform: translateY(-1px);
                    box-shadow:
                        0 3px 10px
                        rgba(0, 0, 0, 0.08);
                }

                .header-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    transform: none;
                }

                .header-btn.blue {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .header-btn.dark {
                    background: #111827;
                    color: white;
                    border-color: #111827;
                }

                .error-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 18px;
                    padding: 14px 16px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 10px;
                    color: #991b1b;
                }

                .error-box strong {
                    font-size: 13px;
                }

                .error-box span {
                    flex: 1;
                    font-size: 13px;
                }

                .error-box button {
                    border: none;
                    background: #991b1b;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .order-filters {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }

                .filter {
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #4b5563;
                    padding: 9px 15px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: 0.2s;
                }

                .filter:hover {
                    border-color: #2563eb;
                }

                .filter.active {
                    background: #111827;
                    color: white;
                    border-color: #111827;
                }

                .order-summary {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    margin-bottom: 20px;
                    color: #6b7280;
                    font-size: 13px;
                }

                .order-summary strong {
                    color: #111827;
                    font-size: 18px;
                }

                .live-dot {
                    margin-left: 8px;
                    color: #16a34a;
                    font-weight: 700;
                }

                .orders-list {
                    display: grid;
                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );
                    gap: 18px;
                }

                .order-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow:
                        0 3px 12px
                        rgba(0, 0, 0, 0.05);
                }

                .order-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 18px;
                    border-bottom: 1px solid #eef0f4;
                }

                .order-card-header strong {
                    display: block;
                    font-size: 18px;
                    margin-bottom: 4px;
                }

                .order-card-header span {
                    display: block;
                    color: #6b7280;
                    font-size: 12px;
                }

                .order-card-header small {
                    display: block;
                    color: #9ca3af;
                    font-size: 11px;
                    margin-top: 5px;
                }

                .order-status {
                    padding: 7px 11px !important;
                    border-radius: 20px;
                    font-size: 11px !important;
                    font-weight: 700;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                .order-status.new {
                    background: #fff7ed;
                    color: #c2410c;
                }

                .order-status.accepted {
                    background: #eff6ff;
                    color: #1d4ed8;
                }

                .order-status.processing {
                    background: #f5f3ff;
                    color: #6d28d9;
                }

                .order-status.ready {
                    background: #ecfdf5;
                    color: #047857;
                }

                .order-status.completed {
                    background: #dcfce7;
                    color: #15803d;
                }

                .order-status.rejected {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .order-status.cancelled {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .customer-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px 18px;
                    background: #fafbfc;
                    border-bottom: 1px solid #eef0f4;
                }

                .customer-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #e0edff;
                    font-size: 18px;
                }

                .customer-info strong {
                    display: block;
                    font-size: 14px;
                }

                .customer-info span {
                    display: block;
                    margin-top: 4px;
                    color: #6b7280;
                    font-size: 12px;
                }

                .payment-status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 18px;
                    border-bottom: 1px solid #eef0f4;
                    font-size: 13px;
                }

                .payment-paid {
                    background: #dcfce7;
                    color: #166534;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 11px;
                }

                .payment-pending {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 11px;
                }

                .payment-failed {
                    background: #fee2e2;
                    color: #991b1b;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 11px;
                }

                .order-items {
                    padding: 17px 18px;
                }

                .order-items h3 {
                    margin: 0 0 12px;
                    font-size: 14px;
                }

                .order-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    padding: 10px 0;
                    border-bottom: 1px dashed #e5e7eb;
                }

                .order-item:last-child {
                    border-bottom: none;
                }

                .order-item strong {
                    font-size: 13px;
                }

                .order-item span {
                    display: block;
                    color: #6b7280;
                    font-size: 11px;
                    margin-top: 4px;
                }

                .no-items {
                    color: #9ca3af;
                    font-size: 13px;
                }

                .order-total {
                    padding: 15px 18px;
                    background: #fafbfc;
                    border-top: 1px solid #eef0f4;
                }

                .order-total > div {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    font-size: 13px;
                }

                .grand-total {
                    border-top: 1px solid #dfe3e8;
                    margin-top: 8px;
                    padding-top: 12px !important;
                    font-size: 17px !important;
                }

                .order-notes {
                    margin: 0 18px;
                    padding: 10px 12px;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 8px;
                    display: flex;
                    gap: 8px;
                    font-size: 12px;
                }

                .order-notes span {
                    color: #6b7280;
                }

                .order-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    align-items: center;
                    padding: 15px 18px 18px;
                }

                .order-actions button {
                    border: none;
                    border-radius: 8px;
                    padding: 10px 14px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 700;
                    transition: 0.2s;
                }

                .order-actions button:hover {
                    transform: translateY(-1px);
                }

                .order-actions button:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    transform: none;
                }

                .reject-btn {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .accept-btn {
                    background: #16a34a;
                    color: white;
                }

                .payment-btn {
                    background: #2563eb;
                    color: white;
                }

                .primary-btn {
                    background: #7c3aed;
                    color: white;
                }

                .paid-badge,
                .completed-badge,
                .rejected-badge,
                .cancelled-badge {
                    padding: 7px 10px;
                    border-radius: 7px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .paid-badge {
                    background: #dcfce7;
                    color: #166534;
                }

                .completed-badge {
                    background: #dcfce7;
                    color: #15803d;
                }

                .rejected-badge {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .cancelled-badge {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .qr-loading-page,
                .empty-orders {
                    min-height: 400px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 15px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 40px;
                    margin: 20px 0;
                }

                .qr-loading-page h2,
                .empty-orders h2 {
                    margin: 10px 0 7px;
                }

                .qr-loading-page p,
                .empty-orders p {
                    color: #6b7280;
                    margin: 0 0 20px;
                }

                .loading-spinner {
                    font-size: 40px;
                    animation:
                        spin 1s linear infinite;
                }

                @keyframes spin {

                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }

                }

                .empty-icon {
                    font-size: 50px;
                }

                .empty-btn {
                    border: none;
                    background: #111827;
                    color: white;
                    padding: 10px 18px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }

                @media (
                    max-width: 1000px
                ) {

                    .orders-list {
                        grid-template-columns: 1fr;
                    }

                }

                @media (
                    max-width: 700px
                ) {

                    .qr-orders-page {
                        padding: 14px;
                    }

                    .orders-header {
                        flex-direction: column;
                    }

                    .header-actions {
                        width: 100%;
                    }

                    .header-btn {
                        flex: 1;
                    }

                    .order-card-header {
                        flex-direction: column;
                    }

                }

                @media (
                    max-width: 450px
                ) {

                    .header-actions {
                        flex-direction: column;
                    }

                    .header-btn {
                        width: 100%;
                    }

                    .order-filters {
                        display: grid;
                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );
                    }

                    .filter {
                        width: 100%;
                    }

                    .order-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .order-actions button {
                        width: 100%;
                    }

                    .order-notes {
                        flex-direction: column;
                    }

                }

            `}</style>

        </div>

    );

}