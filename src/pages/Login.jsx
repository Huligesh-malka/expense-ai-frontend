import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";

const DEMO = { email: "demo@financepro.com", password: "password123" };
const LAST_EMAIL_KEY = "financepro_last_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const categories = [
  ["🛒", "Grocery & Kirana"],
  ["💊", "Medical stores"],
  ["👕", "Clothing & retail"],
  ["📱", "Electronics"],
  ["🥤", "Beverages"],
  ["🍞", "Bakery & dairy"],
  ["🔧", "Hardware"],
  ["🏪", "Other businesses"],
];

const features = [
  { icon: "🧾", title: "Fast billing", text: "Create customer bills, record payments and keep every sale organized." },
  { icon: "📦", title: "Smart inventory", text: "Track products, stock quantities, units and low-stock alerts." },
  { icon: "📊", title: "Business reports", text: "Understand sales, profit, expenses and your business performance." },
  { icon: "👥", title: "Customers", text: "Maintain customer details and keep sales history in one place." },
  { icon: "🛍️", title: "Purchases & suppliers", text: "Track purchases, suppliers and inventory coming into your shop." },
  { icon: "🤖", title: "AI Business Assistant", text: "Ask questions about your business data and get useful insights." },
];

const sampleProducts = [
  { name: "Rice · 5 kg", price: 365, stock: 12 },
  { name: "Toor Dal · 1 kg", price: 168, stock: 9 },
  { name: "Sunflower Oil · 1 L", price: 142, stock: 5 },
  { name: "Milk · 500 ml", price: 27, stock: 30 },
];

