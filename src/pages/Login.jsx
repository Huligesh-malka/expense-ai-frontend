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
   Features — the five chips. Each one drives the preview on the left.
   Describes what the product does. No sample transactions or invented numbers.
   `line` is the short version (shown on small screens where the preview is hidden).
   Give a feature `tags` (capability chips) or `flow` (an ordered sequence).
   ========================================================================== */
const FEATURES = [
    {
        id: "billing",
        label: "Billing",
        line: "Create professional bills and keep every sale organized.",
        headline: "Simple billing. Organized sales.",
        text: "Create bills, record payments and keep your sales history in one place.",
        tags: ["Fast billing", "Payment tracking", "Digital bills"],
    },
    {
        id: "qr",
        label: "QR Ordering",
        line: "Let customers scan, choose products and place orders from their phone.",
        headline: "Let customers order from their phones.",
        text: "Customers scan your QR, browse your products, add items to their cart and place an order.",
        flow: ["Scan QR", "Select", "Order", "Owner accepts"],
    },
    {
        id: "inventory",
        label: "Inventory",
        line: "Track stock automatically and know what needs to be reordered.",
        headline: "Know your stock at a glance.",
        text: "Track products, quantities and low-stock items so you can manage inventory before you run out.",
        tags: ["Products", "Stock levels", "Low-stock alerts"],
    },
    {
        id: "expenses",
        label: "Expenses",
        line: "Record business expenses and see where your money is going.",
        headline: "Know where your money goes.",
        text: "Record purchases and business expenses in one place and understand your spending.",
        tags: ["Purchases", "Expenses", "Reports"],
    },
    {
        id: "ai",
        label: "AI Business",
        line: "Turn your business data into clear answers and useful insights.",
        headline: "Ask your business. Get clear answers.",
        text: "Let AI analyze your sales, expenses, inventory and business activity to help you understand what's happening.",
        tags: ["Sales insights", "Expense analysis", "Business questions"],
    },
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
        typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
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
        [
            "userId",
            "userName",
            "userEmail",
            "businessId",
            "businessName",
            "businessType",
            LAST_EMAIL_KEY,
        ].forEach(safeRemove);
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
            "Google sign-in failed. Please try again.",
        );

    const handleDemo = () =>
        runAuth(
            "demo",
            () => API.post("/auth/login", { email: CONFIG.demo.email, password: CONFIG.demo.password }),
            "The demo is unavailable right now. Please try again.",
        );

    /* ---------- derived ---------- */

    const emailInvalid = emailTouched && formData.email.length > 0 && !EMAIL_RE.test(formData.email);
    const current = FEATURES[active];
    const greeting = getGreeting();
    const title = returning.name ? `${greeting}, ${returning.name}` : greeting;
    const subtitle = returning.business
        ? `${returning.business} is ready when you are.`
        : "Sign in to open your books.";


    /* ---------- render ---------- */

    return (
        <div style={styles.page}>
            <style>{FONT_AND_MOTION_CSS}</style>

            {/* ===================== TOP NAV ===================== */}
            <header style={styles.topNav}>
                <Link to="/" style={styles.navBrand}>
                    <span style={styles.brandMark}>F</span>
                    <span>
                        <span style={styles.brandName}>{CONFIG.brand}</span>
                        <span style={styles.brandSub}>AI BUSINESS MANAGEMENT</span>
                    </span>
                </Link>

                <nav style={styles.navLinks} aria-label="Main navigation">
                    <Link to="/business-benefits" className="fp-nav-link" style={styles.navLink}>
                        Why FinancePro
                    </Link>
                    <Link to="/how-it-works" className="fp-nav-link" style={styles.navLink}>
                        How it works
                    </Link>
                    <Link to="/business-guide" className="fp-nav-link" style={styles.navLink}>
                        Business guide
                    </Link>
                    <a href="#features" className="fp-nav-link" style={styles.navLink}>
                        Features
                    </a>
                </nav>

                <div style={styles.navActions}>
                    <Link to="/login" className="fp-login-link" style={styles.navLogin}>
                        Login
                    </Link>
                    <Link to="/register" className="fp-signup" style={styles.navSignup}>
                        Sign up
                    </Link>
                </div>
            </header>

            {/* ===================== HERO ===================== */}
            <main>
                <section style={styles.heroSection}>
                    <div style={styles.heroContainer}>

                        {/* LEFT: VALUE PROPOSITION */}
                        <div style={styles.heroCopy}>
                            <div style={styles.eyebrow}>
                                <span style={styles.eyebrowDot}></span>
                                Built for everyday business
                            </div>

                            <h1 style={styles.mainHeadline}>
                                Run your business.
                                <br />
                                <span style={styles.mainHeadlineAccent}>
                                    Understand every number.
                                </span>
                            </h1>

                            <p style={styles.heroText}>
                                Billing, inventory, expenses, customers, purchases,
                                QR ordering and AI business insights — connected in
                                one workspace for the owner.
                            </p>

                            <div style={styles.heroActions}>
                                <Link to="/register" className="fp-primary-cta" style={styles.primaryCta}>
                                    Create your business
                                    <span style={styles.ctaArrow}>→</span>
                                </Link>

                                <Link to="/how-it-works" className="fp-secondary-cta" style={styles.secondaryCta}>
                                    See how it works
                                </Link>
                            </div>

                            <div style={styles.heroTrust}>
                                <span>✓ Simple setup</span>
                                <span>✓ Owner-focused workflow</span>
                                <span>✓ Business-level access control</span>
                            </div>
                        </div>

                        {/* RIGHT: LOGIN / BUSINESS WORKSPACE PREVIEW */}
                        <div style={styles.heroVisual}>
                            <div style={styles.visualGlow}></div>

                            <div className="fp-dashboard-card" style={styles.dashboardCard}>
                                <div style={styles.dashboardTop}>
                                    <div>
                                        <div style={styles.dashboardEyebrow}>OWNER WORKSPACE</div>
                                        <div style={styles.dashboardTitle}>Your business at a glance</div>
                                    </div>
                                    <span style={styles.livePill}>● LIVE</span>
                                </div>

                                <div style={styles.metricGrid}>
                                    <div style={styles.metricCard}>
                                        <span style={styles.metricLabel}>TODAY'S SALES</span>
                                        <strong>Business data</strong>
                                        <small>Connected to your workflow</small>
                                    </div>
                                    <div style={styles.metricCard}>
                                        <span style={styles.metricLabel}>INVENTORY</span>
                                        <strong>Stock visibility</strong>
                                        <small>Know what needs attention</small>
                                    </div>
                                    <div style={styles.metricCard}>
                                        <span style={styles.metricLabel}>AI BUSINESS</span>
                                        <strong>Clear answers</strong>
                                        <small>Ask about authorized data</small>
                                    </div>
                                </div>

                                <div style={styles.chartPanel}>
                                    <div style={styles.chartHeader}>
                                        <span>Connected business operations</span>
                                        <span style={styles.chartPeriod}>OWNER VIEW</span>
                                    </div>
                                    <div style={styles.chartBars}>
                                        {[42, 58, 48, 76, 62, 88, 70, 94, 78, 100, 84, 92].map((height, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    ...styles.chartBar,
                                                    height: `${height}%`,
                                                    opacity: 0.42 + i * 0.04,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div style={styles.chartFooter}>
                                        <span>Sales</span>
                                        <span>Inventory</span>
                                        <span>Expenses</span>
                                        <span>AI insights</span>
                                    </div>
                                </div>

                                <div style={styles.quickRow}>
                                    <div style={styles.quickItem}>
                                        <span style={styles.quickIcon}>₹</span>
                                        <span><b>Billing</b><small>Create and track sales</small></span>
                                    </div>
                                    <div style={styles.quickItem}>
                                        <span style={styles.quickIcon}>▦</span>
                                        <span><b>QR Ordering</b><small>Customers order by phone</small></span>
                                    </div>
                                    <div style={styles.quickItem}>
                                        <span style={styles.quickIcon}>AI</span>
                                        <span><b>AI Business</b><small>Ask useful questions</small></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===================== THREE OWNER PAGES ===================== */}
                <section id="features" style={styles.educationSection}>
                    <div style={styles.sectionContainer}>
                        <div style={styles.sectionIntro}>
                            <span style={styles.sectionKicker}>BEFORE YOU START</span>
                            <h2 style={styles.sectionTitle}>
                                See how FinancePro fits your business.
                            </h2>
                            <p style={styles.sectionText}>
                                We want an owner to understand the product before creating
                                an account. Explore the three guides below.
                            </p>
                        </div>

                        <div style={styles.educationGrid}>
                            <Link to="/business-benefits" className="fp-education-card" style={styles.educationCard}>
                                <div style={styles.cardNumber}>01</div>
                                <div style={styles.cardIcon}>✦</div>
                                <h3 style={styles.cardTitle}>Why FinancePro?</h3>
                                <p style={styles.cardText}>
                                    Understand the practical benefits of connecting
                                    billing, inventory, expenses, customers and AI.
                                </p>
                                <span style={styles.cardLink}>Explore benefits →</span>
                            </Link>

                            <Link to="/how-it-works" className="fp-education-card" style={styles.educationCard}>
                                <div style={styles.cardNumber}>02</div>
                                <div style={styles.cardIcon}>↗</div>
                                <h3 style={styles.cardTitle}>How it works</h3>
                                <p style={styles.cardText}>
                                    Follow the owner journey from creating a business
                                    to billing, inventory, reports and AI.
                                </p>
                                <span style={styles.cardLink}>See the workflow →</span>
                            </Link>

                            <Link to="/business-guide" className="fp-education-card" style={styles.educationCard}>
                                <div style={styles.cardNumber}>03</div>
                                <div style={styles.cardIcon}>▤</div>
                                <h3 style={styles.cardTitle}>Business guide</h3>
                                <p style={styles.cardText}>
                                    See what you can manage: products, customers,
                                    suppliers, purchases, QR ordering, expenses and reports.
                                </p>
                                <span style={styles.cardLink}>Explore modules →</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ===================== FEATURE STRIP ===================== */}
                <section style={styles.featureSection}>
                    <div style={styles.sectionContainer}>
                        <div style={styles.featureHeader}>
                            <div>
                                <span style={styles.sectionKicker}>ONE WORKSPACE</span>
                                <h2 style={styles.sectionTitle}>Built around the owner's day.</h2>
                            </div>
                            <Link to="/business-guide" style={styles.textButton}>
                                View all modules →
                            </Link>
                        </div>

                        <div style={styles.featureGrid}>
                            {FEATURES.map((feature) => (
                                <Link
                                    key={feature.id}
                                    to="/business-guide"
                                    className="fp-feature-card"
                                    style={styles.featureCard}
                                >
                                    <span style={styles.featureDot}></span>
                                    <span style={styles.featureName}>{feature.label}</span>
                                    <span style={styles.featureDescription}>{feature.line}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===================== FINAL CTA ===================== */}
                <section style={styles.finalSection}>
                    <div style={styles.finalCard}>
                        <div>
                            <span style={styles.sectionKickerLight}>READY WHEN YOU ARE</span>
                            <h2 style={styles.finalTitle}>Start with your business.</h2>
                            <p style={styles.finalText}>
                                Create your workspace and build your daily workflow around
                                the information you actually need.
                            </p>
                        </div>
                        <div style={styles.finalActions}>
                            <Link to="/register" style={styles.finalPrimary}>
                                Create your business →
                            </Link>
                            <Link to="/login" style={styles.finalSecondary}>
                                Already have an account? Login
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ===================== LOGIN DRAWER / CARD ===================== */}
            <section style={styles.loginSection} id="login">
                <div style={styles.loginContainer}>
                    <div style={styles.loginIntro}>
                        <span style={styles.sectionKicker}>OWNER LOGIN</span>
                        <h2 style={styles.loginTitle}>
                            Open your business workspace.
                        </h2>
                        <p style={styles.loginText}>
                            Sign in to continue billing, inventory, expenses, purchases,
                            reports and AI business management.
                        </p>

                        <div style={styles.loginFeatureList}>
                            {["Billing & sales", "Inventory & purchases", "Customers & suppliers", "AI business insights"].map((item) => (
                                <span key={item} style={styles.loginFeature}>
                                    <span style={styles.check}>✓</span>{item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="ledger-card-enter" style={styles.card}>
                        <div style={styles.ledgerTab}>SIGN IN</div>

                        <div style={styles.cardHead}>
                            <h2 style={styles.cardTitle}>{title}</h2>
                            <p style={styles.cardSubtitle}>{subtitle}</p>

                            {returning.name && (
                                <button
                                    type="button"
                                    className="ledger-link"
                                    style={styles.notYou}
                                    onClick={forgetReturning}
                                >
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
                                    <span style={styles.fieldHint}>
                                        That email looks incomplete. Try name@business.in
                                    </span>
                                )}
                            </div>

                            <div style={styles.inputGroup}>
                                <div style={styles.labelRow}>
                                    <label style={styles.label} htmlFor="login-password">
                                        Password
                                    </label>

                                    <Link
                                        to="/forgot-password"
                                        className="ledger-link"
                                        style={styles.forgotLink}
                                    >
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

                                {capsOn && (
                                    <span style={styles.fieldHint}>Caps Lock is on.</span>
                                )}
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

                        {CONFIG.signupNote && (
                            <div style={styles.signupNote}>{CONFIG.signupNote}</div>
                        )}

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
            </section>

            <footer style={styles.siteFooter}>
                <div style={styles.footerInner}>
                    <div>
                        <div style={styles.footerBrand}>{CONFIG.brand}</div>
                        <div style={styles.footerMuted}>AI BUSINESS MANAGEMENT</div>
                    </div>

                    <div style={styles.footerLinks}>
                        <Link to="/business-benefits" style={styles.footerLink}>Why FinancePro</Link>
                        <Link to="/how-it-works" style={styles.footerLink}>How it works</Link>
                        <Link to="/business-guide" style={styles.footerLink}>Business guide</Link>
                        <Link to="/register" style={styles.footerLink}>Create business</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}


const FONT_AND_MOTION_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500;1,600&family=Work+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

    html { scroll-behavior: smooth; }

    @keyframes ledgerCardIn {
        from { opacity: 0; transform: translateY(10px) rotate(-0.4deg); }
        to { opacity: 1; transform: translateY(0) rotate(0deg); }
    }

    @keyframes ledgerSpin { to { transform: rotate(360deg); } }

    @keyframes floatCard {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
    }

    @keyframes barRise {
        from { transform: scaleY(0.3); opacity: 0; }
        to { transform: scaleY(1); opacity: 1; }
    }

    @keyframes fpShake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(3px); }
    }

    .ledger-card-enter { animation: ledgerCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .fp-dashboard-card { animation: floatCard 6s ease-in-out infinite; }
    .fp-chart-bar { transform-origin: bottom; animation: barRise 0.8s ease both; }
    .fp-shake { animation: fpShake 0.4s ease both; }

    .fp-nav-link:hover { color: #1F6F54 !important; }
    .fp-login-link:hover { color: #1F6F54 !important; }
    .fp-signup:hover { transform: translateY(-1px); box-shadow: 0 10px 25px rgba(31,111,84,.18); }
    .fp-primary-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(31,111,84,.22); }
    .fp-secondary-cta:hover { border-color: #1F6F54 !important; color: #1F6F54 !important; }
    .fp-education-card:hover { transform: translateY(-5px); border-color: #C9A227 !important; box-shadow: 0 18px 42px rgba(16,28,44,.10) !important; }
    .fp-feature-card:hover { transform: translateY(-3px); border-color: rgba(201,162,39,.65) !important; }
    .fp-login-link:focus-visible,
    .fp-nav-link:focus-visible,
    .fp-signup:focus-visible,
    .fp-primary-cta:focus-visible,
    .fp-secondary-cta:focus-visible,
    .fp-education-card:focus-visible,
    .fp-feature-card:focus-visible,
    .ledger-input:focus-visible,
    .ledger-btn-primary:focus-visible,
    .ledger-btn-google:focus-visible {
        outline: 2px solid #C9A227;
        outline-offset: 3px;
    }

    .ledger-input:hover { border-color: #b9ab84; }
    .ledger-input:focus {
        outline: none;
        border-color: #1F6F54;
        box-shadow: 0 0 0 3px rgba(31,111,84,.15);
    }
    .ledger-btn-primary:hover:not(:disabled) { background: #195c46; }
    .ledger-btn-primary:active:not(:disabled) { transform: translateY(1px); }
    .ledger-btn-google:hover:not(:disabled) { border-color: #101C2C; background: #fbf7ec; }
    .ledger-link:hover { color: #101C2C; }

    @media (max-width: 900px) {
        .fp-nav-links { display: none !important; }
        .fp-hero-container { grid-template-columns: 1fr !important; }
        .fp-hero-copy { padding-top: 20px !important; }
        .fp-hero-visual { max-width: 680px; margin: 0 auto; width: 100%; }
        .fp-education-grid { grid-template-columns: 1fr !important; }
        .fp-feature-grid { grid-template-columns: repeat(2,1fr) !important; }
        .fp-login-container { grid-template-columns: 1fr !important; }
    }

    @media (max-width: 640px) {
        .fp-top-nav { padding: 14px 18px !important; }
        .fp-nav-actions { gap: 8px !important; }
        .fp-nav-login { display: none !important; }
        .fp-hero-section { padding: 48px 18px 55px !important; }
        .fp-main-headline { font-size: 43px !important; }
        .fp-hero-actions { flex-direction: column !important; align-items: stretch !important; }
        .fp-primary-cta, .fp-secondary-cta { justify-content: center !important; text-align: center !important; }
        .fp-hero-trust { flex-direction: column !important; gap: 7px !important; }
        .fp-section-container { width: min(92vw,1120px) !important; }
        .fp-feature-grid { grid-template-columns: 1fr !important; }
        .fp-login-section { padding: 55px 18px !important; }
        .fp-final-card { padding: 28px !important; }
        .fp-final-actions { flex-direction: column !important; align-items: stretch !important; }
        .fp-final-primary, .fp-final-secondary { text-align: center !important; }
        .fp-footer-inner { flex-direction: column !important; align-items: flex-start !important; }
    }

    @media (prefers-reduced-motion: reduce) {
        .ledger-card-enter, .fp-dashboard-card, .fp-chart-bar, .fp-shake {
            animation: none !important;
        }
    }
`;

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F8F9F6",
        color: "#101C2C",
        fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    topNav: {
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "22px",
        padding: "14px 5vw",
        background: "rgba(248,249,246,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #E5E8E2",
    },

    navBrand: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "#101C2C",
        textDecoration: "none",
        minWidth: "185px",
    },

    brandMark: {
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        background: "#1F6F54",
        color: "#F1E9D6",
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "21px",
    },

    brandName: {
        display: "block",
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "22px",
        lineHeight: 1,
    },

    brandSub: {
        display: "block",
        marginTop: "3px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "8px",
        letterSpacing: "1.4px",
        color: "#8A8F88",
    },

    navLinks: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        flex: 1,
    },

    navLink: {
        padding: "9px 12px",
        color: "#4F5966",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 600,
        borderRadius: "8px",
        transition: "color .2s ease",
    },

    navActions: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "185px",
        justifyContent: "flex-end",
    },

    navLogin: {
        color: "#343C48",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 700,
        padding: "9px 10px",
    },

    navSignup: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 17px",
        background: "#2E5BFF",
        color: "#fff",
        borderRadius: "9px",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 700,
        transition: "all .2s ease",
        boxShadow: "0 7px 18px rgba(46,91,255,.13)",
    },

    heroSection: {
        background:
            "radial-gradient(circle at 82% 24%, rgba(201,162,39,.12), transparent 30%), linear-gradient(180deg,#FBFCFA 0%,#F4F6F2 100%)",
        borderBottom: "1px solid #E6E9E3",
        padding: "74px 5vw 84px",
    },

    heroContainer: {
        width: "min(1180px, 100%)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr .95fr",
        gap: "64px",
        alignItems: "center",
    },

    heroCopy: {
        maxWidth: "620px",
    },

    eyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 11px",
        border: "1px solid #B7E2C8",
        background: "#ECF8F0",
        color: "#1F6F54",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: ".04em",
    },

    eyebrowDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#1F9A63",
    },

    mainHeadline: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "clamp(46px, 5.4vw, 72px)",
        lineHeight: 1.03,
        letterSpacing: "-2.6px",
        margin: "21px 0 18px",
        color: "#101C2C",
    },

    mainHeadlineAccent: {
        color: "#C39B20",
    },

    heroText: {
        maxWidth: "610px",
        color: "#606B78",
        fontSize: "17px",
        lineHeight: 1.7,
        margin: 0,
    },

    heroActions: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
        marginTop: "29px",
    },

    primaryCta: {
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        background: "#2E5BFF",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "9px",
        padding: "13px 18px",
        fontSize: "14px",
        fontWeight: 700,
        transition: "all .2s ease",
    },

    ctaArrow: {
        fontSize: "18px",
        lineHeight: 1,
    },

    secondaryCta: {
        display: "inline-flex",
        alignItems: "center",
        background: "#fff",
        color: "#101C2C",
        textDecoration: "none",
        border: "1px solid #D9DED8",
        borderRadius: "9px",
        padding: "12px 17px",
        fontSize: "14px",
        fontWeight: 700,
        transition: "all .2s ease",
    },

    heroTrust: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 20px",
        marginTop: "23px",
        color: "#7A847E",
        fontSize: "11.5px",
    },

    heroVisual: {
        position: "relative",
        minHeight: "450px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    visualGlow: {
        position: "absolute",
        width: "360px",
        height: "360px",
        borderRadius: "50%",
        background: "rgba(46,91,255,.07)",
        filter: "blur(10px)",
    },

    dashboardCard: {
        position: "relative",
        width: "100%",
        maxWidth: "570px",
        background: "#101C2C",
        borderRadius: "22px",
        padding: "18px",
        boxShadow: "0 28px 70px rgba(16,28,44,.22)",
        border: "1px solid rgba(255,255,255,.08)",
    },

    dashboardTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 4px 16px",
        color: "#fff",
    },

    dashboardEyebrow: {
        color: "#93A0B0",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        letterSpacing: "1.3px",
    },

    dashboardTitle: {
        marginTop: "5px",
        fontSize: "17px",
        fontWeight: 700,
    },

    livePill: {
        padding: "6px 9px",
        borderRadius: "999px",
        background: "rgba(31,154,99,.13)",
        color: "#79D7A8",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
    },

    metricGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "9px",
    },

    metricCard: {
        background: "#F7F9F7",
        borderRadius: "12px",
        padding: "14px",
        minHeight: "95px",
        boxSizing: "border-box",
    },

    metricLabel: {
        display: "block",
        fontFamily: "'IBM Plex Mono', monospace",
        color: "#89929E",
        fontSize: "8px",
        letterSpacing: ".8px",
    },

    metricCardStrong: {},
    metricCardSmall: {},

    chartPanel: {
        marginTop: "10px",
        padding: "16px",
        background: "#182638",
        borderRadius: "13px",
        border: "1px solid rgba(255,255,255,.06)",
    },

    chartHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        color: "#D9E0E8",
        fontSize: "11px",
        marginBottom: "14px",
    },

    chartPeriod: {
        color: "#8C9AA9",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "8px",
    },

    chartBars: {
        height: "105px",
        display: "flex",
        alignItems: "flex-end",
        gap: "7px",
        padding: "0 4px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
    },

    chartBar: {
        flex: 1,
        minWidth: "6px",
        background: "#C9A227",
        borderRadius: "5px 5px 0 0",
        transformOrigin: "bottom",
        animation: "barRise .8s ease both",
    },

    chartFooter: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "10px",
        color: "#8290A0",
        fontSize: "9px",
    },

    quickRow: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "9px",
        marginTop: "10px",
    },

    quickItem: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        background: "#fff",
        borderRadius: "10px",
        padding: "10px",
        minWidth: 0,
    },

    quickIcon: {
        flexShrink: 0,
        width: "28px",
        height: "28px",
        display: "grid",
        placeItems: "center",
        borderRadius: "8px",
        background: "#EAF0FF",
        color: "#2E5BFF",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        fontWeight: 700,
    },

    quickItemText: {},
    quickItemB: {},
    quickItemSmall: {},

    educationSection: {
        padding: "82px 5vw",
        background: "#fff",
    },

    sectionContainer: {
        width: "min(1120px,100%)",
        margin: "0 auto",
    },

    sectionIntro: {
        maxWidth: "720px",
    },

    sectionKicker: {
        color: "#C39B20",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "1.5px",
    },

    sectionTitle: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "clamp(31px,4vw,47px)",
        lineHeight: 1.1,
        letterSpacing: "-1px",
        margin: "9px 0 10px",
        color: "#101C2C",
    },

    sectionText: {
        margin: 0,
        color: "#687482",
        fontSize: "15px",
        lineHeight: 1.7,
    },

    educationGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "16px",
        marginTop: "34px",
    },

    educationCard: {
        position: "relative",
        display: "block",
        textDecoration: "none",
        color: "#101C2C",
        background: "#FBFCFA",
        border: "1px solid #E2E7E0",
        borderRadius: "18px",
        padding: "25px",
        minHeight: "255px",
        transition: "all .22s ease",
        boxShadow: "0 8px 24px rgba(16,28,44,.04)",
        boxSizing: "border-box",
    },

    cardNumber: {
        position: "absolute",
        top: "20px",
        right: "22px",
        color: "#B2B8B2",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
    },

    cardIcon: {
        width: "40px",
        height: "40px",
        display: "grid",
        placeItems: "center",
        background: "#101C2C",
        color: "#C9A227",
        borderRadius: "10px",
        fontFamily: "'Fraunces', serif",
        fontSize: "19px",
    },

    cardTitle: {
        margin: "22px 0 9px",
        fontSize: "20px",
        fontWeight: 700,
    },

    cardText: {
        margin: 0,
        color: "#687482",
        fontSize: "13.5px",
        lineHeight: 1.65,
    },

    cardLink: {
        display: "inline-block",
        marginTop: "20px",
        color: "#1F6F54",
        fontSize: "12px",
        fontWeight: 700,
    },

    featureSection: {
        padding: "72px 5vw",
        background: "#F3F5F1",
        borderTop: "1px solid #E5E9E3",
        borderBottom: "1px solid #E5E9E3",
    },

    featureHeader: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "20px",
    },

    textButton: {
        color: "#1F6F54",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 700,
        whiteSpace: "nowrap",
    },

    featureGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: "10px",
        marginTop: "30px",
    },

    featureCard: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        textDecoration: "none",
        color: "#101C2C",
        background: "#fff",
        border: "1px solid #E0E5DE",
        borderRadius: "13px",
        padding: "18px",
        minHeight: "150px",
        transition: "all .2s ease",
    },

    featureDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#C9A227",
    },

    featureName: {
        fontWeight: 700,
        fontSize: "14px",
    },

    featureDescription: {
        color: "#718090",
        fontSize: "12px",
        lineHeight: 1.55,
    },

    finalSection: {
        padding: "72px 5vw",
        background: "#fff",
    },

    finalCard: {
        width: "min(1120px,100%)",
        margin: "0 auto",
        boxSizing: "border-box",
        background: "#101C2C",
        color: "#fff",
        borderRadius: "23px",
        padding: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "30px",
    },

    sectionKickerLight: {
        color: "#C9A227",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "1.5px",
    },

    finalTitle: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontStyle: "italic",
        fontSize: "38px",
        margin: "9px 0 8px",
    },

    finalText: {
        color: "#B8C2CF",
        maxWidth: "610px",
        fontSize: "14px",
        lineHeight: 1.65,
        margin: 0,
    },

    finalActions: {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "10px",
        minWidth: "220px",
    },

    finalPrimary: {
        padding: "12px 16px",
        borderRadius: "9px",
        background: "#C9A227",
        color: "#101C2C",
        textDecoration: "none",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "13px",
    },

    finalSecondary: {
        padding: "11px 16px",
        borderRadius: "9px",
        border: "1px solid rgba(241,233,214,.22)",
        color: "#F1E9D6",
        textDecoration: "none",
        textAlign: "center",
        fontSize: "12px",
    },

    loginSection: {
        padding: "86px 5vw",
        background: "#EEF1EC",
        borderTop: "1px solid #E0E5DE",
    },

    loginContainer: {
        width: "min(1020px,100%)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 410px",
        gap: "60px",
        alignItems: "center",
    },

    loginIntro: {
        maxWidth: "520px",
    },

    loginTitle: {
        fontFamily: "'Fraunces', Georgia, serif",
        fontStyle: "italic",
        fontSize: "clamp(35px,4vw,53px)",
        lineHeight: 1.08,
        margin: "11px 0 14px",
        color: "#101C2C",
    },

    loginText: {
        color: "#687482",
        lineHeight: 1.7,
        fontSize: "15px",
        margin: 0,
    },

    loginFeatureList: {
        display: "grid",
        gap: "11px",
        marginTop: "26px",
    },

    loginFeature: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: "#3F4A55",
        fontSize: "13px",
        fontWeight: 600,
    },

    check: {
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "#DCEFE4",
        color: "#1F6F54",
        fontSize: "11px",
        fontWeight: 800,
    },

    // Ledger login card
    card: {
        width: "100%",
        maxWidth: "410px",
        boxSizing: "border-box",
        background: "#F1E9D6",
        backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 30px, rgba(16,28,44,0.05) 30px 31px)",
        borderRadius: "6px",
        padding: "44px 36px 28px",
        position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,.22)",
        border: "1px solid rgba(16,28,44,.06)",
        justifySelf: "center",
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
        boxShadow: "0 -2px 8px rgba(0,0,0,.15)",
    },

    cardHead: { marginBottom: "26px" },

    cardTitle: {
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "26px",
        color: "#101C2C",
        margin: "0 0 6px",
    },

    cardSubtitle: {
        color: "#6B6355",
        fontSize: "14px",
        margin: 0,
    },

    notYou: {
        marginTop: "8px",
        padding: 0,
        background: "none",
        border: "none",
        color: "#8A7F66",
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
        color: "#4A4438",
        fontSize: "12.5px",
        fontWeight: 500,
    },

    input: {
        padding: "12px 14px",
        background: "#FBF8F0",
        border: "1.5px solid rgba(16,28,44,.15)",
        borderRadius: "6px",
        color: "#101C2C",
        fontSize: "14.5px",
        fontFamily: "'IBM Plex Mono', monospace",
        outline: "none",
        transition: "border-color .2s ease, box-shadow .2s ease",
        boxSizing: "border-box",
        width: "100%",
    },

    inputError: {
        borderColor: "#A64B3C",
        background: "rgba(166,75,60,.06)",
    },

    inputWithToggle: { paddingRight: "58px" },

    passwordWrap: { position: "relative" },

    toggleBtn: {
        position: "absolute",
        right: "6px",
        top: "50%",
        transform: "translateY(-50%)",
        padding: "6px 8px",
        background: "none",
        border: "none",
        color: "#8A7F66",
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
    },

    fieldHint: {
        color: "#7A3225",
        fontSize: "12px",
    },

    forgotLink: {
        color: "#8A7F66",
        fontSize: "12px",
        textDecoration: "none",
        borderBottom: "1px solid transparent",
    },

    errorBox: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "10px 14px",
        background: "rgba(166,75,60,.08)",
        borderLeft: "3px solid #A64B3C",
        borderRadius: "2px",
        color: "#7A3225",
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
        transition: "background .2s ease, transform .1s ease",
        fontFamily: "'Work Sans', sans-serif",
    },

    buttonDisabled: {
        opacity: .6,
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
        border: "2px solid rgba(241,233,214,.3)",
        borderTopColor: "#F1E9D6",
        borderRadius: "50%",
        display: "inline-block",
        animation: "ledgerSpin .7s linear infinite",
    },

    spinnerDark: {
        width: "15px",
        height: "15px",
        border: "2px solid rgba(16,28,44,.2)",
        borderTopColor: "#101C2C",
        borderRadius: "50%",
        display: "inline-block",
        animation: "ledgerSpin .7s linear infinite",
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
        background: "rgba(16,28,44,.12)",
    },

    dividerText: {
        color: "#A39A84",
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
        border: "1.5px solid rgba(16,28,44,.15)",
        borderRadius: "6px",
        color: "#101C2C",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all .2s ease",
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
        borderTop: "1px dashed rgba(16,28,44,.15)",
        fontSize: "13.5px",
    },

    footerText: { color: "#8A7F66" },

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
        color: "#8A7F66",
    },

    demoBlock: {
        marginTop: "18px",
        paddingTop: "14px",
        borderTop: "1px dashed rgba(16,28,44,.2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        fontSize: "12.5px",
    },

    demoText: { color: "#A39A84" },

    demoBtn: {
        padding: 0,
        background: "none",
        border: "none",
        color: "#4A4438",
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "12.5px",
        fontWeight: 600,
        textDecoration: "underline",
        cursor: "pointer",
    },

    siteFooter: {
        background: "#101C2C",
        color: "#fff",
        padding: "30px 5vw",
    },

    footerInner: {
        width: "min(1120px,100%)",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "25px",
    },

    footerBrand: {
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
        fontSize: "22px",
    },

    footerMuted: {
        marginTop: "4px",
        color: "#748293",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "8px",
        letterSpacing: "1.3px",
    },

    footerLinks: {
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
        justifyContent: "flex-end",
    },

    footerLink: {
        color: "#AEB8C5",
        textDecoration: "none",
        fontSize: "11px",
    },
};
