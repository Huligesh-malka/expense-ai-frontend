import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

// Sample rows for the illustrative ledger strip in the left panel.
// Purely decorative — not real account data.
const LEDGER_SAMPLE = [
    { date: "01 Aug", entry: "Rent collected", amount: "₹42,000" },
    { date: "03 Aug", entry: "Inventory restock", amount: "₹18,500" },
    { date: "05 Aug", entry: "Vendor settlement", amount: "₹9,200" },
];

function useIsNarrow(breakpoint = 900) {
    const [isNarrow, setIsNarrow] = useState(
        typeof window !== "undefined" ? window.innerWidth < breakpoint : false
    );
    useEffect(() => {
        const onResize = () => setIsNarrow(window.innerWidth < breakpoint);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [breakpoint]);
    return isNarrow;
}

export default function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const isNarrow = useIsNarrow();
    const isCompact = useIsNarrow(640);

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
                // AuthContext.login() handles token storage
                login(res.data.user, res.data.token);

                // Store additional user info
                localStorage.setItem("userId", res.data.user.id);
                localStorage.setItem("userName", res.data.user.full_name);
                localStorage.setItem("userEmail", res.data.user.email);

                if (res.data.business) {
                    localStorage.setItem("businessId", res.data.business.id);
                    localStorage.setItem("businessName", res.data.business.business_name);
                    localStorage.setItem("businessType", res.data.business.business_type);
                    navigate("/dashboard", { replace: true });
                } else {
                    navigate("/create-business", { replace: true });
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
                // AuthContext.login() handles token storage
                login(res.data.user, res.data.token);

                // Store additional user info
                localStorage.setItem("userId", res.data.user.id);
                localStorage.setItem("userName", res.data.user.full_name);
                localStorage.setItem("userEmail", res.data.user.email);

                if (res.data.business) {
                    localStorage.setItem("businessId", res.data.business.id);
                    localStorage.setItem("businessName", res.data.business.business_name);
                    localStorage.setItem("businessType", res.data.business.business_type);
                    navigate("/dashboard", { replace: true });
                } else {
                    navigate("/create-business", { replace: true });
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
        <div style={styles.page}>
            <style>{FONT_AND_MOTION_CSS}</style>

            {/* ============== LEFT: LEDGER PANEL ============== */}
            <div
                style={{
                    ...styles.leftPanel,
                    ...(isNarrow ? styles.leftPanelNarrow : {}),
                }}
            >
                <div>
                    <div style={styles.wordmark}>FinancePro</div>
                    <div style={styles.tagline}>BUSINESS LEDGER</div>
                </div>

                <h1 style={{ ...styles.hero, ...(isCompact ? styles.heroCompact : {}) }}>
                    Every rupee,
                    <br />
                    accounted for.
                </h1>

                {!isCompact && (
                    <div style={styles.ledgerBlock}>
                        <div style={styles.ledgerCaption}>Sample ledger entry</div>
                        <div style={styles.ledgerTable}>
                            {LEDGER_SAMPLE.map((row, i) => (
                                <div style={styles.ledgerRow} key={i}>
                                    <span style={styles.ledgerDate}>{row.date}</span>
                                    <span style={styles.ledgerEntry}>{row.entry}</span>
                                    <span style={styles.ledgerDots} />
                                    <span style={styles.ledgerAmount}>{row.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ============== RIGHT: SIGN IN CARD ============== */}
            <div
                style={{
                    ...styles.rightPanel,
                    ...(isNarrow ? styles.rightPanelNarrow : {}),
                }}
            >
                <div className="ledger-card-enter" style={styles.card}>
                    <div style={styles.ledgerTab}>SIGN IN</div>

                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>Welcome back</h2>
                        <p style={styles.cardSubtitle}>Sign in to open your books.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="login-email">
                                Email address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="you@business.in"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                className="ledger-input"
                                style={{
                                    ...styles.input,
                                    ...(error && styles.inputError),
                                }}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <div style={styles.labelRow}>
                                <label style={styles.label} htmlFor="login-password">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="ledger-link" style={styles.forgotLink}>
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                autoComplete="current-password"
                                className="ledger-input"
                                style={{
                                    ...styles.input,
                                    ...(error && styles.inputError),
                                }}
                            />
                        </div>

                        {error && (
                            <div style={styles.errorBox}>
                                <span style={styles.errorTag}>Error</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="ledger-btn-primary"
                            style={{
                                ...styles.submitButton,
                                ...(isLoading && styles.buttonDisabled),
                            }}
                        >
                            {isLoading ? (
                                <span style={styles.spinnerContainer}>
                                    <span style={styles.spinner}></span>
                                    Signing in…
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        <div style={styles.divider}>
                            <span style={styles.dividerLine} />
                            <span style={styles.dividerText}>or continue with</span>
                            <span style={styles.dividerLine} />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="ledger-btn-google"
                            style={styles.googleButton}
                        >
                            <svg style={styles.socialIcon} viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <div style={styles.footer}>
                        <span style={styles.footerText}>New here?</span>
                        <Link to="/register" className="ledger-link" style={styles.registerLink}>
                            Create an account →
                        </Link>
                    </div>

                    <div style={styles.receipt}>
                        <div style={styles.receiptLabel}>Demo access</div>
                        <div style={styles.receiptRow}>
                            <span style={styles.receiptKey}>email</span>
                            <span style={styles.receiptValue}>demo@financepro.com</span>
                        </div>
                        <div style={styles.receiptRow}>
                            <span style={styles.receiptKey}>pass</span>
                            <span style={styles.receiptValue}>password123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Fonts, keyframes, hover states & focus rings =====
const FONT_AND_MOTION_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500;1,600&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

    @keyframes ledgerCardIn {
        from { opacity: 0; transform: translateY(10px) rotate(-0.4deg); }
        to { opacity: 1; transform: translateY(0) rotate(0deg); }
    }
    @keyframes ledgerSpin {
        to { transform: rotate(360deg); }
    }
    .ledger-card-enter {
        animation: ledgerCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @media (prefers-reduced-motion: reduce) {
        .ledger-card-enter { animation: none; }
    }

    .ledger-input:hover {
        border-color: #b9ab84;
    }
    .ledger-input:focus {
        outline: none;
        border-color: #1F6F54;
        box-shadow: 0 0 0 3px rgba(31, 111, 84, 0.15);
    }
    .ledger-btn-primary:hover:not(:disabled) {
        background: #195c46;
    }
    .ledger-btn-google:hover:not(:disabled) {
        border-color: #101C2C;
        background: #fbf7ec;
    }
    .ledger-link:focus-visible,
    .ledger-btn-primary:focus-visible,
    .ledger-btn-google:focus-visible,
    .ledger-input:focus-visible {
        outline: 2px solid #C9A227;
        outline-offset: 2px;
    }
`;

// ===== Palette =====
// ink:     #101C2C  – ledger cover / dark panel
// paper:   #F1E9D6  – parchment card
// emerald: #1F6F54  – stamp-ink green (primary action)
// gold:    #C9A227  – brass tab / accent
// margin:  #A64B3C  – classic red ledger margin rule

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        background: "#101C2C",
        fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    // ---------- Left panel ----------
    leftPanel: {
        flex: "0 0 44%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 56px 64px",
        background:
            "radial-gradient(circle at 20% 15%, rgba(201,162,39,0.08) 0%, transparent 45%), #101C2C",
        boxSizing: "border-box",
        position: "relative",
    },
    leftPanelNarrow: {
        flex: "none",
        minHeight: "auto",
        padding: "40px 28px 32px",
    },
    wordmark: {
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "26px",
        color: "#F1E9D6",
        letterSpacing: "-0.3px",
    },
    tagline: {
        marginTop: "6px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        letterSpacing: "2.5px",
        color: "rgba(241,233,214,0.45)",
    },
    hero: {
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontWeight: 500,
        fontSize: "44px",
        lineHeight: 1.15,
        color: "#F1E9D6",
        margin: "40px 0",
        maxWidth: "420px",
    },
    heroCompact: {
        fontSize: "30px",
        margin: "28px 0",
    },
    ledgerBlock: {
        borderTop: "1px solid rgba(241,233,214,0.15)",
        paddingTop: "20px",
    },
    ledgerCaption: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "rgba(241,233,214,0.35)",
        marginBottom: "12px",
    },
    ledgerTable: {
        borderLeft: "2px solid #A64B3C",
        paddingLeft: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    ledgerRow: {
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "12.5px",
        color: "rgba(241,233,214,0.8)",
    },
    ledgerDate: {
        color: "rgba(241,233,214,0.4)",
        flexShrink: 0,
    },
    ledgerEntry: {
        flexShrink: 0,
        whiteSpace: "nowrap",
    },
    ledgerDots: {
        flex: 1,
        borderBottom: "1px dotted rgba(241,233,214,0.25)",
        transform: "translateY(-3px)",
    },
    ledgerAmount: {
        color: "#F1E9D6",
        flexShrink: 0,
    },

    // ---------- Right panel ----------
    rightPanel: {
        flex: "1",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
        boxSizing: "border-box",
    },
    rightPanelNarrow: {
        minHeight: "auto",
        padding: "32px 20px 56px",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        background: "#F1E9D6",
        backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 30px, rgba(16,28,44,0.05) 30px 31px)",
        borderRadius: "6px",
        padding: "44px 36px 32px",
        position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        border: "1px solid rgba(16,28,44,0.06)",
    },
    ledgerTab: {
        position: "absolute",
        top: "-16px",
        right: "32px",
        background: "#C9A227",
        color: "#101C2C",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "1.5px",
        padding: "7px 14px",
        borderRadius: "4px 4px 0 0",
        transform: "rotate(-2deg)",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
    },
    cardHead: {
        marginBottom: "28px",
    },
    cardTitle: {
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "26px",
        color: "#101C2C",
        margin: "0 0 6px 0",
    },
    cardSubtitle: {
        color: "#6b6355",
        fontSize: "14px",
        margin: 0,
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
    labelRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    label: {
        color: "#4a4438",
        fontSize: "12.5px",
        fontWeight: 500,
    },
    input: {
        padding: "12px 14px",
        background: "#FBF8F0",
        border: "1.5px solid rgba(16,28,44,0.15)",
        borderRadius: "6px",
        color: "#101C2C",
        fontSize: "14.5px",
        fontFamily: "'IBM Plex Mono', monospace",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
    },
    inputError: {
        borderColor: "#A64B3C",
        background: "rgba(166,75,60,0.06)",
    },
    forgotLink: {
        color: "#8a7f66",
        fontSize: "12px",
        textDecoration: "none",
        borderBottom: "1px solid transparent",
    },
    errorBox: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(166,75,60,0.08)",
        borderLeft: "3px solid #A64B3C",
        borderRadius: "2px",
        color: "#7a3225",
        fontSize: "13px",
    },
    errorTag: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "1px",
        textTransform: "uppercase",
        flexShrink: 0,
    },
    submitButton: {
        padding: "13px",
        background: "#1F6F54",
        border: "none",
        borderRadius: "6px",
        color: "#F1E9D6",
        fontSize: "15px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.2s ease",
        fontFamily: "'Work Sans', sans-serif",
    },
    buttonDisabled: {
        opacity: 0.6,
        cursor: "not-allowed",
    },
    spinnerContainer: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",
    },
    spinner: {
        width: "15px",
        height: "15px",
        border: "2px solid rgba(241,233,214,0.3)",
        borderTopColor: "#F1E9D6",
        borderRadius: "50%",
        display: "inline-block",
        animation: "ledgerSpin 0.7s linear infinite",
    },
    divider: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        margin: "2px 0",
    },
    dividerLine: {
        flex: 1,
        height: "1px",
        background: "rgba(16,28,44,0.12)",
    },
    dividerText: {
        color: "#a39a84",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "1px",
        whiteSpace: "nowrap",
    },
    googleButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        padding: "12px",
        background: "#FBF8F0",
        border: "1.5px solid rgba(16,28,44,0.15)",
        borderRadius: "6px",
        color: "#101C2C",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Work Sans', sans-serif",
        boxSizing: "border-box",
    },
    socialIcon: {
        width: "18px",
        height: "18px",
    },
    footer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
        marginTop: "24px",
        paddingTop: "18px",
        borderTop: "1px dashed rgba(16,28,44,0.15)",
        fontSize: "13.5px",
    },
    footerText: {
        color: "#8a7f66",
    },
    registerLink: {
        color: "#101C2C",
        textDecoration: "none",
        fontWeight: 600,
        borderBottom: "1px solid #C9A227",
    },
    receipt: {
        marginTop: "20px",
        paddingTop: "14px",
        borderTop: "1px dashed rgba(16,28,44,0.2)",
    },
    receiptLabel: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#a39a84",
        marginBottom: "6px",
        textAlign: "center",
    },
    receiptRow: {
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "12px",
        padding: "1px 0",
    },
    receiptKey: {
        color: "#a39a84",
    },
    receiptValue: {
        color: "#4a4438",
        fontWeight: 500,
    },
};