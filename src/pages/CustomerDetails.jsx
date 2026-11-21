import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

export default function CustomerDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get(`/customers/${id}/history`);

      if (res.data.success) {
        setCustomer(res.data.customer);
        setSales(res.data.sales || []);
      } else {
        setError(res.data.message || "Unable to load customer.");
      }
    } catch (err) {
      console.error("Customer history error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load customer details."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(Number(amount) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentStatus = (status) => {
    const value = String(status || "Pending").toLowerCase();

    if (value === "paid" || value === "completed") {
      return "paid";
    }

    if (value === "pending") {
      return "pending";
    }

    if (value === "unpaid") {
      return "unpaid";
    }

    return "default";
  };

  const getPaymentMethod = (method) => {
    if (!method) return "Unknown";

    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  if (loading) {
    return (
      <div className="customer-page">
        <div className="customer-loading">
          <div className="loading-spinner"></div>
          <p>Loading customer history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-page">
        <div className="customer-error">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>

          <h3>Something went wrong</h3>

          <p>{error}</p>

          <div className="error-actions">
            <button onClick={loadCustomer} className="retry-button">
              <i className="fas fa-redo"></i>
              Try Again
            </button>

            <Link to="/customers" className="back-button">
              <i className="fas fa-arrow-left"></i>
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-page">
        <div className="customer-error">
          <div className="error-icon">
            <i className="fas fa-user-slash"></i>
          </div>

          <h3>Customer not found</h3>

          <p>The customer information you're looking for doesn't exist.</p>

          <Link to="/customers" className="back-button">
            <i className="fas fa-arrow-left"></i>
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const totalOrders = Number(customer.total_orders) || sales.length;
  const totalSpent = Number(customer.total_spent) || 0;

  return (
    <div className="customer-page">

      {/* PAGE HEADER */}
      <div className="customer-page-header">
        <div className="header-left">

          <Link to="/customers" className="back-icon-button">
            <i className="fas fa-arrow-left"></i>
          </Link>

          <div>
            <div className="page-eyebrow">
              CUSTOMER MANAGEMENT
            </div>

            <h1>Customer History</h1>

            <p>
              View purchase activity and transaction history
            </p>
          </div>
        </div>

        <div className="header-right">
          <button
            className="refresh-button"
            onClick={loadCustomer}
          >
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* CUSTOMER PROFILE */}
      <div className="customer-profile-card">

        <div className="customer-profile-main">

          <div className="customer-avatar">
            <i className="fas fa-user"></i>
          </div>

          <div className="customer-profile-info">
            <span className="profile-label">
              CUSTOMER
            </span>

            <h2>
              {customer.customer_name || "Customer"}
            </h2>

            <div className="customer-profile-meta">
              {customer.customer_phone && (
                <span>
                  <i className="fas fa-phone"></i>
                  {customer.customer_phone}
                </span>
              )}

              {customer.created_at && (
                <span>
                  <i className="fas fa-calendar"></i>
                  Customer since {formatDate(customer.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="customer-profile-status">
          <span
            className={`status-pill ${
              customer.status === "active"
                ? "status-active"
                : "status-inactive"
            }`}
          >
            <span className="status-dot"></span>

            {customer.status || "Active"}
          </span>
        </div>
      </div>

      {/* STATS */}
      <div className="customer-stats-grid">

        <div className="customer-stat-card">
          <div className="stat-icon stat-icon-blue">
            <i className="fas fa-shopping-bag"></i>
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Total Orders
            </span>

            <h3>{totalOrders}</h3>

            <span className="stat-description">
              Completed transactions
            </span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon stat-icon-green">
            <i className="fas fa-wallet"></i>
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Total Spent
            </span>

            <h3>{formatCurrency(totalSpent)}</h3>

            <span className="stat-description">
              Lifetime purchase value
            </span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon stat-icon-purple">
            <i className="fas fa-receipt"></i>
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Average Order
            </span>

            <h3>
              {formatCurrency(
                totalOrders > 0
                  ? totalSpent / totalOrders
                  : 0
              )}
            </h3>

            <span className="stat-description">
              Average transaction value
            </span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon stat-icon-orange">
            <i className="fas fa-clock"></i>
          </div>

          <div className="stat-content">
            <span className="stat-label">
              Last Purchase
            </span>

            <h3 className="last-purchase-value">
              {customer.last_purchase
                ? formatDate(customer.last_purchase)
                : "No purchases"}
            </h3>

            <span className="stat-description">
              Most recent transaction
            </span>
          </div>
        </div>
      </div>

      {/* PURCHASE HISTORY */}
      <div className="purchase-history-card">

        <div className="purchase-history-header">
          <div>
            <div className="section-eyebrow">
              TRANSACTIONS
            </div>

            <h2>
              Purchase History
            </h2>

            <p>
              All transactions associated with this customer
            </p>
          </div>

          <div className="orders-count">
            <span className="orders-count-number">
              {sales.length}
            </span>

            <span>
              {sales.length === 1 ? "Order" : "Orders"}
            </span>
          </div>
        </div>

        {/* TABLE */}
        {sales.length === 0 ? (
          <div className="purchase-empty-state">
            <div className="empty-icon">
              <i className="fas fa-receipt"></i>
            </div>

            <h3>No purchase history</h3>

            <p>
              This customer hasn't made any purchases yet.
            </p>
          </div>
        ) : (
          <div className="purchase-table-wrapper">

            <table className="purchase-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>INVOICE</th>
                  <th>DATE</th>
                  <th>PAYMENT METHOD</th>
                  <th>PAYMENT STATUS</th>
                  <th className="amount-column">TOTAL</th>
                  <th className="action-column">ACTION</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale, index) => (
                  <tr key={sale.id || index}>

                    <td>
                      <div className="order-number">
                        #{String(index + 1).padStart(3, "0")}
                      </div>
                    </td>

                    <td>
                      <div className="invoice-cell">
                        <div className="invoice-icon">
                          <i className="fas fa-file-invoice"></i>
                        </div>

                        <span>
                          {sale.invoice_no || `INV-${sale.id}`}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <span className="date-main">
                          {formatDateTime(sale.created_at)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="payment-method">
                        <div className="payment-method-icon">
                          <i
                            className={`fas ${
                              String(sale.payment_method || "")
                                .toLowerCase()
                                .includes("cash")
                                ? "fa-money-bill"
                                : String(sale.payment_method || "")
                                    .toLowerCase()
                                    .includes("upi")
                                ? "fa-mobile-alt"
                                : "fa-credit-card"
                            }`}
                          ></i>
                        </div>

                        {getPaymentMethod(sale.payment_method)}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`payment-status ${
                          getPaymentStatus(sale.payment_status)
                        }`}
                      >
                        <span className="payment-status-dot"></span>

                        {sale.payment_status || "Pending"}
                      </span>
                    </td>

                    <td className="amount-column">
                      <div className="sale-amount">
                        {formatCurrency(sale.total_amount)}
                      </div>
                    </td>

                    <td className="action-column">
                      <Link
                        to={`/invoice/${sale.id}`}
                        className="view-invoice-button"
                      >
                        <i className="fas fa-eye"></i>
                        View
                      </Link>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="customer-page-footer">
        <div>
          <i className="fas fa-shield-alt"></i>
          Customer transaction data is securely stored
        </div>

        <span>
          Updated {new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* CSS */}
      <style>{`

        * {
          box-sizing: border-box;
        }

        .customer-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 30px;
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          color: #0f172a;
        }

        /* HEADER */

        .customer-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .back-icon-button {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .back-icon-button:hover {
          background: #f1f5f9;
          color: #2563eb;
          transform: translateY(-1px);
        }

        .page-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-bottom: 7px;
        }

        .customer-page-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.7px;
          color: #0f172a;
        }

        .customer-page-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 11px 16px;
          color: #475569;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* PROFILE */

        .customer-profile-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.025);
        }

        .customer-profile-main {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .customer-avatar {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
          flex-shrink: 0;
        }

        .profile-label {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 7px;
        }

        .customer-profile-info h2 {
          margin: 0;
          font-size: 23px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .customer-profile-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 10px;
        }

        .customer-profile-meta span {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 13px;
        }

        .customer-profile-meta i {
          color: #94a3b8;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .status-active {
          background: #dcfce7;
          color: #15803d;
        }

        .status-inactive {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          background: currentColor;
          border-radius: 50%;
        }

        /* STATS */

        .customer-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 26px;
        }

        .customer-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 21px;
          display: flex;
          gap: 15px;
          align-items: flex-start;
          transition: all 0.2s ease;
        }

        .customer-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.06);
          border-color: #cbd5e1;
        }

        .stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .stat-icon-blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .stat-icon-green {
          background: #ecfdf5;
          color: #059669;
        }

        .stat-icon-purple {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .stat-icon-orange {
          background: #fff7ed;
          color: #ea580c;
        }

        .stat-content {
          min-width: 0;
        }

        .stat-label {
          display: block;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .stat-content h3 {
          margin: 0;
          color: #0f172a;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.6px;
          white-space: nowrap;
        }

        .last-purchase-value {
          font-size: 17px !important;
        }

        .stat-description {
          display: block;
          margin-top: 7px;
          font-size: 11px;
          color: #94a3b8;
        }

        /* PURCHASE HISTORY */

        .purchase-history-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.025);
        }

        .purchase-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px;
          border-bottom: 1px solid #f1f5f9;
          gap: 20px;
        }

        .section-eyebrow {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          margin-bottom: 8px;
        }

        .purchase-history-header h2 {
          margin: 0;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.4px;
          color: #0f172a;
        }

        .purchase-history-header p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .orders-count {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 9px 14px;
          border-radius: 10px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .orders-count-number {
          background: #2563eb;
          color: #ffffff;
          width: 24px;
          height: 24px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
        }

        /* TABLE */

        .purchase-table-wrapper {
          overflow-x: auto;
        }

        .purchase-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .purchase-table thead {
          background: #f8fafc;
        }

        .purchase-table th {
          padding: 15px 20px;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 1px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .purchase-table td {
          padding: 17px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #475569;
          vertical-align: middle;
        }

        .purchase-table tbody tr {
          transition: background 0.15s ease;
        }

        .purchase-table tbody tr:hover {
          background: #f8fafc;
        }

        .purchase-table tbody tr:last-child td {
          border-bottom: none;
        }

        .order-number {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
        }

        .invoice-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          color: #2563eb;
        }

        .invoice-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          border-radius: 9px;
          color: #2563eb;
        }

        .date-main {
          color: #475569;
          font-weight: 500;
        }

        .payment-method {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-weight: 500;
        }

        .payment-method-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 12px;
        }

        .payment-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .payment-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .payment-status.paid {
          background: #dcfce7;
          color: #15803d;
        }

        .payment-status.pending {
          background: #fef3c7;
          color: #b45309;
        }

        .payment-status.unpaid {
          background: #fee2e2;
          color: #b91c1c;
        }

        .payment-status.default {
          background: #f1f5f9;
          color: #64748b;
        }

        .amount-column {
          text-align: right !important;
        }

        .sale-amount {
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
        }

        .action-column {
          text-align: center !important;
        }

        .view-invoice-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border: 1px solid #dbeafe;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .view-invoice-button:hover {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* EMPTY STATE */

        .purchase-empty-state {
          padding: 65px 25px;
          text-align: center;
        }

        .empty-icon {
          width: 70px;
          height: 70px;
          margin: 0 auto 18px;
          border-radius: 22px;
          background: #f1f5f9;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 27px;
        }

        .purchase-empty-state h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #334155;
        }

        .purchase-empty-state p {
          margin: 9px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        /* FOOTER */

        .customer-page-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 12px 4px;
          color: #94a3b8;
          font-size: 11px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .customer-page-footer div {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .customer-page-footer i {
          color: #10b981;
        }

        /* LOADING */

        .customer-loading {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          color: #64748b;
        }

        .loading-spinner {
          width: 42px;
          height: 42px;
          border: 4px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: customer-spin 0.8s linear infinite;
        }

        @keyframes customer-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ERROR */

        .customer-error {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 30px;
        }

        .error-icon {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: #fee2e2;
          color: #dc2626;
          font-size: 25px;
          margin-bottom: 20px;
        }

        .customer-error h3 {
          margin: 0;
          font-size: 22px;
          color: #0f172a;
        }

        .customer-error p {
          margin: 10px 0 25px;
          color: #64748b;
          font-size: 14px;
          max-width: 400px;
        }

        .error-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .retry-button,
        .back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
        }

        .retry-button {
          background: #2563eb;
          color: #ffffff;
          border: none;
        }

        .back-button {
          background: #ffffff;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        /* RESPONSIVE */

        @media (max-width: 1200px) {
          .customer-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .customer-page {
            padding: 18px;
          }

          .customer-page-header {
            margin-bottom: 20px;
          }

          .customer-page-header h1 {
            font-size: 23px;
          }

          .customer-profile-card {
            padding: 20px;
            align-items: flex-start;
          }

          .customer-profile-main {
            gap: 14px;
          }

          .customer-avatar {
            width: 55px;
            height: 55px;
            border-radius: 16px;
            font-size: 22px;
          }

          .customer-profile-info h2 {
            font-size: 19px;
          }

          .customer-profile-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .customer-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .customer-stat-card {
            padding: 16px;
            gap: 12px;
          }

          .stat-icon {
            width: 38px;
            height: 38px;
            font-size: 15px;
            border-radius: 11px;
          }

          .stat-content h3 {
            font-size: 19px;
          }

          .last-purchase-value {
            font-size: 14px !important;
          }

          .purchase-history-header {
            padding: 20px;
          }

          .purchase-history-header h2 {
            font-size: 19px;
          }

          .customer-page-footer {
            font-size: 10px;
          }
        }

        @media (max-width: 480px) {
          .customer-page {
            padding: 14px;
          }

          .header-left {
            gap: 12px;
          }

          .back-icon-button {
            width: 38px;
            height: 38px;
          }

          .customer-page-header h1 {
            font-size: 21px;
          }

          .customer-page-header p {
            font-size: 12px;
          }

          .refresh-button {
            padding: 9px 12px;
            font-size: 12px;
          }

          .customer-profile-card {
            flex-direction: column;
            gap: 16px;
          }

          .customer-profile-status {
            align-self: flex-start;
          }

          .customer-stats-grid {
            grid-template-columns: 1fr;
          }

          .customer-stat-card {
            padding: 17px;
          }

          .purchase-history-header {
            align-items: flex-start;
          }

          .purchase-history-header p {
            font-size: 12px;
          }

          .orders-count {
            padding: 7px 10px;
          }

          .customer-page-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

      `}</style>
    </div>
  );
}