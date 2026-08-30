import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

// Shop types Laabha serves — shown as badges so an owner instantly
// recognizes the product is built for a business like theirs.
const SHOP_TYPES = [
    { label: "Grocery", icon: "🛒" },
    { label: "Medical", icon: "💊" },
    { label: "General store", icon: "🏪" },
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

/* ---------- Signature visual: stitched ledger spine ---------- */
function StitchSpine() {
    return (
        <svg
            width="18"
            height="100%"
            viewBox="0 0 18 400"
            preserveAspectRatio="none"
            style={styles.spineSvg}
            aria-hidden="true"
        >
            <line x1="9" y1="0" x2="9" y2="400" stroke="rgba(251,242,221,0.14)" strokeWidth="1" />
            {Array.from({ length: 20 }).map((_, i) => {
                const y = i * 21 + 6;
                return (
                    <g key={i} stroke="rgba(217,140,43,0.55)" strokeWidth="1.4" strokeLinecap="round">
                        <line x1="2" y1={y} x2="16" y2={y + 9} />
                        <line x1="16" y1={y} x2="2" y2={y + 9} />
                    </g>
                );
            })}
        </svg>
    );
}

/* ---------- Signature visual: rubber security stamp ---------- */
function SecurityStamp() {
    return (
        <div style={styles.stampWrap} aria-hidden="true">
            <svg width="86" height="86" viewBox="0 0 86 86">
                <defs>
                    <path id="stampCircle" d="M 43,43 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
                </defs>
                <circle cx="43" cy="43" r="40" fill="none" stroke="#A93D2F" strokeWidth="1.5" opacity="0.85" />
                <circle cx="43" cy="43" r="33" fill="none" stroke="#A93D2F" strokeWidth="1" opacity="0.6" />
                <text fill="#A93D2F" fontSize="8.4" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">
                    <textPath href="#stampCircle" startOffset="2%">
                        BANK-GRADE ENCRYPTION • DATA STAYS PRIVATE •
                    </textPath>
                </text>
                <path d="M43 30a7 7 0 00-7 7v3h-1.5a1.5 1.5 0 00-1.5 1.5v13a1.5 1.5 0 001.5 1.5h17a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0051.5 40H50v-3a7 7 0 00-7-7zm0 3.2a3.8 3.8 0 013.8 3.8v3H39.2v-3A3.8 3.8 0 0143 33.2z"
                    fill="#A93D2F" opacity="0.9" />
            </svg>
        </div>
    );
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
                login(res.data.user, res.data.token);

                localStorage.setItem("userId", res.data.user.id);
                localStorage.setItem("userName", res.data.user.full_name);
                localStorage.setItem("userEmail", res.data.user.email);

                if (res.data.business) {
                    localStorage.setItem("businessId", res.data.business.id);
                    localStorage.setItem("businessName", res.data.business.business_name);
                    localStorage.setItem("businessType", res.data.business.business_type);

                    if (res.data.user.role === "admin") {
                        navigate("/admin/dashboard", { replace: true });
                    } else {
                        navigate("/dashboard", { replace: true });
                    }
                } else {
                    if (res.data.user.role === "admin") {
                        navigate("/admin/dashboard", { replace: true });
                    } else {
                        navigate("/create-business", { replace: true });
                    }
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

                    if (res.data.user.role === "admin") {
                        navigate("/admin/dashboard", { replace: true });
                    } else {
                        navigate("/dashboard", { replace: true });
                    }
                } else {
                    if (res.data.user.role === "admin") {
                        navigate("/admin/dashboard", { replace: true });
                    } else {
                        navigate("/create-business", { replace: true });
                    }
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

            {/* ============== LEFT: TRUST / BRAND PANEL ============== */}
            <div
                style={{
                    ...styles.leftPanel,
                    ...(isNarrow ? styles.leftPanelNarrow : {}),
                }}
            >
                <StitchSpine />

                <div style={styles.leftInner}>
                    <div>
                        <div style={styles.wordmark}>
                            Laabha
                        </div>
                        <div style={styles.tagline}>DUKAAN KA HISAAB, DIGITISED</div>
                    </div>

                    <h1 style={{ ...styles.hero, ...(isCompact ? styles.heroCompact : {}) }}>
                        Your shop's <span style={styles.heroAccent}>hisaab</span>,
                        <br />
                        finally in one place.
                    </h1>

                    {!isCompact && (
                        <>
                            <div style={styles.statBlock}>
                                <span style={styles.statNumber}>12,400+</span>
                                <span style={styles.statLabel}>
                                    shop owners already track their daily profit on Laabha
                                </span>
                            </div>

                            <div style={styles.badgeRow}>
                                {SHOP_TYPES.map((s) => (
                                    <span style={styles.badge} key={s.label}>
                                        <span aria-hidden="true">{s.icon}</span> {s.label}
                                    </span>
                                ))}
                            </div>

                            <div style={styles.testimonial}>
                                <span style={styles.testimonialMark}>"</span>
                                Ab mujhe raat ko baithke hisaab nahi milaana padta.
                                <div style={styles.testimonialBy}>
                                    — Suresh Patil, Grocery shop owner, Mysuru
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ============== RIGHT: SIGN IN CARD ============== */}
            <div
                style={{
                    ...styles.rightPanel,
                    ...(isNarrow ? styles.rightPanelNarrow : {}),
                }}
            >
                <div className="ledger-card-enter" style={styles.card}>
                    <SecurityStamp />
                    <div style={styles.ledgerTab}>PRAVESH · SIGN IN</div>

                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>Welcome back</h2>
                        <p style={styles.cardSubtitle}>Sign in to see today's profit.</p>
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
                                placeholder="you@yourshop.in"
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
                            <span style={styles.microcopy}>We never share your shop data with anyone.</span>
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
                                "Sign in and open your books"
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

                    <div style={styles.trustFooter}>
                        <span style={styles.trustItem}>🔒 Encrypted</span>
                        <span style={styles.trustDot}>·</span>
                        <span style={styles.trustItem}>✅ GST-ready</span>
                        <span style={styles.trustDot}>·</span>
                        <span style={styles.trustItem}>Hindi · Kannada · English support</span>
                    </div>

                    <div style={styles.footer}>
                        <span style={styles.footerText}>New here?</span>
                        <Link to="/register" className="ledger-link" style={styles.registerLink}>
                            Start your free account →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Fonts, keyframes, hover states & focus rings =====
const FONT_AND_MOTION_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Hind:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

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
        border-color: #d9c9a3;
    }
    .ledger-input:focus {
        outline: none;
        border-color: #1F7A54;
        box-shadow: 0 0 0 3px rgba(31, 122, 84, 0.15);
    }
    .ledger-btn-primary:hover:not(:disabled) {
        background: #175d41;
    }
    .ledger-btn-google:hover:not(:disabled) {
        border-color: #16241D;
        background: #f7efd9;
    }
    .ledger-link:focus-visible,
    .ledger-btn-primary:focus-visible,
    .ledger-btn-google:focus-visible,
    .ledger-input:focus-visible {
        outline: 2px solid #D98C2B;
        outline-offset: 2px;
    }
`;

// ===== Palette =====
// ink:      #16241D  – ledger cover, deep bottle-green black
// paper:    #FBF2DD  – rice-paper card
// profit:   #1F7A54  – "laabha" green, primary action
// marigold: #D98C2B  – warmth / accent
// stamp:    #A93D2F  – rubber-stamp red, alerts, margin rule

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        background: "#16241D",
        fontFamily: "'Hind', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    // ---------- Left panel ----------
    leftPanel: {
        flex: "0 0 44%",
        minHeight: "100vh",
        display: "flex",
        background:
            "radial-gradient(circle at 15% 10%, rgba(217,140,43,0.08) 0%, transparent 45%), #16241D",
        boxSizing: "border-box",
        position: "relative",
        paddingLeft: "18px",
    },
    leftPanelNarrow: {
        flex: "none",
        minHeight: "auto",
        paddingBottom: "8px",
    },
    spineSvg: {
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
    },
    leftInner: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 56px 48px 38px",
        boxSizing: "border-box",
    },
    wordmark: {
        fontFamily: "'Rozha One', serif",
        fontSize: "28px",
        color: "#FBF2DD",
        letterSpacing: "0.5px",
    },
    tagline: {
        marginTop: "6px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        letterSpacing: "2.5px",
        color: "rgba(251,242,221,0.4)",
    },
    hero: {
        fontFamily: "'Rozha One', serif",
        fontSize: "42px",
        lineHeight: 1.2,
        color: "#FBF2DD",
        margin: "36px 0",
        maxWidth: "420px",
    },
    heroCompact: {
        fontSize: "30px",
        margin: "24px 0",
    },
    heroAccent: {
        color: "#D98C2B",
    },
    statBlock: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        borderTop: "1px solid rgba(251,242,221,0.15)",
        paddingTop: "18px",
        maxWidth: "300px",
    },
    statNumber: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "26px",
        color: "#FBF2DD",
        fontWeight: 500,
    },
    statLabel: {
        fontSize: "13px",
        color: "rgba(251,242,221,0.55)",
        lineHeight: 1.4,
    },
    badgeRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "18px",
    },
    badge: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11.5px",
        color: "rgba(251,242,221,0.75)",
        border: "1px solid rgba(251,242,221,0.2)",
        borderRadius: "999px",
        padding: "5px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
    },
    testimonial: {
        marginTop: "26px",
        maxWidth: "300px",
        fontFamily: "'Hind', sans-serif",
        fontSize: "14px",
        fontStyle: "italic",
        color: "rgba(251,242,221,0.8)",
        lineHeight: 1.5,
        borderLeft: "2px solid #A93D2F",
        paddingLeft: "14px",
        position: "relative",
    },
    testimonialMark: {
        fontFamily: "'Rozha One', serif",
        fontStyle: "normal",
        color: "#D98C2B",
        fontSize: "22px",
        marginRight: "2px",
    },
    testimonialBy: {
        marginTop: "8px",
        fontFamily: "'JetBrains Mono', monospace",
        fontStyle: "normal",
        fontSize: "10.5px",
        letterSpacing: "0.5px",
        color: "rgba(251,242,221,0.45)",
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
        background: "#FBF2DD",
        backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 30px, rgba(22,36,29,0.05) 30px 31px)",
        borderRadius: "6px",
        padding: "44px 36px 28px",
        position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        border: "1px solid rgba(22,36,29,0.06)",
    },
    stampWrap: {
        position: "absolute",
        top: "-30px",
        left: "-24px",
        transform: "rotate(-9deg)",
        opacity: 0.9,
        pointerEvents: "none",
    },
    ledgerTab: {
        position: "absolute",
        top: "-16px",
        right: "32px",
        background: "#D98C2B",
        color: "#16241D",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10.5px",
        fontWeight: 500,
        letterSpacing: "1.2px",
        padding: "7px 14px",
        borderRadius: "4px 4px 0 0",
        transform: "rotate(-2deg)",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
    },
    cardHead: {
        marginBottom: "26px",
    },
    cardTitle: {
        fontFamily: "'Rozha One', serif",
        fontSize: "26px",
        color: "#16241D",
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
        gap: "16px",
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
        background: "#FEFBF3",
        border: "1.5px solid rgba(22,36,29,0.15)",
        borderRadius: "6px",
        color: "#16241D",
        fontSize: "14.5px",
        fontFamily: "'JetBrains Mono', monospace",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
    },
    inputError: {
        borderColor: "#A93D2F",
        background: "rgba(169,61,47,0.06)",
    },
    microcopy: {
        fontSize: "11.5px",
        color: "#9c927a",
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
        background: "rgba(169,61,47,0.08)",
        borderLeft: "3px solid #A93D2F",
        borderRadius: "2px",
        color: "#7a3225",
        fontSize: "13px",
    },
    errorTag: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "1px",
        textTransform: "uppercase",
        flexShrink: 0,
    },
    submitButton: {
        padding: "13px",
        background: "#1F7A54",
        border: "none",
        borderRadius: "6px",
        color: "#FBF2DD",
        fontSize: "15px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.2s ease",
        fontFamily: "'Hind', sans-serif",
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
        border: "2px solid rgba(251,242,221,0.3)",
        borderTopColor: "#FBF2DD",
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
        background: "rgba(22,36,29,0.12)",
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
        background: "#FEFBF3",
        border: "1.5px solid rgba(22,36,29,0.15)",
        borderRadius: "6px",
        color: "#16241D",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Hind', sans-serif",
        boxSizing: "border-box",
    },
    socialIcon: {
        width: "18px",
        height: "18px",
    },
    trustFooter: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        marginTop: "20px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10.5px",
        color: "#8a7f66",
    },
    trustItem: {},
    trustDot: {
        color: "#c9bfa6",
    },
    footer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
        marginTop: "18px",
        paddingTop: "16px",
        borderTop: "1px dashed rgba(22,36,29,0.15)",
        fontSize: "13.5px",
    },
    footerText: {
        color: "#8a7f66",
    },
    registerLink: {
        color: "#16241D",
        textDecoration: "none",
        fontWeight: 600,
        borderBottom: "1px solid #D98C2B",
    },
};