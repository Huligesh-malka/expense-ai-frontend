// services/securityEngine.js

const db = require("../config/db");

// =====================================================
// SECURITY ENGINE
// =====================================================

const analyzeSecurity = async () => {
    try {

        // =================================================
        // LAST 24 HOURS
        // =================================================

        const [events] = await db.query(`
            SELECT
                id,
                user_id,
                event_type,
                severity,
                ip_address,
                endpoint,
                http_method,
                status_code,
                details,
                created_at
            FROM security_events
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
        `);


        // =================================================
        // COUNTERS
        // =================================================

        let failedLogins = 0;
        let successfulLogins = 0;
        let unauthorizedRequests = 0;
        let forbiddenRequests = 0;
        let highEvents = 0;
        let criticalEvents = 0;


        // =================================================
        // IP STATISTICS
        // =================================================

        const ipStats = {};


        // =================================================
        // USER STATISTICS
        // =================================================

        const userStats = {};


        // =================================================
        // PROCESS EVENTS
        // =================================================

        for (const event of events) {

            const eventType =
                String(event.event_type || "").toUpperCase();

            const severity =
                String(event.severity || "").toLowerCase();

            const ip =
                event.ip_address || "unknown";

            const userId =
                event.user_id || "unknown";


            // =================================================
            // LOGIN COUNTERS
            // =================================================

            if (
                eventType === "LOGIN_FAILED"
            ) {
                failedLogins++;
            }


            if (
                eventType === "LOGIN_SUCCESS"
            ) {
                successfulLogins++;
            }


            // =================================================
            // HTTP SECURITY COUNTERS
            // =================================================

            if (Number(event.status_code) === 401) {
                unauthorizedRequests++;
            }


            if (Number(event.status_code) === 403) {
                forbiddenRequests++;
            }


            // =================================================
            // SEVERITY COUNTERS
            // =================================================

            if (severity === "high") {
                highEvents++;
            }


            if (severity === "critical") {
                criticalEvents++;
            }


            // =================================================
            // IP TRACKING
            // =================================================

            if (!ipStats[ip]) {

                ipStats[ip] = {
                    ip,
                    failedLogins: 0,
                    totalEvents: 0,
                    users: new Set()
                };

            }


            ipStats[ip].totalEvents++;


            if (userId !== "unknown") {
                ipStats[ip].users.add(
                    String(userId)
                );
            }


            if (
                eventType === "LOGIN_FAILED"
            ) {
                ipStats[ip].failedLogins++;
            }


            // =================================================
            // USER TRACKING
            // =================================================

            if (userId !== "unknown") {

                if (!userStats[userId]) {

                    userStats[userId] = {
                        userId,
                        failedLogins: 0
                    };

                }


                if (
                    eventType === "LOGIN_FAILED"
                ) {

                    userStats[userId].failedLogins++;

                }

            }

        }


        // =================================================
        // SECURITY ALERTS
        // =================================================

        const alerts = [];


        // =================================================
        // BRUTE FORCE DETECTION
        // =================================================

        if (failedLogins >= 5) {

            alerts.push({

                type: "BRUTE_FORCE",

                severity: "high",

                title:
                    "Possible brute-force attack",

                message:
                    `${failedLogins} failed login attempts detected in the last 24 hours.`,

                recommendation:
                    "Review the affected accounts and source IP addresses."

            });

        }


        // =================================================
        // SAME IP ATTACKING MULTIPLE USERS
        // =================================================

        for (
            const ip of Object.values(ipStats)
        ) {

            const affectedUsers =
                ip.users.size;


            if (
                ip.failedLogins >= 5 &&
                affectedUsers >= 2
            ) {

                alerts.push({

                    type:
                        "MULTI_ACCOUNT_ATTACK",

                    severity:
                        "critical",

                    title:
                        "Multiple-account attack detected",

                    message:
                        `IP ${ip.ip} generated ${ip.failedLogins} failed login attempts against ${affectedUsers} accounts.`,

                    recommendation:
                        "Investigate this IP address immediately."

                });

            }

        }


        // =================================================
        // MANY 401 REQUESTS
        // =================================================

        if (
            unauthorizedRequests >= 10
        ) {

            alerts.push({

                type:
                    "UNAUTHORIZED_ACTIVITY",

                severity:
                    "high",

                title:
                    "Repeated unauthorized requests",

                message:
                    `${unauthorizedRequests} HTTP 401 responses detected.`,

                recommendation:
                    "Check for invalid or abused authentication tokens."

            });

        }


        // =================================================
        // MANY 403 REQUESTS
        // =================================================

        if (
            forbiddenRequests >= 5
        ) {

            alerts.push({

                type:
                    "FORBIDDEN_ACTIVITY",

                severity:
                    "high",

                title:
                    "Repeated forbidden requests",

                message:
                    `${forbiddenRequests} HTTP 403 responses detected.`,

                recommendation:
                    "Investigate possible unauthorized access attempts."

            });

        }


        // =================================================
        // CRITICAL EVENTS
        // =================================================

        if (
            criticalEvents > 0
        ) {

            alerts.push({

                type:
                    "CRITICAL_EVENT",

                severity:
                    "critical",

                title:
                    "Critical security events detected",

                message:
                    `${criticalEvents} critical security event(s) recorded.`,

                recommendation:
                    "Review critical events immediately."

            });

        }


        // =================================================
        // RISK SCORE
        // =================================================

        let riskScore = 0;


        riskScore +=
            failedLogins * 3;


        riskScore +=
            unauthorizedRequests * 2;


        riskScore +=
            forbiddenRequests * 4;


        riskScore +=
            highEvents * 5;


        riskScore +=
            criticalEvents * 15;


        // Maximum 100

        riskScore =
            Math.min(100, riskScore);


        // =================================================
        // RISK LEVEL
        // =================================================

        let riskLevel = "LOW";


        if (riskScore >= 25) {
            riskLevel = "MEDIUM";
        }


        if (riskScore >= 50) {
            riskLevel = "HIGH";
        }


        if (riskScore >= 75) {
            riskLevel = "CRITICAL";
        }


        // =================================================
        // SUSPICIOUS IPS
        // =================================================

        const suspiciousIPs =
            Object.values(ipStats)
                .filter(
                    item =>
                        item.failedLogins >= 3
                )
                .map(item => ({

                    ip:
                        item.ip,

                    failedLogins:
                        item.failedLogins,

                    totalEvents:
                        item.totalEvents,

                    affectedUsers:
                        item.users.size

                }))
                .sort(
                    (a, b) =>
                        b.failedLogins -
                        a.failedLogins
                );


        // =================================================
        // SUSPICIOUS USERS
        // =================================================

        const suspiciousUsers =
            Object.values(userStats)
                .filter(
                    item =>
                        item.failedLogins >= 3
                )
                .sort(
                    (a, b) =>
                        b.failedLogins -
                        a.failedLogins
                );


        // =================================================
        // SECURITY SUMMARY
        // =================================================

        let summary =
            "No significant security threats detected.";


        if (
            riskLevel === "MEDIUM"
        ) {

            summary =
                "Some unusual security activity was detected. Review the security alerts.";

        }


        if (
            riskLevel === "HIGH"
        ) {

            summary =
                "High-risk security activity detected. Administrator investigation is recommended.";

        }


        if (
            riskLevel === "CRITICAL"
        ) {

            summary =
                "Critical security activity detected. Immediate administrator investigation is recommended.";

        }


        // =================================================
        // FINAL RESULT
        // =================================================

        return {

            success: true,

            generatedAt:
                new Date().toISOString(),

            timeWindow:
                "Last 24 hours",

            risk: {

                score:
                    riskScore,

                level:
                    riskLevel,

                summary

            },

            statistics: {

                totalEvents:
                    events.length,

                failedLogins,

                successfulLogins,

                unauthorizedRequests,

                forbiddenRequests,

                highEvents,

                criticalEvents

            },

            alerts,

            suspiciousIPs,

            suspiciousUsers

        };

    } catch (err) {

        console.error(
            "Security Engine Error:",
            err
        );

        throw err;

    }
};


module.exports = {
    analyzeSecurity
};