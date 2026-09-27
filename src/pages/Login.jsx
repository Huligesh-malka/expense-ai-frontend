
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
                <div><b>AI Business</b><small>Ask about your business</small></div>
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#F7F8F5}
button,input{font:inherit}
button,a{ -webkit-tap-highlight-color:transparent }

.fp-page{
  min-height:100vh;
  background:#F7F8F5;
  color:#101C2C;
  font-family:'DM Sans',system-ui,sans-serif;
  overflow:hidden;
}
.fp-container{width:min(1160px,92vw);margin:0 auto}

.fp-nav{
  position:sticky;top:0;z-index:100;
  min-height:72px;padding:12px 4vw;
  display:flex;align-items:center;justify-content:space-between;gap:20px;
  background:rgba(247,248,245,.88);
  backdrop-filter:blur(18px);
  border-bottom:1px solid #E2E6DF;
}
.fp-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#101C2C;min-width:190px}
.fp-brand-mark{
  width:38px;height:38px;border-radius:11px;display:grid;place-items:center;
  background:#1F6F54;color:#F5EACB;font:italic 700 23px Georgia,serif
}
.fp-brand strong{display:block;font:italic 700 23px Georgia,serif;line-height:1}
.fp-brand small{display:block;margin-top:4px;color:#89928D;font:500 8px 'IBM Plex Mono';letter-spacing:1.3px}
.fp-nav-links{display:flex;align-items:center;gap:5px}
.fp-nav-links a,.fp-login-link{
  color:#4A5665;text-decoration:none;font-size:13px;font-weight:600;
  padding:9px 12px;border-radius:9px;transition:.2s
}
.fp-nav-links a:hover,.fp-login-link:hover{background:#EDF4EF;color:#1F6F54}
.fp-nav-actions{display:flex;align-items:center;gap:10px;min-width:190px;justify-content:flex-end}
.fp-nav-cta{
  display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  background:#2E5BFF;color:#fff;border-radius:10px;padding:11px 16px;
  font-size:13px;font-weight:700;box-shadow:0 8px 22px rgba(46,91,255,.14)
}
.fp-nav-cta:hover{transform:translateY(-1px)}
.fp-menu-btn{border:1px solid #D9DED7;background:#fff;border-radius:9px;width:42px;height:42px}

.fp-hero{
  padding:72px 0 34px;
  background:
    radial-gradient(circle at 76% 22%,rgba(46,91,255,.08),transparent 26%),
    radial-gradient(circle at 12% 5%,rgba(201,162,39,.10),transparent 22%),
    linear-gradient(180deg,#FCFDFB,#F3F6F1);
  border-bottom:1px solid #E4E8E1;
}
.fp-hero-grid{display:grid;grid-template-columns:minmax(0,.94fr) minmax(0,1.06fr);gap:60px;align-items:center}
.fp-hero-grid > *{min-width:0;max-width:100%}
.fp-eyebrow{
  display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;
  background:#EAF6EE;color:#1F6F54;font-size:10px;font-weight:800;letter-spacing:.7px;text-transform:uppercase
}
.fp-pulse{width:7px;height:7px;border-radius:50%;background:#27A56A;box-shadow:0 0 0 5px rgba(39,165,106,.10)}
.fp-hero h1{
  font:600 clamp(45px,5.4vw,73px)/1.02 'Fraunces',Georgia,serif;
  letter-spacing:-2.8px;margin:21px 0 20px
}
.fp-hero h1 em,.fp-section h2 em,.fp-detail-copy h3 em,.fp-final h2 em{color:#C49A1F;font-style:italic}
.fp-hero-text{max-width:650px;color:#657182;font-size:17px;line-height:1.75;margin:0}
.fp-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.fp-primary-btn,.fp-secondary-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:12px;
  min-height:46px;padding:12px 18px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:700
}
.fp-primary-btn{background:#2E5BFF;color:#fff;box-shadow:0 12px 28px rgba(46,91,255,.18)}
.fp-primary-btn:hover{transform:translateY(-2px)}
.fp-secondary-btn{background:#fff;color:#101C2C;border:1px solid #D9DED7}
.fp-secondary-btn:hover{border-color:#1F6F54;color:#1F6F54}
.fp-trust{display:flex;gap:18px;flex-wrap:wrap;margin-top:22px;color:#7A857F;font-size:11px}
.fp-mini-proof{display:flex;align-items:center;gap:11px;margin-top:28px}
.fp-avatar-stack{display:flex}
.fp-avatar-stack span{
  width:27px;height:27px;margin-left:-5px;border-radius:50%;display:grid;place-items:center;
  background:#101C2C;color:#fff;border:2px solid #F5F7F3;font:600 8px 'IBM Plex Mono'
}
.fp-avatar-stack span:first-child{margin-left:0;background:#1F6F54}
.fp-mini-proof b{display:block;font-size:11px}.fp-mini-proof small{display:block;color:#87918B;margin-top:2px;font-size:10px}

.fp-hero-product{position:relative;min-width:0;padding:18px 0}
.fp-product-orbit{position:absolute;border-radius:50%;pointer-events:none}
.orbit-one{width:350px;height:350px;right:5%;top:8%;background:rgba(46,91,255,.06);filter:blur(5px)}
.orbit-two{width:210px;height:210px;left:8%;bottom:0;background:rgba(201,162,39,.08);filter:blur(6px)}
.fp-preview-shell{
  position:relative;z-index:2;width:100%;background:linear-gradient(145deg,#0D1929,#172A40);
  border-radius:24px;padding:17px;box-shadow:0 30px 70px rgba(16,28,44,.22);
  border:1px solid rgba(255,255,255,.08);animation:fpFloat 6s ease-in-out infinite
}
@keyframes fpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@media (max-width:900px){
  .floating-one{left:10px;bottom:25px}
  .floating-two{right:10px;top:25px}
}
@media (max-width:760px){
  .fp-floating-card{display:none}
}

.fp-preview-top{display:flex;align-items:center;justify-content:space-between;color:#fff;padding:3px 4px 15px}
.fp-preview-top h3{font-size:16px;margin:5px 0 0}
.fp-mono{font:500 8px 'IBM Plex Mono';letter-spacing:1px;color:#8E9BAA}
.fp-live{font:500 8px 'IBM Plex Mono';color:#79D7A8;background:rgba(31,154,99,.12);padding:6px 8px;border-radius:999px}
.fp-live i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#5BD493;margin-right:4px}
.fp-preview-body{display:grid;grid-template-columns:115px 1fr;background:#F6F8F5;border-radius:16px;overflow:hidden;min-height:365px}
.fp-preview-sidebar{background:#101C2C;padding:15px 10px;display:flex;flex-direction:column;gap:4px}
.fp-side-logo{width:29px;height:29px;border-radius:8px;display:grid;place-items:center;background:#1F6F54;color:#F5EACB;font:italic 700 17px Georgia;margin-bottom:10px}
.fp-preview-sidebar span{padding:8px;border-radius:7px;color:#8996A5;font-size:9px}
.fp-preview-sidebar span.active{background:#213A52;color:#fff}
.fp-preview-main{padding:18px;min-width:0;max-width:100%;overflow:hidden}
.fp-mini-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px}
.fp-mini-head strong{display:block;font-size:13px;margin-top:5px}
.fp-demo-tag{font:500 7px 'IBM Plex Mono';color:#1F6F54;background:#E8F4ED;padding:5px 7px;border-radius:6px}
.fp-stat-row,.fp-demo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fp-stat-row>div,.fp-demo-cards>div{
  background:#fff;border:1px solid #E1E6DF;border-radius:10px;padding:11px;min-width:0
}
.fp-stat-row span,.fp-demo-cards span{display:block;font:500 7px 'IBM Plex Mono';color:#87918E;letter-spacing:.5px}
.fp-stat-row b,.fp-demo-cards b{display:block;font-size:12px;margin-top:6px}
.fp-stat-row small,.fp-demo-cards small{display:block;color:#8B949E;font-size:8px;margin-top:4px}
.fp-chart{background:#17283B;border-radius:11px;padding:13px;margin-top:9px}
.fp-chart-label,.fp-demo-chart-head{display:flex;justify-content:space-between;color:#DDE4EA;font-size:9px}
.fp-chart-label small,.fp-demo-chart-head span{font:500 7px 'IBM Plex Mono';color:#8998A8}
.fp-bars,.fp-big-bars{height:120px;display:flex;align-items:flex-end;gap:5px;border-bottom:1px solid rgba(255,255,255,.08);padding:8px 2px 0}
.fp-bars i,.fp-big-bars i{flex:1;display:block;background:#C9A227;border-radius:4px 4px 0 0;animation:fpRise .7s ease both}
@keyframes fpRise{from{transform:scaleY(.2);opacity:0}to{transform:scaleY(1);opacity:1}}
.fp-chart-bottom{display:flex;justify-content:space-between;color:#8391A0;font-size:7px;margin-top:8px}
.fp-floating-card{
  position:absolute;z-index:3;background:#fff;border:1px solid #E0E5DF;border-radius:12px;
  padding:10px 12px;display:flex;align-items:center;gap:8px;box-shadow:0 16px 35px rgba(16,28,44,.14)
}
.fp-floating-card>span{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:#EAF0FF;color:#2E5BFF;font-size:11px;font-weight:800}
.fp-floating-card b{display:block;font-size:9px}.fp-floating-card small{display:block;color:#7C8791;font-size:7px;margin-top:2px}
.floating-one{left:18px;bottom:45px}
.floating-two{right:18px;top:42px}

.fp-feature-switcher{margin-top:28px;padding:8px;background:rgba(255,255,255,.72);border:1px solid #E0E5DF;border-radius:16px;display:flex;align-items:center;gap:15px}
.fp-switcher-label{min-width:165px;padding:8px 12px}.fp-switcher-label span{display:block;font:600 8px 'IBM Plex Mono';letter-spacing:1px}.fp-switcher-label small{display:block;color:#88928C;font-size:9px;margin-top:3px}
.fp-feature-tabs{display:flex;gap:7px;flex:1;min-width:0}
.fp-feature-tabs button{
  flex:1;min-width:0;border:1px solid transparent;background:transparent;border-radius:10px;
  padding:11px 8px;color:#687483;font-size:10px;font-weight:700;cursor:pointer;transition:.2s
}
.fp-feature-tabs button span{display:inline-grid;place-items:center;width:23px;height:23px;border-radius:7px;background:#EEF1ED;color:#1F6F54;margin-right:6px}
.fp-feature-tabs button.active{background:#101C2C;color:#fff;box-shadow:0 8px 20px rgba(16,28,44,.12)}
.fp-feature-tabs button.active span{background:#1F6F54;color:#fff}

.fp-section{padding:92px 0}
.fp-light{background:#fff}
.fp-section-heading{max-width:760px}
.fp-kicker{display:block;color:#C49A1F;font:600 9px 'IBM Plex Mono';letter-spacing:1.5px}
.fp-section h2,.fp-ai-section h2,.fp-final h2{
  font:600 clamp(34px,4.5vw,54px)/1.08 'Fraunces',Georgia,serif;
  letter-spacing:-1.5px;margin:9px 0 14px
}
.fp-section-heading p,.fp-ai-section>div>p{max-width:720px;color:#687484;line-height:1.75;font-size:15px;margin:0}

.fp-feature-detail{
  display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:50px;align-items:center;margin-top:45px;
  width:100%;
}
.fp-feature-detail > *{min-width:0;max-width:100%;}
.fp-detail-copy{padding-right:15px;min-width:0}
.fp-detail-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:13px;background:#101C2C;color:#C9A227;font-size:20px;margin-bottom:18px}
.fp-detail-copy h3{font:600 clamp(30px,3.5vw,45px)/1.08 'Fraunces',Georgia,serif;margin:8px 0 14px}
.fp-detail-copy>p{color:#687484;line-height:1.7;font-size:14px}
.fp-points{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.fp-points span{background:#F1F5F1;border:1px solid #DFE6DF;padding:7px 9px;border-radius:8px;color:#416052;font-size:10px}
.fp-arrow-link{color:#1F6F54;text-decoration:none;font-size:12px;font-weight:800}
.fp-detail-preview .fp-preview-shell{animation:none;box-shadow:0 20px 50px rgba(16,28,44,.14)}
.fp-detail-preview .fp-preview-sidebar{display:none}
.fp-detail-preview .fp-preview-body{display:block;min-height:330px}
.fp-detail-preview .fp-preview-main{padding:20px;min-width:0;max-width:100%;overflow:hidden}

.fp-workflow{background:#101C2C;color:#fff;overflow:hidden}
.fp-workflow h2,.fp-workflow h3{color:#fff}
.fp-split-heading{display:flex;align-items:end;justify-content:space-between;gap:40px;min-width:0}
.fp-split-heading > *{min-width:0;max-width:100%}
.fp-split-heading h2{margin-bottom:0}.fp-split-heading p{max-width:390px;color:#AEB9C6;line-height:1.7;font-size:13px}
.light-kicker{color:#C9A227}
.fp-journey{margin-top:52px;display:grid;grid-template-columns:repeat(5,1fr);gap:0}
.fp-journey-step{position:relative;min-width:0;width:100%;overflow:hidden}
.fp-step-number{color:#C9A227;font:600 11px 'IBM Plex Mono';letter-spacing:1px}
.fp-step-line{height:42px;display:flex;align-items:center;position:relative}
.fp-step-line span{width:13px;height:13px;border-radius:50%;background:#C9A227;border:3px solid #2A3543;z-index:2}
.fp-step-line i{height:1px;background:#344253;position:absolute;left:12px;right:0;top:21px}
.fp-step-content{padding-right:20px;min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:normal}
.fp-step-content h3{font-size:14px;margin:7px 0;color:#fff}.fp-step-content p{color:#9DAAB9;font-size:11px;line-height:1.6;margin:0;max-width:100%;overflow-wrap:anywhere}

.fp-demo-section{background:#F3F5F1}
.fp-demo-header{display:flex;justify-content:space-between;align-items:end;gap:40px}
.fp-demo-header>div{max-width:700px}.fp-demo-header>p{max-width:350px;color:#687484;font-size:13px;line-height:1.7}
.fp-demo-board{margin-top:38px;background:#101C2C;border-radius:22px;padding:14px;box-shadow:0 25px 60px rgba(16,28,44,.16)}
.fp-demo-board-top{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;color:#fff}
.fp-demo-brand{font-weight:700;font-size:13px}.fp-demo-brand span{display:inline-grid;place-items:center;width:26px;height:26px;background:#1F6F54;border-radius:7px;margin-right:7px;font:italic 700 16px Georgia}
.fp-demo-status{font:500 8px 'IBM Plex Mono';color:#78D8A5}.fp-demo-status i{display:inline-block;width:5px;height:5px;background:#59D58E;border-radius:50%;margin-right:5px}
.fp-demo-board-grid{display:grid;grid-template-columns:145px 1fr;background:#F6F8F5;border-radius:15px;overflow:hidden}
.fp-demo-menu{padding:18px 10px;background:#17283B;display:flex;flex-direction:column;gap:4px}
.fp-demo-menu span{padding:8px 9px;border-radius:7px;color:#8E9BAA;font-size:9px}.fp-demo-menu .selected{background:#233D55;color:#fff}
.fp-demo-content{padding:22px;min-width:0}.fp-demo-welcome{display:flex;justify-content:space-between;align-items:center;gap:20px}.fp-demo-welcome h3{margin:6px 0;font-size:17px}.fp-demo-welcome button{border:1px solid #D8DED7;background:#fff;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:700;cursor:pointer}
.fp-demo-cards{margin-top:17px}.fp-demo-lower{display:grid;grid-template-columns:1.5fr .8fr;gap:10px;margin-top:10px}
.fp-demo-chart{background:#17283B;border-radius:11px;padding:15px}.fp-big-bars{height:155px}.fp-demo-ai{background:#fff;border:1px solid #E1E6DF;border-radius:11px;padding:15px}.fp-ai-badge{display:grid;place-items:center;width:31px;height:31px;background:#EAF0FF;color:#2E5BFF;border-radius:9px;font:600 9px 'IBM Plex Mono'}.fp-demo-ai b{display:block;margin-top:14px;font-size:13px}.fp-demo-ai p{font-size:11px;margin:8px 0;color:#34404F}.fp-answer{display:block;background:#F2F6F3;color:#5F6D68;padding:9px;border-radius:8px;font-size:9px;line-height:1.5}
.fp-demo-cta{margin-top:25px;background:#fff;border:1px solid #E0E5DE;border-radius:17px;padding:23px;display:flex;align-items:center;justify-content:space-between;gap:20px}.fp-demo-cta h3{font-size:20px;margin:7px 0 3px}.fp-demo-cta p{color:#7B857F;font-size:10px;margin:0}.fp-text-btn{border:0;background:none;color:#1F6F54;font-size:11px;font-weight:800;margin-top:10px;cursor:pointer}

.fp-ai-section{background:#fff}
.fp-ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.fp-question-list{margin-top:25px;display:flex;flex-direction:column;gap:8px}
.fp-question-list button{border:1px solid #E0E5DE;background:#F8FAF7;text-align:left;padding:12px 14px;border-radius:10px;display:flex;justify-content:space-between;color:#263344;font-size:11px;cursor:pointer}.fp-question-list button:hover{border-color:#1F6F54;color:#1F6F54}
.fp-ai-window{background:#101C2C;border-radius:20px;padding:14px;box-shadow:0 22px 55px rgba(16,28,44,.18)}
.fp-ai-window-head{height:42px;display:flex;justify-content:space-between;align-items:center;color:#fff;padding:0 5px;font-size:11px}.fp-ai-window-head span i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#59D58E;margin-right:7px}.fp-ai-window-head small{font:500 7px 'IBM Plex Mono';color:#8796A7}
.fp-chat{background:#F7F9F6;border-radius:14px;padding:18px;min-height:300px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px}
.fp-chat-user{align-self:flex-end;max-width:75%;background:#2E5BFF;color:#fff;border-radius:12px 12px 3px 12px;padding:11px;font-size:11px}
.fp-chat-ai{display:flex;gap:10px;align-items:flex-start;max-width:85%}.fp-ai-circle{width:30px;height:30px;border-radius:9px;background:#101C2C;color:#C9A227;display:grid;place-items:center}.fp-chat-ai b{font-size:10px}.fp-chat-ai p{font-size:10px;color:#687484;line-height:1.6;margin:5px 0}
.fp-chat-input{border:1px solid #DCE2DB;background:#fff;color:#929B98;border-radius:9px;padding:11px;font-size:10px;display:flex;justify-content:space-between}.fp-chat-input span{color:#2E5BFF;font-weight:800}

.fp-final{background:#fff;padding-top:25px}
.fp-final-card{background:#101C2C;color:#fff;border-radius:23px;padding:44px;display:flex;align-items:center;justify-content:space-between;gap:35px}
.fp-final h2{margin:8px 0 12px}.fp-final p{color:#B8C2CF;max-width:590px;font-size:13px;line-height:1.7;margin:0}
.fp-final-actions{min-width:230px;display:flex;flex-direction:column;gap:10px}.fp-final-primary{background:#C9A227;color:#101C2C;text-decoration:none;padding:13px 16px;border-radius:9px;text-align:center;font-size:12px;font-weight:800}.fp-final-secondary{color:#D7DEE5;text-decoration:none;text-align:center;font-size:10px}

.fp-login-section{background:#F1F4F0;padding:92px 0}
.fp-login-grid{display:grid;grid-template-columns:1fr 440px;gap:80px;align-items:center}
.fp-login-copy h2{font:600 clamp(38px,4.5vw,57px)/1.05 'Fraunces',Georgia,serif;margin:9px 0 15px}.fp-login-copy p{color:#687484;line-height:1.75;max-width:600px;font-size:14px}
.fp-login-checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:24px}.fp-login-checks span{font-size:11px;color:#58665F}
.fp-login-card{background:#fff;border:1px solid #DDE3DB;border-radius:18px;padding:27px;box-shadow:0 20px 45px rgba(16,28,44,.09)}
.fp-login-card-top{display:flex;justify-content:space-between;color:#89938E;font:500 8px 'IBM Plex Mono';letter-spacing:1px}.fp-login-card h3{font:600 30px 'Fraunces',Georgia,serif;margin:19px 0 5px}.fp-login-card>p{font-size:11px;color:#75817C;margin:0 0 12px}.fp-not-you{border:0;background:none;color:#1F6F54;font-size:10px;padding:0;margin-bottom:16px;cursor:pointer}
.fp-login-card form{display:flex;flex-direction:column;gap:15px}.fp-login-card label{display:flex;flex-direction:column;gap:7px;color:#3C4754;font-size:10px;font-weight:700}.fp-login-card input{width:100%;height:44px;border:1px solid #D7DED6;border-radius:9px;padding:0 12px;font-size:12px;outline:none;background:#FBFCFA}.fp-login-card input:focus{border-color:#1F6F54;box-shadow:0 0 0 3px rgba(31,111,84,.12)}.fp-password-label{display:flex;justify-content:space-between}.fp-password-label a{color:#1F6F54;text-decoration:none;font-size:9px}.fp-password-wrap{position:relative}.fp-password-wrap input{padding-right:58px}.fp-password-wrap button{position:absolute;right:7px;top:7px;height:30px;border:0;background:#EEF3EF;border-radius:7px;color:#1F6F54;font-size:9px;font-weight:800;cursor:pointer}.fp-field-error{color:#B04A42;font-size:9px;margin-top:-10px}.fp-error{background:#FFF1EF;border:1px solid #F2D1CC;color:#A33D35;border-radius:8px;padding:9px;font-size:10px}.fp-login-primary{height:45px;border:0;border-radius:9px;background:#2E5BFF;color:#fff;font-weight:800;font-size:12px;cursor:pointer}.fp-login-primary:disabled,.fp-google:disabled{opacity:.65;cursor:not-allowed}.fp-or{display:flex;align-items:center;gap:8px;color:#8A938E;font-size:9px}.fp-or span{height:1px;background:#E2E6E0;flex:1}.fp-google{height:43px;border:1px solid #D9DFD8;background:#fff;border-radius:9px;color:#27323E;font-size:11px;font-weight:700;cursor:pointer}.fp-google:hover{border-color:#101C2C;background:#FAFBF9}.fp-login-footer{display:flex;justify-content:center;gap:6px;margin-top:19px;font-size:10px;color:#7B857F}.fp-login-footer a{color:#1F6F54;text-decoration:none;font-weight:800}

.fp-footer{background:#101C2C;padding:35px 0 45px}.fp-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:25px}.fp-footer .fp-brand{color:#fff}.fp-footer .fp-brand-mark{background:#1F6F54}.fp-footer p{color:#778698;font:500 7px 'IBM Plex Mono';letter-spacing:1.3px;margin:6px 0 0 48px}.fp-footer-inner>div:last-child{display:flex;flex-wrap:wrap;gap:18px}.fp-footer-inner a{color:#AAB6C3;text-decoration:none;font-size:10px}.fp-footer-inner a:hover{color:#fff}

.fp-ai-demo{display:flex;flex-direction:column;gap:10px}.fp-ai-msg{max-width:82%;padding:10px;border-radius:9px;font-size:9px;line-height:1.5}.fp-ai-msg.user{align-self:flex-end;background:#2E5BFF;color:#fff}.fp-ai-msg.bot{background:#fff;border:1px solid #E0E5DE;color:#52606B}.fp-ai-msg.bot b{display:block;color:#101C2C;margin-bottom:3px}.fp-ai-suggestions{display:flex;flex-wrap:wrap;gap:5px}.fp-ai-suggestions button{border:1px solid #DCE2DB;background:#fff;border-radius:7px;padding:7px;font-size:8px;cursor:pointer}
.fp-qr-demo{display:grid;grid-template-columns:150px 1fr;gap:15px}.fp-phone{background:#101C2C;color:#fff;border-radius:18px;padding:15px;min-height:275px;position:relative}.fp-phone-notch{width:38px;height:4px;background:#3A4A5C;border-radius:4px;margin:0 auto 15px}.fp-phone .fp-mono{display:block}.fp-phone>b{display:block;margin:5px 0 14px;font-size:12px}.fp-product-row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #26384B;padding:10px 0;font-size:8px}.fp-product-row span i{display:inline-block;width:19px;height:19px;background:#23384D;border-radius:5px;vertical-align:middle;margin-right:6px}.fp-product-row button{border:0;background:#1F6F54;color:#fff;border-radius:5px;padding:5px 6px;font-size:7px}.fp-cart-button{background:#C9A227;color:#101C2C;border-radius:7px;text-align:center;padding:8px;font-size:8px;font-weight:800;margin-top:10px}.fp-order-flow{display:flex;flex-direction:column;justify-content:center}.fp-order-flow>span{font:500 8px 'IBM Plex Mono';color:#8997A5}.fp-order-flow>b{font-size:17px;margin:8px 0 20px}.fp-flow-line{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.fp-flow-line i{font-style:normal;background:#EAF3ED;color:#1F6F54;padding:8px;border-radius:7px;font-size:8px}.fp-flow-line em{font-style:normal;color:#A0AAA5}.fp-order-flow small{color:#73808B;line-height:1.6;margin-top:18px;font-size:9px}
.fp-inventory-demo{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fp-inventory-card{background:#fff;border:1px solid #E0E5DE;border-radius:9px;padding:10px}.fp-inventory-card span{font:500 7px 'IBM Plex Mono';color:#89928D}.fp-inventory-card strong{display:block;font-size:11px;margin-top:5px}.fp-inventory-card small{display:block;color:#89928D;font-size:7px;margin-top:3px}.fp-stock-list{grid-column:1/-1;background:#fff;border:1px solid #E0E5DE;border-radius:9px;padding:9px;font-size:8px}.fp-stock-list>div{display:grid;grid-template-columns:1fr 1fr;padding:7px;border-bottom:1px solid #EEF1ED}.fp-stock-list>div:last-child{border:0}.fp-stock-list span{color:#8B958F;font:500 7px 'IBM Plex Mono'}.fp-stock-list i{font-style:normal;color:#1F6F54}

@media(max-width:1100px){
  .fp-container{width:min(94vw,1160px)}
  .fp-feature-detail{gap:32px}
  .fp-journey{grid-template-columns:repeat(5,minmax(0,1fr))}
}
@media(max-width:1000px){
  .fp-hero-grid{grid-template-columns:1fr;gap:35px}
  .fp-hero-copy{max-width:760px}
  .fp-hero-product{max-width:760px;width:100%;margin:auto}
  .fp-feature-detail{grid-template-columns:1fr;gap:30px}
  .fp-detail-copy{max-width:760px}
  .fp-journey{grid-template-columns:1fr;gap:20px}
  .fp-journey-step{display:grid;grid-template-columns:35px 25px 1fr}
  .fp-step-line{height:100%}.fp-step-line i{width:1px;height:100%;left:6px;right:auto;top:15px}
  .fp-ai-grid{grid-template-columns:1fr;gap:35px}
  .fp-login-grid{grid-template-columns:1fr;gap:40px}
}
@media(max-width:760px){
  .fp-nav{padding:11px 4vw}.fp-nav-links{display:none}.fp-nav-actions{min-width:auto}.fp-login-link{display:none}.fp-brand{min-width:auto}.fp-brand strong{font-size:20px}
  .fp-hero{padding-top:48px}.fp-hero h1{font-size:clamp(43px,12vw,61px);letter-spacing:-2px}
  .fp-feature-switcher{display:block;padding:10px}.fp-switcher-label{padding:7px}.fp-feature-tabs{overflow-x:auto;padding-bottom:2px}.fp-feature-tabs button{min-width:112px;white-space:nowrap}
  .fp-floating-card{display:none}
  .fp-preview-body{grid-template-columns:75px 1fr}.fp-preview-sidebar span{font-size:8px;padding:7px 5px}.fp-preview-main{padding:12px}.fp-stat-row,.fp-inventory-demo{grid-template-columns:1fr}.fp-stat-row>div:nth-child(3),.fp-inventory-card:nth-child(3){display:none}
  .fp-demo-board-grid{grid-template-columns:1fr}.fp-demo-menu{display:none}.fp-demo-lower{grid-template-columns:1fr}.fp-demo-ai{display:none}
  .fp-demo-header,.fp-split-heading,.fp-final-card,.fp-footer-inner{display:block}.fp-demo-header>p{margin-top:15px}.fp-final-actions{margin-top:25px}.fp-footer-inner>div:last-child{margin-top:25px}
  .fp-login-checks{grid-template-columns:1fr}
}
@media(max-width:520px){
  .fp-hero-text{font-size:15px}.fp-trust{display:grid;gap:7px}
  .fp-preview-shell{padding:11px;border-radius:18px}.fp-preview-body{min-height:315px}.fp-preview-sidebar{display:none}.fp-preview-main{padding:13px}
  .fp-detail-preview .fp-preview-sidebar{display:none}.fp-detail-preview .fp-preview-body{min-height:290px}
  .fp-qr-demo{grid-template-columns:1fr}.fp-order-flow{display:none}
  .fp-phone{max-width:220px;margin:auto}
  .fp-section{padding:68px 0}
  .fp-demo-cards{grid-template-columns:1fr}.fp-demo-cards>div:nth-child(3){display:none}
  .fp-login-card{padding:21px}.fp-final-card{padding:29px}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}.fp-preview-shell{animation:none}.fp-bars i,.fp-big-bars i{animation:none}
}
`;