const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN");

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: (() => {
      try { return localStorage.getItem(LAST_EMAIL_KEY) || ""; }
      catch { return ""; }
    })(),
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [demoCart, setDemoCart] = useState({});
  const [demoSold, setDemoSold] = useState(0);

  const total = sampleProducts.reduce((sum, product, index) => {
    return sum + product.price * (demoCart[index] || 0);
  }, 0);
  const cartCount = Object.values(demoCart).reduce((sum, quantity) => sum + quantity, 0);
  const emailInvalid = emailTouched && formData.email && !EMAIL_RE.test(formData.email);

  const updateField = (key, value) => {
    setFormData((previous) => ({ ...previous, [key]: value }));
  };

  const finishLogin = (data) => {
    const { user, business, token } = data;
    login(user, token);

    try {
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.full_name || user.name || "");
      localStorage.setItem("userEmail", user.email || formData.email);
      localStorage.setItem(LAST_EMAIL_KEY, user.email || formData.email);
      if (business) {
        localStorage.setItem("businessId", business.id);
        localStorage.setItem("businessName", business.business_name);
        localStorage.setItem("businessType", business.business_type || "");
      }
    } catch {}

    if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (business) navigate("/dashboard", { replace: true });
    else navigate("/create-business", { replace: true });
  };

  const runAuth = async (kind, request, fallback) => {
    setPending(kind);
    setError("");
    try {
      const response = await request();
      if (response?.data?.success) finishLogin(response.data);
      else setError(response?.data?.message || fallback);
    } catch (err) {
      console.error(`${kind} login error:`, err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setError("Google sign-in was closed before it finished. Try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Your browser blocked the Google window. Allow popups and try again.");
      } else if (!err.response) {
        setError("Cannot reach the server. Check your internet connection and try again.");
      } else {
        setError(err.response?.data?.message || err.message || fallback);
      }
    } finally {
      setPending("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pending) return;
    if (!EMAIL_RE.test(formData.email)) {
      setEmailTouched(true);
      setError("Enter a valid email address.");
      return;
    }
    if (!formData.password) {
      setError("Enter your password.");
      return;
    }
    runAuth("email", () => API.post("/auth/login", formData), "Sign in failed. Please try again.");
  };

  const handleGoogleLogin = () => runAuth("google", async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    return API.post("/auth/google", { idToken });
  }, "Google sign-in failed. Please try again.");

  const handleDemoLogin = () => runAuth("demo", () => API.post("/auth/login", DEMO), "Demo account is unavailable right now.");

  const addDemoProduct = (index) => {
    const product = sampleProducts[index];
    if ((demoCart[index] || 0) >= product.stock) return;
    setDemoCart((previous) => ({ ...previous, [index]: (previous[index] || 0) + 1 }));
  };

  const removeDemoProduct = (index) => {
    setDemoCart((previous) => {
      const next = { ...previous };
      if (next[index] > 1) next[index] -= 1;
      else delete next[index];
      return next;
    });
  };

  const completeDemoSale = () => {
    if (!total) return;
    setDemoSold((previous) => previous + total);
    setDemoCart({});
  };

  return (
    <div className="fp-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        .fp-page{--ink:#14213d;--muted:#65748b;--blue:#4f46e5;--blue2:#3730a3;--light:#f5f7ff;--border:#e5eaf3;--green:#16a34a;font-family:'DM Sans',sans-serif;color:var(--ink);background:#fff;min-height:100vh}
        .fp-page *{box-sizing:border-box}.fp-wrap{width:min(1180px,calc(100% - 40px));margin:auto}
        .fp-nav{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f5;position:relative;z-index:5;background:#fff}
        .fp-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--ink)}.fp-logo{width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#6366f1,#3730a3);color:#fff;display:grid;place-items:center;font:800 22px Manrope;box-shadow:0 6px 16px #4f46e530}.fp-brand strong{font:800 19px Manrope;letter-spacing:-.5px}.fp-brand small{display:block;color:#7b8798;font-size:11px;margin-top:2px}
        .fp-navlinks{display:flex;gap:28px;align-items:center}.fp-navlinks a{font-size:14px;color:#64748b;text-decoration:none;font-weight:600}.fp-navlinks a:hover{color:var(--blue)}.fp-navactions{display:flex;align-items:center;gap:12px}.fp-loginlink{font-weight:700;color:var(--ink);text-decoration:none;font-size:14px}.fp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:11px;padding:12px 18px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid transparent;cursor:pointer;transition:.2s}.fp-primary{background:var(--blue);color:#fff;box-shadow:0 7px 15px #4f46e522}.fp-primary:hover{background:var(--blue2);transform:translateY(-1px)}.fp-outline{border-color:var(--border);color:var(--ink);background:#fff}.fp-outline:hover{background:#f8fafc}.fp-mobile-menu{display:none}
        .fp-hero{background:radial-gradient(circle at 85% 15%,#e0e7ff 0,transparent 35%),linear-gradient(180deg,#f9faff,#fff);padding:72px 0 60px;overflow:hidden}.fp-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center}.fp-eyebrow{display:inline-flex;align-items:center;gap:8px;background:#eef2ff;color:#4338ca;border:1px solid #dfe3ff;border-radius:99px;padding:7px 12px;font-size:12px;font-weight:800;letter-spacing:.4px}.fp-eyebrow i{width:7px;height:7px;border-radius:50%;background:#22c55e}.fp-hero h1{font:800 clamp(38px,5.2vw,64px)/1.08 Manrope;letter-spacing:-2.5px;margin:20px 0;color:#14213d}.fp-hero h1 span{color:var(--blue)}.fp-lead{font-size:17px;line-height:1.75;color:#617087;max-width:570px}.fp-hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin:27px 0 22px}.fp-trust{display:flex;flex-wrap:wrap;gap:16px;color:#68778c;font-size:12px;font-weight:600}.fp-trust span{display:flex;align-items:center;gap:6px}.fp-trust b{color:#16a34a}
        .fp-demo{background:#fff;border:1px solid #e3e8f2;border-radius:22px;box-shadow:0 24px 65px #23315b18;overflow:hidden;transform:rotate(.5deg)}.fp-demo-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #edf0f5;background:#fbfcff}.fp-demo-title{font-weight:800;font-size:14px}.fp-live{display:flex;align-items:center;gap:6px;color:#16a34a;font-size:11px;font-weight:800}.fp-live i{width:7px;height:7px;border-radius:50%;background:#22c55e}.fp-demo-body{display:grid;grid-template-columns:1fr 1fr}.fp-products{padding:18px;border-right:1px solid #edf0f5}.fp-products h4,.fp-bill h4{margin:0 0 13px;font-size:12px;color:#66758b;text-transform:uppercase;letter-spacing:.6px}.fp-product{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:11px 0;border-bottom:1px solid #f0f2f6}.fp-product:last-child{border-bottom:0}.fp-product-name{font-size:12px;font-weight:700}.fp-product-stock{display:block;color:#8a96a8;font-size:10px;margin-top:3px}.fp-product-price{font-size:12px;font-weight:800}.fp-add{border:1px solid #e0e7ff;background:#eef2ff;color:#4f46e5;border-radius:8px;width:26px;height:26px;font-weight:800;cursor:pointer}.fp-bill{padding:18px}.fp-bill-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:8px 0;border-bottom:1px solid #f0f2f6}.fp-qty{display:flex;align-items:center;gap:5px}.fp-qty button{width:20px;height:20px;border:1px solid #e2e8f0;background:#fff;border-radius:5px;cursor:pointer}.fp-total{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px dashed #d9dfeb;font-weight:800}.fp-total strong{font-size:20px;color:var(--blue)}.fp-demo-actions{display:flex;gap:7px;margin-top:12px}.fp-demo-actions button{flex:1;padding:9px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-size:11px;font-weight:800;cursor:pointer}.fp-demo-actions button:last-child{background:#f1f5f9;color:#64748b}.fp-demo-actions button:disabled{opacity:.45;cursor:not-allowed}.fp-sold{background:#f0fdf4;border:1px solid #dcfce7;padding:10px 14px;border-radius:10px;margin:14px 18px 18px;font-size:12px;color:#15803d;font-weight:700;display:flex;justify-content:space-between}
        .fp-categories{padding:32px 0;border-top:1px solid #f0f2f7;border-bottom:1px solid #f0f2f7}.fp-cat-heading{text-align:center;color:#8a96a8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px}.fp-categories-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.fp-category{display:flex;align-items:center;gap:11px;padding:14px;border:1px solid #edf0f5;border-radius:13px;background:#fff}.fp-category-icon{width:38px;height:38px;display:grid;place-items:center;background:#f5f7ff;border-radius:11px;font-size:20px}.fp-category strong{font-size:12px}
        .fp-section{padding:76px 0}.fp-section-head{text-align:center;max-width:690px;margin:0 auto 40px}.fp-kicker{color:var(--blue);font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase}.fp-section h2{font:800 clamp(28px,3.5vw,42px)/1.2 Manrope;letter-spacing:-1.3px;margin:12px 0}.fp-section-head p{color:var(--muted);font-size:15px;line-height:1.7;margin:0}.fp-features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.fp-feature{padding:25px;border:1px solid var(--border);border-radius:17px;background:#fff;transition:.2s}.fp-feature:hover{transform:translateY(-4px);box-shadow:0 14px 30px #1725540b;border-color:#c7d2fe}.fp-feature-icon{width:48px;height:48px;display:grid;place-items:center;background:#f0f3ff;border-radius:14px;font-size:23px}.fp-feature h3{font:800 17px Manrope;margin:18px 0 8px}.fp-feature p{color:#718096;font-size:13px;line-height:1.65;margin:0}
        .fp-workflow{background:#f8faff}.fp-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.fp-step{padding:22px;background:#fff;border:1px solid #e6eaf3;border-radius:15px}.fp-step-number{width:32px;height:32px;border-radius:10px;background:#eef2ff;color:#4f46e5;display:grid;place-items:center;font-weight:800;font-size:13px}.fp-step h3{font:800 15px Manrope;margin:14px 0 6px}.fp-step p{font-size:12px;color:#718096;line-height:1.6;margin:0}
        .fp-login-section{padding:78px 0;background:linear-gradient(135deg,#3730a3,#4f46e5 60%,#6366f1);position:relative;overflow:hidden}.fp-login-section:before{content:"";position:absolute;inset:0;background-image:radial-gradient(#ffffff22 1px,transparent 1px);background-size:20px 20px}.fp-login-grid{position:relative;display:grid;grid-template-columns:1fr 430px;gap:60px;align-items:center}.fp-login-copy{color:#fff}.fp-login-copy h2{font:800 clamp(32px,4vw,48px)/1.15 Manrope;letter-spacing:-1.4px;margin:0 0 18px}.fp-login-copy p{color:#dfe2ff;font-size:16px;line-height:1.7;max-width:520px}.fp-login-copy ul{list-style:none;padding:0;margin:25px 0;display:grid;gap:12px}.fp-login-copy li{display:flex;align-items:center;gap:10px;color:#f5f6ff;font-weight:600;font-size:14px}.fp-login-copy li span{width:23px;height:23px;display:grid;place-items:center;background:#ffffff20;border-radius:7px}.fp-login-card{background:#fff;border:1px solid #e4e8f2;border-radius:20px;padding:28px;box-shadow:0 22px 60px #11182730}.fp-login-card h3{font:800 25px Manrope;margin:0 0 6px}.fp-login-sub{color:#718096;font-size:13px;margin:0 0 20px}.fp-login-card form{display:grid;gap:13px}.fp-login-card label{display:grid;gap:7px;font-size:12px;font-weight:800;color:#354258}.fp-login-card input{height:46px;width:100%;border:1px solid #dce3ed;border-radius:10px;padding:0 12px;font:14px 'DM Sans';outline:none}.fp-login-card input:focus{border-color:#6366f1;box-shadow:0 0 0 3px #6366f120}.fp-password{position:relative}.fp-password input{padding-right:64px}.fp-password button{position:absolute;right:7px;top:7px;border:0;background:#f1f5f9;border-radius:7px;padding:7px 9px;font-size:11px;font-weight:800;color:#64748b;cursor:pointer}.fp-error{background:#fff1f2;color:#be123c;border:1px solid #fecdd3;border-radius:9px;padding:10px 12px;font-size:12px;font-weight:600}.fp-submit{height:47px;border:0;border-radius:10px;background:#4f46e5;color:#fff;font-weight:800;cursor:pointer}.fp-submit:disabled{opacity:.6;cursor:not-allowed}.fp-divider{display:flex;align-items:center;gap:12px;color:#9aa4b2;font-size:11px;margin:4px 0}.fp-divider:before,.fp-divider:after{content:"";height:1px;background:#e5eaf1;flex:1}.fp-google{height:45px;border:1px solid #dce3ed;background:#fff;border-radius:10px;font-weight:700;color:#344054;cursor:pointer}.fp-google:hover{background:#f8fafc}.fp-demo{display:block;width:100%;border:0;background:transparent;color:#4f46e5;font-weight:800;font-size:12px;padding:13px 0 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.fp-register{text-align:center;color:#718096;font-size:12px;margin:17px 0 0}.fp-register a{color:#4f46e5;font-weight:800;text-decoration:none}.fp-footer{padding:28px 0;background:#111b35;color:#c5cce0}.fp-footer-inner{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}.fp-footer-brand{display:flex;align-items:center;gap:10px}.fp-footer-brand .fp-logo{background:#4f46e5}.fp-footer-brand strong{color:#fff}.fp-footer small{color:#9ba7bf}.fp-footer-links{display:flex;gap:18px}.fp-footer-links a{font-size:12px;color:#c5cce0;text-decoration:none}.fp-footer-links a:hover{color:#fff}
        @media(max-width:900px){.fp-hero-grid,.fp-login-grid{grid-template-columns:1fr;gap:38px}.fp-hero-grid{max-width:850px}.fp-demo{max-width:620px;margin:auto;width:100%}.fp-login-grid{max-width:800px}.fp-login-card{max-width:480px;width:100%;margin:auto}.fp-features{grid-template-columns:repeat(2,1fr)}.fp-steps{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:650px){.fp-wrap{width:min(100% - 28px,1180px)}.fp-nav{height:66px}.fp-navlinks,.fp-loginlink{display:none}.fp-navactions .fp-btn{padding:10px 12px;font-size:12px}.fp-hero{padding:46px 0 38px}.fp-hero h1{letter-spacing:-1.7px}.fp-lead{font-size:15px}.fp-hero-actions .fp-btn{flex:1}.fp-trust{gap:10px}.fp-demo-body{grid-template-columns:1fr}.fp-products{border-right:0;border-bottom:1px solid #edf0f5}.fp-bill{padding-top:12px}.fp-categories-grid{grid-template-columns:repeat(2,1fr)}.fp-category{padding:10px}.fp-category strong{font-size:11px}.fp-section{padding:55px 0}.fp-section-head{margin-bottom:28px}.fp-features{grid-template-columns:1fr}.fp-feature{padding:20px}.fp-steps{grid-template-columns:1fr}.fp-login-section{padding:55px 0}.fp-login-card{padding:22px}.fp-login-copy h2{font-size:34px}.fp-footer-inner{align-items:flex-start;flex-direction:column}.fp-footer-links{flex-wrap:wrap}}
      `}</style>

      <header className="fp-nav fp-wrap">
        <Link to="/" className="fp-brand">
          <span className="fp-logo">F</span>
          <span><strong>FinancePro</strong><small>Business management</small></span>
        </Link>
        <nav className="fp-navlinks">
          <a href="#features">Features</a>
          <a href="#businesses">Businesses</a>
          <a href="#workflow">How it works</a>
        </nav>
        <div className="fp-navactions">
          <a href="#login" className="fp-loginlink">Login</a>
          <Link to="/register" className="fp-btn fp-primary">Create business →</Link>
        </div>
      </header>

      <main>
        <section className="fp-hero">
          <div className="fp-wrap fp-hero-grid">
            <div>
              <div className="fp-eyebrow"><i /> ONE WORKSPACE FOR YOUR BUSINESS</div>
              <h1>Run your shop.<br />Know your <span>numbers.</span></h1>
              <p className="fp-lead">Billing, inventory, purchases, customers, expenses and business reports—together in one simple platform built for Indian businesses.</p>
              <div className="fp-hero-actions">
                <Link to="/register" className="fp-btn fp-primary">Start your business free →</Link>
                <a href="#login" className="fp-btn fp-outline">Sign in</a>
              </div>
              <div className="fp-trust"><span><b>✓</b> Simple setup</span><span><b>✓</b> Secure workspace</span><span><b>✓</b> Built for shop owners</span></div>
            </div>

            <div className="fp-demo" aria-label="Interactive billing demonstration">
              <div className="fp-demo-head"><span className="fp-demo-title">Quick billing demo</span><span className="fp-live"><i /> LIVE DEMO</span></div>
              <div className="fp-demo-body">
                <div className="fp-products">
                  <h4>Tap products to add</h4>
                  {sampleProducts.map((product, index) => (
                    <div className="fp-product" key={product.name}>
                      <div><span className="fp-product-name">{product.name}</span><span className="fp-product-stock">{product.stock} in stock</span></div>
                      <span className="fp-product-price">{money(product.price)}</span>
                      <button className="fp-add" onClick={() => addDemoProduct(index)} type="button" aria-label={`Add ${product.name}`}>+</button>
                    </div>
                  ))}
                </div>
                <div className="fp-bill">
                  <h4>Current bill · {cartCount} items</h4>
                  {cartCount === 0 ? <p style={{color:"#9aa4b2",fontSize:12,lineHeight:1.6}}>Your bill appears here as you add products.</p> : sampleProducts.map((product,index) => demoCart[index] ? (
                    <div className="fp-bill-row" key={product.name}><span>{product.name}</span><span className="fp-qty"><button onClick={() => removeDemoProduct(index)} type="button">−</button>{demoCart[index]}<button onClick={() => addDemoProduct(index)} type="button">+</button></span><strong>{money(product.price * demoCart[index])}</strong></div>
                  ) : null)}
                  <div className="fp-total"><span>Total</span><strong>{money(total)}</strong></div>
                  <div className="fp-demo-actions"><button onClick={completeDemoSale} disabled={!total} type="button">Complete sale</button><button onClick={() => setDemoCart({})} disabled={!total} type="button">Clear</button></div>
                </div>
              </div>
              <div className="fp-sold"><span>Demo sales completed</span><strong>{money(demoSold)}</strong></div>
            </div>
          </div>
        </section>

        <section className="fp-categories" id="businesses">
          <div className="fp-wrap"><div className="fp-cat-heading">Designed for different types of businesses</div><div className="fp-categories-grid">
            {categories.map(([icon,label]) => <div className="fp-category" key={label}><span className="fp-category-icon">{icon}</span><strong>{label}</strong></div>)}
          </div></div>
        </section>

        <section className="fp-section" id="features">
          <div className="fp-wrap"><div className="fp-section-head"><span className="fp-kicker">Everything in one place</span><h2>More than just billing software</h2><p>Manage the daily work of your business from one workspace. Spend less time maintaining records and more time serving customers.</p></div>
            <div className="fp-features">{features.map((feature) => <article className="fp-feature" key={feature.title}><div className="fp-feature-icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
          </div>
        </section>

        <section className="fp-section fp-workflow" id="workflow">
          <div className="fp-wrap"><div className="fp-section-head"><span className="fp-kicker">Get started simply</span><h2>Start using it in minutes</h2><p>No complicated setup. Create your business, add products and begin billing.</p></div>
            <div className="fp-steps"><article className="fp-step"><span className="fp-step-number">1</span><h3>Create your business</h3><p>Enter your shop name and business type to set up your workspace.</p></article><article className="fp-step"><span className="fp-step-number">2</span><h3>Add products</h3><p>Add names, prices, units, categories and your opening stock.</p></article><article className="fp-step"><span className="fp-step-number">3</span><h3>Start billing</h3><p>Create bills, record payments and manage customer sales.</p></article><article className="fp-step"><span className="fp-step-number">4</span><h3>Track your business</h3><p>Review stock, purchases, expenses and reports as you grow.</p></article></div>
          </div>
        </section>

        <section className="fp-login-section" id="login">
          <div className="fp-wrap fp-login-grid">
            <div className="fp-login-copy"><h2>Your business workspace<br />is ready to grow.</h2><p>Sign in to continue managing your products, bills, customers, inventory and business performance.</p><ul><li><span>✓</span>Billing and sales management</li><li><span>✓</span>Inventory and low-stock tracking</li><li><span>✓</span>Purchases, suppliers and expenses</li><li><span>✓</span>Reports and AI business insights</li></ul></div>
            <div className="fp-login-card">
              <h3>Welcome back</h3><p className="fp-login-sub">Sign in to your FinancePro workspace</p>
              <form onSubmit={handleSubmit}>
                <label>Email address<input type="email" autoComplete="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} onBlur={() => setEmailTouched(true)} placeholder="you@example.com" aria-invalid={Boolean(emailInvalid)} /></label>
                {emailInvalid && <div className="fp-error">Enter a valid email address.</div>}
                <label>Password<div className="fp-password"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={formData.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></div></label>
                {error && <div className="fp-error" role="alert">{error}</div>}
                <button className="fp-submit" type="submit" disabled={Boolean(pending)}>{pending === "email" ? "Signing in…" : "Sign in to workspace"}</button>
              </form>
              <div className="fp-divider">OR</div>
              <button className="fp-google" type="button" onClick={handleGoogleLogin} disabled={Boolean(pending)}>{pending === "google" ? "Connecting to Google…" : "Continue with Google"}</button>
              <button className="fp-demo" type="button" onClick={handleDemoLogin} disabled={Boolean(pending)}>{pending === "demo" ? "Opening demo…" : "Explore with demo account"}</button>
              <p className="fp-register">New to FinancePro? <Link to="/register">Create your business</Link></p>
            </div>
          </div>
        </section>
      </main>

      <footer className="fp-footer"><div className="fp-wrap fp-footer-inner"><div className="fp-footer-brand"><span className="fp-logo">F</span><div><strong>FinancePro</strong><br /><small>Business management for Indian shops</small></div></div><div className="fp-footer-links"><a href="#features">Features</a><a href="#businesses">Businesses</a><a href="#workflow">How it works</a><a href="#login">Login</a></div><small>© {new Date().getFullYear()} FinancePro</small></div></footer>
    </div>
  );
}
