import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

const CONFIG = {
  brand: "FinancePro",
  tagline: "One ledger for the whole business",
  signupNote: "Free to set up. About two minutes.",
  trust: ["Secure sign-in", "Your data stays yours", "Built for Indian businesses"],
  demo: { enabled: true, email: "demo@financepro.com", password: "password123" },
};

const LAST_EMAIL_KEY = "financepro_last_email";

const FEATURES = [
  {
    id: "billing",
    icon: "₹",
    label: "Billing",
    eyebrow: "Sales",
    headline: "A bill takes seconds, not a workflow.",
    description:
      "Create a bill, take the payment, and it's already sitting in your sales history — connected to stock and the ledger, no re-entry.",
    points: ["Fast billing", "Payments recorded", "Sales history"],
    screenTitle: "Billing",
    screenText: "Add products, take payment, done.",
  },
  {
    id: "inventory",
    icon: "▦",
    label: "Inventory",
    eyebrow: "Stock",
    headline: "Know what's running low before it runs out.",
    description:
      "Every product and quantity lives in one place, with the items that need attention surfaced automatically.",
    points: ["Products", "Stock levels", "Low-stock alerts"],
    screenTitle: "Inventory",
    screenText: "Products, units and stock status together.",
  },
  {
    id: "qr",
    icon: "⌗",
    label: "QR ordering",
    eyebrow: "Customers",
    headline: "Let customers order without calling the counter.",
    description:
      "A customer scans a code, builds their order on their own phone, and it lands straight in your queue.",
    points: ["Scan to browse", "Self-serve ordering", "Straight to the counter"],
    screenTitle: "QR ordering",
    screenText: "Customer's phone, your counter, one order.",
  },
  {
    id: "expenses",
    icon: "↘",
    label: "Expenses",
    eyebrow: "Spending",
    headline: "See where the money actually goes.",
    description:
      "Log purchases and everyday spending as they happen, and let them turn into a picture you can act on.",
    points: ["Purchases", "Expenses", "Clear reports"],
    screenTitle: "Expenses",
    screenText: "Spending, organized as it happens.",
  },
  {
    id: "ai",
    icon: "✦",
    label: "AI Business",
    eyebrow: "Insight",
    headline: "Ask your business a question. Get an answer.",
    description:
      "Point it at your sales, stock and expenses and ask what needs attention — in plain language, not a report you have to build yourself.",
    points: ["Sales insight", "Expense review", "Plain-language answers"],
    screenTitle: "AI Business",
    screenText: "Ask a question, get a straight answer.",
  },
];

