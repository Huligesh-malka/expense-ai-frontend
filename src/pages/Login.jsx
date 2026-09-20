import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

/* ==========================================================================
   CONFIG — edit these to match reality. Nothing here is invented on your
   behalf: the social-proof line stays hidden until you give it a real number.
   ========================================================================== */
const CONFIG = {
    brand: "FinancePro",
    tagline: "AI BUSINESS MANAGEMENT",

    // Social proof. Leave businesses at 0 to hide it. Only use a real figure.
    socialProof: { businesses: 0, label: "businesses already run on FinancePro" },

    // Reduces fear of commitment on the sign-up link. Only keep if true.
    signupNote: "Set up in about 2 minutes",

    // Trust line at the bottom of the left panel. Only keep claims that are true.
    trust: ["Secure sign-in", "Your data stays yours", "Built for Indian businesses"],

    // One-click demo. Point this at a READ-ONLY sandbox account, never real data.
    demo: { enabled: true, email: "demo@financepro.com", password: "password123" },

    // Auto-rotation speed of the feature preview (ms).
    rotateMs: 5000,
};

const LAST_EMAIL_KEY = "financepro_last_email";

/* ==========================================================================
   Features — the five chips. Each one drives the live preview on the left.
   Sample data only (clearly labelled in the UI).
   ========================================================================== */
const FEATURES = [
    { id: "billing", label: "Billing", line: "Bill in seconds. Get paid faster." },
    { id: "qr", label: "QR Orders", line: "Customers scan and order. You just serve." },
    { id: "inventory", label: "Inventory", line: "Know what is running low before it runs out." },
    { id: "expenses", label: "Expenses", line: "See exactly where every rupee went." },
    { id: "ai", label: "AI", line: "Ask your business a question. Get an answer." },
];

/* ==========================================================================
   Small helpers
   ========================================================================== */
const safeGet = (key) => {
    try {
        return localStorage.getItem(key) || "";
    } catch {
        return "";
    }
};
const safeSet = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* storage blocked (private mode etc.) — safe to ignore */
    }
};
const safeRemove = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

/* ==========================================================================
   Feature previews (sample data, decorative)
   ========================================================================== */
function BillingPreview() {
    const rows = [
        ["Masala dosa × 2", "₹160"],
        ["Filter coffee × 2", "₹80"],
        ["GST 5%", "₹12"],
    ];
    return (
        <>
            {rows.map(([a, b]) => (
                <div style={styles.pvRow} key={a}>
                    <span>{a}</span>
                    <span style={styles.pvDots} />
                    <span style={styles.pvAmt}>{b}</span>
                </div>
            ))}
            <div style={{ ...styles.pvRow, ...styles.pvTotal }}>
                <span>Total</span>
                <span style={styles.pvDots} />
                <span style={styles.pvAmt}>₹252</span>
            </div>
            <div style={styles.pvBadgeRow}>
                <span style={{ ...styles.pvBadge, ...styles.pvBadgeGreen }}>Paid via UPI</span>
                <span style={styles.pvHint}>Bill sent on WhatsApp</span>
            </div>
        </>
    );
}

function QrPreview() {
    const orders = [
        ["Table 4", "3 items", "₹380", "New", "gold"],
        ["Table 1", "2 items", "₹160", "Preparing", "plain"],
        ["Table 7", "4 items", "₹520", "Ready", "green"],
    ];
    return (
        <>
            {orders.map(([t, n, amt, status, tone]) => (
                <div style={styles.pvRow} key={t}>
                    <span style={styles.pvStrong}>{t}</span>
                    <span style={styles.pvMuted}>{n}</span>
                    <span style={styles.pvDots} />
                    <span style={styles.pvAmt}>{amt}</span>
                    <span
                        style={{
                            ...styles.pvBadge,
                            ...(tone === "green" ? styles.pvBadgeGreen : {}),
                            ...(tone === "gold" ? styles.pvBadgeGold : {}),
                        }}
                    >
                        {status}
                    </span>
                </div>
            ))}
            <div style={styles.pvHint}>Orders arrive here the moment a customer scans.</div>
        </>
    );
}

