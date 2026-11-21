import { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import API from "../services/api";
import { FiSearch, FiPlus, FiEye, FiFilter, FiCalendar, FiUser, FiCreditCard, FiTrendingUp, FiRefreshCw, FiActivity, FiArrowUpRight, FiDownload } from "react-icons/fi";

// Generates a styled, professional invoice PDF directly in the browser.
const downloadSalePDF = (sale) => {
    const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
    const safe = (value) => String(value ?? "")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

    const items = Array.isArray(sale.items) ? sale.items : [];
    const invoiceNo = sale.invoice_no || sale.id || "N/A";
    const dateText = new Date(sale.created_at || Date.now()).toLocaleString("en-IN");
    const customer = sale.customer_name || "Walk-in Customer";
    const payment = sale.payment_method || "N/A";
    const status = sale.payment_status || "N/A";
    const subtotal = Number(sale.subtotal ?? sale.total_amount ?? 0);
    const tax = Number(sale.tax_amount ?? sale.gst_amount ?? sale.tax ?? 0);
    const discount = Number(sale.discount_amount ?? sale.discount ?? 0);
    const total = Number(sale.total_amount ?? subtotal + tax - discount);

    // PDF drawing helpers (A4: 595 x 842 points)
    const commands = [];
    const rgb = (r, g, b) => `${r} ${g} ${b}`;
    const rect = (x, y, w, h, color) => commands.push(`${rgb(...color)} rg ${x} ${y} ${w} ${h} re f`);
    const line = (x1, y1, x2, y2, color = [0.87, 0.90, 0.94], width = 1) =>
        commands.push(`${rgb(...color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    const text = (value, x, y, size = 10, color = [0.12, 0.16, 0.22], font = "F1") =>
        commands.push(`BT ${rgb(...color)} rg /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${safe(value)}) Tj ET`);
    const rightText = (value, rightX, y, size = 10, color = [0.12, 0.16, 0.22], font = "F1") => {
        const estimated = String(value).length * size * 0.52;
        text(value, rightX - estimated, y, size, color, font);
    };
    const wrap = (value, maxChars = 35) => {
        const words = String(value || "").split(/\s+/);
        const result = [];
        let current = "";
        words.forEach(word => {
            if ((current + " " + word).trim().length > maxChars && current) {
                result.push(current);
                current = word;
            } else current = (current + " " + word).trim();
        });
        if (current) result.push(current);
        return result;
    };

    // Header banner
    rect(0, 742, 595, 100, [0.07, 0.11, 0.20]);
    rect(0, 742, 8, 100, [0.22, 0.48, 0.95]);
    text("INVOICE / CASH MEMO", 42, 798, 22, [1, 1, 1], "F2");
    text("SALES RECEIPT", 42, 777, 9, [0.72, 0.80, 0.91], "F2");
    rightText("INVOICE", 550, 800, 9, [0.72, 0.80, 0.91], "F2");
    rightText(invoiceNo, 550, 780, 11, [1, 1, 1], "F2");

    // Invoice information cards
    rect(38, 674, 519, 48, [0.96, 0.97, 0.99]);
    text("BILL TO", 52, 704, 8, [0.42, 0.48, 0.57], "F2");
    text(customer, 52, 688, 11, [0.12, 0.16, 0.22], "F2");
    text("DATE & TIME", 290, 704, 8, [0.42, 0.48, 0.57], "F2");
    text(dateText, 290, 688, 10, [0.12, 0.16, 0.22], "F2");

    // Payment status row
    text("PAYMENT METHOD", 42, 650, 8, [0.42, 0.48, 0.57], "F2");
    text(payment.toUpperCase(), 42, 634, 10, [0.12, 0.16, 0.22], "F2");
    text("PAYMENT STATUS", 235, 650, 8, [0.42, 0.48, 0.57], "F2");
    text(status.toUpperCase(), 235, 634, 10, status.toLowerCase() === "paid" ? [0.05, 0.55, 0.36] : [0.75, 0.42, 0.05], "F2");
    line(38, 617, 557, 617, [0.87, 0.90, 0.94], 1);

    // Items table
    text("ITEM DETAILS", 42, 596, 10, [0.12, 0.16, 0.22], "F2");
    rect(38, 568, 519, 25, [0.07, 0.11, 0.20]);
    text("ITEM", 50, 577, 8, [1, 1, 1], "F2");
    rightText("QTY", 365, 577, 8, [1, 1, 1], "F2");
    rightText("PRICE", 455, 577, 8, [1, 1, 1], "F2");
    rightText("AMOUNT", 545, 577, 8, [1, 1, 1], "F2");

    let y = 550;
    items.forEach((item, index) => {
        const name = item.product_name || item.name || item.product || `Item ${index + 1}`;
        const qty = Number(item.quantity ?? item.qty ?? 1);
        const price = Number(item.unit_price ?? item.price ?? item.selling_price ?? 0);
        const amount = Number(item.total ?? item.subtotal ?? item.line_total ?? qty * price);
        const nameLines = wrap(name, 34);
        const rowHeight = Math.max(30, nameLines.length * 12 + 12);
        if (index % 2 === 0) rect(38, y - rowHeight + 6, 519, rowHeight, [0.98, 0.99, 1]);
        nameLines.forEach((part, lineIndex) => text(part, 50, y - lineIndex * 12, 9, [0.12, 0.16, 0.22]));
        rightText(String(qty), 365, y, 9);
        rightText(money(price), 455, y, 9);
        rightText(money(amount), 545, y, 9, [0.12, 0.16, 0.22], "F2");
        y -= rowHeight;
    });

    const tableBottom = Math.max(y - 5, 360);
    line(38, tableBottom, 557, tableBottom, [0.87, 0.90, 0.94], 1);

    // Totals panel
    const summaryTop = tableBottom - 20;
    const summaryX = 330;
    rect(summaryX, summaryTop - 112, 227, 112, [0.96, 0.97, 0.99]);
    text("Subtotal", summaryX + 15, summaryTop - 24, 9, [0.42, 0.48, 0.57]);
    rightText(money(subtotal), 542, summaryTop - 24, 9);
    text("GST / Tax", summaryX + 15, summaryTop - 44, 9, [0.42, 0.48, 0.57]);
    rightText(money(tax), 542, summaryTop - 44, 9);
    text("Discount", summaryX + 15, summaryTop - 64, 9, [0.42, 0.48, 0.57]);
    rightText(money(discount), 542, summaryTop - 64, 9);
    line(summaryX + 15, summaryTop - 76, 542, summaryTop - 76, [0.82, 0.86, 0.91], 1);
    text("TOTAL", summaryX + 15, summaryTop - 98, 10, [0.07, 0.11, 0.20], "F2");
    rightText(money(total), 542, summaryTop - 98, 13, [0.07, 0.11, 0.20], "F2");

    // Footer
    line(38, 95, 557, 95, [0.87, 0.90, 0.94], 1);
    text("Thank you for your purchase!", 42, 75, 11, [0.07, 0.11, 0.20], "F2");
    text("Generated by Expense AI POS", 42, 58, 8, [0.55, 0.59, 0.65]);
    rightText("Keep this receipt for your records", 550, 58, 8, [0.55, 0.59, 0.65]);

    const stream = commands.join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => pdf += `${String(offset).padStart(10, "0")} 00000 n \n`);
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${invoiceNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedPeriod, setSelectedPeriod] = useState("all");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [allRecordsMode, setAllRecordsMode] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSalesCount, setTotalSalesCount] = useState(0);
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    useEffect(() => {
        loadSales();
    }, []);

    const getDateRange = (period = selectedPeriod, startDate = customStartDate, endDate = customEndDate) => {
        const now = new Date();
        const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (period === "today") return { startDate: formatDate(now), endDate: formatDate(now) };
        if (period === "yesterday") {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const date = formatDate(yesterday);
            return { startDate: date, endDate: date };
        }
        if (period === "week") {
            const start = new Date(now);
            start.setDate(start.getDate() - 6);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        if (period === "month") {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: formatDate(start), endDate: formatDate(now) };
        }
        if (period === "custom") return { startDate: startDate || undefined, endDate: endDate || undefined };
        return {};
    };

    const loadSales = async (requestedPage = page, requestedLimit = limit, period = selectedPeriod, customDates = {}) => {
        setAllRecordsMode(false);
        setLoading(true);
        try {
            const res = await API.get("/sales", {
                params: {
                    page: requestedPage,
                    limit: requestedLimit,
                    ...getDateRange(period, customDates.startDate ?? customStartDate, customDates.endDate ?? customEndDate)
                }
            });

            const rows = Array.isArray(res.data?.data) ? res.data.data : [];
            setSales(rows);
            setPage(Number(res.data?.page) || requestedPage);
            setLimit(Number(res.data?.limit) || requestedLimit);
            setTotalPages(Math.max(1, Number(res.data?.totalPages) || 1));
            setTotalSalesCount(Number(res.data?.total) || rows.length);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error loading sales:", err);
            alert(err.response?.data?.message || "Failed to load sales data");
        } finally {
            setLoading(false);
        }
    };

    // Backend maximum is 100 per request. "All Records" fetches every page
    // and combines them on the frontend without changing the backend.
    const loadAllSales = async (period = selectedPeriod, customDates = {}, displayLimit = "all") => {
        setAllRecordsMode(true);
        setLoading(true);
        try {
            const dateParams = getDateRange(
                period,
                customDates.startDate ?? customStartDate,
                customDates.endDate ?? customEndDate
            );
            const firstResponse = await API.get("/sales", {
                params: { page: 1, limit: 100, ...dateParams }
            });

            const firstRows = Array.isArray(firstResponse.data?.data) ? firstResponse.data.data : [];
            const total = Number(firstResponse.data?.total) || firstRows.length;
            const pages = Math.max(1, Number(firstResponse.data?.totalPages) || 1);

            let allRows = [...firstRows];

            if (pages > 1) {
                const requests = [];
                for (let currentPage = 2; currentPage <= pages; currentPage++) {
                    requests.push(
                        API.get("/sales", {
                            params: { page: currentPage, limit: 100, ...dateParams }
                        })
                    );
                }

                const responses = await Promise.all(requests);
                responses.forEach(response => {
                    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
                    allRows.push(...rows);
                });
            }

            setSales(allRows);
            setPage(1);
            setLimit(displayLimit === "all" ? (allRows.length || total) : Number(displayLimit));
            setTotalPages(1);
            setTotalSalesCount(total);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error loading all sales:", err);
            alert(err.response?.data?.message || "Failed to load all sales data");
        } finally {
            setLoading(false);
        }
    };


    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setPage(1);
        if (period !== "custom") {
            setCustomStartDate("");
            setCustomEndDate("");
        }
        if (allRecordsMode) {
            loadAllSales(period, { startDate: "", endDate: "" });
        } else {
            loadSales(1, limit, period, { startDate: "", endDate: "" });
        }
    };

    const handleCustomDateChange = (startDate, endDate) => {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
        if (startDate && endDate) {
            setSelectedPeriod("custom");
            setPage(1);
            if (allRecordsMode) {
                loadAllSales("custom", { startDate, endDate });
            } else {
                loadSales(1, limit, "custom", { startDate, endDate });
            }
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            paid: { color: "#10b981", bg: "#d1fae5", icon: "✅" },
            pending: { color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
            failed: { color: "#ef4444", bg: "#fee2e2", icon: "❌" },
            refunded: { color: "#6b7280", bg: "#f3f4f6", icon: "↩️" },
        };
        return configs[status?.toLowerCase()] || { color: "#6b7280", bg: "#f3f4f6", icon: "📌" };
    };

    const getPaymentIcon = (method) => {
        const icons = {
            cash: "💵",
            card: "💳",
            upi: "📱",
            bank: "🏦",
        };
        return icons[method?.toLowerCase()] || "💵";
    };

    const getPeriodStats = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        let filtered = sales;
        if (selectedPeriod === "today") {
            filtered = sales.filter(s => new Date(s.created_at) >= today);
        } else if (selectedPeriod === "week") {
            filtered = sales.filter(s => new Date(s.created_at) >= weekAgo);
        } else if (selectedPeriod === "month") {
            filtered = sales.filter(s => new Date(s.created_at) >= monthAgo);
        }

        const total = filtered.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const count = filtered.length;
        const paid = filtered.filter(s => s.payment_status?.toLowerCase() === "paid").length;
        const pending = filtered.filter(s => s.payment_status?.toLowerCase() === "pending").length;

        return { total, count, paid, pending };
    };



    const stats = getPeriodStats();

    const filtered = sales.filter((item) => {
        const matchesSearch = 
            (item.invoice_no || "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            (item.customer_name || "")
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus = 
            filterStatus === "all" || 
            item.payment_status?.toLowerCase() === filterStatus;

        let matchesPeriod = true;
        const saleDate = new Date(item.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedPeriod === "today") matchesPeriod = saleDate >= today;
        else if (selectedPeriod === "yesterday") {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesPeriod = saleDate >= yesterday && saleDate < today;
        } else if (selectedPeriod === "week") {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 6);
            matchesPeriod = saleDate >= weekAgo;
        } else if (selectedPeriod === "month") {
            matchesPeriod = saleDate >= new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (selectedPeriod === "custom" && customStartDate && customEndDate) {
            matchesPeriod = saleDate >= new Date(`${customStartDate}T00:00:00`) && saleDate <= new Date(`${customEndDate}T23:59:59`);
        }

        return matchesSearch && matchesStatus && matchesPeriod;
    });

    const displayedSales = allRecordsMode && limit !== "all" ? filtered.slice(0, Number(limit)) : filtered;

    return (
        <div className="sales-page" style={styles.container}>
            <style>{`
                .sales-page table tbody tr:hover { background: #f8fbff; }
                .sales-page table tbody td { padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid #eef2f7; }
                @media (max-width: 900px) { .sales-page { padding: 14px !important; } .sales-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
                @media print { .sales-page { background: white !important; padding: 0 !important; } .sales-header, .sales-stats, .filtersSection, .paginationBar, .sales-page button, .sales-page a[href="/billing-pos"] { display: none !important; } .sales-page table { min-width: 0 !important; } }
            `}</style>
            {/* Header */}
            <div className="sales-header" style={styles.header}>
                <div>
                    <h1 className="sales-title" style={styles.title}>Sales History</h1>
                    <p style={styles.subtitle}>Quickly find a sale and open the invoice. Product details are kept inside the invoice.</p>
                </div>
                <Link to="/billing-pos" style={styles.primaryButton}>
                    <FiPlus size={18} />
                    New Billing
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="sales-stats" style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        <FiTrendingUp size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Total Sales</div>
                        <div style={styles.statValue}>₹{stats.total.toFixed(2)}</div>
                        <div style={styles.statSub}>{stats.count} transactions</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{...styles.statIcon, background: "#d1fae5"}}>
                        <FiCreditCard size={20} color="#10b981" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Paid</div>
                        <div style={styles.statValue}>{stats.paid}</div>
                        <div style={styles.statSub}>{((stats.paid/stats.count)*100 || 0).toFixed(0)}% of total</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{...styles.statIcon, background: "#fef3c7"}}>
                        <FiCalendar size={20} color="#f59e0b" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Pending</div>
                        <div style={styles.statValue}>{stats.pending}</div>
                        <div style={styles.statSub}>Awaiting payment</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={{...styles.statIcon, background: "#dbeafe"}}>
                        <FiUser size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={styles.statLabel}>Customers</div>
                        <div style={styles.statValue}>
                            {new Set(sales.map(s => s.customer_name)).size}
                        </div>
                        <div style={styles.statSub}>Unique customers</div>
                    </div>
                </div>
            </div>

            {/* Owner insight strip */}
            <div style={styles.insightStrip}>
                <div style={styles.insightIcon}>
                    <FiActivity size={18} />
                </div>
                <div style={styles.insightContent}>
                    <div style={styles.insightTitle}>Sales activity</div>
                    <div style={styles.insightText}>
                        {stats.count > 0
                            ? `${stats.count} transaction${stats.count === 1 ? "" : "s"} in the selected period • ${stats.paid} paid`
                            : "No sales activity in the selected period"}
                    </div>
                </div>
                <Link to="/billing-pos" style={styles.insightAction}>
                    New Sale <FiArrowUpRight size={14} />
                </Link>
            </div>

            {/* Filters */}
            <div style={styles.filtersSection}>
                <div style={styles.filtersLeft}>
                    <div style={styles.searchWrapper}>
                        <FiSearch size={18} color="#9ca3af" style={styles.searchIcon} />
                        <input
                            placeholder="Search by invoice or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                    <div style={styles.filterGroup}>
                        <FiFilter size={18} color="#6b7280" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Status</option>
                            <option value="paid">✅ Paid</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="failed">❌ Failed</option>
                            <option value="refunded">↩️ Refunded</option>
                        </select>
                    </div>
                    <div style={styles.filterGroup}>
                        <FiCalendar size={18} color="#6b7280" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    {selectedPeriod === "custom" && (
                        <>
                            <input type="date" value={customStartDate} onChange={(e) => handleCustomDateChange(e.target.value, customEndDate)} style={styles.dateInput} aria-label="Start date" />
                            <input type="date" value={customEndDate} min={customStartDate || undefined} onChange={(e) => handleCustomDateChange(customStartDate, e.target.value)} style={styles.dateInput} aria-label="End date" />
                        </>
                    )}
                </div>
                                <div style={styles.filtersRight}>
                     <div style={styles.liveIndicator}>
                         <span style={styles.liveDot}></span>
                         Live
                     </div>
                     <span style={styles.resultCount}>
                         {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                     </span>
                     {lastUpdated && (
                         <span style={styles.updatedText}>
                             Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                         </span>
                     )}
                     <button style={styles.iconButton} onClick={() => allRecordsMode ? loadAllSales(selectedPeriod) : loadSales(page, limit, selectedPeriod)} title="Refresh sales">
                         <FiRefreshCw size={16} />
                     </button>
                 </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.loadingText}>Loading sales data...</p>
                </div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Invoice</th>
                                <th style={styles.th}>Date & Time</th>
                                <th style={styles.th}>Items</th>
                                <th style={styles.th}>Payment</th>
                                <th style={styles.th}>Status</th>
                                <th style={{...styles.th, textAlign: "right"}}>Total</th>
                                <th style={{...styles.th, textAlign: "center"}}>Invoice Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={styles.emptyState}>
                                        <div style={styles.emptyIcon}>📭</div>
                                        <p style={styles.emptyText}>
                                            {search || filterStatus !== "all" || selectedPeriod !== "all"
                                                ? "No matching sales found"
                                                : "No sales recorded yet"}
                                        </p>
                                        {!search && filterStatus === "all" && selectedPeriod === "all" && (
                                            <Link to="/billing-pos" style={styles.emptyButton}>
                                                Create your first sale
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                displayedSales.map((item) => {
                                    const statusConfig = getStatusConfig(item.payment_status);
                                    const itemsList = item.items || [];
                                    return (
                                        <tr key={item.id} style={styles.tableRow}>
                                            <td>
                                                <span style={styles.invoiceNumber}>
                                                    #{item.invoice_no}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={styles.dateTime}>
                                                    <div style={styles.date}>
                                                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </div>
                                                    <div style={styles.time}>
                                                        {new Date(item.created_at).toLocaleTimeString("en-IN", {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={styles.itemsCell}>
                                                    <div style={styles.itemsCount}>
                                                        {itemsList.length} {itemsList.length === 1 ? "item" : "items"}
                                                    </div>
                                                    <div style={styles.itemHint}>
                                                        View invoice for details
                                                    </div>
                                                </div></td>
                                            <td>
                                                <span style={styles.paymentMethodBadge}>
                                                    {getPaymentIcon(item.payment_method)} {item.payment_method || "N/A"}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    background: statusConfig.bg,
                                                    color: statusConfig.color
                                                }}>
                                                    {statusConfig.icon} {item.payment_status || "N/A"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <span style={styles.amount}>
                                                    ₹{Number(item.total_amount).toFixed(2)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={styles.actionButtons}>
                                                    <Link
                                                        to={`/invoice/${item.id}`}
                                                        style={styles.viewButton}
                                                    >
                                                        <FiEye size={14} />
                                                        View
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadSalePDF(item)}
                                                        style={styles.downloadButton}
                                                        title="Download invoice PDF directly"
                                                    >
                                                        <FiDownload size={14} />
                                                        Download PDF
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination for the paginated /sales API */}
            <div style={styles.paginationBar}>
                <div style={styles.paginationInfo}>
                    {allRecordsMode
                        ? `Showing ${Math.min(sales.length, Number(limit) || sales.length)} of ${totalSalesCount} sales`
                        : `Showing ${sales.length ? ((page - 1) * limit + 1) : 0}–${Math.min(page * limit, totalSalesCount)} of ${totalSalesCount} sales`}
                </div>
                <div style={styles.paginationControls}>
                    <label style={styles.pageSizeLabel}>
                        Rows
                        <select
                            value={allRecordsMode ? (limit === 500 || limit === 1000 ? String(limit) : "all") : limit}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === "all" || value === "500" || value === "1000") {
                                    loadAllSales(selectedPeriod, {}, value);
                                } else {
                                    loadSales(1, Number(value), selectedPeriod);
                                }
                            }}
                            style={styles.pageSizeSelect}
                            disabled={loading}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value="all">All Records</option>
                        </select>
                    </label>
                    {!allRecordsMode && <>
                        <button
                            type="button"
                            style={{ ...styles.pageButton, opacity: page <= 1 || loading ? 0.5 : 1 }}
                            disabled={page <= 1 || loading}
                            onClick={() => loadSales(page - 1, limit, selectedPeriod)}
                        >
                            Previous
                        </button>
                        <span style={styles.pageNumber}>Page {page} of {totalPages}</span>
                        <button
                            type="button"
                            style={{ ...styles.pageButton, opacity: page >= totalPages || loading ? 0.5 : 1 }}
                            disabled={page >= totalPages || loading}
                            onClick={() => loadSales(page + 1, limit, selectedPeriod)}
                        >
                            Next
                        </button>
                    </>}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        padding: "24px 28px 40px",
        maxWidth: "1600px",
        margin: "0 auto",
        background: "#f5f7fb",
        color: "#0f172a",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },

    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "18px",
        padding: "24px 26px",
        borderRadius: "22px",
        background: "linear-gradient(135deg, #0b1220 0%, #16213d 55%, #1d4ed8 100%)",
        boxShadow: "0 16px 42px rgba(15, 23, 42, .17)",
        overflow: "hidden"
    },

    title: {
        margin: 0,
        color: "#fff",
        fontSize: "30px",
        lineHeight: 1.15,
        fontWeight: "850",
        letterSpacing: "-.8px"
    },

    subtitle: {
        margin: "7px 0 0",
        maxWidth: "720px",
        color: "#cbd5e1",
        fontSize: "13px",
        lineHeight: 1.5
    },

    primaryButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px 18px",
        borderRadius: "12px",
        background: "#b7f34a",
        color: "#172033",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "850",
        boxShadow: "0 8px 24px rgba(183, 243, 74, .22)",
        whiteSpace: "nowrap"
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "14px",
        marginBottom: "16px"
    },

    statCard: {
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "18px",
        borderRadius: "17px",
        background: "#fff",
        border: "1px solid #e5eaf1",
        boxShadow: "0 7px 24px rgba(15, 23, 42, .05)"
    },

    statIcon: {
        width: "46px",
        height: "46px",
        borderRadius: "13px",
        background: "#eaf1ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },

    statLabel: {
        fontSize: "10px",
        fontWeight: "850",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: ".7px"
    },

    statValue: {
        margin: "4px 0 2px",
        fontSize: "22px",
        lineHeight: 1.15,
        fontWeight: "850",
        color: "#0f172a",
        letterSpacing: "-.35px"
    },

    statSub: {
        fontSize: "11px",
        color: "#94a3b8"
    },

    insightStrip: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "14px",
        padding: "11px 14px",
        borderRadius: "14px",
        background: "linear-gradient(90deg, #eff6ff, #f8fafc)",
        border: "1px solid #dbe7f7"
    },

    insightIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#dbeafe",
        color: "#2563eb",
        flexShrink: 0
    },

    insightContent: {
        minWidth: 0,
        flex: 1
    },

    insightTitle: {
        fontSize: "11px",
        fontWeight: "850",
        color: "#1e3a8a"
    },

    insightText: {
        marginTop: "2px",
        color: "#64748b",
        fontSize: "11px"
    },

    insightAction: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "8px 11px",
        borderRadius: "9px",
        background: "#0f172a",
        color: "#fff",
        textDecoration: "none",
        fontSize: "10px",
        fontWeight: "800",
        whiteSpace: "nowrap"
    },

    filtersSection: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        padding: "12px",
        marginBottom: "14px",
        borderRadius: "16px",
        background: "#fff",
        border: "1px solid #e5eaf1",
        boxShadow: "0 6px 22px rgba(15, 23, 42, .04)"
    },

    filtersLeft: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        flex: 1,
        minWidth: "300px"
    },

    filtersRight: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        flexWrap: "wrap"
    },

    liveIndicator: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 8px",
        borderRadius: "999px",
        background: "#ecfdf5",
        color: "#047857",
        fontSize: "10px",
        fontWeight: "850"
    },

    liveDot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#10b981",
        boxShadow: "0 0 0 3px rgba(16, 185, 129, .12)"
    },

    updatedText: {
        color: "#94a3b8",
        fontSize: "10px",
        whiteSpace: "nowrap"
    },

    searchWrapper: {
        display: "flex",
        alignItems: "center",
        minWidth: "250px",
        flex: "1 1 300px",
        height: "42px",
        padding: "0 13px",
        border: "1px solid #e2e8f0",
        borderRadius: "11px",
        background: "#f8fafc"
    },

    searchIcon: {
        marginRight: "8px",
        flexShrink: 0
    },

    searchInput: {
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#0f172a",
        fontSize: "13px"
    },

    filterGroup: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        height: "42px",
        padding: "0 10px",
        border: "1px solid #e2e8f0",
        borderRadius: "11px",
        background: "#f8fafc"
    },

    dateInput: { height: "42px", padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: "11px", background: "#f8fafc", color: "#334155", fontSize: "12px" },

    filterSelect: {
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#334155",
        fontSize: "12px",
        fontWeight: "750",
        cursor: "pointer"
    },

    resultCount: {
        color: "#64748b",
        fontSize: "11px",
        fontWeight: "750",
        whiteSpace: "nowrap"
    },

    iconButton: {
        width: "38px",
        height: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        background: "#f8fafc",
        color: "#475569",
        cursor: "pointer"
    },

    tableContainer: {
        overflowX: "auto",
        borderRadius: "18px",
        background: "#fff",
        border: "1px solid #e5eaf1",
        boxShadow: "0 10px 30px rgba(15, 23, 42, .055)"
    },

    table: {
        width: "100%",
        minWidth: "860px",
        borderCollapse: "separate",
        borderSpacing: 0,
        fontSize: "13px",
        borderRadius: "18px",
        overflow: "hidden"
    },

    th: {
        padding: "15px 16px",
        textAlign: "left",
        fontSize: "10px",
        fontWeight: "850",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: ".7px",
        background: "#f8fafc",
        borderBottom: "1px solid #e5eaf1",
        whiteSpace: "nowrap"
    },

    tableRow: {
        borderBottom: "1px solid #eef2f7",
        transition: "background .15s ease",
        borderBottom: "1px solid #eef2f7"
    },

    invoiceNumber: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 9px",
        borderRadius: "8px",
        background: "#eef2ff",
        color: "#4338ca",
        fontWeight: "850",
        fontSize: "11px",
        whiteSpace: "nowrap"
    },

    dateTime: {
        display: "flex",
        flexDirection: "column",
        gap: "2px"
    },

    date: {
        color: "#1e293b",
        fontWeight: "750",
        fontSize: "12px"
    },

    time: {
        color: "#94a3b8",
        fontSize: "10px"
    },

    customerCell: {
        display: "flex",
        alignItems: "center",
        gap: "9px"
    },

    customerAvatar: {
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
        color: "#3730a3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "850",
        fontSize: "13px",
        flexShrink: 0
    },

    customerName: {
        color: "#1e293b",
        fontWeight: "750",
        fontSize: "12px"
    },

    customerPhone: {
        marginTop: "2px",
        color: "#94a3b8",
        fontSize: "10px"
    },

    itemsCell: {
        display: "flex",
        flexDirection: "column",
        gap: "3px"
    },

    itemsCount: {
        color: "#0f172a",
        fontSize: "13px",
        fontWeight: "850"
    },

    itemHint: {
        color: "#94a3b8",
        fontSize: "10px"
    },

    paymentMethodBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 9px",
        borderRadius: "8px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#475569",
        fontSize: "10px",
        fontWeight: "750",
        whiteSpace: "nowrap"
    },

    statusBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px 9px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "850",
        whiteSpace: "nowrap"
    },

    amount: {
        color: "#0f172a",
        fontSize: "14px",
        fontWeight: "900",
        whiteSpace: "nowrap"
    },

    actionButtons: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        flexWrap: "wrap"
    },

    viewButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "8px 11px",
        borderRadius: "8px",
        background: "#0f172a",
        color: "#fff",
        textDecoration: "none",
        fontSize: "10px",
        fontWeight: "850"
    },

    downloadButton: {
        cursor: "pointer",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "8px 11px",
        borderRadius: "8px",
        background: "#ecfdf5",
        color: "#047857",
        border: "1px solid #a7f3d0",
        textDecoration: "none",
        fontSize: "10px",
        fontWeight: "850",
        whiteSpace: "nowrap"
    },





    loadingContainer: {
        minHeight: "360px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        background: "#fff",
        border: "1px solid #e5eaf1"
    },

    loadingSpinner: {
        width: "38px",
        height: "38px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #2563eb",
        borderRadius: "50%",
        animation: "spin .8s linear infinite"
    },

    loadingText: {
        marginTop: "14px",
        color: "#64748b",
        fontSize: "13px",
        fontWeight: "650"
    },

    emptyState: {
        textAlign: "center",
        padding: "80px 20px",
        color: "#94a3b8"
    },

    emptyIcon: {
        fontSize: "46px",
        marginBottom: "12px"
    },

    emptyText: {
        margin: "0 0 14px",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "650"
    },

    emptyButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
        borderRadius: "10px",
        background: "#2563eb",
        color: "#fff",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "850"
    },

    paginationBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "14px",
        padding: "14px 16px",
        border: "1px solid #e5eaf1",
        borderRadius: "14px",
        background: "#fff"
    },
    paginationInfo: {
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "700"
    },
    paginationControls: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap"
    },
    pageSizeLabel: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: "#64748b",
        fontSize: "12px"
    },
    pageSizeSelect: {
        padding: "8px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        background: "#fff",
        color: "#0f172a"
    },
    pageButton: {
        padding: "8px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        background: "#f8fafc",
        color: "#0f172a",
        fontWeight: "700",
        cursor: "pointer"
    },
    pageNumber: {
        color: "#475569",
        fontSize: "12px",
        fontWeight: "700"
    },
};
