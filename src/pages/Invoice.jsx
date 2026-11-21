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
} from "react-icons/fi";

export default function Invoice() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInvoice();
        // eslint-disable-next-line
    }, [id]);

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
        const configs = {
            paid: { color: "#0f7a4d", bg: "#dcfce7", label: "Paid", icon: <FiCheckCircle size={14} /> },
            pending: { color: "#a16207", bg: "#fef3c7", label: "Pending", icon: <FiClock size={14} /> },
            failed: { color: "#b91c1c", bg: "#fee2e2", label: "Failed", icon: <FiXCircle size={14} /> },
            refunded: { color: "#475569", bg: "#e2e8f0", label: "Refunded", icon: <FiRefreshCw size={14} /> },
        };
        return (
            configs[status?.toLowerCase()] || {
                color: "#475569",
                bg: "#e2e8f0",
                label: status || "N/A",
                icon: <FiFileText size={14} />,
            }
        );
    };

    const handlePrint = () => window.print();

    const handleDownload = () => {
        window.print();
        alert("Choose 'Save as PDF' in the print dialog to download the invoice.");
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
                alert("Invoice link copied to clipboard!");
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Share failed:", err);
                alert("Unable to share. Please try again.");
            }
        }
    };

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
        return `₹${price.toFixed(2)} / ${baseUnit.toUpperCase()}`;
    };

    // Decorative barcode generated from the bill number
    const Barcode = ({ value }) => {
        const text = String(value || "000000");
        const bars = [];
        for (let i = 0; i < 48; i++) {
            const code = text.charCodeAt(i % text.length) + i * 7;
            bars.push(1 + (code % 3));
        }
        return (
            <div style={styles.barcode} aria-hidden="true">
                {bars.map((w, i) => (
                    <span
                        key={i}
                        style={{
                            width: `${w}px`,
                            marginRight: i % 2 === 0 ? "2px" : "1px",
                            background: i % 2 === 0 ? "#0f172a" : "transparent",
                            height: "100%",
                        }}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p style={styles.loadingText}>Preparing your receipt...</p>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>🧾</div>
                <h2 style={styles.errorTitle}>Receipt not found</h2>
                <p style={styles.errorText}>
                    {error || "This receipt doesn't exist, or it has been removed."}
                </p>
                <Link to="/sales" replace style={styles.errorButton}>
                    <FiArrowLeft size={18} />
                    Back to Sales
                </Link>
            </div>
        );
    }

    const status = getStatus(invoice.payment_status);
    const totalUnits = items.reduce(
        (sum, item) => sum + Number(item.entered_quantity || item.quantity || 0),
        0
    );
    const hasCustomerContact = invoice.customer_phone || invoice.customer_email;

    return (
        <div style={styles.page}>
            {/* Action Bar */}
            <div style={styles.actionBar} className="no-print">
                <Link to="/sales" replace style={styles.backLink}>
                    <FiArrowLeft size={18} />
                    Back
                </Link>
                <div style={styles.actionButtons}>
                    <button style={styles.actionButton} onClick={handlePrint}>
                        <FiPrinter size={16} />
                        Print
                    </button>
                    <button style={styles.actionButton} onClick={handleDownload}>
                        <FiDownload size={16} />
                        PDF
                    </button>
                    <button style={styles.actionButtonPrimary} onClick={handleShare}>
                        <FiShare2 size={16} />
                        Share
                    </button>
                </div>
            </div>

            {/* Receipt */}
            <div style={styles.receiptWrap} id="invoice-content">
                <div className="receipt-card" style={styles.receipt}>
                    {/* Header */}
                    <div style={styles.header}>
                        {invoice.logo ? (
                            <img src={invoice.logo} alt="Business Logo" style={styles.logo} />
                        ) : (
                            <div style={styles.logoPlaceholder}>
                                <FiBox size={24} color="#0b1220" />
                            </div>
                        )}
                        <h1 style={styles.businessName}>{invoice.business_name || "Business Name"}</h1>

                        <div style={styles.businessMeta}>
                            {invoice.address && (
                                <p style={styles.metaLine}>
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
                                <p style={styles.metaLine}>
                                    <FiPhone size={12} />
                                    <span>{invoice.business_phone}</span>
                                </p>
                            )}
                            {invoice.business_email && (
                                <p style={styles.metaLine}>
                                    <FiMail size={12} />
                                    <span>{invoice.business_email}</span>
                                </p>
                            )}
                        </div>
                        {invoice.gst_number && <div style={styles.gstTag}>GSTIN {invoice.gst_number}</div>}
                    </div>

                    {/* Amount hero */}
                    <div style={styles.hero}>
                        <span style={styles.heroLabel}>Total Amount</span>
                        <span style={styles.heroAmount}>{formatCurrency(invoice.total_amount)}</span>
                        <span
                            style={{
                                ...styles.statusPill,
                                color: status.color,
                                background: status.bg,
                            }}
                        >
                            {status.icon}
                            {status.label}
                        </span>
                    </div>

                    <div style={styles.dashed}></div>

                    {/* Bill info */}
                    <div style={styles.infoGrid}>
                        <div style={styles.infoCell}>
                            <span style={styles.infoLabel}>Bill No.</span>
                            <span style={styles.infoValue}>#{invoice.invoice_no}</span>
                        </div>
                        <div style={styles.infoCell}>
                            <span style={styles.infoLabel}>Date</span>
                            <span style={styles.infoValue}>
                                {new Date(invoice.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                        <div style={styles.infoCell}>
                            <span style={styles.infoLabel}>Time</span>
                            <span style={styles.infoValue}>
                                {new Date(invoice.created_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <div style={styles.infoCell}>
                            <span style={styles.infoLabel}>Payment</span>
                            <span style={styles.infoValue}>
                                {getPaymentIcon(invoice.payment_method)}{" "}
                                <span style={{ textTransform: "capitalize" }}>{invoice.payment_method || "N/A"}</span>
                            </span>
                        </div>
                    </div>

                    {/* Billed to — customer NAME row removed, only contact shown */}
                    {hasCustomerContact && (
                        <div style={styles.billedTo}>
                            <div style={styles.billedToTitle}>Billed to</div>
                            {invoice.customer_phone && (
                                <div style={styles.billedField}>
                                    <FiPhone size={13} color="#64748b" />
                                    <span style={styles.billedValue}>{invoice.customer_phone}</span>
                                </div>
                            )}
                            {invoice.customer_email && (
                                <div style={styles.billedField}>
                                    <FiMail size={13} color="#64748b" />
                                    <span style={styles.billedValue}>{invoice.customer_email}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={styles.dashed}></div>

                    {/* Items */}
                    <div style={styles.itemsHeader}>
                        <span>Items ({items.length})</span>
                        <span>{totalUnits} units</span>
                    </div>

                    <div style={styles.itemList}>
                        {items.map((item, index) => (
                            <div key={index} style={styles.itemRow}>
                                <div style={styles.itemLeft}>
                                    <span style={styles.itemIndex}>{index + 1}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={styles.itemName}>{item.product_name}</div>
                                        {item.description && <div style={styles.itemDesc}>{item.description}</div>}
                                        <div style={styles.itemMeta}>
                                            {formatQuantity(item)} × {formatUnitPrice(item)}
                                        </div>
                                    </div>
                                </div>
                                <div style={styles.itemTotal}>{formatCurrency(item.total)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={styles.dashed}></div>

                    {/* Summary */}
                    <div style={styles.summary}>
                        <div style={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span style={styles.num}>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.discount > 0 && (
                            <div style={styles.summaryRow}>
                                <span>Discount</span>
                                <span style={{ ...styles.num, color: "#b91c1c" }}>-{formatCurrency(invoice.discount)}</span>
                            </div>
                        )}
                        <div style={styles.summaryRow}>
                            <span>CGST ({(Number(invoice.cgst_rate) || 0).toFixed(1)}%)</span>
                            <span style={styles.num}>{formatCurrency(invoice.cgst || 0)}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span>SGST ({(Number(invoice.sgst_rate) || 0).toFixed(1)}%)</span>
                            <span style={styles.num}>{formatCurrency(invoice.sgst || 0)}</span>
                        </div>

                        <div style={styles.grandTotal}>
                            <span>Grand Total</span>
                            <span style={styles.num}>{formatCurrency(invoice.total_amount)}</span>
                        </div>
                        <div style={styles.words}>{numberToWords(Number(invoice.total_amount) || 0)}</div>
                    </div>

                    {invoice.notes && (
                        <div style={styles.notes}>
                            <div style={styles.notesTitle}>Note</div>
                            <p style={styles.notesText}>{invoice.notes}</p>
                        </div>
                    )}

                    <div style={styles.dashed}></div>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <p style={styles.thankYou}>Thank you, visit again! 🙏</p>
                        <Barcode value={invoice.invoice_no} />
                        <p style={styles.footerSmall}>
                            {invoice.invoice_no} · Computer-generated receipt, no signature required
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to convert number to words
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

const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(180deg, #e8ecf3 0%, #dfe5ee 100%)",
        padding: "22px 14px 50px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
    },

    actionBar: {
        maxWidth: "460px",
        margin: "0 auto 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "8px 10px",
        background: "#0b1220",
        borderRadius: "14px",
        boxShadow: "0 10px 28px rgba(15,23,42,.18)",
    },

    backLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "8px 10px",
        borderRadius: "9px",
        color: "#e2e8f0",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "700",
    },

    actionButtons: { display: "flex", alignItems: "center", gap: "6px" },

    actionButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        border: "1px solid #334155",
        borderRadius: "9px",
        background: "#172033",
        color: "#f8fafc",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },

    actionButtonPrimary: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        border: "1px solid #c8ff00",
        borderRadius: "9px",
        background: "#c8ff00",
        color: "#0b1220",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
    },

    receiptWrap: {
        maxWidth: "460px",
        margin: "0 auto",
        filter: "drop-shadow(0 18px 30px rgba(15,23,42,.16))",
    },

    receipt: {
        position: "relative",
        background: "#ffffff",
        padding: "30px 24px 28px",
    },

    header: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
    },

    logo: {
        width: "60px",
        height: "60px",
        objectFit: "contain",
        borderRadius: "16px",
        padding: "6px",
        marginBottom: "10px",
        border: "1px solid #e5eaf1",
        background: "#fff",
    },

    logoPlaceholder: {
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "#c8ff00",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "10px",
    },

    businessName: {
        margin: "0 0 6px",
        fontSize: "22px",
        fontWeight: "900",
        letterSpacing: "-.5px",
        color: "#0b1220",
    },

    businessMeta: {
        color: "#64748b",
        fontSize: "11px",
        lineHeight: 1.7,
    },

    metaLine: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "6px",
        margin: 0,
    },

    gstTag: {
        marginTop: "10px",
        padding: "4px 10px",
        borderRadius: "999px",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        color: "#334155",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: ".6px",
    },

    hero: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        margin: "22px 0 20px",
        padding: "20px 14px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #0b1220 0%, #18243c 100%)",
    },

    heroLabel: {
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#94a3b8",
    },

    heroAmount: {
        fontSize: "34px",
        fontWeight: "900",
        letterSpacing: "-1px",
        color: "#c8ff00",
        fontVariantNumeric: "tabular-nums",
    },

    statusPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "800",
    },

    dashed: {
        borderTop: "2px dashed #dbe2eb",
        margin: "18px 0",
    },

    infoGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px 12px",
    },

    infoCell: { display: "flex", flexDirection: "column", gap: "3px" },

    infoLabel: {
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#94a3b8",
    },

    infoValue: {
        fontSize: "13px",
        fontWeight: "800",
        color: "#0f172a",
        overflowWrap: "anywhere",
    },

    billedTo: {
        marginTop: "16px",
        padding: "12px 14px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px solid #e5eaf1",
    },

    billedToTitle: {
        marginBottom: "6px",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#94a3b8",
    },

    billedField: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "3px 0",
    },

    billedValue: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#0f172a",
        overflowWrap: "anywhere",
    },

    itemsHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "10px",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#64748b",
    },

    itemList: { display: "flex", flexDirection: "column", gap: "12px" },

    itemRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
    },

    itemLeft: { display: "flex", gap: "10px", minWidth: 0 },

    itemIndex: {
        flexShrink: 0,
        width: "22px",
        height: "22px",
        borderRadius: "7px",
        background: "#eef2ff",
        color: "#4f46e5",
        fontSize: "10px",
        fontWeight: "900",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    itemName: { fontSize: "13px", fontWeight: "800", color: "#0f172a" },
    itemDesc: { fontSize: "10px", color: "#94a3b8", marginTop: "2px" },
    itemMeta: {
        fontSize: "11px",
        color: "#64748b",
        marginTop: "3px",
        fontVariantNumeric: "tabular-nums",
    },

    itemTotal: {
        flexShrink: 0,
        fontSize: "13px",
        fontWeight: "900",
        color: "#0f172a",
        fontVariantNumeric: "tabular-nums",
    },

    summary: { display: "flex", flexDirection: "column", gap: "2px" },

    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: "12px",
        color: "#64748b",
    },

    num: { fontVariantNumeric: "tabular-nums", color: "#0f172a", fontWeight: "700" },

    grandTotal: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "10px",
        padding: "13px 14px",
        borderRadius: "12px",
        background: "#c8ff00",
        color: "#0b1220",
        fontSize: "16px",
        fontWeight: "900",
    },

    words: {
        marginTop: "10px",
        fontSize: "10px",
        lineHeight: 1.5,
        color: "#64748b",
        textAlign: "center",
    },

    notes: {
        marginTop: "16px",
        padding: "10px 12px",
        borderLeft: "4px solid #c8ff00",
        borderRadius: "8px",
        background: "#f8fafc",
    },

    notesTitle: {
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#94a3b8",
        marginBottom: "3px",
    },

    notesText: { margin: 0, fontSize: "11px", lineHeight: 1.5, color: "#334155" },

    footer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        textAlign: "center",
    },

    thankYou: { margin: 0, fontSize: "14px", fontWeight: "900", color: "#0b1220" },

    barcode: {
        display: "flex",
        alignItems: "stretch",
        height: "42px",
        padding: "0 4px",
    },

    footerSmall: { margin: 0, fontSize: "9px", color: "#94a3b8" },

    loadingContainer: {
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
    },

    loadingSpinner: {
        width: "42px",
        height: "42px",
        border: "3px solid #dbe2eb",
        borderTop: "3px solid #c8ff00",
        borderRadius: "50%",
        animation: "spin .8s linear infinite",
    },

    loadingText: {
        marginTop: "15px",
        color: "#0f172a",
        fontSize: "14px",
        fontWeight: "800",
    },

    errorContainer: {
        maxWidth: "460px",
        margin: "0 auto",
        padding: "80px 20px",
        textAlign: "center",
    },

    errorIcon: { marginBottom: "15px", fontSize: "50px" },

    errorTitle: {
        marginBottom: "8px",
        color: "#0f172a",
        fontSize: "22px",
        fontWeight: "900",
    },

    errorText: {
        marginBottom: "20px",
        color: "#64748b",
        fontSize: "13px",
        lineHeight: 1.5,
    },

    errorButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "10px 16px",
        borderRadius: "9px",
        background: "#0b1220",
        color: "#fff",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "800",
    },
};

// Animations, scalloped tear-off edges and print rules.
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    * { box-sizing: border-box; }

    /* Scalloped top and bottom edges */
    .receipt-card {
        --r: 9px;
        -webkit-mask:
            radial-gradient(circle var(--r) at 50% 0, transparent 98%, #000) top / calc(var(--r) * 2.4) 51% repeat-x,
            radial-gradient(circle var(--r) at 50% 100%, transparent 98%, #000) bottom / calc(var(--r) * 2.4) 51% repeat-x;
        mask:
            radial-gradient(circle var(--r) at 50% 0, transparent 98%, #000) top / calc(var(--r) * 2.4) 51% repeat-x,
            radial-gradient(circle var(--r) at 50% 100%, transparent 98%, #000) bottom / calc(var(--r) * 2.4) 51% repeat-x;
    }

    @media print {
        @page { size: A4; margin: 8mm; }

        html, body { background: #fff !important; }

        body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .no-print { display: none !important; }

        #invoice-content {
            max-width: 460px !important;
            margin: 0 auto !important;
            filter: none !important;
        }
    }
`;
document.head.appendChild(styleSheet);