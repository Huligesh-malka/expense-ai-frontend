import React, {
    useEffect,
    useState
} from "react";

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

    const [orders, setOrders] =
        useState([]);

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
    //
    // Current flow:
    // Customer pays owner directly.
    // Owner confirms payment here.
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
    // REJECT
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
    // STATUS BADGE
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
    // LOADING
    // =========================================================

    if (loading && orders.length === 0) {

        return (

            <div className="empty-orders">

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


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

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


                <button
                    className="refresh-btn"
                    onClick={loadOrders}
                    disabled={loading}
                >

                    {loading
                        ? "Refreshing..."
                        : "↻ Refresh"}

                </button>

            </div>



            {/* ================================================= */}
            {/* STATUS FILTERS */}
            {/* ================================================= */}

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
                                setFilter(status)
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



            {/* ================================================= */}
            {/* ORDERS */}
            {/* ================================================= */}

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

                </div>

            ) : (

                <div className="orders-list">

                    {orders.map(
                        (order) => (

                            <div
                                className="order-card"
                                key={order.id}
                            >


                                {/* ================================= */}
                                {/* HEADER */}
                                {/* ================================= */}

                                <div className="order-card-header">

                                    <div>

                                        <strong>
                                            #{order.order_no}
                                        </strong>

                                        <span>
                                            Customer Order
                                        </span>

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



                                {/* ================================= */}
                                {/* CUSTOMER */}
                                {/* ================================= */}

                                {(order.customer_name ||
                                    order.customer_phone) && (

                                    <div className="customer-info">

                                        <strong>
                                            {
                                                order.customer_name ||
                                                "Customer"
                                            }
                                        </strong>


                                        {order.customer_phone && (

                                            <span>
                                                {
                                                    order.customer_phone
                                                }
                                            </span>

                                        )}

                                    </div>

                                )}



                                {/* ================================= */}
                                {/* PAYMENT STATUS */}
                                {/* ================================= */}

                                <div className="payment-status-row">

                                    <span>
                                        Payment
                                    </span>


                                    <strong
                                        className={
                                            order.payment_status ===
                                                "paid"
                                                ? "payment-paid"
                                                : "payment-pending"
                                        }
                                    >

                                        {order.payment_status ===
                                            "paid"
                                            ? "✓ Paid"
                                            : "Payment Pending"}

                                    </strong>

                                </div>



                                {/* ================================= */}
                                {/* ITEMS */}
                                {/* ================================= */}

                                <div className="order-items">

                                    {order.items?.map(
                                        (item) => (

                                            <div
                                                className="order-item"
                                                key={item.id}
                                            >

                                                <div>

                                                    <strong>
                                                        {
                                                            item.product_name
                                                        }
                                                    </strong>


                                                    <span>

                                                        {item.quantity}

                                                        {" "}

                                                        {item.unit || "pcs"}

                                                        {" × ₹"}

                                                        {Number(
                                                            item.unit_price
                                                        ).toFixed(2)}

                                                    </span>

                                                </div>


                                                <strong>

                                                    ₹

                                                    {Number(
                                                        item.total
                                                    ).toFixed(2)}

                                                </strong>

                                            </div>

                                        )
                                    )}

                                </div>



                                {/* ================================= */}
                                {/* TOTAL */}
                                {/* ================================= */}

                                <div className="order-total">

                                    <span>
                                        Total
                                    </span>

                                    <strong>

                                        ₹

                                        {Number(
                                            order.total_amount
                                        ).toFixed(2)}

                                    </strong>

                                </div>



                                {/* ================================= */}
                                {/* NOTES */}
                                {/* ================================= */}

                                {order.notes && (

                                    <div className="order-notes">

                                        <strong>
                                            Note:
                                        </strong>

                                        <span>
                                            {order.notes}
                                        </span>

                                    </div>

                                )}



                                {/* ================================= */}
                                {/* ACTIONS */}
                                {/* ================================= */}

                                <div className="order-actions">


                                    {/* -------------------------------- */}
                                    {/* NEW */}
                                    {/* -------------------------------- */}

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
                                                    : "Accept Order"}

                                            </button>

                                        </>

                                    )}



                                    {/* -------------------------------- */}
                                    {/* ACCEPTED */}
                                    {/* -------------------------------- */}

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
                                                        : "Confirm Payment"}

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

                                                    Start Processing

                                                </button>

                                            )}

                                        </>

                                    )}



                                    {/* -------------------------------- */}
                                    {/* PROCESSING */}
                                    {/* -------------------------------- */}

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

                                            Mark Ready

                                        </button>

                                    )}



                                    {/* -------------------------------- */}
                                    {/* READY */}
                                    {/* -------------------------------- */}

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

                                            Complete Order

                                        </button>

                                    )}



                                    {/* -------------------------------- */}
                                    {/* PAID INDICATOR */}
                                    {/* -------------------------------- */}

                                    {order.payment_status ===
                                        "paid" && (

                                        <span className="paid-badge">
                                            ✓ Payment Confirmed
                                        </span>

                                    )}

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

        </div>
    );
}