function InventoryPreview() {
    const items = [
        ["Basmati rice", "5 kg left", 12, true],
        ["Tea powder", "3 kg left", 9, true],
        ["Sugar", "24 kg", 70, false],
    ];
    return (
        <>
            {items.map(([name, qty, pct, low]) => (
                <div style={styles.pvBarBlock} key={name}>
                    <div style={styles.pvRow}>
                        <span>{name}</span>
                        <span style={styles.pvDots} />
                        <span style={{ ...styles.pvAmt, color: low ? "#E39A8A" : "#F1E9D6" }}>{qty}</span>
                    </div>
                    <div style={styles.pvTrack}>
                        <div
                            className="fp-bar"
                            style={{
                                ...styles.pvFill,
                                width: `${pct}%`,
                                background: low ? "#A64B3C" : "#1F6F54",
                            }}
                        />
                    </div>
                </div>
            ))}
            <div style={styles.pvHint}>2 items need reordering this week.</div>
        </>
    );
}

function ExpensesPreview() {
    const cats = [
        ["Rent", "₹42,000", 100],
        ["Stock", "₹18,500", 44],
        ["Vendors", "₹9,200", 22],
    ];
    return (
        <>
            {cats.map(([name, amt, pct]) => (
                <div style={styles.pvBarBlock} key={name}>
                    <div style={styles.pvRow}>
                        <span>{name}</span>
                        <span style={styles.pvDots} />
                        <span style={styles.pvAmt}>{amt}</span>
                    </div>
                    <div style={styles.pvTrack}>
                        <div className="fp-bar" style={{ ...styles.pvFill, width: `${pct}%`, background: "#C9A227" }} />
                    </div>
                </div>
            ))}
            <div style={styles.pvHint}>Scan a receipt and it files itself.</div>
        </>
    );
}

function AiPreview() {
    return (
        <>
            <div style={styles.pvBubbleUser}>Which item earned me the most last week?</div>
            <div style={styles.pvBubbleAi}>
                Filter coffee — ₹6,240 across 312 cups. Want me to draft a restock order?
            </div>
        </>
    );
}

const PREVIEWS = {
    billing: BillingPreview,
    qr: QrPreview,
    inventory: InventoryPreview,
    expenses: ExpensesPreview,
    ai: AiPreview,
};

/* ==========================================================================
   Component
   ========================================================================== */
