import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
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

        try {
            const res = await API.post("/auth/login", formData);

            if (res.data.success) {
                login(res.data.user, res.data.token);

                // Save User
                localStorage.setItem("userId", res.data.user.id);
                localStorage.setItem("userName", res.data.user.full_name);
                localStorage.setItem("userEmail", res.data.user.email);

                // Save Business (if exists)
                if (res.data.business) {
                    localStorage.setItem(
                        "businessId",
                        res.data.business.id
                    );
                    localStorage.setItem(
                        "businessName",
                        res.data.business.business_name
                    );
                    localStorage.setItem(
                        "businessType",
                        res.data.business.business_type
                    );

                    navigate("/dashboard");
                } else {
                    navigate("/create-business");
                }
            } else {
                setError(res.data.message);
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

    // --- Styles ---
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
            maxWidth: "420px",
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
            marginBottom: "32px",
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
            gap: "18px",
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
            marginTop: "6px",
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
            margin: "6px 0 4px 0",
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
        demoNotice: {
            marginTop: "20px",
            padding: "12px 16px",
            background: "rgba(102, 126, 234, 0.12)",
            borderRadius: "10px",
            border: "1px solid rgba(102, 126, 234, 0.15)",
            textAlign: "center",
        },
        demoText: {
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "12px",
            margin: 0,
            letterSpacing: "0.2px",
        },
        demoHighlight: {
            color: "rgba(255, 255, 255, 0.7)",
            fontWeight: 500,
        },
    };

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
                    <div style={styles.header}>
                        <div style={styles.logo}>💰</div>
                        <h1 style={styles.title}>Expense AI</h1>
                        <p style={styles.subtitle}>Welcome back — sign in to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} style={styles.form}>
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

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>🔒</span>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
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

                        {error && (
                            <div style={styles.errorMessage}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

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
                                "Sign In →"
                            )}
                        </button>

                        <div style={styles.divider}>
                            <span style={styles.dividerLine} />
                            <span style={styles.dividerText}>or continue with</span>
                            <span style={styles.dividerLine} />
                        </div>

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
                                    alert("Google login coming soon!")
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
                                    alert("GitHub login coming soon!")
                                }
                            >
                                <span>⚫</span> GitHub
                            </button>
                        </div>
                    </form>

                    <div style={styles.footer}>
                        <span>Don't have an account?</span>
                        <Link
                            to="/register"
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
                            Create Account
                        </Link>
                    </div>

                    <div style={styles.demoNotice}>
                        <p style={styles.demoText}>
                            🔑 Demo:{" "}
                            <span style={styles.demoHighlight}>
                                demo@expense.ai
                            </span>{" "}
                            /{" "}
                            <span style={styles.demoHighlight}>
                                password123
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}