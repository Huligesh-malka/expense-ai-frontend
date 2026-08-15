import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import {
    FiPlus,
    FiSearch,
    FiEye,
    FiShoppingCart,
    FiDollarSign,
    FiClock,
    FiCheckCircle,
    FiChevronDown,
    FiX,
} from "react-icons/fi";

/* ---------------------------------------------------
   Design concept: "Dispatch Board"
   A warehouse-clipboard control panel — dark charcoal
   background, purchases rendered as clipped dockets
   grouped into three columns by payment status
   (Not Paid / Partially Paid / Fully Paid), like tickets
   pinned to a dispatch board. Saffron/coral accent for
   money owed, teal for settled.
--------------------------------------------------- */

const COLUMN_DEF = [
    { key: "Not Paid", label: "Not Paid", accent: "#ff6b4a", glow: "rgba(255,107,74,0.18)" },
    { key: "Partially Paid", label: "Partially Paid", accent: "#ffb84d", glow: "rgba(255,184,77,0.16)" },
    { key: "Fully Paid", label: "Fully Paid", accent: "#3ddc97", glow: "rgba(61,220,151,0.14)" },
];

export default function Purchase() {

    const businessId = localStorage.getItem("businessId");

    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterSupplier, setFilterSupplier] = useState("All");
    const [filterDate, setFilterDate] = useState("All");
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);

    const [summary, setSummary] = useState({
        totalPurchases: 0,
        totalBought: 0,
        totalPaid: 0,
        totalDue: 0
    });

    useEffect(() => {
        loadPurchases();
    }, []);

    const loadPurchases = async () => {
        try {
            const res = await API.get(`/purchases?business_id=${businessId}`);
            const data = res.data.data || [];
            setPurchases(data);
            calculateSummary(data);
        } catch (err) {
            console.log(err);
            alert("Failed to load purchases");
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const totalPurchases = data.length;
        const totalBought = data.reduce((sum, p) => sum + Number(p.total_amount), 0);
        const totalPaid = data.reduce((sum, p) => sum + Number(p.paid_amount), 0);
        setSummary({
            totalPurchases,
            totalBought,
            totalPaid,
            totalDue: totalBought - totalPaid
        });
    };

    const getStatus = (purchase) => {
        const total = Number(purchase.total_amount);
        const paid = Number(purchase.paid_amount);
        if (paid === total) return "Fully Paid";
        if (paid > 0 && paid < total) return "Partially Paid";
        return "Not Paid";
    };

    const getUniqueSuppliers = () => ["All", ...new Set(purchases.map(p => p.supplier_name))];

    const getFilteredPurchases = () => {
        let filtered = purchases;

        if (search) {
            filtered = filtered.filter((item) =>
                item.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
                item.supplier_name.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (filterSupplier !== "All") {
            filtered = filtered.filter(item => item.supplier_name === filterSupplier);
        }
        if (filterDate !== "All") {
            const now = new Date();
            const filterDays = parseInt(filterDate);
            const cutoffDate = new Date(now.setDate(now.getDate() - filterDays));
            filtered = filtered.filter(item => new Date(item.created_at) >= cutoffDate);
        }
        return filtered;
    };

    const filteredPurchases = getFilteredPurchases();
    const suppliers = getUniqueSuppliers();
    const rupee = (n) => `\u20B9${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const grouped = COLUMN_DEF.reduce((acc, col) => {
        acc[col.key] = filteredPurchases.filter(p => getStatus(p) === col.key);
        return acc;
    }, {});

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#14161c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8b93a7",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: 1
            }}>
                LOADING DISPATCH BOARD…
            </div>
        );
    }

    const StatChip = ({ icon, label, value, accent }) => (
        <div style={{
            background: "#1b1e27",
            border: "1px solid #2a2e3a",
            borderRadius: 12,
            padding: "14px 18px",
            flex: "1 1 160px",
            display: "flex",
            alignItems: "center",
            gap: 12
        }}>
            <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${accent}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: accent, flexShrink: 0
            }}>
                {icon}
            </div>
            <div>
                <div style={{
                    fontSize: 10, color: "#7d8496", letterSpacing: 1,
                    textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace"
                }}>{label}</div>
                <div style={{
                    fontSize: 19, color: "#f1f3f8", fontWeight: 700,
                    fontFamily: "'IBM Plex Mono', monospace", marginTop: 2
                }}>{value}</div>
            </div>
        </div>
    );

    const Dropdown = ({ label, value, options, open, setOpen, onSelect }) => (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    background: "#1b1e27",
                    border: "1px solid #2a2e3a",
                    color: value === "All" ? "#8b93a7" : "#f1f3f8",
                    padding: "10px 14px",
                    borderRadius: 9,
                    fontSize: 13,
                    fontFamily: "'IBM Plex Mono', monospace",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 150,
                    justifyContent: "space-between"
                }}
            >
                <span>{value === "All" ? label : value}</span>
                <FiChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                    <div style={{
                        position: "absolute", top: "110%", left: 0, zIndex: 20,
                        background: "#1b1e27", border: "1px solid #2a2e3a", borderRadius: 9,
                        minWidth: 180, maxHeight: 240, overflowY: "auto",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.5)"
                    }}>
                        {options.map((opt) => {
                            const [val, lbl] = Array.isArray(opt) ? opt : [opt, opt];
                            return (
                                <div
                                    key={val}
                                    onClick={() => { onSelect(val); setOpen(false); }}
                                    style={{
                                        padding: "10px 14px",
                                        fontSize: 13,
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        color: val === value ? "#3ddc97" : "#c7cbd6",
                                        cursor: "pointer",
                                        background: val === value ? "#22262f" : "transparent"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#22262f"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = val === value ? "#22262f" : "transparent"}
                                >
                                    {lbl}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );

    const Docket = ({ purchase, accent }) => {
        const status = getStatus(purchase);
        const due = Number(purchase.total_amount) - Number(purchase.paid_amount);
        const isFullyPaid = status === "Fully Paid";
        const paidPct = Math.min(100, (Number(purchase.paid_amount) / Number(purchase.total_amount)) * 100 || 0);

        return (
            <div style={{
                background: "#1b1e27",
                border: "1px solid #2a2e3a",
                borderRadius: 12,
                padding: 16,
                marginBottom: 14,
                position: "relative",
                overflow: "hidden"
            }}>
                {/* clip notch */}
                <div style={{
                    position: "absolute", top: 0, left: 20,
                    width: 28, height: 10,
                    background: accent,
                    borderRadius: "0 0 6px 6px"
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
                    <div>
                        <div style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontWeight: 700, fontSize: 15, color: "#f1f3f8"
                        }}>
                            {purchase.invoice_no}
                        </div>
                        <div style={{ fontSize: 12, color: "#8b93a7", marginTop: 2 }}>
                            {purchase.supplier_name}
                        </div>
                    </div>
                    <div style={{
                        fontSize: 11, color: "#5f6579",
                        fontFamily: "'IBM Plex Mono', monospace", textAlign: "right"
                    }}>
                        {new Date(purchase.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short'
                        })}
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", margin: "14px 0 6px", fontFamily: "'IBM Plex Mono', monospace" }}>
                    <div>
                        <div style={{ fontSize: 10, color: "#5f6579", textTransform: "uppercase" }}>Total</div>
                        <div style={{ fontSize: 16, color: "#f1f3f8", fontWeight: 700 }}>{rupee(purchase.total_amount)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#5f6579", textTransform: "uppercase" }}>Due</div>
                        <div style={{ fontSize: 16, color: due > 0 ? accent : "#3ddc97", fontWeight: 700 }}>{rupee(due)}</div>
                    </div>
                </div>

                {/* progress bar */}
                <div style={{ height: 5, background: "#2a2e3a", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{
                        width: `${paidPct}%`, height: "100%",
                        background: accent, borderRadius: 4, transition: "width 0.3s"
                    }} />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/purchase/${purchase.id}`} style={{ flex: 1, textDecoration: "none" }}>
                        <button style={{
                            width: "100%",
                            background: "#22262f",
                            color: "#c7cbd6",
                            border: "1px solid #2a2e3a",
                            padding: "9px 0",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6
                        }}>
                            <FiEye size={13} /> VIEW
                        </button>
                    </Link>
                    {!isFullyPaid && (
                        <Link to={`/purchase/${purchase.id}/pay`} style={{ flex: 1, textDecoration: "none" }}>
                            <button style={{
                                width: "100%",
                                background: accent,
                                color: "#14161c",
                                border: "none",
                                padding: "9px 0",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6
                            }}>
                                <FiDollarSign size={13} /> PAY NOW
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            background: "#14161c",
            minHeight: "100vh",
            padding: "26px 24px 60px",
            fontFamily: "'IBM Plex Mono', monospace"
        }}>
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 16, marginBottom: 22
            }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f3f8", letterSpacing: 0.5 }}>
                        Dispatch Board
                    </div>
                    <div style={{ fontSize: 12, color: "#7d8496", marginTop: 2 }}>
                        Purchases tracked by payment status
                    </div>
                </div>
                <Link to="/add-purchase" style={{ textDecoration: "none" }}>
                    <button style={{
                        background: "#3ddc97",
                        color: "#14161c",
                        border: "none",
                        padding: "12px 20px",
                        borderRadius: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 14,
                        fontWeight: 700
                    }}>
                        <FiPlus /> NEW PURCHASE
                    </button>
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
                <StatChip icon={<FiShoppingCart size={17} />} label="Bills" value={summary.totalPurchases} accent="#7d9bff" />
                <StatChip icon={<FiDollarSign size={17} />} label="Total Bought" value={rupee(summary.totalBought)} accent="#3ddc97" />
                <StatChip icon={<FiCheckCircle size={17} />} label="Already Paid" value={rupee(summary.totalPaid)} accent="#ffb84d" />
                <StatChip icon={<FiClock size={17} />} label="You Need to Pay" value={rupee(summary.totalDue)} accent="#ff6b4a" />
            </div>

            {/* Controls */}
            <div style={{
                display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 26,
                alignItems: "center"
            }}>
                <div style={{ position: "relative", flex: "1 1 220px" }}>
                    <FiSearch style={{ position: "absolute", top: 12, left: 12, color: "#5f6579" }} size={15} />
                    <input
                        type="text"
                        placeholder="Search bill no. or supplier…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%", boxSizing: "border-box",
                            background: "#1b1e27", border: "1px solid #2a2e3a",
                            color: "#f1f3f8", padding: "10px 12px 10px 34px",
                            borderRadius: 9, fontSize: 13, outline: "none",
                            fontFamily: "'IBM Plex Mono', monospace"
                        }}
                    />
                    {search && (
                        <FiX
                            size={14}
                            onClick={() => setSearch("")}
                            style={{ position: "absolute", top: 12, right: 12, color: "#5f6579", cursor: "pointer" }}
                        />
                    )}
                </div>

                <Dropdown
                    label="Supplier"
                    value={filterSupplier}
                    options={suppliers}
                    open={supplierOpen}
                    setOpen={setSupplierOpen}
                    onSelect={setFilterSupplier}
                />
                <Dropdown
                    label="Date"
                    value={filterDate === "All" ? "All" : filterDate}
                    options={[["All", "All Dates"], ["7", "Last 7 Days"], ["30", "Last 30 Days"], ["90", "Last 90 Days"]]}
                    open={dateOpen}
                    setOpen={setDateOpen}
                    onSelect={setFilterDate}
                />
            </div>

            {/* Board columns */}
            {filteredPurchases.length === 0 ? (
                <div style={{
                    background: "#1b1e27", border: "1px solid #2a2e3a", borderRadius: 12,
                    padding: 50, textAlign: "center", color: "#5f6579", fontSize: 13
                }}>
                    No purchases match these filters
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 18,
                    alignItems: "start"
                }}>
                    {COLUMN_DEF.map((col) => (
                        <div key={col.key}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                marginBottom: 14, padding: "8px 12px",
                                background: col.glow, borderRadius: 9,
                                border: `1px solid ${col.accent}33`
                            }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: "50%", background: col.accent
                                }} />
                                <span style={{
                                    fontSize: 12, fontWeight: 700, color: col.accent,
                                    letterSpacing: 0.5, textTransform: "uppercase"
                                }}>
                                    {col.label}
                                </span>
                                <span style={{
                                    marginLeft: "auto", fontSize: 11, color: "#7d8496",
                                    background: "#14161c", padding: "2px 8px", borderRadius: 20
                                }}>
                                    {grouped[col.key].length}
                                </span>
                            </div>

                            {grouped[col.key].length === 0 ? (
                                <div style={{
                                    color: "#3f4351", fontSize: 12, padding: "10px 4px", fontStyle: "italic"
                                }}>
                                    Nothing here
                                </div>
                            ) : (
                                grouped[col.key].map((purchase) => (
                                    <Docket key={purchase.id} purchase={purchase} accent={col.accent} />
                                ))
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}