import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

const CONFIG = {
  brand: "Expense AI",
  tagline: "The operating system for your business",
  demo: { enabled: true, email: "demo@financepro.com", password: "password123" },
};

const LAST_EMAIL_KEY = "financepro_last_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PRODUCTS = [
  { id: "rice", name: "Rice · 5 kg", price: 365, stock: 12, low: 4 },
  { id: "dal", name: "Toor dal · 1 kg", price: 168, stock: 9, low: 4 },
  { id: "oil", name: "Sunflower oil · 1 L", price: 142, stock: 5, low: 3 },
  { id: "milk", name: "Milk · 500 ml", price: 27, stock: 30, low: 10 },
  { id: "biscuit", name: "Biscuits", price: 10, stock: 18, low: 8 },
];

const FEATURES = [
  {
    id: "billing",
    label: "Smart billing",
    icon: "▤",
    title: "A faster checkout. A cleaner business.",
    desc: "Create bills, collect payments and automatically keep your sales and stock connected.",
    bullets: ["GST-ready invoices", "Cash, UPI and card payments", "Sales history"],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "▦",
    title: "Know your stock before it runs out.",
    desc: "Track products, quantities, units and low-stock items from one live inventory.",
    bullets: ["Barcode-friendly workflow", "Multiple units", "Low-stock alerts"],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: "↗",
    title: "Keep purchases and suppliers in sync.",
    desc: "Record supplier purchases and understand how much money goes into your stock.",
    bullets: ["Purchase records", "Supplier management", "Stock updates"],
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: "₹",
    title: "Every expense has a place.",
    desc: "Capture business spending, organize categories and review the numbers without spreadsheets.",
    bullets: ["Expense tracking", "Category insights", "Reports"],
  },
  {
    id: "ai",
    label: "AI Business",
    icon: "✦",
    title: "Ask your business. Get useful answers.",
    desc: "Explore sales, expenses and stock with plain-language questions based on your business data.",
    bullets: ["Business insights", "Expense analysis", "Reorder suggestions"],
  },
];

const BUSINESS_TYPES = [
  "Grocery & Kirana",
  "Medical & Pharmacy",
  "Electronics",
  "Clothing & Fashion",
  "Stationery",
  "Hardware",
  "Bakery & Food",
  "Mobile Shop",
  "Wholesale",
  "Other Retail",
];

