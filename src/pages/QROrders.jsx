
import React, { useCallback, useEffect, useState } from "react";
import {
  getQROrders,
  updateQROrderStatus,
  updateQRPayment,
} from "../services/qrOrderApi";

const styles = `
.qro-page{min-height:100vh;background:#f5f6fb;padding:26px;color:#17182b;font-family:Inter,system-ui,sans-serif}
.qro-page *{box-sizing:border-box}
.qro-wrap{max-width:1250px;margin:auto}
.qro-header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.qro-header h1{font-size:28px;margin:0;font-weight:800;letter-spacing:-.8px}
.qro-sub{color:#8589a2;margin:7px 0 0;font-size:14px}
.qro-button{border:0;border-radius:11px;padding:11px 16px;font-weight:700;cursor:pointer;transition:.2s}
.qro-button:disabled{opacity:.55;cursor:not-allowed}
.qro-refresh{background:white;border:1px solid #e8e9f2;color:#555875}
.qro-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:22px}
.qro-stat{background:white;border:1px solid #ebecf4;border-radius:17px;padding:20px;box-shadow:0 5px 18px #27275008}
.qro-stat span{font-size:12px;color:#8387a1;font-weight:700}
.qro-stat strong{display:block;font-size:27px;margin-top:10px;letter-spacing:-.7px}
.qro-stat small{display:block;color:#999db0;margin-top:5px}
.qro-card{background:#fff;border:1px solid #e9eaf3;border-radius:18px;margin-bottom:16px;padding:21px;box-shadow:0 6px 20px #27275008}
.qro-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.qro-toolbar h2{font-size:18px;margin:0}
.qro-filters{display:flex;gap:8px;flex-wrap:wrap}
.qro-filter{border:1px solid #e8e9f2;background:#fff;color:#71758e;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;text-transform:capitalize}
.qro-filter.active{background:#6d5dfc;color:white;border-color:#6d5dfc}
.qro-orders{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.qro-order{border:1px solid #e9eaf3;border-radius:16px;overflow:hidden;background:white;min-width:0}
.qro-order-top{padding:17px 18px;display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #f0f0f6}
.qro-number{font-weight:800;font-size:15px}
.qro-muted{font-size:12px;color:#9296ab;margin-top:5px}
.qro-badge{display:inline-flex;align-items:center;height:27px;padding:0 10px;border-radius:30px;font-size:11px;font-weight:800;text-transform:capitalize;white-space:nowrap}
.qro-b-new{background:#fff4dc;color:#a86b00}
.qro-b-accepted{background:#eeeaff;color:#6552d9}
.qro-b-processing{background:#e9f3ff;color:#2672ca}
.qro-b-ready{background:#e6f8ef;color:#168858}
.qro-b-completed{background:#e4f8ed;color:#138653}
.qro-b-rejected,.qro-b-cancelled{background:#ffebed;color:#cf4353}
.qro-b-default{background:#f0f1f6;color:#777b91}
.qro-order-body{padding:18px}
.qro-items-title{font-size:11px;font-weight:800;color:#8b8fa5;text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px}
.qro-item{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px dashed #ededf4;font-size:13px}
.qro-item:last-child{border-bottom:0}
.qro-item-name{font-weight:600;overflow-wrap:anywhere}
.qro-item-sub{font-size:11px;color:#9296aa;margin-top:3px}
.qro-total{display:flex;justify-content:space-between;align-items:center;padding:14px;margin-top:12px;border-radius:12px;background:#f7f6ff}
.qro-total span{font-size:12px;color:#777b93;font-weight:700}
.qro-total strong{font-size:22px;color:#5141df}
.qro-info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.qro-info-box{background:#fafaff;border:1px solid #eeeef6;border-radius:11px;padding:11px;min-width:0}
.qro-info-box span{display:block;color:#9296aa;font-size:11px;margin-bottom:5px}
.qro-info-box strong{font-size:12px;overflow-wrap:anywhere}
.qro-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:17px}
.qro-accept{background:#6d5dfc;color:white}
.qro-reject{background:#fff0f1;color:#d54453;border:1px solid #ffdcdf}
.qro-pay{background:#15a66a;color:white}
.qro-done{background:#e7f8ef;color:#168858;cursor:default}
.qro-hint{background:#f8f7ff;border:1px solid #eeebff;color:#777092;border-radius:11px;padding:11px 12px;font-size:12px;margin-top:13px;line-height:1.5}
.qro-empty,.qro-loading{padding:48px 15px;text-align:center;color:#898da3}
.qro-empty strong{display:block;color:#34364d;font-size:17px;margin-bottom:6px}
.qro-error{background:#fff0f1;color:#c63f50;padding:13px;border-radius:10px;margin-bottom:15px;font-size:13px}
@media(max-width:900px){.qro-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.qro-orders{grid-template-columns:1fr}}
@media(max-width:520px){.qro-page{padding:15px}.qro-header h1{font-size:23px}.qro-grid{gap:9px}.qro-stat{padding:14px}.qro-stat strong{font-size:23px}.qro-card{padding:14px}.qro-order-top,.qro-order-body{padding:14px}.qro-actions .qro-button{flex:1 1 100%}}
`;

