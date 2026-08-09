import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
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
                localStorage.setItem("userId", res.data.user.id);
                localStorage.setItem("userName", res.data.user.full_name);
                localStorage.setItem("userEmail", res.data.user.email);

                if (res.data.business) {
                    localStorage.setItem("businessId", res.data.business.id);
                    localStorage.setItem("businessName", res.data.business.business_name);
                    localStorage.setItem("businessType", res.data.business.business_type);
                    navigate("/dashboard");
                } else {
                    navigate("/create-business");
                }
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Server error. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            const res = await API.post("/auth/google", { idToken });

            if (res.data.success) {
                login(res.data.user, res.data.token);
                localStorage.setItem("userId", res.data.user.id);
                localStorage.setItem("userName", res.data.user.full_name);
                localStorage.setItem("userEmail", res.data.user.email);

                if (res.data.business) {
                    localStorage.setItem("businessId", res.data.business.id);
                    localStorage.setItem("businessName", res.data.business.business_name);
                    localStorage.setItem("businessType", res.data.business.business_type);
                    navigate("/dashboard");
                } else {
                    navigate("/create-business");
                }
            } else {
                setError(res.data.message || "Google login failed. Please try again.");
            }
        } catch (err) {
            console.error("Google login error:", err);
            if (err.code === "auth/popup-closed-by-user") {
                setError("Login cancelled. Please try again.");
            } else if (err.code === "auth/popup-blocked") {
                setError("Popup blocked. Please allow popups for this site.");
            } else {
                setError(err.response?.data?.message || err.message || "Google login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Animated Background */}
            <div style={styles.bgAnimation}>
                <div style={styles.bgCircle1}></div>
                <div style={styles.bgCircle2}></div>
                <div style={styles.bgCircle3}></div>
                <div style={styles.bgCircle4}></div>
            </div>

            <div style={styles.card}>
                {/* Brand Section */}
                <div style={styles.brandSection}>
                    <div style={styles.brandIcon}>
                        <span style={styles.brandEmoji}>📊</span>
                    </div>
                    <h1 style={styles.brandTitle}>FinancePro</h1>
                    <p style={styles.brandSubtitle}>Smart Business Management</p>
                </div>

                {/* Welcome Section */}
                <div style={styles.welcomeSection}>
                    <h2 style={styles.welcomeTitle}>Welcome Back! 👋</h2>
                    <p style={styles.welcomeText}>Sign in to access your business dashboard</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <span style={styles.labelIcon}>📧</span>
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                ...styles.input,
                                ...(error && styles.inputError),
                            }}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            <span style={styles.labelIcon}>🔐</span>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            style={{
                                ...styles.input,
                                ...(error && styles.inputError),
                            }}
                        />
                        <div style={styles.forgotPassword}>
                            <Link to="/forgot-password" style={styles.forgotLink}>
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <span style={styles.errorIcon}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            ...styles.submitButton,
                            ...(isLoading && styles.buttonDisabled),
                        }}
                    >
                        {isLoading ? (
                            <div style={styles.spinnerContainer}>
                                <div style={styles.spinner}></div>
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>

                    <div style={styles.divider}>
                        <span style={styles.dividerLine} />
                        <span style={styles.dividerText}>Or continue with</span>
                        <span style={styles.dividerLine} />
                    </div>

                    <div style={styles.socialButtons}>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            style={styles.googleButton}
                        >
                            <svg style={styles.socialIcon} viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={() => alert("GitHub login coming soon!")}
                            disabled={isLoading}
                            style={styles.githubButton}
                        >
                            <svg style={styles.socialIcon} viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.62.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            GitHub
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div style={styles.footer}>
                    <span style={styles.footerText}>New here?</span>
                    <Link to="/register" style={styles.registerLink}>
                        Create an account →
                    </Link>
                </div>

                {/* Demo Credentials */}
                <div style={styles.demoCard}>
                    <p style={styles.demoTitle}>🔑 Demo Credentials</p>
                    <div style={styles.demoCreds}>
                        <span style={styles.demoLabel}>Email:</span>
                        <span style={styles.demoValue}>demo@financepro.com</span>
                    </div>
                    <div style={styles.demoCreds}>
                        <span style={styles.demoLabel}>Password:</span>
                        <span style={styles.demoValue}>password123</span>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(5deg); }
                    }
                    @keyframes float2 {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(15px) rotate(-5deg); }
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
}

