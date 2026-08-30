import React, { useEffect, useState } from "react";

import {
    getAdminDashboard,
    getAdminBusinesses,
    getAdminUsers,
    getSecurityOverview,
    getSecurityEvents,
    getSecurityAI
} from "../../services/adminApi";


// =====================================================
// ADMIN DASHBOARD
// =====================================================

const AdminDashboard = () => {

    // =================================================
    // DASHBOARD STATE
    // =================================================

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


    // =================================================
    // SECURITY STATE
    // =================================================

    const [security, setSecurity] = useState({

        risk: {
            score: 0,
            level: "LOW",
            summary: "Security analysis not loaded."
        },

        statistics: {
            totalEvents: 0,
            failedLogins: 0,
            successfulLogins: 0,
            unauthorizedRequests: 0,
            forbiddenRequests: 0,
            highEvents: 0,
            criticalEvents: 0
        },

        alerts: [],

        suspiciousIPs: [],

        suspiciousUsers: []

    });


    const [securityEvents, setSecurityEvents] = useState([]);

    const [securityLoading, setSecurityLoading] = useState(false);

    const [securityError, setSecurityError] = useState("");


    // =================================================
    // LOAD MAIN DASHBOARD
    // =================================================

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


            // =================================================
            // DASHBOARD
            // =================================================

            const dashboardData =
                dashboardResponse?.data?.data || {};


            setStats({

                users:
                    Number(
                        dashboardData?.users?.total || 0
                    ),

                businesses:
                    Number(
                        dashboardData?.businesses?.total || 0
                    ),

                activeBusinesses:
                    Number(
                        dashboardData?.businesses?.active || 0
                    ),

                inactiveBusinesses:
                    Number(
                        dashboardData?.businesses?.inactive || 0
                    )

            });


            // =================================================
            // BUSINESSES
            // =================================================

            setBusinesses(

                Array.isArray(
                    businessesResponse?.data?.data
                )
                    ? businessesResponse.data.data
                    : []

            );


            // =================================================
            // USERS
            // =================================================

            setUsers(

                Array.isArray(
                    usersResponse?.data?.data
                )
                    ? usersResponse.data.data
                    : []

            );


        }

        catch (err) {

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

            }

            else if (
                err.response?.status === 401
            ) {

                setError(
                    "Please login again."
                );

            }

            else {

                setError(

                    err.response?.data?.message ||

                    "Failed to load admin dashboard."

                );

            }

        }

        finally {

            setLoading(false);

        }

    };


    // =====================================================
    // LOAD SECURITY ENGINE
    // =====================================================

    const loadSecurity = async () => {

        try {

            setSecurityLoading(true);

            setSecurityError("");


            // =================================================
            // IMPORTANT
            //
            // allSettled prevents one 404 from breaking
            // the entire Admin Dashboard.
            // =================================================

            const results = await Promise.allSettled([

                getSecurityAI(),

                getSecurityOverview(),

                getSecurityEvents(100)

            ]);


            // =================================================
            // AI RESULT
            // =================================================

            const aiResult =
                results[0];


            let aiData = {};


            if (
                aiResult?.status === "fulfilled"
            ) {

                aiData =
                    aiResult.value?.data?.data ||

                    aiResult.value?.data ||

                    {};

            }


            // =================================================
            // OVERVIEW RESULT
            // =================================================

            const overviewResult =
                results[1];


            let overviewData = {};


            if (
                overviewResult?.status === "fulfilled"
            ) {

                overviewData =
                    overviewResult.value?.data?.data ||

                    overviewResult.value?.data ||

                    {};

            }


            // =================================================
            // EVENTS RESULT
            // =================================================

            const eventsResult =
                results[2];


            let eventsData = [];


            if (
                eventsResult?.status === "fulfilled"
            ) {

                const responseData =
                    eventsResult.value?.data;


                if (
                    Array.isArray(responseData?.data)
                ) {

                    eventsData =
                        responseData.data;

                }

                else if (
                    Array.isArray(responseData)
                ) {

                    eventsData =
                        responseData;

                }

                else if (
                    Array.isArray(
                        responseData?.events
                    )
                ) {

                    eventsData =
                        responseData.events;

                }

            }


            // =================================================
            // SECURITY RISK
            // =================================================

            const risk =
                aiData?.risk ||

                overviewData?.risk ||

                {

                    score: 0,

                    level: "LOW",

                    summary:
                        "No security analysis available."

                };


            // =================================================
            // SECURITY STATISTICS
            // =================================================

            const statistics =

                aiData?.statistics ||

                overviewData?.statistics ||

                overviewData ||

                {

                    totalEvents: 0,

                    failedLogins: 0,

                    successfulLogins: 0,

                    unauthorizedRequests: 0,

                    forbiddenRequests: 0,

                    highEvents: 0,

                    criticalEvents: 0

                };


            // =================================================
            // ALERTS
            // =================================================

            const alerts =

                Array.isArray(
                    aiData?.alerts
                )

                    ? aiData.alerts

                    : Array.isArray(
                        overviewData?.alerts
                    )

                        ? overviewData.alerts

                        : [];


            // =================================================
            // SUSPICIOUS IPS
            // =================================================

            const suspiciousIPs =

                Array.isArray(
                    aiData?.suspiciousIPs
                )

                    ? aiData.suspiciousIPs

                    : Array.isArray(
                        overviewData?.suspiciousIPs
                    )

                        ? overviewData.suspiciousIPs

                        : [];


            // =================================================
            // SUSPICIOUS USERS
            // =================================================

            const suspiciousUsers =

                Array.isArray(
                    aiData?.suspiciousUsers
                )

                    ? aiData.suspiciousUsers

                    : Array.isArray(
                        overviewData?.suspiciousUsers
                    )

                        ? overviewData.suspiciousUsers

                        : [];


            // =================================================
            // SAVE SECURITY DATA
            // =================================================

            setSecurity({

                risk: {

                    score:
                        Number(
                            risk?.score || 0
                        ),

                    level:
                        String(
                            risk?.level || "LOW"
                        ).toUpperCase(),

                    summary:
                        risk?.summary ||

                        "No security analysis available."

                },


                statistics: {

                    totalEvents:
                        Number(
                            statistics?.totalEvents || 0
                        ),

                    failedLogins:
                        Number(
                            statistics?.failedLogins || 0
                        ),

                    successfulLogins:
                        Number(
                            statistics?.successfulLogins || 0
                        ),

                    unauthorizedRequests:
                        Number(
                            statistics?.unauthorizedRequests || 0
                        ),

                    forbiddenRequests:
                        Number(
                            statistics?.forbiddenRequests || 0
                        ),

                    highEvents:
                        Number(
                            statistics?.highEvents || 0
                        ),

                    criticalEvents:
                        Number(
                            statistics?.criticalEvents || 0
                        )

                },


                alerts,

                suspiciousIPs,

                suspiciousUsers

            });


            setSecurityEvents(
                eventsData
            );


            // =================================================
            // CHECK IF APIs FAILED
            // =================================================

            const failedSecurityRequests =
                results.filter(
                    result =>
                        result.status === "rejected"
                );


            if (
                failedSecurityRequests.length === 3
            ) {

                setSecurityError(
                    "Security API endpoints are not available yet."
                );

            }


        }

        catch (err) {

            console.error(
                "Security Dashboard Error:",
                err
            );

            setSecurityError(
                "Failed to load security engine."
            );

        }

        finally {

            setSecurityLoading(false);

        }

    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadDashboard();

        loadSecurity();

    }, []);


    // =====================================================
    // REFRESH EVERYTHING
    // =====================================================

    const refreshAll = async () => {

        await Promise.allSettled([

            loadDashboard(),

            loadSecurity()

        ]);

    };


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
    // MAIN DASHBOARD ERROR
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
    // DASHBOARD
    // =====================================================

    return (

        <div style={styles.page}>


            {/* =========================================
                HEADER
            ========================================= */}

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
                    onClick={refreshAll}
                    style={styles.refreshButton}
                    disabled={
                        loading ||
                        securityLoading
                    }
                >

                    {securityLoading
                        ? "Analyzing..."
                        : "↻ Refresh"}

                </button>

            </div>


            {/* =========================================
                STAT CARDS
            ========================================= */}

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


            {/* =========================================
                BUSINESSES
            ========================================= */}

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
                                            key={
                                                business.id
                                            }
                                        >

                                            <td style={styles.td}>
                                                #{business.id}
                                            </td>


                                            <td style={styles.td}>

                                                <strong>
                                                    {
                                                        business.business_name
                                                    }
                                                </strong>

                                                <div
                                                    style={
                                                        styles.smallText
                                                    }
                                                >
                                                    {
                                                        business.business_type
                                                    }
                                                </div>

                                            </td>


                                            <td style={styles.td}>

                                                {
                                                    business.owner_name ||

                                                    business.user_name ||

                                                    "-"
                                                }

                                            </td>


                                            <td style={styles.td}>

                                                {
                                                    business.email ||

                                                    business.user_email ||

                                                    "-"
                                                }

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

                                                    {
                                                        business.status ||
                                                        "active"
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

            </div>


            {/* =========================================
                USERS
            ========================================= */}

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
                                                {
                                                    user.full_name ||
                                                    "-"
                                                }
                                            </td>


                                            <td style={styles.td}>
                                                {
                                                    user.email ||
                                                    "-"
                                                }
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
                                                    {
                                                        user.role ||
                                                        "user"
                                                    }
                                                </span>

                                            </td>


                                            <td style={styles.td}>

                                                {
                                                    user.created_at

                                                        ? new Date(
                                                            user.created_at
                                                        ).toLocaleDateString()

                                                        : "-"
                                                }

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =========================================
                SECURITY ENGINE
            ========================================= */}

            <div style={styles.securitySection}>


                {/* SECURITY HEADER */}

                <div style={styles.securityHeader}>

                    <div>

                        <div style={styles.securityTitleRow}>

                            <span style={styles.securityShield}>
                                🛡️
                            </span>

                            <h2 style={styles.securityTitle}>
                                Security Engine
                            </h2>

                        </div>


                        <p style={styles.securitySubtitle}>
                            AI-powered security monitoring · Last 24 hours
                        </p>

                    </div>


                    <button
                        onClick={loadSecurity}
                        style={styles.securityAnalyzeButton}
                        disabled={securityLoading}
                    >

                        {securityLoading
                            ? "Analyzing..."
                            : "↻ Analyze"}

                    </button>

                </div>


                {/* =====================================
                    SECURITY API ERROR
                ===================================== */}

                {securityError && (

                    <div style={styles.securityWarning}>

                        ⚠️ {securityError}

                    </div>

                )}


                {/* =====================================
                    RISK PANEL
                ===================================== */}

                <div style={styles.riskPanel}>


                    <div style={styles.riskLeft}>

                        <div style={styles.riskLabel}>
                            SECURITY RISK
                        </div>


                        <div style={styles.riskScore}>

                            {
                                security.risk.score
                            }

                            <span style={styles.riskOutOf}>
                                /100
                            </span>

                        </div>


                        <span
                            style={{
                                ...styles.riskLevel,

                                ...(security.risk.level ===
                                "CRITICAL"

                                    ? styles.riskCritical

                                    : security.risk.level ===
                                      "HIGH"

                                        ? styles.riskHigh

                                        : security.risk.level ===
                                          "MEDIUM"

                                            ? styles.riskMedium

                                            : styles.riskLow)
                            }}
                        >

                            {
                                security.risk.level
                            }

                        </span>

                    </div>


                    <div style={styles.riskSummary}>

                        <h3>
                            Security Analysis
                        </h3>

                        <p>
                            {
                                security.risk.summary ||
                                "No security summary available."
                            }
                        </p>

                    </div>

                </div>


                {/* =====================================
                    SECURITY STATISTICS
                ===================================== */}

                <div style={styles.securityCards}>

                    <SecurityCard
                        title="Total Events"
                        value={
                            security.statistics.totalEvents
                        }
                        icon="📊"
                    />


                    <SecurityCard
                        title="Failed Logins"
                        value={
                            security.statistics.failedLogins
                        }
                        icon="🔐"
                    />


                    <SecurityCard
                        title="Successful Logins"
                        value={
                            security.statistics.successfulLogins
                        }
                        icon="✅"
                    />


                    <SecurityCard
                        title="Unauthorized"
                        value={
                            security.statistics.unauthorizedRequests
                        }
                        icon="🚫"
                    />


                    <SecurityCard
                        title="Forbidden"
                        value={
                            security.statistics.forbiddenRequests
                        }
                        icon="⛔"
                    />


                    <SecurityCard
                        title="High Events"
                        value={
                            security.statistics.highEvents
                        }
                        icon="⚠️"
                    />


                    <SecurityCard
                        title="Critical Events"
                        value={
                            security.statistics.criticalEvents
                        }
                        icon="🚨"
                    />

                </div>


                {/* =====================================
                    SECURITY ALERTS
                ===================================== */}

                <div style={styles.securityBlock}>

                    <div style={styles.securityBlockHeader}>

                        <h3 style={styles.securityHeading}>
                            🚨 Security Alerts
                        </h3>

                        <span style={styles.securityCount}>
                            {security.alerts.length}
                        </span>

                    </div>


                    {security.alerts.length === 0 ? (

                        <div style={styles.noAlert}>

                            <span style={styles.successIcon}>
                                ✓
                            </span>

                            No active security alerts

                        </div>

                    ) : (

                        security.alerts.map(
                            (alert, index) => (

                                <div
                                    key={index}
                                    style={styles.alert}
                                >

                                    <div style={styles.alertTop}>

                                        <strong>
                                            {
                                                alert.title ||
                                                "Security Alert"
                                            }
                                        </strong>


                                        <span
                                            style={{
                                                ...styles.severity,

                                                ...(String(
                                                    alert.severity ||
                                                    "medium"
                                                ).toLowerCase() ===
                                                "critical"

                                                    ? styles.severityCritical

                                                    : String(
                                                        alert.severity ||
                                                        "medium"
                                                    ).toLowerCase() ===
                                                      "high"

                                                        ? styles.severityHigh

                                                        : styles.severityMedium)
                                            }}
                                        >
                                            {
                                                alert.severity ||
                                                "medium"
                                            }
                                        </span>

                                    </div>


                                    <p style={styles.alertMessage}>
                                        {
                                            alert.message ||
                                            "Security activity detected."
                                        }
                                    </p>


                                    {alert.recommendation && (

                                        <div
                                            style={
                                                styles.recommendation
                                            }
                                        >

                                            <strong>
                                                Recommendation:
                                            </strong>{" "}

                                            {
                                                alert.recommendation
                                            }

                                        </div>

                                    )}

                                </div>

                            )
                        )

                    )}

                </div>


                {/* =====================================
                    SUSPICIOUS IPs
                ===================================== */}

                <div style={styles.securityBlock}>

                    <div style={styles.securityBlockHeader}>

                        <h3 style={styles.securityHeading}>
                            🌐 Suspicious IP Addresses
                        </h3>

                        <span style={styles.securityCount}>
                            {
                                security.suspiciousIPs.length
                            }
                        </span>

                    </div>


                    {security.suspiciousIPs.length === 0 ? (

                        <div style={styles.noAlert}>
                            No suspicious IP addresses detected.
                        </div>

                    ) : (

                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            IP Address
                                        </th>

                                        <th style={styles.th}>
                                            Failed Logins
                                        </th>

                                        <th style={styles.th}>
                                            Total Events
                                        </th>

                                        <th style={styles.th}>
                                            Affected Users
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {security.suspiciousIPs.map(
                                        (item, index) => (

                                            <tr key={index}>

                                                <td style={styles.td}>

                                                    <strong>
                                                        {
                                                            item.ip ||
                                                            "-"
                                                        }
                                                    </strong>

                                                </td>


                                                <td style={styles.td}>

                                                    <span
                                                        style={
                                                            styles.failedBadge
                                                        }
                                                    >
                                                        {
                                                            item.failedLogins ||
                                                            0
                                                        }
                                                    </span>

                                                </td>


                                                <td style={styles.td}>
                                                    {
                                                        item.totalEvents ||
                                                        0
                                                    }
                                                </td>


                                                <td style={styles.td}>
                                                    {
                                                        item.affectedUsers ||
                                                        0
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>


                {/* =====================================
                    SUSPICIOUS USERS
                ===================================== */}

                <div style={styles.securityBlock}>

                    <div style={styles.securityBlockHeader}>

                        <h3 style={styles.securityHeading}>
                            👤 Suspicious Users
                        </h3>

                        <span style={styles.securityCount}>
                            {
                                security.suspiciousUsers.length
                            }
                        </span>

                    </div>


                    {security.suspiciousUsers.length === 0 ? (

                        <div style={styles.noAlert}>
                            No suspicious users detected.
                        </div>

                    ) : (

                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            User ID
                                        </th>

                                        <th style={styles.th}>
                                            Failed Logins
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {security.suspiciousUsers.map(
                                        (item, index) => (

                                            <tr key={index}>

                                                <td style={styles.td}>
                                                    #{item.userId}
                                                </td>

                                                <td style={styles.td}>

                                                    <span
                                                        style={
                                                            styles.failedBadge
                                                        }
                                                    >
                                                        {
                                                            item.failedLogins ||
                                                            0
                                                        }
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>


                {/* =====================================
                    RECENT SECURITY EVENTS
                ===================================== */}

                <div style={styles.securityBlock}>

                    <div style={styles.securityBlockHeader}>

                        <h3 style={styles.securityHeading}>
                            📋 Recent Security Events
                        </h3>

                        <span style={styles.securityCount}>
                            {
                                securityEvents.length
                            }
                        </span>

                    </div>


                    {securityEvents.length === 0 ? (

                        <div style={styles.noAlert}>
                            No security events found.
                        </div>

                    ) : (

                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            Event
                                        </th>

                                        <th style={styles.th}>
                                            Severity
                                        </th>

                                        <th style={styles.th}>
                                            IP Address
                                        </th>

                                        <th style={styles.th}>
                                            Status
                                        </th>

                                        <th style={styles.th}>
                                            Time
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {securityEvents.map(
                                        (event) => (

                                            <tr
                                                key={
                                                    event.id
                                                }
                                            >

                                                <td style={styles.td}>

                                                    <strong>
                                                        {
                                                            event.event_type ||
                                                            "-"
                                                        }
                                                    </strong>


                                                    <div
                                                        style={
                                                            styles.smallText
                                                        }
                                                    >
                                                        {
                                                            event.endpoint ||
                                                            "-"
                                                        }
                                                    </div>

                                                </td>


                                                <td style={styles.td}>

                                                    <span
                                                        style={{
                                                            ...styles.severity,

                                                            ...(String(
                                                                event.severity ||
                                                                "low"
                                                            ).toLowerCase() ===
                                                            "critical"

                                                                ? styles.severityCritical

                                                                : String(
                                                                    event.severity ||
                                                                    "low"
                                                                ).toLowerCase() ===
                                                                  "high"

                                                                    ? styles.severityHigh

                                                                    : String(
                                                                        event.severity ||
                                                                        "low"
                                                                    ).toLowerCase() ===
                                                                      "medium"

                                                                        ? styles.severityMedium

                                                                        : styles.severityLow)
                                                        }}
                                                    >

                                                        {
                                                            event.severity ||
                                                            "low"
                                                        }

                                                    </span>

                                                </td>


                                                <td style={styles.td}>
                                                    {
                                                        event.ip_address ||
                                                        "-"
                                                    }
                                                </td>


                                                <td style={styles.td}>

                                                    <span
                                                        style={
                                                            Number(
                                                                event.status_code
                                                            ) >= 400

                                                                ? styles.statusError

                                                                : styles.statusSuccess
                                                        }
                                                    >
                                                        {
                                                            event.status_code ||
                                                            "-"
                                                        }
                                                    </span>

                                                </td>


                                                <td style={styles.td}>

                                                    {
                                                        event.created_at

                                                            ? new Date(
                                                                event.created_at
                                                            ).toLocaleString()

                                                            : "-"
                                                    }

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

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
    icon
}) => {

    return (

        <div style={styles.securityCard}>

            <div style={styles.securityIcon}>
                {icon}
            </div>


            <div>

                <div style={styles.securityCardTitle}>
                    {title}
                </div>


                <div style={styles.securityCardValue}>
                    {value}
                </div>

            </div>

        </div>

    );

};


// =====================================================
// STYLES
// =====================================================

const styles = {


    // =================================================
    // PAGE
    // =================================================

    page: {

        minHeight: "100vh",

        padding: "30px",

        background: "#f5f7fb",

        fontFamily:
            "Arial, sans-serif",

        boxSizing: "border-box"

    },


    // =================================================
    // HEADER
    // =================================================

    header: {

        display: "flex",

        justifyContent:
            "space-between",

        alignItems: "center",

        marginBottom: "30px",

        gap: "20px"

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


    // =================================================
    // STAT CARDS
    // =================================================

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
    // SECTION
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

        justifyContent:
            "space-between",

        alignItems: "center",

        borderBottom:
            "1px solid #eee"

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


    // =================================================
    // TABLE
    // =================================================

    tableWrapper: {

        overflowX: "auto",

        width: "100%"

    },


    table: {

        width: "100%",

        borderCollapse: "collapse",

        minWidth: "650px"

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

        borderTop:
            "1px solid #f1f5f9",

        fontSize: "14px"

    },


    smallText: {

        marginTop: "4px",

        color: "#94a3b8",

        fontSize: "12px"

    },


    // =================================================
    // BUSINESS STATUS
    // =================================================

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


    // =================================================
    // USER ROLE
    // =================================================

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


    // =================================================
    // EMPTY
    // =================================================

    empty: {

        textAlign: "center",

        padding: "40px",

        color: "#94a3b8"

    },


    // =================================================
    // CENTER / ERROR
    // =================================================

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

    },


    // =================================================
    // SECURITY SECTION
    // =================================================

    securitySection: {

        background: "#fff",

        borderRadius: "14px",

        marginBottom: "30px",

        boxShadow:
            "0 2px 10px rgba(0,0,0,0.07)",

        overflow: "hidden"

    },


    securityHeader: {

        padding: "22px",

        display: "flex",

        justifyContent:
            "space-between",

        alignItems: "center",

        gap: "20px",

        borderBottom:
            "1px solid #e5e7eb"

    },


    securityTitleRow: {

        display: "flex",

        alignItems: "center",

        gap: "10px"

    },


    securityShield: {

        fontSize: "26px"

    },


    securityTitle: {

        margin: 0,

        fontSize: "21px",

        fontWeight: "700"

    },


    securitySubtitle: {

        margin:
            "6px 0 0",

        color: "#6b7280",

        fontSize: "14px"

    },


    securityAnalyzeButton: {

        border: "none",

        padding: "10px 16px",

        borderRadius: "8px",

        background: "#111827",

        color: "#fff",

        cursor: "pointer",

        fontWeight: "600"

    },


    securityWarning: {

        margin: "20px",

        padding: "14px 16px",

        borderRadius: "9px",

        background: "#fff7ed",

        color: "#9a3412",

        border:
            "1px solid #fed7aa",

        fontSize: "14px"

    },


    // =================================================
    // RISK
    // =================================================

    riskPanel: {

        margin: "20px",

        padding: "24px",

        borderRadius: "14px",

        background: "#f8fafc",

        display: "flex",

        justifyContent:
            "space-between",

        alignItems: "center",

        gap: "30px"

    },


    riskLeft: {

        minWidth: "160px"

    },


    riskLabel: {

        fontSize: "12px",

        color: "#64748b",

        fontWeight: "700",

        letterSpacing: "1px"

    },


    riskScore: {

        fontSize: "42px",

        fontWeight: "800",

        marginTop: "5px",

        lineHeight: "1"

    },


    riskOutOf: {

        fontSize: "18px",

        color: "#94a3b8",

        marginLeft: "3px"

    },


    riskLevel: {

        display: "inline-block",

        marginTop: "12px",

        padding: "6px 14px",

        borderRadius: "20px",

        fontSize: "12px",

        fontWeight: "700"

    },


    riskLow: {

        background: "#dcfce7",

        color: "#166534"

    },


    riskMedium: {

        background: "#fef3c7",

        color: "#92400e"

    },


    riskHigh: {

        background: "#fee2e2",

        color: "#991b1b"

    },


    riskCritical: {

        background: "#450a0a",

        color: "#fff"

    },


    riskSummary: {

        flex: 1,

        maxWidth: "650px",

        color: "#475569"

    },


    riskSummary h3: {

        margin: "0 0 8px",

        color: "#111827"

    },


    riskSummary p: {

        margin: 0,

        lineHeight: "1.6"

    },


    // =================================================
    // SECURITY CARDS
    // =================================================

    securityCards: {

        padding: "0 20px 20px",

        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(155px, 1fr))",

        gap: "12px"

    },


    securityCard: {

        padding: "16px",

        borderRadius: "12px",

        background: "#f8fafc",

        display: "flex",

        alignItems: "center",

        gap: "12px",

        border:
            "1px solid #eef2f7"

    },


    securityIcon: {

        fontSize: "24px"

    },


    securityCardTitle: {

        fontSize: "12px",

        color: "#64748b"

    },


    securityCardValue: {

        fontSize: "24px",

        fontWeight: "700",

        marginTop: "4px"

    },


    // =================================================
    // SECURITY BLOCK
    // =================================================

    securityBlock: {

        margin: "20px",

        border:
            "1px solid #e5e7eb",

        borderRadius: "12px",

        overflow: "hidden"

    },


    securityBlockHeader: {

        padding: "16px",

        background: "#f8fafc",

        display: "flex",

        justifyContent:
            "space-between",

        alignItems: "center",

        gap: "10px"

    },


    securityHeading: {

        margin: 0,

        fontSize: "17px"

    },


    securityCount: {

        minWidth: "28px",

        height: "28px",

        padding: "0 8px",

        borderRadius: "20px",

        background: "#e2e8f0",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        fontSize: "12px",

        fontWeight: "700"

    },


    // =================================================
    // ALERTS
    // =================================================

    noAlert: {

        padding: "20px",

        color: "#64748b",

        fontSize: "14px"

    },


    successIcon: {

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        width: "22px",

        height: "22px",

        marginRight: "7px",

        borderRadius: "50%",

        background: "#dcfce7",

        color: "#166534",

        fontWeight: "700"

    },


    alert: {

        padding: "17px",

        borderTop:
            "1px solid #eee",

        background: "#fff"

    },


    alertTop: {

        display: "flex",

        justifyContent:
            "space-between",

        alignItems: "center",

        gap: "10px"

    },


    alertMessage: {

        margin:
            "9px 0",

        color: "#475569",

        lineHeight: "1.5"

    },


    recommendation: {

        padding: "10px 12px",

        borderRadius: "8px",

        background: "#f8fafc",

        color: "#475569",

        fontSize: "13px"

    },


    // =================================================
    // SEVERITY
    // =================================================

    severity: {

        display: "inline-block",

        padding: "4px 9px",

        borderRadius: "20px",

        fontSize: "11px",

        fontWeight: "700",

        textTransform: "uppercase"

    },


    severityLow: {

        background: "#dcfce7",

        color: "#166534"

    },


    severityMedium: {

        background: "#fef3c7",

        color: "#92400e"

    },


    severityHigh: {

        background: "#fee2e2",

        color: "#991b1b"

    },


    severityCritical: {

        background: "#450a0a",

        color: "#fff"

    },


    // =================================================
    // FAILED LOGIN BADGE
    // =================================================

    failedBadge: {

        display: "inline-block",

        minWidth: "30px",

        padding: "4px 8px",

        borderRadius: "15px",

        background: "#fee2e2",

        color: "#991b1b",

        fontWeight: "700",

        textAlign: "center",

        fontSize: "12px"

    },


    // =================================================
    // HTTP STATUS
    // =================================================

    statusSuccess: {

        display: "inline-block",

        padding: "4px 8px",

        borderRadius: "15px",

        background: "#dcfce7",

        color: "#166534",

        fontSize: "12px",

        fontWeight: "700"

    },


    statusError: {

        display: "inline-block",

        padding: "4px 8px",

        borderRadius: "15px",

        background: "#fee2e2",

        color: "#991b1b",

        fontSize: "12px",

        fontWeight: "700"

    }

};


export default AdminDashboard;