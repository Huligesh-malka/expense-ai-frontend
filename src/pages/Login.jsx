import { useState, useContext, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

/* ───────────────────────── CONFIG ───────────────────────── */

const CONFIG = {
  brand: "FinancePro",
  tagline: "Business management for Indian shops",
  signupNote: "Set up in about 2 minutes",
  trust: ["Secure sign-in", "Your data stays yours", "Built for Indian businesses"],
  demo: { enabled: true, email: "demo@financepro.com", password: "password123" },
};

const LAST_EMAIL_KEY = "financepro_last_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Same 16 categories as the add-product screen */
const CATEGORIES = [
  ["📱", "Electronics"],
  ["👕", "Clothing"],
  ["🍎", "Food"],
  ["💊", "Medicine"],
  ["🛒", "Grocery"],
  ["🥤", "Drinks"],
  ["🍞", "Bakery"],
  ["🥛", "Dairy"],
  ["🍪", "Snacks"],
  ["🧹", "Household"],
  ["✏️", "Stationery"],
  ["🔧", "Hardware"],
  ["💡", "Electrical"],
  ["🧴", "Personal Care"],
  ["🐾", "Pet Supplies"],
  ["📦", "Other"],
];

/* Business types supported. status: "full" | "extra" | "soon" (use "soon" for modules not built yet) */
const BUSINESSES = [
  ["🛒", "Grocery Stores", "full", ""],
  ["🏬", "Supermarkets", "full", ""],
  ["💊", "Medical Stores / Pharmacies", "full", ""],
  ["📱", "Electronics Shops", "full", ""],
  ["📲", "Mobile Shops", "full", ""],
  ["🎧", "Mobile Accessories", "full", ""],
  ["🔧", "Hardware Stores", "full", ""],
  ["👕", "Clothing Stores", "full", ""],
  ["👟", "Footwear Stores", "full", ""],
  ["💄", "Cosmetics Shops", "full", ""],
  ["🧴", "Beauty Product Stores", "full", ""],
  ["✏️", "Stationery Shops", "full", ""],
  ["📚", "Book Shops", "full", ""],
  ["🧸", "Toys Shops", "full", ""],
  ["🔌", "Home Appliances", "full", ""],
  ["🛋️", "Furniture Shops", "full", ""],
  ["🍽️", "Restaurants", "extra", "Restaurant-specific features"],
  ["☕", "Cafes", "extra", "Restaurant-specific features"],
  ["🍞", "Bakeries", "full", ""],
  ["🍬", "Sweet Shops", "full", ""],
  ["🍎", "Fruit Shops", "full", ""],
  ["🥬", "Vegetable Shops", "full", ""],
  ["🥩", "Meat Shops", "extra", "Weight-based billing"],
  ["🥛", "Dairy Shops", "full", ""],
  ["🐾", "Pet Shops", "full", ""],
  ["🚗", "Automobile Spare Parts", "full", ""],
  ["🎨", "Paint Shops", "full", ""],
  ["💡", "Electrical Shops", "full", ""],
  ["🚿", "Plumbing Stores", "full", ""],
  ["🎁", "Gift Shops", "full", ""],
  ["📦", "Wholesale Businesses", "full", ""],
  ["🚚", "Distributor Businesses", "full", ""],
  ["🏭", "Small Manufacturing Businesses", "extra", "With production module"],
  ["🌐", "Online Sellers", "extra", "With e-commerce integration"],
  ["🏪", "General Retail Stores", "full", ""],
];

/* Sample data for the live counter demo (illustrative only) */
const PRODUCTS = [
  { id: "earphones", name: "Earphones", cat: "Electronics", price: 299, stock: 7, low: 3 },
  { id: "usb", name: "USB cable", cat: "Electronics", price: 149, stock: 14, low: 5 },
  { id: "tshirt", name: "Cotton T-shirt", cat: "Clothing", price: 349, stock: 10, low: 3 },
  { id: "rice", name: "Rice 5 kg", cat: "Food", price: 365, stock: 12, low: 4 },
  { id: "para", name: "Paracetamol strip", cat: "Medicine", price: 30, stock: 8, low: 4 },
  { id: "dal", name: "Toor dal 1 kg", cat: "Grocery", price: 168, stock: 9, low: 4 },
  { id: "oil", name: "Sunflower oil 1 L", cat: "Grocery", price: 142, stock: 5, low: 3 },
  { id: "cola", name: "Cold drink 750 ml", cat: "Drinks", price: 40, stock: 24, low: 8 },
  { id: "bread", name: "Bread loaf", cat: "Bakery", price: 35, stock: 10, low: 5 },
  { id: "milk", name: "Milk 500 ml", cat: "Dairy", price: 27, stock: 30, low: 10 },
  { id: "biscuit", name: "Biscuits", cat: "Snacks", price: 10, stock: 18, low: 8 },
  { id: "floor", name: "Floor cleaner 1 L", cat: "Household", price: 189, stock: 6, low: 3 },
  { id: "notebook", name: "Notebook", cat: "Stationery", price: 60, stock: 15, low: 5 },
  { id: "pen", name: "Ball pen", cat: "Stationery", price: 10, stock: 40, low: 12 },
  { id: "screw", name: "Screwdriver set", cat: "Hardware", price: 220, stock: 5, low: 2 },
  { id: "bulb", name: "LED bulb 9W", cat: "Electrical", price: 99, stock: 6, low: 3 },
  { id: "soap", name: "Soap, pack of 3", cat: "Personal Care", price: 120, stock: 11, low: 4 },
  { id: "dogbis", name: "Dog biscuits", cat: "Pet Supplies", price: 150, stock: 4, low: 2 },
  { id: "wrap", name: "Gift wrap sheet", cat: "Other", price: 25, stock: 20, low: 6 },
];

const FEATURES = [
  {
    id: "billing",
    label: "Billing",
    headline: "Make a bill in the time it takes to say the total.",
    description:
      "Add products from any category, take payment and keep every sale linked to your stock and your customers.",
    points: ["Create bills", "Record payments", "Sales history"],
  },
  {
    id: "inventory",
    label: "Inventory",
    headline: "See what is running out before a customer asks.",
    description:
      "Products across every category, their quantities and low-stock alerts sit together, so you can reorder in time.",
    points: ["Products", "Stock levels", "Low-stock alerts"],
  },
  {
    id: "qr",
    label: "QR ordering",
    headline: "Customers scan, pick and send the order.",
    description:
      "Put a QR at the counter. Customers browse your products on their phone and the order lands in your workspace.",
    points: ["Scan QR", "Choose products", "Send order"],
  },
  {
    id: "expenses",
    label: "Expenses",
    headline: "Know where the money goes each month.",
    description:
      "Record purchases and expenses in one place and review them as clear reports.",
    points: ["Purchases", "Expenses", "Reports"],
  },
  {
    id: "ai",
    label: "AI Business",
    headline: "Ask a question. Get an answer from your own data.",
    description:
      "AI Business reads the sales, expenses and stock your account can access and explains them in plain language.",
    points: ["Sales insights", "Expense analysis", "Business questions"],
  },
];

const JOURNEY = [
  ["Create your business", "Add your shop name and type.", "2 min"],
  ["Add products", "Pick a category, then add prices, units and stock.", "Your pace"],
  ["Start selling", "Make bills and record payments.", "Day 1"],
  ["Stay in control", "Check stock, purchases, expenses and customers.", "Daily"],
  ["Ask AI", "Question the data already in your workspace.", "Anytime"],
];

/* ───────────────────────── HELPERS ───────────────────────── */

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

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

const catIcon = (name) => (CATEGORIES.find(([, n]) => n === name) || ["📦"])[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function useIsMobile(breakpoint = 860) {
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

/* ───────────────────────── SMALL COMPONENTS ───────────────────────── */

function Brand({ light }) {
  return (
    <Link to="/" className={"fx-brand" + (light ? " light" : "")}>
      <span className="fx-brand-mark">F</span>
      <span className="fx-brand-text">
        <strong>{CONFIG.brand}</strong>
        <small>{CONFIG.tagline}</small>
      </span>
    </Link>
  );
}

/* The one memorable thing: a counter you can actually use */
function LiveCounter({ category, onCategory }) {
  const [cart, setCart] = useState({});
  const [question, setQuestion] = useState("");
  const [sold, setSold] = useState(0);

  const shown =
    category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === category);

  const lines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({
    ...p,
    qty: cart[p.id],
    amount: cart[p.id] * p.price,
  }));
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const billCats = [...new Set(lines.map((l) => l.cat))];

  const left = (p) => p.stock - (cart[p.id] || 0);
  const lowItems = PRODUCTS.filter((p) => left(p) <= p.low);

  const add = (p) => {
    if (left(p) <= 0) return;
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));
  };
  const remove = (p) => {
    setCart((c) => {
      const next = { ...c };
      if (next[p.id] > 1) next[p.id] -= 1;
      else delete next[p.id];
      return next;
    });
  };
  const clear = () => setCart({});
  const finish = () => {
    if (!total) return;
    setSold((s) => s + total);
    setCart({});
  };

  const answers = {
    low: () =>
      lowItems.length
        ? `Running low: ${lowItems
            .map((p) => `${p.name} (${left(p)} left)`)
            .join(", ")}.`
        : "Nothing is below its alert level right now.",
    bill: () =>
      total
        ? `This bill has ${itemCount} item${itemCount > 1 ? "s" : ""} from ${billCats.length} categor${
            billCats.length > 1 ? "ies" : "y"
          } (${billCats.join(", ")}) and comes to ${inr(total)}.`
        : "The bill is empty. Tap a product to add it.",
    today: () =>
      sold
        ? `You have billed ${inr(sold)} in this demo session.`
        : "No bill has been completed yet. Tap Complete sale on a bill.",
  };

  const questions = [
    ["low", "What is running low?"],
    ["bill", "What is on this bill?"],
    ["today", "How much have I sold?"],
  ];

  return (
    <div className="fx-counter" id="product-demo">
      <div className="fx-counter-bar">
        <span className="fx-dots"><i /><i /><i /></span>
        <span>Counter · sample shop</span>
        <span className="fx-sold">Sold today {inr(sold)}</span>
      </div>

      <div className="fx-catbar" role="group" aria-label="Filter products by category">
        {["All", ...CATEGORIES.map(([, n]) => n)].map((name) => (
          <button
            type="button"
            key={name}
            className={category === name ? "on" : ""}
            aria-pressed={category === name}
            onClick={() => onCategory(name)}
          >
            {name !== "All" && <span aria-hidden="true">{catIcon(name)}</span>}
            {name}
          </button>
        ))}
      </div>

      <div className="fx-counter-grid">
        <div className="fx-shelf">
          <h3>
            Tap to add · {category === "All" ? "all categories" : category}
          </h3>
          <ul>
            {shown.map((p) => {
              const remaining = left(p);
              const isLow = remaining <= p.low;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => add(p)}
                    disabled={remaining <= 0}
                    aria-label={`Add ${p.name}, ${p.cat}, ${inr(p.price)}, ${remaining} left`}
                  >
                    <span className="fx-p-name">
                      <span aria-hidden="true">{catIcon(p.cat)}</span> {p.name}
                    </span>
                    <span className="fx-p-price">{inr(p.price)}</span>
                    <span className={"fx-p-stock" + (isLow ? " low" : "")}>
                      {p.cat} · {remaining <= 0 ? "Out of stock" : `${remaining} left`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="fx-bill-wrap">
          <div className="fx-bill" aria-live="polite">
            <div className="fx-bill-head">
              <strong>Bill #0042</strong>
              <span>{new Date().toLocaleDateString("en-IN")}</span>
            </div>
            {lines.length === 0 ? (
              <p className="fx-bill-empty">Your bill prints here as you add products.</p>
            ) : (
              <ul className="fx-bill-lines">
                {lines.map((l) => (
                  <li key={l.id}>
                    <span className="fx-bill-name">{l.name}</span>
                    <span className="fx-bill-qty">
                      <button type="button" onClick={() => remove(l)} aria-label={`Remove one ${l.name}`}>−</button>
                      {l.qty}
                      <button type="button" onClick={() => add(l)} aria-label={`Add one ${l.name}`}>+</button>
                    </span>
                    <span className="fx-bill-amt">{inr(l.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="fx-bill-total">
              <span>Total</span>
              <strong>{inr(total)}</strong>
            </div>
            <div className="fx-bill-actions">
              <button type="button" className="fx-btn-yellow" onClick={finish} disabled={!total}>
                Complete sale
              </button>
              <button type="button" className="fx-btn-ghost" onClick={clear} disabled={!total}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fx-ask">
        <div className="fx-ask-chips">
          <span>Ask AI Business</span>
          {questions.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={question === key ? "on" : ""}
              onClick={() => setQuestion(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="fx-ask-answer">
          {question ? answers[question]() : "Pick a question. The answer comes from the sample shop above."}
        </p>
      </div>
    </div>
  );
}

/* Mini visuals for the feature explorer */
function FeatureVisual({ id }) {
  if (id === "billing") {
    return (
      <div className="fx-vis fx-vis-bill">
        <div className="fx-mini-receipt">
          <b>Bill #0043</b>
          <div><span>Rice 5 kg × 2</span><span>₹730</span></div>
          <div><span>Paracetamol × 2</span><span>₹60</span></div>
          <div><span>Notebook × 3</span><span>₹180</span></div>
          <div><span>LED bulb 9W × 1</span><span>₹99</span></div>
          <div className="t"><span>Total</span><span>₹1,069</span></div>
        </div>
        <div className="fx-pay">
          <span>Paid by</span>
          <i className="on">UPI</i><i>Cash</i><i>Card</i>
        </div>
      </div>
    );
  }
  if (id === "inventory") {
    const rows = [
      ["Rice 5 kg", 80, "ok", "12 bags"],
      ["Paracetamol", 30, "low", "4 strips"],
      ["LED bulb 9W", 55, "ok", "6 left"],
      ["Notebook", 70, "ok", "15 left"],
      ["Dog biscuits", 14, "low", "2 left"],
    ];
    return (
      <div className="fx-vis fx-vis-stock">
        {rows.map(([name, w, s, n]) => (
          <div className="fx-stock-row" key={name}>
            <span>{name}</span>
            <div className="fx-meter"><i className={s} style={{ width: w + "%" }} /></div>
            <em className={s}>{n}</em>
          </div>
        ))}
      </div>
    );
  }
  if (id === "qr") {
    return (
      <div className="fx-vis fx-vis-qr">
        <div className="fx-qr-code" aria-hidden="true">
          {Array.from({ length: 49 }).map((_, i) => (
            <i key={i} className={[0, 1, 2, 7, 9, 14, 15, 16, 4, 5, 6, 11, 13, 20, 18, 22, 24, 26, 29, 31, 33, 35, 36, 40, 42, 43, 44, 46, 48].includes(i) ? "k" : ""} />
          ))}
        </div>
        <div className="fx-phone">
          <b>Order from our shop</b>
          <div><span>Milk 500 ml</span><i>Add</i></div>
          <div><span>Notebook</span><i>Add</i></div>
          <div><span>LED bulb 9W</span><i>Add</i></div>
          <u>Send order to shop</u>
        </div>
      </div>
    );
  }
  if (id === "expenses") {
    const rows = [
      ["Stock purchases", 88],
      ["Rent", 46],
      ["Electricity", 21],
      ["Transport", 14],
    ];
    return (
      <div className="fx-vis fx-vis-exp">
        <p>Sample month</p>
        {rows.map(([name, w]) => (
          <div className="fx-exp-row" key={name}>
            <span>{name}</span>
            <i style={{ width: w + "%" }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="fx-vis fx-vis-ai">
      <div className="u">Which category sells the most?</div>
      <div className="b">
        <b>AI Business</b>
        I compare sales across your categories using the data your account can access, then explain which ones lead and which are slow.
      </div>
      <div className="u">And what should I reorder?</div>
    </div>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

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
  const [demoCat, setDemoCat] = useState("All");
  const [bizFilter, setBizFilter] = useState("all");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const feature = FEATURES[active];
  const bizFull = BUSINESSES.filter((b) => b[2] === "full").length;
  const bizExtra = BUSINESSES.length - bizFull;
  const bizShown = BUSINESSES.filter(
    (b) => bizFilter === "all" || (bizFilter === "full" ? b[2] === "full" : b[2] !== "full")
  );
  const isLoading = Boolean(pending);
  const emailInvalid =
    emailTouched && formData.email.length > 0 && !EMAIL_RE.test(formData.email);

  /* Focus the right field only when the person reaches the login section */
  const loginSectionRef = useRef(null);
  const focusedOnce = useRef(false);
  useEffect(() => {
    const node = loginSectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !focusedOnce.current) {
          focusedOnce.current = true;
          if (formData.email) passwordRef.current?.focus({ preventScroll: true });
          else emailRef.current?.focus({ preventScroll: true });
        }
      },
      { threshold: 0.6 }
    );
    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Clicking a category chip in the categories section opens it in the demo counter */
  const openCategoryInDemo = (name) => {
    setDemoCat(name);
    document
      .getElementById("product-demo")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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

  const navLinks = useMemo(
    () => [
      ["#product", "Try it"],
      ["#categories", "Categories"],
      ["#businesses", "Businesses"],
      ["#features", "Features"],
      ["#workflow", "Getting started"],
      ["#ai", "AI Business"],
    ],
    []
  );

  const onCaps = (e) => {
    if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
  };

  return (
    <div className="fx-page">
      <style>{CSS}</style>

      <a href="#login" className="fx-skip">Skip to login</a>

      {/* NAV */}
      <header className="fx-nav">
        <Brand />
        {!mobile && (
          <nav className="fx-nav-links" aria-label="Sections">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
        )}
        <div className="fx-nav-actions">
          {!mobile && <a href="#login" className="fx-nav-login">Login</a>}
          <Link to="/register" className="fx-btn fx-btn-blue fx-btn-sm">Create business</Link>
          {mobile && (
            <button
              type="button"
              className="fx-menu-btn"
              onClick={() => setMobileMenu((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? "✕" : "☰"}
            </button>
          )}
        </div>
        {mobile && mobileMenu && (
          <div className="fx-mobile-menu">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenu(false)}>{label}</a>
            ))}
            <a href="#login" onClick={() => setMobileMenu(false)}>Login</a>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section className="fx-hero" id="product">
          <div className="fx-wrap fx-hero-grid">
            <div className="fx-hero-copy">
              <p className="fx-sticker">Billing · Stock · Expenses · AI</p>
              <h1>
                Your shop,
                <br />
                counted while
                <br />
                you sell.
              </h1>
              <p className="fx-lead">
                FinancePro keeps billing, inventory, expenses, customers and QR
                orders in one workspace, for any kind of shop, and lets you ask
                questions about all of it.
              </p>
              <div className="fx-hero-actions">
                <Link to="/register" className="fx-btn fx-btn-blue">Create your business</Link>
                <a href="#login" className="fx-btn fx-btn-white">Login</a>
              </div>
              <ul className="fx-trust">
                {CONFIG.trust.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="fx-hero-demo">
              <LiveCounter category={demoCat} onCategory={setDemoCat} />
              <p className="fx-demo-note">Sample shop and sample prices. Nothing here is saved.</p>
            </div>
          </div>
        </section>

        {/* CATEGORIES: every kind of counter */}
        <section className="fx-cats" id="categories" aria-label="Product categories supported">
          <div className="fx-wrap">
            <p className="fx-cats-title">
              One app for every kind of shop. Bill any of these 16 categories:
            </p>
            <ul className="fx-cats-grid">
              {CATEGORIES.map(([icon, name]) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => openCategoryInDemo(name)}
                    aria-label={`Try ${name} products in the demo counter`}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
            <p className="fx-cats-hint">Tap a category to try it on the counter above.</p>
          </div>
        </section>

        {/* BUSINESSES: every kind of shop we support */}
        <section className="fx-biz" id="businesses">
          <div className="fx-wrap">
            <div className="fx-head">
              <h2>Built for {BUSINESSES.length} kinds of business.</h2>
              <p>
                From a corner grocery to a distributor. {bizFull} work fully out of the box;
                {" "}{bizExtra} need extra features, marked on the card.
              </p>
            </div>

            <div className="fx-biz-filter" role="group" aria-label="Filter business types">
              {[
                ["all", `All ${BUSINESSES.length}`],
                ["full", `Full support (${bizFull})`],
                ["extra", `With extra features (${bizExtra})`],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={bizFilter === key ? "on" : ""}
                  aria-pressed={bizFilter === key}
                  onClick={() => setBizFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <ul className="fx-biz-grid">
              {bizShown.map(([icon, name, status, note]) => (
                <li key={name} className={"fx-biz-card " + status}>
                  <span className="fx-biz-icon" aria-hidden="true">{icon}</span>
                  <span className="fx-biz-name">{name}</span>
                  <span className="fx-biz-tag">
                    {status === "full"
                      ? "Full support"
                      : status === "soon"
                      ? "Coming soon"
                      : note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FEATURES */}
        <section className="fx-section" id="features">
          <div className="fx-wrap">
            <div className="fx-head">
              <h2>One workspace for everything the counter touches.</h2>
              <p>Choose a part of the business to see how it works.</p>
            </div>

            <div className="fx-explorer">
              <div className="fx-tabs" role="tablist" aria-label="Features">
                {FEATURES.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    id={`tab-${f.id}`}
                    aria-selected={i === active}
                    aria-controls="feature-panel"
                    className={i === active ? "on" : ""}
                    onClick={() => setActive(i)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div
                className="fx-panel"
                id="feature-panel"
                role="tabpanel"
                aria-labelledby={`tab-${feature.id}`}
                key={feature.id}
              >
                <div className="fx-panel-copy">
                  <h3>{feature.headline}</h3>
                  <p>{feature.description}</p>
                  <ul>
                    {feature.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <Link to="/register" className="fx-link">Start with {feature.label.toLowerCase()}</Link>
                </div>
                <div className="fx-panel-visual">
                  <FeatureVisual id={feature.id} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW as a printed bill of steps */}
        <section className="fx-section fx-dark" id="workflow">
          <div className="fx-wrap fx-flow-grid">
            <div className="fx-head">
              <h2>From empty shop to daily control.</h2>
              <p>Five steps, in the order a shop owner actually does them.</p>
              <Link to="/register" className="fx-btn fx-btn-yellow">Create your business</Link>
              <p className="fx-note">{CONFIG.signupNote}</p>
            </div>

            <ol className="fx-steps">
              {JOURNEY.map(([name, text, time], i) => (
                <li key={name}>
                  <span className="fx-step-n">{i + 1}</span>
                  <div className="fx-step-body">
                    <h3>{name}</h3>
                    <p>{text}</p>
                  </div>
                  <span className="fx-leader" aria-hidden="true" />
                  <span className="fx-step-time">{time}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* AI */}
        <section className="fx-section" id="ai">
          <div className="fx-wrap fx-ai-grid">
            <div className="fx-head">
              <h2>Ask your business a question.</h2>
              <p>
                AI Business reads the information your account is allowed to see
                and answers in plain language. No report building.
              </p>
              <ul className="fx-ask-list">
                <li>Which products sell slowest?</li>
                <li>Which category earns the most?</li>
                <li>What should I reorder this week?</li>
              </ul>
              <a href="#product-demo" className="fx-link">Try a sample question</a>
            </div>

            <div className="fx-chat" aria-hidden="true">
              <div className="fx-chat-bar">AI Business</div>
              <div className="fx-chat-body">
                <div className="u">What can you help me understand?</div>
                <div className="b">
                  <b>FinancePro AI</b>
                  Sales, inventory, expenses and activity across all your categories. Ask in your own words.
                </div>
                <div className="fx-chat-input">Ask about your business…</div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGIN */}
        <section className="fx-login" id="login" ref={loginSectionRef}>
          <div className="fx-wrap fx-login-grid">
            <div className="fx-login-copy">
              <h2>{returning.name ? title : "Your workspace is waiting."}</h2>
              <p>
                Sign in to keep billing, managing stock and reviewing your numbers.
              </p>
              <ul>
                <li>Billing and sales</li>
                <li>Inventory and purchases</li>
                <li>Customers and suppliers</li>
                <li>AI business insights</li>
              </ul>
            </div>

            <div className="fx-login-card">
              <h3>{title}</h3>
              <p className="fx-login-sub">{subtitle}</p>

              {returning.name && (
                <button type="button" className="fx-not-you" onClick={forgetReturning}>
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
                {emailInvalid && <small className="fx-field-error">Try name@business.in</small>}

                <label>
                  <span className="fx-pw-label">
                    Password
                    <Link to="/forgot-password">Forgot password?</Link>
                  </span>
                  <span className="fx-pw-wrap">
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
                      onKeyUp={onCaps}
                      onKeyDown={onCaps}
                      autoComplete="current-password"
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>
                {capsOn && <small className="fx-field-error">Caps Lock is on.</small>}

                {error && <div className="fx-error" role="alert">{error}</div>}

                <button className="fx-submit" type="submit" disabled={isLoading}>
                  {pending === "email" ? "Signing in…" : "Sign in"}
                </button>

                <div className="fx-or"><span />or<span /></div>

                <button className="fx-google" type="button" onClick={handleGoogleLogin} disabled={isLoading}>
                  {pending === "google" ? "Opening Google…" : "Continue with Google"}
                </button>

                {CONFIG.demo.enabled && (
                  <button className="fx-demo-btn" type="button" onClick={handleDemo} disabled={isLoading}>
                    {pending === "demo" ? "Opening demo…" : "Try the demo business"}
                  </button>
                )}
              </form>

              <div className="fx-login-foot">
                <span>New here?</span>
                <Link to="/register">Create your business</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fx-footer">
        <div className="fx-wrap fx-footer-in">
          <Brand light />
          <nav aria-label="Footer">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
            <Link to="/register">Create business</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap');

:root{
  --ink:#14123A;
  --blue:#2B3BE0;
  --blue-d:#1E2BB5;
  --yellow:#FFC61A;
  --paper:#F3F2FB;
  --white:#FFFFFF;
  --red:#E8412C;
  --green:#12875E;
  --muted:#55527A;
  --line:2.5px solid var(--ink);
  --hard:5px 5px 0 var(--ink);
  --hard-sm:3px 3px 0 var(--ink);
  --display:'Bricolage Grotesque','Figtree',system-ui,sans-serif;
  --body:'Figtree',system-ui,sans-serif;
  --receipt:'Courier Prime','Courier New',monospace;
}

*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:84px}
body{margin:0 !important;background:var(--paper);display:block !important;place-items:initial !important;overflow-x:hidden}
/* Undo Vite/CRA starter styles (narrow, centered #root) while this page is mounted */
#root{max-width:none !important;width:100% !important;margin:0 !important;padding:0 !important;text-align:left !important;display:block !important}
button,input{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed}
a,button{-webkit-tap-highlight-color:transparent}
:focus-visible{outline:3px solid var(--blue);outline-offset:3px}

.fx-page{
  min-height:100vh;width:100%;text-align:left;color:var(--ink);font-family:var(--body);
  background:var(--paper);overflow-x:hidden;
}
.fx-wrap{width:min(1180px,92vw);margin:0 auto}
.fx-skip{position:absolute;left:-999px;top:8px;background:var(--yellow);border:var(--line);padding:8px 12px;z-index:200;font-weight:700;color:var(--ink)}
.fx-skip:focus{left:8px}

/* ── buttons ── */
.fx-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-height:48px;padding:12px 22px;border-radius:999px;border:var(--line);
  font:700 15px var(--body);text-decoration:none;color:var(--ink);
  box-shadow:var(--hard-sm);transition:transform .12s ease, box-shadow .12s ease;
}
.fx-btn:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--ink)}
.fx-btn:active{transform:translate(2px,2px);box-shadow:0 0 0 var(--ink)}
.fx-btn-blue{background:var(--blue);color:#fff}
.fx-btn-white{background:#fff}
.fx-btn-yellow{background:var(--yellow)}
.fx-btn-sm{min-height:42px;padding:8px 16px;font-size:14px}

/* ── nav ── */
.fx-nav{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;gap:18px;
  padding:10px 4vw;background:var(--white);border-bottom:var(--line);
}
.fx-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}
.fx-brand-mark{
  width:40px;height:40px;display:grid;place-items:center;background:var(--yellow);
  border:var(--line);border-radius:10px;transform:rotate(-6deg);
  font:800 22px var(--display);box-shadow:var(--hard-sm);
}
.fx-brand-text{display:flex;flex-direction:column;line-height:1.1}
.fx-brand strong{font:800 20px var(--display);letter-spacing:-.3px}
.fx-brand small{font-size:11px;color:var(--muted);margin-top:2px}
.fx-brand.light{color:#fff}
.fx-brand.light small{color:#B9B6E6}
.fx-brand.light .fx-brand-mark{box-shadow:none}
.fx-nav-links{display:flex;gap:4px}
.fx-nav-links a,.fx-nav-login{
  color:var(--ink);text-decoration:none;font-weight:600;font-size:14px;
  padding:8px 12px;border-radius:999px;
}
.fx-nav-links a:hover,.fx-nav-login:hover{background:var(--yellow)}
.fx-nav-actions{display:flex;align-items:center;gap:8px}
.fx-menu-btn{width:42px;height:42px;border:var(--line);border-radius:10px;background:#fff;font-size:18px}
.fx-mobile-menu{
  position:absolute;left:0;right:0;top:100%;background:#fff;border-bottom:var(--line);
  display:flex;flex-direction:column;padding:8px 4vw 14px;
}
.fx-mobile-menu a{padding:13px 4px;text-decoration:none;color:var(--ink);font-weight:700;border-bottom:1.5px dashed #CFCDEB}

/* ── hero ── */
.fx-hero{
  padding:64px 0 72px;
  background-color:var(--paper);
  background-image:radial-gradient(#C9C6EE 1.4px,transparent 1.4px);
  background-size:22px 22px;
  border-bottom:var(--line);
}
.fx-hero-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:56px;align-items:start}
.fx-hero-grid>*{min-width:0}
.fx-sticker{
  display:inline-block;margin:0 0 22px;padding:7px 14px;background:var(--yellow);
  border:var(--line);border-radius:8px;font-weight:700;font-size:13px;
  transform:rotate(-2deg);box-shadow:var(--hard-sm);
}
.fx-hero h1{
  font:800 clamp(44px,5.6vw,84px)/1 var(--display);letter-spacing:-.025em;margin:0 0 24px;
}
.fx-lead{font-size:18px;line-height:1.6;color:var(--muted);max-width:520px;margin:0}
.fx-hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.fx-trust{list-style:none;padding:0;margin:28px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.fx-trust li{
  background:#fff;border:2px solid var(--ink);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600;
}
.fx-trust li::before{content:"✓";color:var(--green);font-weight:800;margin-right:6px}
.fx-demo-note{margin:12px 4px 0;font-size:13px;color:var(--muted)}

/* ── live counter ── */
.fx-counter{background:#fff;border:var(--line);border-radius:20px;box-shadow:8px 8px 0 var(--ink);overflow:hidden}
.fx-counter-bar{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:10px 14px;background:var(--ink);color:#fff;font-size:13px;font-weight:600;
}
.fx-dots{display:flex;gap:5px}
.fx-dots i{width:10px;height:10px;border-radius:50%;background:var(--yellow);display:block}
.fx-dots i:nth-child(2){background:var(--red)}
.fx-dots i:nth-child(3){background:#5CE0A8}
.fx-sold{color:var(--yellow)}

/* category filter inside the counter */
.fx-catbar{
  display:flex;gap:8px;overflow-x:auto;padding:12px 14px;background:#F7F6FD;
  border-bottom:2px dashed #BDBAE3;scrollbar-width:thin;
}
.fx-catbar button{
  flex:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;
  border:2px solid var(--ink);background:#fff;color:var(--ink);border-radius:999px;
  padding:6px 12px;font-size:13px;font-weight:700;
}
.fx-catbar button:hover{background:var(--yellow)}
.fx-catbar button.on{background:var(--ink);color:#fff}

.fx-counter-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
.fx-counter-grid>*{min-width:0}
.fx-shelf{padding:16px;border-right:2px dashed #BDBAE3}
.fx-shelf h3,.fx-ask-chips span{margin:0 0 10px;font:700 13px var(--body);color:var(--muted)}
.fx-shelf ul{
  list-style:none;margin:0;padding:0 4px 0 0;display:flex;flex-direction:column;gap:8px;
  max-height:340px;overflow-y:auto;
}
.fx-shelf button{
  width:100%;display:grid;grid-template-columns:1fr auto;gap:2px 10px;text-align:left;
  padding:10px 12px;background:var(--paper);border:2px solid var(--ink);border-radius:12px;color:var(--ink);
  transition:transform .1s, background .1s;
}
.fx-shelf button:hover:not(:disabled){background:var(--yellow);transform:translateX(3px)}
.fx-shelf button:disabled{opacity:.45}
.fx-p-name{font-weight:700;font-size:14px}
.fx-p-price{font-weight:800;font-size:14px;text-align:right}
.fx-p-stock{grid-column:1/-1;font-size:12px;color:var(--green);font-weight:600}
.fx-p-stock.low{color:var(--red)}
.fx-bill-wrap{padding:16px;background:#F7F6FD}
.fx-bill{
  position:relative;background:#fff;border:2px solid var(--ink);padding:14px 14px 22px;
  font-family:var(--receipt);font-size:13px;min-height:100%;
  -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat,
    conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/12px 8px repeat-x;
  mask:linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat,
    conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/12px 8px repeat-x;
}
.fx-bill-head{display:flex;justify-content:space-between;border-bottom:2px dashed var(--ink);padding-bottom:8px;margin-bottom:8px}
.fx-bill-empty{color:var(--muted);margin:18px 0;line-height:1.5}
.fx-bill-lines{list-style:none;margin:0;padding:0}
.fx-bill-lines li{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:5px 0;animation:fxPrint .25s ease both}
@keyframes fxPrint{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.fx-bill-name{min-width:0;overflow-wrap:anywhere}
.fx-bill-qty{display:inline-flex;align-items:center;gap:6px;font-weight:700}
.fx-bill-qty button{width:22px;height:22px;border:1.5px solid var(--ink);background:var(--yellow);border-radius:6px;line-height:1;padding:0;font-weight:700}
.fx-bill-amt{min-width:56px;text-align:right;font-weight:700}
.fx-bill-total{display:flex;justify-content:space-between;align-items:baseline;border-top:2px dashed var(--ink);margin-top:10px;padding-top:10px;font-size:15px}
.fx-bill-total strong{font-size:22px}
.fx-bill-actions{display:flex;gap:8px;margin-top:12px;font-family:var(--body)}
.fx-btn-yellow,.fx-btn-ghost{border:2px solid var(--ink);border-radius:999px;padding:9px 14px;font-weight:700;font-size:13px;color:var(--ink)}
.fx-bill-actions .fx-btn-yellow{background:var(--yellow);flex:1}
.fx-bill-actions .fx-btn-ghost{background:#fff}
.fx-bill-actions button:disabled{opacity:.4}
.fx-ask{border-top:var(--line);padding:14px 16px;background:#fff}
.fx-ask-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.fx-ask-chips span{margin:0 4px 0 0;color:var(--ink)}
.fx-ask-chips button{border:2px solid var(--ink);background:#fff;border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600;color:var(--ink)}
.fx-ask-chips button:hover{background:var(--paper)}
.fx-ask-chips button.on{background:var(--blue);color:#fff}
.fx-ask-answer{margin:12px 0 0;padding:12px;background:var(--paper);border-left:5px solid var(--blue);border-radius:4px;font-size:14px;line-height:1.5;min-height:48px}

/* ── categories ── */
.fx-cats{background:var(--yellow);border-bottom:var(--line);padding:30px 0 28px}
.fx-cats-title{margin:0 0 18px;text-align:center;font:800 clamp(16px,2vw,21px) var(--display);letter-spacing:-.01em}
.fx-cats-grid{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.fx-cats-grid button{
  display:inline-flex;align-items:center;gap:8px;
  background:#fff;border:2px solid var(--ink);border-radius:999px;color:var(--ink);
  padding:8px 16px 8px 12px;font-weight:700;font-size:14px;
  box-shadow:var(--hard-sm);transition:transform .12s ease, box-shadow .12s ease;
}
.fx-cats-grid button span{font-size:18px;line-height:1}
.fx-cats-grid button:hover{transform:translate(-2px,-2px) rotate(-1deg);box-shadow:5px 5px 0 var(--ink)}
.fx-cats-grid button:active{transform:translate(2px,2px);box-shadow:none}
.fx-cats-hint{margin:16px 0 0;text-align:center;font-size:13px;font-weight:600}

/* ── businesses ── */
.fx-biz{padding:88px 0;background:#fff;border-bottom:var(--line)}
.fx-biz-filter{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 24px}
.fx-biz-filter button{border:2px solid var(--ink);background:#fff;color:var(--ink);border-radius:999px;padding:8px 16px;font-weight:700;font-size:14px}
.fx-biz-filter button:hover{background:var(--yellow)}
.fx-biz-filter button.on{background:var(--ink);color:#fff}
.fx-biz-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.fx-biz-card{
  display:grid;grid-template-columns:auto 1fr;grid-template-areas:"i n" "i t";column-gap:12px;row-gap:3px;align-items:center;
  padding:12px 14px;background:var(--paper);border:2px solid var(--ink);border-radius:14px;
}
.fx-biz-icon{grid-area:i;font-size:26px;line-height:1;width:42px;height:42px;display:grid;place-items:center;background:#fff;border:2px solid var(--ink);border-radius:10px}
.fx-biz-name{grid-area:n;font-weight:700;font-size:15px;line-height:1.2}
.fx-biz-tag{grid-area:t;font-size:12px;font-weight:700;color:var(--green)}
.fx-biz-card.extra{background:#FFF6D6}
.fx-biz-card.extra .fx-biz-tag{color:#8A5A00}
.fx-biz-card.soon{background:#EFEFF6;border-style:dashed}
.fx-biz-card.soon .fx-biz-tag{color:var(--muted)}

/* ── sections ── */
.fx-section{padding:96px 0}
.fx-head{max-width:640px}
.fx-head h2,.fx-login-copy h2{font:800 clamp(32px,4.2vw,54px)/1.05 var(--display);letter-spacing:-.02em;margin:0 0 16px}
.fx-head p{font-size:17px;line-height:1.6;color:var(--muted);margin:0 0 20px}
.fx-link{color:var(--blue);font-weight:700;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
.fx-link:hover{color:var(--blue-d)}

/* feature explorer */
.fx-explorer{margin-top:44px}
.fx-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:-2.5px;position:relative;z-index:2}
.fx-tabs button{
  padding:12px 20px;border:var(--line);border-bottom:0;border-radius:14px 14px 0 0;background:#E4E2F7;
  font-weight:700;font-size:15px;color:var(--ink);
}
.fx-tabs button:hover{background:#fff}
.fx-tabs button.on{background:#fff}
.fx-panel{
  display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;align-items:center;
  background:#fff;border:var(--line);border-radius:0 18px 18px 18px;padding:40px;box-shadow:8px 8px 0 var(--ink);
  animation:fxSwap .3s ease both;
}
@keyframes fxSwap{from{opacity:.4;transform:translateY(6px)}to{opacity:1;transform:none}}
.fx-panel>*{min-width:0}
.fx-panel-copy h3{font:800 clamp(26px,3vw,38px)/1.1 var(--display);letter-spacing:-.03em;margin:0 0 14px}
.fx-panel-copy p{font-size:16px;line-height:1.65;color:var(--muted);margin:0 0 18px}
.fx-panel-copy ul{list-style:none;padding:0;margin:0 0 22px;display:flex;flex-wrap:wrap;gap:8px}
.fx-panel-copy li{background:var(--paper);border:2px solid var(--ink);border-radius:8px;padding:6px 10px;font-size:13px;font-weight:600}
.fx-panel-visual{background:var(--paper);border:2px solid var(--ink);border-radius:14px;padding:22px;min-height:290px;display:grid;place-items:center;
  background-image:radial-gradient(#D3D0F1 1.2px,transparent 1.2px);background-size:16px 16px}

.fx-vis{width:100%}
.fx-vis-bill{display:flex;flex-direction:column;gap:14px;align-items:center}
.fx-mini-receipt{width:min(280px,100%);background:#fff;border:2px solid var(--ink);padding:14px;font:13px var(--receipt);box-shadow:var(--hard-sm);transform:rotate(-1.5deg)}
.fx-mini-receipt b{display:block;border-bottom:2px dashed var(--ink);padding-bottom:6px;margin-bottom:6px}
.fx-mini-receipt div{display:flex;justify-content:space-between;padding:3px 0}
.fx-mini-receipt .t{border-top:2px dashed var(--ink);margin-top:6px;padding-top:7px;font-weight:700}
.fx-pay{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600}
.fx-pay i{font-style:normal;border:2px solid var(--ink);border-radius:999px;padding:4px 12px;background:#fff}
.fx-pay i.on{background:var(--green);color:#fff}
.fx-vis-stock{display:flex;flex-direction:column;gap:14px}
.fx-stock-row{display:grid;grid-template-columns:120px 1fr 64px;gap:12px;align-items:center;font-size:13px;font-weight:600}
.fx-meter{height:14px;border:2px solid var(--ink);border-radius:999px;background:#fff;overflow:hidden}
.fx-meter i{display:block;height:100%;background:var(--green)}
.fx-meter i.low{background:var(--red)}
.fx-stock-row em{font-style:normal;color:var(--green);text-align:right}
.fx-stock-row em.low{color:var(--red)}
.fx-vis-qr{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap}
.fx-qr-code{display:grid;grid-template-columns:repeat(7,1fr);width:120px;height:120px;padding:8px;background:#fff;border:2px solid var(--ink);gap:2px}
.fx-qr-code i{background:#EEEDFA}
.fx-qr-code i.k{background:var(--ink)}
.fx-phone{width:170px;background:var(--ink);color:#fff;border-radius:22px;padding:16px 14px;border:3px solid var(--ink);box-shadow:var(--hard-sm)}
.fx-phone b{display:block;font-size:13px;margin-bottom:10px}
.fx-phone div{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:1px solid #3A3870;font-size:12px}
.fx-phone i{font-style:normal;background:var(--yellow);color:var(--ink);border-radius:6px;padding:2px 8px;font-weight:700}
.fx-phone u{display:block;text-decoration:none;text-align:center;background:var(--blue);border-radius:8px;padding:8px;margin-top:10px;font-size:12px;font-weight:700}
.fx-vis-exp p{margin:0 0 14px;font-size:13px;color:var(--muted);font-weight:600}
.fx-exp-row{margin-bottom:14px;font-size:13px;font-weight:600}
.fx-exp-row span{display:block;margin-bottom:5px}
.fx-exp-row i{display:block;height:20px;background:var(--blue);border:2px solid var(--ink);border-radius:6px}
.fx-exp-row:nth-child(3) i{background:var(--yellow)}
.fx-exp-row:nth-child(4) i{background:#8E96F5}
.fx-exp-row:nth-child(5) i{background:var(--red)}
.fx-vis-ai{display:flex;flex-direction:column;gap:10px}
.fx-vis-ai .u,.fx-chat .u{align-self:flex-end;max-width:80%;background:var(--blue);color:#fff;padding:10px 14px;border-radius:16px 16px 4px 16px;font-size:14px;font-weight:600}
.fx-vis-ai .b,.fx-chat .b{max-width:90%;background:#fff;border:2px solid var(--ink);padding:12px 14px;border-radius:16px 16px 16px 4px;font-size:14px;line-height:1.5}
.fx-vis-ai .b b,.fx-chat .b b{display:block;margin-bottom:3px}

/* workflow */
.fx-dark{background:var(--ink);color:#fff;border-top:var(--line);border-bottom:var(--line)}
.fx-dark .fx-head p{color:#C3C0EA}
.fx-dark .fx-note{font-size:14px;margin:14px 0 0}
.fx-flow-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:64px;align-items:start}
.fx-flow-grid>*{min-width:0}
.fx-steps{list-style:none;margin:0;padding:22px 26px;background:#fff;color:var(--ink);border:3px solid var(--yellow);border-radius:6px;font-family:var(--receipt);box-shadow:8px 8px 0 var(--yellow)}
.fx-steps li{display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:2px dashed var(--ink)}
.fx-steps li:last-child{border-bottom:0}
.fx-step-n{flex:none;width:34px;height:34px;display:grid;place-items:center;background:var(--ink);color:var(--yellow);border-radius:50%;font:700 15px var(--receipt)}
.fx-step-body{min-width:0}
.fx-step-body h3{margin:0;font:700 17px var(--receipt)}
.fx-step-body p{margin:3px 0 0;font:400 13px/1.45 var(--receipt);color:#4D4A73}
.fx-leader{flex:1;min-width:12px;border-bottom:2px dotted #8F8CC0;align-self:flex-end;margin-bottom:6px}
.fx-step-time{flex:none;font-weight:700;font-size:14px}

/* ai */
.fx-ai-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:64px;align-items:center}
.fx-ai-grid>*{min-width:0}
.fx-ask-list{list-style:none;padding:0;margin:0 0 22px;display:flex;flex-direction:column;gap:8px}
.fx-ask-list li{background:#fff;border:2px solid var(--ink);border-radius:12px;padding:12px 16px;font-weight:600;box-shadow:var(--hard-sm);width:fit-content;max-width:100%}
.fx-ask-list li:nth-child(2){margin-left:22px}
.fx-ask-list li:nth-child(3){margin-left:44px}
.fx-chat{background:#fff;border:var(--line);border-radius:20px;box-shadow:8px 8px 0 var(--ink);overflow:hidden}
.fx-chat-bar{background:var(--blue);color:#fff;font-weight:700;padding:12px 16px;border-bottom:var(--line)}
.fx-chat-body{padding:22px;min-height:290px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px;background:var(--paper)}
.fx-chat-input{background:#fff;border:2px solid var(--ink);border-radius:999px;padding:12px 16px;font-size:14px;color:#77749D}

/* login */
.fx-login{background:var(--blue);border-top:var(--line);padding:96px 0;
  background-image:radial-gradient(rgba(255,255,255,.16) 1.4px,transparent 1.4px);background-size:22px 22px}
.fx-login-grid{display:grid;grid-template-columns:minmax(0,1fr) 450px;gap:72px;align-items:center}
.fx-login-grid>*{min-width:0}
.fx-login-copy{color:#fff}
.fx-login-copy p{font-size:18px;line-height:1.6;color:#DAD9FA;max-width:480px;margin:0 0 24px}
.fx-login-copy ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px}
.fx-login-copy li{background:rgba(255,255,255,.14);border:2px solid #fff;border-radius:999px;padding:7px 14px;font-weight:600;font-size:14px}
.fx-login-card{background:#fff;border:var(--line);border-radius:20px;padding:30px;box-shadow:8px 8px 0 var(--ink);color:var(--ink)}
.fx-login-card h3{font:800 30px/1.1 var(--display);letter-spacing:-.03em;margin:0 0 6px}
.fx-login-sub{margin:0 0 16px;color:var(--muted);font-size:15px}
.fx-not-you{border:0;background:none;color:var(--blue);font-weight:700;font-size:14px;padding:0;margin:0 0 16px;text-decoration:underline;text-underline-offset:3px}
.fx-login-card form{display:flex;flex-direction:column;gap:14px}
.fx-login-card label{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:14px}
.fx-login-card input{
  width:100%;height:48px;border:2px solid var(--ink);border-radius:12px;padding:0 14px;font-size:15px;
  background:var(--paper);color:var(--ink);
}
.fx-login-card input:focus{outline:3px solid var(--blue);outline-offset:2px;background:#fff}
.fx-login-card input[aria-invalid="true"]{border-color:var(--red)}
.fx-pw-label{display:flex;justify-content:space-between;align-items:center}
.fx-pw-label a{color:var(--blue);font-size:13px;font-weight:700}
.fx-pw-wrap{position:relative;display:block}
.fx-pw-wrap input{padding-right:70px}
.fx-pw-wrap button{position:absolute;right:6px;top:6px;height:36px;padding:0 12px;border:2px solid var(--ink);background:var(--yellow);border-radius:8px;font-weight:700;font-size:13px;color:var(--ink)}
.fx-field-error{color:var(--red);font-size:13px;font-weight:600;margin-top:-8px}
.fx-error{background:#FFEDEA;border:2px solid var(--red);color:#9C2616;border-radius:10px;padding:10px 12px;font-size:14px;font-weight:600}
.fx-submit{height:50px;border:var(--line);border-radius:999px;background:var(--yellow);color:var(--ink);font-weight:800;font-size:16px;box-shadow:var(--hard-sm);transition:transform .12s, box-shadow .12s}
.fx-submit:hover:not(:disabled){transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--ink)}
.fx-submit:active:not(:disabled){transform:translate(2px,2px);box-shadow:none}
.fx-submit:disabled,.fx-google:disabled,.fx-demo-btn:disabled{opacity:.6}
.fx-or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px;font-weight:600}
.fx-or span{flex:1;height:2px;background:#DAD8F0}
.fx-google{height:48px;border:2px solid var(--ink);border-radius:999px;background:#fff;font-weight:700;font-size:15px;color:var(--ink)}
.fx-google:hover:not(:disabled){background:var(--paper)}
.fx-demo-btn{border:0;background:none;color:var(--blue);font-weight:700;font-size:14px;padding:4px;text-decoration:underline;text-underline-offset:3px}
.fx-login-foot{display:flex;justify-content:center;gap:6px;margin-top:18px;font-size:14px;color:var(--muted)}
.fx-login-foot a{color:var(--blue);font-weight:700}

/* footer */
.fx-footer{background:var(--ink);padding:36px 0 44px;border-top:var(--line)}
.fx-footer-in{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.fx-footer nav{display:flex;flex-wrap:wrap;gap:6px 20px}
.fx-footer nav a{color:#C3C0EA;text-decoration:none;font-size:14px;font-weight:600}
.fx-footer nav a:hover{color:var(--yellow)}

/* ── responsive ── */
@media(max-width:1000px){
  .fx-hero-grid,.fx-flow-grid,.fx-ai-grid,.fx-login-grid{grid-template-columns:1fr;gap:40px}
  .fx-panel{grid-template-columns:1fr;padding:28px}
  .fx-login-grid{gap:40px}
}
@media(max-width:700px){
  .fx-hero{padding:44px 0 56px}
  .fx-section,.fx-login{padding:64px 0}
  .fx-counter-grid{grid-template-columns:1fr}
  .fx-shelf{border-right:0;border-bottom:2px dashed #BDBAE3}
  .fx-shelf ul{max-height:280px}
  .fx-brand small{display:none}
  .fx-tabs button{padding:10px 12px;font-size:14px}
  .fx-panel{padding:20px;border-radius:0 14px 14px 14px}
  .fx-panel-visual{padding:14px}
  .fx-stock-row{grid-template-columns:96px 1fr 56px;gap:8px}
  .fx-steps{padding:14px 16px}
  .fx-steps li{flex-wrap:wrap}
  .fx-leader{display:none}
  .fx-step-time{margin-left:46px;font-size:13px}
  .fx-step-body{flex:1 1 60%}
  .fx-ask-list li:nth-child(2),.fx-ask-list li:nth-child(3){margin-left:0}
  .fx-login-card{padding:22px}
  .fx-cats-grid button{font-size:13px;padding:7px 12px 7px 10px}
  .fx-biz{padding:56px 0}
  .fx-biz-grid{grid-template-columns:1fr}
  .fx-counter,.fx-panel,.fx-chat,.fx-login-card{box-shadow:5px 5px 0 var(--ink)}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *{animation:none !important;transition:none !important}
}
`;