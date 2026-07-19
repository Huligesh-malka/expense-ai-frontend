import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user types
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Frontend validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        // Prepare data to send (exclude confirmPassword)
        const { confirmPassword, ...payload } = formData;

        try {
            const res = await API.post("/auth/register", payload);

            if (res.data.success) {
                navigate("/");
            } else {
                setError(res.data.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Server error. Please check your connection."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // --- Styles (same as Login) ---
    const styles = {
        container: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: "20px",
        },
        card: {
            width: "100%",
            maxWidth: "440px",
            padding: "40px 36px",
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
        },
        header: {
            textAlign: "center",
            marginBottom: "28px",
        },
        logo: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            borderRadius: "16px",
            marginBottom: "16px",
            fontSize: "30px",
            fontWeight: 700,
            color: "#fff",
            boxShadow: "0 8px 24px rgba(102, 126, 234, 0.35)",
        },
        title: {
            color: "#ffffff",
            fontSize: "26px",
            fontWeight: 700,
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
        },
        subtitle: {
            color: "rgba(255, 255, 255, 0.55)",
            fontSize: "15px",
            margin: "0",
            fontWeight: 400,
        },
        form: {
            display: "flex",
            flexDirection: "column",
            gap: "16px",
        },
        inputGroup: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
        },
        label: {
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.3px",
        },
        inputWrapper: {
            position: "relative",
            display: "flex",
            alignItems: "center",
        },
        inputIcon: {
            position: "absolute",
            left: "14px",
            color: "rgba(255, 255, 255, 0.35)",
            fontSize: "18px",
            pointerEvents: "none",
            lineHeight: 1,
        },
        input: {
            width: "100%",
            padding: "14px 16px 14px 46px",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            borderRadius: "12px",
            color: "#ffffff",
            fontSize: "15px",
            outline: "none",
            transition: "all 0.25s ease",
            boxSizing: "border-box",
            fontFamily: "inherit",
        },
        inputFocus: {
            borderColor: "rgba(102, 126, 234, 0.6)",
            background: "rgba(255, 255, 255, 0.09)",
            boxShadow: "0 0 0 4px rgba(102, 126, 234, 0.15)",
        },
        inputError: {
            borderColor: "rgba(239, 68, 68, 0.5)",
            background: "rgba(239, 68, 68, 0.08)",
        },
        errorMessage: {
            color: "#f87171",
            fontSize: "13px",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
        },
        button: {
            width: "100%",
            padding: "15px",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 16px rgba(102, 126, 234, 0.35)",
            marginTop: "4px",
            fontFamily: "inherit",
            letterSpacing: "0.3px",
            position: "relative",
            overflow: "hidden",
        },
        buttonHover: {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 28px rgba(102, 126, 234, 0.5)",
        },
        buttonDisabled: {
            opacity: 0.7,
            cursor: "not-allowed",
            transform: "none !important",
        },
        spinner: {
            display: "inline-block",
            width: "20px",
            height: "20px",
            border: "2.5px solid rgba(255, 255, 255, 0.25)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
        },
        footer: {
            display: "flex",
            justifyContent: "center",
            marginTop: "24px",
            gap: "6px",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "14px",
        },
        link: {
            color: "#a78bfa",
            textDecoration: "none",
            fontWeight: 500,
            transition: "color 0.2s ease",
            borderBottom: "1px solid transparent",
        },
        linkHover: {
            color: "#c4b5fd",
            borderBottomColor: "rgba(167, 139, 250, 0.3)",
        },
        divider: {
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "4px 0 2px 0",
        },
        dividerLine: {
            flex: 1,
            height: "1px",
            background: "rgba(255, 255, 255, 0.08)",
        },
        dividerText: {
            color: "rgba(255, 255, 255, 0.25)",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            fontWeight: 500,
        },
        socialRow: {
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "4px",
        },
        socialBtn: {
            flex: 1,
            padding: "11px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
        },
        socialBtnHover: {
            background: "rgba(255, 255, 255, 0.10)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            color: "#fff",
        },
    };

    // Keyframe animation
    const spinnerKeyframes = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    return (
        <>
            <style>{spinnerKeyframes}</style>
            <div style={styles.container}>
                <div style={styles.card}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.logo}>✨</div>
                        <h1 style={styles.title}>Create Account</h1>
                        <p style={styles.subtitle}>Join Expense AI and start managing your finances</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* Full Name */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>👤</span>
                                <input
                                    type="text"
                                    name="full_name"
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        ...styles.input,
                                        ...(error && styles.inputError),
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor =
                                            styles.inputFocus.borderColor;
                                        e.target.style.background =
                                            styles.inputFocus.background;
                                        e.target.style.boxShadow =
                                            styles.inputFocus.boxShadow;
                                    }}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            e.target.style.borderColor =
                                                "rgba(255, 255, 255, 0.10)";
                                            e.target.style.background =
                                                "rgba(255, 255, 255, 0.06)";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>✉️</span>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        ...styles.input,
                                        ...(error && styles.inputError),
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor =
                                            styles.inputFocus.borderColor;
                                        e.target.style.background =
                                            styles.inputFocus.background;
                                        e.target.style.boxShadow =
                                            styles.inputFocus.boxShadow;
                                    }}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            e.target.style.borderColor =
                                                "rgba(255, 255, 255, 0.10)";
                                            e.target.style.background =
                                                "rgba(255, 255, 255, 0.06)";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>📞</span>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="+1 234 567 8900"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        ...styles.input,
                                        ...(error && styles.inputError),
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor =
                                            styles.inputFocus.borderColor;
                                        e.target.style.background =
                                            styles.inputFocus.background;
                                        e.target.style.boxShadow =
                                            styles.inputFocus.boxShadow;
                                    }}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            e.target.style.borderColor =
                                                "rgba(255, 255, 255, 0.10)";
                                            e.target.style.background =
                                                "rgba(255, 255, 255, 0.06)";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>🔒</span>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="•••••••• (min. 6 chars)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    style={{
                                        ...styles.input,
                                        ...(error && styles.inputError),
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor =
                                            styles.inputFocus.borderColor;
                                        e.target.style.background =
                                            styles.inputFocus.background;
                                        e.target.style.boxShadow =
                                            styles.inputFocus.boxShadow;
                                    }}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            e.target.style.borderColor =
                                                "rgba(255, 255, 255, 0.10)";
                                            e.target.style.background =
                                                "rgba(255, 255, 255, 0.06)";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Confirm Password</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>🔐</span>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        ...styles.input,
                                        ...(error && styles.inputError),
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor =
                                            styles.inputFocus.borderColor;
                                        e.target.style.background =
                                            styles.inputFocus.background;
                                        e.target.style.boxShadow =
                                            styles.inputFocus.boxShadow;
                                    }}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            e.target.style.borderColor =
                                                "rgba(255, 255, 255, 0.10)";
                                            e.target.style.background =
                                                "rgba(255, 255, 255, 0.06)";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={styles.errorMessage}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                ...styles.button,
                                ...(isLoading && styles.buttonDisabled),
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform =
                                        styles.buttonHover.transform;
                                    e.target.style.boxShadow =
                                        styles.buttonHover.boxShadow;
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(102, 126, 234, 0.35)";
                            }}
                        >
                            {isLoading ? (
                                <span style={styles.spinner} />
                            ) : (
                                "Create Account →"
                            )}
                        </button>

                        {/* Divider */}
                        <div style={styles.divider}>
                            <span style={styles.dividerLine} />
                            <span style={styles.dividerText}>or sign up with</span>
                            <span style={styles.dividerLine} />
                        </div>

                        {/* Social Buttons */}
                        <div style={styles.socialRow}>
                            <button
                                type="button"
                                style={styles.socialBtn}
                                onMouseEnter={(e) => {
                                    e.target.style.background =
                                        styles.socialBtnHover.background;
                                    e.target.style.borderColor =
                                        styles.socialBtnHover.borderColor;
                                    e.target.style.color =
                                        styles.socialBtnHover.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background =
                                        "rgba(255, 255, 255, 0.05)";
                                    e.target.style.borderColor =
                                        "rgba(255, 255, 255, 0.08)";
                                    e.target.style.color =
                                        "rgba(255, 255, 255, 0.6)";
                                }}
                                onClick={() =>
                                    alert("Google sign-up coming soon!")
                                }
                            >
                                <span>🔵</span> Google
                            </button>
                            <button
                                type="button"
                                style={styles.socialBtn}
                                onMouseEnter={(e) => {
                                    e.target.style.background =
                                        styles.socialBtnHover.background;
                                    e.target.style.borderColor =
                                        styles.socialBtnHover.borderColor;
                                    e.target.style.color =
                                        styles.socialBtnHover.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background =
                                        "rgba(255, 255, 255, 0.05)";
                                    e.target.style.borderColor =
                                        "rgba(255, 255, 255, 0.08)";
                                    e.target.style.color =
                                        "rgba(255, 255, 255, 0.6)";
                                }}
                                onClick={() =>
                                    alert("GitHub sign-up coming soon!")
                                }
                            >
                                <span>⚫</span> GitHub
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <span>Already have an account?</span>
                        <Link
                            to="/"
                            style={styles.link}
                            onMouseEnter={(e) => {
                                e.target.style.color = styles.linkHover.color;
                                e.target.style.borderBottomColor =
                                    styles.linkHover.borderBottomColor;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = styles.link.color;
                                e.target.style.borderBottomColor = "transparent";
                            }}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}