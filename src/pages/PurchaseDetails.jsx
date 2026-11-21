// src/pages/PurchaseDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";

import {
  FiArrowLeft,
  FiPrinter,
  FiRefreshCw,
  FiAlertCircle,
  FiFileText,
  FiUser,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiChevronRight,
} from "react-icons/fi";

/* ---------- helpers ---------- */

const toNumber = (value) => Number(value) || 0;

const formatMoney = (value) =>
  `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* Same status rule as the Purchases list page */
const getStatusKey = (purchase) => {
  const total = toNumber(purchase.total_amount);
  const paid = toNumber(purchase.paid_amount);
  const backendStatus = String(purchase.payment_status || "").toLowerCase();

  if (backendStatus === "paid" || (total > 0 && paid >= total)) return "paid";
  if (backendStatus === "partial" || (paid > 0 && paid < total)) return "partial";
  return "unpaid";
};

const STATUS_LABELS = {
  paid: "Fully paid",
  partial: "Partially paid",
  unpaid: "Not paid",
};

const getDue = (purchase) => {
  const fallback = toNumber(purchase.total_amount) - toNumber(purchase.paid_amount);
  const due =
    purchase.due_amount !== undefined && purchase.due_amount !== null
      ? toNumber(purchase.due_amount)
      : fallback;
  return Math.max(0, due);
};

const hasText = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "" &&
  !/^(-+|n\/?a|null|undefined|none)$/i.test(String(value).trim());

/* ---------- component ---------- */

export default function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPurchase = async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await API.get(`/purchases/details/${id}`);
      setPurchase(res.data.purchase);
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load purchase:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load purchase. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const statusKey = purchase ? getStatusKey(purchase) : "unpaid";
  const due = purchase ? getDue(purchase) : 0;

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
    [items]
  );

  /* ---------- states ---------- */

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-center" role="status" aria-live="polite">
          <div className="pd-spinner" />
          <span>Loading purchase…</span>
        </div>
        <Styles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pd-page">
        <div className="pd-center" role="alert">
          <div className="pd-state-icon pd-state-icon-error">
            <FiAlertCircle size={26} />
          </div>

          <h2>Couldn’t load this purchase</h2>
          <p>{error}</p>

          <div className="pd-state-actions">
            <button className="pd-btn pd-btn-primary" onClick={loadPurchase}>
              <FiRefreshCw />
              Try again
            </button>

            <Link to="/purchases" className="pd-btn pd-btn-ghost">
              <FiArrowLeft />
              Back to purchases
            </Link>
          </div>
        </div>
        <Styles />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="pd-page">
        <div className="pd-center">
          <div className="pd-state-icon">
            <FiFileText size={26} />
          </div>

          <h2>Purchase not found</h2>
          <p>This bill may have been deleted or the link is incorrect.</p>

          <Link to="/purchases" className="pd-btn pd-btn-primary">
            <FiArrowLeft />
            Back to purchases
          </Link>
        </div>
        <Styles />
      </div>
    );
  }

  /* ---------- main ---------- */

  const supplierRows = [
    { icon: <FiUser />, label: "Name", value: purchase.supplier_name },
    { icon: <FiBriefcase />, label: "Company", value: purchase.company_name },
    { icon: <FiPhone />, label: "Phone", value: purchase.supplier_phone },
    { icon: <FiMapPin />, label: "Address", value: purchase.address },
  ].filter((row) => hasText(row.value));

  const discount = toNumber(purchase.discount);

  return (
    <div className="pd-page">
      <main className="pd-shell">
        {/* TOP BAR */}
        <nav className="pd-topbar pd-noprint" aria-label="Breadcrumb">
          <button
            type="button"
            className="pd-crumb"
            onClick={() => navigate("/purchases")}
          >
            <FiArrowLeft />
            Purchases
          </button>

          <div className="pd-topbar-actions">
            <button
              type="button"
              className="pd-btn pd-btn-ghost"
              onClick={() => window.print()}
            >
              <FiPrinter />
              Print invoice
            </button>

            {statusKey !== "paid" && (
              <Link to={`/purchase/${id}/pay`} className="pd-btn pd-btn-primary">
                Pay now
                <FiChevronRight />
              </Link>
            )}
          </div>
        </nav>

        {/* BANNER */}
        <section className="pd-banner">
          <div className="pd-banner-main">
            <span className="pd-banner-label">Purchase invoice</span>
            <h1>#{purchase.invoice_no || id}</h1>

            <div className="pd-banner-meta">
              {hasText(purchase.supplier_name) && (
                <span>{purchase.supplier_name}</span>
              )}
              <span>{formatDate(purchase.created_at)}</span>
              {hasText(purchase.payment_method) && (
                <span className="pd-cap">{purchase.payment_method}</span>
              )}
            </div>
          </div>

          <div className="pd-banner-due">
            <span className={`pd-status pd-status-${statusKey}`}>
              <span />
              {STATUS_LABELS[statusKey]}
            </span>

            <span className="pd-banner-due-label">
              {due > 0 ? "Amount due" : "Total paid"}
            </span>

            <strong
              className={`pd-banner-due-amount ${due > 0 ? "" : "pd-amount-clear"}`}
            >
              {formatMoney(due > 0 ? due : purchase.paid_amount)}
            </strong>
          </div>
        </section>

        {/* SUPPLIER + INVOICE */}
        <section className="pd-info">
          <div className="pd-panel">
            <h2>Supplier</h2>

            {supplierRows.length === 0 ? (
              <p className="pd-muted">No supplier details recorded.</p>
            ) : (
              <dl className="pd-list">
                {supplierRows.map((row) => (
                  <div key={row.label}>
                    <dt>
                      {row.icon}
                      {row.label}
                    </dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="pd-panel">
            <h2>Invoice</h2>

            <dl className="pd-list">
              <div>
                <dt>Bill number</dt>
                <dd>#{purchase.invoice_no || id}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{formatDate(purchase.created_at)}</dd>
              </div>
              <div>
                <dt>Payment method</dt>
                <dd className="pd-cap">
                  {hasText(purchase.payment_method)
                    ? purchase.payment_method
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`pd-status pd-status-${statusKey}`}>
                    <span />
                    {STATUS_LABELS[statusKey]}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ITEMS + SUMMARY */}
        <section className="pd-card">
          <header className="pd-card-head">
            <div>
              <h2>Items</h2>
              <p>
                {items.length} {items.length === 1 ? "product" : "products"} ·{" "}
                {itemCount.toLocaleString("en-IN")} units
              </p>
            </div>
          </header>

          {items.length === 0 ? (
            <div className="pd-empty">
              <p>No items were recorded on this bill.</p>
            </div>
          ) : (
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="pd-center-text">Qty</th>
                    <th className="pd-right">Price</th>
                    <th className="pd-right">Tax</th>
                    <th className="pd-right">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td data-label="Product">
                        <span className="pd-product">
                          <span className="pd-index">{index + 1}</span>
                          {item.product_name}
                        </span>
                      </td>
                      <td className="pd-center-text" data-label="Qty">
                        {item.quantity}
                      </td>
                      <td className="pd-right" data-label="Price">
                        {formatMoney(item.purchase_price)}
                      </td>
                      <td className="pd-right" data-label="Tax">
                        {formatMoney(item.tax)}
                      </td>
                      <td className="pd-right" data-label="Total">
                        <strong>{formatMoney(item.total)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pd-summary-wrap">
            <div className="pd-summary">
              <div className="pd-row">
                <span>Subtotal</span>
                <strong>{formatMoney(purchase.subtotal)}</strong>
              </div>

              {discount > 0 && (
                <div className="pd-row">
                  <span>Discount</span>
                  <strong>-{formatMoney(discount)}</strong>
                </div>
              )}

              <div className="pd-row">
                <span>Tax</span>
                <strong>{formatMoney(purchase.tax)}</strong>
              </div>

              <div className="pd-total">
                <span>Total</span>
                <span>{formatMoney(purchase.total_amount)}</span>
              </div>

              <div className="pd-row pd-row-paid">
                <span>Paid</span>
                <strong>{formatMoney(purchase.paid_amount)}</strong>
              </div>

              <div className="pd-row pd-row-due">
                <span>Due</span>
                <strong className={due > 0 ? "pd-owed" : "pd-settled"}>
                  {formatMoney(due)}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM ACTIONS */}
        <div className="pd-bottom pd-noprint">
          <button
            type="button"
            className="pd-btn pd-btn-ghost"
            onClick={() => navigate("/purchases")}
          >
            <FiArrowLeft />
            Back to purchases
          </button>

          <button
            type="button"
            className="pd-btn pd-btn-primary"
            onClick={() => window.print()}
          >
            <FiPrinter />
            Print invoice
          </button>
        </div>
      </main>

      <Styles />
    </div>
  );
}

/* ====================================================== */
/* Styles — scoped under .pd- so nothing leaks globally    */
/* ====================================================== */

function Styles() {
  return (
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

      .pd-page {
        --ink: #14213d;
        --ink-soft: #3b4a68;
        --muted: #6b7794;
        --line: #e1e6ef;
        --bg: #eef1f6;
        --surface: #ffffff;
        --brand: #1d4ed8;
        --brand-soft: #e8eefc;
        --green: #157347;
        --green-soft: #dff4e8;
        --amber: #9a5b00;
        --amber-soft: #fdf0d2;
        --red: #b3261e;
        --red-soft: #fbe3e1;
        --gold: #f6c453;

        min-height: 100vh;
        background: var(--bg);
        color: var(--ink);
        font-family: Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-variant-numeric: tabular-nums;
        -webkit-font-smoothing: antialiased;
      }

      .pd-page *,
      .pd-page *::before,
      .pd-page *::after {
        box-sizing: border-box;
      }

      .pd-page h1,
      .pd-page h2,
      .pd-page p,
      .pd-page dl,
      .pd-page dd {
        margin: 0;
      }

      .pd-page :focus-visible {
        outline: 3px solid #93b4ff;
        outline-offset: 2px;
      }

      .pd-shell {
        width: min(1080px, calc(100% - 40px));
        margin: 0 auto;
        padding: 28px 0 64px;
      }

      .pd-cap {
        text-transform: capitalize;
      }

      .pd-muted {
        font-size: 14px;
        color: var(--muted);
      }

      /* ---------- buttons / top bar ---------- */

      .pd-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 20px;
      }

      .pd-topbar-actions {
        display: flex;
        gap: 10px;
      }

      .pd-crumb {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--ink-soft);
        font: 700 14px Manrope, inherit;
        cursor: pointer;
      }

      .pd-crumb:hover {
        color: var(--brand);
      }

      .pd-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 16px;
        border-radius: 11px;
        border: 1px solid transparent;
        font: 700 13px/1 Manrope, inherit;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }

      .pd-btn-primary {
        background: var(--ink);
        color: #fff;
      }

      .pd-btn-primary:hover {
        background: #0c1529;
      }

      .pd-btn-ghost {
        background: var(--surface);
        color: var(--ink-soft);
        border-color: var(--line);
      }

      .pd-btn-ghost:hover {
        border-color: #c5cddd;
        color: var(--ink);
      }

      /* ---------- banner ---------- */

      .pd-banner {
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 24px;
        padding: 28px;
        border-radius: 20px;
        background: var(--ink);
        color: #fff;
      }

      .pd-banner-label {
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .pd-banner h1 {
        margin-top: 6px;
        font-size: clamp(26px, 4vw, 36px);
        font-weight: 800;
        letter-spacing: -0.8px;
        overflow-wrap: anywhere;
      }

      .pd-banner-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 18px;
        margin-top: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
      }

      .pd-banner-due {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        gap: 6px;
        min-width: 220px;
        padding: 16px 20px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.06);
        text-align: right;
      }

      .pd-banner-due-label {
        font-size: 13px;
        font-weight: 600;
        color: #b8c3dd;
      }

      .pd-banner-due-amount {
        font-size: clamp(26px, 4vw, 34px);
        font-weight: 800;
        letter-spacing: -0.8px;
        color: var(--gold);
      }

      .pd-amount-clear {
        color: #8be0b0;
      }

      /* ---------- status pill ---------- */

      .pd-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .pd-status > span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .pd-status-paid { background: var(--green-soft); color: var(--green); }
      .pd-status-partial { background: var(--amber-soft); color: var(--amber); }
      .pd-status-unpaid { background: var(--red-soft); color: var(--red); }

      /* ---------- info panels ---------- */

      .pd-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 16px;
      }

      .pd-panel {
        padding: 22px 24px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--surface);
      }

      .pd-panel h2,
      .pd-card-head h2 {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.3px;
      }

      .pd-list {
        margin-top: 14px;
      }

      .pd-list > div {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 11px 0;
        border-bottom: 1px solid #eef1f6;
      }

      .pd-list > div:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .pd-list dt {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        flex: none;
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
      }

      .pd-list dt svg {
        color: #8c97b0;
      }

      .pd-list dd {
        font-size: 14px;
        font-weight: 700;
        text-align: right;
        overflow-wrap: anywhere;
        color: var(--ink);
      }

      /* ---------- items card ---------- */

      .pd-card {
        margin-top: 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--surface);
        overflow: hidden;
      }

      .pd-card-head {
        padding: 22px 24px 16px;
        border-bottom: 1px solid var(--line);
      }

      .pd-card-head p {
        margin-top: 4px;
        font-size: 13px;
        color: var(--muted);
      }

      .pd-table-wrap {
        overflow-x: auto;
      }

      .pd-table {
        width: 100%;
        min-width: 560px;
        border-collapse: collapse;
      }

      .pd-table th {
        padding: 0 24px;
        height: 44px;
        text-align: left;
        background: #f8f9fc;
        border-bottom: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .pd-table td {
        padding: 15px 24px;
        border-bottom: 1px solid #eef1f6;
        font-size: 14px;
        color: var(--ink-soft);
        vertical-align: middle;
      }

      .pd-table tbody tr:last-child td {
        border-bottom: 0;
      }

      .pd-right {
        text-align: right !important;
        white-space: nowrap;
      }

      .pd-center-text {
        text-align: center !important;
      }

      .pd-table td strong {
        font-weight: 800;
        color: var(--ink);
      }

      .pd-product {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 700;
        color: var(--ink);
      }

      .pd-index {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: var(--brand-soft);
        color: var(--brand);
        font-size: 12px;
        font-weight: 800;
      }

      .pd-empty {
        padding: 36px 24px;
        text-align: center;
        font-size: 14px;
        color: var(--muted);
      }

      /* ---------- summary ---------- */

      .pd-summary-wrap {
        display: flex;
        justify-content: flex-end;
        padding: 20px 24px 24px;
        border-top: 1px solid var(--line);
        background: #f8f9fc;
      }

      .pd-summary {
        width: 100%;
        max-width: 360px;
      }

      .pd-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 8px 0;
        font-size: 14px;
        color: var(--muted);
      }

      .pd-row strong {
        font-weight: 800;
        color: var(--ink);
      }

      .pd-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 10px 0;
        padding: 14px 16px;
        border-radius: 12px;
        background: var(--ink);
        color: #fff;
        font-size: 17px;
        font-weight: 800;
      }

      .pd-row-paid strong,
      .pd-row .pd-settled {
        color: var(--green);
      }

      .pd-row .pd-owed {
        color: var(--red);
      }

      .pd-bottom {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 20px;
      }

      /* ---------- states ---------- */

      .pd-center {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 24px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        color: var(--muted);
      }

      .pd-center h2 {
        font-size: 21px;
        font-weight: 800;
        color: var(--ink);
      }

      .pd-center p {
        max-width: 380px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
      }

      .pd-center > .pd-btn {
        margin-top: 18px;
      }

      .pd-state-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin-top: 18px;
      }

      .pd-state-icon {
        width: 62px;
        height: 62px;
        display: grid;
        place-items: center;
        margin-bottom: 12px;
        border-radius: 20px;
        background: #e6eaf3;
        color: var(--muted);
      }

      .pd-state-icon-error {
        background: var(--red-soft);
        color: var(--red);
      }

      .pd-spinner {
        width: 40px;
        height: 40px;
        margin-bottom: 8px;
        border: 4px solid #dbe1ee;
        border-top-color: var(--brand);
        border-radius: 50%;
        animation: pd-rotate 0.8s linear infinite;
      }

      @keyframes pd-rotate {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .pd-spinner { animation-duration: 2s; }
        .pd-page * { transition: none !important; }
      }

      /* ---------- responsive ---------- */

      @media (max-width: 760px) {
        .pd-shell {
          width: calc(100% - 24px);
          padding-top: 18px;
        }

        .pd-topbar {
          flex-wrap: wrap;
        }

        .pd-banner {
          padding: 20px;
        }

        .pd-banner-due {
          width: 100%;
          align-items: flex-start;
          text-align: left;
        }

        .pd-info {
          grid-template-columns: 1fr;
        }

        .pd-panel {
          padding: 18px 20px;
        }

        .pd-card-head {
          padding: 18px 16px 14px;
        }

        /* Item rows become small cards */
        .pd-table {
          min-width: 0;
        }

        .pd-table thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .pd-table,
        .pd-table tbody,
        .pd-table tr,
        .pd-table td {
          display: block;
          width: 100%;
        }

        .pd-table tbody tr {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
        }

        .pd-table tbody tr:last-child {
          border-bottom: 0;
        }

        .pd-table td {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 0;
          border: 0;
          text-align: right;
        }

        .pd-table td::before {
          content: attr(data-label);
          flex: none;
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
        }

        .pd-table td[data-label="Product"] {
          padding-top: 0;
          padding-bottom: 8px;
        }

        .pd-table td[data-label="Product"]::before {
          content: none;
        }

        .pd-summary-wrap {
          padding: 16px;
        }

        .pd-summary {
          max-width: none;
        }

        .pd-bottom {
          flex-direction: column-reverse;
        }

        .pd-bottom .pd-btn {
          width: 100%;
        }
      }

      /* ---------- print ---------- */

      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }

        html,
        body {
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .pd-noprint {
          display: none !important;
        }

        .pd-page {
          min-height: 0;
          background: #fff;
        }

        .pd-shell {
          width: 100%;
          padding: 0;
        }

        .pd-panel,
        .pd-card {
          break-inside: avoid;
        }
      }
    `}</style>
  );
}