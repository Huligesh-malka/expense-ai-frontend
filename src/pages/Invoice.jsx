import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import {
    FiPrinter,
    FiArrowLeft,
    FiDownload,
    FiShare2,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiRefreshCw,
    FiMail,
    FiPhone,
    FiMapPin,
    FiFileText,
    FiBox,
    FiMessageCircle,
    FiSun,
    FiMoon,
    FiZap,
} from "react-icons/fi";

/* ───────────────────────── Labels (English only) ───────────────────────── */
const t = {
    back: "Back", print: "Print", pdf: "PDF", whatsapp: "WhatsApp", share: "Share",
    docTax: "TAX INVOICE", docCash: "CASH MEMO",
    totalAmount: "Total Amount", billNo: "Bill No.", date: "Date", time: "Time", payment: "Paid By",
    billedTo: "Customer", items: "Items", units: "qty", subtotal: "Sub Total", discount: "Discount",
    grandTotal: "Net Payable", note: "Note", terms: "Terms", thanks: "Thank you! Visit again",
    footer: "Computer generated bill, no signature required",
    saved: "You saved", scanToPay: "Scan to pay with any UPI app",
    paid: "Paid", pending: "Due", failed: "Failed", refunded: "Refunded",
    copied: "Bill link copied", shareFail: "Unable to share",
    pdfHint: "Choose 'Save as PDF' in the print dialog",
    loading: "Preparing your bill...", notFound: "Bill not found", backSales: "Back to Sales",
};

const THEMES = ["modern", "thermal", "night"];

/* ───────────────────────── Hooks ───────────────────────── */
function useCountUp(target, ms = 900) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let raf;
        let start;
        const step = (time) => {
            if (!start) start = time;
            const p = Math.min((time - start) / ms, 1);
            setValue(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, ms]);
    return value;
}

function usePersisted(key, initial) {
    const [val, setVal] = useState(() => {
        try {
            return localStorage.getItem(key) || initial;
        } catch {
            return initial;
        }
    });
    const set = (v) => {
        setVal(v);
        try {
            localStorage.setItem(key, v);
        } catch {
            /* ignore */
        }
    };
    return [val, set];
}

