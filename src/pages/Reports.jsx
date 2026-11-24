import React, { useEffect, useMemo, useState } from "react";
import {
    getSalesReport,
    getPurchaseReport,
    getProfitReport,
    getStockReport,
} from "../services/reportApi";

// =============================================================
// HELPERS (pure, outside the component)
// =============================================================

const num = (v) => Number(v || 0);

const money = (v) =>
    `₹${num(v).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const signedMoney = (v) => (num(v) < 0 ? `-${money(Math.abs(num(v)))}` : money(v));

const compact = (v) => {
    const n = num(v);
    const a = Math.abs(n);
    if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (a >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
    return money(n);
};

const fmtDate = (v) => {
    const d = new Date(v);
    if (!v || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const toInput = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const stockStatus = (item) => {
    const s = num(item?.stock);
    const m = num(item?.min_stock);
    if (s <= 0) return { text: "Out of stock", cls: "bad" };
    if (s <= m) return { text: "Running low", cls: "warn" };
    return { text: "In stock", cls: "good" };
};

const RANGES = [
    { key: "all", label: "All time", days: null },
    { key: "today", label: "Today", days: 1 },
    { key: "7", label: "7 days", days: 7 },
    { key: "30", label: "30 days", days: 30 },
    { key: "90", label: "90 days", days: 90 },
];

const TABS = [
    { key: "overview", label: "Overview" },
    { key: "sales", label: "Sales" },
    { key: "purchases", label: "Purchases" },
    { key: "profit", label: "Profit" },
    { key: "stock", label: "Stock" },
];

// =============================================================
// PAGE
// =============================================================

export default function Reports() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [range, setRange] = useState("all");
    const [tab, setTab] = useState("overview");

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

    // ---------------------------------------------------------
    // LOAD
    // ---------------------------------------------------------

    const loadReports = async (start = from, end = to, isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setError("");

            const [s, p, pr, st] = await Promise.all([
                getSalesReport(start, end),
                getPurchaseReport(start, end),
                getProfitReport(start, end),
                getStockReport(),
            ]);

            setSales(s?.data || []);
            setSalesSummary(s?.summary || {});
            setPurchases(p?.data || []);
            setPurchaseSummary(p?.summary || {});
            setProfit(pr?.data || []);
            setProfitSummary(pr?.summary || {});
            setStock(st?.data || []);
            setStockSummary(st?.summary || {});
        } catch (err) {
            console.error("Reports Error:", err);
            setError(
                err?.response?.data?.message || err?.message || "Could not load reports. Check your connection and refresh."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadReports("", "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------------------------------------------------
    // FILTERS
    // ---------------------------------------------------------

    const pickRange = (r) => {
        setRange(r.key);
        if (!r.days) {
            setFrom("");
            setTo("");
            setError("");
            loadReports("", "");
            return;
        }
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - (r.days - 1));
        setFrom(toInput(start));
        setTo(toInput(end));
        loadReports(toInput(start), toInput(end));
    };

    const applyCustom = () => {
        if (from && to && from > to) {
            setError("The start date must be on or before the end date.");
            return;
        }
        setRange("custom");
        loadReports(from, to);
    };

    // ---------------------------------------------------------
    // DERIVED
    // ---------------------------------------------------------

    const totalSales = num(salesSummary?.total_sales);
    const totalPurchases = num(purchaseSummary?.purchase_amount);
    const totalProfit = num(profitSummary?.total_profit);
    const stockValue = num(stockSummary?.inventory_value);
    const lowCount = num(stockSummary?.low_stock);
    const outCount = num(stockSummary?.out_of_stock);
    const productCount = num(stockSummary?.total_products || stock.length);

    const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    // Of every ₹100 sold: how much paid for goods, how much was kept
    const keptPct = Math.max(0, Math.min(100, margin));
    const costPct = 100 - keptPct;

    const profitStats = useMemo(
        () =>
            profit.reduce(
                (s, i) => {
                    const v = num(i?.profit);
                    if (v > 0) {
                        s.winners += 1;
                        s.gain += v;
                    } else if (v < 0) {
                        s.losers += 1;
                        s.loss += Math.abs(v);
                    }
                    return s;
                },
                { winners: 0, losers: 0, gain: 0, loss: 0 }
            ),
        [profit]
    );

    const recentSales = useMemo(
        () =>
            [...sales]
                .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
                .slice(0, 7),
        [sales]
    );

    const topProducts = useMemo(
        () => [...profit].sort((a, b) => num(b?.profit) - num(a?.profit)).slice(0, 6),
        [profit]
    );

    const alerts = useMemo(
        () =>
            stock
                .filter((i) => num(i?.stock) <= num(i?.min_stock))
                .sort((a, b) => num(a?.stock) - num(b?.stock))
                .slice(0, 7),
        [stock]
    );

    const byPayment = useMemo(() => {
        const r = {};
        sales.forEach((s) => {
            const k = String(s?.payment_method || "Other").trim() || "Other";
            r[k] = (r[k] || 0) + num(s?.total_amount);
        });
        const rows = Object.entries(r)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        const total = rows.reduce((a, b) => a + b.value, 0) || 1;
        return rows.map((x) => ({ ...x, pct: (x.value / total) * 100 }));
    }, [sales]);

    const trend = useMemo(() => {
        const rows = [
            ...sales.map((i) => ({ t: "sales", d: i?.created_at, v: num(i?.total_amount) })),
            ...purchases.map((i) => ({ t: "purchases", d: i?.created_at, v: num(i?.total_amount) })),
        ].filter((i) => i.d && !Number.isNaN(new Date(i.d).getTime()));

        if (!rows.length) return [];

        const times = rows.map((r) => new Date(r.d).getTime());
        const min = from ? new Date(`${from}T00:00:00`) : new Date(Math.min(...times));
        const max = to ? new Date(`${to}T23:59:59`) : new Date(Math.max(...times));
        const span = Math.max(1, Math.ceil((max - min) / 86400000) + 1);
        const monthly = span > 90;

        const keyOf = (d) =>
            monthly
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
                : toInput(d);

        const bucket = {};
        const ensure = (d) => {
            const k = keyOf(d);
            if (!bucket[k]) bucket[k] = { key: k, sales: 0, purchases: 0, date: new Date(d) };
            return bucket[k];
        };

        rows.forEach((r) => {
            ensure(new Date(r.d))[r.t] += r.v;
        });

        if (!monthly) {
            const c = new Date(min);
            c.setHours(0, 0, 0, 0);
            while (c <= max) {
                ensure(c);
                c.setDate(c.getDate() + 1);
            }
        }

        return Object.values(bucket)
            .sort((a, b) => a.date - b.date)
            .map((b) => ({
                ...b,
                label: b.date.toLocaleDateString(
                    "en-IN",
                    monthly ? { month: "short", year: "2-digit" } : { day: "2-digit", month: "short" }
                ),
            }));
    }, [sales, purchases, from, to]);

    // ---------------------------------------------------------
    // LOADING
    // ---------------------------------------------------------

    if (loading) {
        return (
            <div className="rp">
                <style>{css}</style>
                <div className="rp-loading" role="status">
                    <span className="rp-spinner" />
                    <div>
                        <strong>Loading your reports</strong>
                        <span>Fetching sales, purchases, profit and stock.</span>
                    </div>
                </div>
            </div>
        );
    }

    const periodLabel =
        range === "all"
            ? "all time"
            : from && to
              ? `${fmtDate(from)} to ${fmtDate(to)}`
              : "the selected period";

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------

    return (
        <div className="rp">
            <style>{css}</style>

            <div className="rp-wrap">
                {/* HEADER */}
                <header className="rp-head">
                    <div>
                        <h1>Reports</h1>
                        <p>Showing {periodLabel}</p>
                    </div>

                    <button
                        className="rp-btn rp-btn-ink"
                        onClick={() => loadReports(from, to, true)}
                        disabled={refreshing}
                    >
                        <span className={refreshing ? "rp-spin" : ""} aria-hidden="true">↻</span>
                        {refreshing ? "Refreshing" : "Refresh"}
                    </button>
                </header>

                {/* PERIOD */}
                <section className="rp-period" aria-label="Report period">
                    <div className="rp-seg" role="group">
                        {RANGES.map((r) => (
                            <button
                                key={r.key}
                                className={range === r.key ? "on" : ""}
                                onClick={() => pickRange(r)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <div className="rp-custom">
                        <label>
                            From
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                        </label>
                        <label>
                            To
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                        </label>
                        <button className="rp-btn rp-btn-line" onClick={applyCustom}>
                            Apply dates
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="rp-error" role="alert">
                        <span>{error}</span>
                        <button onClick={() => setError("")} aria-label="Dismiss">×</button>
                    </div>
                )}

                {/* HERO: where every rupee went */}
                <section className="rp-hero">
                    <div className="rp-hero-text">
                        <span className="rp-hero-label">You kept</span>
                        <div className={`rp-hero-num ${totalProfit < 0 ? "neg" : ""}`}>
                            {signedMoney(totalProfit)}
                        </div>
                        <p>
                            from {money(totalSales)} in sales across {salesSummary?.total_bills || 0} bills.
                        </p>
                    </div>

                    <div className="rp-hero-split">
                        <div className="rp-hero-split-title">
                            Where each ₹100 of sales went
                        </div>
                        <div
                            className="rp-split"
                            role="img"
                            aria-label={`${costPct.toFixed(0)} rupees to cost of goods, ${keptPct.toFixed(0)} rupees kept`}
                        >
                            <span className="cost" style={{ width: `${costPct}%` }} />
                            <span className="kept" style={{ width: `${keptPct}%` }} />
                        </div>
                        <div className="rp-split-key">
                            <div>
                                <i className="cost" />
                                <span>Paid for goods</span>
                                <strong>₹{costPct.toFixed(0)}</strong>
                            </div>
                            <div>
                                <i className="kept" />
                                <span>Kept as profit</span>
                                <strong>₹{keptPct.toFixed(0)}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* KPI STRIP */}
                <section className="rp-kpis">
                    <Kpi label="Sales" value={money(totalSales)} note={`${salesSummary?.total_bills || 0} bills`} />
                    <Kpi
                        label="Purchases"
                        value={money(totalPurchases)}
                        note={`${purchaseSummary?.total_purchases || 0} orders`}
                    />
                    <Kpi label="Profit margin" value={`${margin.toFixed(1)}%`} note="of sales" />
                    <Kpi label="Stock value" value={money(stockValue)} note={`${productCount} products`} />
                </section>

                {/* TABS */}
                <nav className="rp-tabs" aria-label="Report sections">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            className={tab === t.key ? "on" : ""}
                            onClick={() => setTab(t.key)}
                            aria-current={tab === t.key ? "page" : undefined}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                {/* OVERVIEW */}
                {tab === "overview" && (
                    <div className="rp-grid">
                        <Panel
                            className="span-2"
                            title="Sales and purchases over time"
                            aside={
                                <div className="rp-legend">
                                    <span><i className="l-sales" />Sales</span>
                                    <span><i className="l-buy" />Purchases</span>
                                </div>
                            }
                        >
                            {trend.length < 2 ? (
                                <Empty title="Not enough data for a trend" text="Record a few sales or purchases and the chart will appear." />
                            ) : (
                                <TrendChart data={trend} />
                            )}
                        </Panel>

                        <Panel title="Recent sales" action={["See all sales", () => setTab("sales")]}>
                            {recentSales.length === 0 ? (
                                <Empty title="No sales yet" text="New bills will show up here." />
                            ) : (
                                <ul className="rp-list">
                                    {recentSales.map((s, i) => (
                                        <li key={s?.id || i}>
                                            <div className="rp-list-main">
                                                <strong>{s?.customer_name || "Walk-in customer"}</strong>
                                                <span>{s?.invoice_no || "No invoice"} · {fmtDate(s?.created_at)}</span>
                                            </div>
                                            <div className="rp-list-end">
                                                <strong>{money(s?.total_amount)}</strong>
                                                <span>{s?.payment_status || "Paid"}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="Needs restocking" action={["Open stock", () => setTab("stock")]}>
                            {alerts.length === 0 ? (
                                <Empty title="Nothing is running low" text="Every product is above its minimum level." />
                            ) : (
                                <ul className="rp-list">
                                    {alerts.map((a, i) => {
                                        const st = stockStatus(a);
                                        return (
                                            <li key={a?.id || i}>
                                                <div className="rp-list-main">
                                                    <strong>{a?.product_name || "Unnamed product"}</strong>
                                                    <span>{a?.category || "Other"}</span>
                                                </div>
                                                <div className="rp-list-end">
                                                    <strong>{a?.stock ?? 0} {a?.unit || "pcs"}</strong>
                                                    <span className={`rp-tag ${st.cls}`}>{st.text}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="How customers paid">
                            {byPayment.length === 0 ? (
                                <Empty title="No payments yet" text="Payment methods appear once you record sales." />
                            ) : (
                                <ul className="rp-bars">
                                    {byPayment.map((p) => (
                                        <li key={p.name}>
                                            <div>
                                                <span>{p.name}</span>
                                                <strong>{money(p.value)} <em>{p.pct.toFixed(0)}%</em></strong>
                                            </div>
                                            <div className="rp-bar"><span style={{ width: `${p.pct}%` }} /></div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="Best earners" action={["Full profit report", () => setTab("profit")]}>
                            {topProducts.length === 0 ? (
                                <Empty title="No profit data" text="Products you sell will be ranked here." />
                            ) : (
                                <ul className="rp-bars">
                                    {topProducts.map((p, i) => {
                                        const v = num(p?.profit);
                                        const max = Math.max(...topProducts.map((x) => Math.abs(num(x?.profit))), 1);
                                        return (
                                            <li key={p?.product_id || p?.id || i}>
                                                <div>
                                                    <span>{p?.product_name || "Unnamed product"}</span>
                                                    <strong className={v < 0 ? "neg" : "pos"}>{signedMoney(v)}</strong>
                                                </div>
                                                <div className="rp-bar">
                                                    <span className={v < 0 ? "neg" : "pos"} style={{ width: `${(Math.abs(v) / max) * 100}%` }} />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    </div>
                )}

                {/* SALES */}
                {tab === "sales" && (
                    <Table
                        title="Sales"
                        sub={`${sales.length} bills`}
                        totalLabel="Total sales"
                        total={money(totalSales)}
                        rows={sales}
                        empty="No sales in this period"
                        cols={[
                            { h: "Invoice", r: (s) => s?.invoice_no || "—", c: "id" },
                            { h: "Customer", r: (s) => s?.customer_name || "Walk-in customer" },
                            { h: "Date", r: (s) => fmtDate(s?.created_at) },
                            { h: "Payment", r: (s) => <span className="rp-tag">{s?.payment_method || "—"}</span> },
                            { h: "Status", r: (s) => <span className="rp-tag good">{s?.payment_status || "Paid"}</span> },
                            { h: "Discount", r: (s) => money(s?.discount), c: "num" },
                            { h: "Total", r: (s) => money(s?.total_amount), c: "num strong" },
                        ]}
                    />
                )}

                {/* PURCHASES */}
                {tab === "purchases" && (
                    <Table
                        title="Purchases"
                        sub={`${purchases.length} orders`}
                        totalLabel="Total purchases"
                        total={money(totalPurchases)}
                        rows={purchases}
                        empty="No purchases in this period"
                        cols={[
                            { h: "Invoice", r: (p) => p?.invoice_no || "—", c: "id" },
                            { h: "Supplier", r: (p) => p?.supplier_name || "—" },
                            { h: "Date", r: (p) => fmtDate(p?.created_at) },
                            { h: "Total", r: (p) => money(p?.total_amount), c: "num strong" },
                            { h: "Paid", r: (p) => money(p?.paid_amount), c: "num" },
                            { h: "Due", r: (p) => money(p?.due_amount), c: "num due" },
                            { h: "Status", r: (p) => <span className="rp-tag">{p?.payment_status || "—"}</span> },
                        ]}
                    />
                )}

                {/* PROFIT */}
                {tab === "profit" && (
                    <Table
                        title="Profit by product"
                        sub="Which products earn money and which lose it"
                        totalLabel="Net profit"
                        total={signedMoney(totalProfit)}
                        totalCls={totalProfit < 0 ? "neg" : "pos"}
                        stats={[
                            ["Earned", money(profitStats.gain), "pos"],
                            ["Lost", money(profitStats.loss), "neg"],
                            ["Products in profit", profitStats.winners],
                            ["Products in loss", profitStats.losers, profitStats.losers ? "neg" : ""],
                        ]}
                        rows={profit}
                        empty="No profit data in this period"
                        cols={[
                            { h: "Product", r: (i) => i?.product_name || "Unnamed product", c: "strong" },
                            { h: "Qty sold", r: (i) => i?.quantity_sold ?? 0, c: "num" },
                            { h: "Sales", r: (i) => money(i?.sales_value), c: "num" },
                            { h: "Cost", r: (i) => money(i?.purchase_value), c: "num" },
                            {
                                h: "Profit / loss",
                                r: (i) => signedMoney(i?.profit),
                                c: (i) => `num strong ${num(i?.profit) < 0 ? "neg" : num(i?.profit) > 0 ? "pos" : ""}`,
                            },
                            {
                                h: "Result",
                                r: (i) => {
                                    const v = num(i?.profit);
                                    return (
                                        <span className={`rp-tag ${v < 0 ? "bad" : v > 0 ? "good" : ""}`}>
                                            {v < 0 ? "Loss" : v > 0 ? "Profit" : "Break-even"}
                                        </span>
                                    );
                                },
                            },
                        ]}
                    />
                )}

                {/* STOCK */}
                {tab === "stock" && (
                    <Table
                        title="Stock"
                        sub={`${productCount} products tracked`}
                        totalLabel="Inventory value"
                        total={money(stockValue)}
                        stats={[
                            ["Total units", stockSummary?.total_stock || 0],
                            ["Products", productCount],
                            ["Running low", lowCount, lowCount ? "warn" : ""],
                            ["Out of stock", outCount, outCount ? "neg" : ""],
                        ]}
                        rows={stock}
                        empty="No products found"
                        cols={[
                            { h: "Product", r: (i) => i?.product_name || "Unnamed product", c: "strong" },
                            { h: "Category", r: (i) => i?.category || "Other" },
                            { h: "Stock", r: (i) => `${i?.stock ?? 0} ${i?.unit || "pcs"}`, c: "num strong" },
                            { h: "Minimum", r: (i) => i?.min_stock ?? 0, c: "num" },
                            { h: "Buy price", r: (i) => money(i?.purchase_price), c: "num" },
                            { h: "Stock value", r: (i) => money(i?.stock_value), c: "num strong" },
                            {
                                h: "Status",
                                r: (i) => {
                                    const st = stockStatus(i);
                                    return <span className={`rp-tag ${st.cls}`}>{st.text}</span>;
                                },
                            },
                        ]}
                    />
                )}

                <footer className="rp-foot">
                    {sales.length} sales · {purchases.length} purchases · {stock.length} products ·
                    Updated {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </footer>
            </div>
        </div>
    );
}

// =============================================================
// COMPONENTS
// =============================================================

function Kpi({ label, value, note }) {
    return (
        <div className="rp-kpi">
            <span>{label}</span>
            <strong>{value}</strong>
            <em>{note}</em>
        </div>
    );
}

function Panel({ title, aside, action, className = "", children }) {
    return (
        <section className={`rp-panel ${className}`}>
            <div className="rp-panel-head">
                <h2>{title}</h2>
                {aside}
                {action && (
                    <button className="rp-link" onClick={action[1]}>
                        {action[0]}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

function Empty({ title, text }) {
    return (
        <div className="rp-empty">
            <strong>{title}</strong>
            <span>{text}</span>
        </div>
    );
}

function Table({ title, sub, totalLabel, total, totalCls = "", stats, rows, cols, empty }) {
    return (
        <section className="rp-panel rp-table-panel">
            <div className="rp-table-head">
                <div>
                    <h2>{title}</h2>
                    <p>{sub}</p>
                </div>
                <div className="rp-total">
                    <span>{totalLabel}</span>
                    <strong className={totalCls}>{total}</strong>
                </div>
            </div>

            {stats && (
                <div className="rp-stats">
                    {stats.map(([l, v, c]) => (
                        <div key={l}>
                            <span>{l}</span>
                            <strong className={c || ""}>{v}</strong>
                        </div>
                    ))}
                </div>
            )}

            <div className="rp-scroll">
                <table>
                    <thead>
                        <tr>
                            {cols.map((c) => (
                                <th key={c.h} className={typeof c.c === "string" && c.c.includes("num") ? "num" : ""}>
                                    {c.h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={cols.length}>
                                    <Empty title={empty} text="Try a wider date range or record new transactions." />
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, i) => (
                                <tr key={row?.id || row?.product_id || i}>
                                    {cols.map((c) => (
                                        <td key={c.h} className={typeof c.c === "function" ? c.c(row) : c.c || ""}>
                                            {c.r(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function TrendChart({ data }) {
    const W = 1000;
    const H = 280;
    const pad = { t: 14, r: 16, b: 34, l: 64 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;

    const max = Math.max(...data.flatMap((d) => [d.sales, d.purchases]), 1);
    const x = (i) => pad.l + (i / (data.length - 1)) * cw;
    const y = (v) => pad.t + ch - (v / max) * ch;

    const line = (k) => data.map((d, i) => `${x(i)},${y(d[k])}`).join(" ");
    const area = `${pad.l},${pad.t + ch} ${line("sales")} ${pad.l + cw},${pad.t + ch}`;
    const step = Math.max(1, Math.ceil(data.length / 7));

    const sum = (k) => data.reduce((a, d) => a + d[k], 0);

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="rp-chart" role="img" aria-label="Sales and purchases over time">
                {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                    <g key={r}>
                        <line x1={pad.l} x2={W - pad.r} y1={y(max * r)} y2={y(max * r)} className="grid" />
                        <text x={pad.l - 10} y={y(max * r) + 4} textAnchor="end" className="ax">
                            {compact(max * r)}
                        </text>
                    </g>
                ))}

                <polygon points={area} className="area" />
                <polyline points={line("purchases")} className="ln buy" fill="none" />
                <polyline points={line("sales")} className="ln sales" fill="none" />

                {data.map((d, i) => (
                    <g key={d.key}>
                        {data.length <= 31 && <circle cx={x(i)} cy={y(d.sales)} r="3.5" className="pt sales" />}
                        {(i % step === 0 || i === data.length - 1) && (
                            <text x={x(i)} y={H - 10} textAnchor="middle" className="ax">
                                {d.label}
                            </text>
                        )}
                        <rect x={x(i) - cw / data.length / 2} y={pad.t} width={cw / data.length} height={ch} fill="transparent">
                            <title>{`${d.label}\nSales ${money(d.sales)}\nPurchases ${money(d.purchases)}`}</title>
                        </rect>
                    </g>
                ))}
            </svg>

            <div className="rp-chart-sum">
                <div><span>Sales</span><strong>{money(sum("sales"))}</strong></div>
                <div><span>Purchases</span><strong>{money(sum("purchases"))}</strong></div>
                <div><span>Difference</span><strong>{signedMoney(sum("sales") - sum("purchases"))}</strong></div>
            </div>
        </div>
    );
}

// =============================================================
// STYLES
// =============================================================

const css = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap");

.rp {
    --paper: #f2f4f0;
    --card: #ffffff;
    --ink: #17231d;
    --soft: #5c6a62;
    --faint: #8a968f;
    --line: #dfe4de;
    --turmeric: #f0b400;
    --leaf: #1d7a4b;
    --leaf-bg: #e3f2e9;
    --chili: #c4372c;
    --chili-bg: #fbe7e4;
    --amber-bg: #fdf1cf;
    --amber: #8a6200;
    --display: "Bricolage Grotesque", "Figtree", system-ui, sans-serif;
    --body: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;

    min-height: 100vh;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--body);
    font-size: 14px;
    line-height: 1.5;
    padding-bottom: 64px;
}
.rp *, .rp *::before, .rp *::after { box-sizing: border-box; }
.rp button, .rp input { font-family: inherit; }
.rp button:focus-visible, .rp input:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
.rp-wrap { width: min(1280px, calc(100% - 40px)); margin: 0 auto; padding-top: 32px; }

/* header */
.rp-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; }
.rp-head h1 { margin: 0; font-family: var(--display); font-size: 40px; line-height: 1; font-weight: 800; letter-spacing: -1.2px; }
.rp-head p { margin: 6px 0 0; color: var(--soft); font-size: 14px; }

.rp-btn { height: 40px; padding: 0 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
.rp-btn-ink { background: var(--ink); color: #fff; border: 0; }
.rp-btn-ink:hover { background: #26362d; }
.rp-btn-ink:disabled { opacity: .65; cursor: wait; }
.rp-btn-line { background: transparent; color: var(--ink); border: 1.5px solid var(--ink); }
.rp-btn-line:hover { background: var(--ink); color: #fff; }
.rp-spin { display: inline-block; animation: rp-rot .8s linear infinite; }

/* period */
.rp-period { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 14px; margin-bottom: 20px; }
.rp-seg { display: inline-flex; background: #e6eae4; border-radius: 10px; padding: 4px; gap: 2px; flex-wrap: wrap; }
.rp-seg button { border: 0; background: transparent; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; color: var(--soft); cursor: pointer; }
.rp-seg button:hover { color: var(--ink); }
.rp-seg button.on { background: var(--card); color: var(--ink); box-shadow: 0 1px 2px rgba(23,35,29,.15); }
.rp-custom { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
.rp-custom label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: var(--soft); }
.rp-custom input { height: 40px; padding: 0 10px; border: 1.5px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); font-size: 14px; }

.rp-error { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 20px; border-left: 4px solid var(--chili); background: var(--chili-bg); color: #7d211a; border-radius: 6px; font-weight: 500; }
.rp-error button { border: 0; background: none; font-size: 22px; line-height: 1; cursor: pointer; color: inherit; }

/* hero */
.rp-hero { display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; align-items: center; padding: 36px 40px; margin-bottom: 20px; background: var(--ink); color: #fff; border-radius: 20px; }
.rp-hero-label { font-family: var(--display); font-size: 20px; font-weight: 500; color: #b9c7be; }
.rp-hero-num { font-family: var(--display); font-weight: 800; font-size: clamp(44px, 6.5vw, 84px); line-height: 1; letter-spacing: -2.5px; color: var(--turmeric); margin: 6px 0 12px; font-variant-numeric: tabular-nums; }
.rp-hero-num.neg { color: #ff8a7e; }
.rp-hero-text p { margin: 0; color: #b9c7be; max-width: 44ch; font-size: 15px; }
.rp-hero-split-title { font-weight: 600; margin-bottom: 12px; font-size: 15px; }
.rp-split { display: flex; height: 44px; border-radius: 10px; overflow: hidden; background: #2a3a31; }
.rp-split .cost { background: #5b6f63; }
.rp-split .kept { background: var(--turmeric); }
.rp-split-key { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
.rp-split-key div { display: grid; grid-template-columns: 12px 1fr; column-gap: 8px; align-items: center; }
.rp-split-key i { width: 12px; height: 12px; border-radius: 3px; }
.rp-split-key i.cost { background: #5b6f63; }
.rp-split-key i.kept { background: var(--turmeric); }
.rp-split-key span { color: #b9c7be; font-size: 13px; }
.rp-split-key strong { grid-column: 2; font-family: var(--display); font-size: 22px; letter-spacing: -.4px; }

/* kpis */
.rp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); background: var(--card); border: 1px solid var(--line); border-radius: 14px; margin-bottom: 28px; }
.rp-kpi { padding: 20px 24px; display: flex; flex-direction: column; gap: 2px; border-right: 1px solid var(--line); min-width: 0; }
.rp-kpi:last-child { border-right: 0; }
.rp-kpi span { color: var(--soft); font-size: 13px; font-weight: 600; }
.rp-kpi strong { font-family: var(--display); font-size: clamp(20px, 2.1vw, 28px); font-weight: 700; letter-spacing: -.8px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.rp-kpi em { font-style: normal; color: var(--faint); font-size: 13px; }

/* tabs */
.rp-tabs { display: flex; gap: 28px; border-bottom: 1.5px solid var(--line); margin-bottom: 20px; overflow-x: auto; }
.rp-tabs button { border: 0; background: none; padding: 12px 0; font-size: 15px; font-weight: 600; color: var(--soft); cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -1.5px; white-space: nowrap; }
.rp-tabs button:hover { color: var(--ink); }
.rp-tabs button.on { color: var(--ink); border-bottom-color: var(--turmeric); }

/* panels */
.rp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.rp-panel { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 22px 24px; min-width: 0; }
.span-2 { grid-column: 1 / -1; }
.rp-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.rp-panel-head h2 { margin: 0; font-family: var(--display); font-size: 20px; font-weight: 700; letter-spacing: -.4px; }
.rp-link { border: 0; background: none; color: var(--leaf); font-weight: 700; font-size: 13px; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
.rp-link:hover { color: var(--ink); }

.rp-list { list-style: none; margin: 0; padding: 0; }
.rp-list li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--line); }
.rp-list li:last-child { border-bottom: 0; }
.rp-list-main, .rp-list-end { display: flex; flex-direction: column; min-width: 0; }
.rp-list-end { align-items: flex-end; flex: 0 0 auto; }
.rp-list-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.rp-list-main span, .rp-list-end span:not(.rp-tag) { color: var(--faint); font-size: 12px; }
.rp-list-end strong { font-variant-numeric: tabular-nums; font-weight: 700; }

.rp-bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.rp-bars li > div:first-child { display: flex; justify-content: space-between; gap: 12px; }
.rp-bars span { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rp-bars strong { font-variant-numeric: tabular-nums; font-weight: 700; flex: 0 0 auto; }
.rp-bars em { font-style: normal; color: var(--faint); font-weight: 500; margin-left: 6px; }
.rp-bar { height: 8px; background: #edf0eb; border-radius: 4px; margin-top: 7px; overflow: hidden; }
.rp-bar span { display: block; height: 100%; background: var(--ink); border-radius: 4px; }
.rp-bar span.pos { background: var(--leaf); }
.rp-bar span.neg { background: var(--chili); }

.pos { color: var(--leaf) !important; }
.neg { color: var(--chili) !important; }
.warn { color: var(--amber) !important; }

.rp-tag { display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: 12px; font-weight: 600; background: #edf0eb; color: var(--soft); text-transform: capitalize; }
.rp-tag.good { background: var(--leaf-bg); color: var(--leaf); }
.rp-tag.bad { background: var(--chili-bg); color: var(--chili); }
.rp-tag.warn { background: var(--amber-bg); color: var(--amber) !important; }

/* chart */
.rp-legend { display: flex; gap: 16px; margin-left: auto; color: var(--soft); font-weight: 600; font-size: 13px; }
.rp-legend span { display: inline-flex; align-items: center; gap: 6px; }
.rp-legend i { width: 14px; height: 4px; border-radius: 2px; }
.l-sales { background: var(--leaf); }
.l-buy { background: var(--turmeric); }
.rp-chart { display: block; width: 100%; height: auto; max-height: 320px; }
.rp-chart .grid { stroke: var(--line); stroke-dasharray: 3 5; }
.rp-chart .ax { fill: var(--faint); font-size: 12px; font-family: var(--body); }
.rp-chart .area { fill: rgba(29,122,75,.10); }
.rp-chart .ln { stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; }
.rp-chart .ln.sales { stroke: var(--leaf); }
.rp-chart .ln.buy { stroke: var(--turmeric); }
.rp-chart .pt.sales { fill: var(--leaf); stroke: #fff; stroke-width: 2; }
.rp-chart-sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; padding-top: 14px; border-top: 1px solid var(--line); }
.rp-chart-sum span { display: block; color: var(--soft); font-size: 13px; }
.rp-chart-sum strong { font-family: var(--display); font-size: 18px; font-variant-numeric: tabular-nums; }

/* empty */
.rp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 160px; padding: 20px; gap: 4px; }
.rp-empty strong { font-weight: 700; }
.rp-empty span { color: var(--faint); max-width: 36ch; }

/* tables */
.rp-table-panel { padding: 0; overflow: hidden; }
.rp-table-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 24px; }
.rp-table-head h2 { margin: 0; font-family: var(--display); font-size: 26px; font-weight: 800; letter-spacing: -.8px; }
.rp-table-head p { margin: 4px 0 0; color: var(--soft); }
.rp-total { text-align: right; }
.rp-total span { display: block; color: var(--soft); font-size: 13px; font-weight: 600; }
.rp-total strong { font-family: var(--display); font-size: 26px; letter-spacing: -.6px; font-variant-numeric: tabular-nums; }
.rp-stats { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line); background: #f8faf7; }
.rp-stats div { padding: 14px 24px; border-right: 1px solid var(--line); }
.rp-stats div:last-child { border-right: 0; }
.rp-stats span { display: block; color: var(--soft); font-size: 13px; }
.rp-stats strong { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
.rp-scroll { overflow-x: auto; border-top: 1px solid var(--line); }
.rp table { width: 100%; min-width: 760px; border-collapse: collapse; }
.rp th { text-align: left; padding: 12px 24px; font-size: 13px; font-weight: 700; color: var(--soft); background: #f8faf7; border-bottom: 1px solid var(--line); white-space: nowrap; }
.rp td { padding: 13px 24px; border-bottom: 1px solid var(--line); white-space: nowrap; color: var(--ink); }
.rp tbody tr:hover td { background: #fbfcfa; }
.rp tbody tr:last-child td { border-bottom: 0; }
.rp th.num, .rp td.num { text-align: right; font-variant-numeric: tabular-nums; }
.rp td.strong { font-weight: 700; }
.rp td.id { font-family: ui-monospace, Menlo, monospace; font-size: 13px; color: var(--leaf); font-weight: 600; }
.rp td.due { color: var(--chili); font-weight: 600; }
.rp td .rp-empty { min-height: 200px; white-space: normal; }

.rp-foot { margin-top: 24px; color: var(--faint); font-size: 13px; }

/* loading */
.rp-loading { min-height: 70vh; display: flex; align-items: center; justify-content: center; gap: 16px; }
.rp-loading strong { display: block; font-family: var(--display); font-size: 18px; }
.rp-loading span:not(.rp-spinner) { color: var(--soft); }
.rp-spinner { width: 34px; height: 34px; border-radius: 50%; border: 4px solid var(--line); border-top-color: var(--turmeric); animation: rp-rot .8s linear infinite; }

@keyframes rp-rot { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .rp-spin, .rp-spinner { animation-duration: 3s; } }

/* responsive */
@media (max-width: 960px) {
    .rp-hero { grid-template-columns: 1fr; padding: 28px; }
    .rp-grid { grid-template-columns: 1fr; }
    .rp-kpis { grid-template-columns: repeat(2, 1fr); }
    .rp-kpi:nth-child(2) { border-right: 0; }
    .rp-kpi:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
    .rp-stats { grid-template-columns: repeat(2, 1fr); }
    .rp-stats div:nth-child(2) { border-right: 0; }
    .rp-stats div:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
}
@media (max-width: 600px) {
    .rp-wrap { width: calc(100% - 24px); padding-top: 18px; }
    .rp-head h1 { font-size: 32px; }
    .rp-custom { width: 100%; }
    .rp-custom label { flex: 1; }
    .rp-custom input { width: 100%; }
    .rp-hero { padding: 24px 20px; border-radius: 16px; }
    .rp-panel { padding: 18px; }
    .rp-table-head { flex-direction: column; padding: 18px; }
    .rp-total { text-align: left; }
    .rp-chart-sum { grid-template-columns: 1fr; }
    .rp-tabs { gap: 20px; }
}
`;