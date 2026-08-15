import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  FiArrowLeft,
  FiEdit,
  FiTruck,
  FiPhone,
  FiMail,
  FiMapPin,
  FiHash,
  FiUser,
  FiFileText,
  FiCalendar,
  FiClock,
  FiInfo,
  FiCreditCard,
  FiGlobe,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiX
} from "react-icons/fi";

/* ============================================================
   DESIGN TOKENS — "Vendor Khata" concept
   Shares Laabha's bahi-khata paper/ledger language with the
   rest of the app, extended here into a vendor rolodex card
   + running-account ledger for the purchase history table.
   ============================================================ */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .vs-root {
    --paper: #F3EEE1;
    --card: #FFFDF7;
    --ink: #2E3A46;
    --ink-soft: #5B5346;
    --muted: #9A8F79;
    --rule: #DCD0B4;
    --brass: #B8863C;
    --brass-dark: #8F6A2C;
    --marigold: #D98E2B;
    --green: #2F5D3A;
    --green-bg: #E4EDE0;
    --red: #A23A2B;
    --red-bg: #F3E3DD;
    --indigo: #37455E;
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    background: var(--paper);
    min-height: 100vh;
  }

  .vs-mono { font-family: 'JetBrains Mono', monospace; }
  .vs-display { font-family: 'Rozha One', serif; }

  .vs-root * { box-sizing: border-box; }

  .vs-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 26px;
  }

  .vs-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--rule);
    padding: 10px 16px 10px 14px;
    border-radius: 4px 10px 10px 4px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 13.5px;
    box-shadow: 3px 3px 0 var(--rule);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .vs-back-btn:hover {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 var(--rule);
  }

  .vs-heading-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--brass-dark);
    margin: 0 0 2px;
  }
  .vs-heading {
    margin: 0;
    font-family: 'Rozha One', serif;
    font-size: 26px;
    color: var(--ink);
  }

  .vs-edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--indigo);
    color: #fff;
    border: none;
    padding: 11px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 3px 0 #232c3d;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .vs-edit-btn:hover { transform: translateY(1px); box-shadow: 0 2px 0 #232c3d; }

  /* ---- Rolodex vendor card ---- */
  .vs-index-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 4px 14px 14px 14px;
    padding: 34px 30px 26px;
    margin-top: 22px;
    box-shadow: 0 10px 24px rgba(43,32,10,.07);
  }
  .vs-index-card::before {
    /* punch hole, top-left, like a card-file record */
    content: "";
    position: absolute;
    top: 14px;
    left: 22px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: inset 0 1px 2px rgba(0,0,0,.25);
  }
  .vs-rolodex-tab {
    position: absolute;
    top: -20px;
    left: 26px;
    width: 54px;
    height: 40px;
    background: linear-gradient(160deg, var(--brass), var(--brass-dark));
    border-radius: 6px 10px 4px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff8ea;
    font-family: 'Rozha One', serif;
    font-size: 22px;
    box-shadow: 0 4px 8px rgba(80,55,10,.35);
    transform: rotate(-2deg);
  }

  .vs-vendor-row {
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
  }
  .vs-vendor-icon {
    width: 66px;
    height: 66px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--rule);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .vs-vendor-name { margin: 0; font-family: 'Rozha One', serif; font-size: 25px; color: var(--ink); }
  .vs-vendor-company { margin: 3px 0 0; color: var(--ink-soft); font-size: 14px; }

  .vs-ref {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    color: var(--muted);
  }

  /* rubber-stamp badge, used for both supplier status and invoice status */
  .vs-stamp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    border: 1.5px solid currentColor;
  }
  .vs-stamp--green { color: var(--green); background: var(--green-bg); }
  .vs-stamp--red { color: var(--red); background: var(--red-bg); }
  .vs-stamp--amber { color: var(--brass-dark); background: #F6EAD2; }
  .vs-stamp--grey { color: var(--muted); background: #EFEAE0; }

  /* ---- record cards (contact / address) ---- */
  .vs-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    margin-top: 22px;
  }
  @media (max-width: 760px) {
    .vs-grid-2 { grid-template-columns: 1fr; }
  }

  .vs-card {
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 22px;
    box-shadow: 0 4px 14px rgba(43,32,10,.05);
  }

  .vs-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-family: 'Rozha One', serif;
    font-size: 16px;
    color: var(--brass-dark);
    padding-bottom: 10px;
    border-bottom: 1px dashed var(--rule);
  }

  /* dotted "index card" leader row: LABEL .......... value */
  .vs-leader {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 7px 0;
  }
  .vs-leader-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--muted);
    white-space: nowrap;
  }
  .vs-leader-dots {
    flex: 1;
    border-bottom: 1.5px dotted var(--rule);
    height: 0;
    margin-bottom: 3px;
  }
  .vs-leader-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13.5px;
    color: var(--ink);
    white-space: nowrap;
    max-width: 55%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---- pinned note ---- */
  .vs-note {
    position: relative;
    background: #FBF6E6;
    border: 1px solid #E7D9A8;
    border-radius: 2px;
    padding: 16px 18px;
    font-size: 14px;
    color: var(--ink-soft);
    line-height: 1.5;
    transform: rotate(-0.4deg);
    box-shadow: 0 6px 14px rgba(43,32,10,.06);
    min-height: 40px;
  }
  .vs-note::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 26px;
    width: 46px;
    height: 18px;
    background: rgba(216,196,120,.55);
    border: 1px solid rgba(184,134,60,.3);
    transform: rotate(-3deg);
  }
  .vs-note--empty { color: var(--muted); font-style: italic; }

  .vs-meta-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px dashed var(--rule);
  }
  .vs-meta-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .vs-meta-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--ink);
  }

  /* ---- ledger / purchase table ---- */
  .vs-ledger-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 4px;
  }
  .vs-count-chip {
    background: var(--indigo);
    color: #fff;
    padding: 5px 13px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .vs-ledger-wrap {
    position: relative;
    margin-top: 18px;
    padding-left: 26px;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 43px,
      var(--rule) 43px,
      var(--rule) 44px
    );
  }
  .vs-ledger-wrap::before {
    content: "";
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--red);
    opacity: .55;
  }

  .vs-ledger-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 980px;
  }
  .vs-ledger-table thead th {
    text-align: left;
    font-size: 11.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--brass-dark);
    font-weight: 700;
    padding: 0 14px 10px;
  }
  .vs-ledger-table tbody td {
    padding: 12px 14px;
    font-size: 14px;
    color: var(--ink);
    vertical-align: middle;
  }
  .vs-ledger-table tbody tr:hover { background: rgba(216,196,120,.12); }

  .vs-invoice-no {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
  }
  .vs-amt { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .vs-amt--paid { color: var(--green); }
  .vs-amt--due { color: var(--red); }

  .vs-btn-pay {
    border: none;
    background: var(--marigold);
    color: #fff;
    padding: 7px 13px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .vs-btn-history {
    border: 1px solid var(--rule);
    background: var(--card);
    color: var(--ink-soft);
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }

  .vs-empty {
    text-align: center;
    padding: 44px 20px;
    color: var(--muted);
    background: repeating-linear-gradient(
      to bottom, transparent, transparent 27px, var(--rule) 27px, var(--rule) 28px
    );
    border-radius: 10px;
  }

  /* ---- modals ---- */
  .vs-overlay {
    position: fixed;
    inset: 0;
    background: rgba(30,22,10,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .vs-receipt {
    background: var(--card);
    width: 100%;
    max-width: 460px;
    border-radius: 4px;
    padding: 28px 26px 24px;
    box-shadow: 0 24px 60px rgba(0,0,0,.28);
    position: relative;
  }
  .vs-receipt::before {
    content: "";
    position: absolute;
    top: -1px; left: 0; right: 0; height: 10px;
    background-image: radial-gradient(circle at 10px 0, transparent 6px, var(--paper) 6.5px);
    background-size: 20px 10px;
    background-repeat: repeat-x;
  }
  .vs-receipt-title {
    margin: 6px 0 18px;
    font-family: 'Rozha One', serif;
    font-size: 20px;
    color: var(--ink);
  }
  .vs-receipt-summary {
    background: var(--paper);
    border: 1px dashed var(--rule);
    padding: 14px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .vs-field-label {
    display: block;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  .vs-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--rule);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: #fff;
    font-family: 'JetBrains Mono', monospace;
    color: var(--ink);
  }
  select.vs-input, textarea.vs-input { font-family: 'Inter', sans-serif; }
  .vs-input:focus { border-color: var(--brass); box-shadow: 0 0 0 3px rgba(184,134,60,.15); }

  .vs-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
  .vs-btn-cancel {
    border: 1px solid var(--rule);
    background: #fff;
    color: var(--ink-soft);
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  .vs-btn-confirm {
    border: none;
    background: var(--green);
    color: #fff;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .vs-btn-confirm:disabled { opacity: .6; cursor: not-allowed; }

  /* passbook history modal */
  .vs-passbook {
    background: var(--card);
    width: 100%;
    max-width: 560px;
    border-radius: 10px;
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 24px 60px rgba(0,0,0,.28);
  }
  .vs-passbook-close {
    border: none;
    background: var(--paper);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 15px;
    color: var(--ink-soft);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vs-entry {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px dotted var(--rule);
  }
  .vs-entry-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--paper);
    border: 1px solid var(--rule);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--brass-dark);
    margin-right: 8px;
  }

  .vs-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--rule);
    border-top: 4px solid var(--brass);
    border-radius: 50%;
    animation: vs-spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes vs-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
`;

export default function ViewSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyPurchase, setHistoryPurchase] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadSupplier = async () => {
    try {
      const [supplierRes, purchaseRes] = await Promise.all([
        API.get(`/suppliers/${id}`),
        API.get(`/purchases/suppliers/${id}/purchases`)
      ]);

      setSupplier(supplierRes.data.data);
      setPurchases(purchaseRes.data.data || []);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load supplier details");
      navigate("/suppliers");
    } finally {
      setLoading(false);
      setPurchaseLoading(false);
    }
  };

  const openPaymentModal = (purchase) => {
    const balance = Number(purchase.due_amount || 0);
    if (balance <= 0) return;

    setSelectedPurchase(purchase);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMethod("Cash");
    setReferenceNo("");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedPurchase) return;

    const amount = Number(paymentAmount);
    const balance = Number(selectedPurchase.due_amount || 0);

    if (!amount || amount <= 0) {
      alert("Enter a valid payment amount");
      return;
    }

    if (amount > balance) {
      alert(`Payment cannot be greater than ₹${balance.toFixed(2)}`);
      return;
    }

    try {
      setPaymentSaving(true);

      await API.post(`/purchases/${selectedPurchase.id}/payments`, {
        amount,
        payment_method: paymentMethod,
        reference_no: referenceNo || null,
        notes: paymentNotes || null
      });

      alert("Payment recorded successfully.");

      setShowPaymentModal(false);
      setSelectedPurchase(null);

      await loadSupplier();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  const openPaymentHistory = async (purchase) => {
    try {
      setHistoryPurchase(purchase);
      setShowHistory(true);
      setHistoryLoading(true);

      const res = await API.get(`/purchases/${purchase.id}/payments`);
      setPaymentHistory(res.data.data || []);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const stampVariant = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "paid") return "vs-stamp--green";
    if (s === "inactive" || s === "unpaid") return "vs-stamp--red";
    if (s === "pending" || s === "partial") return "vs-stamp--amber";
    return "vs-stamp--grey";
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <FiCheckCircle size={13} />,
      inactive: <FiXCircle size={13} />,
      pending: <FiAlertCircle size={13} />
    };
    return icons[status?.toLowerCase()] || <FiInfo size={13} />;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="vs-root" style={{ padding: 40 }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ textAlign: "center", paddingTop: 60 }}>
          <div className="vs-spinner" />
          <p className="vs-display" style={{ fontSize: 18, color: "var(--ink-soft)" }}>
            Opening vendor card…
          </p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="vs-root" style={{ padding: 40, textAlign: "center" }}>
        <style>{GLOBAL_STYLES}</style>
        <p className="vs-display" style={{ fontSize: 20 }}>Supplier not found</p>
      </div>
    );
  }

  const initial = (supplier.supplier_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="vs-root" style={{ padding: 30 }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Top bar */}
      <div className="vs-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/suppliers">
            <button className="vs-back-btn">
              <FiArrowLeft />
              Back
            </button>
          </Link>
          <div>
            <p className="vs-heading-eyebrow">Vendor Khata</p>
            <h1 className="vs-heading">Supplier Details</h1>
          </div>
        </div>

        <Link to={`/edit-supplier/${supplier.id}`}>
          <button className="vs-edit-btn">
            <FiEdit />
            Edit Supplier
          </button>
        </Link>
      </div>

      {/* Vendor rolodex card */}
      <div className="vs-index-card">
        <div className="vs-rolodex-tab">{initial}</div>

        <div className="vs-vendor-row">
          <div className="vs-vendor-icon">
            <FiTruck size={30} color="#37455E" />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 className="vs-vendor-name">{supplier.supplier_name}</h2>
            <p className="vs-vendor-company">{supplier.company_name || "No company name"}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <span className={`vs-stamp ${stampVariant(supplier.status)}`}>
                {getStatusIcon(supplier.status)}
                {supplier.status || "Active"}
              </span>
              <span className="vs-ref">Ledger Ref&nbsp;#{String(supplier.id).padStart(3, "0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact + Address record cards */}
      <div className="vs-grid-2">
        <div className="vs-card">
          <h3 className="vs-section-title"><FiUser /> Contact Information</h3>

          <div className="vs-leader">
            <span className="vs-leader-label"><FiPhone size={13} /> Phone</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.supplier_phone || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label"><FiMail size={13} /> Email</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.supplier_email || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label"><FiGlobe size={13} /> GST No.</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.gst_number || "-"}</span>
          </div>
        </div>

        <div className="vs-card">
          <h3 className="vs-section-title"><FiMapPin /> Address Details</h3>

          <div className="vs-leader">
            <span className="vs-leader-label">Address</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.address || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label">City</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.city || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label">State</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.state || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label"><FiHash size={13} /> Pincode</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.pincode || "-"}</span>
          </div>
        </div>
      </div>

      {/* Notes + meta */}
      <div className="vs-card" style={{ marginTop: 22 }}>
        <h3 className="vs-section-title"><FiFileText /> Additional Information</h3>

        <div className={`vs-note ${!supplier.notes ? "vs-note--empty" : ""}`}>
          {supplier.notes || "No notes on file for this vendor."}
        </div>

        <div className="vs-meta-row">
          <div>
            <div className="vs-meta-label"><FiCalendar size={13} /> Record Opened</div>
            <div className="vs-meta-value">{formatDate(supplier.created_at)}</div>
          </div>
          <div>
            <div className="vs-meta-label"><FiClock size={13} /> Last Updated</div>
            <div className="vs-meta-value">{formatDate(supplier.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Purchase khata / ledger */}
      <div className="vs-card" style={{ marginTop: 22 }}>
        <div className="vs-ledger-head">
          <h3 className="vs-section-title" style={{ border: "none", margin: 0, paddingBottom: 0 }}>
            <FiCreditCard /> Purchase Khata
          </h3>
          <span className="vs-count-chip">
            {purchases.length} entr{purchases.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        {purchaseLoading ? (
          <div className="vs-empty">Loading purchase invoices…</div>
        ) : purchases.length === 0 ? (
          <div className="vs-empty">
            <FiFileText size={26} />
            <div style={{ marginTop: 10 }}>No purchase invoices recorded for this vendor yet.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div className="vs-ledger-wrap">
              <table className="vs-ledger-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => {
                    const total = Number(purchase.total_amount || 0);
                    const paid = Number(purchase.paid_amount || 0);
                    const balance = Number(purchase.due_amount || 0);

                    let status = "Unpaid";
                    if (balance <= 0) status = "Paid";
                    else if (paid > 0) status = "Partial";

                    return (
                      <tr key={purchase.id}>
                        <td className="vs-invoice-no">{purchase.invoice_no}</td>
                        <td>{formatDate(purchase.created_at)}</td>
                        <td className="vs-amt">₹{total.toFixed(2)}</td>
                        <td className="vs-amt vs-amt--paid">₹{paid.toFixed(2)}</td>
                        <td className={`vs-amt ${balance > 0 ? "vs-amt--due" : "vs-amt--paid"}`}>
                          ₹{balance.toFixed(2)}
                        </td>
                        <td>
                          <span className={`vs-stamp ${stampVariant(status)}`}>
                            {status === "Paid" && <FiCheckCircle size={12} />}
                            {status === "Partial" && <FiAlertCircle size={12} />}
                            {status === "Unpaid" && <FiXCircle size={12} />}
                            {status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {balance > 0 && (
                              <button className="vs-btn-pay" onClick={() => openPaymentModal(purchase)}>
                                Pay ₹{balance.toFixed(2)}
                              </button>
                            )}
                            <button className="vs-btn-history" onClick={() => openPaymentHistory(purchase)}>
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment modal — receipt slip */}
      {showPaymentModal && selectedPurchase && (
        <div className="vs-overlay">
          <div className="vs-receipt">
            <h2 className="vs-receipt-title">Settle Balance</h2>

            <div className="vs-receipt-summary">
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>Invoice</span>
                <div className="vs-invoice-no" style={{ marginTop: 3, fontSize: 15 }}>
                  {selectedPurchase.invoice_no}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Total</div>
                  <strong className="vs-mono">
                    ₹{Number(selectedPurchase.total_amount || 0).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Paid</div>
                  <strong className="vs-mono" style={{ color: "var(--green)" }}>
                    ₹{Number(selectedPurchase.paid_amount || 0).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Remaining</div>
                  <strong className="vs-mono" style={{ color: "var(--red)" }}>
                    ₹{Number(selectedPurchase.due_amount || 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="vs-field-label">Payment Amount</label>
              <input
                type="number"
                min="0"
                max={Number(selectedPurchase.due_amount || 0)}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="vs-input"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="vs-field-label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="vs-input"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="vs-field-label">
                Reference No. <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="UPI / transaction / cheque number"
                className="vs-input"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="vs-field-label">
                Notes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                className="vs-input"
                style={{ resize: "vertical", fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div className="vs-modal-actions">
              <button
                className="vs-btn-cancel"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentSaving}
              >
                Cancel
              </button>
              <button className="vs-btn-confirm" onClick={submitPayment} disabled={paymentSaving}>
                {paymentSaving ? "Saving…" : `Pay ₹${Number(paymentAmount || 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history modal — passbook */}
      {showHistory && historyPurchase && (
        <div className="vs-overlay">
          <div className="vs-passbook">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 className="vs-display" style={{ margin: 0, fontSize: 20 }}>Payment History</h2>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }} className="vs-mono">
                  {historyPurchase.invoice_no}
                </div>
              </div>
              <button className="vs-passbook-close" onClick={() => setShowHistory(false)}>
                <FiX />
              </button>
            </div>

            {historyLoading ? (
              <div className="vs-empty">Loading entries…</div>
            ) : paymentHistory.length === 0 ? (
              <div className="vs-empty">No payment entries recorded yet.</div>
            ) : (
              <div>
                {paymentHistory.map((payment, index) => (
                  <div key={payment.id} className="vs-entry">
                    <div style={{ display: "flex" }}>
                      <span className="vs-entry-num">{index + 1}</span>
                      <div>
                        <strong style={{ fontSize: 13.5 }}>{payment.payment_method}</strong>
                        {payment.reference_no && (
                          <span className="vs-mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                            {" "}• {payment.reference_no}
                          </span>
                        )}
                        <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 3 }}>
                          {formatDate(payment.payment_date)}
                        </div>
                        {payment.notes && (
                          <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <strong className="vs-mono" style={{ color: "var(--green)", fontSize: 15, whiteSpace: "nowrap" }}>
                      ₹{Number(payment.amount || 0).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            <button
              className="vs-btn-cancel"
              style={{ marginTop: 20, width: "100%" }}
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}