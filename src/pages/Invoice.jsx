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
    FiPackage,
    FiBox,
} from "react-icons/fi";

export default function Invoice() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPrintOptions, setShowPrintOptions] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInvoice();
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount) || 0);
    };

    // Stamp config — ink colour, label and a slight per-status tilt so each
    // one reads like it was actually pressed onto the page by hand.
    const getStampConfig = (status) => {
        const configs = {
            paid: { ink: "#1F6D4C", label: "PAID", icon: <FiCheckCircle size={15} />, rotate: -7 },
            pending: { ink: "#9C6B15", label: "PENDING", icon: <FiClock size={15} />, rotate: -4 },
            failed: { ink: "#B4402F", label: "FAILED", icon: <FiXCircle size={15} />, rotate: -9 },
            refunded: { ink: "#6B6355", label: "REFUNDED", icon: <FiRefreshCw size={15} />, rotate: -5 },
        };
        return (
            configs[status?.toLowerCase()] || {
                ink: "#6B6355",
                label: (status || "N/A").toUpperCase(),
                icon: <FiFileText size={15} />,
                rotate: -6,
            }
        );
    };

    const handlePrint = () => {
        window.print();
        setShowPrintOptions(false);
    };

    const handleDownload = () => {
        // Option 1: Print to PDF (simplest)
        window.print();
        
        // Option 2: Advanced PDF generation with a library like jsPDF or html2canvas
        // For now, we'll use the print method which allows "Save as PDF"
        alert("Click 'Print' and select 'Save as PDF' to download the invoice.");
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
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(
                    `${shareData.title}\n${shareData.text}\n${shareData.url}`
                );
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

    const PunchRow = () => (
        <div style={styles.perforationRow} aria-hidden="true">
            {Array.from({ length: 26 }).map((_, i) => (
                <span key={i} style={styles.hole}></span>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p style={styles.loadingText}>Tallying the bill...</p>
                <p style={styles.loadingSubtext}>Fetching entry from the ledger</p>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>📄</div>
                <h2 style={styles.errorTitle}>Bill not found</h2>
                <p style={styles.errorText}>
                    {error || "This entry doesn't exist in the ledger, or it's been removed."}
                </p>
                <Link to="/sales" style={styles.errorButton}>
                    <FiArrowLeft size={18} />
                    Back to Sales
                </Link>
            </div>
        );
    }

    const stamp = getStampConfig(invoice.payment_status);
    const totalItems = items.reduce((sum, item) => sum + Number(item.entered_quantity || item.quantity || 0), 0);

    return (
        <div style={styles.page}>
            {/* Action Bar */}
            <div style={styles.actionBar} className="no-print">
                <Link to="/sales" style={styles.backLink}>
                    <FiArrowLeft size={18} />
                    Back to Sales
                </Link>
                <div style={styles.actionButtons}>
                    <button style={styles.actionButton} onClick={() => setShowPrintOptions(!showPrintOptions)}>
                        <FiPrinter size={18} />
                        Print
                    </button>
                    <button style={styles.actionButton} onClick={handleDownload}>
                        <FiDownload size={18} />
                        Download
                    </button>
                    <button style={styles.actionButton} onClick={handleShare}>
                        <FiShare2 size={18} />
                        Share
                    </button>
                </div>
            </div>

            {showPrintOptions && (
                <div style={styles.printOptions} className="no-print">
                    <button onClick={handlePrint} style={styles.printOptionButton}>
                        <FiPrinter size={16} />
                        Print Invoice
                    </button>
                    <button onClick={() => window.print()} style={styles.printOptionButton}>
                        <FiFileText size={16} />
                        Print Preview
                    </button>
                </div>
            )}

            {/* Bill */}
            <div style={styles.invoiceContainer} id="invoice-content">
                <div style={styles.invoice}>
                    <PunchRow />

                    <div style={styles.paperBody}>
                        {/* Masthead */}
                        <div style={styles.masthead}>
                            <div style={styles.businessBlock}>
                                {invoice.logo ? (
                                    <img src={invoice.logo} alt="Business Logo" style={styles.businessLogo} />
                                ) : (
                                    <div style={styles.businessLogoPlaceholder}>
                                        <FiBox size={26} color="#1F6D4C" />
                                    </div>
                                )}
                                <h1 style={styles.businessName}>{invoice.business_name || "Business Name"}</h1>
                                <div style={styles.businessMeta}>
                                    {invoice.address && (
                                        <p style={styles.metaLine}>
                                            <FiMapPin size={12} />
                                            {invoice.address}
                                            {invoice.city ? `, ${invoice.city}` : ""} 
                                            {invoice.state ? `, ${invoice.state}` : ""} 
                                            {invoice.pincode ? ` - ${invoice.pincode}` : ""}
                                        </p>
                                    )}
                                    {invoice.business_phone && (
                                        <p style={styles.metaLine}>
                                            <FiPhone size={12} />
                                            {invoice.business_phone}
                                        </p>
                                    )}
                                    {invoice.business_email && (
                                        <p style={styles.metaLine}>
                                            <FiMail size={12} />
                                            {invoice.business_email}
                                        </p>
                                    )}
                                </div>
                                {invoice.gst_number && <div style={styles.gstTag}>GSTIN {invoice.gst_number}</div>}
                            </div>

                            <div style={styles.billTag}>
                                <span style={styles.billTagLabel}>Bill No.</span>
                                <span style={styles.billTagNo}>#{invoice.invoice_no}</span>
                                <span style={styles.billTagDate}>
                                    {new Date(invoice.created_at).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}{" "}
                                    ·{" "}
                                    {new Date(invoice.created_at).toLocaleTimeString("en-IN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>

                            {/* Ink stamp — the signature element */}
                            <div
                                style={{
                                    ...styles.stamp,
                                    color: stamp.ink,
                                    borderColor: stamp.ink,
                                    transform: `rotate(${stamp.rotate}deg)`,
                                }}
                            >
                                {stamp.icon}
                                {stamp.label}
                            </div>
                        </div>

                        <div style={styles.tornDivider}></div>

                        {/* Ledger fields */}
                        <div style={styles.ledgerGrid}>
                            <div style={styles.ledgerCol}>
                                <div style={styles.ledgerColTitle}>Billed to</div>
                                <div style={styles.ledgerField}>
                                    <span style={styles.ledgerLabel}>Name</span>
                                    <span style={styles.ledgerLeader}></span>
                                    <span style={styles.ledgerValue}>{invoice.customer_name || "Walk-in Customer"}</span>
                                </div>
                                {invoice.customer_phone && (
                                    <div style={styles.ledgerField}>
                                        <span style={styles.ledgerLabel}>
                                            <FiPhone size={11} /> Phone
                                        </span>
                                        <span style={styles.ledgerLeader}></span>
                                        <span style={styles.ledgerValue}>{invoice.customer_phone}</span>
                                    </div>
                                )}
                                {invoice.customer_email && (
                                    <div style={styles.ledgerField}>
                                        <span style={styles.ledgerLabel}>
                                            <FiMail size={11} /> Email
                                        </span>
                                        <span style={styles.ledgerLeader}></span>
                                        <span style={styles.ledgerValue}>{invoice.customer_email}</span>
                                    </div>
                                )}
                            </div>

                            <div style={styles.ledgerCol}>
                                <div style={styles.ledgerColTitle}>Payment</div>
                                <div style={styles.ledgerField}>
                                    <span style={styles.ledgerLabel}>Method</span>
                                    <span style={styles.ledgerLeader}></span>
                                    <span style={styles.ledgerValue}>
                                        {getPaymentIcon(invoice.payment_method)} {invoice.payment_method || "N/A"}
                                    </span>
                                </div>
                                <div style={styles.ledgerField}>
                                    <span style={styles.ledgerLabel}>Items</span>
                                    <span style={styles.ledgerLeader}></span>
                                    <span style={styles.ledgerValue}>
                                        {items.length} items · {totalItems} units
                                    </span>
                                </div>
                                <div style={styles.ledgerField}>
                                    <span style={styles.ledgerLabel}>Status</span>
                                    <span style={styles.ledgerLeader}></span>
                                    <span style={{ ...styles.ledgerValue, color: stamp.ink, fontWeight: 700 }}>{stamp.label}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items table */}
                        <div style={styles.tableSection}>
                            <div style={styles.tableHeader}>
                                <h3 style={styles.tableTitle}>
                                    <FiPackage size={16} />
                                    Items
                                </h3>
                            </div>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.th, width: "34px" }}>#</th>
                                            <th style={styles.th}>Product</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>Qty</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>Rate</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} style={styles.tr}>
                                                <td style={styles.td}>
                                                    <span style={styles.serialNumber}>{index + 1}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={styles.productName}>{item.product_name}</div>
                                                    {item.description && <div style={styles.productDescription}>{item.description}</div>}
                                                </td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>
                                                    <div style={styles.mono}>{formatQuantity(item)}</div>
                                                    {item.entered_unit !== item.base_unit && (
                                                        <div style={styles.convertedQuantity}>
                                                            = {Number(item.base_quantity || item.quantity || 0)} {item.base_unit || item.unit}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>
                                                    <div style={styles.mono}>{formatUnitPrice(item)}</div>
                                                </td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>
                                                    <div style={{ ...styles.mono, fontWeight: 700, color: "#1F2A22" }}>
                                                        {formatCurrency(item.total)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        <div style={styles.summarySection}>
                            <div style={styles.summaryBox}>
                                <div style={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span style={styles.mono}>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                {invoice.discount > 0 && (
                                    <div style={styles.summaryRow}>
                                        <span>Discount</span>
                                        <span style={{ ...styles.mono, color: "#B4402F" }}>-{formatCurrency(invoice.discount)}</span>
                                    </div>
                                )}
                                <div style={styles.summaryRow}>
                                    <span>CGST ({(Number(invoice.cgst_rate) || 0).toFixed(1)}%)</span>
                                    <span style={styles.mono}>{formatCurrency(invoice.cgst || 0)}</span>
                                </div>
                                <div style={styles.summaryRow}>
                                    <span>SGST ({(Number(invoice.sgst_rate) || 0).toFixed(1)}%)</span>
                                    <span style={styles.mono}>{formatCurrency(invoice.sgst || 0)}</span>
                                </div>
                                <div style={styles.summaryDashedDivider}></div>
                                <div style={{ ...styles.summaryRow, ...styles.grandTotal }}>
                                    <span>Grand Total</span>
                                    <span style={styles.mono}>{formatCurrency(invoice.total_amount)}</span>
                                </div>
                                <div style={styles.wordsChit}>{numberToWords(Number(invoice.total_amount) || 0)}</div>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div style={styles.notesSection}>
                                <div style={styles.notesTitle}>Note</div>
                                <p style={styles.notesText}>{invoice.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={styles.bottomRow}>
                            <div style={styles.footerNote}>
                                <p style={styles.thankYou}>Thank you for your business!</p>
                                <p style={styles.footerSmall}>Computer-generated bill · no signature required</p>
                            </div>
                        </div>
                    </div>

                    <PunchRow />
                </div>
            </div>
        </div>
    );
}

// Helper function to convert number to words
function numberToWords(num) {
    if (num === 0) return "Zero Rupees Only";

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

// Modern BusinessOS / trading-style invoice theme.
// Data, API calls and invoice calculations above remain unchanged so every owner
// gets the same interface while seeing only their own invoice data.
const styles = {
    page: {
        minHeight: "100vh",
        background: "#eef1f6",
        padding: "24px 18px 50px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
    },

    actionBar: {
        maxWidth: "980px",
        margin: "0 auto 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        flexWrap: "wrap",
        padding: "11px 14px",
        background: "#0b1220",
        border: "1px solid #1e293b",
        borderRadius: "14px",
        boxShadow: "0 12px 30px rgba(15,23,42,.12)",
    },

    backLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 11px",
        borderRadius: "9px",
        color: "#e2e8f0",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "800",
    },

    actionButtons: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        flexWrap: "wrap",
    },

    actionButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        minHeight: "38px",
        padding: "8px 13px",
        border: "1px solid #334155",
        borderRadius: "9px",
        background: "#172033",
        color: "#f8fafc",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
    },

    printOptions: {
        maxWidth: "980px",
        margin: "0 auto 12px",
        display: "flex",
        justifyContent: "flex-end",
        gap: "7px",
        padding: "10px",
        borderRadius: "12px",
        background: "#fff",
        border: "1px solid #dce2eb",
        boxShadow: "0 8px 22px rgba(15,23,42,.06)",
    },

    printOptionButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "9px 12px",
        border: "1px solid #dce2eb",
        borderRadius: "8px",
        background: "#f8fafc",
        color: "#0f172a",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
    },

    invoiceContainer: {
        maxWidth: "980px",
        margin: "0 auto",
    },

    invoice: {
        overflow: "hidden",
        background: "#ffffff",
        border: "1px solid #dce2eb",
        borderRadius: "18px",
        boxShadow: "0 18px 55px rgba(15,23,42,.10)",
    },

    perforationRow: {
        display: "none",
    },

    hole: {
        display: "none",
    },

    paperBody: {
        padding: "0 34px 34px",
    },

    masthead: {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "24px",
        alignItems: "center",
        margin: "0 -34px 26px",
        padding: "30px 34px",
        minHeight: "205px",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0b1220 0%, #111827 60%, #18243c 100%)",
        color: "#fff",
    },

    businessBlock: {
        position: "relative",
        zIndex: 2,
        minWidth: 0,
    },

    businessLogo: {
        width: "58px",
        height: "58px",
        objectFit: "contain",
        padding: "7px",
        marginBottom: "12px",
        borderRadius: "13px",
        background: "#ffffff",
        border: "1px solid rgba(255,255,255,.18)",
    },

    businessLogoPlaceholder: {
        width: "58px",
        height: "58px",
        marginBottom: "12px",
        borderRadius: "13px",
        background: "#c8ff00",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0b1220",
    },

    businessName: {
        margin: "0 0 8px",
        fontSize: "30px",
        lineHeight: 1.05,
        fontWeight: "900",
        letterSpacing: "-1px",
        color: "#ffffff",
    },

    businessMeta: {
        color: "#aeb9ca",
        fontSize: "12px",
        lineHeight: 1.75,
    },

    metaLine: {
        display: "flex",
        alignItems: "flex-start",
        gap: "7px",
        margin: 0,
    },

    gstTag: {
        display: "inline-flex",
        marginTop: "10px",
        padding: "5px 9px",
        borderRadius: "7px",
        background: "rgba(200,255,0,.10)",
        border: "1px solid rgba(200,255,0,.30)",
        color: "#d9ff65",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: ".5px",
    },

    billTag: {
        position: "relative",
        zIndex: 2,
        minWidth: "235px",
        padding: "17px",
        borderRadius: "14px",
        background: "rgba(255,255,255,.07)",
        border: "1px solid rgba(255,255,255,.12)",
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },

    billTagLabel: {
        fontSize: "9px",
        textTransform: "uppercase",
        letterSpacing: "1.4px",
        color: "#aeb9ca",
        fontWeight: "900",
    },

    billTagNo: {
        fontSize: "20px",
        fontWeight: "900",
        color: "#c8ff00",
        letterSpacing: "-.3px",
        overflowWrap: "anywhere",
    },

    billTagDate: {
        fontSize: "11px",
        color: "#cbd5e1",
    },

    stamp: {
        position: "absolute",
        right: "34px",
        bottom: "20px",
        zIndex: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 11px",
        border: "2px solid currentColor",
        borderRadius: "7px",
        background: "rgba(11,18,32,.72)",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        opacity: .95,
        pointerEvents: "none",
    },

    tornDivider: {
        height: "1px",
        margin: "0 0 22px",
        background: "#e5eaf1",
    },

    ledgerGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
        marginBottom: "24px",
    },

    ledgerCol: {
        padding: "16px",
        border: "1px solid #e5eaf1",
        borderRadius: "13px",
        background: "#f8fafc",
    },

    ledgerColTitle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "#64748b",
    },

    ledgerField: {
        display: "flex",
        alignItems: "baseline",
        gap: "7px",
        minHeight: "29px",
        padding: "3px 0",
        fontSize: "12px",
    },

    ledgerLabel: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        color: "#94a3b8",
        whiteSpace: "nowrap",
    },

    ledgerLeader: {
        flex: 1,
        minWidth: "10px",
        borderBottom: "1px dotted #cbd5e1",
        transform: "translateY(-3px)",
    },

    ledgerValue: {
        color: "#0f172a",
        fontWeight: "800",
        textAlign: "right",
        overflowWrap: "anywhere",
    },

    tableSection: {
        marginBottom: "22px",
    },

    tableHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "9px",
    },

    tableTitle: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        margin: 0,
        fontSize: "11px",
        fontWeight: "900",
        color: "#0f172a",
        letterSpacing: ".8px",
        textTransform: "uppercase",
    },

    tableWrapper: {
        overflowX: "auto",
        border: "1px solid #e5eaf1",
        borderRadius: "12px",
    },

    table: {
        width: "100%",
        minWidth: "600px",
        borderCollapse: "collapse",
        fontSize: "12px",
    },

    th: {
        padding: "11px 10px",
        textAlign: "left",
        fontWeight: "900",
        color: "#64748b",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        fontSize: "9px",
        textTransform: "uppercase",
        letterSpacing: ".7px",
        whiteSpace: "nowrap",
    },

    tr: {
        borderBottom: "1px solid #eef2f7",
    },

    td: {
        padding: "12px 10px",
        verticalAlign: "top",
    },

    serialNumber: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "25px",
        height: "25px",
        borderRadius: "7px",
        background: "#eef2ff",
        color: "#4f46e5",
        fontSize: "10px",
        fontWeight: "900",
    },

    productName: {
        color: "#0f172a",
        fontWeight: "800",
        fontSize: "12px",
    },

    productDescription: {
        marginTop: "3px",
        color: "#94a3b8",
        fontSize: "10px",
    },

    convertedQuantity: {
        marginTop: "3px",
        color: "#94a3b8",
        fontSize: "9px",
    },

    mono: {
        color: "#0f172a",
        fontSize: "11px",
        fontVariantNumeric: "tabular-nums",
    },

    summarySection: {
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "22px",
    },

    summaryBox: {
        width: "100%",
        maxWidth: "390px",
        padding: "17px",
        borderRadius: "14px",
        border: "1px solid #e5eaf1",
        background: "#f8fafc",
    },

    summaryRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
        padding: "5px 0",
        fontSize: "12px",
        color: "#64748b",
    },

    summaryDashedDivider: {
        borderTop: "1px dashed #cbd5e1",
        margin: "9px 0",
    },

    grandTotal: {
        margin: "0 -8px",
        padding: "12px 10px",
        borderRadius: "10px",
        background: "#c8ff00",
        color: "#0b1220",
        fontSize: "18px",
        fontWeight: "950",
    },

    wordsChit: {
        marginTop: "10px",
        paddingTop: "9px",
        borderTop: "1px solid #e2e8f0",
        color: "#64748b",
        fontSize: "10px",
        lineHeight: 1.5,
    },

    notesSection: {
        marginBottom: "22px",
        padding: "12px 14px",
        border: "1px solid #e5eaf1",
        borderLeft: "4px solid #c8ff00",
        borderRadius: "10px",
        background: "#f8fafc",
    },

    notesTitle: {
        marginBottom: "4px",
        color: "#64748b",
        fontSize: "9px",
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: ".9px",
    },

    notesText: {
        margin: 0,
        color: "#334155",
        fontSize: "11px",
        lineHeight: 1.55,
    },

    bottomRow: {
        display: "flex",
        justifyContent: "flex-end",
        paddingTop: "17px",
        borderTop: "1px solid #e5eaf1",
    },

    footerNote: {
        textAlign: "right",
    },

    thankYou: {
        margin: "0 0 4px",
        color: "#0f172a",
        fontSize: "13px",
        fontWeight: "900",
    },

    footerSmall: {
        margin: 0,
        color: "#94a3b8",
        fontSize: "9px",
    },

    loadingContainer: {
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        background: "#eef1f6",
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
        marginBottom: 0,
        color: "#0f172a",
        fontSize: "14px",
        fontWeight: "800",
    },

    loadingSubtext: {
        marginTop: "5px",
        color: "#64748b",
        fontSize: "11px",
    },

    errorContainer: {
        maxWidth: "460px",
        margin: "0 auto",
        padding: "80px 20px",
        textAlign: "center",
    },

    errorIcon: {
        marginBottom: "15px",
        fontSize: "50px",
    },

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
        fontWeight: "850",
    },
};

// Fonts + responsive + print rules.
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    * { box-sizing: border-box; }

    @media (max-width: 760px) {
        .invoice-mobile-fix {}
    }

    @media print {
        @page {
            size: A4;
            margin: 8mm;
        }

        html, body {
            background: #fff !important;
        }

        body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .no-print {
            display: none !important;
        }

        #invoice-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
        }

        #invoice-content > div {
            box-shadow: none !important;
        }
    }
`;
document.head.appendChild(styleSheet);
