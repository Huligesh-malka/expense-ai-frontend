import React, { useEffect, useState } from "react";
import {
    getAdminDashboard,
    getAdminBusinesses,
    getAdminUsers
} from "../../services/adminApi";

const AdminDashboard = () => {

    const [stats, setStats] = useState({
        users: 0,
        businesses: 0,
        activeBusinesses: 0,
        inactiveBusinesses: 0
    });

    const [businesses, setBusinesses] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // =====================================
    // LOAD DASHBOARD
    // =====================================

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                dashboardResponse,
                businessesResponse,
                usersResponse
            ] = await Promise.all([
                getAdminDashboard(),
                getAdminBusinesses(),
                getAdminUsers()
            ]);


            // Dashboard
            const dashboardData = dashboardResponse.data.data;

            setStats({
                users: dashboardData.users.total,
                businesses: dashboardData.businesses.total,
                activeBusinesses: dashboardData.businesses.active,
                inactiveBusinesses: dashboardData.businesses.inactive
            });


            // Businesses
            setBusinesses(
                businessesResponse.data.data || []
            );


            // Users
            setUsers(
                usersResponse.data.data || []
            );


        } catch (err) {

            console.error("Admin Dashboard Error:", err);

            if (err.response?.status === 403) {

                setError("You are not authorized to access the admin dashboard.");

            } else if (err.response?.status === 401) {

                setError("Please login again.");

            } else {

                setError(
                    err.response?.data?.message ||
                    "Failed to load admin dashboard."
                );
            }

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadDashboard();
    }, []);


    // =====================================
    // LOADING
    // =====================================

    if (loading) {

        return (
            <div style={styles.center}>
                <h3>Loading Admin Dashboard...</h3>
            </div>
        );
    }


    // =====================================
    // ERROR
    // =====================================

    if (error) {

        return (
            <div style={styles.center}>
                <div style={styles.errorBox}>
                    <h3>Access Error</h3>
                    <p>{error}</p>

                    <button
                        onClick={loadDashboard}
                        style={styles.retryButton}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }


    // =====================================
    // DASHBOARD
    // =====================================

    return (
        <div style={styles.page}>

            {/* HEADER */}

            <div style={styles.header}>

                <div>
                    <h1 style={styles.title}>
                        Admin Dashboard
                    </h1>

                    <p style={styles.subtitle}>
                        Manage your application
                    </p>
                </div>

                <button
                    onClick={loadDashboard}
                    style={styles.refreshButton}
                >
                    ↻ Refresh
                </button>

            </div>


            {/* STAT CARDS */}

            <div style={styles.cards}>

                <StatCard
                    title="Total Users"
                    value={stats.users}
                    icon="👤"
                />

                <StatCard
                    title="Total Businesses"
                    value={stats.businesses}
                    icon="🏪"
                />

                <StatCard
                    title="Active Businesses"
                    value={stats.activeBusinesses}
                    icon="🟢"
                />

                <StatCard
                    title="Inactive Businesses"
                    value={stats.inactiveBusinesses}
                    icon="🔴"
                />

            </div>


            {/* BUSINESSES */}

            <div style={styles.section}>

                <div style={styles.sectionHeader}>

                    <div>
                        <h2 style={styles.sectionTitle}>
                            Businesses
                        </h2>

                        <p style={styles.sectionSubtitle}>
                            All registered businesses
                        </p>
                    </div>

                    <span style={styles.count}>
                        {businesses.length}
                    </span>

                </div>


                <div style={styles.tableWrapper}>

                    <table style={styles.table}>

                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Business</th>
                                <th style={styles.th}>Owner</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Location</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            {businesses.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        style={styles.empty}
                                    >
                                        No businesses found.
                                    </td>
                                </tr>

                            ) : (

                                businesses.map((business) => (

                                    <tr key={business.id}>

                                        <td style={styles.td}>
                                            #{business.id}
                                        </td>

                                        <td style={styles.td}>
                                            <strong>
                                                {business.business_name}
                                            </strong>

                                            <div style={styles.smallText}>
                                                {business.business_type}
                                            </div>
                                        </td>

                                        <td style={styles.td}>
                                            {business.owner_name ||
                                                business.user_name ||
                                                "-"}
                                        </td>

                                        <td style={styles.td}>
                                            {business.email ||
                                                business.user_email ||
                                                "-"}
                                        </td>

                                        <td style={styles.td}>
                                            {[
                                                business.city,
                                                business.state
                                            ]
                                                .filter(Boolean)
                                                .join(", ") || "-"}
                                        </td>

                                        <td style={styles.td}>

                                            <span
                                                style={
                                                    business.status === "active"
                                                        ? styles.active
                                                        : styles.inactive
                                                }
                                            >
                                                {business.status}
                                            </span>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* USERS */}

            <div style={styles.section}>

                <div style={styles.sectionHeader}>

                    <div>
                        <h2 style={styles.sectionTitle}>
                            Users
                        </h2>

                        <p style={styles.sectionSubtitle}>
                            Registered application users
                        </p>
                    </div>

                    <span style={styles.count}>
                        {users.length}
                    </span>

                </div>


                <div style={styles.tableWrapper}>

                    <table style={styles.table}>

                        <thead>

                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Created</th>
                            </tr>

                        </thead>

                        <tbody>

                            {users.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="5"
                                        style={styles.empty}
                                    >
                                        No users found.
                                    </td>
                                </tr>

                            ) : (

                                users.map((user) => (

                                    <tr key={user.id}>

                                        <td style={styles.td}>
                                            #{user.id}
                                        </td>

                                        <td style={styles.td}>
                                            {user.full_name}
                                        </td>

                                        <td style={styles.td}>
                                            {user.email}
                                        </td>

                                        <td style={styles.td}>

                                            <span
                                                style={
                                                    user.role === "admin"
                                                        ? styles.adminRole
                                                        : styles.userRole
                                                }
                                            >
                                                {user.role}
                                            </span>

                                        </td>

                                        <td style={styles.td}>
                                            {user.created_at
                                                ? new Date(
                                                    user.created_at
                                                ).toLocaleDateString()
                                                : "-"}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
};


// =====================================
// STAT CARD
// =====================================

const StatCard = ({ title, value, icon }) => {

    return (
        <div style={styles.card}>

            <div style={styles.cardTop}>

                <div style={styles.icon}>
                    {icon}
                </div>

                <span style={styles.cardTitle}>
                    {title}
                </span>

            </div>

            <div style={styles.cardValue}>
                {value}
            </div>

        </div>
    );
};


// =====================================
// STYLES
// =====================================

const styles = {

    page: {
        minHeight: "100vh",
        padding: "30px",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif"
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
    },

    title: {
        margin: 0,
        fontSize: "30px",
        fontWeight: "700"
    },

    subtitle: {
        marginTop: "6px",
        color: "#6b7280"
    },

    refreshButton: {
        border: "none",
        padding: "11px 18px",
        borderRadius: "8px",
        background: "#111827",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600"
    },

    cards: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
        marginBottom: "30px"
    },

    card: {
        background: "#fff",
        borderRadius: "14px",
        padding: "22px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
    },

    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    icon: {
        fontSize: "24px"
    },

    cardTitle: {
        color: "#6b7280",
        fontSize: "14px"
    },

    cardValue: {
        marginTop: "12px",
        fontSize: "32px",
        fontWeight: "700"
    },

    section: {
        background: "#fff",
        borderRadius: "14px",
        marginBottom: "25px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        overflow: "hidden"
    },

    sectionHeader: {
        padding: "22px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #eee"
    },

    sectionTitle: {
        margin: 0,
        fontSize: "20px"
    },

    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "14px"
    },

    count: {
        background: "#f1f5f9",
        padding: "7px 12px",
        borderRadius: "20px",
        fontWeight: "600"
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
        padding: "14px 18px",
        background: "#f8fafc",
        fontSize: "13px",
        color: "#64748b"
    },

    td: {
        padding: "16px 18px",
        borderTop: "1px solid #f1f5f9",
        fontSize: "14px"
    },

    smallText: {
        marginTop: "4px",
        color: "#94a3b8",
        fontSize: "12px"
    },

    active: {
        background: "#dcfce7",
        color: "#166534",
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600"
    },

    inactive: {
        background: "#fee2e2",
        color: "#991b1b",
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600"
    },

    adminRole: {
        background: "#ede9fe",
        color: "#6d28d9",
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600"
    },

    userRole: {
        background: "#e0f2fe",
        color: "#0369a1",
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600"
    },

    empty: {
        textAlign: "center",
        padding: "40px",
        color: "#94a3b8"
    },

    center: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb"
    },

    errorBox: {
        background: "#fff",
        padding: "35px",
        borderRadius: "14px",
        textAlign: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
    },

    retryButton: {
        marginTop: "15px",
        border: "none",
        padding: "10px 20px",
        borderRadius: "8px",
        background: "#111827",
        color: "#fff",
        cursor: "pointer"
    }
};

export default AdminDashboard;