// ===== Styles =====
const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#0f0f1a",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    bgAnimation: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
    },
    bgCircle1: {
        position: "absolute",
        top: "-20%",
        right: "-10%",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 8s ease-in-out infinite",
    },
    bgCircle2: {
        position: "absolute",
        bottom: "-20%",
        left: "-10%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float2 10s ease-in-out infinite",
    },
    bgCircle3: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        animation: "pulse 6s ease-in-out infinite",
    },
    bgCircle4: {
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(251, 146, 60, 0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float2 7s ease-in-out infinite",
    },
    card: {
        width: "100%",
        maxWidth: "440px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "32px",
        padding: "48px 40px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
        position: "relative",
        zIndex: 1,
        transition: "all 0.3s ease",
    },
    brandSection: {
        textAlign: "center",
        marginBottom: "32px",
    },
    brandIcon: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "72px",
        height: "72px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: "20px",
        marginBottom: "16px",
        boxShadow: "0 8px 32px rgba(99, 102, 241, 0.3)",
        transition: "transform 0.3s ease",
    },
    brandEmoji: {
        fontSize: "32px",
    },
    brandTitle: {
        fontSize: "28px",
        fontWeight: 700,
        color: "#ffffff",
        margin: "0 0 4px 0",
        letterSpacing: "-0.5px",
        background: "linear-gradient(135deg, #fff 0%, #a5b4fc 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    brandSubtitle: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: "14px",
        fontWeight: 400,
        margin: 0,
        letterSpacing: "0.5px",
    },
    welcomeSection: {
        marginBottom: "32px",
        textAlign: "center",
    },
    welcomeTitle: {
        fontSize: "22px",
        fontWeight: 600,
        color: "#ffffff",
        margin: "0 0 6px 0",
    },
    welcomeText: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "14px",
        margin: 0,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
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
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    labelIcon: {
        fontSize: "14px",
    },
    input: {
        padding: "14px 18px",
        background: "rgba(255, 255, 255, 0.06)",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "14px",
        color: "#ffffff",
        fontSize: "15px",
        outline: "none",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
    },
    inputFocus: {
        borderColor: "#6366f1",
        background: "rgba(99, 102, 241, 0.08)",
        boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.1)",
    },
    inputError: {
        borderColor: "rgba(239, 68, 68, 0.4)",
        background: "rgba(239, 68, 68, 0.08)",
    },
    forgotPassword: {
        textAlign: "right",
        marginTop: "4px",
    },
    forgotLink: {
        color: "rgba(255, 255, 255, 0.3)",
        fontSize: "12px",
        textDecoration: "none",
        transition: "color 0.3s ease",
        borderBottom: "1px solid transparent",
    },
    errorBox: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 16px",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "12px",
        color: "#fca5a5",
        fontSize: "13px",
    },
    errorIcon: {
        fontSize: "16px",
    },
    submitButton: {
        padding: "16px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: "14px",
        color: "#fff",
        fontSize: "16px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
    },
    buttonDisabled: {
        opacity: 0.7,
        cursor: "not-allowed",
        transform: "none !important",
    },
    spinnerContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
    },
    spinner: {
        width: "20px",
        height: "20px",
        border: "2.5px solid rgba(255, 255, 255, 0.2)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
    divider: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        margin: "4px 0",
    },
    dividerLine: {
        flex: 1,
        height: "1px",
        background: "rgba(255, 255, 255, 0.06)",
    },
    dividerText: {
        color: "rgba(255, 255, 255, 0.2)",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        fontWeight: 500,
        whiteSpace: "nowrap",
    },
    socialButtons: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
    },
    googleButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "12px",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
    },
    githubButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "12px",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontFamily: "inherit",
    },
    socialIcon: {
        width: "20px",
        height: "20px",
    },
    footer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        marginTop: "24px",
        paddingTop: "20px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    },
    footerText: {
        color: "rgba(255, 255, 255, 0.3)",
        fontSize: "14px",
    },
    registerLink: {
        color: "#a5b4fc",
        textDecoration: "none",
        fontWeight: 500,
        fontSize: "14px",
        transition: "all 0.3s ease",
        borderBottom: "1px solid transparent",
    },
    demoCard: {
        marginTop: "20px",
        padding: "16px 20px",
        background: "rgba(99, 102, 241, 0.06)",
        borderRadius: "14px",
        border: "1px solid rgba(99, 102, 241, 0.1)",
    },
    demoTitle: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: "12px",
        fontWeight: 500,
        margin: "0 0 8px 0",
        textAlign: "center",
        letterSpacing: "0.5px",
    },
    demoCreds: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        padding: "2px 0",
    },
    demoLabel: {
        color: "rgba(255, 255, 255, 0.3)",
    },
    demoValue: {
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: 500,
        fontFamily: "'Monaco', 'Menlo', monospace",
        fontSize: "12px",
        background: "rgba(0, 0, 0, 0.2)",
        padding: "2px 10px",
        borderRadius: "6px",
    },
};

// Add hover effects
const hoverStyles = document.createElement("style");
hoverStyles.textContent = `
    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
    }
    .submit-btn:active {
        transform: translateY(0);
    }
    .social-btn:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.15) !important;
        color: #ffffff !important;
        transform: translateY(-2px);
    }
    .input-field:hover {
        border-color: rgba(255, 255, 255, 0.15);
    }
    .input-field:focus {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.08);
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }
    .register-link:hover {
        color: #c4b5fd;
        border-bottom-color: rgba(165, 180, 252, 0.3);
    }
    .forgot-link:hover {
        color: rgba(255, 255, 255, 0.6);
    }
    .brand-icon:hover {
        transform: scale(1.05);
    }
`;
document.head.appendChild(hoverStyles); 