const unwrapOrders = (res) => {
  if (Array.isArray(res)) return res;
  const candidates = [
    res?.data,
    res?.data?.data,
    res?.data?.data?.data,
    res?.data?.orders,
    res?.data?.data?.orders,
    res?.orders,
  ];
  return candidates.find(Array.isArray) || [];
};

const normalStatus = (order) =>
  String(order?.status || order?.order_status || "new")
    .toLowerCase()
    .replaceAll(" ", "_");

const normalPayment = (order) =>
  String(order?.payment_status || "pending").toLowerCase();

const money = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

const getOrderItems = (order) => {
  const raw = order?.items || order?.order_items || order?.products || [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function QROrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("new");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      const query =
        filter === "all"
          ? ""
          : `?status=${encodeURIComponent(filter)}`;

      const response = await getQROrders(query);
      setOrders(unwrapOrders(response));
    } catch (err) {
      console.error("Failed to load QR orders:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not load QR orders."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOrders(true);
    const timer = setInterval(() => loadOrders(false), 15000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const performStatusChange = async (order, nextStatus) => {
    if (!order?.id || actionId !== null) return;

    const label = order.order_no || order.id;
    const message =
      nextStatus === "accepted"
        ? `Accept order #${label}? Stock handling will follow your backend rules.`
        : `Reject order #${label}?`;

    if (!window.confirm(message)) return;

    try {
      setActionId(order.id);
      setNotice("");
      await updateQROrderStatus(order.id, nextStatus);
      setNotice(`Order #${label} updated successfully.`);
      await loadOrders(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not update the order."
      );
    } finally {
      setActionId(null);
    }
  };

  const confirmPayment = async (order) => {
    if (!order?.id || actionId !== null || normalPayment(order) === "paid") {
      return;
    }

    if (normalStatus(order) !== "accepted") {
      setError("Accept the order before confirming payment.");
      return;
    }

    const amount = money(order.total_amount ?? order.total ?? 0);
    if (
      !window.confirm(
        `Confirm that ${amount} has actually been received for order #${order.order_no || order.id}? This is the final action.`
      )
    ) {
      return;
    }

    try {
      setActionId(order.id);
      setError("");
      setNotice("");

      await updateQRPayment(order.id, "UPI", "paid");

      setNotice(
        `Payment confirmed for order #${order.order_no || order.id}. Final step complete.`
      );
      await loadOrders(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Payment confirmation failed."
      );
    } finally {
      setActionId(null);
    }
  };

  const counts = {
    total: orders.length,
    new: orders.filter((o) => normalStatus(o) === "new").length,
    accepted: orders.filter((o) => normalStatus(o) === "accepted").length,
    paid: orders.filter((o) => normalPayment(o) === "paid").length,
  };

  const statusClass = (status) => {
    const allowed = [
      "new",
      "accepted",
      "processing",
      "ready",
      "completed",
      "rejected",
      "cancelled",
    ];
    return allowed.includes(status) ? `qro-b-${status}` : "qro-b-default";
  };

  return (
    <div className="qro-page">
      <style>{styles}</style>

      <div className="qro-wrap">
        <header className="qro-header">
          <div>
            <h1>QR Orders</h1>
            <p className="qro-sub">
              Review customer orders, accept them, then confirm payment as the final step.
            </p>
          </div>
          <button
            className="qro-button qro-refresh"
            type="button"
            onClick={() => loadOrders(true)}
            disabled={loading || actionId !== null}
          >
            ↻ Refresh
          </button>
        </header>

        <section className="qro-grid">
          <div className="qro-stat">
            <span>ORDERS SHOWN</span>
            <strong>{counts.total}</strong>
            <small>Current filter</small>
          </div>
          <div className="qro-stat">
            <span>NEW ORDERS</span>
            <strong>{counts.new}</strong>
            <small>Waiting for your decision</small>
          </div>
          <div className="qro-stat">
            <span>ACCEPTED</span>
            <strong>{counts.accepted}</strong>
            <small>Awaiting payment confirmation</small>
          </div>
          <div className="qro-stat">
            <span>PAYMENT CONFIRMED</span>
            <strong>{counts.paid}</strong>
            <small>Payment marked as received</small>
          </div>
        </section>

        {error && (
          <div className="qro-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="qro-hint" role="status">
            ✓ {notice}
          </div>
        )}

        <section className="qro-card">
          <div className="qro-toolbar">
            <div>
              <h2>Order management</h2>
              <p className="qro-sub">Select an order status to review.</p>
            </div>
            <div className="qro-filters">
              {["new", "accepted", "completed", "rejected", "cancelled", "all"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    className={`qro-filter ${filter === status ? "active" : ""}`}
                    onClick={() => setFilter(status)}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {loading ? (
            <div className="qro-loading">Loading QR orders…</div>
          ) : orders.length === 0 ? (
            <div className="qro-empty">
              <strong>No orders found</strong>
              There are no orders in this filter yet.
            </div>
          ) : (
            <div className="qro-orders">
              {orders.map((order) => {
                const status = normalStatus(order);
                const payment = normalPayment(order);
                const items = getOrderItems(order);
                const busy = actionId === order.id;
                const paid = payment === "paid";
                const total = order.total_amount ?? order.total ?? 0;
                const orderLabel = order.order_no || `#${order.id}`;

                return (
                  <article className="qro-order" key={order.id}>
                    <div className="qro-order-top">
                      <div>
                        <div className="qro-number">Order {orderLabel}</div>
                        <div className="qro-muted">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString("en-IN")
                            : "Date not available"}
                        </div>
                      </div>
                      <span className={`qro-badge ${statusClass(status)}`}>
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="qro-order-body">
                      <div className="qro-items-title">Items ordered</div>

                      {items.length ? (
                        items.map((item, index) => {
                          const name =
                            item.product_name ||
                            item.name ||
                            item.title ||
                            `Item ${index + 1}`;
                          const qty = Number(
                            item.quantity ?? item.qty ?? 1
                          );
                          const price = Number(
                            item.price ?? item.unit_price ?? item.selling_price ?? 0
                          );

                          return (
                            <div className="qro-item" key={item.id || index}>
                              <div>
                                <div className="qro-item-name">{name}</div>
                                <div className="qro-item-sub">
                                  Qty: {qty}
                                </div>
                              </div>
                              <strong>{money(price * qty)}</strong>
                            </div>
                          );
                        })
                      ) : (
                        <div className="qro-muted">
                          Item details are not available in the response.
                        </div>
                      )}

                      <div className="qro-total">
                        <span>ORDER TOTAL</span>
                        <strong>{money(total)}</strong>
                      </div>

                      <div className="qro-info">
                        <div className="qro-info-box">
                          <span>Customer</span>
                          <strong>
                            {order.customer_name || order.name || "Walk-in customer"}
                          </strong>
                        </div>
                        <div className="qro-info-box">
                          <span>Phone</span>
                          <strong>{order.customer_phone || order.phone || "—"}</strong>
                        </div>
                        <div className="qro-info-box">
                          <span>Payment method</span>
                          <strong>{order.payment_method || "UPI / manual"}</strong>
                        </div>
                        <div className="qro-info-box">
                          <span>Payment status</span>
                          <strong>{paid ? "Paid" : "Pending"}</strong>
                        </div>
                      </div>

                      {status === "new" && (
                        <div className="qro-actions">
                          <button
                            type="button"
                            className="qro-button qro-accept"
                            disabled={busy || actionId !== null}
                            onClick={() => performStatusChange(order, "accepted")}
                          >
                            {busy ? "Updating…" : "✓ Accept Order"}
                          </button>
                          <button
                            type="button"
                            className="qro-button qro-reject"
                            disabled={busy || actionId !== null}
                            onClick={() => performStatusChange(order, "rejected")}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}

                      {status === "accepted" && !paid && (
                        <>
                          <div className="qro-hint">
                            Order accepted. Confirm payment only after you have
                            actually received the money. This is the final action;
                            there is no Start Processing step.
                          </div>
                          <div className="qro-actions">
                            <button
                              type="button"
                              className="qro-button qro-pay"
                              disabled={busy || actionId !== null}
                              onClick={() => confirmPayment(order)}
                            >
                              {busy ? "Confirming…" : "₹ Confirm Payment — Final Step"}
                            </button>
                          </div>
                        </>
                      )}

                      {paid && (
                        <div className="qro-actions">
                          <button
                            type="button"
                            className="qro-button qro-done"
                            disabled
                          >
                            ✓ Payment Confirmed · Final Step Complete
                          </button>
                        </div>
                      )}

                      {["processing", "ready", "completed"].includes(status) && !paid && (
                        <div className="qro-hint">
                          This order has status “{status}”. No processing action
                          is offered in this screen.
                        </div>
                      )}

                      {["rejected", "cancelled"].includes(status) && (
                        <div className="qro-hint">
                          This order is {status}. No further actions are available.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
