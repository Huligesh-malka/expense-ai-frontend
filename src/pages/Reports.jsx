

import {
    getSalesReport,
    getPurchaseReport,
    getProfitReport,
    getStockReport,
} from "../services/reportApi";

export default function Reports() {

    // =====================================
    // STATE
    // =====================================

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [profit, setProfit] = useState([]);
    const [stock, setStock] = useState([]);

    const [salesSummary, setSalesSummary] = useState({});
    const [purchaseSummary, setPurchaseSummary] = useState({});
    const [profitSummary, setProfitSummary] = useState({});
    const [stockSummary, setStockSummary] = useState({});


    // =====================================
    // LOAD REPORTS
    // =====================================

    const loadReports = async (start = from, end = to) => {

        try {

            setLoading(true);
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


            // SALES

            setSales(
                salesResult?.data || []
            );

            setSalesSummary(
                salesResult?.summary || {}
            );


            // PURCHASES

            setPurchases(
                purchaseResult?.data || []
            );

            setPurchaseSummary(
                purchaseResult?.summary || {}
            );


            // PROFIT

            setProfit(
                profitResult?.data || []
            );

            setProfitSummary(
                profitResult?.summary || {}
            );


            // STOCK

            setStock(
                stockResult?.data || []
            );

            setStockSummary(
                stockResult?.summary || {}
            );

        } catch (err) {

            console.error(
                "Reports Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load reports"
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================
    // INITIAL LOAD
    // =====================================

    useEffect(() => {

        loadReports("", "");

    }, []);


    // =====================================
    // APPLY FILTER
    // =====================================

    const applyFilter = () => {

        if (from && to && from > to) {

            setError(
                "From date cannot be greater than To date"
            );

            return;
        }

        loadReports(from, to);
    };


    // =====================================
    // CLEAR FILTER
    // =====================================

    const clearFilter = () => {

        setFrom("");
        setTo("");

        loadReports("", "");
    };


    // =====================================
    // MONEY FORMAT
    // =====================================

    const money = (value) => {

        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };


    // =====================================
    // DATE FORMAT
    // =====================================

    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        return new Date(value).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // =====================================
    // STOCK STATUS
    // =====================================

    const getStockStatus = (item) => {

        const currentStock = Number(
            item.stock || 0
        );

        const minimumStock = Number(
            item.min_stock || 0
        );

        if (currentStock <= 0) {

            return {
                text: "Out of Stock",
                className: "out",
            };
        }

        if (currentStock <= minimumStock) {

            return {
                text: "Low Stock",
                className: "low",
            };
        }

        return {
            text: "Available",
            className: "available",
        };
    };


    // =====================================
    // LOADING
    // =====================================

    if (loading) {

        return (
            <div className="reports-page">

                <style>{styles.css}</style>

                <div className="reports-loading">

                    <div className="reports-spinner"></div>

                    <h3>
                        Loading Reports...
                    </h3>

                </div>

            </div>
        );
    }


    // =====================================
    // PAGE
    // =====================================

    return (

        <div className="reports-page">

            <style>{styles.css}</style>


            <div className="reports-container">


                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <div className="reports-header">

                    <div>

                        <div className="reports-small-title">
                            SHOP MANAGEMENT
                        </div>

                        <h1>
                            Reports
                        </h1>

                        <p>
                            Sales, purchases, profit and stock
                        </p>

                    </div>


                    <button
                        className="refresh-button"
                        onClick={() => loadReports()}
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* ================================= */}
                {/* ERROR */}
                {/* ================================= */}

                {error && (

                    <div className="error-box">

                        ⚠ {error}

                    </div>

                )}


                {/* ================================= */}
                {/* DATE FILTER */}
                {/* ================================= */}

                <div className="filter-card">

                    <div className="filter-field">

                        <label>
                            From Date
                        </label>

                        <input
                            type="date"
                            value={from}
                            onChange={(e) =>
                                setFrom(e.target.value)
                            }
                        />

                    </div>


                    <div className="filter-field">

                        <label>
                            To Date
                        </label>

                        <input
                            type="date"
                            value={to}
                            onChange={(e) =>
                                setTo(e.target.value)
                            }
                        />

                    </div>


                    <button
                        className="apply-button"
                        onClick={applyFilter}
                    >
                        Apply
                    </button>


                    <button
                        className="clear-button"
                        onClick={clearFilter}
                    >
                        Clear
                    </button>

                </div>


                {/* ================================= */}
                {/* SUMMARY CARDS */}
                {/* ================================= */}

                <div className="summary-grid">


                    <div className="summary-card">

                        <div className="summary-label">
                            TOTAL SALES
                        </div>

                        <div className="summary-value">
                            {money(
                                salesSummary.total_sales
                            )}
                        </div>

                        <div className="summary-info">
                            {salesSummary.total_bills || 0}
                            {" "}bills
                        </div>

                    </div>


                    <div className="summary-card discount-summary-card">

                        <div className="summary-label">
                            TOTAL DISCOUNT
                        </div>

                        <div className="summary-value discount-value">
                            {money(
                                salesSummary.total_discount
                            )}
                        </div>

                        <div className="summary-info">
                            Discount given
                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-label">
                            PURCHASES
                        </div>

                        <div className="summary-value">
                            {money(
                                purchaseSummary.purchase_amount
                            )}
                        </div>

                        <div className="summary-info">
                            {purchaseSummary.total_purchases || 0}
                            {" "}purchases
                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-label">
                            PROFIT
                        </div>

                        <div className="summary-value profit-value">
                            {money(
                                profitSummary.total_profit
                            )}
                        </div>

                        <div className="summary-info">
                            Sales − Cost
                        </div>

                    </div>


                    <div className="summary-card">

                        <div className="summary-label">
                            STOCK VALUE
                        </div>

                        <div className="summary-value">
                            {money(
                                stockSummary.inventory_value
                            )}
                        </div>

                        <div className="summary-info">
                            {stockSummary.total_products || 0}
                            {" "}products
                        </div>

                    </div>

                </div>


                {/* ================================= */}
                {/* SALES REPORT */}
                {/* ================================= */}

                <section className="report-section">

                    <div className="section-header">

                        <div>

                            <h2>
                                Sales Report
                            </h2>

                            <span>
                                {sales.length} records
                            </span>

                        </div>

                        <div className="section-total">
                            {money(
                                salesSummary.total_sales
                            )}
                        </div>

                    </div>


                    <div className="table-scroll">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Invoice
                                    </th>

                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Payment
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Discount
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {sales.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="empty-row"
                                        >
                                            No sales found
                                        </td>

                                    </tr>

                                ) : (

                                    sales.map((sale) => (

                                        <tr key={sale.id}>

                                            <td className="invoice">
                                                {sale.invoice_no || "—"}
                                            </td>

                                            <td>
                                                {
                                                    sale.customer_name ||
                                                    "Walk-in Customer"
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    sale.created_at
                                                )}
                                            </td>

                                            <td>
                                                {sale.payment_method || "—"}
                                            </td>

                                            <td>

                                                <span className="status-badge">
                                                    {
                                                        sale.payment_status ||
                                                        "—"
                                                    }
                                                </span>

                                            </td>

                                            <td className="discount-cell">
                                                {money(
                                                    sale.discount
                                                )}
                                            </td>

                                            <td className="amount">
                                                {money(
                                                    sale.total_amount
                                                )}
                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* ================================= */}
                {/* PURCHASE REPORT */}
                {/* ================================= */}

                <section className="report-section">

                    <div className="section-header">

                        <div>

                            <h2>
                                Purchase Report
                            </h2>

                            <span>
                                {purchases.length} records
                            </span>

                        </div>

                        <div className="section-total">
                            {money(
                                purchaseSummary.purchase_amount
                            )}
                        </div>

                    </div>


                    <div className="table-scroll">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Invoice
                                    </th>

                                    <th>
                                        Supplier
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                    <th>
                                        Paid
                                    </th>

                                    <th>
                                        Due
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {purchases.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="empty-row"
                                        >
                                            No purchases found
                                        </td>

                                    </tr>

                                ) : (

                                    purchases.map(
                                        (purchase) => (

                                            <tr
                                                key={
                                                    purchase.id
                                                }
                                            >

                                                <td className="invoice">
                                                    {
                                                        purchase.invoice_no ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.supplier_name ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        purchase.created_at
                                                    )}
                                                </td>

                                                <td className="amount">
                                                    {money(
                                                        purchase.total_amount
                                                    )}
                                                </td>

                                                <td>
                                                    {money(
                                                        purchase.paid_amount
                                                    )}
                                                </td>

                                                <td className="due">
                                                    {money(
                                                        purchase.due_amount
                                                    )}
                                                </td>

                                                <td>

                                                    <span className="status-badge">
                                                        {
                                                            purchase.payment_status ||
                                                            "—"
                                                        }
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* ================================= */}
                {/* PROFIT REPORT */}
                {/* ================================= */}

                <section className="report-section">

                    <div className="section-header">

                        <div>

                            <h2>
                                Profit Report
                            </h2>

                            <span>
                                {profit.length} products
                            </span>

                        </div>

                        <div className="section-total">
                            {money(
                                profitSummary.total_profit
                            )}
                        </div>

                    </div>


                    <div className="table-scroll">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Qty Sold
                                    </th>

                                    <th>
                                        Sales
                                    </th>

                                    <th>
                                        Cost
                                    </th>

                                    <th>
                                        Profit
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {profit.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="empty-row"
                                        >
                                            No profit data found
                                        </td>

                                    </tr>

                                ) : (

                                    profit.map((item) => (

                                        <tr
                                            key={
                                                item.product_id
                                            }
                                        >

                                            <td className="product-name">
                                                {
                                                    item.product_name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.quantity_sold
                                                }
                                            </td>

                                            <td>
                                                {money(
                                                    item.sales_value
                                                )}
                                            </td>

                                            <td>
                                                {money(
                                                    item.purchase_value
                                                )}
                                            </td>

                                            <td className="profit-cell">
                                                {money(
                                                    item.profit
                                                )}
                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>


                {/* ================================= */}
                {/* STOCK REPORT */}
                {/* ================================= */}

                <section className="report-section">

                    <div className="section-header">

                        <div>

                            <h2>
                                Stock Report
                            </h2>

                            <span>
                                {stock.length} products
                            </span>

                        </div>

                        <div className="section-total">
                            {money(
                                stockSummary.inventory_value
                            )}
                        </div>

                    </div>


                    <div className="stock-summary">

                        <div>
                            <span>
                                Total Stock
                            </span>

                            <strong>
                                {stockSummary.total_stock || 0}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Low Stock
                            </span>

                            <strong>
                                {stockSummary.low_stock || 0}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Out of Stock
                            </span>

                            <strong>
                                {stockSummary.out_of_stock || 0}
                            </strong>
                        </div>

                    </div>


                    <div className="table-scroll">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Product
                                    </th>

                                    <th>
                                        Category
                                    </th>

                                    <th>
                                        Stock
                                    </th>

                                    <th>
                                        Unit
                                    </th>

                                    <th>
                                        Purchase Price
                                    </th>

                                    <th>
                                        Stock Value
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {stock.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="empty-row"
                                        >
                                            No products found
                                        </td>

                                    </tr>

                                ) : (

                                    stock.map((item) => {

                                        const status =
                                            getStockStatus(item);

                                        return (

                                            <tr
                                                key={item.id}
                                            >

                                                <td className="product-name">
                                                    {
                                                        item.product_name
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.category ||
                                                        "Other"
                                                    }
                                                </td>

                                                <td className="stock-number">
                                                    {
                                                        item.stock
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.unit ||
                                                        "pcs"
                                                    }
                                                </td>

                                                <td>
                                                    {money(
                                                        item.purchase_price
                                                    )}
                                                </td>

                                                <td>
                                                    {money(
                                                        item.stock_value
                                                    )}
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            `stock-badge ${status.className}`
                                                        }
                                                    >
                                                        {
                                                            status.text
                                                        }
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


            </div>

        </div>
    );
}


// =====================================================
// STYLES
// =====================================================

const styles = {

    css: `

        * {
            box-sizing: border-box;
        }

        .reports-page {
            min-height: 100vh;
            background: #FFFBF2;
            color: #182422;
            font-family:
                Inter,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
        }


        .reports-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 28px 24px 60px;
        }


        /* ================= HEADER ================= */

        .reports-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;

            background: #0B4F52;
            color: white;

            padding: 25px 28px;

            border-radius: 14px;

            margin-bottom: 24px;

            box-shadow:
                0 6px 0 #083B3D;
        }


        .reports-small-title {
            color: #FFC53D;

            font-size: 11px;

            font-weight: 700;

            letter-spacing: 1.8px;

            margin-bottom: 3px;
        }


        .reports-header h1 {
            margin: 0;

            font-family:
                "Baloo 2",
                Inter,
                sans-serif;

            font-size: 34px;

            line-height: 1.1;
        }


        .reports-header p {
            margin: 5px 0 0;

            color: #D6E4E1;

            font-size: 13px;
        }


        .refresh-button {
            border: none;

            background: #FFC53D;

            color: #083B3D;

            padding: 11px 18px;

            border-radius: 9px;

            font-weight: 700;

            cursor: pointer;
        }


        .refresh-button:hover {
            opacity: 0.9;
        }


        /* ================= ERROR ================= */

        .error-box {
            background: #FBE7E0;

            color: #A5341A;

            border: 1px solid #E6B9AA;

            border-left: 4px solid #D6482B;

            padding: 12px 15px;

            border-radius: 8px;

            margin-bottom: 20px;

            font-size: 13px;
        }


        /* ================= FILTER ================= */

        .filter-card {
            display: flex;

            align-items: flex-end;

            gap: 12px;

            flex-wrap: wrap;

            background: white;

            border: 2px solid #E4DEC8;

            border-radius: 12px;

            padding: 17px;

            margin-bottom: 22px;
        }


        .filter-field {
            display: flex;

            flex-direction: column;

            gap: 5px;
        }


        .filter-field label {
            font-size: 10px;

            font-weight: 700;

            color: #5C6B67;

            text-transform: uppercase;

            letter-spacing: 0.5px;
        }


        .filter-field input {
            height: 40px;

            min-width: 165px;

            border: 2px solid #E4DEC8;

            border-radius: 8px;

            padding: 0 11px;

            background: #FFFEFA;

            color: #182422;

            outline: none;
        }


        .filter-field input:focus {
            border-color: #0B4F52;
        }


        .apply-button {
            height: 40px;

            border: none;

            border-radius: 8px;

            padding: 0 20px;

            background: #0B4F52;

            color: white;

            font-weight: 700;

            cursor: pointer;
        }


        .clear-button {
            height: 40px;

            border: none;

            border-radius: 8px;

            padding: 0 18px;

            background: #F0EDE4;

            color: #5C6B67;

            font-weight: 600;

            cursor: pointer;
        }


        /* ================= SUMMARY ================= */

        .summary-grid {
            display: grid;

            grid-template-columns:
                repeat(5, minmax(0, 1fr));

            gap: 14px;

            margin-bottom: 24px;
        }


        .summary-card {
            background: white;

            border: 2px solid #E4DEC8;

            border-radius: 12px;

            padding: 18px;
        }


        .summary-label {
            color: #5C6B67;

            font-size: 10px;

            font-weight: 700;

            letter-spacing: 0.8px;
        }


        .summary-value {
            color: #0B4F52;

            font-family:
                "JetBrains Mono",
                monospace;

            font-size: 23px;

            font-weight: 700;

            margin-top: 7px;
        }


        .profit-value {
            color: #2F8F5B;
        }


        .discount-value {
            color: #C26B20;
        }


        .discount-cell {
            color: #C26B20;

            font-family:
                "JetBrains Mono",
                monospace;

            font-weight: 600;
        }


        .summary-info {
            color: #7A8581;

            font-size: 11px;

            margin-top: 5px;
        }


        /* ================= REPORT SECTION ================= */

        .report-section {
            background: white;

            border: 2px solid #E4DEC8;

            border-radius: 12px;

            overflow: hidden;

            margin-bottom: 24px;
        }


        .section-header {
            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            padding: 17px 20px;

            background: #FBF7EA;

            border-bottom: 2px solid #E4DEC8;
        }


        .section-header h2 {
            margin: 0;

            color: #0B4F52;

            font-family:
                "Baloo 2",
                Inter,
                sans-serif;

            font-size: 20px;
        }


        .section-header span {
            color: #7A8581;

            font-size: 11px;
        }


        .section-total {
            color: #0B4F52;

            font-family:
                "JetBrains Mono",
                monospace;

            font-size: 15px;

            font-weight: 700;
        }


        /* ================= TABLE ================= */

        .table-scroll {
            overflow-x: auto;
        }


        table {
            width: 100%;

            border-collapse: collapse;

            min-width: 850px;
        }


        th {
            padding: 12px 16px;

            text-align: left;

            background: #FFFCF3;

            color: #0B4F52;

            border-bottom: 2px solid #E4DEC8;

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: 0.5px;

            white-space: nowrap;
        }


        td {
            padding: 12px 16px;

            border-bottom: 1px dashed #E4DEC8;

            color: #394743;

            font-size: 13px;

            white-space: nowrap;
        }


        tbody tr:hover {
            background: #FFFCF5;
        }


        .invoice {
            color: #0B4F52;

            font-family:
                "JetBrains Mono",
                monospace;

            font-weight: 600;
        }


        .product-name {
            color: #182422;

            font-weight: 600;
        }


        .amount {
            font-family:
                "JetBrains Mono",
                monospace;

            font-weight: 600;
        }


        .due {
            color: #C26B20;

            font-family:
                "JetBrains Mono",
                monospace;

            font-weight: 600;
        }


        .profit-cell {
            color: #2F8F5B;

            font-family:
                "JetBrains Mono",
                monospace;

            font-weight: 700;
        }


        .stock-number {
            font-family:
                "JetBrains Mono",
                monospace;

            font-weight: 600;
        }


        .status-badge {
            display: inline-block;

            padding: 4px 9px;

            border-radius: 20px;

            background: #F0F0ED;

            color: #596560;

            font-size: 10px;

            font-weight: 700;

            text-transform: capitalize;
        }


        .stock-badge {
            display: inline-block;

            padding: 4px 9px;

            border-radius: 20px;

            font-size: 10px;

            font-weight: 700;
        }


        .stock-badge.available {
            background: #E4F5EC;

            color: #2F8F5B;
        }


        .stock-badge.low {
            background: #FCF0DA;

            color: #C97A12;
        }


        .stock-badge.out {
            background: #FBE7E0;

            color: #D6482B;
        }


        .empty-row {
            text-align: center;

            padding: 42px 20px;

            color: #7A8581;

            font-size: 13px;
        }


        /* ================= STOCK SUMMARY ================= */

        .stock-summary {
            display: flex;

            gap: 30px;

            padding: 14px 20px;

            background: #FFFEFA;

            border-bottom: 1px solid #E4DEC8;
        }


        .stock-summary div {
            display: flex;

            align-items: center;

            gap: 8px;
        }


        .stock-summary span {
            color: #7A8581;

            font-size: 11px;
        }


        .stock-summary strong {
            color: #0B4F52;

            font-family:
                "JetBrains Mono",
                monospace;

            font-size: 13px;
        }


        /* ================= LOADING ================= */

        .reports-loading {
            min-height: 100vh;

            display: flex;

            flex-direction: column;

            justify-content: center;

            align-items: center;

            color: #5C6B67;

            gap: 12px;
        }


        .reports-spinner {
            width: 35px;

            height: 35px;

            border-radius: 50%;

            border: 3px solid #E4DEC8;

            border-top-color: #0B4F52;

            animation:
                reports-spin 0.7s linear infinite;
        }


        @keyframes reports-spin {

            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }

        }


        /* ================= RESPONSIVE ================= */

        @media (max-width: 950px) {

            .summary-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }


        @media (max-width: 650px) {

            .reports-container {
                padding: 18px 12px 40px;
            }


            .reports-header {
                align-items: flex-start;

                flex-direction: column;
            }


            .reports-header h1 {
                font-size: 29px;
            }


            .refresh-button {
                width: 100%;
            }


            .summary-grid {
                grid-template-columns: 1fr;
            }


            .filter-card {
                align-items: stretch;

                flex-direction: column;
            }


            .filter-field input {
                width: 100%;

                min-width: 0;
            }


            .apply-button,
            .clear-button {
                width: 100%;
            }


            .section-header {
                align-items: flex-start;

                flex-direction: column;
            }


            .stock-summary {
                flex-wrap: wrap;

                gap: 12px 25px;
            }

        }

    `,
};