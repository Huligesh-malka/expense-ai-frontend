import React, { useEffect, useState } from "react";

import {
    getBusinessAnalytics
} from "../services/aiBusinessService";


const AIBusiness = () => {

    const [analytics, setAnalytics] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ========================================================
    // LOAD ANALYTICS
    // ========================================================

    const loadAnalytics = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await getBusinessAnalytics();

            if (response.success) {

                setAnalytics(response.data);

            } else {

                setError(
                    response.message ||
                    "Failed to load business analytics"
                );

            }

        } catch (err) {

            console.error(
                "AI Business Analytics Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load business analytics"
            );

        } finally {

            setLoading(false);

        }

    };


    // ========================================================
    // LOAD ON PAGE OPEN
    // ========================================================

    useEffect(() => {

        loadAnalytics();

    }, []);


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div style={{
                padding: "30px"
            }}>
                Loading business analytics...
            </div>
        );

    }


    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

        return (
            <div style={{
                padding: "30px"
            }}>

                <h2>
                    Business Analytics
                </h2>

                <p>
                    {error}
                </p>

                <button
                    onClick={loadAnalytics}
                >
                    Try Again
                </button>

            </div>
        );

    }


    // ========================================================
    // NO DATA
    // ========================================================

    if (!analytics) {

        return (
            <div style={{
                padding: "30px"
            }}>
                No analytics data available.
            </div>
        );

    }


    const sales =
        analytics.sales || {};

    const today =
        sales.today || {};

    const currentMonth =
        sales.current_month || {};

    const previousMonth =
        sales.previous_month || {};

    const growth =
        sales.growth || {};

    const inventory =
        analytics.inventory || {};

    const customers =
        analytics.customers || {};

    const suppliers =
        analytics.suppliers || {};

    const purchases =
        analytics.purchases || {};

    const products =
        analytics.products || {};


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <div style={{
            padding: "30px"
        }}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "30px"
            }}>

                <div>

                    <h1>
                        AI Business Intelligence
                    </h1>

                    <p>
                        Understand your business performance
                        and discover growth opportunities.
                    </p>

                </div>


                <button
                    onClick={loadAnalytics}
                >
                    Refresh
                </button>

            </div>


            {/* =================================================
                SALES
            ================================================= */}

            <h2>
                Sales
            </h2>

            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginBottom: "30px"
            }}>

                <div className="ai-card">

                    <h3>
                        Today's Sales
                    </h3>

                    <strong>
                        ₹{Number(
                            today.revenue || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                    <p>
                        {today.orders || 0} orders
                    </p>

                </div>


                <div className="ai-card">

                    <h3>
                        This Month
                    </h3>

                    <strong>
                        ₹{Number(
                            currentMonth.revenue || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                    <p>
                        {currentMonth.orders || 0} orders
                    </p>

                </div>


                <div className="ai-card">

                    <h3>
                        Previous Month
                    </h3>

                    <strong>
                        ₹{Number(
                            previousMonth.revenue || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Sales Growth
                    </h3>

                    <strong>
                        {Number(
                            growth.revenue_percent || 0
                        ).toFixed(2)}%
                    </strong>

                    <p>
                        Compared with previous month
                    </p>

                </div>

            </div>


            {/* =================================================
                INVENTORY
            ================================================= */}

            <h2>
                Inventory Intelligence
            </h2>

            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginBottom: "30px"
            }}>

                <div className="ai-card">

                    <h3>
                        Products
                    </h3>

                    <strong>
                        {inventory.total_products || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Total Stock
                    </h3>

                    <strong>
                        {inventory.total_stock || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Low Stock
                    </h3>

                    <strong>
                        {inventory.low_stock_count || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Out of Stock
                    </h3>

                    <strong>
                        {inventory.out_of_stock_count || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Dead Stock
                    </h3>

                    <strong>
                        {inventory.dead_stock_count || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Inventory Value
                    </h3>

                    <strong>
                        ₹{Number(
                            inventory.purchase_value || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>

            </div>


            {/* =================================================
                PRODUCT OPPORTUNITIES
            ================================================= */}

            <h2>
                Product Intelligence
            </h2>

            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "30px"
            }}>


                {/* TOP SELLING */}

                <div className="ai-card">

                    <h3>
                        🔥 Top Selling Products
                    </h3>

                    {(
                        products.top_selling || []
                    ).slice(0, 5).map(product => (

                        <div
                            key={product.id}
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                padding: "10px 0",
                                borderBottom:
                                    "1px solid #eee"
                            }}
                        >

                            <span>
                                {product.product_name}
                            </span>

                            <strong>
                                {product.units_sold_30_days}
                            </strong>

                        </div>

                    ))}

                </div>


                {/* HIGH MARGIN */}

                <div className="ai-card">

                    <h3>
                        💰 High Margin Products
                    </h3>

                    {(
                        products.high_margin || []
                    ).slice(0, 5).map(product => (

                        <div
                            key={product.id}
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                padding: "10px 0",
                                borderBottom:
                                    "1px solid #eee"
                            }}
                        >

                            <span>
                                {product.product_name}
                            </span>

                            <strong>
                                {Number(
                                    product.margin_percent || 0
                                ).toFixed(1)}%
                            </strong>

                        </div>

                    ))}

                </div>


                {/* LOW MARGIN */}

                <div className="ai-card">

                    <h3>
                        ⚠️ Low Margin Products
                    </h3>

                    {(
                        products.low_margin || []
                    ).slice(0, 5).map(product => (

                        <div
                            key={product.id}
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                padding: "10px 0",
                                borderBottom:
                                    "1px solid #eee"
                            }}
                        >

                            <span>
                                {product.product_name}
                            </span>

                            <strong>
                                {Number(
                                    product.margin_percent || 0
                                ).toFixed(1)}%
                            </strong>

                        </div>

                    ))}

                </div>

            </div>


            {/* =================================================
                CUSTOMERS
            ================================================= */}

            <h2>
                Customer Intelligence
            </h2>

            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginBottom: "30px"
            }}>

                <div className="ai-card">

                    <h3>
                        Customers
                    </h3>

                    <strong>
                        {customers.total || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Customer Spending
                    </h3>

                    <strong>
                        ₹{Number(
                            customers.total_spent || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Average Customer Value
                    </h3>

                    <strong>
                        ₹{Number(
                            customers.average_customer_value || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Inactive 60+ Days
                    </h3>

                    <strong>
                        {customers.inactive_60_days || 0}
                    </strong>

                </div>

            </div>


            {/* =================================================
                SUPPLIERS / PURCHASES
            ================================================= */}

            <h2>
                Purchasing
            </h2>

            <div style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px"
            }}>

                <div className="ai-card">

                    <h3>
                        Suppliers
                    </h3>

                    <strong>
                        {suppliers.total || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Total Purchases
                    </h3>

                    <strong>
                        {purchases.total || 0}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Purchase Value
                    </h3>

                    <strong>
                        ₹{Number(
                            purchases.total_value || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>


                <div className="ai-card">

                    <h3>
                        Supplier Due
                    </h3>

                    <strong>
                        ₹{Number(
                            purchases.total_due || 0
                        ).toLocaleString("en-IN")}
                    </strong>

                </div>

            </div>

        </div>

    );

};


export default AIBusiness;