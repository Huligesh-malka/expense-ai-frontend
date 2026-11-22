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

/*
  Business types, grouped. Each item: [name, status, note]
  status: "full" | "extra" | "soon"
  Use "soon" for any module that is not built yet.
*/
const BUSINESS_GROUPS = [
  {
    title: "Everyday and fresh",
    items: [
      ["Grocery Stores", "full", ""],
      ["Supermarkets", "full", ""],
      ["General Retail Stores", "full", ""],
      ["Fruit Shops", "full", ""],
      ["Vegetable Shops", "full", ""],
      ["Dairy Shops", "full", ""],
      ["Bakeries", "full", ""],
      ["Sweet Shops", "full", ""],
      ["Meat Shops", "extra", "Weight-based billing"],
    ],
  },
  {
    title: "Health and beauty",
    items: [
      ["Medical Stores / Pharmacies", "full", ""],
      ["Cosmetics Shops", "full", ""],
      ["Beauty Product Stores", "full", ""],
    ],
  },
  {
    title: "Fashion and lifestyle",
    items: [
      ["Clothing Stores", "full", ""],
      ["Footwear Stores", "full", ""],
      ["Gift Shops", "full", ""],
      ["Toys Shops", "full", ""],
      ["Book Shops", "full", ""],
      ["Stationery Shops", "full", ""],
      ["Pet Shops", "full", ""],
    ],
  },
  {
    title: "Electronics and home",
    items: [
      ["Electronics Shops", "full", ""],
      ["Mobile Shops", "full", ""],
      ["Mobile Accessories", "full", ""],
      ["Home Appliances", "full", ""],
      ["Furniture Shops", "full", ""],
      ["Electrical Shops", "full", ""],
    ],
  },
  {
    title: "Hardware and auto",
    items: [
      ["Hardware Stores", "full", ""],
      ["Plumbing Stores", "full", ""],
      ["Paint Shops", "full", ""],
      ["Automobile Spare Parts", "full", ""],
    ],
  },
  {
    title: "Food service",
    items: [
      ["Restaurants", "extra", "Restaurant-specific features"],
      ["Cafes", "extra", "Restaurant-specific features"],
    ],
  },
  {
    title: "Trade and online",
    items: [
      ["Wholesale Businesses", "full", ""],
      ["Distributor Businesses", "full", ""],
      ["Small Manufacturing Businesses", "extra", "With production module"],
      ["Online Sellers", "extra", "With e-commerce integration"],
    ],
  },
];

const ALL_BUSINESSES = BUSINESS_GROUPS.flatMap((g) => g.items);

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

