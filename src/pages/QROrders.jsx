import React, {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getQROrders,
    updateQROrderStatus,
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
// COMPONENT
// =========================================================

export default function QROrders() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [filter, setFilter] =
        useState("new");

    const [loading, setLoading] =
        useState(true);

    const [actionId, setActionId] =
        useState(null);


    // =========================================================
    // LOAD ORDERS
    // =========================================================

    const loadOrders = async () => {

        try {

            setLoading(true);

            const query =
                filter === "all"
                    ? ""
                    : `?status=${filter}`;

            const response =
                await getQROrders(query);

            console.log(
                "QR ORDERS:",
                response
            );

            setOrders(
                response?.data || []
            );

        } catch (error) {

            console.error(
                "Load QR Orders Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                error.message ||
                "Failed to load orders"
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
            clearInterval(timer);
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

            setActionId(order.id);

            await updateQROrderStatus(
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
                error.response?.data?.message ||
                error.message ||
                "Failed to update order"
            );

        } finally {

            setActionId(null);

        }
    };


    // =========================================================
    // CONFIRM PAYMENT
    // =========================================================

    const markPaid = async (
        order
    ) => {

        const confirmed =
            window.confirm(
                `Confirm that payment of ₹${Number(
                    order.total_amount
                ).toFixed(2)} has been received from the customer?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setActionId(order.id);

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
                error.response?.data?.message ||
                error.message ||
                "Failed to confirm payment"
            );

        } finally {

            setActionId(null);

        }
    };


    // =========================================================
    // REJECT ORDER
    // =========================================================

    const rejectOrder = async (
        order
    ) => {

        const confirmed =
            window.confirm(
                `Reject order #${order.order_no}?`
            );

        if (!confirmed) {
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
            statusLabels[status] ||
            status
        );
    };


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }

        try {

            return new Date(
                date
            ).toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

        } catch {

            return date;

        }
    };


    // =========================================================
    // MONEY
    // =========================================================

    const money = (
        value
    ) => {

        return `₹${Number(
            value || 0
        ).toFixed(2)}`;
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (
        loading &&
        orders.length === 0
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
                        onClick={loadOrders}
                        disabled={loading}
                    >
                        {loading
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

            </div>


            {/* =================================================
                STATUS FILTERS
            ================================================= */}

            <div className="order-filters">

                {statusFilters.map(
                    (status) => (

                        <button
                            key={status}

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

                            {status === "all"
                                ? "All"
                                : getStatusLabel(
                                    status
                                )}

                        </button>

                    )
                )}

            </div>


            {/* =================================================
                ORDERS
            ================================================= */}

            {orders.length === 0 ? (

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
                        className="empty-btn"
                        onClick={loadOrders}
                    >
                        Refresh Orders
                    </button>

                </div>

            ) : (

                <div className="orders-list">

                    {orders.map(
                        (order) => (

                            <div
                                className="order-card"
                                key={order.id}
                            >

                                {/* =================================
                                    ORDER HEADER
                                ================================= */}

                                <div className="order-card-header">

                                    <div>

                                        <strong>
                                            #
                                            {
                                                order.order_no
                                            }
                                        </strong>

                                        <span>
                                            Customer Order
                                        </span>

                                        <small>
                                            {
                                                formatDate(
                                                    order.created_at
                                                )
                                            }
                                        </small>

                                    </div>


                                    <span
                                        className={
                                            `order-status ${order.order_status}`
                                        }
                                    >
                                        {
                                            getStatusLabel(
                                                order.order_status
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
                                                order.customer_name ||
                                                "Customer"
                                            }
                                        </strong>

                                        {order.customer_phone && (

                                            <span>
                                                📞{" "}
                                                {
                                                    order.customer_phone
                                                }
                                            </span>

                                        )}

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
                                            order.payment_status ===
                                            "paid"
                                                ? "payment-paid"
                                                : order.payment_status ===
                                                  "failed"
                                                ? "payment-failed"
                                                : "payment-pending"
                                        }
                                    >

                                        {order.payment_status ===
                                        "paid"
                                            ? "✓ Paid"
                                            : order.payment_status ===
                                              "failed"
                                            ? "✕ Failed"
                                            : "Payment Pending"}

                                    </strong>

                                </div>


                                {/* =================================
                                    ITEMS
                                ================================= */}

                                <div className="order-items">

                                    <h3>
                                        Order Items
                                    </h3>

                                    {order.items &&
                                    order.items.length > 0 ? (

                                        order.items.map(
                                            (item) => (

                                                <div
                                                    className="order-item"
                                                    key={
                                                        item.id
                                                    }
                                                >

                                                    <div>

                                                        <strong>
                                                            {
                                                                item.product_name
                                                            }
                                                        </strong>

                                                        <span>

                                                            {
                                                                item.quantity
                                                            }

                                                            {" "}

                                                            {
                                                                item.unit ||
                                                                "pcs"
                                                            }

                                                            {" × "}

                                                            {money(
                                                                item.unit_price
                                                            )}

                                                        </span>

                                                    </div>


                                                    <strong>
                                                        {money(
                                                            item.total
                                                        )}
                                                    </strong>

                                                </div>

                                            )
                                        )

                                    ) : (

                                        <div className="no-items">
                                            No items found
                                        </div>

                                    )}

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
                                            {money(
                                                order.subtotal
                                            )}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Tax
                                        </span>

                                        <strong>
                                            {money(
                                                order.tax
                                            )}
                                        </strong>
                                    </div>


                                    <div className="grand-total">

                                        <span>
                                            Total
                                        </span>

                                        <strong>
                                            {money(
                                                order.total_amount
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                {/* =================================
                                    NOTES
                                ================================= */}

                                {order.notes && (

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

                                )}


                                {/* =================================
                                    ACTIONS
                                ================================= */}

                                <div className="order-actions">

                                    {/* =============================
                                        NEW
                                    ============================= */}

                                    {order.order_status ===
                                    "new" && (

                                        <>

                                            <button
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

                                                {actionId ===
                                                order.id
                                                    ? "Accepting..."
                                                    : "✓ Accept Order"}

                                            </button>

                                        </>

                                    )}


                                    {/* =============================
                                        ACCEPTED
                                    ============================= */}

                                    {order.order_status ===
                                    "accepted" && (

                                        <>

                                            {order.payment_status !==
                                            "paid" && (

                                                <button
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

                                                    {actionId ===
                                                    order.id
                                                        ? "Confirming..."
                                                        : "₹ Confirm Payment"}

                                                </button>

                                            )}


                                            {order.payment_status ===
                                            "paid" && (

                                                <button
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

                                            )}

                                        </>

                                    )}


                                    {/* =============================
                                        PROCESSING
                                    ============================= */}

                                    {order.order_status ===
                                    "processing" && (

                                        <button
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

                                    )}


                                    {/* =============================
                                        READY
                                    ============================= */}

                                    {order.order_status ===
                                    "ready" && (

                                        <button
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

                                    )}


                                    {/* =============================
                                        PAYMENT CONFIRMED
                                    ============================= */}

                                    {order.payment_status ===
                                    "paid" && (

                                        <span className="paid-badge">
                                            ✓ Payment Confirmed
                                        </span>

                                    )}


                                    {/* =============================
                                        COMPLETED
                                    ============================= */}

                                    {order.order_status ===
                                    "completed" && (

                                        <span className="completed-badge">
                                            ✓ Order Completed
                                        </span>

                                    )}


                                    {/* =============================
                                        REJECTED
                                    ============================= */}

                                    {order.order_status ===
                                    "rejected" && (

                                        <span className="rejected-badge">
                                            ✕ Order Rejected
                                        </span>

                                    )}


                                    {/* =============================
                                        CANCELLED
                                    ============================= */}

                                    {order.order_status ===
                                    "cancelled" && (

                                        <span className="cancelled-badge">
                                            Order Cancelled
                                        </span>

                                    )}

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}


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
                    background:
                        #f5f7fb;
                    color:
                        #172033;
                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;
                }


                /* =============================================
                   HEADER
                ============================================= */

                .orders-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 25px;
                }

                .page-eyebrow {
                    color:
                        #2563eb;
                    font-size:
                        12px;
                    font-weight:
                        700;
                    letter-spacing:
                        1px;
                    margin-bottom:
                        6px;
                }

                .orders-header h1 {
                    margin:
                        0 0 7px;
                    font-size:
                        32px;
                    font-weight:
                        700;
                }

                .orders-header p {
                    margin:
                        0;
                    color:
                        #6b7280;
                    font-size:
                        14px;
                }

                .header-actions {
                    display:
                        flex;
                    gap:
                        10px;
                    align-items:
                        center;
                    flex-wrap:
                        wrap;
                }

                .header-btn {
                    border:
                        1px solid #d1d5db;
                    background:
                        white;
                    color:
                        #374151;
                    padding:
                        10px 16px;
                    border-radius:
                        9px;
                    cursor:
                        pointer;
                    font-weight:
                        600;
                    transition:
                        0.2s;
                }

                .header-btn:hover {
                    transform:
                        translateY(-1px);
                    box-shadow:
                        0 3px 10px
                        rgba(
                            0,
                            0,
                            0,
                            0.08
                        );
                }

                .header-btn.blue {
                    background:
                        #2563eb;
                    color:
                        white;
                    border-color:
                        #2563eb;
                }

                .header-btn.dark {
                    background:
                        #111827;
                    color:
                        white;
                    border-color:
                        #111827;
                }


                /* =============================================
                   FILTERS
                ============================================= */

                .order-filters {
                    display:
                        flex;
                    gap:
                        8px;
                    flex-wrap:
                        wrap;
                    margin-bottom:
                        22px;
                }

                .filter {
                    border:
                        1px solid #d1d5db;
                    background:
                        white;
                    color:
                        #4b5563;
                    padding:
                        9px 15px;
                    border-radius:
                        8px;
                    cursor:
                        pointer;
                    font-weight:
                        600;
                    transition:
                        0.2s;
                }

                .filter:hover {
                    border-color:
                        #2563eb;
                }

                .filter.active {
                    background:
                        #111827;
                    color:
                        white;
                    border-color:
                        #111827;
                }


                /* =============================================
                   ORDERS LIST
                ============================================= */

                .orders-list {
                    display:
                        grid;
                    grid-template-columns:
                        repeat(
                            2,
                            minmax(
                                0,
                                1fr
                            )
                        );
                    gap:
                        18px;
                }

                .order-card {
                    background:
                        white;
                    border:
                        1px solid #e5e7eb;
                    border-radius:
                        15px;
                    overflow:
                        hidden;
                    box-shadow:
                        0 3px 12px
                        rgba(
                            0,
                            0,
                            0,
                            0.05
                        );
                }


                /* =============================================
                   ORDER HEADER
                ============================================= */

                .order-card-header {
                    display:
                        flex;
                    justify-content:
                        space-between;
                    align-items:
                        flex-start;
                    gap:
                        15px;
                    padding:
                        18px;
                    border-bottom:
                        1px solid #eef0f4;
                }

                .order-card-header strong {
                    display:
                        block;
                    font-size:
                        18px;
                    margin-bottom:
                        4px;
                }

                .order-card-header span {
                    display:
                        block;
                    color:
                        #6b7280;
                    font-size:
                        12px;
                }

                .order-card-header small {
                    display:
                        block;
                    color:
                        #9ca3af;
                    font-size:
                        11px;
                    margin-top:
                        5px;
                }


                /* =============================================
                   STATUS
                ============================================= */

                .order-status {
                    padding:
                        7px 11px !important;
                    border-radius:
                        20px;
                    font-size:
                        11px !important;
                    font-weight:
                        700;
                    text-transform:
                        uppercase;
                    white-space:
                        nowrap;
                }

                .order-status.new {
                    background:
                        #fff7ed;
                    color:
                        #c2410c;
                }

                .order-status.accepted {
                    background:
                        #eff6ff;
                    color:
                        #1d4ed8;
                }

                .order-status.processing {
                    background:
                        #f5f3ff;
                    color:
                        #6d28d9;
                }

                .order-status.ready {
                    background:
                        #ecfdf5;
                    color:
                        #047857;
                }

                .order-status.completed {
                    background:
                        #dcfce7;
                    color:
                        #15803d;
                }

                .order-status.rejected {
                    background:
                        #fee2e2;
                    color:
                        #b91c1c;
                }

                .order-status.cancelled {
                    background:
                        #f3f4f6;
                    color:
                        #6b7280;
                }


                /* =============================================
                   CUSTOMER
                ============================================= */

                .customer-info {
                    display:
                        flex;
                    align-items:
                        center;
                    gap:
                        12px;
                    padding:
                        15px 18px;
                    background:
                        #fafbfc;
                    border-bottom:
                        1px solid #eef0f4;
                }

                .customer-icon {
                    width:
                        40px;
                    height:
                        40px;
                    display:
                        flex;
                    align-items:
                        center;
                    justify-content:
                        center;
                    border-radius:
                        50%;
                    background:
                        #e0edff;
                    font-size:
                        18px;
                }

                .customer-info strong {
                    display:
                        block;
                    font-size:
                        14px;
                }

                .customer-info span {
                    display:
                        block;
                    margin-top:
                        4px;
                    color:
                        #6b7280;
                    font-size:
                        12px;
                }


                /* =============================================
                   PAYMENT
                ============================================= */

                .payment-status-row {
                    display:
                        flex;
                    justify-content:
                        space-between;
                    align-items:
                        center;
                    padding:
                        12px 18px;
                    border-bottom:
                        1px solid #eef0f4;
                    font-size:
                        13px;
                }

                .payment-paid {
                    background:
                        #dcfce7;
                    color:
                        #166534;
                    padding:
                        5px 10px;
                    border-radius:
                        15px;
                    font-size:
                        11px;
                }

                .payment-pending {
                    background:
                        #fef3c7;
                    color:
                        #92400e;
                    padding:
                        5px 10px;
                    border-radius:
                        15px;
                    font-size:
                        11px;
                }

                .payment-failed {
                    background:
                        #fee2e2;
                    color:
                        #991b1b;
                    padding:
                        5px 10px;
                    border-radius:
                        15px;
                    font-size:
                        11px;
                }


                /* =============================================
                   ITEMS
                ============================================= */

                .order-items {
                    padding:
                        17px 18px;
                }

                .order-items h3 {
                    margin:
                        0 0 12px;
                    font-size:
                        14px;
                }

                .order-item {
                    display:
                        flex;
                    justify-content:
                        space-between;
                    align-items:
                        center;
                    gap:
                        15px;
                    padding:
                        10px 0;
                    border-bottom:
                        1px dashed #e5e7eb;
                }

                .order-item:last-child {
                    border-bottom:
                        none;
                }

                .order-item strong {
                    font-size:
                        13px;
                }

                .order-item span {
                    display:
                        block;
                    color:
                        #6b7280;
                    font-size:
                        11px;
                    margin-top:
                        4px;
                }

                .no-items {
                    color:
                        #9ca3af;
                    font-size:
                        13px;
                }


                /* =============================================
                   TOTAL
                ============================================= */

                .order-total {
                    padding:
                        15px 18px;
                    background:
                        #fafbfc;
                    border-top:
                        1px solid #eef0f4;
                }

                .order-total > div {
                    display:
                        flex;
                    justify-content:
                        space-between;
                    padding:
                        5px 0;
                    font-size:
                        13px;
                }

                .grand-total {
                    border-top:
                        1px solid #dfe3e8;
                    margin-top:
                        8px;
                    padding-top:
                        12px !important;
                    font-size:
                        17px !important;
                }


                /* =============================================
                   NOTES
                ============================================= */

                .order-notes {
                    margin:
                        0 18px;
                    padding:
                        10px 12px;
                    background:
                        #fffbeb;
                    border:
                        1px solid #fde68a;
                    border-radius:
                        8px;
                    display:
                        flex;
                    gap:
                        8px;
                    font-size:
                        12px;
                }

                .order-notes span {
                    color:
                        #6b7280;
                }


                /* =============================================
                   ACTIONS
                ============================================= */

                .order-actions {
                    display:
                        flex;
                    gap:
                        8px;
                    flex-wrap:
                        wrap;
                    align-items:
                        center;
                    padding:
                        15px 18px 18px;
                }

                .order-actions button {
                    border:
                        none;
                    border-radius:
                        8px;
                    padding:
                        10px 14px;
                    cursor:
                        pointer;
                    font-size:
                        12px;
                    font-weight:
                        700;
                    transition:
                        0.2s;
                }

                .order-actions button:hover {
                    transform:
                        translateY(-1px);
                }

                .order-actions button:disabled {
                    opacity:
                        0.55;
                    cursor:
                        not-allowed;
                    transform:
                        none;
                }

                .reject-btn {
                    background:
                        #fee2e2;
                    color:
                        #b91c1c;
                }

                .accept-btn {
                    background:
                        #16a34a;
                    color:
                        white;
                }

                .payment-btn {
                    background:
                        #2563eb;
                    color:
                        white;
                }

                .primary-btn {
                    background:
                        #7c3aed;
                    color:
                        white;
                }

                .paid-badge {
                    background:
                        #dcfce7;
                    color:
                        #166534;
                    padding:
                        7px 10px;
                    border-radius:
                        7px;
                    font-size:
                        11px;
                    font-weight:
                        700;
                }

                .completed-badge {
                    background:
                        #dcfce7;
                    color:
                        #15803d;
                    padding:
                        7px 10px;
                    border-radius:
                        7px;
                    font-size:
                        11px;
                    font-weight:
                        700;
                }

                .rejected-badge {
                    background:
                        #fee2e2;
                    color:
                        #b91c1c;
                    padding:
                        7px 10px;
                    border-radius:
                        7px;
                    font-size:
                        11px;
                    font-weight:
                        700;
                }

                .cancelled-badge {
                    background:
                        #f3f4f6;
                    color:
                        #6b7280;
                    padding:
                        7px 10px;
                    border-radius:
                        7px;
                    font-size:
                        11px;
                    font-weight:
                        700;
                }


                /* =============================================
                   EMPTY / LOADING
                ============================================= */

                .qr-loading-page,
                .empty-orders {
                    min-height:
                        400px;
                    background:
                        white;
                    border:
                        1px solid #e5e7eb;
                    border-radius:
                        15px;
                    display:
                        flex;
                    flex-direction:
                        column;
                    justify-content:
                        center;
                    align-items:
                        center;
                    text-align:
                        center;
                    padding:
                        40px;
                    margin:
                        20px;
                }

                .qr-loading-page h2,
                .empty-orders h2 {
                    margin:
                        10px 0 7px;
                }

                .qr-loading-page p,
                .empty-orders p {
                    color:
                        #6b7280;
                    margin:
                        0 0 20px;
                }

                .loading-spinner {
                    font-size:
                        40px;
                    animation:
                        spin 1s linear infinite;
                }

                @keyframes spin {

                    from {
                        transform:
                            rotate(0deg);
                    }

                    to {
                        transform:
                            rotate(360deg);
                    }

                }

                .empty-icon {
                    font-size:
                        50px;
                }

                .empty-btn {
                    border:
                        none;
                    background:
                        #111827;
                    color:
                        white;
                    padding:
                        10px 18px;
                    border-radius:
                        8px;
                    cursor:
                        pointer;
                    font-weight:
                        600;
                }


                /* =============================================
                   RESPONSIVE
                ============================================= */

                @media (
                    max-width: 1000px
                ) {

                    .orders-list {
                        grid-template-columns:
                            1fr;
                    }

                }


                @media (
                    max-width: 700px
                ) {

                    .qr-orders-page {
                        padding:
                            14px;
                    }

                    .orders-header {
                        flex-direction:
                            column;
                    }

                    .header-actions {
                        width:
                            100%;
                    }

                    .header-btn {
                        flex:
                            1;
                    }

                    .order-card-header {
                        flex-direction:
                            column;
                    }

                }


                @media (
                    max-width: 450px
                ) {

                    .header-actions {
                        flex-direction:
                            column;
                    }

                    .header-btn {
                        width:
                            100%;
                    }

                    .order-filters {
                        display:
                            grid;
                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );
                    }

                    .filter {
                        width:
                            100%;
                    }

                    .order-actions {
                        flex-direction:
                            column;
                        align-items:
                            stretch;
                    }

                    .order-actions button {
                        width:
                            100%;
                    }

                }

            `}</style>

        </div>

    );
}