
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

import {
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiPackage,
  FiX,
  FiFilter,
} from "react-icons/fi";

/* =========================================================
   HELPERS
========================================================= */

const number = (value) => Number(value || 0);

const money = (value) =>
  `₹${number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getBillStatus = (purchase) => {
  const total = number(purchase.total_amount);
  const paid = number(purchase.paid_amount);

  if (paid >= total && total > 0) return "paid";
  if (paid > 0) return "partial";

  return "unpaid";
};

const getDue = (purchase) => {
  if (purchase.due_amount !== undefined) {
    return Math.max(0, number(purchase.due_amount));
  }

  return Math.max(
    0,
    number(purchase.total_amount) -
      number(purchase.paid_amount)
  );
};

const getSupplierName = (purchase) =>
  purchase.supplier_name || "Unknown Supplier";

const getSupplierId = (purchase) =>
  purchase.supplier_id;

const getBillNumber = (purchase) =>
  purchase.invoice_no || `PUR-${purchase.id}`;

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [supplierProfiles, setSupplierProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [view, setView] = useState("suppliers");

  /* =========================================================
     LOAD PURCHASES
  ========================================================= */

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError("");

      // Load purchase bills and the supplier directory separately.
      // Purchase rows contain financial data; /suppliers contains
      // the supplier profile data (phone, company, email, etc.).
      const [purchaseResponse, supplierResponse] = await Promise.all([
        API.get("/purchases"),
        API.get("/suppliers").catch((supplierError) => {
          console.warn("Supplier directory could not be loaded:", supplierError);
          return { data: { data: [] } };
        }),
      ]);

      const extractRows = (responseData) => {
        if (Array.isArray(responseData)) return responseData;
        if (Array.isArray(responseData?.data)) return responseData.data;
        if (Array.isArray(responseData?.suppliers)) return responseData.suppliers;
        if (Array.isArray(responseData?.purchases)) return responseData.purchases;
        if (Array.isArray(responseData?.rows)) return responseData.rows;
        return [];
      };

      const purchaseData = extractRows(purchaseResponse.data);
      const supplierData = extractRows(supplierResponse.data);

      // Normalize supplier profile field names because different backend
      // versions may use phone/email/company/address aliases.
      const normalizeSupplier = (supplier) => ({
        ...supplier,
        id: supplier.id ?? supplier.supplier_id ?? supplier.supplierId,
        supplier_name:
          supplier.supplier_name ?? supplier.name ?? supplier.supplierName ?? "",
        company_name:
          supplier.company_name ?? supplier.company ?? supplier.business_name ?? supplier.supplier_company ?? "",
        supplier_phone:
          supplier.supplier_phone ?? supplier.phone ?? supplier.mobile ?? supplier.contact_number ?? supplier.phone_number ?? "",
        supplier_email:
          supplier.supplier_email ?? supplier.email ?? supplier.email_address ?? "",
        address:
          supplier.address ?? supplier.supplier_address ?? supplier.billing_address ?? supplier.address_line ??
          [supplier.address_line1, supplier.address_line2, supplier.city, supplier.state, supplier.pincode]
            .filter(Boolean).join(", "),
        gst_number:
          supplier.gst_number ?? supplier.gst_no ?? supplier.gstin ?? supplier.tax_number ?? "",
      });

      const normalizedSupplierData = (Array.isArray(supplierData) ? supplierData : [])
        .map(normalizeSupplier);

      setSupplierProfiles(normalizedSupplierData);

      const supplierMap = new Map(
        normalizedSupplierData.map((supplier) => [String(supplier.id), supplier])
      );

      // Merge supplier profile details into purchase rows by supplier ID.
      const enrichedPurchases = (Array.isArray(purchaseData) ? purchaseData : []).map((purchase) => {
        const supplier = supplierMap.get(String(purchase.supplier_id ?? purchase.supplierId));
        return {
          ...purchase,
          supplier_id: purchase.supplier_id ?? purchase.supplierId ?? supplier?.id,
          supplier_name:
            purchase.supplier_name || purchase.supplierName || supplier?.supplier_name || "Unknown Supplier",
          company_name:
            purchase.company_name || purchase.supplier_company || supplier?.company_name || "",
          supplier_phone:
            purchase.supplier_phone || purchase.phone || supplier?.supplier_phone || "",
          supplier_email:
            purchase.supplier_email || purchase.email || supplier?.supplier_email || "",
          address:
            purchase.address || purchase.supplier_address || supplier?.address || "",
          gst_number:
            purchase.gst_number || purchase.gstin || supplier?.gst_number || "",
        };
      });

      setPurchases(enrichedPurchases);
    } catch (err) {
      console.error("Purchase loading error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load supplier accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     GROUP BY SUPPLIER ID
  ========================================================= */

  const suppliers = useMemo(() => {
    const supplierMap = new Map();

    // First seed every supplier from the supplier directory. This ensures
    // profile details are available even if purchase rows omit them.
    supplierProfiles.forEach((profile) => {
      const supplierId = profile.id ?? profile.supplier_id;
      if (supplierId == null) return;

      supplierMap.set(String(supplierId), {
        supplier_id: supplierId,
        supplier_name: profile.supplier_name || "Unknown Supplier",
        company_name: profile.company_name || "",
        supplier_phone: profile.supplier_phone || "",
        supplier_email: profile.supplier_email || "",
        address: profile.address || "",
        gst_number: profile.gst_number || "",
        purchases: [],
        total_purchases: 0,
        total_paid: 0,
        total_due: 0,
        bill_count: 0,
        last_purchase: null,
      });
    });

    // Then aggregate purchase and payment data by supplier ID.
    purchases.forEach((purchase) => {
      const supplierId = getSupplierId(purchase);
      if (supplierId == null) return;

      const supplierKey = String(supplierId);
      if (!supplierMap.has(supplierKey)) {
        supplierMap.set(supplierKey, {
          supplier_id: supplierId,
          supplier_name: getSupplierName(purchase),
          company_name: purchase.company_name || purchase.supplier_company || "",
          supplier_phone: purchase.supplier_phone || purchase.phone || "",
          supplier_email: purchase.supplier_email || purchase.email || "",
          address: purchase.address || purchase.supplier_address || "",
          gst_number: purchase.gst_number || purchase.gstin || "",
          purchases: [],
          total_purchases: 0,
          total_paid: 0,
          total_due: 0,
          bill_count: 0,
          last_purchase: null,
        });
      }

      const supplier = supplierMap.get(supplierKey);
      supplier.purchases.push(purchase);
      supplier.total_purchases += number(purchase.total_amount);
      supplier.total_paid += number(purchase.paid_amount);
      supplier.total_due += getDue(purchase);
      supplier.bill_count += 1;

      const purchaseDate = purchase.created_at ? new Date(purchase.created_at) : null;
      if (purchaseDate && !Number.isNaN(purchaseDate.getTime()) &&
          (!supplier.last_purchase || purchaseDate > supplier.last_purchase)) {
        supplier.last_purchase = purchaseDate;
      }

      // Fill missing profile data from the purchase row as a fallback.
      supplier.supplier_name = supplier.supplier_name === "Unknown Supplier"
        ? (purchase.supplier_name || supplier.supplier_name)
        : supplier.supplier_name;
      supplier.company_name ||= purchase.company_name || purchase.supplier_company || "";
      supplier.supplier_phone ||= purchase.supplier_phone || purchase.phone || "";
      supplier.supplier_email ||= purchase.supplier_email || purchase.email || "";
      supplier.address ||= purchase.address || purchase.supplier_address || "";
      supplier.gst_number ||= purchase.gst_number || purchase.gstin || "";
    });

    return Array.from(supplierMap.values()).sort(
      (a, b) => b.total_purchases - a.total_purchases
    );
  }, [purchases, supplierProfiles]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;

    const term = search.toLowerCase();

    return suppliers.filter((supplier) => {
      return (
        String(supplier.supplier_name || "")
          .toLowerCase()
          .includes(term) ||
        String(supplier.supplier_id)
          .includes(term) ||
        String(supplier.company_name || "")
          .toLowerCase()
          .includes(term) ||
        String(supplier.supplier_phone || "")
          .toLowerCase()
          .includes(term) ||
        String(supplier.supplier_email || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [suppliers, search]);

  /* =========================================================
     TOTALS
  ========================================================= */

  const totalPurchaseAmount = suppliers.reduce(
    (sum, supplier) =>
      sum + supplier.total_purchases,
    0
  );

  const totalPaidAmount = suppliers.reduce(
    (sum, supplier) =>
      sum + supplier.total_paid,
    0
  );

  const totalDueAmount = suppliers.reduce(
    (sum, supplier) =>
      sum + supplier.total_due,
    0
  );

  const totalBills = purchases.length;

  const suppliersWithDue = suppliers.filter(
    (supplier) => supplier.total_due > 0
  ).length;

  /* =========================================================
     SUPPLIER ACCOUNT
  ========================================================= */

  const openSupplierAccount = (supplier) => {
    setSelectedSupplier(supplier);
    setView("account");
  };

  const backToSupplierList = () => {
    setSelectedSupplier(null);
    setView("suppliers");
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <>
        <div className="purchase-page">
          <div className="purchase-loading">
            <div className="purchase-spinner" />
            <span>Loading supplier accounts...</span>
          </div>
        </div>

        <PurchaseStyles />
      </>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <>
        <div className="purchase-page">
          <div className="purchase-state">
            <div className="purchase-state-icon">
              <FiAlertCircle />
            </div>

            <h2>Something went wrong</h2>

            <p>{error}</p>

            <button
              className="purchase-button primary"
              onClick={loadPurchases}
            >
              <FiRefreshCw />
              Retry
            </button>
          </div>
        </div>

        <PurchaseStyles />
      </>
    );
  }

  /* =========================================================
     SUPPLIER ACCOUNT VIEW
  ========================================================= */

  if (
    view === "account" &&
    selectedSupplier
  ) {
    const supplier = selectedSupplier;

    const supplierPurchases = [
      ...supplier.purchases,
    ].sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );

    return (
      <>
        <div className="purchase-page">
          <main className="purchase-container">

            {/* BACK */}

            <div className="account-topbar">
              <button
                className="back-button"
                onClick={backToSupplierList}
              >
                <FiArrowLeft />
                Back to suppliers
              </button>

              <button
                className="purchase-button secondary"
                onClick={loadPurchases}
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>

            {/* SUPPLIER PROFILE */}

            <section className="supplier-profile">
              <div className="supplier-profile-left">

                <div className="supplier-avatar large">
                  {String(supplier.supplier_name || "S")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="supplier-profile-details">
                  <span className="profile-label">
                    SUPPLIER ACCOUNT
                  </span>

                  <h1>
                    {supplier.supplier_name}
                  </h1>

                  <div className="supplier-id">
                    Supplier ID:{" "}
                    <strong>
                      #{supplier.supplier_id}
                    </strong>
                  </div>

                  {supplier.company_name && (
                    <div className="supplier-detail-line">
                      <FiBriefcase />
                      {supplier.company_name}
                    </div>
                  )}

                  {supplier.supplier_phone && (
                    <div className="supplier-detail-line">
                      <FiPhone />
                      {supplier.supplier_phone}
                    </div>
                  )}

                  {supplier.address && (
                    <div className="supplier-detail-line">
                      <FiMapPin />
                      {supplier.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="supplier-balance-card">
                <span>Outstanding balance</span>

                <strong
                  className={
                    supplier.total_due > 0
                      ? "balance-red"
                      : "balance-green"
                  }
                >
                  {money(supplier.total_due)}
                </strong>

                <div className="balance-status">
                  {supplier.total_due > 0 ? (
                    <>
                      <FiClock />
                      Payment pending
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      Account settled
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* SUPPLIER STATISTICS */}

            <section className="purchase-stat-grid">
              <StatCard
                icon={<FiTrendingUp />}
                label="Total purchases"
                value={money(
                  supplier.total_purchases
                )}
                color="blue"
              />

              <StatCard
                icon={<FiDollarSign />}
                label="Total paid"
                value={money(
                  supplier.total_paid
                )}
                color="green"
              />

              <StatCard
                icon={<FiClock />}
                label="Outstanding"
                value={money(
                  supplier.total_due
                )}
                color="orange"
              />

              <StatCard
                icon={<FiFileText />}
                label="Purchase bills"
                value={supplier.bill_count}
                color="purple"
              />
            </section>

            {/* ACCOUNT INFORMATION */}

            <section className="account-information-card">
              <div className="section-heading">
                <div className="heading-icon">
                  <FiUsers />
                </div>

                <div>
                  <h2>Supplier information</h2>
                  <p>
                    Supplier account details
                  </p>
                </div>
              </div>

              <div className="information-grid">
                <InfoItem
                  label="Supplier ID"
                  value={`#${supplier.supplier_id}`}
                />

                <InfoItem
                  label="Supplier name"
                  value={supplier.supplier_name}
                />

                <InfoItem
                  label="Company"
                  value={
                    supplier.company_name ||
                    "Not provided"
                  }
                />

                <InfoItem
                  label="Phone"
                  value={
                    supplier.supplier_phone ||
                    "Not provided"
                  }
                />

                <InfoItem
                  label="Email"
                  value={
                    supplier.supplier_email ||
                    "Not provided"
                  }
                />

                <InfoItem
                  label="Address"
                  value={
                    supplier.address ||
                    "Not provided"
                  }
                />

                <InfoItem
                  label="Total purchase bills"
                  value={supplier.bill_count}
                />

                <InfoItem
                  label="Last purchase"
                  value={
                    supplier.last_purchase
                      ? formatDate(
                          supplier.last_purchase
                        )
                      : "—"
                  }
                />
              </div>
            </section>

            {/* PURCHASE HISTORY */}

            <section className="purchase-history-card">
              <div className="history-header">
                <div>
                  <h2>Purchase history</h2>

                  <p>
                    All bills for supplier ID{" "}
                    <strong>
                      #{supplier.supplier_id}
                    </strong>
                  </p>
                </div>

                <span className="bill-count-badge">
                  {supplierPurchases.length} bills
                </span>
              </div>

              {/* DESKTOP TABLE */}

              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Bill number</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {supplierPurchases.map(
                      (purchase) => {
                        const due = getDue(
                          purchase
                        );

                        const status =
                          getBillStatus(
                            purchase
                          );

                        return (
                          <tr key={purchase.id}>
                            <td>
                              <div className="bill-cell">
                                <div className="bill-icon">
                                  <FiFileText />
                                </div>

                                <strong>
                                  {getBillNumber(
                                    purchase
                                  )}
                                </strong>
                              </div>
                            </td>

                            <td>
                              {formatDate(
                                purchase.created_at
                              )}
                            </td>

                            <td>
                              <strong>
                                {money(
                                  purchase.total_amount
                                )}
                              </strong>
                            </td>

                            <td className="green-text">
                              {money(
                                purchase.paid_amount
                              )}
                            </td>

                            <td
                              className={
                                due > 0
                                  ? "red-text"
                                  : "green-text"
                              }
                            >
                              <strong>
                                {money(due)}
                              </strong>
                            </td>

                            <td>
                              <StatusBadge
                                status={status}
                              />
                            </td>

                            <td>
                              <div className="table-actions">
                                <Link
                                  to={`/purchase/${purchase.id}`}
                                  className="view-button"
                                >
                                  <FiEye />
                                  View
                                </Link>

                                {due > 0 && (
                                  <Link
                                    to={`/purchase/${purchase.id}?payment=1`}
                                    className="pay-button"
                                  >
                                    Pay
                                    <FiArrowRight />
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="mobile-bill-list">
                {supplierPurchases.map(
                  (purchase) => {
                    const due = getDue(
                      purchase
                    );

                    return (
                      <div
                        className="mobile-bill-card"
                        key={purchase.id}
                      >
                        <div className="mobile-bill-header">
                          <div>
                            <span>
                              BILL NUMBER
                            </span>

                            <strong>
                              {getBillNumber(
                                purchase
                              )}
                            </strong>
                          </div>

                          <StatusBadge
                            status={getBillStatus(
                              purchase
                            )}
                          />
                        </div>

                        <div className="mobile-date">
                          <FiCalendar />
                          {formatDate(
                            purchase.created_at
                          )}
                        </div>

                        <div className="mobile-amount-grid">
                          <div>
                            <span>Total</span>
                            <strong>
                              {money(
                                purchase.total_amount
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Paid</span>
                            <strong className="green-text">
                              {money(
                                purchase.paid_amount
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Balance</span>
                            <strong
                              className={
                                due > 0
                                  ? "red-text"
                                  : "green-text"
                              }
                            >
                              {money(due)}
                            </strong>
                          </div>
                        </div>

                        <div className="mobile-actions">
                          <Link
                            to={`/purchase/${purchase.id}`}
                            className="purchase-button secondary"
                          >
                            <FiEye />
                            View bill
                          </Link>

                          {due > 0 && (
                            <Link
                              to={`/purchase/${purchase.id}?payment=1`}
                              className="purchase-button primary"
                            >
                              Pay now
                              <FiArrowRight />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* LEDGER */}

            <section className="supplier-ledger-card">
              <div className="section-heading">
                <div className="heading-icon green">
                  <FiTrendingUp />
                </div>

                <div>
                  <h2>Supplier ledger</h2>
                  <p>
                    Financial summary of this supplier
                  </p>
                </div>
              </div>

              <div className="ledger-grid">
                <div>
                  <span>Total purchases</span>
                  <strong>
                    {money(
                      supplier.total_purchases
                    )}
                  </strong>
                </div>

                <div>
                  <span>Total payments</span>
                  <strong className="green-text">
                    {money(
                      supplier.total_paid
                    )}
                  </strong>
                </div>

                <div>
                  <span>Current outstanding</span>
                  <strong className="red-text">
                    {money(
                      supplier.total_due
                    )}
                  </strong>
                </div>
              </div>
            </section>

          </main>
        </div>

        <PurchaseStyles />
      </>
    );
  }

  /* =========================================================
     SUPPLIER LIST VIEW
  ========================================================= */

  return (
    <>
      <div className="purchase-page">
        <main className="purchase-container">

          {/* HEADER */}

          <header className="purchase-header">
            <div>
              <span className="page-eyebrow">
                INVENTORY MANAGEMENT
              </span>

              <h1>Supplier accounts</h1>

              <p>
                Manage supplier relationships,
                purchase history and payments.
              </p>
            </div>

            <div className="header-actions">
              <button
                className="purchase-button secondary"
                onClick={loadPurchases}
              >
                <FiRefreshCw />
                Refresh
              </button>

              <Link
                to="/purchases/add"
                className="purchase-button primary"
              >
                <FiPlus />
                New purchase
              </Link>
            </div>
          </header>

          {/* SUMMARY */}

          <section className="purchase-stat-grid">
            <StatCard
              icon={<FiUsers />}
              label="Suppliers"
              value={suppliers.length}
              color="blue"
            />

            <StatCard
              icon={<FiTrendingUp />}
              label="Total purchases"
              value={money(
                totalPurchaseAmount
              )}
              color="purple"
              description={`${totalBills} bills recorded`}
            />

            <StatCard
              icon={<FiCheckCircle />}
              label="Total paid"
              value={money(
                totalPaidAmount
              )}
              color="green"
            />

            <StatCard
              icon={<FiClock />}
              label="Outstanding"
              value={money(
                totalDueAmount
              )}
              color="orange"
              description={`${suppliersWithDue} suppliers pending`}
            />
          </section>

          {/* MAIN CARD */}

          <section className="supplier-list-card">

            <div className="list-card-header">
              <div>
                <h2>All suppliers</h2>
                <p>
                  Click a supplier to open their account
                </p>
              </div>

              <span className="supplier-count">
                {suppliers.length} suppliers
              </span>
            </div>

            {/* SEARCH */}

            <div className="supplier-search-toolbar">
              <div className="search-box">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search supplier name, ID, phone or company..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="clear-search"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              <button
                className="filter-button"
                onClick={() => setSearch("")}
              >
                <FiFilter />
                Clear
              </button>
            </div>

            {/* EMPTY */}

            {filteredSuppliers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiUsers />
                </div>

                <h3>No suppliers found</h3>

                <p>
                  {search
                    ? "Try another supplier name or ID."
                    : "Supplier accounts will appear after purchases are recorded."}
                </p>

                {search && (
                  <button
                    className="purchase-button secondary"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE */}

                <div className="supplier-table-wrapper">
                  <table className="supplier-table">
                    <thead>
                      <tr>
                        <th>Supplier ID</th>
                        <th>Supplier</th>
                        <th>Bills</th>
                        <th>Purchases</th>
                        <th>Paid</th>
                        <th>Outstanding</th>
                        <th>Last purchase</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSuppliers.map(
                        (supplier) => (
                          <tr
                            key={supplier.supplier_id}
                            onClick={() =>
                              openSupplierAccount(
                                supplier
                              )
                            }
                          >
                            <td>
                              <span className="supplier-id-badge supplier-id-left">
                                #{supplier.supplier_id}
                              </span>
                            </td>

                            <td>
                              <div className="supplier-cell">
                                <div className="supplier-avatar">
                                  {supplier.supplier_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="supplier-name-block">
                                  <strong>
                                    {supplier.supplier_name}
                                  </strong>

                                  {supplier.company_name && (
                                    <span>
                                      {supplier.company_name}
                                    </span>
                                  )}

                                  {supplier.supplier_phone && (
                                    <small>
                                      <FiPhone />
                                      {supplier.supplier_phone}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="bill-count">
                                <FiFileText />
                                {supplier.bill_count}
                              </span>
                            </td>

                            <td>
                              <strong className="dark-money">
                                {money(
                                  supplier.total_purchases
                                )}
                              </strong>
                            </td>

                            <td>
                              <strong className="green-text">
                                {money(
                                  supplier.total_paid
                                )}
                              </strong>
                            </td>

                            <td>
                              <strong
                                className={
                                  supplier.total_due > 0
                                    ? "red-text"
                                    : "green-text"
                                }
                              >
                                {money(
                                  supplier.total_due
                                )}
                              </strong>
                            </td>

                            <td>
                              <span className="date-cell">
                                <FiCalendar />

                                {supplier.last_purchase
                                  ? formatDate(
                                      supplier.last_purchase
                                    )
                                  : "—"}
                              </span>
                            </td>

                            <td>
                              <button className="account-button">
                                Account
                                <FiChevronRight />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}

                <div className="supplier-mobile-list">
                  {filteredSuppliers.map(
                    (supplier) => (
                      <div
                        className="supplier-mobile-card"
                        key={supplier.supplier_id}
                        onClick={() =>
                          openSupplierAccount(
                            supplier
                          )
                        }
                      >
                        <div className="mobile-supplier-top">
                          <span className="supplier-id-badge supplier-id-left mobile-id-badge">
                            #{supplier.supplier_id}
                          </span>
                          <div className="supplier-cell">
                            <div className="supplier-avatar">
                              {supplier.supplier_name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="supplier-name-block">
                              <strong>
                                {supplier.supplier_name}
                              </strong>

                              {supplier.company_name && (
                                <span>
                                  {supplier.company_name}
                                </span>
                              )}


                            </div>
                          </div>

                          <FiChevronRight className="mobile-chevron" />
                        </div>

                        <div className="mobile-supplier-stats">
                          <div>
                            <span>Purchases</span>
                            <strong>
                              {money(
                                supplier.total_purchases
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Paid</span>
                            <strong className="green-text">
                              {money(
                                supplier.total_paid
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Outstanding</span>
                            <strong
                              className={
                                supplier.total_due > 0
                                  ? "red-text"
                                  : "green-text"
                              }
                            >
                              {money(
                                supplier.total_due
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="mobile-supplier-footer">
                          <span>
                            <FiFileText />
                            {supplier.bill_count} bills
                          </span>

                          <span>
                            <FiCalendar />
                            {supplier.last_purchase
                              ? formatDate(
                                  supplier.last_purchase
                                )
                              : "No purchases"}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* FOOTER */}

            <div className="list-footer">
              <span>
                Showing {filteredSuppliers.length} of{" "}
                {suppliers.length} suppliers
              </span>

              <span>
                Total outstanding:{" "}
                <strong className="red-text">
                  {money(totalDueAmount)}
                </strong>
              </span>
            </div>
          </section>

          {/* FOOTER INFO */}

          <div className="purchase-info-note">
            <FiPackage />

            <span>
              Supplier accounts are grouped using
              their unique Supplier ID. Purchase
              bills and payments automatically
              update each account.
            </span>
          </div>

        </main>
      </div>

      <PurchaseStyles />
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  color,
  description,
}) {
  return (
    <div className={`purchase-stat-card ${color}`}>
      <div className="stat-top">
        <div className="stat-icon">
          {icon}
        </div>

        <span>{label}</span>
      </div>

      <strong className="stat-value">
        {value}
      </strong>

      {description && (
        <small>{description}</small>
      )}
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({ status }) {
  const statuses = {
    paid: {
      label: "Fully paid",
      className: "paid",
      icon: <FiCheckCircle />,
    },

    partial: {
      label: "Partially paid",
      className: "partial",
      icon: <FiClock />,
    },

    unpaid: {
      label: "Unpaid",
      className: "unpaid",
      icon: <FiAlertCircle />,
    },
  };

  const current =
    statuses[status] || statuses.unpaid;

  return (
    <span
      className={`status-badge ${current.className}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

function PurchaseStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

      .purchase-page {
        min-height: 100vh;
        background: #f4f6fb;
        color: #17233b;
        font-family: Inter, sans-serif;
        padding: 1px 0;
      }

      .purchase-page * {
        box-sizing: border-box;
      }

      .purchase-container {
        width: min(1450px, calc(100% - 40px));
        margin: auto;
        padding: 30px 0 50px;
      }

      /* HEADER */

      .purchase-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 25px;
        margin-bottom: 26px;
      }

      .page-eyebrow {
        color: #64748b;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.3px;
      }

      .purchase-header h1 {
        margin: 9px 0 0;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: -1px;
      }

      .purchase-header p {
        margin: 8px 0 0;
        color: #7b879d;
        font-size: 14px;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .purchase-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 43px;
        padding: 0 16px;
        border-radius: 11px;
        border: 1px solid transparent;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
        white-space: nowrap;
        transition: .2s;
      }

      .purchase-button.primary {
        color: white;
        background: #17233b;
      }

      .purchase-button.primary:hover {
        background: #0c172c;
        transform: translateY(-1px);
      }

      .purchase-button.secondary {
        color: #475569;
        background: white;
        border-color: #e2e8f0;
      }

      .purchase-button.secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      /* STAT GRID */

      .purchase-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 23px;
      }

      .purchase-stat-card {
        padding: 21px;
        border: 1px solid #e5eaf2;
        border-radius: 17px;
        background: white;
      }

      .stat-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 17px;
      }

      .stat-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        font-size: 17px;
      }

      .purchase-stat-card.blue .stat-icon {
        background: #eaf1ff;
        color: #2563eb;
      }

      .purchase-stat-card.green .stat-icon {
        background: #e8f7ee;
        color: #15803d;
      }

      .purchase-stat-card.orange .stat-icon {
        background: #fff4df;
        color: #c46a09;
      }

      .purchase-stat-card.purple .stat-icon {
        background: #f0eaff;
        color: #7c3aed;
      }

      .stat-top span {
        color: #68758d;
        font-size: 12px;
        font-weight: 700;
      }

      .stat-value {
        display: block;
        font-size: clamp(19px, 2vw, 25px);
        font-weight: 900;
        letter-spacing: -.6px;
        overflow-wrap: anywhere;
      }

      .purchase-stat-card small {
        display: block;
        margin-top: 8px;
        color: #8b98aa;
        font-size: 11px;
      }

      /* SUPPLIER LIST */

      .supplier-list-card,
      .account-information-card,
      .purchase-history-card,
      .supplier-ledger-card {
        background: white;
        border: 1px solid #e5eaf2;
        border-radius: 19px;
        overflow: hidden;
      }

      .list-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        padding: 24px 25px 19px;
      }

      .list-card-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 900;
      }

      .list-card-header p {
        margin: 6px 0 0;
        color: #8b98aa;
        font-size: 12px;
      }

      .supplier-count,
      .bill-count-badge {
        padding: 8px 12px;
        background: #f1f5f9;
        border-radius: 10px;
        color: #475569;
        font-size: 12px;
        font-weight: 800;
      }

      /* SEARCH */

      .supplier-search-toolbar {
        display: flex;
        gap: 10px;
        padding: 0 25px 20px;
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        max-width: 700px;
        min-height: 46px;
        padding: 0 14px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #f8fafc;
        color: #94a3b8;
      }

      .search-box:focus-within {
        background: white;
        border-color: #93b4ff;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, .08);
      }

      .search-box input {
        width: 100%;
        outline: none;
        border: none;
        background: transparent;
        color: #17233b;
        font-size: 13px;
      }

      .search-box input::placeholder {
        color: #94a3b8;
      }

      .clear-search {
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
      }

      .filter-button {
        min-height: 46px;
        padding: 0 15px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e2e8f0;
        border-radius: 11px;
        background: white;
        color: #475569;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      /* TABLE */

      .supplier-table-wrapper {
        overflow-x: auto;
        border-top: 1px solid #e5eaf2;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }

      .supplier-table {
        width: 100%;
        min-width: 0;
        table-layout: fixed;
        border-collapse: collapse;
      }

      .supplier-table th {
        padding: 14px 12px;
        background: #f8fafc;
        text-align: left;
        white-space: nowrap;
        color: #7b879d;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .45px;
      }

      .supplier-table td {
        padding: 14px 12px;
        border-bottom: 1px solid #edf0f5;
        color: #475569;
        font-size: 11px;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .supplier-table th:nth-child(1),
      .supplier-table td:nth-child(1) { width: 112px; }
      .supplier-table th:nth-child(2),
      .supplier-table td:nth-child(2) { width: 26%; }
      .supplier-table th:nth-child(3),
      .supplier-table td:nth-child(3) { width: 72px; }
      .supplier-table th:nth-child(4),
      .supplier-table td:nth-child(4),
      .supplier-table th:nth-child(5),
      .supplier-table td:nth-child(5),
      .supplier-table th:nth-child(6),
      .supplier-table td:nth-child(6) { width: 13%; }
      .supplier-table th:nth-child(7),
      .supplier-table td:nth-child(7) { width: 130px; }
      .supplier-table th:nth-child(8),
      .supplier-table td:nth-child(8) { width: 105px; }

      .supplier-table tbody tr {
        cursor: pointer;
        transition: background .15s;
      }

      .supplier-table tbody tr:hover {
        background: #f8fbff;
      }

      .supplier-table tbody tr:last-child td {
        border-bottom: none;
      }

      .supplier-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .supplier-name-block {
        min-width: 0;
        overflow: hidden;
      }

      .supplier-name-block strong,
      .supplier-name-block span,
      .supplier-name-block small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .supplier-avatar {
        width: 41px;
        height: 41px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        border-radius: 12px;
        background: #eaf1ff;
        color: #2563eb;
        font-size: 16px;
        font-weight: 900;
      }

      .supplier-avatar.large {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        font-size: 24px;
      }

      .supplier-name-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .supplier-name-block strong {
        color: #17233b;
        font-size: 13px;
        font-weight: 800;
      }

      .supplier-name-block span {
        color: #718096;
        font-size: 11px;
      }

      .supplier-name-block small {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #8b98aa;
        font-size: 10px;
      }

      .supplier-id-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 11px;
        background: #eef4ff;
        border: 1px solid #dbe7ff;
        border-radius: 9px;
        color: #315fba;
        font-weight: 900;
        letter-spacing: .2px;
      }

      .supplier-id-left {
        min-width: 76px;
        padding: 8px 9px;
        font-size: 11px;
        background: #eef4ff;
        border-color: #d8e5ff;
      }

      .bill-count {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 9px;
        background: #f1f5f9;
        border-radius: 8px;
        font-weight: 700;
      }

      .dark-money {
        color: #17233b;
        font-weight: 800;
      }

      .green-text {
        color: #15803d !important;
      }

      .red-text {
        color: #dc2626 !important;
      }

      .date-cell {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
      }

      .account-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 9px 8px;
        border: 1px solid #dbe4f0;
        border-radius: 9px;
        background: white;
        color: #475569;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        transition: .18s ease;
      }

      .account-button:hover {
        background: #17233b;
        color: white;
        border-color: #17233b;
      }

      /* MOBILE SUPPLIERS */

      .supplier-mobile-list {
        display: none;
      }

      .supplier-mobile-card {
        padding: 17px;
        border-bottom: 1px solid #e5eaf2;
        cursor: pointer;
      }

      .supplier-mobile-card:hover {
        background: #f8fbff;
      }

      .mobile-supplier-top {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: flex-start;
      }

      .mobile-supplier-top .supplier-cell {
        flex: 1;
      }

      .mobile-id-badge {
        flex-shrink: 0;
      }

      .mobile-chevron {
        color: #94a3b8;
        font-size: 20px;
      }

      .mobile-supplier-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 16px;
        padding: 13px 0;
        border-top: 1px solid #edf0f5;
        border-bottom: 1px solid #edf0f5;
      }

      .mobile-supplier-stats div {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mobile-supplier-stats span {
        color: #8b98aa;
        font-size: 10px;
      }

      .mobile-supplier-stats strong {
        font-size: 12px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .mobile-supplier-footer {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 12px;
        color: #7b879d;
        font-size: 10px;
      }

      .mobile-supplier-footer span {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      /* FOOTER */

      .list-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 15px 24px;
        background: #f8fafc;
        border-top: 1px solid #e5eaf2;
        color: #7b879d;
        font-size: 11px;
      }

      .list-footer strong {
        font-size: 12px;
      }

      .purchase-info-note {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 17px;
        padding: 12px 15px;
        background: #eaf1ff;
        border-radius: 11px;
        color: #49658f;
        font-size: 11px;
        line-height: 1.5;
      }

      .purchase-info-note svg {
        flex-shrink: 0;
        font-size: 16px;
      }

      /* EMPTY */

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 65px 20px;
        text-align: center;
      }

      .empty-icon {
        width: 65px;
        height: 65px;
        display: grid;
        place-items: center;
        margin-bottom: 15px;
        background: #f1f5f9;
        border-radius: 19px;
        color: #94a3b8;
        font-size: 25px;
      }

      .empty-state h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 900;
      }

      .empty-state p {
        margin: 8px 0 18px;
        color: #8b98aa;
        font-size: 12px;
      }

      /* ACCOUNT */

      .account-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .back-button {
        display: flex;
        align-items: center;
        gap: 8px;
        border: none;
        background: transparent;
        color: #475569;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .back-button:hover {
        color: #2563eb;
      }

      .supplier-profile {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 25px;
        padding: 27px;
        background: #17233b;
        border-radius: 20px;
        color: white;
      }

      .supplier-profile-left {
        display: flex;
        align-items: flex-start;
        gap: 18px;
        min-width: 0;
      }

      .supplier-profile .supplier-avatar {
        background: rgba(255,255,255,.12);
        color: white;
      }

      .profile-label {
        display: block;
        margin-bottom: 7px;
        color: #9eb0cf;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
      }

      .supplier-profile h1 {
        margin: 0;
        color: white;
        font-size: clamp(22px, 3vw, 30px);
        font-weight: 900;
        overflow-wrap: anywhere;
      }

      .supplier-id {
        margin-top: 7px;
        color: #a9bad5;
        font-size: 12px;
      }

      .supplier-detail-line {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 9px;
        color: #d1dbed;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .supplier-detail-line svg {
        color: #94a9cb;
        flex-shrink: 0;
      }

      .supplier-balance-card {
        min-width: 215px;
        padding: 18px 20px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 15px;
        background: rgba(255,255,255,.05);
      }

      .supplier-balance-card > span {
        color: #a9bad5;
        font-size: 11px;
        font-weight: 700;
      }

      .supplier-balance-card > strong {
        display: block;
        margin-top: 8px;
        font-size: 27px;
        font-weight: 900;
      }

      .balance-red {
        color: #ffbd6b;
      }

      .balance-green {
        color: #75e2a3;
      }

      .balance-status {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 7px;
        color: #a9bad5;
        font-size: 10px;
      }

      /* INFORMATION */

      .account-information-card {
        padding: 23px;
        margin-bottom: 18px;
      }

      .section-heading {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 18px;
        border-bottom: 1px solid #edf0f5;
      }

      .heading-icon {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: #eaf1ff;
        color: #2563eb;
        font-size: 17px;
      }

      .heading-icon.green {
        background: #e8f7ee;
        color: #15803d;
      }

      .section-heading h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 900;
      }

      .section-heading p {
        margin: 4px 0 0;
        color: #8b98aa;
        font-size: 11px;
      }

      .information-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 20px;
        padding-top: 20px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
      }

      .info-item span {
        color: #8b98aa;
        font-size: 10px;
        font-weight: 700;
      }

      .info-item strong {
        color: #17233b;
        font-size: 12px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      /* HISTORY */

      .purchase-history-card {
        margin-bottom: 18px;
      }

      .history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding: 23px;
      }

      .history-header h2 {
        margin: 0;
        font-size: 19px;
        font-weight: 900;
      }

      .history-header p {
        margin: 6px 0 0;
        color: #8b98aa;
        font-size: 11px;
      }

      .history-table-wrapper {
        overflow-x: auto;
        border-top: 1px solid #e5eaf2;
      }

      .history-table {
        width: 100%;
        min-width: 850px;
        border-collapse: collapse;
      }

      .history-table th {
        padding: 14px 17px;
        background: #f8fafc;
        text-align: left;
        color: #7b879d;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .history-table td {
        padding: 16px 17px;
        border-bottom: 1px solid #edf0f5;
        color: #475569;
        font-size: 11px;
        white-space: nowrap;
      }

      .history-table tbody tr:last-child td {
        border-bottom: none;
      }

      .bill-cell {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .bill-icon {
        width: 33px;
        height: 33px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: #eaf1ff;
        color: #2563eb;
      }

      .bill-cell strong {
        color: #17233b;
        font-weight: 800;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 9px;
        border-radius: 20px;
        font-size: 9px;
        font-weight: 800;
      }

      .status-badge.paid {
        background: #e8f7ee;
        color: #15803d;
      }

      .status-badge.partial {
        background: #fff4df;
        color: #c46a09;
      }

      .status-badge.unpaid {
        background: #fee2e2;
        color: #dc2626;
      }

      .table-actions {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .view-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        color: #475569;
        text-decoration: none;
        font-size: 10px;
        font-weight: 800;
      }

      .pay-button {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #17233b;
        color: white;
        text-decoration: none;
        font-size: 10px;
        font-weight: 800;
      }

      /* MOBILE BILL */

      .mobile-bill-list {
        display: none;
      }

      .mobile-bill-card {
        padding: 17px;
        border-bottom: 1px solid #e5eaf2;
      }

      .mobile-bill-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .mobile-bill-header > div {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .mobile-bill-header span {
        color: #8b98aa;
        font-size: 9px;
        font-weight: 800;
      }

      .mobile-bill-header strong {
        color: #17233b;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .mobile-date {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        color: #8b98aa;
        font-size: 10px;
      }

      .mobile-amount-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 15px;
        padding: 13px 0;
        border-top: 1px solid #edf0f5;
        border-bottom: 1px solid #edf0f5;
      }

      .mobile-amount-grid div {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mobile-amount-grid span {
        color: #8b98aa;
        font-size: 10px;
      }

      .mobile-amount-grid strong {
        font-size: 11px;
      }

      .mobile-actions {
        display: flex;
        gap: 9px;
        margin-top: 13px;
      }

      .mobile-actions .purchase-button {
        flex: 1;
      }

      /* LEDGER */

      .supplier-ledger-card {
        padding: 23px;
      }

      .ledger-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding-top: 20px;
      }

      .ledger-grid div {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .ledger-grid span {
        color: #8b98aa;
        font-size: 11px;
      }

      .ledger-grid strong {
        font-size: 20px;
        font-weight: 900;
      }

      /* LOADING */

      .purchase-loading,
      .purchase-state {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        text-align: center;
        color: #64748b;
      }

      .purchase-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: purchase-spin .8s linear infinite;
      }

      @keyframes purchase-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .purchase-state h2 {
        margin: 0;
        color: #17233b;
        font-size: 21px;
      }

      .purchase-state p {
        max-width: 400px;
        color: #8b98aa;
        font-size: 12px;
      }

      .purchase-state-icon {
        width: 60px;
        height: 60px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: #fee2e2;
        color: #dc2626;
        font-size: 25px;
      }

      /* RESPONSIVE */

      @media (max-width: 1100px) {
        .purchase-stat-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .information-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 1050px) and (min-width: 761px) {
        .supplier-table th,
        .supplier-table td {
          padding: 11px 8px;
          font-size: 10px;
        }

        .supplier-table th:nth-child(1),
        .supplier-table td:nth-child(1) { width: 100px; }
        .supplier-table th:nth-child(2),
        .supplier-table td:nth-child(2) { width: 22%; }
        .supplier-table th:nth-child(7),
        .supplier-table td:nth-child(7) { width: 112px; }
        .supplier-table th:nth-child(8),
        .supplier-table td:nth-child(8) { width: 90px; }
        .supplier-id-left { min-width: 68px; font-size: 10px; }
        .supplier-avatar { width: 34px; height: 34px; }
        .supplier-cell { gap: 7px; }
      }

      @media (max-width: 760px) {
        .purchase-container {
          width: calc(100% - 24px);
          padding-top: 20px;
        }

        .purchase-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-actions {
          width: 100%;
        }

        .header-actions .purchase-button {
          flex: 1;
        }

        .purchase-stat-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .purchase-stat-card {
          padding: 15px;
        }

        .stat-value {
          font-size: 18px;
        }

        .list-card-header {
          padding: 19px;
        }

        .supplier-search-toolbar {
          padding: 0 19px 17px;
          flex-direction: column;
        }

        .search-box {
          max-width: none;
        }

        .filter-button {
          justify-content: center;
        }

        .supplier-table-wrapper {
          display: none;
        }

        .supplier-mobile-list {
          display: block;
          border-top: 1px solid #e5eaf2;
        }

        .list-footer {
          flex-direction: column;
          padding: 15px 19px;
        }

        .purchase-info-note {
          line-height: 1.5;
        }

        .supplier-profile {
          flex-direction: column;
          align-items: stretch;
          padding: 20px;
          gap: 20px;
        }

        .supplier-profile-left {
          gap: 13px;
        }

        .supplier-avatar.large {
          width: 52px;
          height: 52px;
          border-radius: 15px;
          font-size: 21px;
        }

        .supplier-profile h1 {
          font-size: 23px;
        }

        .supplier-balance-card {
          min-width: 0;
        }

        .information-grid {
          grid-template-columns: 1fr;
          gap: 15px;
        }

        .account-information-card,
        .supplier-ledger-card {
          padding: 19px;
        }

        .history-header {
          padding: 19px;
        }

        .history-table-wrapper {
          display: none;
        }

        .mobile-bill-list {
          display: block;
          border-top: 1px solid #e5eaf2;
        }

        .ledger-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .ledger-grid div {
          padding-bottom: 14px;
          border-bottom: 1px solid #edf0f5;
        }

        .ledger-grid div:last-child {
          border-bottom: none;
        }

        .ledger-grid strong {
          font-size: 18px;
        }
      }

      @media (max-width: 420px) {
        .purchase-stat-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .stat-value {
          font-size: 16px;
        }

        .header-actions {
          flex-direction: column;
        }

        .header-actions .purchase-button {
          width: 100%;
        }

        .mobile-supplier-stats strong {
          font-size: 10px;
        }

        .mobile-supplier-footer {
          flex-direction: column;
          gap: 8px;
        }

        .mobile-amount-grid {
          gap: 5px;
        }

        .mobile-amount-grid strong {
          font-size: 10px;
        }
      }
    `}</style>
  );
}