/* ───────────────────────── Component ───────────────────────── */
export default function Invoice() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [theme, setTheme] = usePersisted("receipt_theme", "modern");
    const [toast, setToast] = useState("");

    const totalNumber = Number(invoice?.total_amount) || 0;
    const animatedTotal = useCountUp(totalNumber);

    useEffect(() => {
        loadInvoice();
        // eslint-disable-next-line
    }, [id]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(""), 2400);
        return () => clearTimeout(timer);
    }, [toast]);

    const loadInvoice = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await API.get(`/sales/invoice/${id}`);
            setInvoice(res.data.invoice);
            setItems(res.data.items || []);
        } catch (err) {
            console.error("Error loading invoice:", err);
            setError("Unable to load invoice. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount) || 0);

    const getStatus = (status) => {
        const key = status?.toLowerCase();
        const configs = {
            paid: { color: "#0f7a4d", bg: "#dcfce7", label: t.paid, icon: <FiCheckCircle size={14} />, rotate: -8 },
            pending: { color: "#a16207", bg: "#fef3c7", label: t.pending, icon: <FiClock size={14} />, rotate: -5 },
            failed: { color: "#b91c1c", bg: "#fee2e2", label: t.failed, icon: <FiXCircle size={14} />, rotate: -9 },
            refunded: { color: "#475569", bg: "#e2e8f0", label: t.refunded, icon: <FiRefreshCw size={14} />, rotate: -6 },
        };
        return (
            configs[key] || {
                color: "#475569",
                bg: "#e2e8f0",
                label: status || "N/A",
                icon: <FiFileText size={14} />,
                rotate: -6,
            }
        );
    };

    /* ── Actions ── */
    const handlePrint = () => window.print();

    const handleDownload = () => {
        const oldTitle = document.title;
        document.title = `Invoice-${invoice.invoice_no}`;
        window.print();
        document.title = oldTitle;
        setToast(t.pdfHint);
    };

    const buildSummaryText = () => {
        const lines = items
            .map((it, i) => `${i + 1}. ${it.product_name} - ${formatQuantity(it)} = ${formatCurrency(it.total)}`)
            .join("\n");
        return (
            `*${invoice.business_name || "Bill"}*\n` +
            `${t.billNo} #${invoice.invoice_no}\n\n${lines}\n\n` +
            `*${t.totalAmount}: ${formatCurrency(invoice.total_amount)}*\n${window.location.href}`
        );
    };

    const handleWhatsApp = () => {
        const digits = String(invoice.customer_phone || "").replace(/\D/g, "");
        const number = digits.length === 10 ? `91${digits}` : digits;
        const base = number ? `https://wa.me/${number}` : "https://wa.me/";
        window.open(`${base}?text=${encodeURIComponent(buildSummaryText())}`, "_blank", "noopener");
    };

    const handleShare = async () => {
        try {
            const shareData = {
                title: `Invoice ${invoice.invoice_no}`,
                text: `Invoice #${invoice.invoice_no} - Total: ${formatCurrency(invoice.total_amount)}`,
                url: window.location.href,
            };
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                setToast(t.copied);
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Share failed:", err);
                setToast(t.shareFail);
            }
        }
    };

    const cycleTheme = () => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);

    /* ── Formatters ── */
    const getPaymentIcon = (method) => {
        const icons = { cash: "💵", card: "💳", upi: "📱", bank: "🏦", credit: "💳", debit: "🏦" };
        return icons[method?.toLowerCase()] || "💵";
    };

    const formatQuantity = (item) => {
        const enteredQty = Number(item.entered_quantity || item.quantity || 0);
        const enteredUnit = item.entered_unit || item.unit || "pcs";
        const baseQty = Number(item.base_quantity || item.quantity || 0);
        const baseUnit = item.base_unit || item.unit || "pcs";
        if (enteredUnit === baseUnit || enteredQty === baseQty) {
            return `${enteredQty} ${enteredUnit}`;
        }
        return `${enteredQty} ${enteredUnit} (${baseQty} ${baseUnit})`;
    };

    const formatUnitPrice = (item) => {
        const price = Number(item.price || 0);
        const baseUnit = item.base_unit || item.unit || "pcs";
        return `₹${price.toFixed(2)}/${baseUnit.toUpperCase()}`;
    };

    /* ── Loading / error ── */
    if (loading) {
        return (
            <div className="rc-center">
                <style>{baseCss}</style>
                <div className="rc-spinner" />
                <p className="rc-center-text">{t.loading}</p>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="rc-center">
                <style>{baseCss}</style>
                <div style={{ fontSize: 50 }}>🧾</div>
                <h2 style={{ margin: "10px 0 6px", fontWeight: 900 }}>{t.notFound}</h2>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>
                    {error || "This bill doesn't exist, or it has been removed."}
                </p>
                <Link to="/sales" replace className="rc-btn rc-btn-dark">
                    <FiArrowLeft size={16} />
                    {t.backSales}
                </Link>
            </div>
        );
    }

    /* ── Derived ── */
    const status = getStatus(invoice.payment_status);
    const isPaid = invoice.payment_status?.toLowerCase() === "paid";
    const totalUnits = items.reduce((sum, it) => sum + Number(it.entered_quantity || it.quantity || 0), 0);
    const hasCustomerContact = invoice.customer_phone || invoice.customer_email;
    const discount = Number(invoice.discount) || 0;
    const docTitle = invoice.gst_number ? t.docTax : t.docCash;
    const showUpiQr = invoice.upi_id && !isPaid;
    const upiLink = showUpiQr
        ? `upi://pay?pa=${encodeURIComponent(invoice.upi_id)}&pn=${encodeURIComponent(
              invoice.business_name || "Store"
          )}&am=${totalNumber.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.invoice_no)}`
        : null;

    const ThemeIcon = theme === "night" ? FiMoon : theme === "thermal" ? FiZap : FiSun;

    return (
        <div className="rc-root" data-theme={theme}>
            <style>{baseCss}</style>
            <style>{`@media print { @page { size: ${theme === "thermal" ? "80mm auto" : "A4"}; margin: ${theme === "thermal" ? "3mm" : "8mm"}; } }`}</style>

            {/* Action bar */}
            <div className="rc-bar no-print">
                <Link to="/sales" replace className="rc-back">
                    <FiArrowLeft size={17} />
                    {t.back}
                </Link>
                <div className="rc-bar-right">
                    <button className="rc-chip" onClick={cycleTheme} title="Change style">
                        <ThemeIcon size={14} />
                        <span style={{ textTransform: "capitalize" }}>{theme}</span>
                    </button>
                </div>
            </div>

            <div className="rc-actions no-print">
                <button className="rc-btn" onClick={handlePrint}>
                    <FiPrinter size={15} /> {t.print}
                </button>
                <button className="rc-btn" onClick={handleDownload}>
                    <FiDownload size={15} /> {t.pdf}
                </button>
                <button className="rc-btn rc-btn-wa" onClick={handleWhatsApp}>
                    <FiMessageCircle size={15} /> {t.whatsapp}
                </button>
                <button className="rc-btn rc-btn-accent" onClick={handleShare}>
                    <FiShare2 size={15} /> {t.share}
                </button>
            </div>

            {/* Receipt */}
            <div className="rc-wrap" id="invoice-content">
                <div className="rc-card">
                    {/* Header */}
                    <div className="rc-header">
                        {invoice.logo ? (
                            <img src={invoice.logo} alt="Business Logo" className="rc-logo" />
                        ) : (
                            <div className="rc-logo-ph">
                                <FiBox size={24} color="#0b1220" />
                            </div>
                        )}
                        <h1 className="rc-biz">{invoice.business_name || "Business Name"}</h1>
                        <div className="rc-meta">
                            {invoice.address && (
                                <p>
                                    <FiMapPin size={12} />
                                    <span>
                                        {invoice.address}
                                        {invoice.city ? `, ${invoice.city}` : ""}
                                        {invoice.state ? `, ${invoice.state}` : ""}
                                        {invoice.pincode ? ` - ${invoice.pincode}` : ""}
                                    </span>
                                </p>
                            )}
                            {invoice.business_phone && (
                                <p>
                                    <FiPhone size={12} />
                                    <span>{invoice.business_phone}</span>
                                </p>
                            )}
                            {invoice.business_email && (
                                <p>
                                    <FiMail size={12} />
                                    <span>{invoice.business_email}</span>
                                </p>
                            )}
                        </div>
                        {invoice.gst_number && <div className="rc-gst">GSTIN {invoice.gst_number}</div>}
                        <div className="rc-doctitle">{docTitle}</div>
                    </div>

                    {/* Hero */}
                    <div className="rc-hero">
                        <span className="rc-hero-label">{t.totalAmount}</span>
                        <span className="rc-hero-amount">{formatCurrency(animatedTotal)}</span>
                        <span className="rc-pill" style={{ color: status.color, background: status.bg }}>
                            {status.icon}
                            {status.label}
                        </span>
                        {isPaid && (
                            <div className="rc-stamp" style={{ "--rot": `${status.rotate}deg` }}>
                                {status.label}
                            </div>
                        )}
                    </div>

                    {discount > 0 && (
                        <div className="rc-saved">
                            🎉 {t.saved} {formatCurrency(discount)}
                        </div>
                    )}

                    <div className="rc-dash" />

                    {/* Bill info */}
                    <div className="rc-info">
                        <div>
                            <span className="rc-k">{t.billNo}</span>
                            <span className="rc-v">#{invoice.invoice_no}</span>
                        </div>
                        <div>
                            <span className="rc-k">{t.date}</span>
                            <span className="rc-v">
                                {new Date(invoice.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                        <div>
                            <span className="rc-k">{t.time}</span>
                            <span className="rc-v">
                                {new Date(invoice.created_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <div>
                            <span className="rc-k">{t.payment}</span>
                            <span className="rc-v" style={{ textTransform: "capitalize" }}>
                                {getPaymentIcon(invoice.payment_method)} {invoice.payment_method || "N/A"}
                            </span>
                        </div>
                    </div>

                    {/* Customer — contact only, no customer name */}
                    {hasCustomerContact && (
                        <div className="rc-billed">
                            <div className="rc-k">{t.billedTo}</div>
                            {invoice.customer_phone && (
                                <div className="rc-billed-row">
                                    <FiPhone size={13} />
                                    <span>{invoice.customer_phone}</span>
                                </div>
                            )}
                            {invoice.customer_email && (
                                <div className="rc-billed-row">
                                    <FiMail size={13} />
                                    <span>{invoice.customer_email}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="rc-dash" />

                    {/* Items */}
                    <div className="rc-items-head">
                        <span>
                            {t.items} ({items.length}) · {totalUnits} {t.units}
                        </span>
                        <span>₹</span>
                    </div>

                    <div className="rc-items">
                        {items.map((item, index) => (
                            <div className="rc-item" key={index} style={{ animationDelay: `${0.35 + index * 0.05}s` }}>
                                <div className="rc-item-left">
                                    <span className="rc-idx">{index + 1}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div className="rc-item-name">{item.product_name}</div>
                                        {item.description && <div className="rc-item-desc">{item.description}</div>}
                                        <div className="rc-item-meta">
                                            {formatQuantity(item)} × {formatUnitPrice(item)}
                                        </div>
                                    </div>
                                </div>
                                <div className="rc-item-total">{formatCurrency(item.total)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="rc-dash" />

                    {/* Summary */}
                    <div className="rc-sum">
                        <div className="rc-sum-row">
                            <span>{t.subtotal}</span>
                            <b>{formatCurrency(invoice.subtotal)}</b>
                        </div>
                        {discount > 0 && (
                            <div className="rc-sum-row">
                                <span>{t.discount}</span>
                                <b style={{ color: "#b91c1c" }}>-{formatCurrency(discount)}</b>
                            </div>
                        )}
                        <div className="rc-sum-row">
                            <span>CGST ({(Number(invoice.cgst_rate) || 0).toFixed(1)}%)</span>
                            <b>{formatCurrency(invoice.cgst || 0)}</b>
                        </div>
                        <div className="rc-sum-row">
                            <span>SGST ({(Number(invoice.sgst_rate) || 0).toFixed(1)}%)</span>
                            <b>{formatCurrency(invoice.sgst || 0)}</b>
                        </div>
                        <div className="rc-grand">
                            <span>{t.grandTotal}</span>
                            <span>{formatCurrency(invoice.total_amount)}</span>
                        </div>
                        <div className="rc-words">{numberToWords(totalNumber)}</div>
                    </div>

                    {invoice.notes && (
                        <div className="rc-notes">
                            <div className="rc-k">{t.note}</div>
                            <p>{invoice.notes}</p>
                        </div>
                    )}

                    {/* Shop's own terms (e.g. return policy) — shown only if your API sends `terms` */}
                    {invoice.terms && (
                        <div className="rc-notes">
                            <div className="rc-k">{t.terms}</div>
                            <p>{invoice.terms}</p>
                        </div>
                    )}

                    {showUpiQr && (
                        <div className="rc-qr">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=${encodeURIComponent(upiLink)}`}
                                alt="UPI QR"
                                width="110"
                                height="110"
                            />
                            <span>{t.scanToPay}</span>
                        </div>
                    )}

                    <div className="rc-dash" />

                    {/* Footer */}
                    <div className="rc-footer">
                        <p className="rc-thanks">{t.thanks} 🙏</p>
                        <p className="rc-small">
                            {invoice.invoice_no} · {t.footer}
                        </p>
                    </div>
                </div>
            </div>

            {toast && <div className="rc-toast no-print">{toast}</div>}
        </div>
    );
}

/* ───────────────────────── Amount in words ───────────────────────── */
function numberToWords(num) {
    if (num === 0) return "Amount in words: Zero Rupees Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    const convertHundreds = (n) => {
        let words = "";
        if (n >= 100) {
            words += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        if (n >= 20) {
            words += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        }
        if (n >= 10) {
            words += teens[n - 10] + " ";
            n = 0;
        }
        if (n > 0) {
            words += ones[n] + " ";
        }
        return words;
    };

    let rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = "";
    if (rupees >= 10000000) {
        result += convertHundreds(Math.floor(rupees / 10000000)) + "Crore ";
        rupees %= 10000000;
    }
    if (rupees >= 100000) {
        result += convertHundreds(Math.floor(rupees / 100000)) + "Lakh ";
        rupees %= 100000;
    }
    if (rupees >= 1000) {
        result += convertHundreds(Math.floor(rupees / 1000)) + "Thousand ";
        rupees %= 1000;
    }
    result += convertHundreds(rupees);

    result += "Rupees";
    if (paise > 0) {
        result += " and " + convertHundreds(paise) + "Paise";
    }
    result += " Only";

    return "Amount in words: " + result.trim();
}

/* ───────────────────────── Styles ───────────────────────── */
const baseCss = `
* { box-sizing: border-box; }

.rc-root {
    --paper: #ffffff; --ink: #0b1220; --muted: #64748b; --soft: #94a3b8;
    --line: #dbe2eb; --panel: #f8fafc; --accent: #c8ff00; --accent-ink: #0b1220;
    --hero-bg: linear-gradient(135deg, #0b1220 0%, #18243c 100%); --hero-label: #94a3b8; --hero-amount: #c8ff00;
    --page: linear-gradient(180deg, #e8ecf3 0%, #dfe5ee 100%);
    --bar: #0b1220; --idx-bg: #eef2ff; --idx-ink: #4f46e5;
    --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --width: 460px;
    min-height: 100vh; padding: 20px 14px 60px; background: var(--page);
    font-family: var(--font); color: var(--ink); transition: background .3s;
}

.rc-root[data-theme="night"] {
    --paper: #0f172a; --ink: #f1f5f9; --muted: #94a3b8; --soft: #64748b;
    --line: #263349; --panel: #162033; --idx-bg: #1e293b; --idx-ink: #a5b4fc;
    --hero-bg: linear-gradient(135deg, #020617 0%, #111c33 100%);
    --page: linear-gradient(180deg, #020617 0%, #0b1220 100%); --bar: #162033;
}

.rc-root[data-theme="thermal"] {
    --paper: #fffef8; --ink: #111111; --muted: #444444; --soft: #666666;
    --line: #111111; --panel: transparent; --accent: #111111; --accent-ink: #ffffff;
    --hero-bg: transparent; --hero-label: #444; --hero-amount: #111;
    --page: #d9d6cc; --idx-bg: transparent; --idx-ink: #111;
    --font: 'Courier New', Courier, monospace; --width: 380px;
}

.rc-bar, .rc-actions, .rc-wrap { max-width: var(--width); margin-left: auto; margin-right: auto; }

/* Top bar */
.rc-bar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    margin-bottom: 10px; padding: 8px 10px; background: var(--bar); border-radius: 14px;
    box-shadow: 0 10px 28px rgba(15,23,42,.18);
}
.rc-back { display: inline-flex; align-items: center; gap: 7px; padding: 8px 10px; border-radius: 9px;
    color: #e2e8f0; text-decoration: none; font-size: 12px; font-weight: 700; }
.rc-bar-right { display: flex; gap: 6px; }
.rc-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 999px;
    border: 1px solid #334155; background: #172033; color: #f8fafc; font-size: 11px; font-weight: 800; cursor: pointer; }
.rc-chip:hover { border-color: var(--accent); }

/* Action buttons */
.rc-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 16px; }
.rc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 6px;
    border-radius: 11px; border: 1px solid #cbd5e1; background: #fff; color: #0f172a; font-size: 12px;
    font-weight: 800; cursor: pointer; text-decoration: none; transition: transform .15s, box-shadow .15s; }
.rc-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(15,23,42,.14); }
.rc-btn:active { transform: translateY(0); }
.rc-btn-accent { background: #c8ff00; border-color: #c8ff00; }
.rc-btn-wa { background: #25d366; border-color: #25d366; color: #fff; }
.rc-btn-dark { background: #0b1220; border-color: #0b1220; color: #fff; }

/* Receipt wrapper + printing animation */
.rc-wrap { filter: drop-shadow(0 18px 30px rgba(15,23,42,.18)); }
.rc-card { position: relative; background: var(--paper); padding: 30px 24px 28px; animation: feed .9s cubic-bezier(.2,.8,.2,1) both; }

.rc-root:not([data-theme="thermal"]) .rc-card {
    --r: 9px;
    -webkit-mask:
        radial-gradient(circle var(--r) at 50% 0, transparent 98%, #000) top / calc(var(--r) * 2.4) 51% repeat-x,
        radial-gradient(circle var(--r) at 50% 100%, transparent 98%, #000) bottom / calc(var(--r) * 2.4) 51% repeat-x;
    mask:
        radial-gradient(circle var(--r) at 50% 0, transparent 98%, #000) top / calc(var(--r) * 2.4) 51% repeat-x,
        radial-gradient(circle var(--r) at 50% 100%, transparent 98%, #000) bottom / calc(var(--r) * 2.4) 51% repeat-x;
}

.rc-root[data-theme="thermal"] .rc-card { padding: 22px 16px 22px; border-top: 3px double #111; border-bottom: 3px double #111; }

@keyframes feed {
    0%   { clip-path: inset(0 0 100% 0); transform: translateY(-14px); }
    100% { clip-path: inset(0 0 0 0);    transform: translateY(0); }
}

/* Header */
.rc-header { display: flex; flex-direction: column; align-items: center; text-align: center; }
.rc-logo { width: 60px; height: 60px; object-fit: contain; border-radius: 16px; padding: 6px; margin-bottom: 10px;
    border: 1px solid var(--line); background: #fff; }
.rc-logo-ph { width: 56px; height: 56px; border-radius: 16px; background: #c8ff00; display: flex;
    align-items: center; justify-content: center; margin-bottom: 10px; }
.rc-root[data-theme="thermal"] .rc-logo, .rc-root[data-theme="thermal"] .rc-logo-ph { filter: grayscale(1) contrast(1.4); border-radius: 6px; }
.rc-biz { margin: 0 0 6px; font-size: 22px; font-weight: 900; letter-spacing: -.5px; color: var(--ink); }
.rc-root[data-theme="thermal"] .rc-biz { text-transform: uppercase; letter-spacing: 1px; font-size: 18px; }
.rc-meta { color: var(--muted); font-size: 11px; line-height: 1.7; }
.rc-meta p { display: flex; align-items: flex-start; justify-content: center; gap: 6px; margin: 0; }
.rc-gst { margin-top: 10px; padding: 4px 10px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line);
    color: var(--ink); font-size: 10px; font-weight: 800; letter-spacing: .6px; }
.rc-doctitle { margin-top: 12px; padding: 3px 14px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
    font-size: 11px; font-weight: 900; letter-spacing: 2px; color: var(--ink); text-transform: uppercase; }

/* Hero */
.rc-hero { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 22px 0 14px;
    padding: 20px 14px; border-radius: 18px; background: var(--hero-bg); overflow: hidden; }
.rc-hero-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--hero-label); }
.rc-hero-amount { font-size: 34px; font-weight: 900; letter-spacing: -1px; color: var(--hero-amount); font-variant-numeric: tabular-nums; }
.rc-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; }
.rc-root[data-theme="thermal"] .rc-hero { border: 2px dashed #111; border-radius: 4px; }

.rc-stamp { position: absolute; right: 12px; bottom: 10px; padding: 4px 10px; border: 2px solid #4ade80; color: #4ade80;
    border-radius: 6px; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;
    transform: rotate(var(--rot)); animation: slam .5s .7s cubic-bezier(.2,1.6,.4,1) both; pointer-events: none; }
.rc-root[data-theme="thermal"] .rc-stamp { border-color: #111; color: #111; }
@keyframes slam {
    0%   { opacity: 0; transform: rotate(var(--rot)) scale(2.4); }
    100% { opacity: .95; transform: rotate(var(--rot)) scale(1); }
}

.rc-saved { margin: 0 auto; width: fit-content; padding: 6px 14px; border-radius: 999px; background: #dcfce7;
    color: #0f7a4d; font-size: 12px; font-weight: 800; }

.rc-dash { border-top: 2px dashed var(--line); margin: 18px 0; }

/* Info */
.rc-info { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 12px; }
.rc-info > div { display: flex; flex-direction: column; gap: 3px; }
.rc-k { display: block; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: var(--soft); }
.rc-v { font-size: 13px; font-weight: 800; color: var(--ink); overflow-wrap: anywhere; }

.rc-billed { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: var(--panel); border: 1px solid var(--line); }
.rc-billed .rc-k { margin-bottom: 6px; }
.rc-billed-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; font-weight: 700; color: var(--ink); overflow-wrap: anywhere; }

/* Items */
.rc-items-head { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 10px; font-weight: 800;
    letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
.rc-items { display: flex; flex-direction: column; gap: 12px; }
.rc-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; animation: rise .45s ease both; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.rc-item-left { display: flex; gap: 10px; min-width: 0; }
.rc-idx { flex-shrink: 0; width: 22px; height: 22px; border-radius: 7px; background: var(--idx-bg); color: var(--idx-ink);
    font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
.rc-item-name { font-size: 13px; font-weight: 800; color: var(--ink); }
.rc-item-desc { font-size: 10px; color: var(--soft); margin-top: 2px; }
.rc-item-meta { font-size: 11px; color: var(--muted); margin-top: 3px; font-variant-numeric: tabular-nums; }
.rc-item-total { flex-shrink: 0; font-size: 13px; font-weight: 900; color: var(--ink); font-variant-numeric: tabular-nums; }

/* Summary */
.rc-sum { display: flex; flex-direction: column; gap: 2px; }
.rc-sum-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: var(--muted); }
.rc-sum-row b { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
.rc-grand { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 13px 14px;
    border-radius: 12px; background: var(--accent); color: var(--accent-ink); font-size: 16px; font-weight: 900;
    font-variant-numeric: tabular-nums; }
.rc-root[data-theme="thermal"] .rc-grand { border-radius: 3px; }
.rc-words { margin-top: 10px; font-size: 10px; line-height: 1.5; color: var(--muted); text-align: center; }

.rc-notes { margin-top: 16px; padding: 10px 12px; border-left: 4px solid var(--accent); border-radius: 8px; background: var(--panel); }
.rc-notes p { margin: 3px 0 0; font-size: 11px; line-height: 1.5; color: var(--muted); }

/* UPI QR */
.rc-qr { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 16px; padding: 14px;
    border: 1px dashed var(--line); border-radius: 14px; font-size: 11px; font-weight: 700; color: var(--muted); }
.rc-qr img { background: #fff; padding: 6px; border-radius: 10px; }

/* Footer */
.rc-footer { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.rc-thanks { margin: 0; font-size: 14px; font-weight: 900; color: var(--ink); }
.rc-small { margin: 0; font-size: 9px; color: var(--soft); }

/* Toast */
.rc-toast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); padding: 11px 18px; border-radius: 999px;
    background: #0b1220; color: #c8ff00; font-size: 12px; font-weight: 800; box-shadow: 0 12px 28px rgba(0,0,0,.3);
    animation: rise .3s ease both; z-index: 50; }

/* Loading */
.rc-center { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px; text-align: center; font-family: 'Inter', sans-serif; }
.rc-center-text { margin-top: 15px; color: #0f172a; font-size: 14px; font-weight: 800; }
.rc-spinner { width: 42px; height: 42px; border: 3px solid #dbe2eb; border-top: 3px solid #c8ff00; border-radius: 50%;
    animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 420px) {
    .rc-actions { grid-template-columns: 1fr 1fr; }
    .rc-hero-amount { font-size: 30px; }
}

/* Print: always light, no UI, no animation */
@media print {
    html, body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .rc-root { padding: 0 !important; background: #fff !important; min-height: 0 !important; }
    .rc-root[data-theme="night"] {
        --paper: #ffffff; --ink: #0b1220; --muted: #64748b; --soft: #94a3b8; --line: #dbe2eb; --panel: #f8fafc;
        --idx-bg: #eef2ff; --idx-ink: #4f46e5; --hero-bg: linear-gradient(135deg, #0b1220 0%, #18243c 100%);
    }
    .rc-wrap { filter: none !important; max-width: var(--width) !important; }
    .rc-card, .rc-item, .rc-stamp { animation: none !important; }
    .rc-stamp { opacity: .95; }
    .rc-root:not([data-theme="thermal"]) .rc-card { -webkit-mask: none; mask: none; }
}
`;