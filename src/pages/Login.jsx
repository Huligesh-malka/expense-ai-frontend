
import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

const CONFIG = {
  brand: "FinancePro",
  tagline: "AI BUSINESS MANAGEMENT",
  signupNote: "Set up in about 2 minutes",
  trust: ["Secure sign-in", "Your data stays yours", "Built for Indian businesses"],
  demo: { enabled: true, email: "demo@financepro.com", password: "password123" },
};

const LAST_EMAIL_KEY = "financepro_last_email";

const FEATURES = [
  {
    id: "billing",
    icon: "₹",
    label: "Billing",
    eyebrow: "SALES WORKFLOW",
    headline: "Create bills without breaking your flow.",
    description:
      "Create professional bills, record payments and keep sales history connected to the rest of your business.",
    points: ["Create bills", "Record payments", "Sales history"],
    screenTitle: "Billing workspace",
    screenText: "Create a sale, add products and keep the transaction connected.",
  },
  {
    id: "inventory",
    icon: "▦",
    label: "Inventory",
    eyebrow: "STOCK CONTROL",
    headline: "Know what needs attention.",
    description:
      "Keep products, quantities and low-stock information together so the owner can act before stock becomes a problem.",
    points: ["Products", "Stock levels", "Low-stock attention"],
    screenTitle: "Inventory workspace",
    screenText: "See products, units and stock status from one place.",
  },
  {
    id: "qr",
    icon: "⌗",
    label: "QR Ordering",
    eyebrow: "CUSTOMER ORDERING",
    headline: "Let customers order from their phone.",
    description:
      "Customers can scan a QR, browse the available products, build an order and send it to the owner workflow.",
    points: ["Scan QR", "Choose products", "Send order"],
    screenTitle: "QR ordering",
    screenText: "Customer order flow connected to the owner's workspace.",
  },
  {
    id: "expenses",
    icon: "↘",
    label: "Expenses",
    eyebrow: "MONEY CONTROL",
    headline: "See where business money goes.",
    description:
      "Record purchases and expenses in one place and turn everyday spending into useful business information.",
    points: ["Purchases", "Expenses", "Reports"],
    screenTitle: "Expense workspace",
    screenText: "Keep business spending organized and ready for review.",
  },
  {
    id: "ai",
    icon: "✦",
    label: "AI Business",
    eyebrow: "BUSINESS INTELLIGENCE",
    headline: "Ask your business. Get clear answers.",
    description:
      "Use AI to analyze authorized business information and turn sales, expenses, inventory and activity into understandable answers.",
    points: ["Sales insights", "Expense analysis", "Business questions"],
    screenTitle: "AI Business",
    screenText: "Ask questions about the business data your account is authorized to access.",
  },
];

const JOURNEY = [
  ["01", "Create your business", "Set up the owner workspace and business details."],
  ["02", "Add products", "Add products, prices, units, stock and categories."],
  ["03", "Start selling", "Use billing to create sales and keep the history connected."],
  ["04", "Stay in control", "Review stock, purchases, expenses, customers and reports."],
  ["05", "Use AI", "Ask questions and understand the information already in your workspace."],
];

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
  } catch {}
};

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {}
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function useIsMobile(breakpoint = 760) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return mobile;
}

function Brand() {
  return (
    <Link to="/" className="fp-brand">
      <span className="fp-brand-mark">F</span>
      <span>
        <strong>FinancePro</strong>
        <small>{CONFIG.tagline}</small>
      </span>
    </Link>
  );
}

