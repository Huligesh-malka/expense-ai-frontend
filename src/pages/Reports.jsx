
import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    getSalesReport,
    getPurchaseReport,
    getProfitReport,
    getStockReport,
} from "../services/reportApi";


export default function Reports() {
    // =========================================================
    // STATE
    // =========================================================

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [profit, setProfit] = useState([]);
    const [stock, setStock] = useState([]);

    const [salesSummary, setSalesSummary] = useState({});
    const [purchaseSummary, setPurchaseSummary] = useState({});
    const [profitSummary, setProfitSummary] = useState({});
    const [stockSummary, setStockSummary] = useState({});

    const [activeReport, setActiveReport] = useState("overview");

    // =========================================================
    // LOAD REPORTS
    // =========================================================

    const loadReports = async (start = from, end = to, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [
                salesResult,
                purchaseResult,
                profitResult,
                stockResult,
            ] = await Promise.all([
                getSalesReport(start, end),
                getPurchaseReport(start, end),
                getProfitReport(start, end),
                getStockReport(),
            ]);

            setSales(salesResult?.data || []);
            setSalesSummary(salesResult?.summary || {});

            setPurchases(purchaseResult?.data || []);
            setPurchaseSummary(purchaseResult?.summary || {});

            setProfit(profitResult?.data || []);
            setProfitSummary(profitResult?.summary || {});

            setStock(stockResult?.data || []);
            setStockSummary(stockResult?.summary || {});
        } catch (err) {
            console.error("Reports Error:", err);

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load reports"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReports("", "");
    }, []);

    // =========================================================
    // FILTERS
    // =========================================================

    const applyFilter = () => {
        if (from && to && from > to) {
            setError("From date cannot be greater than To date");
            return;
        }

        loadReports(from, to);
    };

    const clearFilter = () => {
        setFrom("");
        setTo("");
        setError("");
        loadReports("", "");
    };

    const quickFilter = (type) => {
        const today = new Date();
        const end = new Date(today);
        const start = new Date(today);

        if (type === "today") {
            // same day
        }

        if (type === "7days") {
            start.setDate(start.getDate() - 6);
        }

        if (type === "30days") {
            start.setDate(start.getDate() - 29);
        }

        if (type === "90days") {
            start.setDate(start.getDate() - 89);
        }

        const toInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const startValue = toInput(start);
        const endValue = toInput(end);

        setFrom(startValue);
        setTo(endValue);
        loadReports(startValue, endValue);
    };

    // =========================================================
    // FORMATTERS
    // =========================================================

    const money = (value) => {
        const number = Number(value || 0);

        return `₹${number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const compactMoney = (value) => {
        const number = Number(value || 0);

        if (Math.abs(number) >= 10000000) {
            return `₹${(number / 10000000).toFixed(2)}Cr`;
        }

        if (Math.abs(number) >= 100000) {
            return `₹${(number / 100000).toFixed(2)}L`;
        }

        if (Math.abs(number) >= 1000) {
            return `₹${(number / 1000).toFixed(1)}K`;
        }

        return money(number);
    };

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatProfit = (value) => {
        const number = Number(value || 0);

        if (number < 0) {
            return `-₹${Math.abs(number).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        }

        return money(number);
    };

    // =========================================================
    // HELPERS
    // =========================================================

    const getStockStatus = (item) => {
        const currentStock = Number(item?.stock || 0);
        const minimumStock = Number(item?.min_stock || 0);

        if (currentStock <= 0) {
            return {
                text: "Out of stock",
                className: "out",
                icon: "!",
            };
        }

        if (currentStock <= minimumStock) {
            return {
                text: "Low stock",
                className: "low",
                icon: "!",
            };
        }

        return {
            text: "Healthy",
            className: "available",
            icon: "✓",
        };
    };

    const getProfitValue = (item) => Number(item?.profit || 0);

    const getProfitStatus = (value) => {
        const number = Number(value || 0);

        if (number < 0) {
            return {
                text: "Loss",
                className: "loss",
            };
        }

        if (number > 0) {
            return {
                text: "Profit",
                className: "profit",
            };
        }

        return {
            text: "No profit",
            className: "zero",
        };
    };

    // =========================================================
    // DERIVED STATS
    // =========================================================

    const profitStats = useMemo(() => {
        return profit.reduce(
            (stats, item) => {
                const value = getProfitValue(item);

                if (value > 0) {
                    stats.profitProducts += 1;
                    stats.grossProfit += value;
                } else if (value < 0) {
                    stats.lossProducts += 1;
                    stats.totalLoss += Math.abs(value);
                } else {
                    stats.zeroProducts += 1;
                }

                return stats;
            },
            {
                profitProducts: 0,
                lossProducts: 0,
                zeroProducts: 0,
                grossProfit: 0,
                totalLoss: 0,
            }
        );
    }, [profit]);

    const totalSales = Number(salesSummary?.total_sales || 0);
    const totalPurchases = Number(purchaseSummary?.purchase_amount || 0);
    const totalProfit = Number(profitSummary?.total_profit || 0);
    const stockValue = Number(stockSummary?.inventory_value || 0);

    const profitMargin =
        totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    const lowStockCount = Number(stockSummary?.low_stock || 0);
    const outOfStockCount = Number(stockSummary?.out_of_stock || 0);

    const recentSales = useMemo(() => {
        return [...sales]
            .sort(
                (a, b) =>
                    new Date(b?.created_at || 0) -
                    new Date(a?.created_at || 0)
            )
            .slice(0, 8);
    }, [sales]);

    const topProfitProducts = useMemo(() => {
        return [...profit]
            .sort(
                (a, b) =>
                    Number(b?.profit || 0) - Number(a?.profit || 0)
            )
            .slice(0, 6);
    }, [profit]);

    const criticalStock = useMemo(() => {
        return [...stock]
            .filter((item) => {
                const current = Number(item?.stock || 0);
                const minimum = Number(item?.min_stock || 0);
                return current <= minimum;
            })
            .sort(
                (a, b) =>
                    Number(a?.stock || 0) - Number(b?.stock || 0)
            )
            .slice(0, 8);
    }, [stock]);

    const salesByPayment = useMemo(() => {
        const result = {};

        sales.forEach((sale) => {
            const method =
                String(sale?.payment_method || "Other").trim() || "Other";

            result[method] =
                (result[method] || 0) +
                Number(sale?.total_amount || 0);
        });

        return Object.entries(result)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [sales]);

    const maxPaymentValue =
        salesByPayment.length > 0
            ? Math.max(...salesByPayment.map((item) => item.value), 1)
            : 1;

    // =========================================================
    // CHART DATA
    // =========================================================

    const financialTrend = useMemo(() => {
        const rows = [
            ...sales.map((item) => ({
                type: "sales",
                date: item?.created_at,
                value: Number(item?.total_amount || 0),
            })),
            ...purchases.map((item) => ({
                type: "purchases",
                date: item?.created_at,
                value: Number(item?.total_amount || 0),
            })),
        ].filter((item) => item.date && !Number.isNaN(new Date(item.date).getTime()));

        if (rows.length === 0) return [];

        const parsedDates = rows.map((item) => new Date(item.date));
        const minDate = from
            ? new Date(`${from}T00:00:00`)
            : new Date(Math.min(...parsedDates.map((date) => date.getTime())));
        const maxDate = to
            ? new Date(`${to}T23:59:59`)
            : new Date(Math.max(...parsedDates.map((date) => date.getTime())));

        const daySpan = Math.max(
            1,
            Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000) + 1
        );

        // Daily is easier to read for normal shop reporting periods.
        // For long periods, switch to monthly buckets so the chart remains useful.
        const monthly = daySpan > 90;
        const bucket = {};

        const addValue = (date, type, value) => {
            const key = monthly
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

            if (!bucket[key]) {
                bucket[key] = {
                    key,
                    sales: 0,
                    purchases: 0,
                    date,
                };
            }

            bucket[key][type] += value;
        };

        rows.forEach((item) => {
            addValue(new Date(item.date), item.type, item.value);
        });

        if (!monthly) {
            const cursor = new Date(minDate);
            cursor.setHours(0, 0, 0, 0);

            while (cursor <= maxDate) {
                const key = `${cursor.getFullYear()}-${String(
                    cursor.getMonth() + 1
                ).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;

                if (!bucket[key]) {
                    bucket[key] = {
                        key,
                        sales: 0,
                        purchases: 0,
                        date: new Date(cursor),
                    };
                }

                cursor.setDate(cursor.getDate() + 1);
            }
        }

        return Object.values(bucket)
            .sort((a, b) => a.date - b.date)
            .map((item) => ({
                ...item,
                label: monthly
                    ? item.date.toLocaleDateString("en-IN", {
                          month: "short",
                          year: "2-digit",
                      })
                    : item.date.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                      }),
            }));
    }, [sales, purchases, from, to]);

    const stockHealth =
        Number(stockSummary?.total_products || stock.length || 0) > 0
            ? Math.max(
                  0,
                  Math.round(
                      ((Number(stockSummary?.total_products || stock.length) -
                          lowStockCount -
                          outOfStockCount) /
                          Number(
                              stockSummary?.total_products || stock.length
                          )) *
                          100
                  )
              )
            : 0;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="reports-page">
                <style>{styles.css}</style>

                <div className="reports-loading">
                    <div className="loading-orbit">
                        <span></span>
                    </div>

                    <div>
                        <h3>Preparing your business report</h3>
                        <p>Collecting sales, purchases, profit and stock data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="reports-page">
            <style>{styles.css}</style>

            <div className="reports-shell">
                {/* =====================================================
                    TOP NAV / BRAND
                ===================================================== */}

                <div className="topbar">
                    <div className="brand-block">
                        <div className="brand-mark">
                            <span>R</span>
                        </div>

                        <div>
                            <div className="brand-name">Business Reports</div>
                            <div className="brand-subtitle">
                                Smart shop analytics
                            </div>
                        </div>
                    </div>

                    <div className="topbar-actions">
                        <div className="live-pill">
                            <span className="live-dot"></span>
                            Live data
                        </div>

                        <button
                            className="refresh-button"
                            onClick={() => loadReports(from, to, true)}
                            disabled={refreshing}
                        >
                            <span className={refreshing ? "spin" : ""}>↻</span>
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* =====================================================
                    HERO
                ===================================================== */}

                <section className="hero-card">
                    <div className="hero-glow hero-glow-one"></div>
                    <div className="hero-glow hero-glow-two"></div>

                    <div className="hero-content">
                        <div className="hero-eyebrow">
                            <span className="spark">✦</span>
                            SHOP PERFORMANCE
                        </div>

                        <h1>
                            See your business
                            <span> clearly.</span>
                        </h1>

                        <p>
                            Track revenue, spending, profit and inventory from
                            one clean business control center.
                        </p>

                        <div className="hero-meta">
                            <div>
                                <span className="hero-meta-label">Revenue</span>
                                <strong>{compactMoney(totalSales)}</strong>
                            </div>

                            <div className="hero-divider"></div>

                            <div>
                                <span className="hero-meta-label">Net profit</span>
                                <strong className="hero-profit">
                                    {compactMoney(totalProfit)}
                                </strong>
                            </div>

                            <div className="hero-divider"></div>

                            <div>
                                <span className="hero-meta-label">Margin</span>
                                <strong>{profitMargin.toFixed(1)}%</strong>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual">
                        <div className="orbit-card orbit-card-main">
                            <div className="mini-chart-label">
                                BUSINESS HEALTH
                            </div>

                            <div className="mini-chart-value">
                                {stockHealth}%
                            </div>

                            <div className="health-track">
                                <span
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            stockHealth
                                        )}%`,
                                    }}
                                ></span>
                            </div>

                            <div className="mini-chart-footer">
                                <span>Inventory health</span>
                                <strong>
                                    {Number(
                                        stockSummary?.total_products ||
                                            stock.length ||
                                            0
                                    )}{" "}
                                    items
                                </strong>
                            </div>
                        </div>

                        <div className="floating-stat floating-stat-top">
                            <span className="floating-icon">↗</span>
                            <div>
                                <small>Sales</small>
                                <strong>{compactMoney(totalSales)}</strong>
                            </div>
                        </div>

                        <div className="floating-stat floating-stat-bottom">
                            <span className="floating-icon green">✓</span>
                            <div>
                                <small>Profit margin</small>
                                <strong>{profitMargin.toFixed(1)}%</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    ERROR
                ===================================================== */}

                {error && (
                    <div className="error-box">
                        <div className="error-icon">!</div>

                        <div>
                            <strong>Something needs attention</strong>
                            <span>{error}</span>
                        </div>

                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {/* =====================================================
                    DATE CONTROL
                ===================================================== */}

                <section className="control-card">
                    <div className="control-heading">
                        <div className="control-icon">◷</div>

                        <div>
                            <h2>Report period</h2>
                            <p>Choose a date range to update your business data.</p>
                        </div>
                    </div>

                    <div className="date-controls">
                        <div className="date-field">
                            <label>FROM</label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>

                        <div className="date-arrow">→</div>

                        <div className="date-field">
                            <label>TO</label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>

                        <button
                            className="apply-button"
                            onClick={applyFilter}
                        >
                            Apply range
                            <span>→</span>
                        </button>

                        <button
                            className="clear-button"
                            onClick={clearFilter}
                        >
                            Clear
                        </button>
                    </div>

                    <div className="quick-filters">
                        <span>Quick range</span>

                        <button onClick={() => quickFilter("today")}>
                            Today
                        </button>

                        <button onClick={() => quickFilter("7days")}>
                            Last 7 days
                        </button>

                        <button onClick={() => quickFilter("30days")}>
                            Last 30 days
                        </button>

                        <button onClick={() => quickFilter("90days")}>
                            Last 90 days
                        </button>
                    </div>
                </section>

                {/* =====================================================
                    KPI BENTO GRID
                ===================================================== */}

                <section className="kpi-grid">
                    <div className="kpi-card kpi-sales">
                        <div className="kpi-top">
                            <div className="kpi-icon">↗</div>
                            <span className="kpi-tag">REVENUE</span>
                        </div>

                        <div className="kpi-number">{money(totalSales)}</div>

                        <div className="kpi-bottom">
                            <span>{salesSummary?.total_bills || 0} bills</span>
                            <span className="kpi-arrow">↗</span>
                        </div>
                    </div>

                    <div className="kpi-card kpi-profit">
                        <div className="kpi-top">
                            <div className="kpi-icon">✦</div>
                            <span className="kpi-tag">NET PROFIT</span>
                        </div>

                        <div className="kpi-number">{money(totalProfit)}</div>

                        <div className="kpi-bottom">
                            <span>{profitMargin.toFixed(1)}% margin</span>
                            <span className="kpi-arrow">↗</span>
                        </div>
                    </div>

                    <div className="kpi-card kpi-purchases">
                        <div className="kpi-top">
                            <div className="kpi-icon">↓</div>
                            <span className="kpi-tag">PURCHASES</span>
                        </div>

                        <div className="kpi-number">
                            {money(totalPurchases)}
                        </div>

                        <div className="kpi-bottom">
                            <span>
                                {purchaseSummary?.total_purchases || 0} purchases
                            </span>
                            <span className="kpi-arrow">↘</span>
                        </div>
                    </div>

                    <div className="kpi-card kpi-stock">
                        <div className="kpi-top">
                            <div className="kpi-icon">▦</div>
                            <span className="kpi-tag">STOCK VALUE</span>
                        </div>

                        <div className="kpi-number">{money(stockValue)}</div>

                        <div className="kpi-bottom">
                            <span>
                                {stockSummary?.total_products || stock.length || 0}{" "}
                                products
                            </span>
                            <span className="kpi-arrow">→</span>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    NAV TABS
                ===================================================== */}

                <div className="report-tabs">
                    <button
                        className={activeReport === "overview" ? "active" : ""}
                        onClick={() => setActiveReport("overview")}
                    >
                        <span>◈</span>
                        Overview
                    </button>

                    <button
                        className={activeReport === "sales" ? "active" : ""}
                        onClick={() => setActiveReport("sales")}
                    >
                        <span>↗</span>
                        Sales
                    </button>

                    <button
                        className={activeReport === "purchases" ? "active" : ""}
                        onClick={() => setActiveReport("purchases")}
                    >
                        <span>↓</span>
                        Purchases
                    </button>

                    <button
                        className={activeReport === "profit" ? "active" : ""}
                        onClick={() => setActiveReport("profit")}
                    >
                        <span>✦</span>
                        Profit
                    </button>

                    <button
                        className={activeReport === "stock" ? "active" : ""}
                        onClick={() => setActiveReport("stock")}
                    >
                        <span>▦</span>
                        Stock
                    </button>
                </div>

                {/* =====================================================
                    OVERVIEW
                ===================================================== */}

                {activeReport === "overview" && (
                    <div className="overview-grid">
                        <section className="panel trend-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-eyebrow">
                                        FINANCIAL TREND
                                    </span>
                                    <h2>Revenue vs purchases</h2>
                                    <p className="panel-description">
                                        A real transaction trend for the selected report period.
                                    </p>
                                </div>

                                <div className="chart-legend">
                                    <span>
                                        <i className="legend-dot sales-dot"></i>
                                        Sales
                                    </span>
                                    <span>
                                        <i className="legend-dot purchase-dot"></i>
                                        Purchases
                                    </span>
                                </div>
                            </div>

                            {financialTrend.length < 2 ? (
                                <EmptyState
                                    icon="⌁"
                                    title="Not enough transaction data"
                                    text="Add sales or purchases to see the financial trend."
                                />
                            ) : (
                                <FinancialTrendChart
                                    data={financialTrend}
                                    money={money}
                                />
                            )}
                        </section>
                        <section className="panel sales-overview-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-eyebrow">
                                        SALES PERFORMANCE
                                    </span>
                                    <h2>Recent sales</h2>
                                </div>

                                <button
                                    className="panel-link"
                                    onClick={() => setActiveReport("sales")}
                                >
                                    View all →
                                </button>
                            </div>

                            {recentSales.length === 0 ? (
                                <EmptyState
                                    icon="↗"
                                    title="No sales yet"
                                    text="Sales transactions will appear here."
                                />
                            ) : (
                                <div className="recent-list">
                                    {recentSales.map((sale, index) => (
                                        <div
                                            className="recent-sale"
                                            key={sale?.id || index}
                                        >
                                            <div className="recent-avatar">
                                                {String(
                                                    sale?.customer_name ||
                                                        "W"
                                                )
                                                    .trim()
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="recent-main">
                                                <strong>
                                                    {sale?.customer_name ||
                                                        "Walk-in Customer"}
                                                </strong>
                                                <span>
                                                    {sale?.invoice_no || "No invoice"}{" "}
                                                    •{" "}
                                                    {formatDate(
                                                        sale?.created_at
                                                    )}
                                                </span>
                                            </div>

                                            <div className="recent-right">
                                                <strong>
                                                    {money(
                                                        sale?.total_amount
                                                    )}
                                                </strong>

                                                <span
                                                    className={`payment-dot ${String(
                                                        sale?.payment_status ||
                                                            ""
                                                    ).toLowerCase()}`}
                                                >
                                                    {sale?.payment_status ||
                                                        "Paid"}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="panel health-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-eyebrow">
                                        INVENTORY
                                    </span>
                                    <h2>Stock health</h2>
                                </div>

                                <button
                                    className="panel-link"
                                    onClick={() => setActiveReport("stock")}
                                >
                                    Manage →
                                </button>
                            </div>

                            <div className="health-circle-wrap">
                                <div
                                    className="health-circle"
                                    style={{
                                        "--health": `${Math.min(
                                            100,
                                            stockHealth
                                        ) * 3.6}deg`,
                                    }}
                                >
                                    <div>
                                        <strong>{stockHealth}%</strong>
                                        <span>healthy</span>
                                    </div>
                                </div>

                                <div className="health-details">
                                    <div>
                                        <span>
                                            <i className="dot healthy"></i>
                                            Healthy
                                        </span>
                                        <strong>
                                            {Math.max(
                                                0,
                                                Number(
                                                    stockSummary?.total_products ||
                                                        stock.length ||
                                                        0
                                                ) -
                                                    lowStockCount -
                                                    outOfStockCount
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            <i className="dot warning"></i>
                                            Low stock
                                        </span>
                                        <strong>{lowStockCount}</strong>
                                    </div>

                                    <div>
                                        <span>
                                            <i className="dot danger"></i>
                                            Out of stock
                                        </span>
                                        <strong>{outOfStockCount}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="health-footer">
                                <span>Inventory value</span>
                                <strong>{money(stockValue)}</strong>
                            </div>
                        </section>

                        <section className="panel payment-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-eyebrow">
                                        PAYMENT MIX
                                    </span>
                                    <h2>Where sales come from</h2>
                                </div>
                            </div>

                            {salesByPayment.length === 0 ? (
                                <EmptyState
                                    icon="₹"
                                    title="No payment data"
                                    text="Payment methods will appear after sales."
                                />
                            ) : (
                                <div className="payment-bars">
                                    {salesByPayment.map((item) => (
                                        <div
                                            className="payment-row"
                                            key={item.name}
                                        >
                                            <div className="payment-row-top">
                                                <span>{item.name}</span>
                                                <strong>
                                                    {money(item.value)}
                                                </strong>
                                            </div>

                                            <div className="payment-track">
                                                <span
                                                    style={{
                                                        width: `${
                                                            (item.value /
                                                                maxPaymentValue) *
                                                            100
                                                        }%`,
                                                    }}
                                                ></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="panel profit-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-eyebrow">
                                        PROFITABILITY
                                    </span>
                                    <h2>Top profit products</h2>
                                </div>

                                <button
                                    className="panel-link"
                                    onClick={() => setActiveReport("profit")}
                                >
                                    Full report →
                                </button>
                            </div>

                            {topProfitProducts.length === 0 ? (
                                <EmptyState
                                    icon="✦"
                                    title="No profit data"
                                    text="Product profitability will appear here."
                                />
                            ) : (
                                <div className="profit-product-list">
                                    {topProfitProducts.map((item, index) => {
                                        const value = Number(item?.profit || 0);
                                        const maxProfit = Math.max(
                                            ...topProfitProducts.map((p) =>
                                                Math.abs(
                                                    Number(p?.profit || 0)
                                                )
                                            ),
                                            1
                                        );

                                        return (
                                            <div
                                                className="profit-product"
                                                key={
                                                    item?.product_id ||
                                                    item?.id ||
                                                    index
                                                }
                                            >
                                                <div className="rank">
                                                    {String(index + 1).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>

                                                <div className="profit-product-main">
                                                    <div className="profit-product-top">
                                                        <strong>
                                                            {item?.product_name ||
                                                                "Unnamed product"}
                                                        </strong>

                                                        <span
                                                            className={
                                                                value < 0
                                                                    ? "negative-number"
                                                                    : "positive-number"
                                                            }
                                                        >
                                                            {formatProfit(value)}
                                                        </span>
                                                    </div>

                                                    <div className="profit-mini-track">
                                                        <span
                                                            className={
                                                                value < 0
                                                                    ? "negative-bar"
                                                                    : ""
                                                            }
                                                            style={{
                                                                width: `${
                                                                    (Math.abs(
                                                                        value
                                                                    ) /
                                                                        maxProfit) *
                                                                    100
                                                                }%`,
                                                            }}
                                                        ></span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="panel critical-stock-panel">
                            <div className="panel-header">
                                <div>
                                    <span className="panel-eyebrow">
                                        ATTENTION NEEDED
                                    </span>
                                    <h2>Critical stock</h2>
                                </div>

                                <button
                                    className="panel-link"
                                    onClick={() => setActiveReport("stock")}
                                >
                                    View stock →
                                </button>
                            </div>

                            {criticalStock.length === 0 ? (
                                <div className="success-empty">
                                    <div className="success-check">✓</div>
                                    <div>
                                        <strong>Stock looks healthy</strong>
                                        <span>
                                            No products are below their minimum
                                            level.
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="critical-list">
                                    {criticalStock.map((item, index) => {
                                        const status = getStockStatus(item);

                                        return (
                                            <div
                                                className="critical-item"
                                                key={item?.id || index}
                                            >
                                                <div className="critical-product">
                                                    <strong>
                                                        {item?.product_name ||
                                                            "Unnamed product"}
                                                    </strong>
                                                    <span>
                                                        {item?.category ||
                                                            "Other"}{" "}
                                                        •{" "}
                                                        {item?.unit || "pcs"}
                                                    </span>
                                                </div>

                                                <div className="critical-stock">
                                                    <strong>
                                                        {item?.stock ?? 0}
                                                    </strong>
                                                    <span>
                                                        / min{" "}
                                                        {item?.min_stock ?? 0}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`stock-badge ${status.className}`}
                                                >
                                                    {status.icon} {status.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* =====================================================
                    SALES REPORT
                ===================================================== */}

                {activeReport === "sales" && (
                    <ReportTable
                        eyebrow="SALES"
                        title="Sales report"
                        count={`${sales.length} records`}
                        total={money(totalSales)}
                        columns={[
                            "Invoice",
                            "Customer",
                            "Date",
                            "Payment",
                            "Status",
                            "Discount",
                            "Total",
                        ]}
                        empty="No sales found"
                    >
                        {sales.length === 0 ? (
                            <TableEmpty colSpan={7} text="No sales found" />
                        ) : (
                            sales.map((sale, index) => (
                                <tr key={sale?.id || index}>
                                    <td className="table-id">
                                        {sale?.invoice_no || "—"}
                                    </td>

                                    <td>
                                        <div className="customer-cell">
                                            <span className="table-avatar">
                                                {String(
                                                    sale?.customer_name || "W"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                            <span>
                                                {sale?.customer_name ||
                                                    "Walk-in Customer"}
                                            </span>
                                        </div>
                                    </td>

                                    <td>{formatDate(sale?.created_at)}</td>

                                    <td>
                                        <span className="soft-pill">
                                            {sale?.payment_method || "—"}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="soft-pill paid">
                                            {sale?.payment_status || "Paid"}
                                        </span>
                                    </td>

                                    <td className="discount-text">
                                        {money(sale?.discount)}
                                    </td>

                                    <td className="table-money">
                                        {money(sale?.total_amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </ReportTable>
                )}

                {/* =====================================================
                    PURCHASE REPORT
                ===================================================== */}

                {activeReport === "purchases" && (
                    <ReportTable
                        eyebrow="PURCHASES"
                        title="Purchase report"
                        count={`${purchases.length} records`}
                        total={money(totalPurchases)}
                        columns={[
                            "Invoice",
                            "Supplier",
                            "Date",
                            "Total",
                            "Paid",
                            "Due",
                            "Status",
                        ]}
                        empty="No purchases found"
                    >
                        {purchases.length === 0 ? (
                            <TableEmpty colSpan={7} text="No purchases found" />
                        ) : (
                            purchases.map((purchase, index) => (
                                <tr key={purchase?.id || index}>
                                    <td className="table-id">
                                        {purchase?.invoice_no || "—"}
                                    </td>

                                    <td>
                                        <div className="supplier-cell">
                                            <span className="supplier-avatar">
                                                {String(
                                                    purchase?.supplier_name ||
                                                        "S"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>

                                            {purchase?.supplier_name || "—"}
                                        </div>
                                    </td>

                                    <td>
                                        {formatDate(purchase?.created_at)}
                                    </td>

                                    <td className="table-money">
                                        {money(purchase?.total_amount)}
                                    </td>

                                    <td>
                                        {money(purchase?.paid_amount)}
                                    </td>

                                    <td className="due-text">
                                        {money(purchase?.due_amount)}
                                    </td>

                                    <td>
                                        <span className="soft-pill">
                                            {purchase?.payment_status || "—"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </ReportTable>
                )}

                {/* =====================================================
                    PROFIT REPORT
                ===================================================== */}

                {activeReport === "profit" && (
                    <section className="report-section-modern">
                        <div className="report-title-row">
                            <div>
                                <span className="panel-eyebrow">
                                    PROFITABILITY
                                </span>
                                <h2>Profit report</h2>
                                <p>
                                    Understand which products generate profit
                                    and where losses appear.
                                </p>
                            </div>

                            <div className="net-profit-card">
                                <span>NET PROFIT</span>
                                <strong
                                    className={
                                        totalProfit < 0 ? "negative" : ""
                                    }
                                >
                                    {formatProfit(totalProfit)}
                                </strong>
                            </div>
                        </div>

                        <div className="profit-metrics">
                            <div>
                                <span>Gross profit</span>
                                <strong className="positive-number">
                                    {money(profitStats.grossProfit)}
                                </strong>
                            </div>

                            <div>
                                <span>Total loss</span>
                                <strong className="negative-number">
                                    {money(profitStats.totalLoss)}
                                </strong>
                            </div>

                            <div>
                                <span>Profit products</span>
                                <strong>{profitStats.profitProducts}</strong>
                            </div>

                            <div>
                                <span>Loss products</span>
                                <strong className="negative-number">
                                    {profitStats.lossProducts}
                                </strong>
                            </div>

                            {profitStats.zeroProducts > 0 && (
                                <div>
                                    <span>Zero profit</span>
                                    <strong>{profitStats.zeroProducts}</strong>
                                </div>
                            )}
                        </div>

                        <div className="table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty sold</th>
                                        <th>Sales</th>
                                        <th>Cost</th>
                                        <th>Profit / Loss</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {profit.length === 0 ? (
                                        <TableEmpty
                                            colSpan={6}
                                            text="No profit data found"
                                        />
                                    ) : (
                                        profit.map((item, index) => {
                                            const status = getProfitStatus(
                                                item?.profit
                                            );

                                            return (
                                                <tr
                                                    key={
                                                        item?.product_id ||
                                                        item?.id ||
                                                        index
                                                    }
                                                >
                                                    <td className="product-cell">
                                                        <div className="product-symbol">
                                                            {String(
                                                                item?.product_name ||
                                                                    "P"
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <strong>
                                                            {item?.product_name ||
                                                                "Unnamed product"}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {item?.quantity_sold ??
                                                            0}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item?.sales_value
                                                        )}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item?.purchase_value
                                                        )}
                                                    </td>

                                                    <td
                                                        className={
                                                            getProfitValue(
                                                                item
                                                            ) < 0
                                                                ? "negative-number"
                                                                : getProfitValue(
                                                                        item
                                                                    ) > 0
                                                                  ? "positive-number"
                                                                  : "muted-number"
                                                        }
                                                    >
                                                        {formatProfit(
                                                            item?.profit
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`profit-status ${status.className}`}
                                                        >
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* =====================================================
                    STOCK REPORT
                ===================================================== */}

                {activeReport === "stock" && (
                    <section className="report-section-modern">
                        <div className="report-title-row">
                            <div>
                                <span className="panel-eyebrow">
                                    INVENTORY CONTROL
                                </span>
                                <h2>Stock report</h2>
                                <p>
                                    Keep track of available products, low stock
                                    and inventory value.
                                </p>
                            </div>

                            <div className="net-profit-card stock-value-card">
                                <span>INVENTORY VALUE</span>
                                <strong>{money(stockValue)}</strong>
                            </div>
                        </div>

                        <div className="stock-metrics">
                            <div>
                                <span>Total stock</span>
                                <strong>
                                    {stockSummary?.total_stock || 0}
                                </strong>
                            </div>

                            <div>
                                <span>Products</span>
                                <strong>
                                    {stockSummary?.total_products ||
                                        stock.length ||
                                        0}
                                </strong>
                            </div>

                            <div>
                                <span>Low stock</span>
                                <strong className="warning-number">
                                    {lowStockCount}
                                </strong>
                            </div>

                            <div>
                                <span>Out of stock</span>
                                <strong className="negative-number">
                                    {outOfStockCount}
                                </strong>
                            </div>
                        </div>

                        <div className="table-scroll">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Stock</th>
                                        <th>Unit</th>
                                        <th>Purchase price</th>
                                        <th>Stock value</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {stock.length === 0 ? (
                                        <TableEmpty
                                            colSpan={7}
                                            text="No products found"
                                        />
                                    ) : (
                                        stock.map((item, index) => {
                                            const status =
                                                getStockStatus(item);

                                            return (
                                                <tr
                                                    key={
                                                        item?.id ||
                                                        item?.product_id ||
                                                        index
                                                    }
                                                >
                                                    <td className="product-cell">
                                                        <div className="product-symbol">
                                                            {String(
                                                                item?.product_name ||
                                                                    "P"
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <strong>
                                                            {item?.product_name ||
                                                                "Unnamed product"}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {item?.category ||
                                                            "Other"}
                                                    </td>

                                                    <td className="stock-quantity">
                                                        {item?.stock ?? 0}
                                                    </td>

                                                    <td>
                                                        {item?.unit || "pcs"}
                                                    </td>

                                                    <td>
                                                        {money(
                                                            item?.purchase_price
                                                        )}
                                                    </td>

                                                    <td className="table-money">
                                                        {money(
                                                            item?.stock_value
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`stock-badge ${status.className}`}
                                                        >
                                                            <i>
                                                                {status.icon}
                                                            </i>
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* =====================================================
                    FOOTER INSIGHT
                ===================================================== */}

                <div className="bottom-insight">
                    <div className="insight-icon">✦</div>

                    <div>
                        <strong>Business snapshot</strong>
                        <span>
                            {sales.length} sales records •{" "}
                            {purchases.length} purchase records •{" "}
                            {stock.length} products tracked
                        </span>
                    </div>

                    <div className="snapshot-time">
                        Updated {formatDateTime(new Date())}
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================
// REUSABLE COMPONENTS
// =============================================================

function EmptyState({ icon, title, text }) {
    return (
        <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <strong>{title}</strong>
            <span>{text}</span>
        </div>
    );
}

function TableEmpty({ colSpan, text }) {
    return (
        <tr>
            <td colSpan={colSpan}>
                <div className="table-empty">
                    <div className="empty-icon">◌</div>
                    <strong>{text}</strong>
                    <span>Try another date range or add new transactions.</span>
                </div>
            </td>
        </tr>
    );
}

function ReportTable({
    eyebrow,
    title,
    count,
    total,
    columns,
    children,
}) {
    return (
        <section className="report-section-modern">
            <div className="report-title-row">
                <div>
                    <span className="panel-eyebrow">{eyebrow}</span>
                    <h2>{title}</h2>
                    <p>{count}</p>
                </div>

                <div className="net-profit-card">
                    <span>TOTAL</span>
                    <strong>{total}</strong>
                </div>
            </div>

            <div className="table-scroll">
                <table className="modern-table">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th key={column}>{column}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>{children}</tbody>
                </table>
            </div>
        </section>
    );
}

// =============================================================
// CHART COMPONENTS
// =============================================================

function FinancialTrendChart({ data, money }) {
    const width = 1100;
    const height = 300;
    const padding = { top: 18, right: 22, bottom: 48, left: 58 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(
        ...data.flatMap((item) => [Number(item.sales || 0), Number(item.purchases || 0)]),
        1
    );

    const x = (index) =>
        padding.left +
        (data.length === 1
            ? chartWidth / 2
            : (index / (data.length - 1)) * chartWidth);

    const y = (value) =>
        padding.top + chartHeight - (Number(value || 0) / maxValue) * chartHeight;

    const makePoints = (key) =>
        data.map((item, index) => `${x(index)},${y(item[key])}`).join(" ");

    const labelStep = Math.max(1, Math.ceil(data.length / 7));

    return (
        <div className="financial-chart">
            <svg
                className="financial-chart-svg"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Sales and purchases trend chart"
            >
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const value = maxValue * ratio;
                    const yPosition = y(value);

                    return (
                        <g key={ratio}>
                            <line
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={yPosition}
                                y2={yPosition}
                                className="chart-grid-line"
                            />
                            <text
                                x={padding.left - 10}
                                y={yPosition + 4}
                                textAnchor="end"
                                className="chart-axis-label"
                            >
                                {money(value)}
                            </text>
                        </g>
                    );
                })}

                <polyline
                    points={makePoints("purchases")}
                    className="chart-line purchases-line"
                    fill="none"
                />

                <polyline
                    points={makePoints("sales")}
                    className="chart-line sales-line"
                    fill="none"
                />

                {data.map((item, index) => (
                    <g key={item.key}>
                        <circle
                            cx={x(index)}
                            cy={y(item.purchases)}
                            r="3.5"
                            className="chart-point purchases-point"
                        />
                        <circle
                            cx={x(index)}
                            cy={y(item.sales)}
                            r="4"
                            className="chart-point sales-point"
                        />

                        {(index % labelStep === 0 || index === data.length - 1) && (
                            <text
                                x={x(index)}
                                y={height - 18}
                                textAnchor="middle"
                                className="chart-x-label"
                            >
                                {item.label}
                            </text>
                        )}
                    </g>
                ))}
            </svg>

            <div className="chart-summary">
                <div>
                    <span>Sales in period</span>
                    <strong>
                        {money(
                            data.reduce(
                                (sum, item) => sum + Number(item.sales || 0),
                                0
                            )
                        )}
                    </strong>
                </div>
                <div>
                    <span>Purchases in period</span>
                    <strong>
                        {money(
                            data.reduce(
                                (sum, item) => sum + Number(item.purchases || 0),
                                0
                            )
                        )}
                    </strong>
                </div>
                <div>
                    <span>Data points</span>
                    <strong>{data.length}</strong>
                </div>
            </div>
        </div>
    );
}


// =============================================================
// STYLES
// =============================================================

const styles = {
    css: `
        * {
            box-sizing: border-box;
        }

        .reports-page {
            min-height: 100vh;
            background:
                radial-gradient(circle at 5% 0%, rgba(91, 92, 255, 0.08), transparent 25%),
                radial-gradient(circle at 95% 8%, rgba(24, 190, 144, 0.08), transparent 23%),
                #f6f7fb;
            color: #111827;
            font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
            padding: 0 0 60px;
        }

        .reports-shell {
            width: min(1440px, calc(100% - 40px));
            margin: 0 auto;
            padding: 24px 0 0;
        }

        /* =====================================================
           TOP BAR
        ===================================================== */

        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 22px;
        }

        .brand-block,
        .topbar-actions,
        .hero-meta,
        .control-heading,
        .customer-cell,
        .supplier-cell,
        .product-cell,
        .critical-item,
        .success-empty,
        .bottom-insight {
            display: flex;
            align-items: center;
        }

        .brand-block {
            gap: 11px;
        }

        .brand-mark {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border-radius: 13px;
            background: #111827;
            color: #fff;
            box-shadow: 0 9px 20px rgba(17, 24, 39, 0.15);
        }

        .brand-mark span {
            font-size: 17px;
            font-weight: 900;
        }

        .brand-name {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: -0.2px;
        }

        .brand-subtitle {
            margin-top: 2px;
            color: #7b8494;
            font-size: 11px;
        }

        .topbar-actions {
            gap: 10px;
        }

        .live-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 12px;
            border: 1px solid #e6e9ef;
            border-radius: 999px;
            background: rgba(255,255,255,0.82);
            color: #5e6879;
            font-size: 11px;
            font-weight: 700;
        }

        .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 0 4px rgba(34,197,94,0.12);
        }

        .refresh-button {
            height: 40px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 0;
            border-radius: 11px;
            padding: 0 15px;
            background: #111827;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: 0.2s ease;
            box-shadow: 0 8px 18px rgba(17,24,39,0.13);
        }

        .refresh-button:hover {
            transform: translateY(-1px);
            background: #1f2937;
        }

        .refresh-button:disabled {
            opacity: 0.7;
            cursor: wait;
        }

        .refresh-button span {
            font-size: 16px;
            line-height: 1;
        }

        .spin {
            display: inline-block;
            animation: spin 0.75s linear infinite;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero-card {
            position: relative;
            min-height: 350px;
            overflow: hidden;
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 25px;
            border-radius: 28px;
            padding: 48px 52px;
            background:
                radial-gradient(circle at 78% 50%, rgba(90, 88, 255, 0.25), transparent 28%),
                radial-gradient(circle at 100% 0%, rgba(23, 197, 151, 0.16), transparent 30%),
                linear-gradient(135deg, #111827 0%, #17233a 48%, #20265b 100%);
            color: white;
            box-shadow: 0 24px 55px rgba(17,24,39,0.19);
            margin-bottom: 22px;
        }

        .hero-glow {
            position: absolute;
            border-radius: 50%;
            filter: blur(2px);
            pointer-events: none;
        }

        .hero-glow-one {
            width: 230px;
            height: 230px;
            right: 14%;
            top: -110px;
            background: rgba(124, 112, 255, 0.16);
        }

        .hero-glow-two {
            width: 180px;
            height: 180px;
            right: -30px;
            bottom: -85px;
            background: rgba(23, 197, 151, 0.12);
        }

        .hero-content {
            position: relative;
            z-index: 2;
            align-self: center;
        }

        .hero-eyebrow,
        .panel-eyebrow,
        .kpi-tag {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.6px;
        }

        .hero-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #9da6ff;
        }

        .spark {
            color: #8f86ff;
            font-size: 14px;
        }

        .hero-content h1 {
            max-width: 650px;
            margin: 12px 0 13px;
            font-size: clamp(38px, 5vw, 66px);
            line-height: 0.98;
            letter-spacing: -3.5px;
            font-weight: 850;
        }

        .hero-content h1 span {
            color: #8d85ff;
        }

        .hero-content p {
            max-width: 560px;
            margin: 0;
            color: #aeb8ca;
            font-size: 14px;
            line-height: 1.7;
        }

        .hero-meta {
            gap: 20px;
            margin-top: 31px;
        }

        .hero-meta > div:not(.hero-divider) {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .hero-meta-label {
            color: #7f8ba0;
            font-size: 10px;
            font-weight: 700;
        }

        .hero-meta strong {
            font-size: 16px;
            letter-spacing: -0.4px;
        }

        .hero-meta .hero-profit {
            color: #4de1ad;
        }

        .hero-divider {
            width: 1px;
            height: 31px;
            background: rgba(255,255,255,0.12);
        }

        .hero-visual {
            position: relative;
            min-height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .orbit-card {
            position: relative;
            z-index: 2;
            width: min(310px, 78%);
            padding: 26px;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 24px;
            background: rgba(255,255,255,0.075);
            backdrop-filter: blur(16px);
            box-shadow:
                0 25px 55px rgba(0,0,0,0.22),
                inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .mini-chart-label {
            color: #8995aa;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.5px;
        }

        .mini-chart-value {
            margin-top: 8px;
            font-size: 44px;
            line-height: 1;
            font-weight: 850;
            letter-spacing: -2px;
        }

        .health-track {
            height: 8px;
            overflow: hidden;
            margin-top: 21px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
        }

        .health-track span {
            display: block;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #716bff, #4de1ad);
        }

        .mini-chart-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 14px;
            color: #8792a7;
            font-size: 10px;
        }

        .mini-chart-footer strong {
            color: #d8deea;
            font-size: 10px;
        }

        .floating-stat {
            position: absolute;
            z-index: 3;
            display: flex;
            align-items: center;
            gap: 9px;
            min-width: 150px;
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 15px;
            background: rgba(17,24,39,0.7);
            backdrop-filter: blur(15px);
            box-shadow: 0 18px 35px rgba(0,0,0,0.2);
        }

        .floating-stat-top {
            top: 15px;
            right: 4%;
        }

        .floating-stat-bottom {
            left: 2%;
            bottom: 14px;
        }

        .floating-icon {
            width: 31px;
            height: 31px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            background: rgba(117,109,255,0.15);
            color: #a29cff;
            font-weight: 900;
        }

        .floating-icon.green {
            background: rgba(77,225,173,0.12);
            color: #4de1ad;
        }

        .floating-stat small {
            display: block;
            color: #7e8a9f;
            font-size: 9px;
        }

        .floating-stat strong {
            display: block;
            margin-top: 2px;
            color: #eef1f8;
            font-size: 12px;
        }

        /* =====================================================
           ERROR
        ===================================================== */

        .error-box {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 13px 15px;
            margin-bottom: 20px;
            border: 1px solid #fecaca;
            border-radius: 15px;
            background: #fff5f5;
            color: #991b1b;
        }

        .error-icon {
            width: 31px;
            height: 31px;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
            border-radius: 10px;
            background: #fee2e2;
            font-weight: 900;
        }

        .error-box strong,
        .error-box span {
            display: block;
        }

        .error-box strong {
            font-size: 11px;
        }

        .error-box span {
            margin-top: 2px;
            font-size: 11px;
            color: #b45353;
        }

        .error-box button {
            margin-left: auto;
            border: 0;
            background: transparent;
            color: #991b1b;
            font-size: 19px;
            cursor: pointer;
        }

        /* =====================================================
           CONTROL CARD
        ===================================================== */

        .control-card {
            padding: 20px;
            margin-bottom: 22px;
            border: 1px solid #e8eaf0;
            border-radius: 22px;
            background: rgba(255,255,255,0.88);
            box-shadow: 0 12px 35px rgba(24,31,47,0.045);
        }

        .control-heading {
            gap: 11px;
            margin-bottom: 18px;
        }

        .control-icon {
            width: 39px;
            height: 39px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: #f0efff;
            color: #645cff;
            font-size: 18px;
        }

        .control-heading h2 {
            margin: 0;
            color: #1c2433;
            font-size: 13px;
            letter-spacing: -0.2px;
        }

        .control-heading p {
            margin: 3px 0 0;
            color: #8a92a2;
            font-size: 10px;
        }

        .date-controls {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            flex-wrap: wrap;
        }

        .date-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .date-field label {
            color: #8b94a5;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1px;
        }

        .date-field input {
            width: 190px;
            height: 42px;
            border: 1px solid #e2e5eb;
            border-radius: 11px;
            outline: 0;
            padding: 0 12px;
            background: #fafbfc;
            color: #253044;
            font-size: 11px;
            font-weight: 650;
            transition: 0.2s ease;
        }

        .date-field input:focus {
            border-color: #8b84ff;
            box-shadow: 0 0 0 3px rgba(109,101,255,0.09);
            background: #fff;
        }

        .date-arrow {
            height: 42px;
            display: grid;
            place-items: center;
            color: #a3aaba;
            font-size: 15px;
        }

        .apply-button,
        .clear-button {
            height: 42px;
            border-radius: 11px;
            padding: 0 17px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: 0.2s ease;
        }

        .apply-button {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            border: 0;
            background: #111827;
            color: #fff;
        }

        .apply-button:hover {
            transform: translateY(-1px);
            background: #1d2739;
        }

        .apply-button span {
            color: #a49eff;
            font-size: 15px;
        }

        .clear-button {
            border: 1px solid #e2e5eb;
            background: #fff;
            color: #667085;
        }

        .clear-button:hover {
            border-color: #cfd4de;
            background: #f8f9fb;
        }

        .quick-filters {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 15px;
            padding-top: 14px;
            border-top: 1px dashed #e3e6ec;
        }

        .quick-filters > span {
            margin-right: 4px;
            color: #8c95a5;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .quick-filters button {
            border: 1px solid #e4e7ed;
            border-radius: 999px;
            padding: 6px 10px;
            background: #fafbfc;
            color: #626c7e;
            font-size: 9px;
            font-weight: 750;
            cursor: pointer;
        }

        .quick-filters button:hover {
            border-color: #cfcdfb;
            color: #5d57d9;
            background: #f7f6ff;
        }

        /* =====================================================
           KPI GRID
        ===================================================== */

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 13px;
            margin-bottom: 22px;
        }

        .kpi-card {
            position: relative;
            overflow: hidden;
            min-height: 155px;
            padding: 20px;
            border: 1px solid #e8eaf0;
            border-radius: 20px;
            background: #fff;
            box-shadow: 0 11px 30px rgba(24,31,47,0.045);
            transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .kpi-card::after {
            content: "";
            position: absolute;
            width: 110px;
            height: 110px;
            right: -45px;
            bottom: -52px;
            border-radius: 50%;
            background: rgba(102,94,255,0.055);
        }

        .kpi-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 17px 38px rgba(24,31,47,0.08);
        }

        .kpi-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .kpi-icon {
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border-radius: 11px;
            background: #f1f0ff;
            color: #655eff;
            font-size: 16px;
            font-weight: 900;
        }

        .kpi-profit .kpi-icon {
            background: #eafaf4;
            color: #18a978;
        }

        .kpi-purchases .kpi-icon {
            background: #fff4e9;
            color: #d87a20;
        }

        .kpi-stock .kpi-icon {
            background: #eaf2ff;
            color: #3b73d1;
        }

        .kpi-tag {
            color: #8a93a3;
            font-size: 9px;
            letter-spacing: 1.1px;
        }

        .kpi-number {
            position: relative;
            z-index: 2;
            margin-top: 19px;
            color: #161d2a;
            font-size: clamp(20px, 2vw, 28px);
            line-height: 1;
            font-weight: 850;
            letter-spacing: -1px;
            font-variant-numeric: tabular-nums;
        }

        .kpi-bottom {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 17px;
            color: #9098a8;
            font-size: 9px;
            font-weight: 700;
        }

        .kpi-arrow {
            width: 22px;
            height: 22px;
            display: grid;
            place-items: center;
            border-radius: 7px;
            background: #f5f6f8;
            color: #747e8e;
        }

        /* =====================================================
           TABS
        ===================================================== */

        .report-tabs {
            display: flex;
            align-items: center;
            gap: 4px;
            width: max-content;
            max-width: 100%;
            padding: 5px;
            margin-bottom: 15px;
            overflow-x: auto;
            border: 1px solid #e5e8ee;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 8px 24px rgba(24,31,47,0.035);
        }

        .report-tabs button {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            height: 34px;
            border: 0;
            border-radius: 9px;
            padding: 0 12px;
            background: transparent;
            color: #7d8696;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
            transition: 0.18s ease;
        }

        .report-tabs button span {
            font-size: 12px;
        }

        .report-tabs button:hover {
            color: #4f49ca;
            background: #f6f5ff;
        }

        .report-tabs button.active {
            background: #111827;
            color: #fff;
            box-shadow: 0 5px 12px rgba(17,24,39,0.13);
        }

        .report-tabs button.active span {
            color: #9c96ff;
        }

        /* =====================================================
           OVERVIEW GRID
        ===================================================== */

        .overview-grid {
            display: grid;
            grid-template-columns: 1.25fr 0.75fr;
            gap: 14px;
        }

        .panel {
            min-width: 0;
            padding: 21px;
            border: 1px solid #e7e9ef;
            border-radius: 21px;
            background: #fff;
            box-shadow: 0 10px 30px rgba(24,31,47,0.04);
        }

        .panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
        }

        .panel-eyebrow {
            color: #8d95a4;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.4px;
        }

        .panel h2 {
            margin: 5px 0 0;
            color: #1c2433;
            font-size: 17px;
            letter-spacing: -0.55px;
        }

        .panel-link {
            border: 0;
            background: transparent;
            color: #635cf1;
            font-size: 10px;
            font-weight: 850;
            cursor: pointer;
        }

        .panel-link:hover {
            color: #4942c7;
        }

        .sales-overview-panel {
            min-height: 390px;
        }

        .recent-list {
            display: flex;
            flex-direction: column;
        }

        .recent-sale {
            display: grid;
            grid-template-columns: 37px 1fr auto;
            align-items: center;
            gap: 11px;
            min-width: 0;
            padding: 11px 0;
            border-bottom: 1px solid #f0f1f4;
        }

        .recent-sale:last-child {
            border-bottom: 0;
        }

        .recent-avatar,
        .table-avatar,
        .supplier-avatar,
        .product-symbol {
            display: grid;
            place-items: center;
            flex: 0 0 auto;
            font-weight: 850;
        }

        .recent-avatar {
            width: 37px;
            height: 37px;
            border-radius: 11px;
            background: #f0efff;
            color: #625cf0;
            font-size: 11px;
        }

        .recent-main {
            min-width: 0;
        }

        .recent-main strong,
        .recent-main span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .recent-main strong {
            color: #273041;
            font-size: 11px;
        }

        .recent-main span {
            margin-top: 3px;
            color: #969dac;
            font-size: 9px;
        }

        .recent-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }

        .recent-right strong {
            color: #263041;
            font-size: 11px;
            font-variant-numeric: tabular-nums;
        }

        .payment-dot {
            position: relative;
            color: #8b93a2;
            font-size: 8px;
            text-transform: capitalize;
        }

        .payment-dot::before {
            content: "";
            display: inline-block;
            width: 5px;
            height: 5px;
            margin-right: 4px;
            border-radius: 50%;
            background: #22c55e;
        }

        .payment-dot.pending::before {
            background: #f59e0b;
        }

        .payment-dot.failed::before {
            background: #ef4444;
        }

        .health-panel {
            min-height: 390px;
        }

        .health-circle-wrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
            gap: 18px;
            min-height: 230px;
        }

        .health-circle {
            width: 160px;
            height: 160px;
            display: grid;
            place-items: center;
            margin: 0 auto;
            border-radius: 50%;
            background:
                conic-gradient(
                    #645cff 0deg,
                    #8e87ff var(--health),
                    #eef0f4 var(--health),
                    #eef0f4 360deg
                );
            position: relative;
        }

        .health-circle::before {
            content: "";
            position: absolute;
            inset: 12px;
            border-radius: 50%;
            background: #fff;
        }

        .health-circle > div {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .health-circle strong {
            color: #1b2330;
            font-size: 31px;
            letter-spacing: -1.5px;
        }

        .health-circle span {
            margin-top: 2px;
            color: #929aa9;
            font-size: 9px;
            font-weight: 700;
        }

        .health-details {
            display: flex;
            flex-direction: column;
            gap: 13px;
        }

        .health-details > div {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .health-details span {
            color: #778091;
            font-size: 10px;
        }

        .health-details strong {
            color: #253043;
            font-size: 12px;
        }

        .dot {
            display: inline-block;
            width: 7px;
            height: 7px;
            margin-right: 6px;
            border-radius: 50%;
            vertical-align: 0;
        }

        .dot.healthy {
            background: #23bf8a;
        }

        .dot.warning {
            background: #f4a62b;
        }

        .dot.danger {
            background: #ef5b65;
        }

        .health-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding-top: 14px;
            border-top: 1px solid #f0f1f4;
        }

        .health-footer span {
            color: #8d95a3;
            font-size: 9px;
        }

        .health-footer strong {
            color: #253043;
            font-size: 11px;
        }

        .payment-panel {
            min-height: 300px;
        }

        .profit-panel {
            min-height: 300px;
        }

        .payment-bars {
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding-top: 4px;
        }

        .payment-row-top,
        .profit-product-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
        }

        .payment-row-top span {
            color: #667083;
            font-size: 10px;
            font-weight: 700;
        }

        .payment-row-top strong {
            color: #263043;
            font-size: 10px;
        }

        .payment-track,
        .profit-mini-track {
            height: 7px;
            overflow: hidden;
            margin-top: 8px;
            border-radius: 999px;
            background: #f0f1f5;
        }

        .payment-track span,
        .profit-mini-track span {
            display: block;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, #6d65ff, #9c96ff);
        }

        .profit-product-list {
            display: flex;
            flex-direction: column;
            gap: 13px;
        }

        .profit-product {
            display: grid;
            grid-template-columns: 28px 1fr;
            gap: 10px;
            align-items: center;
        }

        .rank {
            color: #adb3be;
            font-size: 9px;
            font-weight: 900;
        }

        .profit-product-top strong {
            max-width: 68%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #374152;
            font-size: 10px;
        }

        .profit-product-top span {
            font-size: 10px;
            font-weight: 850;
        }

        .positive-number {
            color: #159b6e !important;
        }

        .negative-number {
            color: #dc4d5a !important;
        }

        .muted-number {
            color: #7c8595 !important;
        }

        .profit-mini-track {
            height: 5px;
            margin-top: 7px;
        }

        .profit-mini-track span {
            background: linear-gradient(90deg, #36c69b, #82e0bf);
        }

        .profit-mini-track .negative-bar {
            background: linear-gradient(90deg, #ef6a75, #f5a2a9);
        }

        .critical-stock-panel {
            min-height: 300px;
        }

        .critical-list {
            display: flex;
            flex-direction: column;
        }

        .critical-item {
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #f0f1f4;
        }

        .critical-item:last-child {
            border-bottom: 0;
        }

        .critical-product {
            flex: 1;
            min-width: 0;
        }

        .critical-product strong,
        .critical-product span {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .critical-product strong {
            color: #354052;
            font-size: 10px;
        }

        .critical-product span {
            margin-top: 3px;
            color: #9aa1ad;
            font-size: 8px;
        }

        .critical-stock {
            min-width: 64px;
            text-align: right;
        }

        .critical-stock strong {
            color: #263043;
            font-size: 12px;
        }

        .critical-stock span {
            color: #a1a7b2;
            font-size: 8px;
        }

        .success-empty {
            min-height: 175px;
            justify-content: center;
            gap: 12px;
        }

        .success-check {
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: #eafaf4;
            color: #16a979;
            font-weight: 900;
        }

        .success-empty strong,
        .success-empty span {
            display: block;
        }

        .success-empty strong {
            color: #263043;
            font-size: 11px;
        }

        .success-empty span {
            margin-top: 3px;
            color: #9aa1ad;
            font-size: 9px;
        }

        /* =====================================================
           EMPTY STATES
        ===================================================== */

        .empty-state {
            min-height: 220px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .empty-icon {
            width: 43px;
            height: 43px;
            display: grid;
            place-items: center;
            margin-bottom: 10px;
            border-radius: 13px;
            background: #f4f4ff;
            color: #726cff;
            font-size: 17px;
            font-weight: 900;
        }

        .empty-state strong {
            color: #344052;
            font-size: 11px;
        }

        .empty-state span {
            max-width: 240px;
            margin-top: 4px;
            color: #a0a6b1;
            font-size: 9px;
            line-height: 1.5;
        }

        /* =====================================================
           MODERN REPORT TABLE
        ===================================================== */

        .report-section-modern {
            overflow: hidden;
            border: 1px solid #e7e9ef;
            border-radius: 22px;
            background: #fff;
            box-shadow: 0 10px 30px rgba(24,31,47,0.04);
        }

        .report-title-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding: 24px;
            border-bottom: 1px solid #edf0f3;
        }

        .report-title-row h2 {
            margin: 5px 0 0;
            color: #182131;
            font-size: 21px;
            letter-spacing: -0.7px;
        }

        .report-title-row p {
            margin: 5px 0 0;
            color: #9299a7;
            font-size: 10px;
        }

        .net-profit-card {
            min-width: 180px;
            padding: 13px 16px;
            border: 1px solid #e8eaf0;
            border-radius: 15px;
            background: #fafbfc;
            text-align: right;
        }

        .net-profit-card span {
            display: block;
            color: #969dab;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1px;
        }

        .net-profit-card strong {
            display: block;
            margin-top: 5px;
            color: #159b6e;
            font-size: 17px;
            letter-spacing: -0.4px;
            font-variant-numeric: tabular-nums;
        }

        .net-profit-card strong.negative {
            color: #dc4d5a;
        }

        .stock-value-card strong {
            color: #3f6fc5;
        }

        .profit-metrics,
        .stock-metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-bottom: 1px solid #edf0f3;
            background: #f9fafb;
        }

        .profit-metrics > div,
        .stock-metrics > div {
            padding: 15px 18px;
            border-right: 1px solid #edf0f3;
        }

        .profit-metrics > div:last-child,
        .stock-metrics > div:last-child {
            border-right: 0;
        }

        .profit-metrics span,
        .stock-metrics span {
            display: block;
            color: #9299a7;
            font-size: 9px;
            font-weight: 700;
        }

        .profit-metrics strong,
        .stock-metrics strong {
            display: block;
            margin-top: 5px;
            color: #283245;
            font-size: 14px;
        }

        .warning-number {
            color: #d48419 !important;
        }

        .table-scroll {
            overflow-x: auto;
        }

        .modern-table {
            width: 100%;
            min-width: 850px;
            border-collapse: collapse;
        }

        .modern-table th {
            padding: 13px 18px;
            border-bottom: 1px solid #edf0f3;
            background: #fbfcfd;
            color: #9299a7;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1px;
            text-align: left;
            text-transform: uppercase;
            white-space: nowrap;
        }

        .modern-table td {
            padding: 14px 18px;
            border-bottom: 1px solid #f0f1f4;
            color: #667083;
            font-size: 10px;
            white-space: nowrap;
        }

        .modern-table tbody tr {
            transition: background 0.15s ease;
        }

        .modern-table tbody tr:hover {
            background: #fafaff;
        }

        .modern-table tbody tr:last-child td {
            border-bottom: 0;
        }

        .table-id {
            color: #5c57d9 !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 9px !important;
            font-weight: 800;
        }

        .table-money {
            color: #263043 !important;
            font-weight: 850;
            font-variant-numeric: tabular-nums;
        }

        .discount-text {
            color: #d07b20 !important;
            font-weight: 700;
        }

        .due-text {
            color: #d65b64 !important;
            font-weight: 750;
        }

        .customer-cell,
        .supplier-cell {
            gap: 8px;
        }

        .table-avatar,
        .supplier-avatar {
            width: 27px;
            height: 27px;
            border-radius: 8px;
            background: #f0efff;
            color: #625cf0;
            font-size: 9px;
        }

        .supplier-avatar {
            background: #fff4e9;
            color: #cf761f;
        }

        .soft-pill,
        .profit-status,
        .stock-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 8px;
            border-radius: 999px;
            background: #f3f4f6;
            color: #6e7787;
            font-size: 8px;
            font-weight: 800;
            text-transform: capitalize;
        }

        .soft-pill.paid {
            background: #eafaf4;
            color: #149a6d;
        }

        .profit-status.profit {
            background: #e8faf3;
            color: #13986b;
        }

        .profit-status.loss {
            background: #fff0f1;
            color: #dc4d5a;
        }

        .profit-status.zero {
            background: #f2f3f5;
            color: #7c8492;
        }

        .stock-badge {
            text-transform: none;
        }

        .stock-badge i {
            font-style: normal;
            font-size: 9px;
        }

        .stock-badge.available {
            background: #e8faf3;
            color: #149a6d;
        }

        .stock-badge.low {
            background: #fff5df;
            color: #cb7d18;
        }

        .stock-badge.out {
            background: #fff0f1;
            color: #dc4d5a;
        }

        .product-cell {
            gap: 9px;
        }

        .product-symbol {
            width: 29px;
            height: 29px;
            border-radius: 8px;
            background: #f1f0ff;
            color: #625cf0;
            font-size: 9px;
        }

        .product-cell strong {
            color: #394355;
            font-size: 10px;
        }

        .stock-quantity {
            color: #283245 !important;
            font-weight: 850;
        }

        .table-empty {
            min-height: 250px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .table-empty strong {
            color: #3a4455;
            font-size: 11px;
        }

        .table-empty span {
            margin-top: 4px;
            color: #9ba2ae;
            font-size: 9px;
        }

        /* =====================================================
           BOTTOM SNAPSHOT
        ===================================================== */

        .bottom-insight {
            gap: 11px;
            margin-top: 18px;
            padding: 14px 16px;
            border: 1px solid #e7e9ef;
            border-radius: 17px;
            background: rgba(255,255,255,0.78);
        }

        .insight-icon {
            width: 30px;
            height: 30px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: #f0efff;
            color: #665ff4;
            font-size: 13px;
        }

        .bottom-insight strong,
        .bottom-insight span {
            display: block;
        }

        .bottom-insight strong {
            color: #394355;
            font-size: 10px;
        }

        .bottom-insight span {
            margin-top: 2px;
            color: #9ba2ae;
            font-size: 8px;
        }

        .snapshot-time {
            margin-left: auto;
            color: #9ba2ae;
            font-size: 8px;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .reports-loading {
            min-height: 70vh;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            color: #657083;
        }

        .reports-loading h3 {
            margin: 0;
            color: #273142;
            font-size: 14px;
        }

        .reports-loading p {
            margin: 4px 0 0;
            color: #99a1ae;
            font-size: 10px;
        }

        .loading-orbit {
            width: 42px;
            height: 42px;
            position: relative;
            border: 3px solid #e7e8f0;
            border-top-color: #6b63ff;
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
        }

        .loading-orbit span {
            position: absolute;
            width: 7px;
            height: 7px;
            right: -2px;
            top: 3px;
            border-radius: 50%;
            background: #17b987;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {
            .hero-card {
                grid-template-columns: 1fr;
                padding: 38px;
            }

            .hero-visual {
                min-height: 240px;
            }

            .overview-grid {
                grid-template-columns: 1fr;
            }

            .health-circle-wrap {
                grid-template-columns: 260px 1fr;
            }
        }

        @media (max-width: 900px) {
            .kpi-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .profit-metrics,
            .stock-metrics {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .profit-metrics > div:nth-child(2),
            .stock-metrics > div:nth-child(2) {
                border-right: 0;
            }

            .profit-metrics > div:nth-child(-n + 2),
            .stock-metrics > div:nth-child(-n + 2) {
                border-bottom: 1px solid #edf0f3;
            }
        }

        @media (max-width: 680px) {
            .reports-page {
                padding-bottom: 35px;
            }

            .reports-shell {
                width: min(100% - 22px, 1440px);
                padding-top: 12px;
            }

            .topbar {
                align-items: flex-start;
            }

            .live-pill {
                display: none;
            }

            .refresh-button {
                height: 37px;
                padding: 0 11px;
            }

            .hero-card {
                min-height: auto;
                padding: 30px 23px;
                border-radius: 22px;
            }

            .hero-content h1 {
                font-size: 42px;
                letter-spacing: -2.4px;
            }

            .hero-content p {
                font-size: 12px;
            }

            .hero-meta {
                flex-wrap: wrap;
                gap: 12px 18px;
            }

            .hero-divider {
                display: none;
            }

            .hero-visual {
                min-height: 210px;
            }

            .orbit-card {
                width: 70%;
                padding: 20px;
            }

            .floating-stat {
                min-width: 130px;
                padding: 9px;
            }

            .floating-stat-top {
                right: 0;
            }

            .floating-stat-bottom {
                left: 0;
            }

            .control-card {
                padding: 16px;
                border-radius: 18px;
            }

            .date-controls {
                display: grid;
                grid-template-columns: 1fr;
            }

            .date-field input {
                width: 100%;
            }

            .date-arrow {
                display: none;
            }

            .apply-button,
            .clear-button {
                width: 100%;
            }

            .kpi-grid {
                grid-template-columns: 1fr;
            }

            .kpi-card {
                min-height: 140px;
            }

            .report-tabs {
                width: 100%;
            }

            .overview-grid {
                gap: 11px;
            }

            .panel {
                padding: 16px;
                border-radius: 18px;
            }

            .health-circle-wrap {
                grid-template-columns: 1fr;
            }

            .health-circle {
                width: 145px;
                height: 145px;
            }

            .report-title-row {
                flex-direction: column;
                padding: 19px;
            }

            .net-profit-card {
                width: 100%;
                text-align: left;
            }

            .profit-metrics,
            .stock-metrics {
                grid-template-columns: 1fr 1fr;
            }

            .profit-metrics > div,
            .stock-metrics > div {
                border-right: 1px solid #edf0f3 !important;
            }

            .profit-metrics > div:nth-child(even),
            .stock-metrics > div:nth-child(even) {
                border-right: 0 !important;
            }

            .bottom-insight {
                align-items: flex-start;
                flex-wrap: wrap;
            }

            .snapshot-time {
                width: 100%;
                margin-left: 41px;
            }
        }

        @media (max-width: 430px) {
            .brand-name {
                font-size: 12px;
            }

            .brand-subtitle {
                font-size: 9px;
            }

            .hero-content h1 {
                font-size: 36px;
            }

            .hero-visual {
                min-height: 190px;
            }

            .orbit-card {
                width: 75%;
            }

            .floating-stat {
                min-width: 118px;
            }

            .floating-stat strong {
                font-size: 10px;
            }

            .floating-stat-top {
                top: 5px;
            }

            .floating-stat-bottom {
                bottom: 5px;
            }

            .trend-panel {
                grid-column: auto;
            }

            .chart-legend {
                width: 100%;
                justify-content: flex-start;
                margin-top: 6px;
            }

            .financial-chart-svg {
                height: 250px;
            }

            .chart-summary {
                grid-template-columns: 1fr;
            }
        }


        /* =====================================================
           FINANCIAL TREND CHART
        ===================================================== */

        .trend-panel {
            grid-column: 1 / -1;
        }

        .panel-description {
            margin: 5px 0 0;
            color: #8a93a3;
            font-size: 11px;
            line-height: 1.5;
        }

        .chart-legend {
            display: flex;
            align-items: center;
            gap: 16px;
            color: #687386;
            font-size: 11px;
            font-weight: 700;
        }

        .chart-legend span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .legend-dot {
            width: 8px;
            height: 8px;
            display: inline-block;
            border-radius: 50%;
        }

        .sales-dot {
            background: #6c63ff;
        }

        .purchase-dot {
            background: #18b890;
        }

        .financial-chart {
            width: 100%;
            margin-top: 6px;
        }

        .financial-chart-svg {
            display: block;
            width: 100%;
            height: 310px;
            overflow: visible;
        }

        .chart-grid-line {
            stroke: #e9ecf2;
            stroke-width: 1;
            stroke-dasharray: 4 5;
        }

        .chart-axis-label,
        .chart-x-label {
            fill: #8b94a4;
            font-size: 10px;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .chart-line {
            stroke-width: 3;
            stroke-linejoin: round;
            stroke-linecap: round;
        }

        .sales-line {
            stroke: #6c63ff;
        }

        .purchases-line {
            stroke: #18b890;
        }

        .chart-point {
            stroke: #ffffff;
            stroke-width: 2;
        }

        .sales-point {
            fill: #6c63ff;
        }

        .purchases-point {
            fill: #18b890;
        }

        .chart-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 4px;
            padding-top: 15px;
            border-top: 1px solid #edf0f4;
        }

        .chart-summary div {
            min-width: 0;
        }

        .chart-summary span {
            display: block;
            margin-bottom: 5px;
            color: #8a93a3;
            font-size: 10px;
            font-weight: 700;
        }

        .chart-summary strong {
            color: #1b2433;
            font-size: 14px;
            letter-spacing: -0.2px;
        }

    `,
};
