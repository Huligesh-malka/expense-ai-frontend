import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

import {
    FiArrowLeft,
    FiRefreshCw,
    FiZap,
    FiTrendingUp,
    FiTrendingDown,
    FiDollarSign,
    FiPackage,
    FiUsers,
    FiTruck,
    FiShoppingCart,
    FiAlertTriangle,
    FiCheckCircle,
    FiTarget,
    FiBarChart2,
    FiActivity,
    FiCalendar,
    FiCreditCard,
    FiLayers,
    FiClock,
    FiShield,
    FiAward,
    FiSearch,
} from "react-icons/fi";


// ============================================================
// AI BUSINESS ENGINE
// ============================================================

export default function AIBusiness() {

    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // ========================================================
    // LOAD REAL BUSINESS ANALYTICS
    // ========================================================

    const loadBusinessAnalytics = async (refresh = false) => {

        try {

            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            // IMPORTANT:
            // Do NOT send business_id from frontend.
            // Backend gets req.businessId from middleware.

            const response = await API.get(
                "/ai-business/analytics"
            );

            if (!response?.data?.success) {

                throw new Error(
                    response?.data?.message ||
                    "Failed to load business analytics"
                );
            }

            setData(response.data.data || {});

        } catch (err) {

            console.error(
                "AI Business Engine Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load AI business data."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }
    };


    useEffect(() => {

        loadBusinessAnalytics();

    }, []);


    // ========================================================
    // FORMATTERS
    // ========================================================

    const money = (value) => {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "₹0";
        }

        return `₹${number.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )}`;
    };


    const number = (value) => {

        const n = Number(value);

        if (!Number.isFinite(n)) {
            return 0;
        }

        return n;
    };


    const percent = (value) => {

        const n = Number(value);

        if (!Number.isFinite(n)) {
            return "0%";
        }

        return `${n.toFixed(1)}%`;
    };


    const dateText = (value) => {

        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ========================================================
    // NORMALIZE BACKEND DATA
    // ========================================================

    const analytics = data || {};

    const business =
        analytics.business || {};

    const sales =
        analytics.sales || {};

    const inventory =
        analytics.inventory || {};

    const products =
        analytics.products || {};

    const customers =
        analytics.customers || {};

    const suppliers =
        analytics.suppliers || {};

    const purchases =
        analytics.purchases || {};

    const categories =
        Array.isArray(analytics.categories)
            ? analytics.categories
            : [];

    const payments =
        Array.isArray(analytics.payments)
            ? analytics.payments
            : [];

    const dailySales =
        Array.isArray(analytics.daily_sales)
            ? analytics.daily_sales
            : [];


    // ========================================================
    // SALES DATA
    // ========================================================

    const todaySales =
        sales.today || {};

    const currentMonth =
        sales.current_month || {};

    const previousMonth =
        sales.previous_month || {};

    const salesGrowth =
        number(
            sales.growth_percent ??
            sales.growth ??
            0
        );


    // ========================================================
    // CALCULATED VALUES
    // ========================================================

    const inventoryProfit =
        number(
            inventory.potential_profit
        );

    const inventoryMargin =
        number(
            inventory.potential_margin
        );

    const totalRevenue =
        number(
            currentMonth.revenue
        );

    const previousRevenue =
        number(
            previousMonth.revenue
        );

    const revenueDifference =
        totalRevenue -
        previousRevenue;


    const averageDailySales = useMemo(() => {

        if (!dailySales.length) {
            return 0;
        }

        const total = dailySales.reduce(
            (sum, item) =>
                sum + number(
                    item.revenue
                ),
            0
        );

        return total / dailySales.length;

    }, [dailySales]);


    const estimatedMonthlyRunRate =
        averageDailySales * 30;


    // ========================================================
    // PRODUCTS
    // ========================================================

    const topSellingProducts =
        Array.isArray(products.top_selling)
            ? products.top_selling
            : [];

    const highMarginProducts =
        Array.isArray(products.high_margin)
            ? products.high_margin
            : [];

    const lowMarginProducts =
        Array.isArray(products.low_margin)
            ? products.low_margin
            : [];


    // ========================================================
    // CUSTOMERS
    // ========================================================

    const topCustomers =
        Array.isArray(customers.top_customers)
            ? customers.top_customers
            : [];


    // ========================================================
    // AI BUSINESS INSIGHTS
    // ========================================================

    const insights = useMemo(() => {

        const result = [];

        // Sales
        if (salesGrowth > 10) {

            result.push({
                type: "positive",
                title: "Sales are growing",
                text:
                    `Current month revenue is growing by ${salesGrowth.toFixed(1)}% compared with the previous month.`
            });

        } else if (salesGrowth < -10) {

            result.push({
                type: "danger",
                title: "Sales are declining",
                text:
                    `Sales have decreased by ${Math.abs(salesGrowth).toFixed(1)}%. Review products, pricing and customer activity.`
            });

        } else {

            result.push({
                type: "neutral",
                title: "Sales are relatively stable",
                text:
                    "There is no major sales movement compared with the previous month."
            });

        }


        // Low stock
        if (
            number(inventory.low_stock_count) > 0
        ) {

            result.push({
                type: "warning",
                title: "Inventory needs attention",
                text:
                    `${number(inventory.low_stock_count)} products are below their minimum stock level.`
            });

        }


        // Dead stock
        if (
            number(inventory.dead_stock_count) > 0
        ) {

            result.push({
                type: "warning",
                title: "Dead stock detected",
                text:
                    `${number(inventory.dead_stock_count)} products have weak movement and should be reviewed.`
            });

        }


        // Margin
        if (
            inventoryMargin > 0 &&
            inventoryMargin < 15
        ) {

            result.push({
                type: "danger",
                title: "Inventory margin is low",
                text:
                    `Potential inventory margin is approximately ${inventoryMargin.toFixed(1)}%.`
            });

        }


        // Customers
        if (
            number(customers.inactive_60_days) > 0
        ) {

            result.push({
                type: "warning",
                title: "Inactive customers",
                text:
                    `${number(customers.inactive_60_days)} customers have not purchased for 60+ days.`
            });

        }


        // Profit
        if (inventoryProfit > 0) {

            result.push({
                type: "positive",
                title: "Inventory profit opportunity",
                text:
                    `Current inventory has approximately ${money(inventoryProfit)} potential gross profit at current selling prices.`
            });

        }

        return result;

    }, [
        salesGrowth,
        inventory,
        customers,
        inventoryProfit,
        inventoryMargin
    ]);


    // ========================================================
    // ACTION PLAN
    // ========================================================

    const actionPlan = useMemo(() => {

        const actions = [];

        if (
            number(inventory.out_of_stock_count) > 0
        ) {

            actions.push({
                priority: "HIGH",
                title: "Restock out-of-stock products",
                text:
                    `${number(inventory.out_of_stock_count)} products currently have no stock.`
            });

        }


        if (
            number(inventory.low_stock_count) > 0
        ) {

            actions.push({
                priority: "HIGH",
                title: "Review low-stock products",
                text:
                    "Reorder products that are below their minimum stock level."
            });

        }


        if (
            number(inventory.dead_stock_count) > 0
        ) {

            actions.push({
                priority: "MEDIUM",
                title: "Create offers for dead stock",
                text:
                    "Use discounts, bundles or promotions to move slow products."
            });

        }


        if (
            number(customers.inactive_60_days) > 0
        ) {

            actions.push({
                priority: "MEDIUM",
                title: "Reactivate inactive customers",
                text:
                    "Send targeted offers to customers who have not purchased recently."
            });

        }


        if (
            lowMarginProducts.length > 0
        ) {

            actions.push({
                priority: "MEDIUM",
                title: "Review low-margin products",
                text:
                    "Check purchasing cost and selling price for products with weak margins."
            });

        }


        if (
            topSellingProducts.length > 0
        ) {

            actions.push({
                priority: "HIGH",
                title: "Protect your best sellers",
                text:
                    "Keep your highest-selling products in stock and prominently promoted."
            });

        }


        if (!actions.length) {

            actions.push({
                priority: "LOW",
                title: "Continue monitoring",
                text:
                    "The business currently has no major automated action detected."
            });

        }

        return actions;

    }, [
        inventory,
        customers,
        lowMarginProducts,
        topSellingProducts
    ]);


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div style={styles.loadingPage}>

                <div style={styles.loadingIcon}>
                    <FiZap size={34} />
                </div>

                <h2 style={styles.loadingTitle}>
                    AI Business Engine
                </h2>

                <p style={styles.loadingText}>
                    Analyzing your business data...
                </p>

                <div style={styles.spinner}></div>

            </div>
        );
    }


    // ========================================================
    // ERROR
    // ========================================================

    if (error && !data) {

        return (
            <div style={styles.loadingPage}>

                <div style={styles.errorLargeIcon}>
                    <FiAlertTriangle size={32} />
                </div>

                <h2 style={styles.loadingTitle}>
                    Unable to load business data
                </h2>

                <p style={styles.loadingText}>
                    {error}
                </p>

                <button
                    onClick={() =>
                        loadBusinessAnalytics()
                    }
                    style={styles.retryButton}
                >
                    <FiRefreshCw size={17} />
                    Try Again
                </button>

            </div>
        );
    }


    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div style={styles.page}>

            {/* =================================================
                HEADER
            ================================================= */}

            <header style={styles.header}>

                <div style={styles.headerLeft}>

                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        style={styles.backButton}
                    >
                        <FiArrowLeft size={18} />
                        Dashboard
                    </button>

                    <div style={styles.heading}>

                        <div style={styles.headingIcon}>
                            <FiZap size={25} />
                        </div>

                        <div>

                            <h1 style={styles.title}>
                                AI Business Engine
                            </h1>

                            <p style={styles.subtitle}>
                                Business intelligence and strategy center
                            </p>

                        </div>

                    </div>

                </div>


                <button
                    onClick={() =>
                        loadBusinessAnalytics(true)
                    }
                    disabled={refreshing}
                    style={{
                        ...styles.refreshButton,
                        opacity:
                            refreshing ? 0.65 : 1
                    }}
                >

                    <FiRefreshCw
                        size={17}
                        style={{
                            animation:
                                refreshing
                                    ? "spin 1s linear infinite"
                                    : "none"
                        }}
                    />

                    {refreshing
                        ? "Analyzing..."
                        : "Refresh Analysis"}

                </button>

            </header>


            {/* =================================================
                BUSINESS BANNER
            ================================================= */}

            <section style={styles.hero}>

                <div>

                    <div style={styles.heroLabel}>
                        AI BUSINESS INTELLIGENCE
                    </div>

                    <h2 style={styles.heroTitle}>
                        {business.business_name ||
                            "Your Business"}
                    </h2>

                    <p style={styles.heroText}>

                        {business.business_type
                            ? `${business.business_type} business intelligence`
                            : "Your complete business performance analysis"}

                        {business.city
                            ? ` • ${business.city}`
                            : ""}

                        {business.state
                            ? `, ${business.state}`
                            : ""}

                    </p>

                </div>


                <div style={styles.aiActive}>

                    <FiZap size={25} />

                    <span>
                        AI ENGINE ACTIVE
                    </span>

                </div>

            </section>


            {/* =================================================
                ERROR NOTICE
            ================================================= */}

            {error && (

                <div style={styles.errorBar}>

                    <FiAlertTriangle size={19} />

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            loadBusinessAnalytics(true)
                        }
                        style={styles.smallRetry}
                    >
                        Retry
                    </button>

                </div>

            )}


            {/* =================================================
                BUSINESS HEALTH
            ================================================= */}

            <Section
                icon={<FiActivity />}
                title="Business Health"
                text="Live performance from your business database"
            />


            <div style={styles.metricGrid}>

                <Metric
                    icon={<FiDollarSign />}
                    title="Current Month Sales"
                    value={money(currentMonth.revenue)}
                    description={`${number(currentMonth.orders)} orders`}
                    type="green"
                />

                <Metric
                    icon={<FiTrendingUp />}
                    title="Sales Growth"
                    value={percent(salesGrowth)}
                    description="Compared with previous month"
                    type={
                        salesGrowth >= 0
                            ? "blue"
                            : "red"
                    }
                />

                <Metric
                    icon={<FiPackage />}
                    title="Total Products"
                    value={number(
                        inventory.total_products
                    ).toLocaleString("en-IN")}
                    description={`${number(inventory.active_products)} active`}
                    type="purple"
                />

                <Metric
                    icon={<FiUsers />}
                    title="Customers"
                    value={number(
                        customers.total
                    ).toLocaleString("en-IN")}
                    description={`${number(customers.inactive_60_days)} inactive 60+ days`}
                    type="pink"
                />

            </div>


            {/* =================================================
                SALES INTELLIGENCE
            ================================================= */}

            <Section
                icon={<FiBarChart2 />}
                title="Sales Intelligence"
                text="Understand your current revenue performance"
            />


            <div style={styles.twoColumns}>

                <Panel
                    title="Sales Performance"
                    icon={<FiTrendingUp />}
                >

                    <Row
                        label="Today Revenue"
                        value={money(
                            todaySales.revenue
                        )}
                    />

                    <Row
                        label="Today Orders"
                        value={number(
                            todaySales.orders
                        )}
                    />

                    <Row
                        label="Current Month Revenue"
                        value={money(
                            currentMonth.revenue
                        )}
                    />

                    <Row
                        label="Current Month Orders"
                        value={number(
                            currentMonth.orders
                        )}
                    />

                    <Row
                        label="Previous Month Revenue"
                        value={money(
                            previousMonth.revenue
                        )}
                    />

                    <Row
                        label="Average Order Value"
                        value={money(
                            currentMonth.aov
                        )}
                    />

                    <Row
                        label="Revenue Difference"
                        value={
                            revenueDifference >= 0
                                ? `+${money(
                                    revenueDifference
                                )}`
                                : `-${money(
                                    Math.abs(
                                        revenueDifference
                                    )
                                )}`
                        }
                    />

                </Panel>


                <Panel
                    title="AI Sales Assessment"
                    icon={<FiZap />}
                >

                    <InsightBox
                        type={
                            salesGrowth > 0
                                ? "positive"
                                : salesGrowth < 0
                                    ? "danger"
                                    : "neutral"
                        }
                        title={
                            salesGrowth > 0
                                ? "Growth opportunity"
                                : salesGrowth < 0
                                    ? "Sales attention required"
                                    : "Stable sales"
                        }
                        text={
                            salesGrowth > 0
                                ? `Revenue is currently ${salesGrowth.toFixed(1)}% higher than the previous month. Protect your best-selling products and increase promotion around products that already have demand.`
                                : salesGrowth < 0
                                    ? `Revenue is currently ${Math.abs(salesGrowth).toFixed(1)}% lower than the previous month. Review product performance, customer activity and pricing before increasing inventory.`
                                    : "Sales are currently stable. Continue monitoring the next sales period for a clear growth or decline pattern."
                        }
                    />

                    <div style={styles.miniStats}>

                        <MiniStat
                            label="Today"
                            value={money(
                                todaySales.revenue
                            )}
                        />

                        <MiniStat
                            label="This Month"
                            value={money(
                                currentMonth.revenue
                            )}
                        />

                        <MiniStat
                            label="Previous"
                            value={money(
                                previousMonth.revenue
                            )}
                        />

                    </div>

                </Panel>

            </div>


            {/* =================================================
                INVENTORY INTELLIGENCE
            ================================================= */}

            <Section
                icon={<FiPackage />}
                title="Inventory Intelligence"
                text="Identify stock risks and purchasing opportunities"
            />


            <div style={styles.metricGrid}>

                <Metric
                    icon={<FiPackage />}
                    title="Total Stock"
                    value={number(
                        inventory.total_stock
                    ).toLocaleString("en-IN")}
                    description="Units currently available"
                    type="blue"
                />

                <Metric
                    icon={<FiAlertTriangle />}
                    title="Low Stock"
                    value={number(
                        inventory.low_stock_count
                    )}
                    description="Below minimum stock"
                    type="orange"
                />

                <Metric
                    icon={<FiShield />}
                    title="Out of Stock"
                    value={number(
                        inventory.out_of_stock_count
                    )}
                    description="Products with zero stock"
                    type="red"
                />

                <Metric
                    icon={<FiClock />}
                    title="Dead Stock"
                    value={number(
                        inventory.dead_stock_count
                    )}
                    description="Slow/no movement"
                    type="gray"
                />

                <Metric
                    icon={<FiTrendingDown />}
                    title="Overstock"
                    value={number(
                        inventory.overstock_count
                    )}
                    description="Excess stock"
                    type="purple"
                />

                <Metric
                    icon={<FiDollarSign />}
                    title="Inventory Cost"
                    value={money(
                        inventory.purchase_value
                    )}
                    description="Current purchase value"
                    type="blue"
                />

                <Metric
                    icon={<FiDollarSign />}
                    title="Selling Value"
                    value={money(
                        inventory.selling_value
                    )}
                    description="Current selling value"
                    type="green"
                />

                <Metric
                    icon={<FiTrendingUp />}
                    title="Potential Profit"
                    value={money(
                        inventory.potential_profit
                    )}
                    description={`${percent(inventoryMargin)} potential margin`}
                    type="green"
                />

            </div>


            {/* =================================================
                INVENTORY ACTIONS
            ================================================= */}

            <div style={styles.threeColumns}>

                <ActionPanel
                    icon={<FiShoppingCart />}
                    title="Restock"
                    value={number(
                        inventory.low_stock_count
                    )}
                    text="Products need stock attention"
                    type="orange"
                />

                <ActionPanel
                    icon={<FiTrendingDown />}
                    title="Reduce / Promote"
                    value={
                        number(
                            inventory.dead_stock_count
                        ) +
                        number(
                            inventory.overstock_count
                        )
                    }
                    text="Products that need movement"
                    type="purple"
                />

                <ActionPanel
                    icon={<FiShield />}
                    title="Stock Risk"
                    value={number(
                        inventory.out_of_stock_count
                    )}
                    text="Products currently unavailable"
                    type="red"
                />

            </div>


            {/* =================================================
                TOP SELLING PRODUCTS
            ================================================= */}

            <Section
                icon={<FiAward />}
                title="Product Intelligence"
                text="Products that are important for revenue and margin"
            />


            <div style={styles.twoColumns}>

                <ProductPanel
                    title="Top Selling Products"
                    icon={<FiTrendingUp />}
                    products={topSellingProducts}
                    mode="sales"
                />

                <ProductPanel
                    title="High Margin Products"
                    icon={<FiAward />}
                    products={highMarginProducts}
                    mode="margin"
                />

            </div>


            <div style={styles.singlePanel}>

                <ProductPanel
                    title="Low Margin Products"
                    icon={<FiTrendingDown />}
                    products={lowMarginProducts}
                    mode="margin"
                    danger
                />

            </div>


            {/* =================================================
                CUSTOMER INTELLIGENCE
            ================================================= */}

            <Section
                icon={<FiUsers />}
                title="Customer Intelligence"
                text="Understand customer value and retention opportunities"
            />


            <div style={styles.metricGrid}>

                <Metric
                    icon={<FiUsers />}
                    title="Total Customers"
                    value={number(
                        customers.total
                    ).toLocaleString("en-IN")}
                    description="Customers registered"
                    type="pink"
                />

                <Metric
                    icon={<FiShoppingCart />}
                    title="Customer Orders"
                    value={number(
                        customers.total_orders
                    ).toLocaleString("en-IN")}
                    description="Total customer orders"
                    type="blue"
                />

                <Metric
                    icon={<FiDollarSign />}
                    title="Customer Spend"
                    value={money(
                        customers.total_spent
                    )}
                    description="Total customer spending"
                    type="green"
                />

                <Metric
                    icon={<FiAward />}
                    title="Average Customer Value"
                    value={money(
                        customers.avg_customer_value
                    )}
                    description="Average spend per customer"
                    type="purple"
                />

                <Metric
                    icon={<FiClock />}
                    title="Inactive 60+ Days"
                    value={number(
                        customers.inactive_60_days
                    )}
                    description="Customers to reactivate"
                    type="orange"
                />

            </div>


            {/* =================================================
                TOP CUSTOMERS
            ================================================= */}

            <div style={styles.singlePanel}>

                <CustomerPanel
                    customers={topCustomers}
                />

            </div>


            {/* =================================================
                SUPPLIER INTELLIGENCE
            ================================================= */}

            <Section
                icon={<FiTruck />}
                title="Supplier Intelligence"
                text="Understand your supplier base"
            />


            <div style={styles.metricGrid}>

                <Metric
                    icon={<FiTruck />}
                    title="Total Suppliers"
                    value={number(
                        suppliers.total
                    )}
                    description="Registered suppliers"
                    type="blue"
                />

                <Metric
                    icon={<FiCheckCircle />}
                    title="Active Suppliers"
                    value={number(
                        suppliers.active
                    )}
                    description="Currently active"
                    type="green"
                />

                <Metric
                    icon={<FiAlertTriangle />}
                    title="Inactive Suppliers"
                    value={number(
                        suppliers.inactive
                    )}
                    description="Need review"
                    type="orange"
                />

            </div>


            {/* =================================================
                PURCHASE INTELLIGENCE
            ================================================= */}

            <Section
                icon={<FiShoppingCart />}
                title="Purchase Intelligence"
                text="Understand purchasing cost and supplier obligations"
            />


            <div style={styles.metricGrid}>

                <Metric
                    icon={<FiShoppingCart />}
                    title="Total Purchases"
                    value={number(
                        purchases.total
                    )}
                    description="Purchase transactions"
                    type="blue"
                />

                <Metric
                    icon={<FiDollarSign />}
                    title="Purchase Value"
                    value={money(
                        purchases.total_value
                    )}
                    description="Total purchase amount"
                    type="purple"
                />

                <Metric
                    icon={<FiCheckCircle />}
                    title="Paid"
                    value={money(
                        purchases.total_paid
                    )}
                    description="Amount paid"
                    type="green"
                />

                <Metric
                    icon={<FiAlertTriangle />}
                    title="Due"
                    value={money(
                        purchases.total_due
                    )}
                    description="Outstanding purchase amount"
                    type="red"
                />

                <Metric
                    icon={<FiBarChart2 />}
                    title="Average Purchase"
                    value={money(
                        purchases.avg_purchase_value
                    )}
                    description="Average purchase value"
                    type="blue"
                />

            </div>


            {/* =================================================
                CATEGORY PERFORMANCE
            ================================================= */}

            <Section
                icon={<FiLayers />}
                title="Category Performance"
                text="Recent category sales performance"
            />


            <div style={styles.singlePanel}>

                {categories.length === 0 ? (

                    <EmptyState
                        text="No category sales data available."
                    />

                ) : (

                    <div style={styles.tableWrapper}>

                        <table style={styles.table}>

                            <thead>

                                <tr>

                                    <th style={styles.th}>
                                        Category
                                    </th>

                                    <th style={styles.th}>
                                        Units Sold
                                    </th>

                                    <th style={styles.th}>
                                        Revenue
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {categories.map(
                                    (category, index) => (

                                        <tr key={index}>

                                            <td style={styles.td}>
                                                {category.category ||
                                                    category.name ||
                                                    "Unknown"}
                                            </td>

                                            <td style={styles.td}>
                                                {number(
                                                    category.units_sold ??
                                                    category.units
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td style={styles.tdStrong}>
                                                {money(
                                                    category.revenue
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                PAYMENT INTELLIGENCE
            ================================================= */}

            <Section
                icon={<FiCreditCard />}
                title="Payment Intelligence"
                text="Understand how customers are paying"
            />


            <div style={styles.paymentGrid}>

                {payments.length === 0 ? (

                    <EmptyState
                        text="No payment data available."
                    />

                ) : (

                    payments.map(
                        (payment, index) => (

                            <div
                                key={index}
                                style={styles.paymentCard}
                            >

                                <div style={styles.paymentIcon}>
                                    <FiCreditCard />
                                </div>

                                <div>

                                    <div style={styles.paymentName}>
                                        {payment.payment_method ||
                                            payment.method ||
                                            "Other"}
                                    </div>

                                    <div style={styles.paymentOrders}>
                                        {number(
                                            payment.orders
                                        )} orders
                                    </div>

                                </div>

                                <strong
                                    style={styles.paymentAmount}
                                >
                                    {money(
                                        payment.revenue
                                    )}
                                </strong>

                            </div>

                        )
                    )

                )}

            </div>


            {/* =================================================
                30 DAY SALES
            ================================================= */}

            <Section
                icon={<FiCalendar />}
                title="Sales Activity"
                text="Recent daily revenue activity"
            />


            <div style={styles.singlePanel}>

                {dailySales.length === 0 ? (

                    <EmptyState
                        text="No recent daily sales data available."
                    />

                ) : (

                    <div style={styles.dailyGrid}>

                        {dailySales
                            .slice(-14)
                            .map(
                                (day, index) => (

                                    <div
                                        key={index}
                                        style={styles.dailyCard}
                                    >

                                        <div style={styles.dailyDate}>
                                            {dateText(
                                                day.date
                                            )}
                                        </div>

                                        <div style={styles.dailyRevenue}>
                                            {money(
                                                day.revenue
                                            )}
                                        </div>

                                        <div style={styles.dailyOrders}>
                                            {number(
                                                day.orders
                                            )} orders
                                        </div>

                                    </div>

                                )
                            )}

                    </div>

                )}

            </div>


            {/* =================================================
                AI BUSINESS INSIGHTS
            ================================================= */}

            <Section
                icon={<FiZap />}
                title="AI Business Insights"
                text="Automatically generated from your real business data"
            />


            <div style={styles.insightGrid}>

                {insights.map(
                    (item, index) => (

                        <InsightBox
                            key={index}
                            type={item.type}
                            title={item.title}
                            text={item.text}
                        />

                    )
                )}

            </div>


            {/* =================================================
                AI ACTION PLAN
            ================================================= */}

            <Section
                icon={<FiTarget />}
                title="AI Action Plan"
                text="Recommended priorities based on your current numbers"
            />


            <div style={styles.actionPlan}>

                {actionPlan.map(
                    (action, index) => (

                        <div
                            key={index}
                            style={styles.actionRow}
                        >

                            <div
                                style={{
                                    ...styles.priority,
                                    ...getPriorityStyle(
                                        action.priority
                                    )
                                }}
                            >
                                {action.priority}
                            </div>

                            <div style={styles.actionContent}>

                                <div style={styles.actionTitle}>
                                    {action.title}
                                </div>

                                <div style={styles.actionText}>
                                    {action.text}
                                </div>

                            </div>

                            <FiCheckCircle
                                size={20}
                                style={{
                                    color: "#16a34a"
                                }}
                            />

                        </div>

                    )
                )}

            </div>


            {/* =================================================
                BUSINESS STRATEGY
            ================================================= */}

            <Section
                icon={<FiTarget />}
                title="Business Strategy"
                text="Practical direction based on current business performance"
            />


            <div style={styles.strategyGrid}>

                <Strategy
                    icon={<FiZap />}
                    title="Today"
                    text={
                        number(
                            inventory.out_of_stock_count
                        ) > 0
                            ? "First priority: review unavailable products and prevent lost sales."
                            : "Review today's sales and focus attention on your strongest products."
                    }
                />

                <Strategy
                    icon={<FiPackage />}
                    title="This Week"
                    text={
                        number(
                            inventory.low_stock_count
                        ) > 0
                            ? "Reorder important low-stock products and avoid stock interruptions."
                            : "Maintain healthy stock levels and monitor products with changing demand."
                    }
                />

                <Strategy
                    icon={<FiUsers />}
                    title="This Month"
                    text={
                        number(
                            customers.inactive_60_days
                        ) > 0
                            ? "Run a customer reactivation campaign for inactive customers."
                            : "Increase repeat purchases from existing customers."
                    }
                />

                <Strategy
                    icon={<FiTrendingUp />}
                    title="Growth"
                    text={
                        topSellingProducts.length > 0
                            ? "Protect best sellers, improve their availability and use them to drive additional sales."
                            : "Build more sales history so the engine can identify stronger product trends."
                    }
                />

            </div>


            {/* =================================================
                FINAL BUSINESS SUMMARY
            ================================================= */}

            <div style={styles.finalBanner}>

                <div style={styles.finalIcon}>
                    <FiZap size={26} />
                </div>

                <div style={{ flex: 1 }}>

                    <div style={styles.finalTitle}>
                        AI Business Engine
                    </div>

                    <div style={styles.finalText}>
                        The engine is using your actual sales,
                        products, inventory, customers,
                        suppliers and purchase data to identify
                        business opportunities and risks.
                    </div>

                </div>

                <button
                    onClick={() =>
                        loadBusinessAnalytics(true)
                    }
                    style={styles.finalButton}
                >
                    <FiRefreshCw size={16} />
                    Update Analysis
                </button>

            </div>


            {/* =================================================
                INTERNAL CSS
            ================================================= */}

            <style>
                {`

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }

                * {
                    box-sizing: border-box;
                }

                @media (max-width: 1000px) {

                    .ai-two-columns {
                        grid-template-columns: 1fr !important;
                    }

                }

                @media (max-width: 700px) {

                    .ai-page {
                        padding: 15px !important;
                    }

                }

                `}
            </style>

        </div>
    );
}


// ============================================================
// SECTION
// ============================================================

function Section({
    icon,
    title,
    text
}) {

    return (

        <div style={styles.section}>

            <div style={styles.sectionIcon}>
                {icon}
            </div>

            <div>

                <h2 style={styles.sectionTitle}>
                    {title}
                </h2>

                <p style={styles.sectionText}>
                    {text}
                </p>

            </div>

        </div>
    );
}


// ============================================================
// METRIC
// ============================================================

function Metric({
    icon,
    title,
    value,
    description,
    type = "blue"
}) {

    const theme =
        getTheme(type);

    return (

        <div
            style={{
                ...styles.metric,
                borderTop:
                    `3px solid ${theme.main}`
            }}
        >

            <div
                style={{
                    ...styles.metricIcon,
                    background:
                        theme.background,
                    color:
                        theme.main
                }}
            >
                {icon}
            </div>

            <div style={styles.metricTitle}>
                {title}
            </div>

            <div style={styles.metricValue}>
                {value}
            </div>

            <div style={styles.metricDescription}>
                {description}
            </div>

        </div>
    );
}


// ============================================================
// PANEL
// ============================================================

function Panel({
    icon,
    title,
    children
}) {

    return (

        <div style={styles.panel}>

            <div style={styles.panelHeader}>

                <div style={styles.panelIcon}>
                    {icon}
                </div>

                <h3 style={styles.panelTitle}>
                    {title}
                </h3>

            </div>

            {children}

        </div>
    );
}


// ============================================================
// ROW
// ============================================================

function Row({
    label,
    value
}) {

    return (

        <div style={styles.row}>

            <span style={styles.rowLabel}>
                {label}
            </span>

            <strong style={styles.rowValue}>
                {value}
            </strong>

        </div>
    );
}


// ============================================================
// INSIGHT BOX
// ============================================================

function InsightBox({
    type,
    title,
    text
}) {

    const theme =
        getInsightTheme(type);

    return (

        <div
            style={{
                ...styles.insight,
                background:
                    theme.background,
                borderColor:
                    theme.border
            }}
        >

            <div
                style={{
                    ...styles.insightIcon,
                    background:
                        theme.iconBackground,
                    color:
                        theme.main
                }}
            >

                {type === "danger" ? (
                    <FiAlertTriangle />
                ) : type === "warning" ? (
                    <FiClock />
                ) : type === "positive" ? (
                    <FiCheckCircle />
                ) : (
                    <FiActivity />
                )}

            </div>

            <div>

                <div style={styles.insightTitle}>
                    {title}
                </div>

                <div style={styles.insightText}>
                    {text}
                </div>

            </div>

        </div>
    );
}


// ============================================================
// INSIGHT BOX SMALL
// ============================================================

function InsightBox({
    type,
    title,
    text
}) {

    const theme =
        getInsightTheme(type);

    return (

        <div
            style={{
                ...styles.insight,
                background:
                    theme.background,
                borderColor:
                    theme.border
            }}
        >

            <div
                style={{
                    ...styles.insightIcon,
                    background:
                        theme.iconBackground,
                    color:
                        theme.main
                }}
            >

                {type === "danger" && (
                    <FiAlertTriangle />
                )}

                {type === "warning" && (
                    <FiClock />
                )}

                {type === "positive" && (
                    <FiCheckCircle />
                )}

                {type === "neutral" && (
                    <FiActivity />
                )}

            </div>

            <div>

                <div style={styles.insightTitle}>
                    {title}
                </div>

                <div style={styles.insightText}>
                    {text}
                </div>

            </div>

        </div>
    );
}


// ============================================================
// INSIGHT BOX INSIDE PANEL
// ============================================================

function InsightBox({
    type,
    title,
    text
}) {

    const theme =
        getInsightTheme(type);

    return (

        <div
            style={{
                ...styles.insight,
                background:
                    theme.background,
                borderColor:
                    theme.border
            }}
        >

            <div
                style={{
                    ...styles.insightIcon,
                    background:
                        theme.iconBackground,
                    color:
                        theme.main
                }}
            >

                {type === "danger" ? (
                    <FiAlertTriangle />
                ) : type === "warning" ? (
                    <FiClock />
                ) : type === "positive" ? (
                    <FiCheckCircle />
                ) : (
                    <FiActivity />
                )}

            </div>

            <div>

                <div style={styles.insightTitle}>
                    {title}
                </div>

                <div style={styles.insightText}>
                    {text}
                </div>

            </div>

        </div>
    );
}


// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
    label,
    value
}) {

    return (

        <div style={styles.miniStat}>

            <div style={styles.miniLabel}>
                {label}
            </div>

            <strong style={styles.miniValue}>
                {value}
            </strong>

        </div>
    );
}


// ============================================================
// ACTION PANEL
// ============================================================

function ActionPanel({
    icon,
    title,
    value,
    text,
    type
}) {

    const theme =
        getTheme(type);

    return (

        <div
            style={{
                ...styles.actionPanel,
                background:
                    theme.background,
                borderColor:
                    `${theme.main}30`
            }}
        >

            <div
                style={{
                    ...styles.actionPanelIcon,
                    color:
                        theme.main
                }}
            >
                {icon}
            </div>

            <div style={styles.actionPanelTitle}>
                {title}
            </div>

            <div
                style={{
                    ...styles.actionPanelValue,
                    color:
                        theme.main
                }}
            >
                {value}
            </div>

            <div style={styles.actionPanelText}>
                {text}
            </div>

        </div>
    );
}


// ============================================================
// PRODUCT PANEL
// ============================================================

function ProductPanel({
    title,
    icon,
    products,
    mode,
    danger = false
}) {

    return (

        <div style={styles.panel}>

            <div style={styles.panelHeader}>

                <div
                    style={{
                        ...styles.panelIcon,
                        color:
                            danger
                                ? "#dc2626"
                                : "#7c3aed"
                    }}
                >
                    {icon}
                </div>

                <h3 style={styles.panelTitle}>
                    {title}
                </h3>

            </div>


            {!products.length ? (

                <EmptyState
                    text="No product analysis available yet."
                />

            ) : (

                <div>

                    {products
                        .slice(0, 8)
                        .map(
                            (product, index) => (

                                <div
                                    key={index}
                                    style={styles.productRow}
                                >

                                    <div
                                        style={
                                            styles.productRank
                                        }
                                    >
                                        {index + 1}
                                    </div>

                                    <div
                                        style={
                                            styles.productInfo
                                        }
                                    >

                                        <div
                                            style={
                                                styles.productName
                                            }
                                        >
                                            {product.product_name ||
                                                product.name ||
                                                product.product ||
                                                "Product"}
                                        </div>

                                        <div
                                            style={
                                                styles.productSub
                                            }
                                        >
                                            {mode === "sales"
                                                ? `${number(
                                                    product.units_sold ??
                                                    product.quantity ??
                                                    product.units
                                                )} units`
                                                : `Margin ${Number(
                                                    product.margin ??
                                                    product.profit_margin ??
                                                    0
                                                ).toFixed(1)}%`}
                                        </div>

                                    </div>

                                    <strong
                                        style={
                                            styles.productAmount
                                        }
                                    >

                                        {mode === "sales"
                                            ? money(
                                                product.revenue ??
                                                product.total_revenue
                                            )
                                            : percent(
                                                product.margin ??
                                                product.profit_margin
                                            )}

                                    </strong>

                                </div>

                            )
                        )}

                </div>

            )}

        </div>
    );
}


// ============================================================
// CUSTOMER PANEL
// ============================================================

function CustomerPanel({
    customers
}) {

    return (

        <div>

            <div style={styles.panelHeader}>

                <div style={styles.panelIcon}>
                    <FiAward />
                </div>

                <h3 style={styles.panelTitle}>
                    Top Customers
                </h3>

            </div>


            {!customers.length ? (

                <EmptyState
                    text="No top customer data available yet."
                />

            ) : (

                customers
                    .slice(0, 10)
                    .map(
                        (customer, index) => (

                            <div
                                key={index}
                                style={styles.customerRow}
                            >

                                <div
                                    style={
                                        styles.customerRank
                                    }
                                >
                                    {index + 1}
                                </div>

                                <div
                                    style={
                                        styles.customerInfo
                                    }
                                >

                                    <div
                                        style={
                                            styles.customerName
                                        }
                                    >
                                        {customer.customer_name ||
                                            customer.name ||
                                            "Customer"}
                                    </div>

                                    <div
                                        style={
                                            styles.customerPhone
                                        }
                                    >
                                        {customer.customer_phone ||
                                            customer.phone ||
                                            ""}
                                    </div>

                                </div>

                                <strong
                                    style={
                                        styles.customerSpend
                                    }
                                >
                                    {money(
                                        customer.total_spent ||
                                        customer.spent ||
                                        0
                                    )}
                                </strong>

                            </div>

                        )
                    )

            )}

        </div>
    );
}


// ============================================================
// STRATEGY
// ============================================================

function Strategy({
    icon,
    title,
    text
}) {

    return (

        <div style={styles.strategy}>

            <div style={styles.strategyIcon}>
                {icon}
            </div>

            <h3 style={styles.strategyTitle}>
                {title}
            </h3>

            <p style={styles.strategyText}>
                {text}
            </p>

        </div>
    );
}


// ============================================================
// EMPTY
// ============================================================

function EmptyState({
    text
}) {

    return (

        <div style={styles.empty}>
            <FiSearch size={22} />
            <span>{text}</span>
        </div>
    );
}


// ============================================================
// PRIORITY STYLE
// ============================================================

function getPriorityStyle(priority) {

    if (priority === "HIGH") {

        return {
            background: "#fef2f2",
            color: "#dc2626"
        };
    }

    if (priority === "MEDIUM") {

        return {
            background: "#fff7ed",
            color: "#ea580c"
        };
    }

    return {
        background: "#eff6ff",
        color: "#2563eb"
    };
}


// ============================================================
// INSIGHT THEME
// ============================================================

function getInsightTheme(type) {

    if (type === "positive") {

        return {
            main: "#16a34a",
            background: "#f0fdf4",
            border: "#bbf7d0",
            iconBackground: "#dcfce7"
        };
    }

    if (type === "danger") {

        return {
            main: "#dc2626",
            background: "#fef2f2",
            border: "#fecaca",
            iconBackground: "#fee2e2"
        };
    }

    if (type === "warning") {

        return {
            main: "#ea580c",
            background: "#fff7ed",
            border: "#fed7aa",
            iconBackground: "#ffedd5"
        };
    }

    return {
        main: "#2563eb",
        background: "#eff6ff",
        border: "#bfdbfe",
        iconBackground: "#dbeafe"
    };
}


// ============================================================
// GENERAL THEME
// ============================================================

function getTheme(type) {

    const themes = {

        green: {
            main: "#16a34a",
            background: "#f0fdf4"
        },

        blue: {
            main: "#2563eb",
            background: "#eff6ff"
        },

        purple: {
            main: "#7c3aed",
            background: "#f5f3ff"
        },

        pink: {
            main: "#db2777",
            background: "#fdf2f8"
        },

        red: {
            main: "#dc2626",
            background: "#fef2f2"
        },

        orange: {
            main: "#ea580c",
            background: "#fff7ed"
        },

        gray: {
            main: "#64748b",
            background: "#f8fafc"
        }

    };

    return (
        themes[type] ||
        themes.blue
    );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

    page: {
        minHeight: "100vh",
        background:
            "linear-gradient(135deg,#f5f7fb,#e9eef6)",
        padding: "28px",
        color: "#172033"
    },


    header: {
        maxWidth: "1400px",
        margin: "0 auto 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "18px",
        flexWrap: "wrap"
    },


    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap"
    },


    backButton: {
        border: "1px solid #dce3ed",
        background: "#fff",
        borderRadius: "10px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        color: "#475569",
        fontWeight: "600"
    },


    heading: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },


    headingIcon: {
        width: "50px",
        height: "50px",
        borderRadius: "15px",
        background:
            "linear-gradient(135deg,#7c3aed,#2563eb)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
            "0 9px 25px rgba(79,70,229,.25)"
    },


    title: {
        margin: 0,
        fontSize: "29px",
        fontWeight: "800"
    },


    subtitle: {
        margin: "4px 0 0",
        color: "#64748b",
        fontSize: "13px"
    },


    refreshButton: {
        border: "none",
        background:
            "linear-gradient(135deg,#7c3aed,#2563eb)",
        color: "#fff",
        padding: "12px 17px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        fontWeight: "700"
    },


    hero: {
        maxWidth: "1400px",
        margin: "0 auto 28px",
        padding: "28px 31px",
        borderRadius: "20px",
        background:
            "linear-gradient(135deg,#111827,#1e293b,#312e81)",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        boxShadow:
            "0 14px 35px rgba(15,23,42,.16)"
    },


    heroLabel: {
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.7px",
        opacity: ".65",
        marginBottom: "7px"
    },


    heroTitle: {
        margin: 0,
        fontSize: "25px",
        fontWeight: "800"
    },


    heroText: {
        margin: "7px 0 0",
        opacity: ".7",
        fontSize: "13px"
    },


    aiActive: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "13px 17px",
        borderRadius: "12px",
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.12)",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: ".8px"
    },


    section: {
        maxWidth: "1400px",
        margin: "35px auto 16px",
        display: "flex",
        alignItems: "center",
        gap: "11px"
    },


    sectionIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "11px",
        background: "#fff",
        color: "#7c3aed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
            "0 4px 12px rgba(0,0,0,.05)"
    },


    sectionTitle: {
        margin: 0,
        fontSize: "21px",
        fontWeight: "800"
    },


    sectionText: {
        margin: "3px 0 0",
        color: "#64748b",
        fontSize: "12px"
    },


    metricGrid: {
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
        gap: "17px"
    },


    metric: {
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        borderLeft: "1px solid #edf1f6",
        borderRight: "1px solid #edf1f6",
        borderBottom: "1px solid #edf1f6",
        boxShadow:
            "0 4px 14px rgba(0,0,0,.055)"
    },


    metricIcon: {
        width: "42px",
        height: "42px",
        borderRadius: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "13px"
    },


    metricTitle: {
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "700"
    },


    metricValue: {
        fontSize: "25px",
        fontWeight: "800",
        marginTop: "4px"
    },


    metricDescription: {
        color: "#94a3b8",
        fontSize: "11px",
        marginTop: "4px"
    },


    twoColumns: {
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "17px"
    },


    threeColumns: {
        maxWidth: "1400px",
        margin: "17px auto 0",
        display: "grid",
        gridTemplateColumns:
            "repeat(3,1fr)",
        gap: "17px"
    },


    singlePanel: {
        maxWidth: "1400px",
        margin: "17px auto 0",
        background: "#fff",
        borderRadius: "16px",
        padding: "23px",
        boxShadow:
            "0 4px 14px rgba(0,0,0,.055)"
    },


    panel: {
        background: "#fff",
        borderRadius: "16px",
        padding: "23px",
        boxShadow:
            "0 4px 14px rgba(0,0,0,.055)"
    },


    panelHeader: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        marginBottom: "17px"
    },


    panelIcon: {
        width: "36px",
        height: "36px",
        borderRadius: "9px",
        background: "#f5f3ff",
        color: "#7c3aed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },


    panelTitle: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "800"
    },


    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid #edf1f6"
    },


    rowLabel: {
        color: "#64748b",
        fontSize: "13px"
    },


    rowValue: {
        color: "#172033",
        fontSize: "14px"
    },


    insight: {
        display: "flex",
        gap: "12px",
        padding: "16px",
        borderRadius: "13px",
        border: "1px solid"
    },


    insightIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },


    insightTitle: {
        fontWeight: "800",
        fontSize: "14px",
        marginBottom: "5px"
    },


    insightText: {
        color: "#64748b",
        fontSize: "12px",
        lineHeight: "1.6"
    },


    miniStats: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3,1fr)",
        gap: "10px",
        marginTop: "15px"
    },


    miniStat: {
        background: "#f8fafc",
        borderRadius: "10px",
        padding: "12px"
    },


    miniLabel: {
        color: "#64748b",
        fontSize: "10px",
        fontWeight: "700"
    },


    miniValue: {
        display: "block",
        marginTop: "4px",
        fontSize: "14px"
    },


    actionPanel: {
        border: "1px solid",
        borderRadius: "15px",
        padding: "20px"
    },


    actionPanelIcon: {
        fontSize: "21px",
        marginBottom: "8px"
    },


    actionPanelTitle: {
        fontSize: "13px",
        fontWeight: "700"
    },


    actionPanelValue: {
        fontSize: "27px",
        fontWeight: "800",
        marginTop: "3px"
    },


    actionPanelText: {
        color: "#64748b",
        fontSize: "11px",
        marginTop: "3px"
    },


    productRow: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "12px 0",
        borderBottom: "1px solid #edf1f6"
    },


    productRank: {
        width: "30px",
        height: "30px",
        borderRadius: "9px",
        background: "#f5f3ff",
        color: "#7c3aed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "12px"
    },


    productInfo: {
        flex: 1,
        minWidth: 0
    },


    productName: {
        fontWeight: "700",
        fontSize: "13px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },


    productSub: {
        color: "#94a3b8",
        fontSize: "11px",
        marginTop: "3px"
    },


    productAmount: {
        fontSize: "13px"
    },


    customerRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 0",
        borderBottom: "1px solid #edf1f6"
    },


    customerRank: {
        width: "31px",
        height: "31px",
        borderRadius: "50%",
        background: "#fdf2f8",
        color: "#db2777",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "12px"
    },


    customerInfo: {
        flex: 1
    },


    customerName: {
        fontWeight: "700",
        fontSize: "13px"
    },


    customerPhone: {
        color: "#94a3b8",
        fontSize: "11px",
        marginTop: "2px"
    },


    customerSpend: {
        fontSize: "13px"
    },


    tableWrapper: {
        overflowX: "auto"
    },


    table: {
        width: "100%",
        borderCollapse: "collapse"
    },


    th: {
        textAlign: "left",
        padding: "12px",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: "11px",
        textTransform: "uppercase"
    },


    td: {
        padding: "13px 12px",
        borderBottom: "1px solid #edf1f6",
        fontSize: "13px",
        color: "#475569"
    },


    tdStrong: {
        padding: "13px 12px",
        borderBottom: "1px solid #edf1f6",
        fontSize: "13px",
        fontWeight: "800",
        color: "#172033"
    },


    paymentGrid: {
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
        gap: "15px"
    },


    paymentCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        boxShadow:
            "0 4px 14px rgba(0,0,0,.05)"
    },


    paymentIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },


    paymentName: {
        fontWeight: "700",
        fontSize: "13px"
    },


    paymentOrders: {
        color: "#94a3b8",
        fontSize: "11px",
        marginTop: "2px"
    },


    paymentAmount: {
        marginLeft: "auto",
        fontSize: "13px"
    },


    dailyGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
        gap: "10px"
    },


    dailyCard: {
        padding: "14px",
        borderRadius: "11px",
        background: "#f8fafc",
        border: "1px solid #edf1f6"
    },


    dailyDate: {
        color: "#64748b",
        fontSize: "10px",
        fontWeight: "700"
    },


    dailyRevenue: {
        fontSize: "16px",
        fontWeight: "800",
        marginTop: "7px"
    },


    dailyOrders: {
        color: "#94a3b8",
        fontSize: "10px",
        marginTop: "3px"
    },


    insightGrid: {
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(300px,1fr))",
        gap: "15px"
    },


    actionPlan: {
        maxWidth: "1400px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "16px",
        padding: "7px 22px",
        boxShadow:
            "0 4px 14px rgba(0,0,0,.055)"
    },


    actionRow: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
        padding: "16px 3px",
        borderBottom: "1px solid #edf1f6"
    },


    priority: {
        minWidth: "58px",
        padding: "5px 7px",
        borderRadius: "7px",
        textAlign: "center",
        fontSize: "9px",
        fontWeight: "800"
    },


    actionContent: {
        flex: 1
    },


    actionTitle: {
        fontSize: "14px",
        fontWeight: "800"
    },


    actionText: {
        color: "#64748b",
        fontSize: "12px",
        marginTop: "4px",
        lineHeight: "1.5"
    },


    strategyGrid: {
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",
        gap: "15px"
    },


    strategy: {
        background: "#fff",
        borderRadius: "16px",
        padding: "21px",
        borderTop: "3px solid #7c3aed",
        boxShadow:
            "0 4px 14px rgba(0,0,0,.055)"
    },


    strategyIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#f5f3ff",
        color: "#7c3aed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },


    strategyTitle: {
        margin: "12px 0 5px",
        fontSize: "15px",
        fontWeight: "800"
    },


    strategyText: {
        margin: 0,
        color: "#64748b",
        fontSize: "12px",
        lineHeight: "1.65"
    },


    finalBanner: {
        maxWidth: "1400px",
        margin: "35px auto 10px",
        padding: "22px",
        borderRadius: "16px",
        background:
            "linear-gradient(135deg,#111827,#312e81)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "14px"
    },


    finalIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "12px",
        background: "rgba(255,255,255,.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },


    finalTitle: {
        fontWeight: "800",
        fontSize: "15px"
    },


    finalText: {
        color: "#cbd5e1",
        fontSize: "11px",
        lineHeight: "1.5",
        marginTop: "3px"
    },


    finalButton: {
        border: "1px solid rgba(255,255,255,.2)",
        background: "rgba(255,255,255,.08)",
        color: "#fff",
        borderRadius: "9px",
        padding: "9px 13px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "11px"
    },


    errorBar: {
        maxWidth: "1400px",
        margin: "0 auto 20px",
        padding: "13px 15px",
        borderRadius: "11px",
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        fontSize: "12px"
    },


    smallRetry: {
        marginLeft: "auto",
        border: "none",
        background: "#dc2626",
        color: "#fff",
        borderRadius: "7px",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700"
    },


    loadingPage: {
        minHeight: "100vh",
        background:
            "linear-gradient(135deg,#f5f7fb,#e9eef6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    },


    loadingIcon: {
        width: "70px",
        height: "70px",
        borderRadius: "20px",
        background:
            "linear-gradient(135deg,#7c3aed,#2563eb)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
            "0 12px 30px rgba(79,70,229,.25)"
    },


    errorLargeIcon: {
        width: "65px",
        height: "65px",
        borderRadius: "18px",
        background: "#fef2f2",
        color: "#dc2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },


    loadingTitle: {
        margin: "18px 0 5px",
        fontSize: "23px"
    },


    loadingText: {
        color: "#64748b",
        fontSize: "13px",
        maxWidth: "500px",
        textAlign: "center"
    },


    spinner: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        border: "3px solid #e2e8f0",
        borderTopColor: "#7c3aed",
        animation:
            "spin 1s linear infinite",
        marginTop: "15px"
    },


    retryButton: {
        marginTop: "15px",
        border: "none",
        background:
            "linear-gradient(135deg,#7c3aed,#2563eb)",
        color: "#fff",
        padding: "11px 17px",
        borderRadius: "9px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontWeight: "700"
    },


    empty: {
        minHeight: "90px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        color: "#94a3b8",
        fontSize: "12px"
    }

};