/* The memorable thing: a counter you can use. Its first bill prints itself once. */
function LiveCounter({ category, onCategory }) {
  const [cart, setCart] = useState({});
  const [question, setQuestion] = useState("");
  const [sold, setSold] = useState(0);
  const touched = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const script = ["rice", "para", "notebook", "notebook", "bulb"];
    const timers = script.map((id, i) =>
      setTimeout(() => {
        if (touched.current) return;
        setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
      }, 1100 + i * 800)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const take = () => {
    touched.current = true;
  };

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
    <div className="fx-counter" id="product-demo" onPointerDown={take} onKeyDown={take}>
      <div className="fx-counter-bar">
        <span className="fx-live"><i />Sample shop</span>
        <span className="fx-sold">
          <small>Sold today</small>
          <b>{inr(sold)}</b>
        </span>
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
          <h3>{category === "All" ? "All categories" : category}</h3>
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
                    <span className="fx-p-icon" aria-hidden="true">{catIcon(p.cat)}</span>
                    <span className="fx-p-main">
                      <span className="fx-p-name">{p.name}</span>
                      <span className={"fx-p-stock" + (isLow ? " low" : "")}>
                        {p.cat}
                        <b>{remaining <= 0 ? "Out of stock" : `${remaining} left`}</b>
                      </span>
                    </span>
                    <span className="fx-p-price">{inr(p.price)}</span>
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
              <button type="button" className="fx-bill-btn primary" onClick={finish} disabled={!total}>
                Complete sale
              </button>
              <button type="button" className="fx-bill-btn" onClick={clear} disabled={!total}>
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

/* Mini visuals for the feature stage */
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
  const bizTotal = ALL_BUSINESSES.length;
  const bizFull = ALL_BUSINESSES.filter((b) => b[1] === "full").length;
  const bizExtra = bizTotal - bizFull;
  const isDim = (status) =>
    bizFilter === "full" ? status !== "full" : bizFilter === "extra" ? status === "full" : false;

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
          <Link to="/register" className="fx-btn fx-btn-ink fx-btn-sm">Create business</Link>
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
        {/* HERO: ledger paper, with the counter printing its first bill */}
        <section className="fx-hero" id="product">
          <div className="fx-wrap fx-hero-grid">
            <div className="fx-hero-copy">
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
                <Link to="/register" className="fx-btn fx-btn-ink">Create your business</Link>
                <a href="#login" className="fx-btn fx-btn-line">Login</a>
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

        {/* BUSINESSES: a directory, grouped by how people shop */}
        <section className="fx-biz" id="businesses">
          <div className="fx-wrap">
            <div className="fx-biz-top">
              <div className="fx-head">
                <h2>Built for {bizTotal} kinds of business.</h2>
                <p>
                  From a corner grocery to a distributor. {bizFull} work fully out of the box;
                  {" "}{bizExtra} need extra features, marked beside the name.
                </p>
              </div>

              <div className="fx-biz-filter" role="group" aria-label="Highlight business types">
                {[
                  ["all", `All ${bizTotal}`],
                  ["full", `Full support ${bizFull}`],
                  ["extra", `Extra features ${bizExtra}`],
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
            </div>

            <div className="fx-biz-cols">
              {BUSINESS_GROUPS.map((g) => (
                <div className="fx-biz-group" key={g.title}>
                  <h3>
                    {g.title}
                    <span>{g.items.length}</span>
                  </h3>
                  <ul>
                    {g.items.map(([name, status, note]) => (
                      <li key={name} className={isDim(status) ? "dim" : ""}>
                        <span className="fx-biz-name">{name}</span>
                        {status !== "full" && (
                          <span className={"fx-biz-tag" + (status === "soon" ? " soon" : "")}>
                            {status === "soon" ? "Coming soon" : note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="fx-section fx-mist" id="features">
          <div className="fx-wrap">
            <div className="fx-head">
              <h2>One workspace for everything the counter touches.</h2>
              <p>Open a part of the business to see how it works.</p>
            </div>

            <div className="fx-feat">
              <div className="fx-feat-list">
                {FEATURES.map((f, i) => {
                  const open = i === active;
                  return (
                    <div className={"fx-feat-item" + (open ? " on" : "")} key={f.id}>
                      <button
                        type="button"
                        className="fx-feat-head"
                        id={`feat-${f.id}`}
                        aria-expanded={open}
                        aria-controls={`feat-panel-${f.id}`}
                        onClick={() => setActive(i)}
                      >
                        {f.label}
                        <span className="fx-plus" aria-hidden="true" />
                      </button>
                      <div
                        className="fx-feat-more"
                        id={`feat-panel-${f.id}`}
                        role="region"
                        aria-labelledby={`feat-${f.id}`}
                      >
                        <div>
                          <p className="fx-feat-headline">{f.headline}</p>
                          <p className="fx-feat-desc">{f.description}</p>
                          <ul className="fx-feat-points">
                            {f.points.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                          <div className="fx-feat-inline">
                            {open && <FeatureVisual id={f.id} />}
                          </div>
                          <Link to="/register" className="fx-link">
                            Start with {f.label.toLowerCase()}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="fx-feat-stage" aria-hidden="true">
                <div className="fx-stage-inner" key={feature.id}>
                  <FeatureVisual id={feature.id} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW: the steps, printed as a receipt */}
        <section className="fx-section fx-dark" id="workflow">
          <div className="fx-wrap fx-flow-grid">
            <div className="fx-head">
              <h2>From empty shop to daily control.</h2>
              <p>Five steps, in the order a shop owner actually does them.</p>
              <Link to="/register" className="fx-btn fx-btn-gold">Create your business</Link>
              <p className="fx-note">{CONFIG.signupNote}</p>
            </div>

            <div className="fx-receipt-wrap">
              <div className="fx-receipt">
                <div className="fx-receipt-head">
                  <strong>{CONFIG.brand}</strong>
                  <span>Your setup bill</span>
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
                <div className="fx-receipt-foot">
                  <span>Thank you for choosing {CONFIG.brand}</span>
                </div>
              </div>
            </div>
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
              <div className="fx-chat-bar">
                <span>AI Business</span>
                <small>Sample answer</small>
              </div>
              <div className="fx-chat-body">
                <div className="u">Which category earned the most this week?</div>
                <div className="b">
                  <b>FinancePro AI</b>
                  Grocery led the week, ahead of Medicine and Stationery.
                  <div className="fx-chat-bars">
                    <div><span>Grocery</span><i style={{ width: "100%" }} /><em>₹18,420</em></div>
                    <div><span>Medicine</span><i style={{ width: "51%" }} /><em>₹9,310</em></div>
                    <div><span>Stationery</span><i style={{ width: "27%" }} /><em>₹4,880</em></div>
                  </div>
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
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap');

:root{
  --ink:#15133A;
  --ink-2:#2B2963;
  --mist:#F3F4FA;
  --paper:#FFFFFF;
  --rule:#E3E5F2;
  --rule-2:#CCD0E6;
  --cobalt:#3D4BF2;
  --cobalt-d:#2B37C9;
  --gold:#FFB81C;
  --mint:#0F9D6E;
  --coral:#E8452F;
  --muted:#5A5D82;
  --shadow-s:0 1px 2px rgba(21,19,58,.06),0 6px 14px -6px rgba(21,19,58,.14);
  --shadow-m:0 2px 4px rgba(21,19,58,.05),0 20px 44px -18px rgba(21,19,58,.28);
  --shadow-l:0 4px 10px rgba(21,19,58,.06),0 44px 84px -34px rgba(21,19,58,.42);
  --display:'Bricolage Grotesque','Instrument Sans',system-ui,sans-serif;
  --body:'Instrument Sans',system-ui,sans-serif;
  --receipt:'Courier Prime','Courier New',monospace;
}

*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:84px}
body{margin:0 !important;background:var(--mist);display:block !important;place-items:initial !important;overflow-x:hidden}
/* Undo Vite/CRA starter styles (narrow, centered #root) while this page is mounted */
#root{max-width:none !important;width:100% !important;margin:0 !important;padding:0 !important;text-align:left !important;display:block !important}
button,input{font:inherit}
button{cursor:pointer}
button:disabled{cursor:not-allowed}
a,button{-webkit-tap-highlight-color:transparent}
:focus-visible{outline:3px solid var(--cobalt);outline-offset:3px}

.fx-page{
  min-height:100vh;width:100%;text-align:left;color:var(--ink);font-family:var(--body);
  background:var(--paper);overflow-x:hidden;font-size:16px;line-height:1.55;
}
.fx-wrap{width:min(1180px,92vw);margin:0 auto}
.fx-skip{position:absolute;left:-999px;top:8px;background:var(--gold);border-radius:8px;padding:8px 12px;z-index:200;font-weight:700;color:var(--ink)}
.fx-skip:focus{left:8px}

/* ── buttons ── */
.fx-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-height:52px;padding:0 28px;border-radius:999px;border:1px solid transparent;
  font:600 15px var(--body);text-decoration:none;
  transition:transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease;
}
.fx-btn:hover{transform:translateY(-1px)}
.fx-btn:active{transform:translateY(0)}
.fx-btn-ink{background:var(--ink);color:#fff;box-shadow:0 12px 26px -12px rgba(21,19,58,.75)}
.fx-btn-ink:hover{background:var(--ink-2)}
.fx-btn-line{background:#fff;color:var(--ink);border-color:var(--rule-2)}
.fx-btn-line:hover{border-color:var(--ink)}
.fx-btn-gold{background:var(--gold);color:var(--ink);box-shadow:0 12px 26px -14px rgba(255,184,28,.95)}
.fx-btn-sm{min-height:42px;padding:0 20px;font-size:14px}

/* ── nav ── */
.fx-nav{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;gap:18px;
  padding:12px 4vw;background:rgba(255,255,255,.86);
  -webkit-backdrop-filter:saturate(1.4) blur(14px);backdrop-filter:saturate(1.4) blur(14px);
  border-bottom:1px solid var(--rule);
}
.fx-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink)}
.fx-brand-mark{
  width:40px;height:40px;display:grid;place-items:center;background:var(--ink);color:var(--gold);
  border-radius:12px;font:800 22px var(--display);
}
.fx-brand-text{display:flex;flex-direction:column;line-height:1.1}
.fx-brand strong{font:800 20px var(--display);letter-spacing:-.02em}
.fx-brand small{font-size:11px;color:var(--muted);margin-top:3px}
.fx-brand.light{color:#fff}
.fx-brand.light small{color:#A9ABD9}
.fx-brand.light .fx-brand-mark{background:var(--gold);color:var(--ink)}
.fx-nav-links{display:flex;gap:2px}
.fx-nav-links a,.fx-nav-login{
  color:var(--muted);text-decoration:none;font-weight:600;font-size:14px;
  padding:8px 13px;border-radius:999px;transition:color .15s, background .15s;
}
.fx-nav-links a:hover,.fx-nav-login:hover{background:var(--mist);color:var(--ink)}
.fx-nav-actions{display:flex;align-items:center;gap:8px}
.fx-menu-btn{width:42px;height:42px;border:1px solid var(--rule-2);border-radius:12px;background:#fff;font-size:18px;color:var(--ink)}
.fx-mobile-menu{
  position:absolute;left:0;right:0;top:100%;background:#fff;border-bottom:1px solid var(--rule);
  display:flex;flex-direction:column;padding:8px 4vw 14px;box-shadow:var(--shadow-m);
}
.fx-mobile-menu a{padding:14px 4px;text-decoration:none;color:var(--ink);font-weight:600;border-bottom:1px solid var(--rule)}

/* ── hero: ledger paper ── */
.fx-hero{
  position:relative;padding:76px 0 104px;overflow:hidden;
  background-color:var(--mist);
  background-image:repeating-linear-gradient(to bottom,transparent 0 31px,rgba(61,75,242,.08) 31px 32px);
  border-bottom:1px solid var(--rule-2);
}
.fx-hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr);gap:60px;align-items:start}
.fx-hero-grid>*{min-width:0}
.fx-hero-grid::before{
  content:"";position:absolute;top:-76px;bottom:-104px;left:-30px;width:4px;
  border-left:1px solid rgba(232,69,47,.42);border-right:1px solid rgba(232,69,47,.42);pointer-events:none;
}
.fx-hero h1{
  font:800 clamp(46px,5.8vw,90px)/.97 var(--display);letter-spacing:-.035em;margin:6px 0 26px;
}
.fx-lead{font-size:18px;line-height:1.65;color:var(--muted);max-width:500px;margin:0}
.fx-hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.fx-trust{list-style:none;padding:0;margin:30px 0 0;display:flex;flex-wrap:wrap;gap:8px 22px}
.fx-trust li{font-size:14px;font-weight:600;color:var(--ink)}
.fx-trust li::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--mint);margin-right:9px;vertical-align:middle}
.fx-demo-note{margin:14px 6px 0;font-size:13px;color:var(--muted)}

/* ── live counter ── */
.fx-counter{background:var(--paper);border:1px solid var(--rule-2);border-radius:24px;box-shadow:var(--shadow-l);overflow:hidden}
.fx-counter-bar{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:14px 18px;border-bottom:1px solid var(--rule);font-size:13px;font-weight:600;
}
.fx-live{display:inline-flex;align-items:center;gap:9px;color:var(--muted)}
.fx-live i{width:8px;height:8px;border-radius:50%;background:var(--mint);box-shadow:0 0 0 4px rgba(15,157,110,.16)}
.fx-sold{display:inline-flex;align-items:baseline;gap:8px;font-variant-numeric:tabular-nums}
.fx-sold small{font-size:12px;color:var(--muted);font-weight:500}
.fx-sold b{font:800 18px var(--display);letter-spacing:-.01em}

.fx-catbar{
  display:flex;gap:6px;overflow-x:auto;padding:12px 16px;background:var(--mist);
  border-bottom:1px solid var(--rule);scrollbar-width:thin;
}
.fx-catbar button{
  flex:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;
  border:1px solid var(--rule-2);background:#fff;color:var(--ink);border-radius:999px;
  padding:6px 13px;font-size:13px;font-weight:600;transition:background .15s,color .15s,border-color .15s;
}
.fx-catbar button:hover{border-color:var(--ink)}
.fx-catbar button.on{background:var(--ink);border-color:var(--ink);color:#fff}

.fx-counter-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
.fx-counter-grid>*{min-width:0}
.fx-shelf{padding:16px;border-right:1px solid var(--rule)}
.fx-shelf h3{margin:0 0 12px;font:700 13px var(--body);color:var(--muted)}
.fx-shelf ul{
  list-style:none;margin:0;padding:0 4px 0 0;display:flex;flex-direction:column;gap:6px;
  max-height:340px;overflow-y:auto;
}
.fx-shelf button{
  width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;text-align:left;
  padding:9px 12px 9px 9px;background:#fff;border:1px solid var(--rule);border-radius:14px;color:var(--ink);
  transition:border-color .15s, background .15s, transform .15s;
}
.fx-shelf button:hover:not(:disabled){border-color:var(--ink);background:var(--mist)}
.fx-shelf button:active:not(:disabled){transform:scale(.99)}
.fx-shelf button:disabled{opacity:.45}
.fx-p-icon{width:38px;height:38px;display:grid;place-items:center;background:var(--mist);border-radius:10px;font-size:19px}
.fx-p-main{display:flex;flex-direction:column;min-width:0}
.fx-p-name{font-weight:600;font-size:14px;line-height:1.25}
.fx-p-stock{display:flex;gap:8px;font-size:12px;color:var(--muted)}
.fx-p-stock b{font-weight:600;color:var(--mint)}
.fx-p-stock.low b{color:var(--coral)}
.fx-p-price{font:700 14px var(--display);font-variant-numeric:tabular-nums}

.fx-bill-wrap{padding:16px;background:var(--mist)}
.fx-bill{
  position:relative;background:#fff;padding:16px 16px 26px;
  font-family:var(--receipt);font-size:13px;min-height:100%;
  filter:drop-shadow(0 6px 10px rgba(21,19,58,.12));
  -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat,
    conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/12px 8px repeat-x;
  mask:linear-gradient(#000 0 0) top/100% calc(100% - 8px) no-repeat,
    conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/12px 8px repeat-x;
}
.fx-bill-head{display:flex;justify-content:space-between;border-bottom:1px dashed var(--ink);padding-bottom:9px;margin-bottom:8px}
.fx-bill-empty{color:var(--muted);margin:18px 0;line-height:1.5}
.fx-bill-lines{list-style:none;margin:0;padding:0}
.fx-bill-lines li{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:5px 0;animation:fxPrint .3s ease both}
@keyframes fxPrint{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.fx-bill-name{min-width:0;overflow-wrap:anywhere}
.fx-bill-qty{display:inline-flex;align-items:center;gap:6px;font-weight:700}
.fx-bill-qty button{width:22px;height:22px;border:1px solid var(--ink);background:#fff;border-radius:6px;line-height:1;padding:0;font-weight:700;color:var(--ink)}
.fx-bill-qty button:hover{background:var(--gold)}
.fx-bill-amt{min-width:58px;text-align:right;font-weight:700}
.fx-bill-total{display:flex;justify-content:space-between;align-items:baseline;border-top:1px dashed var(--ink);margin-top:10px;padding-top:10px;font-size:15px}
.fx-bill-total strong{font-size:22px}
.fx-bill-actions{display:flex;gap:8px;margin-top:14px;font-family:var(--body)}
.fx-bill-btn{border:1px solid var(--rule-2);background:#fff;border-radius:999px;padding:9px 16px;font-weight:600;font-size:13px;color:var(--ink);transition:background .15s,border-color .15s}
.fx-bill-btn:hover:not(:disabled){border-color:var(--ink)}
.fx-bill-btn.primary{flex:1;background:var(--ink);border-color:var(--ink);color:#fff}
.fx-bill-btn.primary:hover:not(:disabled){background:var(--ink-2)}
.fx-bill-btn:disabled{opacity:.4}

.fx-ask{border-top:1px solid var(--rule);padding:14px 16px 16px;background:#fff}
.fx-ask-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.fx-ask-chips span{margin:0 4px 0 0;font:700 13px var(--body);color:var(--ink)}
.fx-ask-chips button{border:1px solid var(--rule-2);background:#fff;border-radius:999px;padding:6px 13px;font-size:13px;font-weight:600;color:var(--ink);transition:background .15s,border-color .15s}
.fx-ask-chips button:hover{border-color:var(--ink)}
.fx-ask-chips button.on{background:var(--cobalt);border-color:var(--cobalt);color:#fff}
.fx-ask-answer{margin:12px 0 0;padding:12px 14px;background:var(--mist);border-left:3px solid var(--cobalt);border-radius:4px 10px 10px 4px;font-size:14px;line-height:1.5;min-height:48px}

/* ── businesses directory ── */
.fx-biz{padding:108px 0 80px;background:var(--paper);border-bottom:1px solid var(--rule-2)}
.fx-biz-top{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;flex-wrap:wrap;margin-bottom:60px}
.fx-biz-top .fx-head{flex:1 1 440px}
.fx-biz-top .fx-head p{margin-bottom:0}
.fx-biz-filter{display:inline-flex;padding:4px;border:1px solid var(--rule-2);border-radius:999px;background:var(--mist);gap:2px}
.fx-biz-filter button{border:0;background:transparent;padding:9px 16px;border-radius:999px;font-weight:600;font-size:14px;color:var(--muted);transition:background .15s,color .15s}
.fx-biz-filter button:hover{color:var(--ink)}
.fx-biz-filter button.on{background:var(--ink);color:#fff}
.fx-biz-cols{columns:3;column-gap:60px}
.fx-biz-group{break-inside:avoid;margin:0 0 44px}
.fx-biz-group h3{
  display:flex;justify-content:space-between;align-items:baseline;
  font:700 22px/1.1 var(--display);letter-spacing:-.02em;margin:0;padding-bottom:12px;border-bottom:2px solid var(--ink);
}
.fx-biz-group h3 span{font:600 13px var(--body);color:var(--muted);letter-spacing:0}
.fx-biz-group ul{list-style:none;margin:0;padding:0}
.fx-biz-group li{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:12px 0;border-bottom:1px solid var(--rule);font-weight:500;font-size:16px;transition:opacity .25s ease;
}
.fx-biz-group li.dim{opacity:.22}
.fx-biz-name{min-width:0}
.fx-biz-tag{flex:none;max-width:52%;text-align:right;font-size:12px;font-weight:600;line-height:1.3;padding:4px 10px;border-radius:999px;background:#FFF0C7;color:#7A5200}
.fx-biz-tag.soon{background:var(--mist);color:var(--muted)}

/* ── sections ── */
.fx-section{padding:108px 0}
.fx-mist{background:var(--mist);border-bottom:1px solid var(--rule-2)}
.fx-head{max-width:640px}
.fx-head h2,.fx-login-copy h2{font:800 clamp(34px,4.4vw,58px)/1 var(--display);letter-spacing:-.032em;margin:0 0 18px}
.fx-head p{font-size:17px;line-height:1.65;color:var(--muted);margin:0 0 22px}
.fx-link{color:var(--cobalt);font-weight:600;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:5px}
.fx-link:hover{color:var(--cobalt-d)}

/* feature list + stage */
.fx-feat{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:64px;margin-top:56px;align-items:start}
.fx-feat>*{min-width:0}
.fx-feat-list{border-top:1px solid var(--rule-2)}
.fx-feat-item{border-bottom:1px solid var(--rule-2)}
.fx-feat-head{
  width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;
  background:none;border:0;padding:24px 2px;text-align:left;color:var(--muted);
  font:700 clamp(24px,2.6vw,34px)/1.1 var(--display);letter-spacing:-.025em;transition:color .2s;
}
.fx-feat-head:hover{color:var(--ink)}
.fx-feat-item.on .fx-feat-head{color:var(--ink)}
.fx-plus{position:relative;flex:none;width:34px;height:34px;border:1px solid var(--rule-2);border-radius:50%;transition:transform .3s ease,background .2s,border-color .2s}
.fx-plus::before,.fx-plus::after{content:"";position:absolute;left:50%;top:50%;width:12px;height:1.5px;background:currentColor;transform:translate(-50%,-50%)}
.fx-plus::after{transform:translate(-50%,-50%) rotate(90deg)}
.fx-feat-item.on .fx-plus{transform:rotate(45deg);background:var(--ink);border-color:var(--ink);color:#fff}
.fx-feat-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
.fx-feat-more>div{overflow:hidden;visibility:hidden;transition:visibility 0s linear .35s}
.fx-feat-item.on .fx-feat-more{grid-template-rows:1fr}
.fx-feat-item.on .fx-feat-more>div{visibility:visible;transition-delay:0s}
.fx-feat-headline{font:700 19px/1.3 var(--body);margin:0 0 10px;color:var(--ink)}
.fx-feat-desc{margin:0 0 16px;color:var(--muted);max-width:520px}
.fx-feat-points{list-style:none;padding:0;margin:0 0 22px;display:flex;flex-wrap:wrap;gap:6px 20px}
.fx-feat-points li{font-size:14px;font-weight:600}
.fx-feat-points li::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--cobalt);margin-right:8px;vertical-align:middle}
.fx-feat-more .fx-link{display:inline-block;margin-bottom:28px}
.fx-feat-inline{display:none}
.fx-feat-stage{
  position:sticky;top:100px;min-height:440px;display:grid;place-items:center;padding:32px;
  background-color:#fff;border:1px solid var(--rule-2);border-radius:26px;box-shadow:var(--shadow-m);
  background-image:linear-gradient(var(--rule) 1px,transparent 1px),linear-gradient(90deg,var(--rule) 1px,transparent 1px);
  background-size:30px 30px;background-position:-1px -1px;
}
.fx-stage-inner{width:100%;animation:fxSwap .35s ease both}
@keyframes fxSwap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.fx-vis{width:100%}
.fx-vis-bill{display:flex;flex-direction:column;gap:16px;align-items:center}
.fx-mini-receipt{width:min(290px,100%);background:#fff;border:1px solid var(--rule-2);padding:16px;font:13px var(--receipt);box-shadow:var(--shadow-m);transform:rotate(-1.5deg)}
.fx-mini-receipt b{display:block;border-bottom:1px dashed var(--ink);padding-bottom:7px;margin-bottom:7px}
.fx-mini-receipt div{display:flex;justify-content:space-between;padding:3px 0}
.fx-mini-receipt .t{border-top:1px dashed var(--ink);margin-top:7px;padding-top:8px;font-weight:700}
.fx-pay{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;background:#fff;padding:6px 8px 6px 14px;border:1px solid var(--rule-2);border-radius:999px}
.fx-pay i{font-style:normal;border-radius:999px;padding:4px 12px;color:var(--muted)}
.fx-pay i.on{background:var(--mint);color:#fff}
.fx-vis-stock{display:flex;flex-direction:column;gap:16px;background:#fff;border:1px solid var(--rule-2);border-radius:18px;padding:22px;box-shadow:var(--shadow-s)}
.fx-stock-row{display:grid;grid-template-columns:116px 1fr 66px;gap:12px;align-items:center;font-size:13px;font-weight:600}
.fx-meter{height:10px;border-radius:999px;background:var(--mist);overflow:hidden}
.fx-meter i{display:block;height:100%;border-radius:999px;background:var(--mint)}
.fx-meter i.low{background:var(--coral)}
.fx-stock-row em{font-style:normal;color:var(--mint);text-align:right}
.fx-stock-row em.low{color:var(--coral)}
.fx-vis-qr{display:flex;align-items:center;justify-content:center;gap:26px;flex-wrap:wrap}
.fx-qr-code{display:grid;grid-template-columns:repeat(7,1fr);width:128px;height:128px;padding:10px;background:#fff;border:1px solid var(--rule-2);border-radius:14px;gap:2px;box-shadow:var(--shadow-s)}
.fx-qr-code i{background:#EEF0FA;border-radius:1px}
.fx-qr-code i.k{background:var(--ink)}
.fx-phone{width:176px;background:var(--ink);color:#fff;border-radius:26px;padding:18px 15px;box-shadow:var(--shadow-m)}
.fx-phone b{display:block;font-size:13px;margin-bottom:10px}
.fx-phone div{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid #3A3870;font-size:12px}
.fx-phone i{font-style:normal;background:var(--gold);color:var(--ink);border-radius:6px;padding:2px 9px;font-weight:700}
.fx-phone u{display:block;text-decoration:none;text-align:center;background:var(--cobalt);border-radius:10px;padding:9px;margin-top:11px;font-size:12px;font-weight:700}
.fx-vis-exp{background:#fff;border:1px solid var(--rule-2);border-radius:18px;padding:22px;box-shadow:var(--shadow-s)}
.fx-vis-exp p{margin:0 0 16px;font-size:13px;color:var(--muted);font-weight:600}
.fx-exp-row{margin-bottom:16px;font-size:13px;font-weight:600}
.fx-exp-row:last-child{margin-bottom:0}
.fx-exp-row span{display:block;margin-bottom:6px}
.fx-exp-row i{display:block;height:12px;background:var(--cobalt);border-radius:999px}
.fx-exp-row:nth-child(3) i{background:var(--gold)}
.fx-exp-row:nth-child(4) i{background:#8E96F5}
.fx-exp-row:nth-child(5) i{background:var(--coral)}
.fx-vis-ai{display:flex;flex-direction:column;gap:10px}
.fx-vis-ai .u,.fx-chat .u{align-self:flex-end;max-width:82%;background:var(--cobalt);color:#fff;padding:11px 15px;border-radius:18px 18px 4px 18px;font-size:14px;font-weight:600}
.fx-vis-ai .b,.fx-chat .b{max-width:92%;background:#fff;border:1px solid var(--rule-2);padding:13px 15px;border-radius:18px 18px 18px 4px;font-size:14px;line-height:1.5;box-shadow:var(--shadow-s)}
.fx-vis-ai .b b,.fx-chat .b b{display:block;margin-bottom:3px}

/* workflow */
.fx-dark{background:var(--ink);color:#fff}
.fx-dark .fx-head p{color:#B4B6E2}
.fx-dark .fx-note{font-size:14px;margin:16px 0 0}
.fx-flow-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:72px;align-items:center}
.fx-flow-grid>*{min-width:0}
.fx-receipt-wrap{filter:drop-shadow(0 30px 34px rgba(0,0,0,.4))}
.fx-receipt{
  background:#fff;color:var(--ink);font-family:var(--receipt);padding:40px 32px 48px;
  -webkit-mask:linear-gradient(#000 0 0) center/100% calc(100% - 16px) no-repeat,
    conic-gradient(from 135deg at top,#0000,#000 1deg 89deg,#0000 90deg) top/16px 8px repeat-x,
    conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/16px 8px repeat-x;
  mask:linear-gradient(#000 0 0) center/100% calc(100% - 16px) no-repeat,
    conic-gradient(from 135deg at top,#0000,#000 1deg 89deg,#0000 90deg) top/16px 8px repeat-x,
    conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/16px 8px repeat-x;
}
.fx-receipt-head{text-align:center;padding-bottom:16px;border-bottom:1px dashed var(--ink)}
.fx-receipt-head strong{display:block;font:700 22px var(--receipt);letter-spacing:.02em}
.fx-receipt-head span{font-size:13px;color:#4D4A73}
.fx-steps{list-style:none;margin:0;padding:0}
.fx-steps li{display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px dashed var(--ink)}
.fx-step-n{flex:none;width:32px;height:32px;display:grid;place-items:center;background:var(--ink);color:var(--gold);border-radius:50%;font:700 14px var(--receipt)}
.fx-step-body{min-width:0}
.fx-step-body h3{margin:0;font:700 17px var(--receipt)}
.fx-step-body p{margin:3px 0 0;font:400 13px/1.45 var(--receipt);color:#4D4A73}
.fx-leader{flex:1;min-width:12px;border-bottom:2px dotted #9391C4;align-self:flex-end;margin-bottom:6px}
.fx-step-time{flex:none;font-weight:700;font-size:14px}
.fx-receipt-foot{text-align:center;padding-top:18px;font-size:13px;color:#4D4A73}

/* ai */
.fx-ai-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:72px;align-items:center}
.fx-ai-grid>*{min-width:0}
.fx-ask-list{list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:8px}
.fx-ask-list li{background:#fff;border:1px solid var(--rule-2);border-radius:14px;padding:13px 18px;font-weight:600;box-shadow:var(--shadow-s);width:fit-content;max-width:100%}
.fx-ask-list li:nth-child(2){margin-left:24px}
.fx-ask-list li:nth-child(3){margin-left:48px}
.fx-chat{background:#fff;border:1px solid var(--rule-2);border-radius:26px;box-shadow:var(--shadow-l);overflow:hidden}
.fx-chat-bar{display:flex;justify-content:space-between;align-items:center;background:var(--ink);color:#fff;font-weight:700;padding:14px 20px}
.fx-chat-bar small{font-weight:500;color:#A9ABD9;font-size:12px}
.fx-chat-body{padding:24px;min-height:320px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px;background:var(--mist)}
.fx-chat-bars{margin-top:12px;display:flex;flex-direction:column;gap:9px}
.fx-chat-bars div{display:grid;grid-template-columns:74px 1fr 62px;gap:10px;align-items:center;font-size:12px;font-weight:600}
.fx-chat-bars i{display:block;height:9px;border-radius:999px;background:var(--cobalt)}
.fx-chat-bars div:nth-child(2) i{background:#7C86F6}
.fx-chat-bars div:nth-child(3) i{background:#B3B9FA}
.fx-chat-bars em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums}
.fx-chat-input{background:#fff;border:1px solid var(--rule-2);border-radius:999px;padding:13px 18px;font-size:14px;color:#77749D}

/* login */
.fx-login{
  background-color:var(--cobalt);padding:108px 0;
  background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);
  background-size:52px 52px;
}
.fx-login-grid{display:grid;grid-template-columns:minmax(0,1fr) 450px;gap:80px;align-items:center}
.fx-login-grid>*{min-width:0}
.fx-login-copy{color:#fff}
.fx-login-copy p{font-size:18px;line-height:1.65;color:#DCDEFB;max-width:480px;margin:0 0 26px}
.fx-login-copy ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px}
.fx-login-copy li{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.4);border-radius:999px;padding:8px 16px;font-weight:600;font-size:14px}
.fx-login-card{background:#fff;border-radius:26px;padding:34px;box-shadow:0 4px 10px rgba(10,12,70,.15),0 50px 90px -30px rgba(10,12,70,.65);color:var(--ink)}
.fx-login-card h3{font:800 30px/1.1 var(--display);letter-spacing:-.03em;margin:0 0 6px}
.fx-login-sub{margin:0 0 18px;color:var(--muted);font-size:15px}
.fx-not-you{border:0;background:none;color:var(--cobalt);font-weight:600;font-size:14px;padding:0;margin:0 0 18px;text-decoration:underline;text-underline-offset:3px}
.fx-login-card form{display:flex;flex-direction:column;gap:14px}
.fx-login-card label{display:flex;flex-direction:column;gap:7px;font-weight:600;font-size:14px}
.fx-login-card input{
  width:100%;height:50px;border:1px solid var(--rule-2);border-radius:14px;padding:0 15px;font-size:15px;
  background:var(--mist);color:var(--ink);transition:border-color .15s, background .15s, box-shadow .15s;
}
.fx-login-card input:hover{border-color:var(--muted)}
.fx-login-card input:focus{outline:none;border-color:var(--cobalt);background:#fff;box-shadow:0 0 0 4px rgba(61,75,242,.16)}
.fx-login-card input[aria-invalid="true"]{border-color:var(--coral)}
.fx-pw-label{display:flex;justify-content:space-between;align-items:center}
.fx-pw-label a{color:var(--cobalt);font-size:13px;font-weight:600}
.fx-pw-wrap{position:relative;display:block}
.fx-pw-wrap input{padding-right:74px}
.fx-pw-wrap button{position:absolute;right:7px;top:7px;height:36px;padding:0 13px;border:0;background:#fff;border-radius:9px;font-weight:600;font-size:13px;color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-2)}
.fx-pw-wrap button:hover{box-shadow:inset 0 0 0 1px var(--ink)}
.fx-field-error{color:var(--coral);font-size:13px;font-weight:600;margin-top:-8px}
.fx-error{background:#FFF0ED;border:1px solid #F5B8AD;color:#9C2616;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:600}
.fx-submit{height:52px;border:0;border-radius:999px;background:var(--ink);color:#fff;font-weight:700;font-size:16px;box-shadow:0 14px 28px -14px rgba(21,19,58,.8);transition:transform .15s, background .15s}
.fx-submit:hover:not(:disabled){background:var(--ink-2);transform:translateY(-1px)}
.fx-submit:disabled,.fx-google:disabled,.fx-demo-btn:disabled{opacity:.6}
.fx-or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px;font-weight:600}
.fx-or span{flex:1;height:1px;background:var(--rule-2)}
.fx-google{height:50px;border:1px solid var(--rule-2);border-radius:999px;background:#fff;font-weight:600;font-size:15px;color:var(--ink);transition:border-color .15s}
.fx-google:hover:not(:disabled){border-color:var(--ink)}
.fx-demo-btn{border:0;background:none;color:var(--cobalt);font-weight:600;font-size:14px;padding:4px;text-decoration:underline;text-underline-offset:4px}
.fx-login-foot{display:flex;justify-content:center;gap:6px;margin-top:20px;font-size:14px;color:var(--muted)}
.fx-login-foot a{color:var(--cobalt);font-weight:600}

/* footer */
.fx-footer{background:var(--ink);padding:40px 0 48px}
.fx-footer-in{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.fx-footer nav{display:flex;flex-wrap:wrap;gap:6px 22px}
.fx-footer nav a{color:#B4B6E2;text-decoration:none;font-size:14px;font-weight:600;transition:color .15s}
.fx-footer nav a:hover{color:var(--gold)}

/* ── responsive ── */
@media(max-width:1000px){
  .fx-hero-grid,.fx-flow-grid,.fx-ai-grid,.fx-login-grid{grid-template-columns:1fr;gap:48px}
  .fx-feat{grid-template-columns:1fr;gap:0}
  .fx-feat-stage{display:none}
  .fx-feat-inline{display:block;margin:4px 0 22px}
  .fx-biz-cols{columns:2;column-gap:40px}
}
@media(max-width:700px){
  .fx-hero{padding:48px 0 64px}
  .fx-hero-grid::before{top:-48px;bottom:-64px;left:-14px}
  .fx-section,.fx-login{padding:68px 0}
  .fx-biz{padding:68px 0 40px}
  .fx-biz-top{margin-bottom:40px}
  .fx-biz-cols{columns:1}
  .fx-counter-grid{grid-template-columns:1fr}
  .fx-shelf{border-right:0;border-bottom:1px solid var(--rule)}
  .fx-shelf ul{max-height:280px}
  .fx-brand small{display:none}
  .fx-stock-row{grid-template-columns:96px 1fr 58px;gap:8px}
  .fx-receipt{padding:34px 20px 42px}
  .fx-steps li{flex-wrap:wrap}
  .fx-leader{display:none}
  .fx-step-time{margin-left:44px;font-size:13px}
  .fx-step-body{flex:1 1 60%}
  .fx-ask-list li:nth-child(2),.fx-ask-list li:nth-child(3){margin-left:0}
  .fx-login-card{padding:24px}
  .fx-chat-bars div{grid-template-columns:68px 1fr 58px}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *{animation:none !important;transition:none !important}
}
`;