const JOURNEY = [
  ["Create your workspace", "Add your business name and choose your business type."],
  ["Add products", "Enter products, prices, units and opening stock."],
  ["Start billing", "Scan or search products and complete your first sale."],
  ["Manage everything", "Track stock, purchases, customers and expenses."],
  ["Use AI insights", "Ask questions and make decisions with your business data."],
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

const inr = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Brand({ footer = false }) {
  return (
    <Link to="/" className={`ea-brand ${footer ? "ea-brand-footer" : ""}`}>
      <span className="ea-brand-mark">E</span>
      <span className="ea-brand-copy">
        <strong>{CONFIG.brand}</strong>
        <small>{CONFIG.tagline}</small>
      </span>
    </Link>
  );
}

function LiveDemo() {
  const [cart, setCart] = useState({});
  const [question, setQuestion] = useState("");
  const [completedSales, setCompletedSales] = useState(0);

  const lines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({
    ...p,
    qty: cart[p.id],
    amount: cart[p.id] * p.price,
  }));
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const soldTotal = completedSales;

  const remaining = (product) => product.stock - (cart[product.id] || 0);
  const lowItems = PRODUCTS.filter((p) => remaining(p) <= p.low);

  const add = (product) => {
    if (remaining(product) <= 0) return;
    setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
  };

  const remove = (product) => {
    setCart((current) => {
      const next = { ...current };
      if (next[product.id] > 1) next[product.id] -= 1;
      else delete next[product.id];
      return next;
    });
  };

  const complete = () => {
    if (!total) return;
    setCompletedSales((current) => current + total);
    setCart({});
  };

  const answers = {
    stock: lowItems.length
      ? `Low stock: ${lowItems.map((p) => `${p.name} (${remaining(p)} left)`).join(", ")}.`
      : "All sample products are above their alert levels.",
    bill: total
      ? `This bill contains ${itemCount} items and totals ${inr(total)}.`
      : "Your bill is empty. Add products from the sample shelf.",
    sales: soldTotal
      ? `Completed demo sales: ${inr(soldTotal)}.`
      : "Complete a sample sale to see the sales total.",
  };

  return (
    <div className="ea-demo-card" id="demo">
      <div className="ea-demo-top">
        <div className="ea-window-dots"><i /><i /><i /></div>
        <span>Live POS preview</span>
        <span className="ea-demo-live"><i /> Interactive demo</span>
      </div>

      <div className="ea-demo-body">
        <div className="ea-products">
          <div className="ea-demo-heading">
            <div><small>DEMO STORE</small><h3>Product shelf</h3></div>
            <span className="ea-demo-count">{PRODUCTS.length} products</span>
          </div>
          <div className="ea-product-list">
            {PRODUCTS.map((product) => {
              const left = remaining(product);
              const isLow = left <= product.low;
              return (
                <button key={product.id} className="ea-product" onClick={() => add(product)} disabled={left <= 0}>
                  <span className="ea-product-icon">{product.id === "rice" ? "🌾" : product.id === "dal" ? "🫘" : product.id === "oil" ? "🫙" : product.id === "milk" ? "🥛" : "🍪"}</span>
                  <span className="ea-product-info"><strong>{product.name}</strong><small className={isLow ? "low" : ""}>{left <= 0 ? "Out of stock" : `${left} in stock`}</small></span>
                  <span className="ea-product-price">{inr(product.price)}</span>
                  <span className="ea-add">+</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ea-receipt-panel">
          <div className="ea-receipt">
            <div className="ea-receipt-header"><strong>DEMO BILL #0042</strong><span>{new Date().toLocaleDateString("en-IN")}</span></div>
            {lines.length ? (
              <div className="ea-receipt-lines">
                {lines.map((line) => (
                  <div className="ea-receipt-line" key={line.id}>
                    <span className="ea-line-name">{line.name}</span>
                    <span className="ea-qty">
                      <button onClick={() => remove(line)} aria-label={`Remove one ${line.name}`}>−</button>
                      {line.qty}
                      <button onClick={() => add(line)} aria-label={`Add one ${line.name}`}>+</button>
                    </span>
                    <strong>{inr(line.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : <div className="ea-empty-receipt">Tap a product to build your bill.</div>}
            <div className="ea-total"><span>Total</span><strong>{inr(total)}</strong></div>
            <div className="ea-receipt-actions">
              <button className="ea-complete" disabled={!total} onClick={complete}>Complete sale <span>↗</span></button>
              <button className="ea-clear" disabled={!total} onClick={() => setCart({})}>Clear</button>
            </div>
          </div>
          <div className="ea-demo-stats">
            <div><small>DEMO SALES</small><strong>{inr(soldTotal)}</strong></div>
            <div><small>ITEMS IN BILL</small><strong>{itemCount}</strong></div>
          </div>
        </div>
      </div>

      <div className="ea-ai-demo">
        <div className="ea-ai-demo-label"><span className="ea-ai-icon">✦</span><div><strong>AI Business</strong><small>Ask the sample shop</small></div></div>
        <div className="ea-question-chips">
          <button onClick={() => setQuestion("stock")}>What's running low?</button>
          <button onClick={() => setQuestion("bill")}>What's on this bill?</button>
          <button onClick={() => setQuestion("sales")}>How much have I sold?</button>
        </div>
        {question && <div className="ea-answer">{answers[question]}</div>}
      </div>
    </div>
  );
}

function FeatureVisual({ feature }) {
  if (feature === "billing") {
    return <div className="ea-visual-billing"><div className="ea-visual-receipt"><div className="ea-vr-head">SALE RECEIPT <span>✓ PAID</span></div><div className="ea-vr-row"><span>Rice 5 kg × 2</span><b>₹730</b></div><div className="ea-vr-row"><span>Milk 500 ml × 4</span><b>₹108</b></div><div className="ea-vr-row"><span>Biscuits × 3</span><b>₹30</b></div><div className="ea-vr-total"><span>Total</span><b>₹868</b></div></div><div className="ea-visual-payment"><span>Payment received</span><div><b>UPI</b><b>Cash</b><b>Card</b></div></div></div>;
  }
  if (feature === "inventory") {
    const rows = [["Rice 5 kg", 76, "12 bags"], ["Sunflower oil", 20, "2 left"], ["Milk 500 ml", 68, "21 packs"], ["Toor dal", 12, "1 left"]];
    return <div className="ea-stock-visual">{rows.map(([name, width, stock]) => <div className="ea-stock-row" key={name}><span>{name}</span><div><i style={{ width: `${width}%` }} /></div><strong className={width < 25 ? "low" : ""}>{stock}</strong></div>)}</div>;
  }
  if (feature === "purchases") {
    return <div className="ea-purchase-visual"><div className="ea-purchase-card"><div><span className="ea-purchase-icon">↗</span><span><small>SUPPLIER PURCHASE</small><strong>Purchase #PUR-1028</strong></span><b className="ea-purchase-status">Received</b></div><hr/><div className="ea-purchase-row"><span>Products added</span><strong>24 items</strong></div><div className="ea-purchase-row"><span>Supplier</span><strong>Metro Wholesale</strong></div><div className="ea-purchase-total"><span>Total purchase</span><strong>₹12,450</strong></div></div></div>;
  }
  if (feature === "expenses") {
    return <div className="ea-expense-visual"><div className="ea-expense-top"><small>MONTHLY EXPENSES</small><strong>₹18,420</strong><span>↓ 8.4% vs last month</span></div>{[["Stock purchases", 84], ["Rent", 48], ["Electricity", 24], ["Transport", 18]].map(([name, width]) => <div className="ea-expense-row" key={name}><span>{name}</span><i style={{ width: `${width}%` }} /></div>)}</div>;
  }
  return <div className="ea-ai-visual"><div className="ea-ai-question">Which products should I reorder?</div><div className="ea-ai-response"><span className="ea-ai-response-icon">✦</span><div><strong>AI Business</strong><p>Oil and Toor dal are below your stock alert. Based on recent sales, consider reordering them this week.</p><div className="ea-ai-tags"><span>Inventory</span><span>Recommendation</span></div></div></div><div className="ea-ai-question">Where did my expenses increase?</div></div>;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [returning, setReturning] = useState(() => ({
    name: (safeGet("userName") || "").split(" ")[0],
    business: safeGet("businessName"),
  }));
  const [formData, setFormData] = useState({ email: safeGet(LAST_EMAIL_KEY), password: "" });
  const [activeFeature, setActiveFeature] = useState("billing");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const loginSectionRef = useRef(null);
  const focusedOnce = useRef(false);

  const feature = FEATURES.find((item) => item.id === activeFeature) || FEATURES[0];
  const isLoading = Boolean(pending);
  const emailInvalid = emailTouched && formData.email.length > 0 && !EMAIL_RE.test(formData.email);

  useEffect(() => {
    const node = loginSectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !focusedOnce.current) {
        focusedOnce.current = true;
        if (formData.email) passwordRef.current?.focus({ preventScroll: true });
        else emailRef.current?.focus({ preventScroll: true });
      }
    }, { threshold: 0.45 });
    observer.observe(node);
    return () => observer.disconnect();
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
    if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (business) navigate("/dashboard", { replace: true });
    else navigate("/create-business", { replace: true });
  };

  const runAuth = async (kind, request, fallbackMessage) => {
    setPending(kind);
    setError("");
    try {
      const res = await request();
      if (res?.data?.success) finishLogin(res.data);
      else setError(res?.data?.message || fallbackMessage);
    } catch (err) {
      console.error(`${kind} login error:`, err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setError("Google sign-in was closed before it finished. Try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Your browser blocked the Google window. Allow popups and try again.");
      } else if (!err.response) {
        setError("Cannot reach the server. Check your internet connection and try again.");
      } else {
        setError(err.response?.data?.message || err.message || fallbackMessage);
      }
    } finally {
      setPending("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isLoading) return;
    if (!EMAIL_RE.test(formData.email)) {
      setEmailTouched(true);
      setError("Enter a valid email address.");
      return;
    }
    runAuth("email", () => API.post("/auth/login", formData), "Sign in failed. Please try again.");
  };

  const handleGoogleLogin = () => runAuth("google", async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return API.post("/auth/google", { idToken });
  }, "Google sign-in failed. Please try again.");

  const handleDemo = () => runAuth("demo", () => API.post("/auth/login", CONFIG.demo), "The demo is unavailable right now. Please try again.");

  const forgetReturning = () => {
    ["userId", "userName", "userEmail", "businessId", "businessName", "businessType", LAST_EMAIL_KEY].forEach(safeRemove);
    setReturning({ name: "", business: "" });
    setFormData({ email: "", password: "" });
    setTimeout(() => emailRef.current?.focus(), 0);
  };

  const navLinks = [["#demo", "Live demo"], ["#features", "Features"], ["#businesses", "Businesses"], ["#workflow", "How it works"], ["#login", "Login"]];

  return (
    <div className="expense-ai-page">
      <style>{CSS}</style>
      <a className="ea-skip" href="#login">Skip to sign in</a>

      <header className="ea-nav">
        <Brand />
        <nav className="ea-nav-links">
          {navLinks.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="ea-nav-actions">
          <Link to="/register" className="ea-nav-cta">Create account <span>↗</span></Link>
          <button className="ea-menu-btn" onClick={() => setMobileMenu((v) => !v)} aria-label="Toggle navigation">{mobileMenu ? "×" : "☰"}</button>
        </div>
        {mobileMenu && <nav className="ea-mobile-menu">{navLinks.map(([href, label]) => <a key={href} href={href} onClick={() => setMobileMenu(false)}>{label}</a>)}</nav>}
      </header>

      <main>
        <section className="ea-hero">
          <div className="ea-hero-grid">
            <div className="ea-hero-copy">
              <div className="ea-eyebrow"><span className="ea-eyebrow-dot" /> BUSINESS MANAGEMENT · BUILT FOR INDIA</div>
              <h1>Run your business.<br /><span>Understand every rupee.</span></h1>
              <p className="ea-hero-description">Billing, inventory, purchases, expenses and AI business insights — connected in one simple workspace.</p>
              <div className="ea-hero-actions">
                <Link to="/register" className="ea-primary-btn">Start your business <span>↗</span></Link>
                <a href="#demo" className="ea-secondary-btn">Explore live demo <span>↓</span></a>
              </div>
              <div className="ea-trust-row"><span>✓ Simple setup</span><span>✓ Business-ready</span><span>✓ One workspace</span></div>
              <div className="ea-business-preview"><small>MADE FOR</small><div>{BUSINESS_TYPES.slice(0, 5).map((type) => <span key={type}>{type}</span>)}</div></div>
            </div>
            <div className="ea-hero-visual"><LiveDemo /><div className="ea-hero-caption"><span className="ea-caption-dot" /> Sample data · Nothing is saved</div></div>
          </div>
        </section>

        <section className="ea-logo-strip" id="businesses"><div className="ea-strip-inner"><span>ONE PLATFORM FOR</span>{["Retail", "Grocery", "Medical", "Electronics", "Fashion", "Wholesale"].map((x) => <b key={x}>{x}</b>)}</div></section>

        <section className="ea-section ea-features" id="features">
          <div className="ea-section-heading"><span className="ea-section-kicker">YOUR BUSINESS, CONNECTED</span><h2>Everything your shop needs.<br /><em>Nothing you don't.</em></h2><p>Choose a feature and see how it fits into your daily workflow.</p></div>
          <div className="ea-feature-tabs">{FEATURES.map((item) => <button key={item.id} className={activeFeature === item.id ? "active" : ""} onClick={() => setActiveFeature(item.id)}><span>{item.icon}</span>{item.label}</button>)}</div>
          <div className="ea-feature-panel" key={feature.id}>
            <div className="ea-feature-copy"><div className="ea-feature-icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.desc}</p><ul>{feature.bullets.map((bullet) => <li key={bullet}><span>✓</span>{bullet}</li>)}</ul><Link to="/register" className="ea-text-link">Get started with {feature.label.toLowerCase()} <span>↗</span></Link></div>
            <div className="ea-feature-visual"><FeatureVisual feature={feature.id} /></div>
          </div>
        </section>

        <section className="ea-business-section">
          <div className="ea-section-heading"><span className="ea-section-kicker">FLEXIBLE BY BUSINESS TYPE</span><h2>Built for the way<br /><em>you actually sell.</em></h2><p>Choose your business type. Configure the products, units and workflow around it.</p></div>
          <div className="ea-business-grid">{BUSINESS_TYPES.map((type, i) => <div className="ea-business-card" key={type}><span className="ea-business-number">{String(i + 1).padStart(2, "0")}</span><strong>{type}</strong><span className="ea-business-arrow">↗</span></div>)}</div>
          <div className="ea-business-note"><span>+</span> More business categories can be configured as your business grows.</div>
        </section>

        <section className="ea-workflow-section" id="workflow">
          <div className="ea-workflow-inner"><div className="ea-section-heading ea-light-heading"><span className="ea-section-kicker">GET STARTED</span><h2>From setup to<br /><em>your first sale.</em></h2><p>Start simple. Add more tools as your business grows.</p><Link to="/register" className="ea-primary-btn ea-yellow-btn">Create your workspace <span>↗</span></Link></div>
            <div className="ea-steps">{JOURNEY.map(([title, description], i) => <div className="ea-step" key={title}><span className="ea-step-number">{String(i + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{description}</p></div><span className="ea-step-check">{i === 0 ? "↗" : "→"}</span></div>)}</div>
          </div>
        </section>

        <section className="ea-ai-section" id="ai">
          <div className="ea-ai-section-inner"><div className="ea-section-heading"><span className="ea-section-kicker">YOUR AI BUSINESS ASSISTANT</span><h2>Don't just see numbers.<br /><em>Understand them.</em></h2><p>Ask business questions in plain language and get insights from the data available in your workspace.</p><div className="ea-ai-prompts"><span>Which products sell slowly?</span><span>What should I reorder?</span><span>Where did expenses increase?</span></div></div><div className="ea-ai-card"><div className="ea-ai-card-top"><span className="ea-ai-brand"><i>✦</i> AI Business</span><span className="ea-ai-online"><i /> Ready</span></div><div className="ea-ai-chat"><div className="ea-chat-user">What should I reorder this week?</div><div className="ea-chat-answer"><span className="ea-chat-symbol">✦</span><div><strong>Business insight</strong><p>Review products below their stock alert first. Compare recent sales with current stock and prioritize items that sell consistently.</p><div className="ea-chat-insight"><span>Inventory insight</span><span>Reorder planning</span></div></div></div><div className="ea-ai-input"><span>Ask about your business…</span><button>↑</button></div></div></div></div>
        </section>

        <section className="ea-login-section" id="login" ref={loginSectionRef}>
          <div className="ea-login-grid"><div className="ea-login-info"><span className="ea-section-kicker">WELCOME BACK</span><h2>{returning.name ? `${greeting()}, ${returning.name}.` : "Your business is ready."}</h2><p>{returning.business ? `${returning.business} is ready when you are.` : "Sign in to open your business workspace and pick up where you left off."}</p><div className="ea-login-benefits"><div><span>01</span>Billing and sales</div><div><span>02</span>Inventory and purchases</div><div><span>03</span>Customers and suppliers</div><div><span>04</span>AI business insights</div></div><div className="ea-login-quote">“One workspace. A clearer picture of your business.”</div></div>
            <div className="ea-login-card"><div className="ea-login-card-header"><div className="ea-login-icon">↗</div><div><h3>{greeting()}</h3><p>{returning.business || "Sign in to your workspace"}</p></div></div>
              {returning.name && <button className="ea-not-you" type="button" onClick={forgetReturning}>Not {returning.name}? Use another account</button>}
              <form onSubmit={handleSubmit} noValidate>
                <label className="ea-field"><span>Email address</span><input ref={emailRef} type="email" name="email" placeholder="you@business.in" value={formData.email} onChange={(e) => { setFormData((prev) => ({ ...prev, email: e.target.value })); if (error) setError(""); }} onBlur={() => setEmailTouched(true)} autoComplete="email" aria-invalid={emailInvalid || !!error} required /></label>
                {emailInvalid && <small className="ea-field-error">Enter a valid email address.</small>}
                <label className="ea-field"><span className="ea-password-label">Password <Link to="/forgot-password">Forgot password?</Link></span><span className="ea-password-wrap"><input ref={passwordRef} type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={formData.password} onChange={(e) => { setFormData((prev) => ({ ...prev, password: e.target.value })); if (error) setError(""); }} onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") || false)} onKeyDown={(e) => setCapsOn(e.getModifierState?.("CapsLock") || false)} autoComplete="current-password" minLength={6} required /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></span></label>
                {capsOn && <small className="ea-field-error">Caps Lock is on.</small>}
                {error && <div className="ea-error" role="alert"><span>!</span>{error}</div>}
                <button className="ea-signin-btn" type="submit" disabled={isLoading}>{pending === "email" ? <><span className="ea-spinner" /> Signing in…</> : <>Sign in <span>↗</span></>}</button>
                <div className="ea-or"><span />or<span /></div>
                <button className="ea-google-btn" type="button" onClick={handleGoogleLogin} disabled={isLoading}><span className="ea-google-mark">G</span>{pending === "google" ? "Opening Google…" : "Continue with Google"}</button>
                {CONFIG.demo.enabled && <button className="ea-demo-login" type="button" onClick={handleDemo} disabled={isLoading}>{pending === "demo" ? "Opening demo…" : "Explore demo account"}</button>}
              </form>
              <div className="ea-login-foot">New to Expense AI? <Link to="/register">Create your business <span>↗</span></Link></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="ea-footer"><div className="ea-footer-inner"><Brand footer /><div className="ea-footer-links">{navLinks.map(([href, label]) => <a key={href} href={href}>{label}</a>)}<Link to="/register">Create account</Link></div><span className="ea-copyright">© {new Date().getFullYear()} Expense AI</span></div></footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
:root{--ea-ink:#101828;--ea-muted:#667085;--ea-blue:#3157d5;--ea-blue-dark:#2443b8;--ea-bg:#f6f8fc;--ea-line:#e5eaf2;--ea-white:#fff;--ea-green:#12b76a;--ea-yellow:#ffd66b}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:90px}
body{margin:0!important;background:#fff;display:block!important;place-items:initial!important;overflow-x:hidden}
#root{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;text-align:left!important;display:block!important}
button,input{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed;opacity:.55}
a,button{-webkit-tap-highlight-color:transparent}
:focus-visible{outline:3px solid #8aa3ff;outline-offset:3px}
.expense-ai-page{font-family:'DM Sans',sans-serif;color:var(--ea-ink);background:#fff;min-height:100vh;overflow:hidden}
.ea-wrap{width:min(1220px,92vw);margin:auto}
.ea-skip{position:absolute;left:-999px;top:8px;z-index:999;background:#fff;padding:10px}
.ea-skip:focus{left:8px}
.ea-nav{height:78px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;gap:25px;border-bottom:1px solid var(--ea-line);background:#fff;position:sticky;top:0;z-index:100}
.ea-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ea-ink)}
.ea-brand-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(135deg,#3157d5,#6c8cff);color:#fff;font:800 23px Manrope;box-shadow:0 8px 20px #3157d533}
.ea-brand-copy{display:flex;flex-direction:column;line-height:1.2}
.ea-brand-copy strong{font:800 18px Manrope;letter-spacing:-.5px}
.ea-brand-copy small{font-size:10px;color:var(--ea-muted);margin-top:3px}
.ea-nav-links{display:flex;align-items:center;gap:28px}
.ea-nav-links a,.ea-footer-links a{color:#536078;text-decoration:none;font-size:13px;font-weight:600;transition:.2s}
.ea-nav-links a:hover,.ea-footer-links a:hover{color:var(--ea-blue)}
.ea-nav-actions{display:flex;align-items:center;gap:12px}
.ea-nav-cta{background:var(--ea-blue);color:#fff;text-decoration:none;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:700;box-shadow:0 5px 12px #3157d522}
.ea-nav-cta span{margin-left:8px}
.ea-menu-btn{display:none;border:1px solid var(--ea-line);background:#fff;border-radius:10px;width:42px;height:42px;font-size:20px}
.ea-mobile-menu{position:absolute;top:78px;left:0;right:0;padding:12px 5vw 18px;background:#fff;border-bottom:1px solid var(--ea-line);display:flex;flex-direction:column;gap:0}
.ea-mobile-menu a{padding:12px 0;color:var(--ea-ink);text-decoration:none;border-bottom:1px solid var(--ea-line)}
.ea-hero{background:linear-gradient(180deg,#f7f9ff 0%,#fff 100%);padding:76px 5vw 80px}
.ea-hero-grid{max-width:1320px;margin:auto;display:grid;grid-template-columns:.88fr 1.12fr;gap:60px;align-items:center}
.ea-hero-copy{max-width:580px}
.ea-eyebrow,.ea-section-kicker{font-size:11px;letter-spacing:1.7px;font-weight:800;color:var(--ea-blue)}
.ea-eyebrow{display:flex;align-items:center;gap:9px;margin-bottom:22px}
.ea-eyebrow-dot{width:8px;height:8px;border-radius:50%;background:var(--ea-green);box-shadow:0 0 0 5px #12b76a15}
.ea-hero h1{font:800 clamp(42px,5.5vw,74px)/1.08 Manrope;letter-spacing:-3.5px;margin:0 0 24px}
.ea-hero h1 span{color:var(--ea-blue)}
.ea-hero-description{font-size:17px;line-height:1.75;color:#58657c;max-width:520px;margin:0}
.ea-hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.ea-primary-btn,.ea-secondary-btn{display:inline-flex;align-items:center;justify-content:center;gap:16px;padding:15px 20px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:700;transition:.2s}
.ea-primary-btn{background:var(--ea-blue);color:#fff;box-shadow:0 8px 20px #3157d533}
.ea-primary-btn:hover{background:var(--ea-blue-dark);transform:translateY(-2px)}
.ea-secondary-btn{border:1px solid #dce3ef;background:#fff;color:var(--ea-ink)}
.ea-secondary-btn:hover{border-color:var(--ea-blue);color:var(--ea-blue)}
.ea-trust-row{display:flex;flex-wrap:wrap;gap:17px;margin-top:25px;color:#667085;font-size:12px;font-weight:600}
.ea-trust-row span:before{content:"✓";color:var(--ea-green);margin-right:7px;font-weight:900}
.ea-business-preview{margin-top:38px;padding-top:22px;border-top:1px solid var(--ea-line)}
.ea-business-preview>small{font-size:10px;letter-spacing:1.4px;color:#98a2b3;font-weight:800}
.ea-business-preview>div{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.ea-business-preview span{background:#fff;border:1px solid var(--ea-line);border-radius:7px;padding:7px 9px;font-size:11px;font-weight:600;color:#526078}
.ea-hero-visual{min-width:0}
.ea-hero-caption{display:flex;align-items:center;gap:8px;margin:14px 5px;color:#8994a8;font-size:11px}
.ea-caption-dot{width:6px;height:6px;border-radius:50%;background:#98a2b3}
.ea-demo-card{background:#fff;border:1px solid #e4e9f2;border-radius:19px;overflow:hidden;box-shadow:0 24px 60px #1e3a8a12}
.ea-demo-top{height:49px;background:#f9fafc;border-bottom:1px solid var(--ea-line);display:flex;align-items:center;gap:12px;padding:0 16px;font-size:12px;font-weight:700;color:#526078}
.ea-window-dots{display:flex;gap:5px}.ea-window-dots i{width:7px;height:7px;border-radius:50%;background:#d0d5dd}.ea-window-dots i:nth-child(1){background:#ff6a63}.ea-window-dots i:nth-child(2){background:#ffc44d}.ea-window-dots i:nth-child(3){background:#45c77a}
.ea-demo-live{margin-left:auto;color:#12a86a;font-size:10px;display:flex;align-items:center;gap:6px}.ea-demo-live i{width:6px;height:6px;border-radius:50%;background:#12b76a}
.ea-demo-body{display:grid;grid-template-columns:1fr 1fr}
.ea-products{padding:18px;border-right:1px solid var(--ea-line)}
.ea-demo-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.ea-demo-heading small{font-size:9px;letter-spacing:1.4px;color:#98a2b3;font-weight:800}
.ea-demo-heading h3{font:700 16px Manrope;margin:4px 0 0}
.ea-demo-count{font-size:10px;color:#98a2b3;background:#f2f4f7;border-radius:6px;padding:6px}
.ea-product-list{display:flex;flex-direction:column;gap:8px}
.ea-product{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid #e9edf4;background:#fff;border-radius:10px;padding:10px;transition:.15s}
.ea-product:hover:not(:disabled){border-color:#b6c5ff;background:#f8faff;transform:translateY(-1px)}
.ea-product-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:9px;background:#f2f5ff;font-size:17px}
.ea-product-info{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.ea-product-info strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ea-product-info small{font-size:9px;color:#12a86a}.ea-product-info small.low{color:#e04444}
.ea-product-price{font-size:11px;font-weight:800}
.ea-add{width:22px;height:22px;display:grid;place-items:center;background:#edf2ff;color:var(--ea-blue);border-radius:6px;font-weight:800}
.ea-receipt-panel{padding:18px;background:#fbfcfe}
.ea-receipt{background:#fff;border:1px solid #e9edf4;border-radius:12px;padding:14px}
.ea-receipt-header{display:flex;justify-content:space-between;font-size:10px;color:#667085;border-bottom:1px dashed #e5eaf2;padding-bottom:10px}
.ea-receipt-header strong{color:#344054}
.ea-empty-receipt{padding:28px 0;text-align:center;font-size:11px;color:#98a2b3}
.ea-receipt-lines{padding:8px 0}
.ea-receipt-line{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:7px 0;font-size:10px}
.ea-line-name{min-width:0}.ea-qty{display:flex;align-items:center;gap:5px;font-weight:700}
.ea-qty button{border:1px solid #dce3ef;background:#f8faff;border-radius:4px;width:17px;height:17px;padding:0;color:var(--ea-blue);font-weight:800}
.ea-receipt-line strong{font-size:10px;text-align:right}
.ea-total{border-top:1px solid #e5eaf2;padding-top:11px;display:flex;justify-content:space-between;align-items:center;font-size:11px}
.ea-total strong{font:800 20px Manrope;color:var(--ea-ink)}
.ea-receipt-actions{display:flex;gap:7px;margin-top:12px}
.ea-complete{flex:1;background:var(--ea-blue);color:#fff;border:0;border-radius:8px;padding:10px;font-size:10px;font-weight:700}
.ea-complete span{margin-left:8px}.ea-clear{border:1px solid var(--ea-line);background:#fff;border-radius:8px;padding:9px 11px;font-size:10px;font-weight:700;color:#667085}
.ea-demo-stats{display:flex;gap:10px;margin-top:10px}
.ea-demo-stats>div{flex:1;border:1px solid var(--ea-line);border-radius:8px;padding:9px;background:#fff}
.ea-demo-stats small{display:block;font-size:8px;color:#98a2b3;letter-spacing:1px;font-weight:800}
.ea-demo-stats strong{display:block;font:700 14px Manrope;margin-top:4px}
.ea-ai-demo{border-top:1px solid var(--ea-line);padding:13px 16px;background:#fff}
.ea-ai-demo-label{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.ea-ai-icon{width:25px;height:25px;display:grid;place-items:center;background:#edf2ff;color:var(--ea-blue);border-radius:7px}
.ea-ai-demo-label div{display:flex;flex-direction:column}.ea-ai-demo-label strong{font-size:11px}.ea-ai-demo-label small{font-size:9px;color:#98a2b3}
.ea-question-chips{display:flex;flex-wrap:wrap;gap:6px}
.ea-question-chips button{border:1px solid #dfe5f0;background:#f8faff;color:#526078;border-radius:20px;padding:6px 9px;font-size:9px;font-weight:600}
.ea-question-chips button:hover{border-color:#9db0ff;color:var(--ea-blue)}
.ea-answer{margin-top:9px;background:#f3f6ff;border-left:3px solid var(--ea-blue);padding:9px 11px;border-radius:5px;color:#344054;font-size:10px;line-height:1.5}
.ea-logo-strip{border-top:1px solid var(--ea-line);border-bottom:1px solid var(--ea-line);padding:22px 5vw;background:#fff}
.ea-strip-inner{max-width:1220px;margin:auto;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:25px}
.ea-strip-inner>span{font-size:10px;letter-spacing:1.5px;color:#98a2b3;font-weight:800}
.ea-strip-inner b{font:700 13px Manrope;color:#98a2b3}
.ea-section{padding:100px 5vw}
.ea-section-heading{text-align:center;max-width:680px;margin:0 auto 45px}
.ea-section-heading h2{font:800 clamp(34px,4.5vw,56px)/1.15 Manrope;letter-spacing:-2px;margin:15px 0}
.ea-section-heading h2 em{font-style:normal;color:var(--ea-blue)}
.ea-section-heading p{font-size:15px;color:#667085;line-height:1.7;margin:0}
.ea-feature-tabs{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.ea-feature-tabs button{display:flex;align-items:center;gap:8px;border:1px solid #e3e8f1;background:#fff;border-radius:9px;padding:11px 15px;color:#667085;font-size:12px;font-weight:700;transition:.2s}
.ea-feature-tabs button span{font-size:16px}.ea-feature-tabs button.active{background:#edf2ff;border-color:#b9c8ff;color:var(--ea-blue)}
.ea-feature-panel{max-width:1100px;margin:auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:40px;align-items:center;border:1px solid #e6ebf3;border-radius:20px;padding:38px;background:#fff;box-shadow:0 14px 40px #10182808;animation:ea-fade .25s ease}
@keyframes ea-fade{from{opacity:.5;transform:translateY(5px)}to{opacity:1;transform:none}}
.ea-feature-icon{width:46px;height:46px;display:grid;place-items:center;background:#edf2ff;color:var(--ea-blue);border-radius:13px;font-size:22px;font-weight:800}
.ea-feature-copy h3{font:800 30px/1.2 Manrope;letter-spacing:-1px;margin:18px 0 12px}
.ea-feature-copy p{font-size:14px;color:#667085;line-height:1.7}
.ea-feature-copy ul{list-style:none;padding:0;margin:20px 0;display:flex;flex-direction:column;gap:10px}
.ea-feature-copy li{font-size:13px;font-weight:600;color:#344054}.ea-feature-copy li span{color:var(--ea-green);margin-right:9px}
.ea-text-link{color:var(--ea-blue);font-weight:700;text-decoration:none;font-size:13px}.ea-text-link span{margin-left:6px}
.ea-feature-visual{min-height:280px;border-radius:15px;background:linear-gradient(135deg,#f7f9ff,#f0f4ff);padding:28px;display:grid;place-items:center;overflow:hidden}
.ea-visual-billing{width:100%;display:flex;flex-direction:column;align-items:center;gap:14px}
.ea-visual-receipt{width:min(300px,100%);background:#fff;border:1px solid #e5eaf2;border-radius:12px;padding:16px;box-shadow:0 10px 25px #10182810}
.ea-vr-head{display:flex;justify-content:space-between;border-bottom:1px dashed #e5eaf2;padding-bottom:10px;font-size:10px;font-weight:800}.ea-vr-head span{color:var(--ea-green)}
.ea-vr-row{display:flex;justify-content:space-between;padding:8px 0;font-size:11px;color:#667085}
.ea-vr-total{display:flex;justify-content:space-between;border-top:1px solid #e5eaf2;padding-top:11px;font-size:12px;font-weight:800}
.ea-visual-payment{display:flex;align-items:center;gap:10px;font-size:10px;color:#667085}.ea-visual-payment div{display:flex;gap:6px}.ea-visual-payment b{background:#fff;border:1px solid #dfe5f0;border-radius:6px;padding:6px 10px;color:#344054}
.ea-stock-visual,.ea-expense-visual{width:100%;display:flex;flex-direction:column;gap:16px}
.ea-stock-row{display:grid;grid-template-columns:120px 1fr 65px;gap:10px;align-items:center;font-size:11px;font-weight:600}
.ea-stock-row>div{height:10px;background:#fff;border:1px solid #e5eaf2;border-radius:20px;overflow:hidden}.ea-stock-row i{display:block;height:100%;background:linear-gradient(90deg,#3157d5,#7b96ff);border-radius:20px}
.ea-stock-row strong{text-align:right;font-size:10px;color:#12a86a}.ea-stock-row strong.low{color:#e04444}
.ea-purchase-visual{width:100%}.ea-purchase-card{max-width:350px;margin:auto;background:#fff;border:1px solid #e5eaf2;border-radius:13px;padding:18px;box-shadow:0 10px 25px #10182810}
.ea-purchase-card>div:first-child{display:flex;align-items:center;gap:10px}.ea-purchase-icon{width:34px;height:34px;display:grid;place-items:center;background:#edf2ff;border-radius:8px;color:var(--ea-blue);font-size:18px}.ea-purchase-card>div:first-child span:nth-child(2){display:flex;flex-direction:column;gap:3px}.ea-purchase-card small{font-size:8px;color:#98a2b3;letter-spacing:1px}.ea-purchase-card strong{font-size:11px}.ea-purchase-status{margin-left:auto;background:#ecfdf3;color:#12a86a;padding:5px 8px;border-radius:20px;font-size:9px}
.ea-purchase-card hr{border:0;border-top:1px solid #e5eaf2;margin:15px 0}.ea-purchase-row,.ea-purchase-total{display:flex;justify-content:space-between;padding:7px 0;font-size:11px}.ea-purchase-row span{color:#667085}.ea-purchase-total{border-top:1px solid #e5eaf2;margin-top:8px;padding-top:12px;font-weight:700}.ea-expense-top{display:flex;flex-direction:column;gap:5px;margin-bottom:5px}.ea-expense-top small{font-size:9px;letter-spacing:1px;color:#98a2b3}.ea-expense-top strong{font:800 24px Manrope}.ea-expense-top span{font-size:10px;color:#12a86a}.ea-expense-row{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:600}.ea-expense-row i{height:12px;border-radius:5px;background:linear-gradient(90deg,#3157d5,#8ca3ff)}
.ea-ai-visual{width:100%;display:flex;flex-direction:column;gap:13px}.ea-ai-question{align-self:flex-end;background:#3157d5;color:#fff;border-radius:12px 12px 3px 12px;padding:10px 13px;font-size:11px}.ea-ai-response{display:flex;gap:10px;max-width:95%;background:#fff;border:1px solid #e5eaf2;border-radius:12px 12px 12px 3px;padding:13px;box-shadow:0 8px 20px #10182808}.ea-ai-response-icon{width:26px;height:26px;flex-shrink:0;background:#edf2ff;color:var(--ea-blue);border-radius:7px;display:grid;place-items:center}.ea-ai-response strong{font-size:11px}.ea-ai-response p{font-size:10px;color:#667085;line-height:1.6;margin:5px 0}.ea-ai-tags{display:flex;gap:5px}.ea-ai-tags span{font-size:8px;color:var(--ea-blue);background:#edf2ff;padding:4px 6px;border-radius:5px}
.ea-business-section{padding:100px 5vw;background:#f8faff}.ea-business-grid{max-width:1050px;margin:auto;display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.ea-business-card{background:#fff;border:1px solid #e5eaf2;border-radius:12px;padding:17px;min-height:100px;position:relative;display:flex;flex-direction:column;justify-content:space-between;transition:.2s}.ea-business-card:hover{border-color:#b6c5ff;transform:translateY(-3px);box-shadow:0 10px 25px #3157d510}.ea-business-number{font-size:9px;color:#98a2b3;font-weight:800;letter-spacing:1px}.ea-business-card strong{font-size:12px;line-height:1.4}.ea-business-arrow{position:absolute;right:13px;bottom:13px;color:#b0b9ca}.ea-business-note{max-width:1050px;margin:22px auto 0;text-align:center;color:#667085;font-size:12px}.ea-business-note span{color:var(--ea-blue);font-weight:800;margin-right:6px}
.ea-workflow-section{background:#111b35;color:#fff;padding:95px 5vw}.ea-workflow-inner{max-width:1220px;margin:auto;display:grid;grid-template-columns:.8fr 1.2fr;gap:75px;align-items:center}.ea-light-heading{text-align:left;margin:0}.ea-light-heading h2{color:#fff}.ea-light-heading h2 em{color:#86a0ff}.ea-light-heading p{color:#aab4cb;margin-bottom:27px}.ea-yellow-btn{background:var(--ea-yellow);color:#111b35;box-shadow:none}.ea-yellow-btn:hover{background:#ffca45}
.ea-steps{border-top:1px solid #35415d}.ea-step{display:grid;grid-template-columns:48px 1fr 35px;gap:15px;align-items:center;padding:21px 0;border-bottom:1px solid #35415d}.ea-step-number{font:700 12px Manrope;color:#86a0ff}.ea-step strong{font-size:14px}.ea-step p{font-size:11px;color:#aab4cb;margin:5px 0 0;line-height:1.5}.ea-step-check{color:#86a0ff;font-size:17px;text-align:right}
.ea-ai-section{padding:100px 5vw}.ea-ai-section-inner{max-width:1150px;margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}.ea-ai-section .ea-section-heading{text-align:left;margin:0}.ea-ai-prompts{display:flex;flex-wrap:wrap;gap:7px;margin-top:25px}.ea-ai-prompts span{background:#f3f6ff;border:1px solid #e0e7ff;color:#526078;padding:8px 10px;border-radius:20px;font-size:10px;font-weight:600}
.ea-ai-card{background:#f8faff;border:1px solid #e5eaf2;border-radius:18px;padding:20px;box-shadow:0 15px 40px #10182808}.ea-ai-card-top{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:1px solid #e5eaf2}.ea-ai-brand{font-size:13px;font-weight:800}.ea-ai-brand i{font-style:normal;color:var(--ea-blue);margin-right:6px}.ea-ai-online{font-size:10px;color:#12a86a;display:flex;align-items:center;gap:5px}.ea-ai-online i{width:6px;height:6px;border-radius:50%;background:#12b76a}
.ea-ai-chat{display:flex;flex-direction:column;gap:13px;padding:18px 0}.ea-chat-user{align-self:flex-end;background:#3157d5;color:#fff;padding:11px 13px;border-radius:12px 12px 3px 12px;font-size:12px}.ea-chat-answer{display:flex;gap:10px;background:#fff;border:1px solid #e5eaf2;border-radius:12px 12px 12px 3px;padding:14px}.ea-chat-symbol{width:26px;height:26px;background:#edf2ff;color:var(--ea-blue);border-radius:7px;display:grid;place-items:center;flex-shrink:0}.ea-chat-answer strong{font-size:11px}.ea-chat-answer p{font-size:11px;line-height:1.65;color:#667085;margin:6px 0 10px}.ea-chat-insight{display:flex;gap:6px}.ea-chat-insight span{background:#edf2ff;color:var(--ea-blue);padding:5px 7px;border-radius:5px;font-size:8px;font-weight:700}.ea-ai-input{display:flex;justify-content:space-between;align-items:center;border:1px solid #e5eaf2;background:#fff;border-radius:10px;padding:10px 12px;color:#98a2b3;font-size:11px}.ea-ai-input button{border:0;background:var(--ea-blue);color:#fff;width:25px;height:25px;border-radius:7px;font-weight:800}
.ea-login-section{padding:100px 5vw;background:#f7f9fc;border-top:1px solid var(--ea-line)}.ea-login-grid{max-width:1120px;margin:auto;display:grid;grid-template-columns:1fr .85fr;gap:75px;align-items:center}
.ea-login-info h2{font:800 clamp(36px,4vw,52px)/1.15 Manrope;letter-spacing:-2px;margin:16px 0}.ea-login-info>p{font-size:15px;color:#667085;line-height:1.7;max-width:450px}.ea-login-benefits{display:flex;flex-direction:column;gap:14px;margin-top:35px}.ea-login-benefits div{display:flex;align-items:center;gap:15px;font-size:13px;font-weight:700}.ea-login-benefits span{font-size:10px;color:var(--ea-blue);background:#edf2ff;padding:7px 9px;border-radius:7px}.ea-login-quote{margin-top:35px;border-left:3px solid var(--ea-blue);padding:12px 15px;color:#667085;font-size:12px;font-style:italic}
.ea-login-card{background:#fff;border:1px solid #e5eaf2;border-radius:18px;padding:30px;box-shadow:0 20px 50px #1018280a}.ea-login-card-header{display:flex;align-items:center;gap:12px;margin-bottom:22px}.ea-login-icon{width:42px;height:42px;background:#edf2ff;color:var(--ea-blue);border-radius:12px;display:grid;place-items:center;font-size:20px;font-weight:800}.ea-login-card-header h3{font:800 21px Manrope;margin:0}.ea-login-card-header p{font-size:11px;color:#667085;margin:4px 0 0}.ea-not-you{border:0;background:#f8faff;color:var(--ea-blue);font-size:11px;font-weight:700;padding:9px 11px;border-radius:7px;margin-bottom:14px}
.ea-field{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}.ea-field>span{font-size:11px;font-weight:700;color:#344054}.ea-field input{width:100%;border:1px solid #dce3ef;border-radius:9px;padding:13px 14px;background:#fff;color:var(--ea-ink);font-size:13px;outline:none;transition:.2s}.ea-field input:focus{border-color:#8aa3ff;box-shadow:0 0 0 3px #3157d515}.ea-field input::placeholder{color:#b0b8c5}.ea-password-label{display:flex;justify-content:space-between;align-items:center}.ea-password-label a{color:var(--ea-blue);text-decoration:none;font-size:10px}.ea-password-wrap{display:flex;position:relative}.ea-password-wrap input{padding-right:60px}.ea-password-wrap button{position:absolute;right:10px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--ea-blue);font-size:10px;font-weight:700}.ea-field-error{display:block;color:#d92d20;font-size:10px;margin:-8px 0 12px}.ea-error{display:flex;gap:9px;align-items:center;background:#fff4f2;border:1px solid #fecdca;color:#b42318;border-radius:8px;padding:10px 12px;font-size:11px;margin:0 0 14px}.ea-error span{width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:#fecdca;font-weight:800}
.ea-signin-btn{width:100%;border:0;border-radius:9px;background:var(--ea-blue);color:#fff;padding:14px;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 7px 16px #3157d522}.ea-signin-btn:hover:not(:disabled){background:var(--ea-blue-dark)}.ea-signin-btn span{margin-left:5px}.ea-spinner{width:15px;height:15px;border:2px solid #ffffff55;border-top-color:#fff;border-radius:50%;animation:ea-spin .7s linear infinite}@keyframes ea-spin{to{transform:rotate(360deg)}}
.ea-or{display:flex;align-items:center;gap:12px;margin:18px 0;color:#98a2b3;font-size:10px}.ea-or span{flex:1;height:1px;background:#e5eaf2}.ea-google-btn{width:100%;border:1px solid #dce3ef;background:#fff;border-radius:9px;padding:12px;font-size:12px;font-weight:700;color:#344054;display:flex;justify-content:center;align-items:center;gap:10px}.ea-google-btn:hover{background:#f8faff}.ea-google-mark{font:800 17px Arial;color:#4285f4}.ea-demo-login{width:100%;border:0;background:none;color:var(--ea-blue);font-size:11px;font-weight:700;padding:13px 5px 3px}.ea-login-foot{display:flex;justify-content:center;gap:5px;margin-top:22px;color:#667085;font-size:11px}.ea-login-foot a{color:var(--ea-blue);text-decoration:none;font-weight:700}.ea-login-foot a span{margin-left:4px}
.ea-footer{background:#111b35;color:#fff;padding:30px 5vw}.ea-footer-inner{max-width:1220px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:25px;flex-wrap:wrap}.ea-brand-footer{color:#fff}.ea-brand-footer .ea-brand-mark{background:#fff;color:var(--ea-blue);box-shadow:none}.ea-brand-footer .ea-brand-copy small{color:#aab4cb}.ea-footer-links{display:flex;flex-wrap:wrap;gap:18px}.ea-footer-links a{color:#aab4cb;font-size:11px}.ea-copyright{font-size:10px;color:#77839b}
@media(max-width:1050px){.ea-hero-grid{grid-template-columns:1fr;gap:45px}.ea-hero-copy{max-width:780px}.ea-hero-visual{max-width:850px}.ea-workflow-inner,.ea-ai-section-inner,.ea-login-grid{grid-template-columns:1fr;gap:45px}.ea-business-grid{grid-template-columns:repeat(3,1fr)}.ea-login-info{max-width:700px}}
@media(max-width:800px){.ea-nav-links{display:none}.ea-menu-btn{display:block}.ea-hero{padding:55px 5vw}.ea-hero h1{letter-spacing:-2px}.ea-section,.ea-business-section,.ea-workflow-section,.ea-ai-section,.ea-login-section{padding:70px 5vw}.ea-feature-panel{grid-template-columns:1fr;padding:25px;gap:25px}.ea-business-grid{grid-template-columns:repeat(2,1fr)}.ea-strip-inner{gap:15px}.ea-strip-inner b{font-size:11px}}
@media(max-width:560px){.ea-nav{height:68px}.ea-brand-copy small{display:none}.ea-nav-cta{padding:10px 12px;font-size:11px}.ea-mobile-menu{top:68px}.ea-hero{padding:45px 5vw}.ea-hero h1{font-size:43px}.ea-hero-description{font-size:15px}.ea-hero-actions{flex-direction:column;align-items:stretch}.ea-primary-btn,.ea-secondary-btn{width:100%}.ea-demo-body{grid-template-columns:1fr}.ea-products{border-right:0;border-bottom:1px solid var(--ea-line)}.ea-product-list{display:grid;grid-template-columns:1fr 1fr}.ea-product{padding:8px;gap:7px}.ea-product-icon{width:28px;height:28px;font-size:14px}.ea-product-price{font-size:10px}.ea-receipt-panel{padding:12px}.ea-section-heading h2{font-size:34px;letter-spacing:-1.5px}.ea-feature-tabs{justify-content:flex-start;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.ea-feature-tabs button{white-space:nowrap}.ea-feature-panel{padding:20px}.ea-feature-copy h3{font-size:26px}.ea-feature-visual{padding:18px;min-height:230px}.ea-stock-row{grid-template-columns:85px 1fr 55px;gap:6px}.ea-business-grid{grid-template-columns:1fr 1fr}.ea-business-card{min-height:85px;padding:13px}.ea-workflow-inner{gap:35px}.ea-step{grid-template-columns:35px 1fr 20px;gap:10px}.ea-login-card{padding:22px}.ea-login-foot{flex-wrap:wrap}.ea-footer-inner{align-items:flex-start;flex-direction:column}.ea-footer-links{gap:12px}.ea-ai-card{padding:14px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}}
`;
