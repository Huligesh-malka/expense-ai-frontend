import { useEffect, useState } from "react";
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

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/sales/invoice/${id}`);
            setInvoice(res.data.invoice);
            setItems(res.data.items || []);
        } catch (err) {
            console.error("Error loading invoice:", err);
            alert("Unable to load invoice. Please try again.");
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

    if (!invoice) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>📄</div>
                <h2 style={styles.errorTitle}>Bill not found</h2>
                <p style={styles.errorText}>This entry doesn't exist in the ledger, or it's been removed.</p>
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
                    <button style={styles.actionButton}>
                        <FiDownload size={18} />
                        Download
                    </button>
                    <button style={styles.actionButton}>
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
                                {/* UPDATED: Use invoice.logo directly from API response */}
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

                        {/* QR + footer */}
                        <div style={styles.bottomRow}>
                            <div style={styles.qrBlock}>
                                <div style={styles.qrBox}>
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <div key={i} style={{ ...styles.qrDot, opacity: Math.random() > 0.5 ? 1 : 0.25 }}></div>
                                    ))}
                                </div>
                                <p style={styles.qrText}>Scan to verify</p>
                                <p style={styles.qrSubtext}>{invoice.invoice_no}</p>
                            </div>
                            <div style={styles.footerNote}>
                                <p style={styles.thankYou}>Dhanyavadagalu — thank you, come again!</p>
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

// Palette: paper #F3EFE6 · card #FFFEFB · ink #2A2621 · counter green #1F6D4C
// Type: display "Rozha One" (signboard feel), body "Work Sans", ledger digits "JetBrains Mono"
const styles = {
    page: {
        background: "#F3EFE6",
        padding: "28px 20px",
        minHeight: "100vh",
        fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    actionBar: {
        maxWidth: "760px",
        margin: "0 auto 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        background: "#FFFEFB",
        padding: "12px 18px",
        borderRadius: "10px",
        border: "1px solid #E4DCC4",
    },
    backLink: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "#6B6355",
        textDecoration: "none",
        fontWeight: "600",
        fontSize: "14px",
        padding: "6px 10px",
        borderRadius: "6px",
    },
    actionButtons: { display: "flex", gap: "8px" },
    actionButton: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        background: "#FFFEFB",
        border: "1px solid #D8CFB0",
        borderRadius: "7px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#2A2621",
        cursor: "pointer",
    },
    printOptions: {
        maxWidth: "760px",
        margin: "0 auto 20px",
        background: "#FFFEFB",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid #E4DCC4",
        display: "flex",
        gap: "8px",
    },
    printOptionButton: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        background: "transparent",
        border: "none",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#2A2621",
        cursor: "pointer",
    },
    invoiceContainer: { maxWidth: "760px", margin: "0 auto" },
    invoice: {
        background: "#FFFEFB",
        borderRadius: "6px",
        border: "1px solid #E4DCC4",
        boxShadow: "0 10px 30px rgba(42,38,33,0.08)",
        position: "relative",
    },
    perforationRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "0 14px",
        height: "12px",
        position: "relative",
    },
    hole: {
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "#F3EFE6",
        boxShadow: "inset 0 1px 2px rgba(42,38,33,0.18)",
        marginTop: "-6px",
    },
    paperBody: { padding: "8px 36px 30px" },
    masthead: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "18px",
        paddingTop: "18px",
        position: "relative",
    },
    businessBlock: { flex: 1, minWidth: "220px" },
    businessLogo: { 
        maxWidth: "90px", 
        maxHeight: "60px", 
        objectFit: "contain", 
        marginBottom: "8px",
        borderRadius: "4px",
    },
    businessLogoPlaceholder: {
        width: "44px",
        height: "44px",
        borderRadius: "8px",
        background: "#E7F2EC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8px",
    },
    businessName: {
        margin: "0 0 6px 0",
        fontSize: "26px",
        fontWeight: "700",
        color: "#1F2A22",
        fontFamily: "'Rozha One', 'Georgia', serif",
        letterSpacing: "0.3px",
    },
    businessMeta: { fontSize: "12.5px", color: "#6B6355", lineHeight: "1.7" },
    metaLine: { display: "flex", alignItems: "flex-start", gap: "6px", margin: "0" },
    gstTag: {
        display: "inline-block",
        marginTop: "8px",
        padding: "3px 10px",
        border: "1px dashed #C9BE9C",
        borderRadius: "4px",
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#6B6355",
        letterSpacing: "0.4px",
    },
    billTag: {
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        minWidth: "150px",
        paddingTop: "4px",
    },
    billTagLabel: {
        fontSize: "10.5px",
        letterSpacing: "1.4px",
        textTransform: "uppercase",
        color: "#9C6B15",
        fontWeight: "700",
    },
    billTagNo: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#1F2A22",
        fontFamily: "'JetBrains Mono', monospace",
    },
    billTagDate: { fontSize: "12px", color: "#6B6355", fontFamily: "'JetBrains Mono', monospace" },
    stamp: {
        position: "absolute",
        top: "8px",
        right: "0",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 16px",
        border: "2.5px double currentColor",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "800",
        letterSpacing: "2px",
        textTransform: "uppercase",
        background: "rgba(255,255,255,0.4)",
        mixBlendMode: "multiply",
        opacity: 0.9,
        pointerEvents: "none",
    },
    tornDivider: {
        marginTop: "26px",
        marginBottom: "22px",
        height: "1px",
        backgroundImage: "repeating-linear-gradient(90deg, #D8CFB0 0 6px, transparent 6px 11px)",
    },
    ledgerGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "26px",
    },
    ledgerCol: {},
    ledgerColTitle: {
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color: "#1F6D4C",
        marginBottom: "10px",
    },
    ledgerField: {
        display: "flex",
        alignItems: "baseline",
        gap: "6px",
        fontSize: "13px",
        padding: "4px 0",
    },
    ledgerLabel: {
        color: "#6B6355",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    ledgerLeader: {
        flex: 1,
        borderBottom: "1px dotted #C9BE9C",
        transform: "translateY(-3px)",
        minWidth: "12px",
    },
    ledgerValue: { color: "#1F2A22", fontWeight: "600", textAlign: "right" },
    tableSection: { marginBottom: "22px" },
    tableHeader: { marginBottom: "10px" },
    tableTitle: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "13px",
        fontWeight: "700",
        color: "#1F2A22",
        letterSpacing: "0.4px",
        textTransform: "uppercase",
        margin: 0,
    },
    tableWrapper: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13.5px", minWidth: "560px" },
    th: {
        padding: "8px 8px",
        textAlign: "left",
        fontWeight: "700",
        color: "#6B6355",
        borderBottom: "2px solid #2A2621",
        fontSize: "10.5px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    tr: { borderBottom: "1px dashed #D8CFB0" },
    td: { padding: "10px 8px", verticalAlign: "top" },
    serialNumber: { color: "#9C917E", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" },
    productName: { fontWeight: "600", color: "#1F2A22" },
    productDescription: { fontSize: "11.5px", color: "#9C917E", marginTop: "2px" },
    convertedQuantity: { fontSize: "10.5px", color: "#9C917E", marginTop: "2px" },
    mono: { fontFamily: "'JetBrains Mono', monospace", color: "#2A2621", fontSize: "13px" },
    summarySection: { display: "flex", justifyContent: "flex-end", marginBottom: "22px" },
    summaryBox: { width: "100%", maxWidth: "300px" },
    summaryRow: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13.5px", color: "#4A453C" },
    summaryDashedDivider: { borderTop: "1px dashed #D8CFB0", margin: "8px 0" },
    grandTotal: {
        fontSize: "19px",
        fontWeight: "700",
        color: "#1F6D4C",
        background: "#E7F2EC",
        padding: "8px 10px",
        borderRadius: "6px",
        borderLeft: "4px solid #1F6D4C",
    },
    wordsChit: {
        marginTop: "12px",
        fontSize: "11.5px",
        fontStyle: "italic",
        color: "#6B6355",
        borderTop: "1px dotted #D8CFB0",
        paddingTop: "8px",
    },
    notesSection: {
        marginBottom: "22px",
        padding: "12px 14px",
        border: "1px dashed #D8CFB0",
        borderRadius: "6px",
        background: "#FBF8F1",
    },
    notesTitle: { fontSize: "10.5px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#9C6B15", marginBottom: "4px" },
    notesText: { margin: 0, fontSize: "13px", color: "#4A453C" },
    bottomRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "16px",
        borderTop: "1px dashed #D8CFB0",
        paddingTop: "18px",
    },
    qrBlock: { textAlign: "center" },
    qrBox: {
        width: "64px",
        height: "64px",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "2px",
        padding: "6px",
        border: "1px solid #E4DCC4",
        borderRadius: "6px",
        background: "#FFFEFB",
    },
    qrDot: { width: "100%", height: "100%", background: "#2A2621", borderRadius: "1px" },
    qrText: { margin: "6px 0 0", fontSize: "11px", fontWeight: "600", color: "#1F2A22" },
    qrSubtext: { margin: 0, fontSize: "10px", color: "#9C917E", fontFamily: "'JetBrains Mono', monospace" },
    footerNote: { textAlign: "right", flex: 1 },
    thankYou: {
        margin: "0 0 4px",
        fontSize: "16px",
        fontFamily: "'Rozha One', serif",
        color: "#1F2A22",
    },
    footerSmall: { margin: 0, fontSize: "11px", color: "#9C917E" },
    loadingContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "40px",
    },
    loadingSpinner: {
        border: "4px solid #E4DCC4",
        borderTop: "4px solid #1F6D4C",
        borderRadius: "50%",
        width: "44px",
        height: "44px",
        animation: "spin 0.8s linear infinite",
    },
    loadingText: { marginTop: "18px", fontSize: "16px", fontWeight: "600", color: "#1F2A22" },
    loadingSubtext: { marginTop: "4px", fontSize: "13px", color: "#9C917E" },
    errorContainer: { textAlign: "center", padding: "80px 20px", maxWidth: "440px", margin: "0 auto" },
    errorIcon: { fontSize: "56px", marginBottom: "18px" },
    errorTitle: { fontSize: "22px", fontWeight: "700", color: "#1F2A22", marginBottom: "10px" },
    errorText: { fontSize: "14.5px", color: "#6B6355", marginBottom: "22px" },
    errorButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 22px",
        background: "#1F6D4C",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "8px",
        fontWeight: "600",
    },
};

// Fonts + print rules
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @media print {
        body { background: white !important; }
        #invoice-content { margin: 0 !important; }
        .no-print { display: none !important; }
    }
`;
document.head.appendChild(styleSheet);