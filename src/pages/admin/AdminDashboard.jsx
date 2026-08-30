import React, {
    useEffect,
    useState
} from "react";

import {
    getAdminDashboard,
    getAdminBusinesses,
    getAdminUsers,
    getSecurityOverview,
    getSecurityEvents,
    getSecurityAI
} from "../../services/adminApi";


const AdminDashboard = () => {

    // =====================================================
    // ADMIN DATA
    // =====================================================

    const [stats, setStats] = useState({
        users: 0,
        businesses: 0,
        activeBusinesses: 0,
        inactiveBusinesses: 0
    });

    const [businesses, setBusinesses] =
        useState([]);

    const [users, setUsers] =
        useState([]);


    // =====================================================
    // SECURITY DATA
    // =====================================================

    const [security, setSecurity] = useState({
        totalEvents: 0,
        failedLogins: 0,
        successfulLogins: 0,
        unauthorizedRequests: 0,
        forbiddenRequests: 0,
        highEvents: 0,
        criticalEvents: 0
    });


    const [securityAI, setSecurityAI] =
        useState(null);


    const [securityEvents, setSecurityEvents] =
        useState([]);


    const [securityLoading, setSecurityLoading] =
        useState(false);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD SECURITY
    // =====================================================

    const loadSecurity = async () => {

        try {

            setSecurityLoading(true);


            const [
                overviewResponse,
                eventsResponse,
                aiResponse
            ] = await Promise.all([

                getSecurityOverview(),

                getSecurityEvents(100),

                getSecurityAI()

            ]);


            // =============================================
            // OVERVIEW
            // =============================================

            const overview =
                overviewResponse?.data?.data || {};


            setSecurity({

                totalEvents:
                    Number(
                        overview.totalEvents || 0
                    ),

                failedLogins:
                    Number(
                        overview.failedLogins || 0
                    ),

                successfulLogins:
                    Number(
                        overview.successfulLogins || 0
                    ),

                unauthorizedRequests:
                    Number(
                        overview.unauthorizedRequests || 0
                    ),

                forbiddenRequests:
                    Number(
                        overview.forbiddenRequests || 0
                    ),

                highEvents:
                    Number(
                        overview.highEvents || 0
                    ),

                criticalEvents:
                    Number(
                        overview.criticalEvents || 0
                    )

            });


            // =============================================
            // EVENTS
            // =============================================

            setSecurityEvents(
                eventsResponse?.data?.data || []
            );


            // =============================================
            // AI
            // =============================================

            setSecurityAI(
                aiResponse?.data || null
            );


        } catch (err) {

            console.error(
                "Security Dashboard Error:",
                err
            );

            // Security failure should not destroy
            // the normal admin dashboard.

        } finally {

            setSecurityLoading(false);

        }

    };


    // =====================================================
    // LOAD ADMIN DASHBOARD
    // =====================================================

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


            // =============================================
            // DASHBOARD
            // =============================================

            const dashboardData =
                dashboardResponse.data.data;


            setStats({

                users:
                    Number(
                        dashboardData.users.total || 0
                    ),

                businesses:
                    Number(
                        dashboardData.businesses.total || 0
                    ),

                activeBusinesses:
                    Number(
                        dashboardData.businesses.active || 0
                    ),

                inactiveBusinesses:
                    Number(
                        dashboardData.businesses.inactive || 0
                    )

            });


            // =============================================
            // BUSINESSES
            // =============================================

            setBusinesses(
                businessesResponse.data.data || []
            );


            // =============================================
            // USERS
            // =============================================

            setUsers(
                usersResponse.data.data || []
            );


            // =============================================
            // SECURITY
            // =============================================

            await loadSecurity();


        } catch (err) {

            console.error(
                "Admin Dashboard Error:",
                err
            );


            if (
                err.response?.status === 403
            ) {

                setError(
                    "You are not authorized to access the admin dashboard."
                );

            } else if (
                err.response?.status === 401
            ) {

                setError(
                    "Please login again."
                );

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


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadDashboard();

    }, []);


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div style={styles.center}>

                <h3>
                    Loading Admin Dashboard...
                </h3>

            </div>

        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div style={styles.center}>

                <div style={styles.errorBox}>

                    <h3>
                        Access Error
                    </h3>

                    <p>
                        {error}
                    </p>

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


    // =====================================================
    // AI RISK
    // =====================================================

    const risk =
        securityAI?.risk || {};


    const riskScore =
        Number(risk.score || 0);


    const riskLevel =
        risk.level || "LOW";


    // =====================================================
    // DASHBOARD
    // =====================================================

    return (

        <div style={styles.page}>

            {/* =================================================
                HEADER
            ================================================= */}

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


            {/* =================================================
                NORMAL ADMIN STATISTICS
            ================================================= */}

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


            {/* =================================================
                SECURITY ENGINE
            ================================================= */}

            <div style={styles.securitySection}>

                <div style={styles.securityHeader}>

                    <div>

                        <h2 style={styles.securityTitle}>
                            🛡️ Security AI Engine
                        </h2>

                        <p style={styles.securitySubtitle}>
                            Backend security analysis — last 24 hours
                        </p>

                    </div>


                    <button
                        onClick={loadSecurity}
                        disabled={securityLoading}
                        style={styles.securityRefresh}
                    >
                        {securityLoading
                            ? "Checking..."
                            : "↻ Security Refresh"}
                    </button>

                </div>


                {/* =================================================
                    RISK PANEL
                ================================================= */}

                <div style={styles.riskGrid}>

                    <div style={styles.riskCard}>

                        <div style={styles.riskLabel}>
                            Security Risk
                        </div>

                        <div
                            style={{
                                ...styles.riskScore,
                                color:
                                    getRiskColor(
                                        riskLevel
                                    )
                            }}
                        >
                            {riskScore}
                        </div>

                        <div
                            style={{
                                ...styles.riskBadge,
                                background:
                                    getRiskBackground(
                                        riskLevel
                                    ),
                                color:
                                    getRiskColor(
                                        riskLevel
                                    )
                            }}
                        >
                            {riskLevel}
                        </div>

                    </div>


                    <div style={styles.summaryCard}>

                        <div style={styles.summaryTitle}>
                            Security Analysis
                        </div>

                        <p style={styles.summaryText}>

                            {risk.summary ||
                                "No security analysis available."}

                        </p>

                        <div style={styles.timeWindow}>
                            Analysis window:{" "}
                            {securityAI?.timeWindow ||
                                "Last 24 hours"}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    SECURITY STATISTICS
                ================================================= */}

                <div style={styles.securityCards}>

                    <SecurityCard
                        title="Security Events"
                        value={security.totalEvents}
                        icon="📋"
                    />

                    <SecurityCard
                        title="Failed Logins"
                        value={security.failedLogins}
                        icon="🔑"
                        danger={security.failedLogins > 0}
                    />

                    <SecurityCard
                        title="Successful Logins"
                        value={security.successfulLogins}
                        icon="✅"
                    />

                    <SecurityCard
                        title="401 Requests"
                        value={security.unauthorizedRequests}
                        icon="🚫"
                    />

                    <SecurityCard
                        title="403 Requests"
                        value={security.forbiddenRequests}
                        icon="⛔"
                    />

                    <SecurityCard
                        title="High Events"
                        value={security.highEvents}
                        icon="⚠️"
                    />

                    <SecurityCard
                        title="Critical Events"
                        value={security.criticalEvents}
                        icon="🚨"
                        danger={security.criticalEvents > 0}
                    />

                </div>


                {/* =================================================
                    AI ALERTS
                ================================================= */}

                <div style={styles.aiPanel}>

                    <div style={styles.aiPanelHeader}>

                        <div>

                            <h3 style={styles.aiTitle}>
                                🤖 Security Alerts
                            </h3>

                            <p style={styles.aiSubtitle}>
                                Detected by backend security engine
                            </p>

                        </div>

                        <span style={styles.alertCount}>
                            {securityAI?.alerts?.length || 0}
                        </span>

                    </div>


                    {securityAI?.alerts?.length === 0 ? (

                        <div style={styles.noAlerts}>

                            🟢 No active security alerts

                        </div>

                    ) : (

                        <div>

                            {securityAI.alerts.map(
                                (alert, index) => (

                                    <div
                                        key={index}
                                        style={{
                                            ...styles.alert,
                                            borderLeft:
                                                `5px solid ${getRiskColor(alert.severity)}`
                                        }}
                                    >

                                        <div style={styles.alertTop}>

                                            <strong>
                                                {alert.title}
                                            </strong>

                                            <span
                                                style={{
                                                    ...styles.alertSeverity,
                                                    color:
                                                        getRiskColor(
                                                            alert.severity
                                                        )
                                                }}
                                            >
                                                {String(
                                                    alert.severity
                                                ).toUpperCase()}
                                            </span>

                                        </div>


                                        <p style={styles.alertMessage}>
                                            {alert.message}
                                        </p>


                                        <div style={styles.recommendation}>

                                            <strong>
                                                Recommendation:
                                            </strong>{" "}

                                            {alert.recommendation}

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    SUSPICIOUS IPs
                ================================================= */}

                <div style={styles.twoColumn}>

                    <div style={styles.securityBox}>

                        <div style={styles.boxHeader}>

                            <div>

                                <h3 style={styles.boxTitle}>
                                    🌐 Suspicious IPs
                                </h3>

                                <p style={styles.boxSubtitle}>
                                    Repeated failed login activity
                                </p>

                            </div>

                        </div>


                        {(
                            securityAI?.suspiciousIPs || []
                        ).length === 0 ? (

                            <div style={styles.emptySecurity}>
                                No suspicious IPs detected.
                            </div>

                        ) : (

                            <div style={styles.list}>

                                {securityAI.suspiciousIPs
                                    .slice(0, 10)
                                    .map((item, index) => (

                                        <div
                                            key={index}
                                            style={styles.listItem}
                                        >

                                            <div>

                                                <strong>
                                                    {item.ip}
                                                </strong>

                                                <div
                                                    style={
                                                        styles.smallSecurityText
                                                    }
                                                >
                                                    {item.totalEvents} events
                                                </div>

                                            </div>


                                            <div
                                                style={
                                                    styles.failedBadge
                                                }
                                            >
                                                {item.failedLogins}
                                                {" "}failed
                                            </div>

                                        </div>

                                    ))}

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        SUSPICIOUS USERS
                    ================================================= */}

                    <div style={styles.securityBox}>

                        <div style={styles.boxHeader}>

                            <div>

                                <h3 style={styles.boxTitle}>
                                    👤 Suspicious Users
                                </h3>

                                <p style={styles.boxSubtitle}>
                                    Repeated failed authentication
                                </p>

                            </div>

                        </div>


                        {(
                            securityAI?.suspiciousUsers || []
                        ).length === 0 ? (

                            <div style={styles.emptySecurity}>
                                No suspicious users detected.
                            </div>

                        ) : (

                            <div style={styles.list}>

                                {securityAI.suspiciousUsers
                                    .slice(0, 10)
                                    .map((item, index) => (

                                        <div
                                            key={index}
                                            style={styles.listItem}
                                        >

                                            <div>

                                                <strong>
                                                    User #{item.userId}
                                                </strong>

                                            </div>

                                            <div
                                                style={
                                                    styles.failedBadge
                                                }
                                            >
                                                {item.failedLogins}
                                                {" "}failed
                                            </div>

                                        </div>

                                    ))}

                            </div>

                        )}

                    </div>

                </div>


                {/* =================================================
                    RECENT SECURITY EVENTS
                ================================================= */}

                <div style={styles.securityBox}>

                    <div style={styles.boxHeader}>

                        <div>

                            <h3 style={styles.boxTitle}>
                                📋 Recent Security Events
                            </h3>

                            <p style={styles.boxSubtitle}>
                                Latest events recorded by backend
                            </p>

                        </div>

                        <span style={styles.eventCount}>
                            {securityEvents.length}
                        </span>

                    </div>


                    <div style={styles.tableWrapper}>

                        <table style={styles.table}>

                            <thead>

                                <tr>

                                    <th style={styles.th}>
                                        Time
                                    </th>

                                    <th style={styles.th}>
                                        Event
                                    </th>

                                    <th style={styles.th}>
                                        Severity
                                    </th>

                                    <th style={styles.th}>
                                        User
                                    </th>

                                    <th style={styles.th}>
                                        IP Address
                                    </th>

                                    <th style={styles.th}>
                                        Status
                                    </th>

                                    <th style={styles.th}>
                                        Endpoint
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {securityEvents.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            style={styles.empty}
                                        >
                                            No security events found.
                                        </td>

                                    </tr>

                                ) : (

                                    securityEvents
                                        .slice(0, 50)
                                        .map((event) => (

                                            <tr key={event.id}>

                                                <td style={styles.td}>
                                                    {formatDate(
                                                        event.created_at
                                                    )}
                                                </td>

                                                <td style={styles.td}>

                                                    <strong>
                                                        {event.event_type}
                                                    </strong>

                                                    {getEventReason(
                                                        event
                                                    ) && (

                                                        <div
                                                            style={
                                                                styles.smallText
                                                            }
                                                        >
                                                            {getEventReason(
                                                                event
                                                            )}
                                                        </div>

                                                    )}

                                                </td>

                                                <td style={styles.td}>

                                                    <span
                                                        style={{
                                                            ...styles.severityBadge,
                                                            background:
                                                                getSeverityBackground(
                                                                    event.severity
                                                                ),
                                                            color:
                                                                getRiskColor(
                                                                    event.severity
                                                                )
                                                        }}
                                                    >
                                                        {event.severity}
                                                    </span>

                                                </td>

                                                <td style={styles.td}>
                                                    {event.user_id || "-"}
                                                </td>

                                                <td style={styles.td}>
                                                    {event.ip_address || "-"}
                                                </td>

                                                <td style={styles.td}>
                                                    {event.status_code || "-"}
                                                </td>

                                                <td style={styles.td}>
                                                    {event.endpoint || "-"}
                                                </td>

                                            </tr>

                                        ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>


            {/* =================================================
                BUSINESSES
            ================================================= */}

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

                                <th style={styles.th}>
                                    ID
                                </th>

                                <th style={styles.th}>
                                    Business
                                </th>

                                <th style={styles.th}>
                                    Owner
                                </th>

                                <th style={styles.th}>
                                    Email
                                </th>

                                <th style={styles.th}>
                                    Location
                                </th>

                                <th style={styles.th}>
                                    Status
                                </th>

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

                                businesses.map(
                                    (business) => (

                                        <tr
                                            key={business.id}
                                        >

                                            <td style={styles.td}>
                                                #{business.id}
                                            </td>

                                            <td style={styles.td}>

                                                <strong>
                                                    {business.business_name}
                                                </strong>

                                                <div
                                                    style={
                                                        styles.smallText
                                                    }
                                                >
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
                                                        business.status ===
                                                        "active"
                                                            ? styles.active
                                                            : styles.inactive
                                                    }
                                                >
                                                    {business.status}
                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =================================================
                USERS
            ================================================= */}

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

                                <th style={styles.th}>
                                    ID
                                </th>

                                <th style={styles.th}>
                                    Name
                                </th>

                                <th style={styles.th}>
                                    Email
                                </th>

                                <th style={styles.th}>
                                    Role
                                </th>

                                <th style={styles.th}>
                                    Created
                                </th>

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

                                users.map(
                                    (user) => (

                                        <tr
                                            key={user.id}
                                        >

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
                                                        user.role ===
                                                        "admin"
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

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

};


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
    title,
    value,
    icon
}) => {

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


// =====================================================
// SECURITY CARD
// =====================================================

const SecurityCard = ({
    title,
    value,
    icon,
    danger = false
}) => {

    return (

        <div
            style={{
                ...styles.securityCard,
                borderColor:
                    danger
                        ? "#fecaca"
                        : "#e5e7eb"
            }}
        >

            <div style={styles.securityCardIcon}>
                {icon}
            </div>

            <div>

                <div style={styles.securityCardTitle}>
                    {title}
                </div>

                <div
                    style={{
                        ...styles.securityCardValue,
                        color:
                            danger
                                ? "#dc2626"
                                : "#111827"
                    }}
                >
                    {value}
                </div>

            </div>

        </div>

    );

};


// =====================================================
// RISK COLOR
// =====================================================

const getRiskColor = (level) => {

    const value =
        String(level || "")
            .toLowerCase();


    if (
        value === "critical"
    ) {
        return "#dc2626";
    }


    if (
        value === "high"
    ) {
        return "#ea580c";
    }


    if (
        value === "medium"
    ) {
        return "#ca8a04";
    }


    return "#16a34a";

};


// =====================================================
// RISK BACKGROUND
// =====================================================

const getRiskBackground = (level) => {

    const value =
        String(level || "")
            .toLowerCase();


    if (
        value === "critical"
    ) {
        return "#fee2e2";
    }


    if (
        value === "high"
    ) {
        return "#ffedd5";
    }


    if (
        value === "medium"
    ) {
        return "#fef9c3";
    }


    return "#dcfce7";

};


// =====================================================
// SEVERITY BACKGROUND
// =====================================================

const getSeverityBackground = (severity) => {

    const value =
        String(severity || "")
            .toLowerCase();


    if (
        value === "critical"
    ) {
        return "#fee2e2";
    }


    if (
        value === "high"
    ) {
        return "#ffedd5";
    }


    if (
        value === "medium"
    ) {
        return "#fef9c3";
    }


    return "#dcfce7";

};


// =====================================================
// EVENT REASON
// =====================================================

const getEventReason = (event) => {

    try {

        if (!event.details) {
            return "";
        }


        const details =
            typeof event.details === "string"
                ? JSON.parse(event.details)
                : event.details;


        return details?.reason || "";

    } catch {

        return "";

    }

};


// =====================================================
// DATE FORMAT
// =====================================================

const formatDate = (date) => {

    if (!date) {
        return "-";
    }


    try {

        return new Date(
            date
        ).toLocaleString();

    } catch {

        return "-";

    }

};


// =====================================================
// STYLES
// =====================================================

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
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)"
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


    // =================================================
    // SECURITY
    // =================================================

    securitySection: {
        background: "#ffffff",
        borderRadius: "18px",
        padding: "24px",
        marginBottom: "30px",
        boxShadow:
            "0 3px 15px rgba(0,0,0,0.07)"
    },


    securityHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "22px"
    },


    securityTitle: {
        margin: 0,
        fontSize: "24px"
    },


    securitySubtitle: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "14px"
    },


    securityRefresh: {
        border: "none",
        padding: "10px 15px",
        borderRadius: "8px",
        background: "#111827",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600"
    },


    riskGrid: {
        display: "grid",
        gridTemplateColumns:
            "minmax(200px, 280px) 1fr",
        gap: "18px",
        marginBottom: "20px"
    },


    riskCard: {
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "22px",
        textAlign: "center"
    },


    riskLabel: {
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "600"
    },


    riskScore: {
        fontSize: "54px",
        fontWeight: "800",
        marginTop: "5px"
    },


    riskBadge: {
        display: "inline-block",
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "800"
    },


    summaryCard: {
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "22px"
    },


    summaryTitle: {
        fontWeight: "700",
        fontSize: "18px"
    },


    summaryText: {
        color: "#475569",
        lineHeight: "1.6"
    },


    timeWindow: {
        fontSize: "12px",
        color: "#94a3b8"
    },


    securityCards: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "22px"
    },


    securityCard: {
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "15px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "#fff"
    },


    securityCardIcon: {
        fontSize: "22px"
    },


    securityCardTitle: {
        fontSize: "12px",
        color: "#64748b"
    },


    securityCardValue: {
        fontSize: "24px",
        fontWeight: "700",
        marginTop: "3px"
    },


    aiPanel: {
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        overflow: "hidden",
        marginBottom: "20px"
    },


    aiPanelHeader: {
        padding: "18px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e5e7eb"
    },


    aiTitle: {
        margin: 0,
        fontSize: "18px"
    },


    aiSubtitle: {
        margin: "4px 0 0",
        color: "#64748b",
        fontSize: "13px"
    },


    alertCount: {
        background: "#f1f5f9",
        padding: "7px 12px",
        borderRadius: "20px",
        fontWeight: "700"
    },


    noAlerts: {
        padding: "25px",
        textAlign: "center",
        color: "#16a34a",
        fontWeight: "600"
    },


    alert: {
        padding: "16px 20px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fff"
    },


    alertTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px"
    },


    alertSeverity: {
        fontSize: "11px",
        fontWeight: "800"
    },


    alertMessage: {
        margin: "8px 0",
        color: "#475569"
    },


    recommendation: {
        fontSize: "13px",
        color: "#64748b"
    },


    twoColumn: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
        marginBottom: "20px"
    },


    securityBox: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        overflow: "hidden",
        marginBottom: "20px"
    },


    boxHeader: {
        padding: "18px 20px",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb"
    },


    boxTitle: {
        margin: 0,
        fontSize: "17px"
    },


    boxSubtitle: {
        margin: "5px 0 0",
        color: "#64748b",
        fontSize: "13px"
    },


    emptySecurity: {
        padding: "25px",
        textAlign: "center",
        color: "#94a3b8"
    },


    list: {
        padding: "5px 20px"
    },


    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #f1f5f9"
    },


    smallSecurityText: {
        color: "#94a3b8",
        fontSize: "12px",
        marginTop: "4px"
    },


    failedBadge: {
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "5px 9px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "700"
    },


    eventCount: {
        background: "#f1f5f9",
        padding: "7px 12px",
        borderRadius: "20px",
        fontWeight: "700"
    },


    severityBadge: {
        padding: "5px 9px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "700"
    },


    // =================================================
    // EXISTING SECTIONS
    // =================================================

    section: {
        background: "#fff",
        borderRadius: "14px",
        marginBottom: "25px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
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
        color: "#64748b",
        whiteSpace: "nowrap"
    },


    td: {
        padding: "16px 18px",
        borderTop: "1px solid #f1f5f9",
        fontSize: "14px",
        whiteSpace: "nowrap"
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
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)"
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