const JOURNEY = [
  ["1", "Set up your business", "A few details and the workspace is yours."],
  ["2", "Add your products", "Prices, units, stock, categories — once."],
  ["3", "Start billing", "Every sale keeps stock and the ledger in step."],
  ["4", "Stay ahead of it", "Stock, purchases, expenses, one dashboard."],
  ["5", "Ask instead of digging", "AI Business answers from what's already there."],
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
          <span className="fp-eyebrow-dark">{feature.eyebrow}</span>
          <h3>{feature.screenTitle}</h3>
        </div>
        <span className="fp-live"><i /> live</span>
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
            <strong>{feature.headline}</strong>
          </div>

          {isAI ? (
            <div className="fp-ai-demo">
              <div className="fp-ai-msg user">Which part of my business needs attention?</div>
              <div className="fp-ai-msg bot">
                <b>AI Business</b>
                <span>Sales dipped on Tuesdays and three items are close to out of stock.</span>
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
                <span className="fp-eyebrow-dark">Customer menu</span>
                <b>Browse & order</b>
                {["Product", "Product", "Product"].map((x, i) => (
                  <div className="fp-product-row" key={i}>
                    <span><i />{x}</span>
                    <button type="button">Add</button>
                  </div>
                ))}
                <div className="fp-cart-button">View cart</div>
              </div>
              <div className="fp-order-flow">
                <b>Customer to counter</b>
                <div className="fp-flow-line">
                  <i>Scan</i><em>—</em><i>Choose</i><em>—</em><i>Order</i>
                </div>
                <small>The order lands in the owner's queue right away.</small>
              </div>
            </div>
          ) : isInventory ? (
            <div className="fp-inventory-demo">
              {["Products", "Stock", "Needs attention"].map((x, i) => (
                <div className="fp-inventory-card" key={x}>
                  <span>{x}</span>
                  <strong>{i === 0 ? "128 items" : i === 1 ? "In view" : "3 low"}</strong>
                </div>
              ))}
              <div className="fp-stock-list">
                <div><span>Product</span><span>Status</span></div>
                <div><b>Basmati rice, 5kg</b><i>In stock</i></div>
                <div><b>Sunflower oil, 1L</b><i>Low stock</i></div>
                <div><b>Toor dal, 1kg</b><i>In stock</i></div>
              </div>
            </div>
          ) : (
            <div className="fp-generic-demo">
              <div className="fp-stat-row">
                <div><span>{feature.id === "billing" ? "Today's sales" : "This month"}</span><b>₹18,420</b></div>
                <div><span>{feature.id === "billing" ? "Payments" : "Purchases"}</span><b>{feature.id === "billing" ? "All settled" : "₹6,150"}</b></div>
                <div><span>Trend</span><b>Up 12%</b></div>
              </div>
              <div className="fp-chart">
                <div className="fp-chart-label"><span>Last 10 days</span></div>
                <div className="fp-bars">
                  {[38, 52, 45, 68, 55, 80, 62, 88, 70, 92].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
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
          <a href="#login" className="fp-login-link">Log in</a>
          <Link to="/register" className="fp-nav-cta">Get started</Link>
          {mobile && (
            <button
              type="button"
              className="fp-menu-btn"
              onClick={() => setMobileMenu((v) => !v)}
              aria-label="Open menu"
            >
              <span />
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
              <h1>
                Run the business.
                <br />
                <span>Understand every rupee.</span>
              </h1>

              <p className="fp-hero-text">
                Billing, inventory, expenses, customers and QR ordering, all feeding
                one ledger — with an AI that can answer for it when you ask.
              </p>

              <div className="fp-actions">
                <Link to="/register" className="fp-primary-btn">
                  Create your business
                </Link>
                <a href="#demo" className="fp-secondary-btn">
                  See how it works
                </a>
              </div>

              <div className="fp-trust">
                {CONFIG.trust.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>

            <div className="fp-hero-product">
              <DashboardPreview feature={feature} />
              <div className="fp-floating-card floating-one">
                <span>✓</span>
                <div><b>One connected workflow</b><small>Sale → stock → decision</small></div>
              </div>
            </div>
          </div>

          <div className="fp-container fp-feature-switcher">
            <span className="fp-switcher-label">The workspace</span>
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
              <h2>Everything the business does,<br /><span>kept in one place.</span></h2>
              <p>
                FinancePro brings the everyday pieces of running a shop together,
                so you move from action to answer without rebuilding the picture by hand.
              </p>
            </div>

            <div className="fp-feature-detail">
              <div className="fp-detail-copy">
                <span className="fp-detail-icon">{feature.icon}</span>
                <span className="fp-eyebrow">{feature.eyebrow}</span>
                <h3>{feature.headline}</h3>
                <p>{feature.description}</p>

                <div className="fp-points">
                  {feature.points.map((point) => (
                    <span key={point}>{point}</span>
                  ))}
                </div>

                <a href="#demo" className="fp-arrow-link">Explore this workflow</a>
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
                <span className="fp-eyebrow light-kicker">How it works</span>
                <h2>From first setup to<br /><span>daily control.</span></h2>
              </div>
              <p>
                Built around the way a shop actually runs: set up, sell,
                manage, review, and ask when you need an answer.
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
                <span className="fp-eyebrow">Try it</span>
                <h2>Don't just read about it.<br /><span>Move through the workspace.</span></h2>
              </div>
              <p>
                Switch modules above to see how billing, stock and reports
                stay connected as you work.
              </p>
            </div>

            <div className="fp-demo-board">
              <div className="fp-demo-board-top">
                <div className="fp-demo-brand"><span>F</span> FinancePro</div>
                <div className="fp-demo-status"><i /> demo workspace</div>
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
                      <span className="fp-eyebrow-dark">Owner dashboard</span>
                      <h3>Your business, at a glance.</h3>
                    </div>
                    <button type="button" onClick={() => setActive((active + 1) % FEATURES.length)}>
                      Next module
                    </button>
                  </div>

                  <div className="fp-demo-cards">
                    <div><span>Billing</span><b>₹18,420 today</b></div>
                    <div><span>Inventory</span><b>3 items low</b></div>
                    <div><span>AI Business</span><b>2 new answers</b></div>
                  </div>

                  <div className="fp-demo-lower">
                    <div className="fp-demo-chart">
                      <div className="fp-demo-chart-head"><b>Business activity</b><span>Last 11 days</span></div>
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
                      <span className="fp-answer">Three items are close to out of stock, and Tuesday sales are trailing the weekly average.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="fp-demo-cta">
              <div>
                <h3>Open your own workspace.</h3>
                <p>{CONFIG.signupNote}</p>
              </div>
              <div>
                <Link to="/register" className="fp-primary-btn">Create your business</Link>
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
              <span className="fp-eyebrow">AI Business</span>
              <h2>Your business has questions.<br /><span>Ask them plainly.</span></h2>
              <p>
                FinancePro turns your own sales, stock and expense data into
                answers in plain language — so you investigate instead of
                rebuilding a report by hand.
              </p>

              <div className="fp-question-list">
                <button type="button" onClick={() => setActive(4)}>What needs my attention?</button>
                <button type="button" onClick={() => setActive(4)}>Show me the business picture.</button>
                <button type="button" onClick={() => setActive(4)}>Help me understand my expenses.</button>
              </div>
            </div>

            <div className="fp-ai-window">
              <div className="fp-ai-window-head">
                <span><i /> AI Business</span>
              </div>
              <div className="fp-chat">
                <div className="fp-chat-user">What can you help me understand?</div>
                <div className="fp-chat-ai">
                  <span className="fp-ai-circle">✦</span>
                  <div>
                    <b>FinancePro AI</b>
                    <p>
                      I can look at your sales, inventory, expenses and activity —
                      ask me what needs a closer look.
                    </p>
                  </div>
                </div>
                <div className="fp-chat-input">Ask about your business…</div>
              </div>
            </div>
          </div>
        </section>

        <section className="fp-section fp-final">
          <div className="fp-container">
            <div className="fp-final-card">
              <div>
                <h2>Start with your business.<br /><span>Build from there.</span></h2>
                <p>
                  Create your workspace and bring billing, stock, spending
                  and reporting into one connected place.
                </p>
              </div>
              <div className="fp-final-actions">
                <Link to="/register" className="fp-final-primary">Create your business</Link>
                <a href="#login" className="fp-final-secondary">Already have an account? Log in</a>
              </div>
            </div>
          </div>
        </section>

        <section className="fp-login-section" id="login">
          <div className="fp-container fp-login-grid">
            <div className="fp-login-copy">
              <span className="fp-eyebrow">Owner login</span>
              <h2>{returning.name ? title : "Your workspace is waiting."}</h2>
              <p>
                Sign in to continue billing, inventory, expenses, purchases,
                reports and AI Business.
              </p>

              <div className="fp-login-checks">
                <span>Billing & sales</span>
                <span>Inventory & purchases</span>
                <span>Customers & suppliers</span>
                <span>AI Business insights</span>
              </div>
            </div>

            <div className="fp-login-card">
              <div className="fp-login-card-top">
                <span>Sign in</span>
                <span>Secure access</span>
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
                <Link to="/register">Create your business</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fp-footer">
        <div className="fp-container fp-footer-inner">
          <div>
            <Brand />
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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,380;9..144,560&family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#FAF7F1}
button,input{font:inherit}
button,a{-webkit-tap-highlight-color:transparent}

:root{
  --ink:#12192A;
  --ink-soft:#212B3D;
  --paper:#FAF7F1;
  --paper-deep:#F1EBDB;
  --line:#E4DCC7;
  --brass:#A97A34;
  --brass-deep:#8C6427;
  --forest:#2C5C4C;
  --forest-deep:#1E4437;
  --slate:#5C6675;
  --slate-soft:#8A9098;
}

.fp-page{
  min-height:100vh;
  background:var(--paper);
  color:var(--ink);
  font-family:'Instrument Sans',system-ui,sans-serif;
  overflow:hidden;
  -webkit-font-smoothing:antialiased;
}
.fp-container{width:min(1140px,92vw);margin:0 auto}

.fp-nav{
  position:sticky;top:0;z-index:100;
  min-height:76px;padding:14px 4vw;
  display:flex;align-items:center;justify-content:space-between;gap:20px;
  background:rgba(250,247,241,.9);
  backdrop-filter:blur(16px);
  border-bottom:1px solid var(--line);
}
.fp-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink);min-width:190px}
.fp-brand-mark{
  width:38px;height:38px;border-radius:10px;display:grid;place-items:center;
  background:var(--forest);color:#F1E7C8;font:italic 560 22px 'Fraunces',Georgia,serif
}
.fp-brand strong{display:block;font:560 21px 'Fraunces',Georgia,serif;line-height:1}
.fp-brand small{display:block;margin-top:4px;color:var(--slate-soft);font-size:11px;font-style:italic}
.fp-nav-links{display:flex;align-items:center;gap:5px}
.fp-nav-links a,.fp-login-link{
  color:var(--slate);text-decoration:none;font-size:14px;font-weight:500;
  padding:9px 13px;border-radius:8px;transition:.2s
}
.fp-nav-links a:hover,.fp-login-link:hover{background:var(--paper-deep);color:var(--forest)}
.fp-nav-actions{display:flex;align-items:center;gap:10px;min-width:190px;justify-content:flex-end}
.fp-nav-cta{
  display:inline-flex;align-items:center;text-decoration:none;
  background:var(--ink);color:#F1E7C8;border-radius:9px;padding:11px 18px;
  font-size:14px;font-weight:600;transition:.2s
}
.fp-nav-cta:hover{background:var(--forest-deep)}
.fp-menu-btn{border:1px solid var(--line);background:#fff;border-radius:9px;width:42px;height:42px;position:relative}
.fp-menu-btn span,.fp-menu-btn span::before,.fp-menu-btn span::after{content:"";position:absolute;left:12px;right:12px;height:2px;background:var(--ink);border-radius:2px}
.fp-menu-btn span{top:20px}.fp-menu-btn span::before{top:-6px}.fp-menu-btn span::after{top:6px}
.fp-mobile-menu{position:absolute;top:100%;left:0;right:0;background:var(--paper);border-bottom:1px solid var(--line);display:flex;flex-direction:column;padding:8px 4vw 16px}
.fp-mobile-menu a{color:var(--ink);text-decoration:none;padding:12px 4px;font-size:15px;border-bottom:1px solid var(--line)}

.fp-hero{
  padding:76px 0 30px;
  background:linear-gradient(180deg,#FCFAF5,#F2ECDC 130%);
  border-bottom:1px solid var(--line);
}
.fp-hero-grid{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:64px;align-items:center}
.fp-hero-grid > *{min-width:0;max-width:100%}
.fp-hero h1{
  font:380 clamp(42px,5vw,66px)/1.08 'Fraunces',Georgia,serif;
  letter-spacing:-1.5px;margin:0 0 22px;color:var(--ink)
}
.fp-hero h1 span{color:var(--forest);font-style:italic;font-weight:560}
.fp-section h2 span,.fp-final h2 span{color:var(--brass);font-style:italic}
.fp-hero-text{max-width:520px;color:var(--slate);font-size:17px;line-height:1.7;margin:0}
.fp-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}
.fp-primary-btn,.fp-secondary-btn{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:48px;padding:13px 22px;border-radius:9px;text-decoration:none;font-size:14.5px;font-weight:600;
  transition:.2s
}
.fp-primary-btn{background:var(--forest);color:#F5EFDC}
.fp-primary-btn:hover{background:var(--forest-deep)}
.fp-secondary-btn{background:transparent;color:var(--ink);border:1px solid var(--line)}
.fp-secondary-btn:hover{border-color:var(--forest);color:var(--forest)}
.fp-trust{display:flex;gap:22px;flex-wrap:wrap;margin-top:26px;color:var(--slate-soft);font-size:12.5px}
.fp-trust span{padding-left:14px;border-left:2px solid var(--brass)}

.fp-hero-product{position:relative;min-width:0;padding:12px 0}
.fp-preview-shell{
  position:relative;z-index:2;width:100%;background:linear-gradient(150deg,#12192A,#1D293D);
  border-radius:20px;padding:18px;box-shadow:0 28px 60px -14px rgba(18,25,42,.32);
  border:1px solid rgba(255,255,255,.06);animation:fpFloat 7s ease-in-out infinite
}
@keyframes fpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.fp-preview-top{display:flex;align-items:center;justify-content:space-between;color:#fff;padding:4px 5px 16px}
.fp-preview-top h3{font:560 18px 'Fraunces',Georgia,serif;margin:6px 0 0}
.fp-eyebrow-dark{font-size:11px;letter-spacing:.3px;color:#9BAABD}
.fp-live{font-size:10.5px;color:#8FCBA9;background:rgba(44,92,76,.28);padding:6px 10px;border-radius:999px}
.fp-live i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#6FCF97;margin-right:5px}
.fp-preview-body{display:grid;grid-template-columns:112px 1fr;background:var(--paper);border-radius:14px;overflow:hidden;min-height:365px}
.fp-preview-sidebar{background:var(--ink);padding:16px 10px;display:flex;flex-direction:column;gap:3px}
.fp-side-logo{width:29px;height:29px;border-radius:8px;display:grid;place-items:center;background:var(--forest);color:#F1E7C8;font:italic 560 16px 'Fraunces';margin-bottom:12px}
.fp-preview-sidebar span{padding:9px 8px;border-radius:7px;color:#7C8797;font-size:11.5px}
.fp-preview-sidebar span.active{background:#26334A;color:#fff}
.fp-preview-main{padding:20px;min-width:0;max-width:100%;overflow:hidden}
.fp-mini-head{margin-bottom:16px}
.fp-mini-head strong{display:block;font:560 15px 'Fraunces',Georgia,serif;color:var(--ink);line-height:1.35}
.fp-stat-row,.fp-demo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fp-stat-row>div,.fp-demo-cards>div{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px;min-width:0}
.fp-stat-row span,.fp-demo-cards span{display:block;color:var(--slate-soft);font-size:10.5px}
.fp-stat-row b,.fp-demo-cards b{display:block;font-family:'IBM Plex Mono';font-size:13px;margin-top:7px;color:var(--ink)}
.fp-chart{background:#17283B;border-radius:11px;padding:14px;margin-top:10px}
.fp-chart-label{color:#B8C2D0;font-size:11px;margin-bottom:8px}
.fp-bars,.fp-big-bars{height:118px;display:flex;align-items:flex-end;gap:5px;border-bottom:1px solid rgba(255,255,255,.08);padding:8px 2px 0}
.fp-bars i,.fp-big-bars i{flex:1;display:block;background:var(--brass);border-radius:3px 3px 0 0;animation:fpRise .7s ease both}
@keyframes fpRise{from{transform:scaleY(.2);opacity:0}to{transform:scaleY(1);opacity:1}}
.fp-floating-card{
  position:absolute;z-index:3;background:#fff;border:1px solid var(--line);border-radius:12px;
  padding:11px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 18px 34px -10px rgba(18,25,42,.2);
  max-width:210px;
}
.fp-floating-card>span{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:var(--paper-deep);color:var(--forest);font-size:12px;font-weight:700;flex-shrink:0}
.fp-floating-card b{display:block;font-size:11.5px}.fp-floating-card small{display:block;color:var(--slate-soft);font-size:10px;margin-top:2px}
.floating-one{left:0;bottom:34px}

.fp-feature-switcher{margin-top:32px;padding:10px;background:rgba(255,255,255,.6);border:1px solid var(--line);border-radius:15px;display:flex;align-items:center;gap:16px}
.fp-switcher-label{min-width:100px;padding:8px 10px;color:var(--slate-soft);font-size:12.5px;font-style:italic}
.fp-feature-tabs{display:flex;gap:6px;flex:1;min-width:0}
.fp-feature-tabs button{
  flex:1;min-width:0;border:1px solid transparent;background:transparent;border-radius:10px;
  padding:11px 8px;color:var(--slate);font-size:12.5px;font-weight:600;cursor:pointer;transition:.2s
}
.fp-feature-tabs button span{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:6px;background:var(--paper-deep);color:var(--forest);margin-right:6px}
.fp-feature-tabs button.active{background:var(--ink);color:#F5EFDC}
.fp-feature-tabs button.active span{background:var(--brass);color:var(--ink)}

.fp-section{padding:96px 0}
.fp-light{background:#fff}
.fp-section-heading{max-width:700px}
.fp-eyebrow{display:inline-block;color:var(--forest);font-size:13px;font-weight:600;font-style:italic;margin-bottom:6px}
.fp-section h2,.fp-ai-section h2,.fp-final h2{
  font:380 clamp(32px,4vw,48px)/1.15 'Fraunces',Georgia,serif;
  letter-spacing:-1px;margin:0 0 16px;color:var(--ink)
}
.fp-section-heading p,.fp-ai-section>div>p{max-width:640px;color:var(--slate);line-height:1.75;font-size:15.5px;margin:0}

.fp-feature-detail{
  display:grid;grid-template-columns:minmax(0,.72fr) minmax(0,1.28fr);gap:52px;align-items:center;margin-top:48px;
  width:100%;
}
.fp-feature-detail > *{min-width:0;max-width:100%}
.fp-detail-copy{padding-right:15px;min-width:0}
.fp-detail-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:var(--ink);color:var(--brass);font-size:19px;margin-bottom:16px}
.fp-detail-copy h3{font:400 clamp(26px,3vw,36px)/1.2 'Fraunces',Georgia,serif;margin:6px 0 14px;color:var(--ink)}
.fp-detail-copy>p{color:var(--slate);line-height:1.75;font-size:15px}
.fp-points{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.fp-points span{background:var(--paper-deep);border:1px solid var(--line);padding:8px 12px;border-radius:8px;color:var(--forest-deep);font-size:12.5px}
.fp-arrow-link{color:var(--forest);text-decoration:none;font-size:14px;font-weight:600;border-bottom:1px solid var(--forest)}
.fp-detail-preview .fp-preview-shell{animation:none;box-shadow:0 20px 44px -14px rgba(18,25,42,.22)}
.fp-detail-preview .fp-preview-sidebar{display:none}
.fp-detail-preview .fp-preview-body{display:block;min-height:320px}
.fp-detail-preview .fp-preview-main{padding:22px;min-width:0;max-width:100%;overflow:hidden}

.fp-workflow{background:var(--ink);color:#fff;overflow:hidden}
.fp-workflow h2,.fp-workflow h3{color:#fff}
.fp-split-heading{display:flex;align-items:end;justify-content:space-between;gap:40px;min-width:0}
.fp-split-heading > *{min-width:0;max-width:100%}
.fp-split-heading h2{margin-bottom:0}.fp-split-heading p{max-width:370px;color:#AEB9C6;line-height:1.7;font-size:14px}
.light-kicker{color:var(--brass)}
.fp-journey{margin-top:56px;display:grid;grid-template-columns:repeat(5,1fr);gap:0}
.fp-journey-step{position:relative;min-width:0;width:100%;overflow:hidden}
.fp-step-number{font-family:'IBM Plex Mono';font-weight:600;color:var(--brass);font-size:14px}
.fp-step-line{height:42px;display:flex;align-items:center;position:relative}
.fp-step-line span{width:12px;height:12px;border-radius:50%;background:var(--brass);border:3px solid #232E42;z-index:2}
.fp-step-line i{height:1px;background:#33405A;position:absolute;left:12px;right:0;top:20px}
.fp-step-content{padding-right:20px;min-width:0;max-width:100%;overflow-wrap:anywhere}
.fp-step-content h3{font:500 15px 'Instrument Sans';margin:7px 0;color:#fff}.fp-step-content p{color:#9DAAB9;font-size:12.5px;line-height:1.6;margin:0;max-width:100%;overflow-wrap:anywhere}

.fp-demo-section{background:var(--paper-deep)}
.fp-demo-header{display:flex;justify-content:space-between;align-items:end;gap:40px}
.fp-demo-header>div{max-width:660px}.fp-demo-header>p{max-width:330px;color:var(--slate);font-size:14px;line-height:1.7}
.fp-demo-board{margin-top:40px;background:var(--ink);border-radius:20px;padding:14px;box-shadow:0 24px 55px -18px rgba(18,25,42,.28)}
.fp-demo-board-top{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;color:#fff}
.fp-demo-brand{font:560 15px 'Fraunces'}.fp-demo-brand span{display:inline-grid;place-items:center;width:26px;height:26px;background:var(--forest);border-radius:7px;margin-right:8px;font:italic 700 15px Georgia}
.fp-demo-status{font-size:11.5px;color:#8FCBA9}.fp-demo-status i{display:inline-block;width:5px;height:5px;background:#6FCF97;border-radius:50%;margin-right:6px}
.fp-demo-board-grid{display:grid;grid-template-columns:150px 1fr;background:var(--paper);border-radius:14px;overflow:hidden}
.fp-demo-menu{padding:18px 10px;background:#1C283B;display:flex;flex-direction:column;gap:4px}
.fp-demo-menu span{padding:9px 10px;border-radius:7px;color:#8996A7;font-size:12px}.fp-demo-menu .selected{background:#28374E;color:#fff}
.fp-demo-content{padding:24px;min-width:0}.fp-demo-welcome{display:flex;justify-content:space-between;align-items:center;gap:20px}.fp-demo-welcome h3{margin:6px 0;font:400 19px 'Fraunces',Georgia,serif}.fp-demo-welcome button{border:1px solid var(--line);background:#fff;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer}
.fp-demo-cards{margin-top:18px}.fp-demo-lower{display:grid;grid-template-columns:1.5fr .8fr;gap:10px;margin-top:10px}
.fp-demo-chart{background:#17283B;border-radius:11px;padding:16px}.fp-big-bars{height:150px}.fp-demo-chart-head{display:flex;justify-content:space-between;color:#DDE4EA;font-size:11px;margin-bottom:8px}.fp-demo-chart-head span{color:#8998A8}
.fp-demo-ai{background:#fff;border:1px solid var(--line);border-radius:11px;padding:16px}.fp-ai-badge{display:grid;place-items:center;width:30px;height:30px;background:var(--paper-deep);color:var(--forest);border-radius:9px;font-family:'IBM Plex Mono';font-size:11px;font-weight:600}.fp-demo-ai b{display:block;margin-top:14px;font:500 14px 'Instrument Sans'}.fp-demo-ai p{font-size:12px;margin:8px 0;color:var(--ink-soft)}.fp-answer{display:block;background:var(--paper-deep);color:var(--slate);padding:10px;border-radius:8px;font-size:11.5px;line-height:1.55}
.fp-demo-cta{margin-top:26px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.fp-demo-cta h3{font:400 21px 'Fraunces',Georgia,serif;margin:0 0 4px}.fp-demo-cta p{color:var(--slate-soft);font-size:12.5px;margin:0}.fp-text-btn{border:0;background:none;color:var(--forest);font-size:13px;font-weight:600;cursor:pointer;text-decoration:underline}

.fp-ai-section{background:#fff}
.fp-ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.fp-question-list{margin-top:26px;display:flex;flex-direction:column;gap:8px}
.fp-question-list button{border:1px solid var(--line);background:var(--paper);text-align:left;padding:13px 15px;border-radius:10px;color:var(--ink);font-size:13.5px;cursor:pointer;transition:.2s}.fp-question-list button:hover{border-color:var(--forest);color:var(--forest)}
.fp-ai-window{background:var(--ink);border-radius:18px;padding:14px;box-shadow:0 22px 50px -16px rgba(18,25,42,.3)}
.fp-ai-window-head{height:42px;display:flex;align-items:center;color:#fff;padding:0 6px;font-size:13px}.fp-ai-window-head span i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#6FCF97;margin-right:8px}
.fp-chat{background:var(--paper);border-radius:14px;padding:18px;min-height:300px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px}
.fp-chat-user{align-self:flex-end;max-width:75%;background:var(--forest);color:#F5EFDC;border-radius:12px 12px 3px 12px;padding:11px 13px;font-size:12.5px}
.fp-chat-ai{display:flex;gap:10px;align-items:flex-start;max-width:85%}.fp-ai-circle{width:30px;height:30px;border-radius:9px;background:var(--ink);color:var(--brass);display:grid;place-items:center;flex-shrink:0}.fp-chat-ai b{font-size:12px}.fp-chat-ai p{font-size:12px;color:var(--slate);line-height:1.6;margin:5px 0}
.fp-chat-input{border:1px solid var(--line);background:#fff;color:var(--slate-soft);border-radius:9px;padding:12px 14px;font-size:12.5px}

.fp-final{background:#fff;padding-top:20px}
.fp-final-card{background:var(--ink);color:#fff;border-radius:22px;padding:46px;display:flex;align-items:center;justify-content:space-between;gap:35px}
.fp-final h2{margin:0 0 12px}.fp-final p{color:#B8C2CF;max-width:560px;font-size:14px;line-height:1.7;margin:0}
.fp-final-actions{min-width:230px;display:flex;flex-direction:column;gap:12px}.fp-final-primary{background:var(--brass);color:var(--ink);text-decoration:none;padding:14px 16px;border-radius:9px;text-align:center;font-size:13.5px;font-weight:700}.fp-final-secondary{color:#D7DEE5;text-decoration:none;text-align:center;font-size:12px}

.fp-login-section{background:var(--paper-deep);padding:96px 0}
.fp-login-grid{display:grid;grid-template-columns:1fr 440px;gap:80px;align-items:center}
.fp-login-copy h2{font:380 clamp(34px,4vw,50px)/1.15 'Fraunces',Georgia,serif;margin:6px 0 15px;color:var(--ink)}.fp-login-copy p{color:var(--slate);line-height:1.75;max-width:580px;font-size:15px}
.fp-login-checks{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:26px}.fp-login-checks span{font-size:13px;color:var(--forest-deep);padding-left:12px;border-left:2px solid var(--brass)}
.fp-login-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:28px;box-shadow:0 20px 48px -18px rgba(18,25,42,.14)}
.fp-login-card-top{display:flex;justify-content:space-between;color:var(--slate-soft);font-size:11.5px}
.fp-login-card h3{font:400 29px 'Fraunces',Georgia,serif;margin:20px 0 5px;color:var(--ink)}.fp-login-card>p{font-size:12.5px;color:var(--slate);margin:0 0 12px}
.fp-not-you{border:0;background:none;color:var(--forest);font-size:11.5px;padding:0;margin-bottom:16px;cursor:pointer;text-decoration:underline}
.fp-login-card form{display:flex;flex-direction:column;gap:16px}.fp-login-card label{display:flex;flex-direction:column;gap:7px;color:var(--ink-soft);font-size:12.5px;font-weight:600}
.fp-login-card input{width:100%;height:46px;border:1px solid var(--line);border-radius:9px;padding:0 13px;font-size:14px;outline:none;background:var(--paper)}
.fp-login-card input:focus{border-color:var(--forest);box-shadow:0 0 0 3px rgba(44,92,76,.13)}
.fp-password-label{display:flex;justify-content:space-between}.fp-password-label a{color:var(--forest);text-decoration:none;font-size:11.5px}
.fp-password-wrap{position:relative}.fp-password-wrap input{padding-right:60px}
.fp-password-wrap button{position:absolute;right:7px;top:7px;height:32px;border:0;background:var(--paper-deep);border-radius:7px;color:var(--forest-deep);font-size:11px;font-weight:600;cursor:pointer;padding:0 10px}
.fp-field-error{color:#A6402E;font-size:11.5px;margin-top:-10px}
.fp-error{background:#FCEFEA;border:1px solid #EFCCBE;color:#8F3A26;border-radius:8px;padding:10px 12px;font-size:12.5px}
.fp-login-primary{height:47px;border:0;border-radius:9px;background:var(--forest);color:#F5EFDC;font-weight:700;font-size:14px;cursor:pointer;transition:.2s}
.fp-login-primary:hover{background:var(--forest-deep)}
.fp-login-primary:disabled,.fp-google:disabled{opacity:.6;cursor:not-allowed}
.fp-or{display:flex;align-items:center;gap:9px;color:var(--slate-soft);font-size:11.5px}.fp-or span{height:1px;background:var(--line);flex:1}
.fp-google{height:45px;border:1px solid var(--line);background:#fff;border-radius:9px;color:var(--ink-soft);font-size:13.5px;font-weight:600;cursor:pointer;transition:.2s}
.fp-google:hover{border-color:var(--ink);background:var(--paper)}
.fp-login-footer{display:flex;justify-content:center;gap:6px;margin-top:20px;font-size:12.5px;color:var(--slate-soft)}.fp-login-footer a{color:var(--forest);text-decoration:none;font-weight:600}

.fp-footer{background:var(--ink);padding:38px 0 46px}.fp-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:25px}
.fp-footer .fp-brand{color:#fff}.fp-footer .fp-brand-mark{background:var(--forest)}.fp-footer .fp-brand small{color:#7C8797}
.fp-footer-inner>div:last-child{display:flex;flex-wrap:wrap;gap:20px}.fp-footer-inner a{color:#AAB6C3;text-decoration:none;font-size:13px}.fp-footer-inner a:hover{color:#fff}

.fp-ai-demo{display:flex;flex-direction:column;gap:10px}.fp-ai-msg{max-width:82%;padding:11px 13px;border-radius:10px;font-size:12px;line-height:1.55}.fp-ai-msg.user{align-self:flex-end;background:var(--forest);color:#F5EFDC}.fp-ai-msg.bot{background:#fff;border:1px solid var(--line);color:var(--slate)}.fp-ai-msg.bot b{display:block;color:var(--ink);margin-bottom:3px}.fp-ai-suggestions{display:flex;flex-wrap:wrap;gap:6px}.fp-ai-suggestions button{border:1px solid var(--line);background:#fff;border-radius:7px;padding:8px 10px;font-size:11px;cursor:pointer}
.fp-qr-demo{display:grid;grid-template-columns:150px 1fr;gap:16px}.fp-phone{background:var(--ink);color:#fff;border-radius:18px;padding:16px;min-height:275px;position:relative}.fp-phone-notch{width:38px;height:4px;background:#3A4A5C;border-radius:4px;margin:0 auto 16px}.fp-phone>b{display:block;margin:6px 0 15px;font:500 13px 'Instrument Sans'}.fp-product-row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #26384B;padding:10px 0;font-size:11.5px}.fp-product-row span i{display:inline-block;width:19px;height:19px;background:#23384D;border-radius:5px;vertical-align:middle;margin-right:7px}.fp-product-row button{border:0;background:var(--forest);color:#F5EFDC;border-radius:5px;padding:5px 8px;font-size:10px}.fp-cart-button{background:var(--brass);color:var(--ink);border-radius:7px;text-align:center;padding:9px;font-size:11.5px;font-weight:700;margin-top:12px}.fp-order-flow{display:flex;flex-direction:column;justify-content:center}.fp-order-flow>b{font:400 18px 'Fraunces',Georgia,serif;margin:0 0 20px}.fp-flow-line{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.fp-flow-line i{font-style:normal;background:var(--paper-deep);color:var(--forest-deep);padding:8px 10px;border-radius:7px;font-size:11px}.fp-flow-line em{font-style:normal;color:var(--slate-soft)}.fp-order-flow small{color:var(--slate);line-height:1.6;margin-top:18px;font-size:12px}
.fp-inventory-demo{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fp-inventory-card{background:#fff;border:1px solid var(--line);border-radius:9px;padding:11px}.fp-inventory-card span{color:var(--slate-soft);font-size:10.5px}.fp-inventory-card strong{display:block;font-family:'IBM Plex Mono';font-size:12.5px;margin-top:6px;color:var(--ink)}.fp-stock-list{grid-column:1/-1;background:#fff;border:1px solid var(--line);border-radius:9px;padding:10px;font-size:11.5px}.fp-stock-list>div{display:grid;grid-template-columns:1fr 1fr;padding:8px;border-bottom:1px solid var(--paper-deep)}.fp-stock-list>div:last-child{border:0}.fp-stock-list span{color:var(--slate-soft)}.fp-stock-list i{font-style:normal;color:var(--forest)}

@media(max-width:1100px){
  .fp-container{width:min(94vw,1140px)}
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
  .fp-nav{padding:11px 4vw}.fp-nav-links{display:none}.fp-nav-actions{min-width:auto}.fp-login-link{display:none}.fp-brand{min-width:auto}.fp-brand strong{font-size:19px}
  .fp-hero{padding-top:48px}.fp-hero h1{font-size:clamp(40px,11vw,56px)}
  .fp-feature-switcher{display:block;padding:10px}.fp-switcher-label{padding:7px;display:block}.fp-feature-tabs{overflow-x:auto;padding-bottom:2px}.fp-feature-tabs button{min-width:112px;white-space:nowrap}
  .fp-floating-card{display:none}
  .fp-preview-body{grid-template-columns:74px 1fr}.fp-preview-sidebar span{font-size:10px;padding:8px 5px}.fp-preview-main{padding:14px}.fp-stat-row,.fp-inventory-demo{grid-template-columns:1fr}.fp-stat-row>div:nth-child(3),.fp-inventory-card:nth-child(3){display:none}
  .fp-demo-board-grid{grid-template-columns:1fr}.fp-demo-menu{display:none}.fp-demo-lower{grid-template-columns:1fr}.fp-demo-ai{display:none}
  .fp-demo-header,.fp-split-heading,.fp-final-card,.fp-footer-inner{display:block}.fp-demo-header>p{margin-top:15px}.fp-final-actions{margin-top:25px}.fp-footer-inner>div:last-child{margin-top:25px}
  .fp-login-checks{grid-template-columns:1fr}
}
@media(max-width:520px){
  .fp-hero-text{font-size:15px}.fp-trust{display:grid;gap:9px}
  .fp-preview-shell{padding:12px;border-radius:16px}.fp-preview-body{min-height:315px}.fp-preview-sidebar{display:none}.fp-preview-main{padding:14px}
  .fp-detail-preview .fp-preview-sidebar{display:none}.fp-detail-preview .fp-preview-body{min-height:290px}
  .fp-qr-demo{grid-template-columns:1fr}.fp-order-flow{display:none}
  .fp-phone{max-width:220px;margin:auto}
  .fp-section{padding:68px 0}
  .fp-demo-cards{grid-template-columns:1fr}.fp-demo-cards>div:nth-child(3){display:none}
  .fp-login-card{padding:22px}.fp-final-card{padding:30px}
  .fp-demo-cta{flex-wrap:wrap}.fp-demo-cta>div:last-child{display:flex;flex-direction:column;align-items:stretch;gap:10px;width:100%}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}.fp-preview-shell{animation:none}.fp-bars i,.fp-big-bars i{animation:none}
}
`;