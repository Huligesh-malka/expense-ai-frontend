import React, { useEffect, useState } from "react";

import {
    getQROrders,
    updateQROrderStatus,
    updateQRPayment
} from "../api/qrOrderApi";

const statusButtons = [
    "new",
    "accepted",
    "preparing",
    "ready",
    "served",
    "completed"
];

export default function QROrders() {

    const [orders, setOrders] = useState([]);

    const [filter, setFilter] =
        useState("new");

    const [loading, setLoading] =
        useState(true);


    const loadOrders = async () => {

        try {

            const query =
                filter === "all"
                    ? ""
                    : `?status=${filter}`;

            const response =
                await getQROrders(query);

            setOrders(response.data || []);

        } catch (error) {

            console.error(error);
            alert(error.message);

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        loadOrders();

        // Automatically refresh
        // for live restaurant orders.
        const timer = setInterval(
            loadOrders,
            5000
        );

        return () =>
            clearInterval(timer);

    }, [filter]);


    const changeStatus = async (
        order,
        status
    ) => {

        try {

            await updateQROrderStatus(
                order.id,
                status
            );

            await loadOrders();

        } catch (error) {

            alert(error.message);

        }
    };


    const markPaid = async (order) => {

        try {

            await updateQRPayment(
                order.id,
                "Cash",
                "paid"
            );

            await loadOrders();

        } catch (error) {

            alert(error.message);

        }
    };


    return (
        <div className="qr-orders-page">

            <div className="orders-header">

                <div>

                    <h1>QR Orders</h1>

                    <p>
                        Orders received from
                        restaurant QR menu.
                    </p>

                </div>


                <button
                    className="refresh-btn"
                    onClick={loadOrders}
                >
                    ↻ Refresh
                </button>

            </div>


            {/* FILTERS */}

            <div className="order-filters">

                {[
                    "new",
                    "accepted",
                    "preparing",
                    "ready",
                    "served",
                    "completed",
                    "all"
                ].map((status) => (

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
                        {status === "new"
                            ? "New"
                            : status === "all"
                                ? "All"
                                : status
                                    .charAt(0)
                                    .toUpperCase() +
                                  status.slice(1)}
                    </button>

                ))}

            </div>


            {/* ORDERS */}

            {loading ? (

                <div className="empty-orders">
                    Loading orders...
                </div>

            ) : orders.length === 0 ? (

                <div className="empty-orders">

                    <div className="empty-icon">
                        🛎️
                    </div>

                    <h2>
                        No QR orders
                    </h2>

                    <p>
                        New customer orders
                        will appear here.
                    </p>

                </div>

            ) : (

                <div className="orders-list">

                    {orders.map((order) => (

                        <div
                            className="order-card"
                            key={order.id}
                        >

                            {/* HEADER */}

                            <div className="order-card-header">

                                <div>

                                    <strong>
                                        #{order.order_no}
                                    </strong>

                                    <span>
                                        Table{" "}
                                        {order.table_number}
                                    </span>

                                </div>


                                <span
                                    className={`order-status ${order.order_status}`}
                                >
                                    {order.order_status}
                                </span>

                            </div>


                            {/* CUSTOMER */}

                            {(order.customer_name ||
                              order.customer_phone) && (

                                <div className="customer-info">

                                    <strong>
                                        {order.customer_name ||
                                            "Customer"}
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


                            {/* ITEMS */}

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
                                                    {
                                                        item.quantity
                                                    }{" "}
                                                    {
                                                        item.unit
                                                    } × ₹
                                                    {
                                                        Number(
                                                            item.unit_price
                                                        ).toFixed(2)
                                                    }
                                                </span>

                                            </div>


                                            <strong>
                                                ₹
                                                {
                                                    Number(
                                                        item.total
                                                    ).toFixed(2)
                                                }
                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>


                            {/* TOTAL */}

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


                            {/* NOTES */}

                            {order.notes && (

                                <div className="order-notes">

                                    <strong>
                                        Note:
                                    </strong>

                                    {order.notes}

                                </div>

                            )}


                            {/* ACTIONS */}

                            <div className="order-actions">

                                {order.order_status ===
                                    "new" && (

                                    <>
                                        <button
                                            className="reject-btn"
                                            onClick={() =>
                                                changeStatus(
                                                    order,
                                                    "rejected"
                                                )
                                            }
                                        >
                                            Reject
                                        </button>

                                        <button
                                            className="accept-btn"
                                            onClick={() =>
                                                changeStatus(
                                                    order,
                                                    "accepted"
                                                )
                                            }
                                        >
                                            Accept Order
                                        </button>
                                    </>

                                )}


                                {order.order_status ===
                                    "accepted" && (

                                    <button
                                        className="primary-btn"
                                        onClick={() =>
                                            changeStatus(
                                                order,
                                                "preparing"
                                            )
                                        }
                                    >
                                        Start Preparing
                                    </button>

                                )}


                                {order.order_status ===
                                    "preparing" && (

                                    <button
                                        className="primary-btn"
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


                                {order.order_status ===
                                    "ready" && (

                                    <button
                                        className="primary-btn"
                                        onClick={() =>
                                            changeStatus(
                                                order,
                                                "served"
                                            )
                                        }
                                    >
                                        Mark Served
                                    </button>

                                )}


                                {order.order_status ===
                                    "served" && (

                                    <button
                                        className="primary-btn"
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


                                {order.payment_status !==
                                    "paid" && (

                                    <button
                                        className="payment-btn"
                                        onClick={() =>
                                            markPaid(order)
                                        }
                                    >
                                        Mark Paid
                                    </button>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}