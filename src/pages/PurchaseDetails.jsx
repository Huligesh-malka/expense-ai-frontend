// src/pages/PurchaseDetails.jsx



import { useEffect, useMemo, useState } from "react";



import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";



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

  FiCreditCard,

  FiX,

  FiCalendar,

  FiCheck,

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

const formatDateTime = (value) => {
  if (!value) return { date: "—", time: "—" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "—", time: "—" };
  return {
    date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
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



  !/^(?:-+|n\/a|null|undefined|none)$/i.test(String(value).trim());







/* ---------- component ---------- */







export default function PurchaseDetails() {



  const { id } = useParams();



  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();







  const [purchase, setPurchase] = useState(null);



  const [items, setItems] = useState([]);



  const [loading, setLoading] = useState(true);



  const [error, setError] = useState(null);



  // Purchase payment modal

  const [paymentOpen, setPaymentOpen] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [paymentReference, setPaymentReference] = useState("");

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const [paymentNotes, setPaymentNotes] = useState("");

  const [savingPayment, setSavingPayment] = useState(false);

  const [paymentError, setPaymentError] = useState("");

  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");







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
      try {
        setHistoryLoading(true);
        setHistoryError("");
        const paymentRes = await API.get(`/purchases/${id}/payments`);
        setPaymentHistory(Array.isArray(paymentRes.data?.data) ? paymentRes.data.data : []);
      } catch (paymentErr) {
        console.warn("Could not load purchase payment history:", paymentErr);
        setPaymentHistory([]);
        setHistoryError(paymentErr.response?.data?.message || "Payment history could not be loaded.");
      } finally {
        setHistoryLoading(false);
      }



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







  const openPaymentModal = () => {

    if (!purchase || due <= 0) return;

    setPaymentAmount(String(due.toFixed(2)));

    setPaymentMethod("Cash");

    setPaymentReference("");

    setPaymentDate(new Date().toISOString().slice(0, 10));

    setPaymentNotes("");

    setPaymentError("");

    setPaymentOpen(true);

  };



  useEffect(() => {

    if (purchase && searchParams.get("payment") === "1") {

      openPaymentModal();

      setSearchParams({}, { replace: true });

    }

  }, [purchase, searchParams]);



  const closePaymentModal = () => {

    if (savingPayment) return;

    setPaymentOpen(false);

    setPaymentError("");

  };



  const savePurchasePayment = async (event) => {

    event.preventDefault();

    const amount = Number(paymentAmount);



    if (!Number.isFinite(amount) || amount <= 0) {

      setPaymentError("Enter a valid payment amount.");

      return;

    }

    if (amount > due + 0.001) {

      setPaymentError(`Payment cannot exceed the remaining balance of ${formatMoney(due)}.`);

      return;

    }



    try {

      setSavingPayment(true);

      setPaymentError("");

      await API.post(`/purchases/${id}/payments`, {

        amount,

        payment_method: paymentMethod,

        reference_no: paymentReference.trim() || null,

        payment_date: paymentDate,

        notes: paymentNotes.trim() || null,

      });

      setPaymentOpen(false);

      setPaymentSuccess("Payment recorded successfully.");

      await loadPurchase();

    } catch (err) {

      setPaymentError(err.response?.data?.message || "Failed to record payment. Please try again.");

    } finally {

      setSavingPayment(false);

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

        {paymentSuccess && <div className="pd-success-message pd-noprint" role="status"><FiCheck /> {paymentSuccess}<button type="button" onClick={() => setPaymentSuccess("")} aria-label="Dismiss">×</button></div>}



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







            {statusKey !== "paid" && due > 0 && (

              <button type="button" className="pd-btn pd-btn-primary" onClick={openPaymentModal}>

                <FiCreditCard /> Pay now <FiChevronRight />

              </button>

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



        <section className="pd-payment-history-card">
          <div className="pd-payment-history-header">
            <div><h2>Payment history</h2><p>All payments recorded against this purchase</p></div>
            <span className={`pd-history-status ${due <= 0 ? "paid" : paymentHistory.length ? "partial" : "unpaid"}`}>
              {due <= 0 ? "Fully paid" : paymentHistory.length ? "Partially paid" : "Payment pending"}
            </span>
          </div>
          {historyLoading ? <div className="pd-history-empty">Loading payment records...</div> : historyError ? <div className="pd-history-empty error">{historyError}</div> : paymentHistory.length === 0 ? (
            <div className="pd-history-empty"><FiCreditCard /><span>No payment transactions recorded yet.</span></div>
          ) : (
            <div className="pd-payment-history-table-wrap">
              <table className="pd-payment-history-table">
                <thead><tr><th>#</th><th>Date &amp; Time</th><th>Method</th><th>Reference</th><th>Notes</th><th className="pd-right">Amount</th></tr></thead>
                <tbody>{[...paymentHistory].sort((a, b) => {
                  const dateA = new Date(a.created_at || a.payment_date || 0).getTime();
                  const dateB = new Date(b.created_at || b.payment_date || 0).getTime();
                  return (Number.isFinite(dateA) ? dateA : 0) - (Number.isFinite(dateB) ? dateB : 0);
                }).map((payment, index) => (
                  <tr key={payment.id || index}>
                    <td>{index + 1}</td>
                    <td><div className="pd-payment-date-time"><strong>{formatDateTime(payment.created_at || payment.payment_date).date}</strong><small>{formatDateTime(payment.created_at || payment.payment_date).time}</small></div></td>
                    <td><span className="pd-payment-method-badge">{payment.payment_method || "Cash"}</span></td>
                    <td>{hasText(payment.reference_no) ? payment.reference_no : "—"}</td>
                    <td>{hasText(payment.notes) ? payment.notes : "—"}</td>
                    <td className="pd-right pd-history-amount">{formatMoney(payment.amount)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="pd-history-footer">
            <div><span>Total bill</span><strong>{formatMoney(purchase.total_amount)}</strong></div>
            <div><span>Total paid</span><strong className="pd-history-paid">{formatMoney(purchase.paid_amount)}</strong></div>
            <div><span>Remaining balance</span><strong className={due > 0 ? "pd-history-due" : "pd-history-paid"}>{formatMoney(due)}</strong></div>
          </div>
        </section>

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







      {paymentOpen && (

        <div className="pd-modal-overlay pd-noprint" onMouseDown={(e) => { if (e.target === e.currentTarget) closePaymentModal(); }}>

          <section className="pd-payment-modal" role="dialog" aria-modal="true" aria-labelledby="pd-payment-title">

            <header className="pd-modal-header">

              <div className="pd-modal-icon"><FiCreditCard /></div>

              <div className="pd-modal-title-wrap"><h2 id="pd-payment-title">Record supplier payment</h2><p>Purchase #{purchase.invoice_no || id}</p></div>

              <button type="button" className="pd-modal-close" onClick={closePaymentModal} disabled={savingPayment} aria-label="Close"><FiX /></button>

            </header>

            <div className="pd-payment-summary">

              <div><span>Total bill</span><strong>{formatMoney(purchase.total_amount)}</strong></div>

              <div><span>Already paid</span><strong>{formatMoney(purchase.paid_amount)}</strong></div>

              <div className="pd-payment-due"><span>Remaining due</span><strong>{formatMoney(due)}</strong></div>

            </div>

            <form onSubmit={savePurchasePayment} className="pd-payment-form">

              <label className="pd-field pd-field-amount"><span>Payment amount</span><div className="pd-amount-input"><span>₹</span><input type="number" min="0.01" max={due} step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required autoFocus /></div><small>Maximum payable: {formatMoney(due)}</small></label>

              <div className="pd-field-grid">

                <label className="pd-field"><span>Payment method</span><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Cheque</option><option>Other</option></select></label>

                <label className="pd-field"><span>Payment date</span><div className="pd-date-input"><FiCalendar /><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required /></div></label>

              </div>

              <label className="pd-field"><span>Reference number <em>Optional</em></span><input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction ID / cheque number" /></label>

              <label className="pd-field"><span>Notes <em>Optional</em></span><textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows="3" placeholder="Add payment notes..." /></label>

              {paymentError && <div className="pd-payment-error"><FiAlertCircle /> {paymentError}</div>}

              <footer className="pd-modal-actions"><button type="button" className="pd-btn pd-btn-ghost" onClick={closePaymentModal} disabled={savingPayment}>Cancel</button><button type="submit" className="pd-btn pd-btn-primary" disabled={savingPayment || due <= 0}>{savingPayment ? <><span className="pd-button-spinner" /> Saving...</> : <><FiCheck /> Confirm payment</>}</button></footer>

            </form>

          </section>

        </div>

      )}



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







      .pd-page .pd-banner h1 {



        color: #ffffff !important;



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



        color: #ffffff !important;



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







      .pd-payment-history-card { margin-top:22px; background:#fff; border:1px solid var(--border,#e5e7eb); border-radius:18px; overflow:hidden; }
      .pd-payment-history-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:22px 24px; border-bottom:1px solid var(--border,#e5e7eb); }
      .pd-payment-history-header h2 { margin:0; font-size:18px; font-weight:750; }
      .pd-payment-history-header p { margin:5px 0 0; color:var(--muted,#64748b); font-size:13px; }
      .pd-history-status { border-radius:999px; padding:8px 12px; font-size:12px; font-weight:700; white-space:nowrap; }
      .pd-history-status.paid { color:#047857; background:#e8f8ef; } .pd-history-status.partial { color:#b45309; background:#fff4df; } .pd-history-status.unpaid { color:#b91c1c; background:#feecec; }
      .pd-history-empty { display:flex; align-items:center; justify-content:center; gap:10px; padding:30px 20px; color:var(--muted,#64748b); font-size:14px; } .pd-history-empty.error { color:#b91c1c; }
      .pd-payment-history-table-wrap { overflow-x:auto; } .pd-payment-history-table { width:100%; border-collapse:collapse; min-width:720px; }
      .pd-payment-history-table th,.pd-payment-history-table td { padding:14px 16px; border-bottom:1px solid var(--border,#e5e7eb); text-align:left; font-size:13px; }
      .pd-payment-history-table th { background:#f8fafc; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:.04em; } .pd-payment-date-time { display:flex; flex-direction:column; gap:4px; white-space:nowrap; } .pd-payment-date-time strong { font-weight:700; color:#1e293b; } .pd-payment-date-time small { color:#64748b; font-size:11px; }
      .pd-payment-history-table .pd-right { text-align:right; } .pd-payment-method-badge { display:inline-flex; padding:5px 9px; border-radius:8px; background:#f1f5f9; color:#334155; font-weight:600; }
      .pd-history-amount { color:#047857; font-weight:750; } .pd-history-footer { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; padding:20px 24px; background:#f8fafc; }
      .pd-history-footer div { display:flex; flex-direction:column; gap:6px; } .pd-history-footer span { color:var(--muted,#64748b); font-size:12px; } .pd-history-footer strong { font-size:16px; }
      .pd-history-paid { color:#059669; } .pd-history-due { color:#dc2626; } @media(max-width:640px) { .pd-payment-history-header { align-items:flex-start; flex-direction:column; } .pd-history-footer { grid-template-columns:1fr; gap:12px; } }

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









      /* ---------- payment modal ---------- */

      .pd-success-message { display:flex; align-items:center; gap:10px; margin-bottom:16px; padding:13px 16px; border:1px solid #b9e5cc; border-radius:12px; background:#e9f8ef; color:#157347; font-size:14px; font-weight:700; }

      .pd-success-message button { margin-left:auto; border:0; background:transparent; color:inherit; font-size:22px; cursor:pointer; }

      .pd-modal-overlay { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(12,21,41,.58); backdrop-filter:blur(5px); }

      .pd-payment-modal { width:min(540px,100%); max-height:calc(100vh - 40px); overflow:auto; background:#fff; border:1px solid #e1e6ef; border-radius:22px; box-shadow:0 30px 80px rgba(10,20,40,.25); color:var(--ink); }

      .pd-modal-header { display:flex; align-items:center; gap:13px; padding:22px 24px; border-bottom:1px solid var(--line); }

      .pd-modal-icon { width:44px; height:44px; display:grid; place-items:center; border-radius:14px; background:var(--brand-soft); color:var(--brand); font-size:20px; }

      .pd-modal-title-wrap { flex:1; min-width:0; }

      .pd-modal-title-wrap h2 { font-size:18px; font-weight:800; }

      .pd-modal-title-wrap p { margin-top:3px; color:var(--muted); font-size:13px; }

      .pd-modal-close { width:36px; height:36px; display:grid; place-items:center; border:1px solid var(--line); border-radius:10px; background:#fff; color:var(--muted); cursor:pointer; }

      .pd-payment-summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:18px 24px; background:#f8f9fc; }

      .pd-payment-summary > div { display:flex; flex-direction:column; gap:5px; padding:12px; border:1px solid #e8ecf3; border-radius:12px; background:#fff; }

      .pd-payment-summary span { color:var(--muted); font-size:12px; font-weight:600; }

      .pd-payment-summary strong { font-size:16px; font-weight:800; }

      .pd-payment-summary .pd-payment-due { grid-column:1/-1; background:#fff8eb; border-color:#f4dfb7; }

      .pd-payment-due strong { color:#9a5b00; font-size:22px; }

      .pd-payment-form { display:flex; flex-direction:column; gap:16px; padding:22px 24px 24px; }

      .pd-field { display:flex; flex-direction:column; gap:7px; min-width:0; color:var(--ink-soft); font-size:13px; font-weight:700; }

      .pd-field em { font-style:normal; font-weight:500; color:var(--muted); }

      .pd-field input,.pd-field select,.pd-field textarea { width:100%; min-height:43px; padding:10px 12px; border:1px solid #dce2ec; border-radius:10px; background:#fff; color:var(--ink); font:500 14px Manrope,inherit; outline:none; }

      .pd-field input:focus,.pd-field select:focus,.pd-field textarea:focus { border-color:#7fa5ff; box-shadow:0 0 0 3px rgba(29,78,216,.1); }

      .pd-field textarea { resize:vertical; }

      .pd-field small { color:var(--muted); font-size:12px; font-weight:500; }

      .pd-amount-input { display:flex; align-items:center; border:1px solid #cfd8e8; border-radius:12px; overflow:hidden; background:#fff; }

      .pd-amount-input > span { padding:0 14px; color:var(--muted); font-size:20px; font-weight:800; }

      .pd-amount-input input { border:0; border-radius:0; min-height:54px; font-size:23px; font-weight:800; box-shadow:none!important; }

      .pd-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

      .pd-date-input { display:flex; align-items:center; gap:8px; padding-left:10px; border:1px solid #dce2ec; border-radius:10px; color:var(--muted); }

      .pd-date-input input { border:0; padding-left:0; box-shadow:none!important; }

      .pd-payment-error { display:flex; gap:9px; align-items:flex-start; padding:12px; border-radius:10px; background:var(--red-soft); color:var(--red); font-size:13px; font-weight:600; }

      .pd-modal-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }

      .pd-modal-actions .pd-btn-primary { min-width:160px; }

      .pd-button-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.45); border-top-color:#fff; border-radius:50%; animation:pd-rotate .7s linear infinite; }

      @media(max-width:520px) { .pd-modal-overlay { padding:10px; } .pd-payment-modal { max-height:calc(100vh - 20px); border-radius:18px; } .pd-modal-header,.pd-payment-form { padding:18px; } .pd-payment-summary { padding:14px 18px; } .pd-field-grid { grid-template-columns:1fr; } .pd-modal-actions { flex-direction:column-reverse; } .pd-modal-actions .pd-btn { width:100%; } }





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