export default function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const isNarrow = useIsNarrow();
    const isCompact = useIsNarrow(640);

    // Returning-visitor context (read once on mount)
    const [returning, setReturning] = useState(() => ({
        name: (safeGet("userName") || "").split(" ")[0],
        business: safeGet("businessName"),
    }));

    const [formData, setFormData] = useState(() => ({
        email: safeGet(LAST_EMAIL_KEY),
        password: "",
    }));
    const [showPassword, setShowPassword] = useState(false);
    const [capsOn, setCapsOn] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);

    // "email" | "google" | "demo" | "" — which action is running
    const [pending, setPending] = useState("");
    const [error, setError] = useState("");
    const [shakeKey, setShakeKey] = useState(0);
    const isLoading = pending !== "";

    // Feature preview state
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const reducedMotion = useRef(false);

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    /* ---------- effects ---------- */

    // Focus the right field so the owner can start typing immediately.
    useEffect(() => {
        if (formData.email) passwordRef.current?.focus();
        else emailRef.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-rotate the preview until the owner interacts with it.
    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        if (paused || reducedMotion.current) return undefined;
        const t = setTimeout(() => setActive((a) => (a + 1) % FEATURES.length), CONFIG.rotateMs);
        return () => clearTimeout(t);
    }, [active, paused]);

    /* ---------- handlers ---------- */

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleKey = (e) => {
        if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
    };

    const forgetReturning = () => {
        ["userId", "userName", "userEmail", "businessId", "businessName", "businessType", LAST_EMAIL_KEY].forEach(
            safeRemove
        );
        setReturning({ name: "", business: "" });
        setFormData({ email: "", password: "" });
        setTimeout(() => emailRef.current?.focus(), 0);
    };

    const fail = (message) => {
        setError(message);
        setShakeKey((k) => k + 1);
    };

    // One place for post-login storage + routing (was duplicated before).
    const finishLogin = (data) => {
        const { user, business, token } = data;

        // AuthContext.login() handles token storage
        login(user, token);

        safeSet("userId", user.id);
        safeSet("userName", user.full_name);
        safeSet("userEmail", user.email);
        safeSet(LAST_EMAIL_KEY, user.email);

        if (business) {
            safeSet("businessId", business.id);
            safeSet("businessName", business.business_name);
            safeSet("businessType", business.business_type);
        }

        // Admin never needs a business. Owners without one go to setup.
        if (user.role === "admin") {
            navigate("/admin/dashboard", { replace: true });
        } else if (business) {
            navigate("/dashboard", { replace: true });
        } else {
            navigate("/create-business", { replace: true });
        }
    };

    const runAuth = async (kind, request, fallbackMessage) => {
        setPending(kind);
        setError("");
        try {
            const res = await request();
            if (res.data.success) {
                finishLogin(res.data);
            } else {
                fail(res.data.message || fallbackMessage);
            }
        } catch (err) {
            console.error(`${kind} login error:`, err);
            if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
                fail("Google sign-in was closed before it finished. Tap the button to try again.");
            } else if (err.code === "auth/popup-blocked") {
                fail("Your browser blocked the Google window. Allow popups for this site, then try again.");
            } else if (!err.response) {
                fail("Cannot reach the server. Check your internet connection and try again.");
            } else {
                fail(err.response?.data?.message || err.message || fallbackMessage);
            }
        } finally {
            setPending("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLoading) return;
        runAuth("email", () => API.post("/auth/login", formData), "Sign in failed. Please try again.");
    };

    const handleGoogleLogin = () =>
        runAuth(
            "google",
            async () => {
                const result = await signInWithPopup(auth, googleProvider);
                const idToken = await result.user.getIdToken();
                return API.post("/auth/google", { idToken });
            },
            "Google sign-in failed. Please try again."
        );

    const handleDemo = () =>
        runAuth(
            "demo",
            () => API.post("/auth/login", { email: CONFIG.demo.email, password: CONFIG.demo.password }),
            "The demo is unavailable right now. Please try again."
        );

    /* ---------- derived ---------- */

    const emailInvalid = emailTouched && formData.email.length > 0 && !EMAIL_RE.test(formData.email);
    const Preview = PREVIEWS[FEATURES[active].id];
    const greeting = getGreeting();
    const title = returning.name ? `${greeting}, ${returning.name}` : greeting;
    const subtitle = returning.business
        ? `${returning.business} is ready when you are.`
        : "Sign in to open your books.";

    /* ---------- render ---------- */

    return (
        <div style={styles.page}>
            <style>{FONT_AND_MOTION_CSS}</style>

            {/* ============== LEFT: PRODUCT PANEL ============== */}
            <div
                style={{
                    ...styles.leftPanel,
                    ...(isNarrow ? styles.leftPanelNarrow : {}),
                }}
            >
                <div>
                    <div style={styles.wordmark}>{CONFIG.brand}</div>
                    <div style={styles.tagline}>{CONFIG.tagline}</div>
                </div>

                <div>
                    <h1 style={{ ...styles.hero, ...(isCompact ? styles.heroCompact : {}) }}>
                        Run your business.
                        <br />
                        <span style={styles.heroAccent}>We handle the numbers.</span>
                    </h1>

                    {/* Interactive feature chips */}
                    <div
                        role="tablist"
                        aria-label="What FinancePro does"
                        style={styles.chipRow}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                    >
                        {FEATURES.map((f, i) => (
                            <button
                                key={f.id}
                                type="button"
                                role="tab"
                                aria-selected={i === active}
                                className="fp-chip"
                                onClick={() => {
                                    setActive(i);
                                    setPaused(true);
                                }}
                                onFocus={() => setPaused(true)}
                                onBlur={() => setPaused(false)}
                                style={{
                                    ...styles.chip,
                                    ...(i === active ? styles.chipActive : {}),
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {!isCompact && (
                        <div
                            style={styles.previewWrap}
                            onMouseEnter={() => setPaused(true)}
                            onMouseLeave={() => setPaused(false)}
                        >
                            <div style={styles.previewCaption}>
                                <span>{FEATURES[active].line}</span>
                                <span style={styles.previewSample}>Sample</span>
                            </div>
                            <div key={FEATURES[active].id} className="fp-preview-enter" style={styles.previewBody}>
                                <Preview />
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.leftFooter}>
                    {CONFIG.socialProof.businesses > 0 && (
                        <div style={styles.proof}>
                            <strong style={styles.proofNumber}>
                                {CONFIG.socialProof.businesses.toLocaleString("en-IN")}+
                            </strong>{" "}
                            {CONFIG.socialProof.label}
                        </div>
                    )}
                    {!isCompact && (
                        <div style={styles.trustRow}>
                            {CONFIG.trust.map((t) => (
                                <span key={t} style={styles.trustItem}>
                                    {t}
                                </span>
                            ))}
                        </div>
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
                    <div style={styles.ledgerTab}>SIGN IN</div>

                    <div style={styles.cardHead}>
                        <h2 style={styles.cardTitle}>{title}</h2>
                        <p style={styles.cardSubtitle}>{subtitle}</p>
                        {returning.name && (
                            <button type="button" className="ledger-link" style={styles.notYou} onClick={forgetReturning}>
                                Not {returning.name}? Use a different account
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} style={styles.form} noValidate>
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="login-email">
                                Email address
                            </label>
                            <input
                                ref={emailRef}
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="you@business.in"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => setEmailTouched(true)}
                                required
                                autoComplete="email"
                                aria-invalid={emailInvalid || !!error}
                                className="ledger-input"
                                style={{
                                    ...styles.input,
                                    ...((error || emailInvalid) && styles.inputError),
                                }}
                            />
                            {emailInvalid && (
                                <span style={styles.fieldHint}>That email looks incomplete. Try name@business.in</span>
                            )}
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
                            <div style={styles.passwordWrap}>
                                <input
                                    ref={passwordRef}
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyUp={handleKey}
                                    onKeyDown={handleKey}
                                    onBlur={() => setCapsOn(false)}
                                    required
                                    minLength={6}
                                    autoComplete="current-password"
                                    aria-invalid={!!error}
                                    className="ledger-input"
                                    style={{
                                        ...styles.input,
                                        ...styles.inputWithToggle,
                                        ...(error && styles.inputError),
                                    }}
                                />
                                <button
                                    type="button"
                                    className="ledger-link"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-pressed={showPassword}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    style={styles.toggleBtn}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            {capsOn && <span style={styles.fieldHint}>Caps Lock is on.</span>}
                        </div>

                        {error && (
                            <div key={shakeKey} className="fp-shake" style={styles.errorBox} role="alert">
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
                            {pending === "email" ? (
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
                            style={{
                                ...styles.googleButton,
                                ...(isLoading && pending !== "google" ? styles.buttonDisabled : {}),
                            }}
                        >
                            {pending === "google" ? (
                                <span style={styles.spinnerContainerDark}>
                                    <span style={styles.spinnerDark}></span>
                                    Opening Google…
                                </span>
                            ) : (
                                <>
                                    <svg style={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>
                    </form>

                    <div style={styles.footer}>
                        <span style={styles.footerText}>New here?</span>
                        <Link to="/register" className="ledger-link" style={styles.registerLink}>
                            Create your business →
                        </Link>
                    </div>
                    {CONFIG.signupNote && <div style={styles.signupNote}>{CONFIG.signupNote}</div>}

                    {CONFIG.demo.enabled && (
                        <div style={styles.demoBlock}>
                            <span style={styles.demoText}>Just looking around?</span>
                            <button
                                type="button"
                                onClick={handleDemo}
                                disabled={isLoading}
                                className="ledger-link"
                                style={styles.demoBtn}
                            >
                                {pending === "demo" ? "Opening demo…" : "Try the demo business"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ==========================================================================
   Fonts, keyframes, hover states & focus rings
   ========================================================================== */
const FONT_AND_MOTION_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500;1,600&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

    @keyframes ledgerCardIn {
        from { opacity: 0; transform: translateY(10px) rotate(-0.4deg); }
        to { opacity: 1; transform: translateY(0) rotate(0deg); }
    }
    @keyframes ledgerSpin { to { transform: rotate(360deg); } }
    @keyframes fpPreviewIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fpGrow {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
    }
    @keyframes fpShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
    }

    .ledger-card-enter { animation: ledgerCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .fp-preview-enter { animation: fpPreviewIn 0.35s ease both; }
    .fp-bar { transform-origin: left center; animation: fpGrow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .fp-shake { animation: fpShake 0.4s ease both; }

    @media (prefers-reduced-motion: reduce) {
        .ledger-card-enter, .fp-preview-enter, .fp-bar, .fp-shake { animation: none; }
    }

    .ledger-input:hover { border-color: #b9ab84; }
    .ledger-input:focus {
        outline: none;
        border-color: #1F6F54;
        box-shadow: 0 0 0 3px rgba(31, 111, 84, 0.15);
    }
    .ledger-btn-primary:hover:not(:disabled) { background: #195c46; }
    .ledger-btn-primary:active:not(:disabled) { transform: translateY(1px); }
    .ledger-btn-google:hover:not(:disabled) { border-color: #101C2C; background: #fbf7ec; }
    .ledger-link:hover { color: #101C2C; }

    .fp-chip:hover { border-color: rgba(201,162,39,0.7); color: #F1E9D6; }

    .ledger-link:focus-visible,
    .ledger-btn-primary:focus-visible,
    .ledger-btn-google:focus-visible,
    .fp-chip:focus-visible,
    .ledger-input:focus-visible {
        outline: 2px solid #C9A227;
        outline-offset: 2px;
    }
`;

/* ==========================================================================
   Palette
   ink:     #101C2C  – ledger cover / dark panel
   paper:   #F1E9D6  – parchment card
   emerald: #1F6F54  – stamp-ink green (primary action)
   gold:    #C9A227  – brass tab / accent
   margin:  #A64B3C  – classic red ledger margin rule
   ========================================================================== */

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        background: "#101C2C",
        fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    // ---------- Left panel ----------
    leftPanel: {
        flex: "0 0 48%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "32px",
        padding: "56px 56px 48px",
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
        margin: "0 0 28px",
        maxWidth: "460px",
    },
    heroCompact: {
        fontSize: "30px",
        margin: "0 0 20px",
    },
    heroAccent: {
        color: "#C9A227",
    },

    // Chips
    chipRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "20px",
    },
    chip: {
        padding: "8px 14px",
        background: "transparent",
        border: "1px solid rgba(241,233,214,0.22)",
        borderRadius: "999px",
        color: "rgba(241,233,214,0.7)",
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    chipActive: {
        background: "#C9A227",
        borderColor: "#C9A227",
        color: "#101C2C",
    },

    // Preview
    previewWrap: {
        maxWidth: "460px",
        borderTop: "1px solid rgba(241,233,214,0.15)",
        paddingTop: "16px",
    },
    previewCaption: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "12px",
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontSize: "16px",
        color: "rgba(241,233,214,0.85)",
        marginBottom: "14px",
    },
    previewSample: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontStyle: "normal",
        fontSize: "10px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "rgba(241,233,214,0.35)",
        flexShrink: 0,
    },
    previewBody: {
        borderLeft: "2px solid #A64B3C",
        paddingLeft: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: "168px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "12.5px",
        color: "rgba(241,233,214,0.8)",
    },
    pvRow: {
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
    },
    pvDots: {
        flex: 1,
        borderBottom: "1px dotted rgba(241,233,214,0.25)",
        transform: "translateY(-3px)",
    },
    pvAmt: { color: "#F1E9D6", flexShrink: 0 },
    pvStrong: { color: "#F1E9D6", flexShrink: 0 },
    pvMuted: { color: "rgba(241,233,214,0.4)", flexShrink: 0 },
    pvTotal: {
        marginTop: "4px",
        paddingTop: "10px",
        borderTop: "1px solid rgba(241,233,214,0.2)",
        color: "#F1E9D6",
        fontWeight: 500,
    },
    pvBadgeRow: { display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" },
    pvBadge: {
        padding: "2px 8px",
        border: "1px solid rgba(241,233,214,0.25)",
        borderRadius: "3px",
        fontSize: "10.5px",
        color: "rgba(241,233,214,0.75)",
        flexShrink: 0,
    },
    pvBadgeGreen: { borderColor: "#2E9A76", color: "#6FD0AC" },
    pvBadgeGold: { borderColor: "#C9A227", color: "#C9A227" },
    pvHint: { fontSize: "11.5px", color: "rgba(241,233,214,0.45)" },
    pvBarBlock: { display: "flex", flexDirection: "column", gap: "6px" },
    pvTrack: { height: "4px", background: "rgba(241,233,214,0.1)", borderRadius: "2px", overflow: "hidden" },
    pvFill: { height: "100%", borderRadius: "2px" },
    pvBubbleUser: {
        alignSelf: "flex-end",
        maxWidth: "85%",
        padding: "9px 12px",
        background: "rgba(241,233,214,0.1)",
        borderRadius: "10px 10px 2px 10px",
        color: "#F1E9D6",
    },
    pvBubbleAi: {
        alignSelf: "flex-start",
        maxWidth: "90%",
        padding: "9px 12px",
        background: "rgba(31,111,84,0.35)",
        border: "1px solid rgba(46,154,118,0.5)",
        borderRadius: "10px 10px 10px 2px",
        color: "#F1E9D6",
        lineHeight: 1.5,
    },

    // Left footer
    leftFooter: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    proof: {
        fontSize: "13px",
        color: "rgba(241,233,214,0.7)",
    },
    proofNumber: {
        color: "#F1E9D6",
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 500,
    },
    trustRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 18px",
    },
    trustItem: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        color: "rgba(241,233,214,0.4)",
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
        padding: "44px 36px 28px",
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
        marginBottom: "26px",
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
    notYou: {
        marginTop: "8px",
        padding: 0,
        background: "none",
        border: "none",
        color: "#8a7f66",
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "12px",
        textDecoration: "underline",
        cursor: "pointer",
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
        width: "100%",
    },
    inputError: {
        borderColor: "#A64B3C",
        background: "rgba(166,75,60,0.06)",
    },
    inputWithToggle: {
        paddingRight: "58px",
    },
    passwordWrap: {
        position: "relative",
    },
    toggleBtn: {
        position: "absolute",
        right: "6px",
        top: "50%",
        transform: "translateY(-50%)",
        padding: "6px 8px",
        background: "none",
        border: "none",
        color: "#8a7f66",
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
    },
    fieldHint: {
        color: "#7a3225",
        fontSize: "12px",
    },
    forgotLink: {
        color: "#8a7f66",
        fontSize: "12px",
        textDecoration: "none",
        borderBottom: "1px solid transparent",
    },
    errorBox: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(166,75,60,0.08)",
        borderLeft: "3px solid #A64B3C",
        borderRadius: "2px",
        color: "#7a3225",
        fontSize: "13px",
        lineHeight: 1.45,
    },
    errorTag: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "1px",
        textTransform: "uppercase",
        flexShrink: 0,
        paddingTop: "2px",
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
        transition: "background 0.2s ease, transform 0.1s ease",
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
    spinnerContainerDark: {
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
    spinnerDark: {
        width: "15px",
        height: "15px",
        border: "2px solid rgba(16,28,44,0.2)",
        borderTopColor: "#101C2C",
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
    signupNote: {
        marginTop: "6px",
        textAlign: "center",
        fontSize: "12px",
        color: "#8a7f66",
    },
    demoBlock: {
        marginTop: "18px",
        paddingTop: "14px",
        borderTop: "1px dashed rgba(16,28,44,0.2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        fontSize: "12.5px",
    },
    demoText: {
        color: "#a39a84",
    },
    demoBtn: {
        padding: 0,
        background: "none",
        border: "none",
        color: "#4a4438",
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "12.5px",
        fontWeight: 600,
        textDecoration: "underline",
        cursor: "pointer",
    },
};