function DashboardPreview({ feature }) {
  const isAI = feature.id === "ai";
  const isQR = feature.id === "qr";
  const isInventory = feature.id === "inventory";

  return (
    <div className="fp-preview-shell">
      <div className="fp-preview-top">
        <div>
          <span className="fp-mono">OWNER WORKSPACE</span>
          <h3>{feature.screenTitle}</h3>
        </div>
        <span className="fp-live"><i /> LIVE DEMO</span>
      </div>

      <div className="fp-preview-body">
        <div className="fp-preview-sidebar">
          <div className="fp-side-logo">F</div>
          {["Overview", "Billing", "Inventory", "Customers", "Expenses", "AI"].map((item) => (
            <span
              key={item}
              className={item.toLowerCase().replace(" ", "-") === feature.id ? "active" : ""}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="fp-preview-main">
          <div className="fp-mini-head">
            <div>
              <span className="fp-mono">BUSINESS OVERVIEW</span>
              <strong>{feature.headline}</strong>
            </div>
            <span className="fp-demo-tag">INTERACTIVE</span>
          </div>

          {isAI ? (
            <div className="fp-ai-demo">
              <div className="fp-ai-msg user">Which part of my business needs attention?</div>
              <div className="fp-ai-msg bot">
                <b>AI Business</b>
                <span>I can help you review authorized sales, inventory, expenses and activity.</span>
              </div>
              <div className="fp-ai-suggestions">
                <button type="button">Sales overview</button>
                <button type="button">Stock attention</button>
                <button type="button">Expense review</button>
              </div>
            </div>
          ) : isQR ? (
            <div className="fp-qr-demo">
              <div className="fp-phone">
                <div className="fp-phone-notch" />
                <span className="fp-mono">CUSTOMER MENU</span>
                <b>Browse & order</b>
                {["Product", "Product", "Product"].map((x, i) => (
                  <div className="fp-product-row" key={i}>
                    <span><i />{x}</span>
                    <button type="button">Add</button>
                  </div>
                ))}
                <div className="fp-cart-button">Cart · Continue</div>
              </div>
              <div className="fp-order-flow">
                <span>QR ORDER</span>
                <b>Customer → Owner</b>
                <div className="fp-flow-line">
                  <i>Scan</i><em>→</em><i>Select</i><em>→</em><i>Order</i>
                </div>
                <small>Orders enter the owner workflow for review.</small>
              </div>
            </div>
          ) : isInventory ? (
            <div className="fp-inventory-demo">
              {["Products", "Stock", "Low-stock attention"].map((x, i) => (
                <div className="fp-inventory-card" key={x}>
                  <span>{x}</span>
                  <strong>{i === 0 ? "Manage" : i === 1 ? "Visible" : "Review"}</strong>
                  <small>{i === 2 ? "Before you run out" : "From one workspace"}</small>
                </div>
              ))}
              <div className="fp-stock-list">
                <div><span>Product</span><span>Status</span></div>
                <div><b>Product A</b><i>Available</i></div>
                <div><b>Product B</b><i>Review</i></div>
                <div><b>Product C</b><i>Available</i></div>
              </div>
            </div>
          ) : (
            <div className="fp-generic-demo">
              <div className="fp-stat-row">
                <div><span>{feature.id === "billing" ? "SALES" : "EXPENSES"}</span><b>Business activity</b><small>Connected workflow</small></div>
                <div><span>{feature.id === "billing" ? "PAYMENTS" : "PURCHASES"}</span><b>Organized</b><small>Ready for review</small></div>
                <div><span>REPORTS</span><b>Clear view</b><small>Understand activity</small></div>
              </div>
              <div className="fp-chart">
                <div className="fp-chart-label"><span>Business activity</span><small>Owner view</small></div>
                <div className="fp-bars">
                  {[38, 52, 45, 68, 55, 80, 62, 88, 70, 92].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="fp-chart-bottom"><span>Recent activity</span><span>Review →</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const mobile = useIsMobile();

  const [returning, setReturning] = useState(() => ({
    name: (safeGet("userName") || "").split(" ")[0],
    business: safeGet("businessName"),
  }));

  const [formData, setFormData] = useState(() => ({
    email: safeGet(LAST_EMAIL_KEY),
    password: "",
  }));

  const [active, setActive] = useState(0);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const feature = FEATURES[active];
  const isLoading = Boolean(pending);
  const emailInvalid =
    emailTouched && formData.email.length > 0 && !EMAIL_RE.test(formData.email);

  useEffect(() => {
    if (formData.email) passwordRef.current?.focus();
    else emailRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((value) => (value + 1) % FEATURES.length);
    }, 6500);

    return () => clearInterval(timer);
  }, []);

  const finishLogin = (data) => {
    const { user, business, token } = data;
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

    if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (business) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/create-business", { replace: true });
    }
  };

  const fail = (message) => setError(message);

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

      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        fail("Google sign-in was closed before it finished. Try again.");
      } else if (err.code === "auth/popup-blocked") {
        fail("Your browser blocked the Google window. Allow popups and try again.");
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

    if (!EMAIL_RE.test(formData.email)) {
      setEmailTouched(true);
      fail("Enter a valid email address.");
      return;
    }

    runAuth(
      "email",
      () => API.post("/auth/login", formData),
      "Sign in failed. Please try again."
    );
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
      () =>
        API.post("/auth/login", {
          email: CONFIG.demo.email,
          password: CONFIG.demo.password,
        }),
      "The demo is unavailable right now. Please try again."
    );

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

  const title = returning.name
    ? `${getGreeting()}, ${returning.name}`
    : getGreeting();

  const subtitle = returning.business
    ? `${returning.business} is ready when you are.`
    : "Sign in to open your workspace.";

  return (
    <div className="fp-page">
      <style>{CSS}</style>

      <header className="fp-nav">
        <Brand />

        {!mobile && (
          <nav className="fp-nav-links">
            <a href="#product">Product</a>
            <a href="#workflow">How it works</a>
            <a href="#features">Features</a>
            <a href="#ai">AI Business</a>
          </nav>
        )}

        <div className="fp-nav-actions">
          <a href="#login" className="fp-login-link">Login</a>
          <Link to="/register" className="fp-nav-cta">Get started <span>→</span></Link>
          {mobile && (
            <button
              type="button"
              className="fp-menu-btn"
              onClick={() => setMobileMenu((v) => !v)}
              aria-label="Open menu"
            >
              ☰
            </button>
          )}
        </div>

        {mobileMenu && (
          <div className="fp-mobile-menu">
            <a href="#product" onClick={() => setMobileMenu(false)}>Product</a>
            <a href="#workflow" onClick={() => setMobileMenu(false)}>How it works</a>
            <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#ai" onClick={() => setMobileMenu(false)}>AI Business</a>
          </div>
        )}
      </header>

      <main>
        <section className="fp-hero" id="product">
          <div className="fp-container fp-hero-grid">
            <div className="fp-hero-copy">
              <div className="fp-eyebrow">
                <span className="fp-pulse" />
                Built for everyday business
              </div>

              <h1>
                Run your business.
                <br />
                <em>Understand every number.</em>
              </h1>

              <p className="fp-hero-text">
                Billing, inventory, expenses, customers, purchases, QR ordering
                and AI business insights — connected in one workspace for the owner.
              </p>

              <div className="fp-actions">
                <Link to="/register" className="fp-primary-btn">
                  Create your business <span>→</span>
                </Link>
                <a href="#demo" className="fp-secondary-btn">
                  Explore the product
                </a>
              </div>

              <div className="fp-trust">
                {CONFIG.trust.map((item) => <span key={item}>✓ {item}</span>)}
              </div>

              <div className="fp-mini-proof">
                <div className="fp-avatar-stack">
                  <span>F</span><span>+</span><span>AI</span>
                </div>
                <div>
                  <b>One connected workspace</b>
                  <small>Built around the owner's daily workflow</small>
                </div>
              </div>
            </div>

            <div className="fp-hero-product">
              <div className="fp-product-orbit orbit-one" />
              <div className="fp-product-orbit orbit-two" />
              <DashboardPreview feature={feature} />
              <div className="fp-floating-card floating-one">
                <span>✓</span>
                <div><b>Connected workflow</b><small>Sales → stock → decisions</small></div>
              </div>
              <div className="fp-floating-card floating-two">
                <span>✦</span>
                <div><b>AI Business</b><small>Ask your authorized data</small></div>
              </div>
            </div>
          </div>

          <div className="fp-container fp-feature-switcher">
            <div className="fp-switcher-label">
              <span>EXPLORE THE WORKSPACE</span>
              <small>Click a module</small>
            </div>
            <div className="fp-feature-tabs">
              {FEATURES.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={index === active ? "active" : ""}
                  onClick={() => setActive(index)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="fp-section fp-light" id="features">
          <div className="fp-container">
            <div className="fp-section-heading">
              <span className="fp-kicker">ONE WORKSPACE</span>
              <h2>Everything your business does.<br /><em>Connected in one place.</em></h2>
              <p>
                FinancePro brings the everyday operating pieces together so the owner
                can move from action to information without rebuilding the picture manually.
              </p>
            </div>

            <div className="fp-feature-detail">
              <div className="fp-detail-copy">
                <span className="fp-detail-icon">{feature.icon}</span>
                <span className="fp-kicker">{feature.eyebrow}</span>
                <h3>{feature.headline}</h3>
                <p>{feature.description}</p>

                <div className="fp-points">
                  {feature.points.map((point) => (
                    <span key={point}>✓ {point}</span>
                  ))}
                </div>

                <a href="#demo" className="fp-arrow-link">Explore this workflow <span>↗</span></a>
              </div>

              <div className="fp-detail-preview">
                <DashboardPreview feature={feature} />
              </div>
            </div>
          </div>
        </section>

        <section className="fp-section fp-workflow" id="workflow">
          <div className="fp-container">
            <div className="fp-split-heading">
              <div>
                <span className="fp-kicker light-kicker">HOW IT WORKS</span>
                <h2>From first setup to <em>daily control.</em></h2>
              </div>
              <p>
                The product is organized around the owner's actual workflow:
                set up, sell, manage, review and decide.
              </p>
            </div>

            <div className="fp-journey">
              {JOURNEY.map(([number, titleText, text], index) => (
                <div className="fp-journey-step" key={number}>
                  <div className="fp-step-number">{number}</div>
                  <div className="fp-step-line">
                    <span />
                    {index < JOURNEY.length - 1 && <i />}
                  </div>
                  <div className="fp-step-content">
                    <h3>{titleText}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fp-section fp-demo-section" id="demo">
          <div className="fp-container">
            <div className="fp-demo-header">
              <div>
                <span className="fp-kicker">TRY THE IDEA</span>
                <h2>Don't just read about it.<br /><em>Explore the workspace.</em></h2>
              </div>
              <p>
                Move through the modules above to see how the product can connect
                everyday business work.
              </p>
            </div>

            <div className="fp-demo-board">
              <div className="fp-demo-board-top">
                <div className="fp-demo-brand"><span>F</span> FinancePro</div>
                <div className="fp-demo-status"><i /> DEMO WORKSPACE</div>
              </div>

              <div className="fp-demo-board-grid">
                <div className="fp-demo-menu">
                  <span className="selected">Overview</span>
                  <span>Billing</span>
                  <span>Inventory</span>
                  <span>Customers</span>
                  <span>Suppliers</span>
                  <span>Purchases</span>
                  <span>Expenses</span>
                  <span>Reports</span>
                  <span>AI Business</span>
                </div>

                <div className="fp-demo-content">
                  <div className="fp-demo-welcome">
                    <div>
                      <span className="fp-mono">OWNER DASHBOARD</span>
                      <h3>Your business at a glance.</h3>
                    </div>
                    <button type="button" onClick={() => setActive((active + 1) % FEATURES.length)}>
                      Change module →
                    </button>
                  </div>

                  <div className="fp-demo-cards">
                    <div><span>Billing</span><b>Connected</b><small>Create and track sales</small></div>
                    <div><span>Inventory</span><b>Visible</b><small>Know what needs attention</small></div>
                    <div><span>AI Business</span><b>Ready</b><small>Ask useful questions</small></div>
                  </div>

                  <div className="fp-demo-lower">
                    <div className="fp-demo-chart">
                      <div className="fp-demo-chart-head"><b>Connected business activity</b><span>OWNER VIEW</span></div>
                      <div className="fp-big-bars">
                        {[32, 48, 42, 66, 53, 76, 61, 86, 70, 92, 78].map((h, i) => (
                          <i key={i} style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>

                    <div className="fp-demo-ai">
                      <span className="fp-ai-badge">AI</span>
                      <b>Ask your business</b>
                      <p>What needs my attention?</p>
                      <span className="fp-answer">Use authorized data to investigate sales, stock, expenses and activity.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="fp-demo-cta">
              <div>
                <span className="fp-kicker">READY TO GO FURTHER?</span>
                <h3>Open your own workspace.</h3>
                <p>{CONFIG.signupNote}</p>
              </div>
              <div>
                <Link to="/register" className="fp-primary-btn">Create your business →</Link>
                {CONFIG.demo.enabled && (
                  <button type="button" className="fp-text-btn" onClick={handleDemo} disabled={isLoading}>
                    {pending === "demo" ? "Opening demo…" : "Try the demo business"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="fp-section fp-ai-section" id="ai">
          <div className="fp-container fp-ai-grid">
            <div>
              <span className="fp-kicker">AI BUSINESS</span>
              <h2>Your business has questions.<br /><em>Ask them naturally.</em></h2>
              <p>
                FinancePro can turn authorized business information into summaries,
                explanations and natural-language answers — so the owner can investigate
                instead of manually rebuilding reports.
              </p>

              <div className="fp-question-list">
                <button type="button" onClick={() => setActive(4)}>“What needs my attention?” <span>→</span></button>
                <button type="button" onClick={() => setActive(4)}>“Show me the business picture.” <span>→</span></button>
                <button type="button" onClick={() => setActive(4)}>“Help me understand my expenses.” <span>→</span></button>
              </div>
            </div>

            <div className="fp-ai-window">
              <div className="fp-ai-window-head">
                <span><i /> AI Business</span>
                <small>AUTHORIZED DATA</small>
              </div>
              <div className="fp-chat">
                <div className="fp-chat-user">What can you help me understand?</div>
                <div className="fp-chat-ai">
                  <span className="fp-ai-circle">✦</span>
                  <div>
                    <b>FinancePro AI</b>
                    <p>
                      I can help you explore business information available to your
                      account, including sales, inventory, expenses and activity.
                    </p>
                  </div>
                </div>
                <div className="fp-chat-input">Ask about your business… <span>↑</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="fp-section fp-final">
          <div className="fp-container">
            <div className="fp-final-card">
              <div>
                <span className="fp-kicker light-kicker">READY WHEN YOU ARE</span>
                <h2>Start with your business.<br /><em>Build from there.</em></h2>
                <p>
                  Create your workspace and bring your daily business workflow
                  into one connected place.
                </p>
              </div>
              <div className="fp-final-actions">
                <Link to="/register" className="fp-final-primary">Create your business →</Link>
                <a href="#login" className="fp-final-secondary">Already have an account? Login</a>
              </div>
            </div>
          </div>
        </section>

        <section className="fp-login-section" id="login">
          <div className="fp-container fp-login-grid">
            <div className="fp-login-copy">
              <span className="fp-kicker">OWNER LOGIN</span>
              <h2>{returning.name ? title : "Your workspace is waiting."}</h2>
              <p>
                Sign in to continue billing, inventory, expenses, purchases,
                reports and AI business management.
              </p>

              <div className="fp-login-checks">
                <span>✓ Billing & sales</span>
                <span>✓ Inventory & purchases</span>
                <span>✓ Customers & suppliers</span>
                <span>✓ AI business insights</span>
              </div>
            </div>

            <div className="fp-login-card">
              <div className="fp-login-card-top">
                <span>SIGN IN</span>
                <span>SECURE ACCESS</span>
              </div>

              <h3>{title}</h3>
              <p>{subtitle}</p>

              {returning.name && (
                <button type="button" className="fp-not-you" onClick={forgetReturning}>
                  Not {returning.name}? Use a different account
                </button>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <label>
                  Email address
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    placeholder="you@business.in"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (error) setError("");
                    }}
                    onBlur={() => setEmailTouched(true)}
                    autoComplete="email"
                    aria-invalid={emailInvalid || !!error}
                    required
                  />
                </label>

                {emailInvalid && <small className="fp-field-error">Try name@business.in</small>}

                <label>
                  <span className="fp-password-label">
                    Password
                    <Link to="/forgot-password">Forgot password?</Link>
                  </span>
                  <div className="fp-password-wrap">
                    <input
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, password: e.target.value }));
                        if (error) setError("");
                      }}
                      onKeyUp={(e) => e.getModifierState?.("CapsLock") !== undefined && setCapsOn(e.getModifierState("CapsLock"))}
                      onKeyDown={(e) => e.getModifierState?.("CapsLock") !== undefined && setCapsOn(e.getModifierState("CapsLock"))}
                      autoComplete="current-password"
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                {capsOn && <small className="fp-field-error">Caps Lock is on.</small>}

                {error && <div className="fp-error" role="alert">{error}</div>}

                <button className="fp-login-primary" type="submit" disabled={isLoading}>
                  {pending === "email" ? "Signing in…" : "Sign in"}
                </button>

                <div className="fp-or"><span />or continue with<span /></div>

                <button className="fp-google" type="button" onClick={handleGoogleLogin} disabled={isLoading}>
                  {pending === "google" ? "Opening Google…" : "Continue with Google"}
                </button>
              </form>

              <div className="fp-login-footer">
                <span>New here?</span>
                <Link to="/register">Create your business →</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fp-footer">
        <div className="fp-container fp-footer-inner">
          <div>
            <Brand />
            <p>AI BUSINESS MANAGEMENT</p>
          </div>
          <div>
            <a href="#product">Product</a>
            <a href="#workflow">How it works</a>
            <a href="#features">Features</a>
            <a href="#ai">AI Business</a>
            <Link to="/register">Create business</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root{
  --ink:#0b1220;
  --ink-2:#111c2e;
  --muted:#687487;
  --muted-2:#8d98a8;
  --line:#e4e8ee;
  --surface:#ffffff;
  --surface-2:#f5f7fa;
  --green:#1f7a59;
  --green-2:#2ea878;
  --blue:#3157ff;
  --gold:#d0a83a;
  --gold-soft:#f5e9bd;
  --shadow-sm:0 8px 24px rgba(11,18,32,.06);
  --shadow-md:0 20px 55px rgba(11,18,32,.10);
  --shadow-lg:0 35px 90px rgba(11,18,32,.16);
}

*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#f5f7fa;color:var(--ink);font-family:'DM Sans',system-ui,sans-serif}
button,input{font:inherit}
button,a{-webkit-tap-highlight-color:transparent}
button{cursor:pointer}
a{text-underline-offset:3px}

.fp-page{min-height:100vh;background:#f5f7fa;color:var(--ink);overflow:hidden}
.fp-container{width:min(1180px,92vw);margin:0 auto}

/* NAV */
.fp-nav{
  position:sticky;top:0;z-index:100;
  min-height:76px;padding:12px 4vw;
  display:flex;align-items:center;justify-content:space-between;gap:24px;
  background:rgba(248,250,252,.78);
  backdrop-filter:blur(24px) saturate(160%);
  -webkit-backdrop-filter:blur(24px) saturate(160%);
  border-bottom:1px solid rgba(220,226,234,.78);
}
.fp-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink);min-width:205px}
.fp-brand-mark{
  width:40px;height:40px;border-radius:13px;display:grid;place-items:center;
  background:linear-gradient(145deg,#21815e,#12553e);
  color:#f8edc9;font:italic 700 24px Georgia,serif;
  box-shadow:0 10px 25px rgba(31,122,89,.20),inset 0 1px 0 rgba(255,255,255,.2);
}
.fp-brand strong{display:block;font:italic 700 23px Georgia,serif;line-height:1}
.fp-brand small{display:block;margin-top:4px;color:#8c96a4;font:500 8px 'IBM Plex Mono';letter-spacing:1.5px}
.fp-nav-links{display:flex;align-items:center;gap:4px}
.fp-nav-links a,.fp-login-link{
  color:#4d596b;text-decoration:none;font-size:13px;font-weight:600;
  padding:10px 13px;border-radius:10px;transition:.22s ease;
}
.fp-nav-links a:hover,.fp-login-link:hover{background:#eaf2ed;color:var(--green)}
.fp-nav-actions{display:flex;align-items:center;gap:9px;min-width:205px;justify-content:flex-end}
.fp-nav-cta{
  display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  background:var(--ink);color:#fff;border-radius:11px;padding:12px 17px;
  font-size:13px;font-weight:700;box-shadow:0 10px 24px rgba(11,18,32,.14);
  transition:.22s ease;
}
.fp-nav-cta:hover{transform:translateY(-2px);box-shadow:0 15px 30px rgba(11,18,32,.18)}
.fp-menu-btn{border:1px solid #dce2e9;background:#fff;border-radius:10px;width:42px;height:42px;color:var(--ink)}

/* HERO */
.fp-hero{
  position:relative;padding:82px 0 38px;
  background:
    radial-gradient(circle at 82% 18%,rgba(49,87,255,.12),transparent 25%),
    radial-gradient(circle at 8% 10%,rgba(31,122,89,.10),transparent 23%),
    radial-gradient(circle at 75% 90%,rgba(208,168,58,.09),transparent 22%),
    linear-gradient(180deg,#fbfcfe 0%,#eef3f0 100%);
  border-bottom:1px solid #e1e6ed;
}
.fp-hero:before{
  content:"";position:absolute;inset:0;pointer-events:none;opacity:.28;
  background-image:radial-gradient(#91a0b0 .7px,transparent .7px);
  background-size:24px 24px;
  mask-image:linear-gradient(to bottom,black,transparent 70%);
}
.fp-hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:62px;align-items:center}
.fp-hero-grid>*{min-width:0;max-width:100%}
.fp-eyebrow{
  display:inline-flex;align-items:center;gap:9px;padding:8px 12px;border-radius:999px;
  background:rgba(234,247,239,.9);border:1px solid #d7ecdf;color:var(--green);
  font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;
  box-shadow:0 5px 18px rgba(31,122,89,.06);
}
.fp-pulse{width:7px;height:7px;border-radius:50%;background:#31b27a;box-shadow:0 0 0 5px rgba(49,178,122,.11);animation:fpPulse 2s infinite}
@keyframes fpPulse{50%{box-shadow:0 0 0 9px rgba(49,178,122,0)}}
.fp-hero h1{
  max-width:720px;font:600 clamp(47px,5.6vw,76px)/.98 'Fraunces',Georgia,serif;
  letter-spacing:-3.4px;margin:23px 0 21px;
}
.fp-hero h1 em,.fp-section h2 em,.fp-detail-copy h3 em,.fp-final h2 em{color:#b78917;font-style:italic}
.fp-hero-text{max-width:650px;color:#687487;font-size:17px;line-height:1.78;margin:0}
.fp-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:29px}
.fp-primary-btn,.fp-secondary-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:12px;
  min-height:48px;padding:13px 19px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:700;transition:.22s ease;
}
.fp-primary-btn{background:linear-gradient(135deg,#3157ff,#2344d8);color:#fff;box-shadow:0 15px 32px rgba(49,87,255,.22)}
.fp-primary-btn:hover{transform:translateY(-2px);box-shadow:0 20px 38px rgba(49,87,255,.27)}
.fp-secondary-btn{background:rgba(255,255,255,.8);color:var(--ink);border:1px solid #dce2e9;box-shadow:var(--shadow-sm)}
.fp-secondary-btn:hover{border-color:#aab6c5;transform:translateY(-2px)}
.fp-trust{display:flex;gap:17px;flex-wrap:wrap;margin-top:22px;color:#7a8695;font-size:11px}
.fp-mini-proof{display:flex;align-items:center;gap:11px;margin-top:29px}
.fp-avatar-stack{display:flex}
.fp-avatar-stack span{
  width:29px;height:29px;margin-left:-6px;border-radius:50%;display:grid;place-items:center;
  background:#111c2e;color:#fff;border:2px solid #f5f7fa;font:600 8px 'IBM Plex Mono';
}
.fp-avatar-stack span:first-child{margin-left:0;background:var(--green)}
.fp-mini-proof b{display:block;font-size:11px}.fp-mini-proof small{display:block;color:#87919d;margin-top:3px;font-size:10px}

/* PRODUCT PREVIEW */
.fp-hero-product{position:relative;min-width:0;padding:16px 12px 16px 0}
.fp-product-orbit{position:absolute;border-radius:50%;pointer-events:none}
.orbit-one{width:390px;height:390px;right:2%;top:5%;background:rgba(49,87,255,.08);filter:blur(7px)}
.orbit-two{width:220px;height:220px;left:3%;bottom:-2%;background:rgba(208,168,58,.11);filter:blur(8px)}
.fp-preview-shell{
  position:relative;z-index:2;width:100%;background:linear-gradient(145deg,#0a1422,#15263b);
  border-radius:25px;padding:17px;border:1px solid rgba(255,255,255,.10);
  box-shadow:0 35px 80px rgba(11,18,32,.24),0 2px 0 rgba(255,255,255,.05) inset;
  animation:fpFloat 7s ease-in-out infinite;
}
@keyframes fpFloat{0%,100%{transform:translateY(0) rotateX(0)}50%{transform:translateY(-7px) rotateX(.4deg)}}
.fp-preview-top{display:flex;align-items:center;justify-content:space-between;color:#fff;padding:3px 4px 15px}
.fp-preview-top h3{font-size:16px;margin:5px 0 0}
.fp-mono{font:500 8px 'IBM Plex Mono';letter-spacing:1px;color:#8e9aaa}
.fp-live{font:500 8px 'IBM Plex Mono';color:#79d7a8;background:rgba(31,154,99,.12);border:1px solid rgba(79,201,143,.13);padding:6px 8px;border-radius:999px}
.fp-live i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#5bd493;margin-right:4px}
.fp-preview-body{display:grid;grid-template-columns:118px 1fr;background:#f7f9fb;border-radius:17px;overflow:hidden;min-height:365px}
.fp-preview-sidebar{background:#0e1a29;padding:15px 10px;display:flex;flex-direction:column;gap:4px}
.fp-side-logo{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(145deg,#23825f,#12553e);color:#f5eacb;font:italic 700 17px Georgia;margin-bottom:10px}
.fp-preview-sidebar span{padding:8px;border-radius:7px;color:#8996a5;font-size:9px;transition:.2s}
.fp-preview-sidebar span.active{background:#203950;color:#fff}
.fp-preview-main{padding:19px;min-width:0;max-width:100%;overflow:hidden}
.fp-mini-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px}
.fp-mini-head strong{display:block;font-size:13px;margin-top:5px}
.fp-demo-tag{font:500 7px 'IBM Plex Mono';color:var(--green);background:#e8f4ed;padding:5px 7px;border-radius:6px}
.fp-stat-row,.fp-demo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fp-stat-row>div,.fp-demo-cards>div{background:#fff;border:1px solid #e2e7ed;border-radius:11px;padding:11px;min-width:0;box-shadow:0 5px 16px rgba(11,18,32,.025)}
.fp-stat-row span,.fp-demo-cards span{display:block;font:500 7px 'IBM Plex Mono';color:#87918e;letter-spacing:.5px}
.fp-stat-row b,.fp-demo-cards b{display:block;font-size:12px;margin-top:6px}
.fp-stat-row small,.fp-demo-cards small{display:block;color:#8b949e;font-size:8px;margin-top:4px}
.fp-chart{background:linear-gradient(145deg,#14273b,#1b3149);border-radius:12px;padding:13px;margin-top:9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.fp-chart-label,.fp-demo-chart-head{display:flex;justify-content:space-between;color:#dde4ea;font-size:9px}
.fp-chart-label small,.fp-demo-chart-head span{font:500 7px 'IBM Plex Mono';color:#8998a8}
.fp-bars,.fp-big-bars{height:120px;display:flex;align-items:flex-end;gap:5px;border-bottom:1px solid rgba(255,255,255,.08);padding:8px 2px 0}
.fp-bars i,.fp-big-bars i{flex:1;display:block;background:linear-gradient(180deg,#e0c15f,#b78917);border-radius:4px 4px 0 0;animation:fpRise .7s ease both;transform-origin:bottom}
@keyframes fpRise{from{transform:scaleY(.2);opacity:0}to{transform:scaleY(1);opacity:1}}
.fp-chart-bottom{display:flex;justify-content:space-between;color:#8391a0;font-size:7px;margin-top:8px}
.fp-floating-card{
  position:absolute;z-index:3;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);
  border:1px solid #e0e5df;border-radius:13px;padding:10px 12px;display:flex;align-items:center;gap:8px;
  box-shadow:0 18px 42px rgba(16,28,44,.15);transition:.25s;
}
.fp-floating-card:hover{transform:translateY(-3px)}
.fp-floating-card>span{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#eaf0ff;color:#3157ff;font-size:11px;font-weight:800}
.fp-floating-card b{display:block;font-size:9px}.fp-floating-card small{display:block;color:#7c8791;font-size:7px;margin-top:2px}
.floating-one{left:-16px;bottom:45px}.floating-two{right:-8px;top:42px;max-width:190px}

/* FEATURE TABS */
.fp-feature-switcher{
  position:relative;z-index:4;margin-top:29px;padding:8px;background:rgba(255,255,255,.76);
  backdrop-filter:blur(16px);border:1px solid #e0e5df;border-radius:17px;
  display:flex;align-items:center;gap:15px;box-shadow:var(--shadow-sm)
}
.fp-switcher-label{min-width:175px;padding:8px 12px}.fp-switcher-label span{display:block;font:600 8px 'IBM Plex Mono';letter-spacing:1px}.fp-switcher-label small{display:block;color:#88928c;font-size:9px;margin-top:3px}
.fp-feature-tabs{display:flex;gap:7px;flex:1;min-width:0}
.fp-feature-tabs button{
  flex:1;min-width:0;border:1px solid transparent;background:transparent;border-radius:10px;
  padding:11px 8px;color:#687483;font-size:10px;font-weight:700;transition:.22s
}
.fp-feature-tabs button span{display:inline-grid;place-items:center;width:23px;height:23px;border-radius:7px;background:#eef1ed;color:var(--green);margin-right:6px}
.fp-feature-tabs button:hover{background:#f3f6f4}
.fp-feature-tabs button.active{background:#0d1726;color:#fff;box-shadow:0 10px 25px rgba(16,28,44,.13)}
.fp-feature-tabs button.active span{background:var(--green);color:#fff}

/* GENERAL SECTIONS */
.fp-section{padding:96px 0}
.fp-light{background:#fff}
.fp-section-heading{max-width:760px}
.fp-kicker{display:block;color:#b78917;font:600 9px 'IBM Plex Mono';letter-spacing:1.5px}
.fp-section h2,.fp-ai-section h2,.fp-final h2{
  font:600 clamp(35px,4.5vw,55px)/1.06 'Fraunces',Georgia,serif;letter-spacing:-1.7px;margin:9px 0 14px
}
.fp-section-heading p,.fp-ai-section>div>p{max-width:720px;color:#687484;line-height:1.78;font-size:15px;margin:0}

/* FEATURE DETAIL */
.fp-feature-detail{display:grid;grid-template-columns:minmax(0,.74fr) minmax(0,1.26fr);gap:54px;align-items:center;margin-top:48px;width:100%}
.fp-feature-detail>*{min-width:0;max-width:100%}
.fp-detail-copy{padding-right:15px;min-width:0}
.fp-detail-icon{display:grid;place-items:center;width:50px;height:50px;border-radius:14px;background:#0d1726;color:#d0a83a;font-size:20px;margin-bottom:18px;box-shadow:0 12px 25px rgba(11,18,32,.14)}
.fp-detail-copy h3{font:600 clamp(31px,3.5vw,46px)/1.06 'Fraunces',Georgia,serif;margin:8px 0 14px}
.fp-detail-copy>p{color:#687484;line-height:1.72;font-size:14px}
.fp-points{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.fp-points span{background:#f1f5f1;border:1px solid #dfe6df;padding:7px 9px;border-radius:8px;color:#416052;font-size:10px}
.fp-arrow-link{color:var(--green);text-decoration:none;font-size:12px;font-weight:800}
.fp-arrow-link:hover{text-decoration:underline}
.fp-detail-preview .fp-preview-shell{animation:none;box-shadow:0 25px 55px rgba(16,28,44,.14)}
.fp-detail-preview .fp-preview-sidebar{display:none}
.fp-detail-preview .fp-preview-body{display:block;min-height:330px}
.fp-detail-preview .fp-preview-main{padding:20px}

/* DEMOS INSIDE PREVIEW */
.fp-ai-demo{display:flex;flex-direction:column;gap:10px}
.fp-ai-msg{padding:11px 13px;border-radius:11px;font-size:10px;line-height:1.55}
.fp-ai-msg.user{align-self:flex-end;background:#3157ff;color:#fff;max-width:78%}
.fp-ai-msg.bot{background:#fff;border:1px solid #e1e6df;max-width:88%}
.fp-ai-msg.bot b{display:block;color:#172235;margin-bottom:3px}
.fp-ai-msg.bot span{color:#687484}
.fp-ai-suggestions{display:flex;gap:6px;flex-wrap:wrap}
.fp-ai-suggestions button{border:1px solid #dce3ea;background:#fff;border-radius:8px;padding:7px 8px;color:#526071;font-size:8px}
.fp-qr-demo{display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:center}
.fp-phone{background:#101c2c;color:#fff;border-radius:21px;padding:14px;box-shadow:0 18px 35px rgba(16,28,44,.16)}
.fp-phone-notch{width:55px;height:5px;background:#2c3d50;border-radius:10px;margin:0 auto 13px}
.fp-phone>b{display:block;font-size:14px;margin:5px 0 12px}
.fp-product-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-size:9px}
.fp-product-row span{display:flex;align-items:center;gap:6px}.fp-product-row i{width:18px;height:18px;border-radius:5px;background:#29415b;display:inline-block}
.fp-product-row button{border:0;background:#e9f1ff;color:#3157ff;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:800}
.fp-cart-button{margin-top:10px;text-align:center;background:#3157ff;border-radius:8px;padding:9px;font-size:9px;font-weight:800}
.fp-order-flow{border:1px solid #e0e5df;background:#fff;border-radius:13px;padding:17px}
.fp-order-flow>span{font:500 8px 'IBM Plex Mono';color:#b78917}.fp-order-flow>b{display:block;font-size:13px;margin:6px 0 15px}
.fp-flow-line{display:flex;align-items:center;gap:7px}.fp-flow-line i{font-style:normal;background:#edf3ef;color:var(--green);border-radius:7px;padding:7px;font-size:8px;font-weight:800}.fp-flow-line em{font-style:normal;color:#9ba5b0}.fp-order-flow small{display:block;color:#7b8794;font-size:8px;line-height:1.5;margin-top:14px}
.fp-inventory-demo{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fp-inventory-card{background:#fff;border:1px solid #e1e6df;border-radius:11px;padding:12px}.fp-inventory-card span{display:block;font-size:8px;color:#7c8792}.fp-inventory-card strong{display:block;font-size:12px;margin-top:7px}.fp-inventory-card small{display:block;color:#8b949e;font-size:8px;margin-top:4px}
.fp-stock-list{grid-column:1/-1;background:#fff;border:1px solid #e1e6df;border-radius:11px;padding:12px;margin-top:1px}
.fp-stock-list>div{display:grid;grid-template-columns:1fr 90px;gap:10px;padding:8px 0;border-bottom:1px solid #eef1f3;font-size:9px}.fp-stock-list>div:first-child{font:500 7px 'IBM Plex Mono';color:#8994a0}.fp-stock-list>div:last-child{border-bottom:0}.fp-stock-list i{font-style:normal;color:var(--green)}
.fp-generic-demo{min-width:0}
.fp-stat-row{margin-bottom:10px}

/* WORKFLOW */
.fp-workflow{background:#0b1422;color:#fff;overflow:hidden}
.fp-workflow h2,.fp-workflow h3{color:#fff}
.fp-split-heading{display:flex;align-items:end;justify-content:space-between;gap:40px;min-width:0}
.fp-split-heading>*{min-width:0;max-width:100%}
.fp-split-heading h2{margin-bottom:0}.fp-split-heading p{max-width:390px;color:#aeb9c6;line-height:1.75;font-size:13px}
.light-kicker{color:#d0a83a}
.fp-journey{margin-top:55px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0}
.fp-journey-step{position:relative;min-width:0}
.fp-step-number{color:#d0a83a;font:600 11px 'IBM Plex Mono';letter-spacing:1px}
.fp-step-line{height:43px;display:flex;align-items:center;position:relative}
.fp-step-line span{width:13px;height:13px;border-radius:50%;background:#d0a83a;border:3px solid #263447;z-index:2;box-shadow:0 0 0 5px rgba(208,168,58,.05)}
.fp-step-line i{height:1px;background:#344253;position:absolute;left:12px;right:0;top:21px}
.fp-step-content{padding-right:20px;min-width:0}
.fp-step-content h3{font-size:14px;margin:7px 0;color:#fff}.fp-step-content p{color:#9daab9;font-size:11px;line-height:1.65;margin:0;max-width:100%}

/* PRODUCT DEMO */
.fp-demo-section{background:#eef2f0}
.fp-demo-header{display:flex;justify-content:space-between;align-items:end;gap:40px}.fp-demo-header>div{max-width:700px}.fp-demo-header>p{max-width:350px;color:#687484;font-size:13px;line-height:1.7}
.fp-demo-board{margin-top:39px;background:#0b1422;border-radius:23px;padding:14px;box-shadow:0 30px 70px rgba(11,18,32,.18)}
.fp-demo-board-top{height:49px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;color:#fff}
.fp-demo-brand{font-weight:700;font-size:13px}.fp-demo-brand span{display:inline-grid;place-items:center;width:27px;height:27px;background:var(--green);border-radius:8px;margin-right:7px;font:italic 700 16px Georgia}
.fp-demo-status{font:500 8px 'IBM Plex Mono';color:#78d8a5}.fp-demo-status i{display:inline-block;width:5px;height:5px;background:#59d58e;border-radius:50%;margin-right:5px}
.fp-demo-board-grid{display:grid;grid-template-columns:150px 1fr;background:#f7f9fb;border-radius:16px;overflow:hidden}
.fp-demo-menu{padding:18px 10px;background:#15263a;display:flex;flex-direction:column;gap:4px}.fp-demo-menu span{padding:8px 9px;border-radius:7px;color:#8e9baa;font-size:9px}.fp-demo-menu .selected{background:#233d55;color:#fff}
.fp-demo-content{padding:23px;min-width:0}.fp-demo-welcome{display:flex;justify-content:space-between;align-items:center;gap:20px}.fp-demo-welcome h3{margin:6px 0;font-size:18px}.fp-demo-welcome button{border:1px solid #d8ded7;background:#fff;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:700}
.fp-demo-cards{margin-top:18px}.fp-demo-lower{display:grid;grid-template-columns:1.5fr .8fr;gap:10px;margin-top:10px}
.fp-demo-chart{background:#17283b;border-radius:11px;padding:15px}.fp-big-bars{height:155px}.fp-demo-ai{background:#fff;border:1px solid #e1e6df;border-radius:11px;padding:15px}.fp-ai-badge{display:grid;place-items:center;width:31px;height:31px;background:#eaf0ff;color:#3157ff;border-radius:9px;font:600 9px 'IBM Plex Mono'}.fp-demo-ai b{display:block;margin-top:14px;font-size:13px}.fp-demo-ai p{font-size:11px;margin:8px 0;color:#34404f}.fp-answer{display:block;background:#f2f6f3;color:#5f6d68;padding:9px;border-radius:8px;font-size:9px;line-height:1.5}
.fp-demo-cta{margin-top:25px;background:#fff;border:1px solid #e0e5de;border-radius:18px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:20px;box-shadow:var(--shadow-sm)}
.fp-demo-cta h3{font-size:20px;margin:7px 0 3px}.fp-demo-cta p{color:#7b857f;font-size:10px;margin:0}.fp-text-btn{border:0;background:none;color:var(--green);font-size:11px;font-weight:800;margin-top:10px}

/* AI */
.fp-ai-section{background:#fff}
.fp-ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:75px;align-items:center}
.fp-question-list{margin-top:25px;display:flex;flex-direction:column;gap:8px}
.fp-question-list button{border:1px solid #e0e5de;background:#f8faf8;text-align:left;padding:13px 14px;border-radius:10px;display:flex;justify-content:space-between;color:#263344;font-size:11px;transition:.2s}
.fp-question-list button:hover{border-color:var(--green);color:var(--green);transform:translateX(3px)}
.fp-ai-window{background:#0b1422;border-radius:21px;padding:14px;box-shadow:0 25px 60px rgba(16,28,44,.19)}
.fp-ai-window-head{height:42px;display:flex;justify-content:space-between;align-items:center;color:#fff;padding:0 5px;font-size:11px}.fp-ai-window-head span i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#59d58e;margin-right:7px}.fp-ai-window-head small{font:500 7px 'IBM Plex Mono';color:#8796a7}
.fp-chat{background:#f7f9f6;border-radius:14px;padding:18px;min-height:310px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px}
.fp-chat-user{align-self:flex-end;max-width:75%;background:#3157ff;color:#fff;border-radius:12px 12px 3px 12px;padding:11px;font-size:11px;box-shadow:0 8px 20px rgba(49,87,255,.16)}
.fp-chat-ai{display:flex;gap:10px;align-items:flex-start;max-width:85%}.fp-ai-circle{width:30px;height:30px;border-radius:9px;background:#101c2c;color:#d0a83a;display:grid;place-items:center}.fp-chat-ai b{font-size:10px}.fp-chat-ai p{font-size:10px;color:#687484;line-height:1.6;margin:5px 0}
.fp-chat-input{border:1px solid #dce2db;background:#fff;color:#929b98;border-radius:9px;padding:11px;font-size:10px;display:flex;justify-content:space-between}.fp-chat-input span{color:#3157ff;font-weight:800}

/* FINAL CTA */
.fp-final{background:#fff;padding-top:28px}
.fp-final-card{position:relative;overflow:hidden;background:linear-gradient(135deg,#0b1422,#14253a);color:#fff;border-radius:25px;padding:47px;display:flex;align-items:center;justify-content:space-between;gap:35px;box-shadow:0 28px 65px rgba(11,18,32,.16)}
.fp-final-card:after{content:"";position:absolute;width:320px;height:320px;border-radius:50%;right:-100px;top:-150px;background:rgba(49,87,255,.16);filter:blur(3px)}
.fp-final-card>*{position:relative;z-index:1}
.fp-final h2{margin:8px 0 12px}.fp-final p{color:#b8c2cf;max-width:590px;font-size:13px;line-height:1.7;margin:0}
.fp-final-actions{min-width:240px;display:flex;flex-direction:column;gap:10px}.fp-final-primary{background:#d0a83a;color:#0b1422;text-decoration:none;padding:14px 16px;border-radius:10px;text-align:center;font-size:12px;font-weight:800;transition:.2s}.fp-final-primary:hover{transform:translateY(-2px);box-shadow:0 12px 25px rgba(208,168,58,.18)}.fp-final-secondary{color:#d7dee5;text-decoration:none;text-align:center;font-size:10px}

/* LOGIN */
.fp-login-section{background:#f1f4f7;padding:96px 0}
.fp-login-grid{display:grid;grid-template-columns:1fr 445px;gap:82px;align-items:center}
.fp-login-copy h2{font:600 clamp(38px,4.5vw,58px)/1.04 'Fraunces',Georgia,serif;margin:9px 0 15px}.fp-login-copy p{color:#687484;line-height:1.78;max-width:600px;font-size:14px}
.fp-login-checks{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:25px}.fp-login-checks span{font-size:11px;color:#58665f}
.fp-login-card{background:rgba(255,255,255,.94);border:1px solid #dce3eb;border-radius:20px;padding:28px;box-shadow:0 25px 55px rgba(11,18,32,.10)}
.fp-login-card-top{display:flex;justify-content:space-between;color:#89938e;font:500 8px 'IBM Plex Mono';letter-spacing:1px}.fp-login-card h3{font:600 31px 'Fraunces',Georgia,serif;margin:19px 0 5px}.fp-login-card>p{font-size:11px;color:#75817c;margin:0 0 12px}.fp-not-you{border:0;background:none;color:var(--green);font-size:10px;padding:0;margin-bottom:16px}
.fp-login-card form{display:flex;flex-direction:column;gap:15px}.fp-login-card label{display:flex;flex-direction:column;gap:7px;color:#3c4754;font-size:10px;font-weight:700}.fp-login-card input{width:100%;height:45px;border:1px solid #d7dee7;border-radius:10px;padding:0 12px;font-size:12px;outline:none;background:#fbfcfe;transition:.2s}.fp-login-card input:focus{border-color:var(--green);box-shadow:0 0 0 4px rgba(31,122,89,.10);background:#fff}.fp-password-label{display:flex;justify-content:space-between}.fp-password-label a{color:var(--green);text-decoration:none;font-size:9px}.fp-password-wrap{position:relative}.fp-password-wrap input{padding-right:58px}.fp-password-wrap button{position:absolute;right:7px;top:7px;height:31px;border:0;background:#eef3ef;border-radius:7px;color:var(--green);font-size:9px;font-weight:800}.fp-field-error{color:#b04a42;font-size:9px;margin-top:-10px}.fp-error{background:#fff1ef;border:1px solid #f2d1cc;color:#a33d35;border-radius:9px;padding:9px;font-size:10px}.fp-login-primary{height:46px;border:0;border-radius:10px;background:linear-gradient(135deg,#3157ff,#2344d8);color:#fff;font-weight:800;font-size:12px;box-shadow:0 12px 24px rgba(49,87,255,.17);transition:.2s}.fp-login-primary:hover:not(:disabled){transform:translateY(-2px)}.fp-login-primary:disabled,.fp-google:disabled{opacity:.65;cursor:not-allowed}.fp-or{display:flex;align-items:center;gap:8px;color:#8a938e;font-size:9px}.fp-or span{height:1px;background:#e2e6e1;flex:1}.fp-google{height:44px;border:1px solid #d9e0e7;background:#fff;border-radius:10px;color:#293646;font-weight:700;font-size:11px;transition:.2s}.fp-google:hover:not(:disabled){background:#f7f9fb;border-color:#c8d1dc}.fp-login-footer{border-top:1px solid #edf0f2;margin-top:20px;padding-top:17px;display:flex;justify-content:center;gap:5px;font-size:10px;color:#89938e}.fp-login-footer a{color:var(--green);font-weight:800;text-decoration:none}

/* FOOTER */
.fp-footer{background:#0b1422;color:#fff;padding:45px 0}
.fp-footer-inner{display:flex;justify-content:space-between;gap:30px}
.fp-footer .fp-brand{color:#fff}.fp-footer .fp-brand small{color:#8390a0}.fp-footer p{color:#68778a;font:500 8px 'IBM Plex Mono';letter-spacing:1.4px;margin:10px 0 0}
.fp-footer-inner>div:last-child{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.fp-footer a{color:#9da9b7;text-decoration:none;font-size:10px}.fp-footer a:hover{color:#fff}

/* MOBILE / TABLET */
@media(max-width:1050px){
  .fp-hero-grid{gap:38px}
  .fp-feature-detail{gap:32px}
  .fp-journey{grid-template-columns:repeat(5,minmax(0,1fr))}
  .fp-step-content{padding-right:10px}
  .fp-step-content h3{font-size:13px}
  .fp-step-content p{font-size:10px}
  .fp-login-grid{gap:45px}
}
@media(max-width:860px){
  .fp-nav-links{display:none}
  .fp-hero-grid,.fp-feature-detail,.fp-ai-grid,.fp-login-grid{grid-template-columns:1fr}
  .fp-hero-copy{max-width:760px}
  .fp-hero-product{padding-right:0}
  .fp-feature-detail{gap:35px}
  .fp-detail-copy{padding-right:0}
  .fp-journey{grid-template-columns:1fr;gap:0}
  .fp-journey-step{display:grid;grid-template-columns:38px 26px 1fr}
  .fp-step-number{padding-top:2px}
  .fp-step-line{height:100%;min-height:72px}
  .fp-step-line i{width:1px;height:100%;left:6px;right:auto;top:13px}
  .fp-step-content{padding:0 0 25px}
  .fp-split-heading{align-items:flex-start}
  .fp-split-heading>p{max-width:450px}
  .fp-ai-grid{gap:40px}
  .fp-login-grid{gap:40px}
}
@media(max-width:760px){
  .fp-nav{padding:11px 4vw}.fp-nav-actions{min-width:auto}.fp-login-link{display:none}.fp-brand{min-width:auto}.fp-brand strong{font-size:20px}
  .fp-hero{padding-top:52px}.fp-hero h1{font-size:clamp(43px,12vw,61px);letter-spacing:-2.2px}
  .fp-hero-text{font-size:15px}
  .fp-feature-switcher{display:block;padding:10px}.fp-switcher-label{padding:7px}.fp-feature-tabs{overflow-x:auto;padding-bottom:2px}.fp-feature-tabs button{min-width:120px;white-space:nowrap}
  .fp-floating-card{display:none}
  .fp-preview-body{grid-template-columns:78px 1fr}.fp-preview-sidebar span{font-size:8px;padding:7px 5px}.fp-preview-main{padding:13px}
  .fp-stat-row,.fp-inventory-demo{grid-template-columns:1fr}.fp-stat-row>div:nth-child(3),.fp-inventory-card:nth-child(3){display:none}
  .fp-demo-board-grid{grid-template-columns:1fr}.fp-demo-menu{display:none}.fp-demo-lower{grid-template-columns:1fr}.fp-demo-ai{display:none}
  .fp-demo-header,.fp-split-heading,.fp-final-card,.fp-footer-inner{display:block}.fp-demo-header>p{margin-top:15px}.fp-final-actions{margin-top:25px}.fp-footer-inner>div:last-child{margin-top:25px}
  .fp-login-checks{grid-template-columns:1fr}
  .fp-qr-demo{grid-template-columns:1fr}.fp-order-flow{display:none}
  .fp-phone{max-width:230px;margin:auto}
  .fp-demo-cta{align-items:flex-start}
  .fp-demo-cta>div:last-child{justify-content:flex-start}
}
@media(max-width:520px){
  .fp-container{width:min(92vw,500px)}
  .fp-section{padding:70px 0}
  .fp-preview-shell{padding:11px;border-radius:19px}.fp-preview-body{min-height:315px}.fp-preview-sidebar{display:none}.fp-preview-main{padding:13px}
  .fp-detail-preview .fp-preview-sidebar{display:none}.fp-detail-preview .fp-preview-body{min-height:290px}
  .fp-stat-row>div:nth-child(2){display:none}
  .fp-demo-cards{grid-template-columns:1fr}.fp-demo-cards>div:nth-child(3){display:none}
  .fp-demo-cta{padding:20px}.fp-demo-cta>div:last-child{flex-direction:column;align-items:stretch;width:100%}
  .fp-demo-cta .fp-primary-btn,.fp-demo-cta .fp-text-btn{width:100%;text-align:center}
  .fp-login-card{padding:21px}.fp-final-card{padding:30px 25px}
  .fp-footer-inner>div:last-child{display:grid;grid-template-columns:1fr 1fr}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}.fp-preview-shell,.fp-pulse,.fp-bars i,.fp-big-bars i{animation:none}
}
`;
