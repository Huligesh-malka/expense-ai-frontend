
const base = {
  page: {
    minHeight: "100vh",
    background: "#F7F8F5",
    color: "#101C2C",
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    padding: "14px 5vw",
    background: "rgba(247,248,245,.90)",
    backdropFilter: "blur(18px)",
    borderBottom: "1px solid #E3E7E0",
  },
  brandWrap: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#101C2C" },
  brandMark: {
    width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center",
    background: "#1F6F54", color: "#F4E8C7", fontFamily: "Georgia,serif",
    fontStyle: "italic", fontWeight: 700, fontSize: 22,
  },
  brand: { fontFamily: "Georgia,serif", fontStyle: "italic", fontWeight: 700, fontSize: 23, lineHeight: 1 },
  brandSub: { display: "block", marginTop: 4, color: "#8A938D", fontFamily: "monospace", fontSize: 8, letterSpacing: "1.3px" },
  navLinks: { display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" },
  link: {
    textDecoration: "none", color: "#445064", padding: "9px 12px", borderRadius: 9,
    fontSize: 13, fontWeight: 650, transition: "all .2s ease",
  },
  primary: {
    textDecoration: "none", background: "#2E5BFF", color: "#fff", padding: "11px 17px",
    borderRadius: 10, fontWeight: 700, fontSize: 13, display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 8px 20px rgba(46,91,255,.14)",
  },
  container: { width: "min(1120px,92vw)", margin: "0 auto" },
  hero: {
    padding: "76px 0 66px", display: "grid", gridTemplateColumns: "1.03fr .97fr",
    gap: 55, alignItems: "center",
  },
  eyebrow: {
    display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 11px",
    borderRadius: 999, background: "#E8F4ED", color: "#1F6F54",
    fontSize: 10, fontWeight: 800, letterSpacing: "1.1px", textTransform: "uppercase",
  },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#27A56A" },
  h1: {
    fontFamily: "Georgia,serif", fontStyle: "italic", fontWeight: 700,
    fontSize: "clamp(43px,6vw,70px)", lineHeight: 1.02, margin: "19px 0",
    letterSpacing: "-2.6px",
  },
  accent: { color: "#C59D23" },
  lead: { color: "#5D6878", fontSize: 17, lineHeight: 1.72, maxWidth: 650, margin: 0 },
  actions: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 },
  secondary: {
    textDecoration: "none", color: "#101C2C", background: "#fff",
    border: "1px solid #DCE1D8", padding: "11px 17px", borderRadius: 10,
    fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center",
  },
  mock: {
    background: "linear-gradient(145deg,#0D1929,#182B41)", borderRadius: 24,
    padding: 16, boxShadow: "0 28px 70px rgba(16,28,44,.20)",
    border: "1px solid rgba(255,255,255,.07)",
  },
  mockTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    color: "#B9C5D2", fontSize: 9, padding: "5px 5px 13px",
    fontFamily: "monospace", letterSpacing: "1px",
  },
  live: { color: "#76D7A6", fontSize: 9 },
  screen: { background: "#F8FAF7", borderRadius: 16, padding: 16 },
  cards: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 },
  stat: { background: "#fff", border: "1px solid #E5E9E2", borderRadius: 11, padding: 13 },
  statLabel: { color: "#718096", fontSize: 9, fontFamily: "monospace", letterSpacing: ".5px" },
  statValue: { fontSize: 19, fontWeight: 800, marginTop: 7 },
  statNote: { display: "block", marginTop: 4, color: "#8993A0", fontSize: 9 },
  section: { padding: "76px 0" },
  kicker: { color: "#C59D23", fontFamily: "monospace", fontSize: 10, fontWeight: 700, letterSpacing: "1.4px" },
  sectionTitle: {
    fontFamily: "Georgia,serif", fontStyle: "italic", fontWeight: 700,
    fontSize: "clamp(31px,4vw,46px)", lineHeight: 1.08, margin: "8px 0 12px",
    letterSpacing: "-1px",
  },
  sectionLead: { color: "#657083", lineHeight: 1.7, maxWidth: 760, margin: 0 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 15, marginTop: 31 },
  card: {
    position: "relative", background: "#fff", border: "1px solid #E1E6DE",
    borderRadius: 17, padding: 23, minHeight: 190,
    boxShadow: "0 8px 28px rgba(16,28,44,.045)",
    transition: "transform .2s ease, border-color .2s ease, box-shadow .2s ease",
  },
  number: { color: "#C59D23", fontFamily: "monospace", fontWeight: 800, fontSize: 11, letterSpacing: "1px" },
  cardTitle: { fontSize: 18, margin: "12px 0 8px", fontWeight: 750 },
  cardText: { color: "#687487", lineHeight: 1.65, fontSize: 13.5, margin: 0 },
  band: {
    background: "#101C2C", color: "#fff", borderRadius: 25, padding: "42px",
    margin: "10px 0 30px", boxShadow: "0 20px 55px rgba(16,28,44,.14)",
  },
  bandTitle: { fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "clamp(29px,4vw,43px)", margin: "9px 0 10px" },
  bandText: { color: "#C4CED9", lineHeight: 1.7, maxWidth: 720, margin: 0, fontSize: 14 },
  footer: {
    padding: "34px 0 55px", color: "#718096", fontSize: 12,
    borderTop: "1px solid #E3E6DF", marginTop: 35,
  },
};

const responsiveCss = `
  .fp-page-link:hover { color:#1F6F54 !important; background:#EEF4F0 !important; }
  .fp-primary:hover { transform:translateY(-1px); box-shadow:0 12px 25px rgba(46,91,255,.20) !important; }
  .fp-secondary:hover { border-color:#1F6F54 !important; color:#1F6F54 !important; }
  .fp-card:hover { transform:translateY(-4px); border-color:#C9A227 !important; box-shadow:0 16px 38px rgba(16,28,44,.09) !important; }
  @media(max-width:850px){
    .fp-hero{grid-template-columns:1fr!important;padding-top:52px!important}
    .fp-grid3{grid-template-columns:repeat(2,1fr)!important}
    .fp-navlinks{display:none!important}
    .fp-cards{grid-template-columns:1fr!important}
    .fp-band{padding:30px!important}
  }
  @media(max-width:560px){
    .fp-grid3{grid-template-columns:1fr!important}
    .fp-nav{padding:12px 4vw!important}
    .fp-hero{padding-bottom:45px!important}
    .fp-brand-sub{display:none!important}
  }
`;

const Nav = ({ active }) => (
  <>
    <style>{responsiveCss}</style>
    <nav className="fp-nav" style={base.nav}>
      <Link to="/" style={base.brandWrap}>
        <span style={base.brandMark}>F</span>
        <span>
          <span style={base.brand}>FinancePro</span>
          <span className="fp-brand-sub" style={base.brandSub}>AI BUSINESS MANAGEMENT</span>
        </span>
      </Link>
      <div className="fp-navlinks" style={base.navLinks}>
        <Link className="fp-page-link" to="/business-benefits" style={{...base.link, ...(active==="benefits" ? {color:"#1F6F54",background:"#EEF4F0"} : {})}}>Why FinancePro</Link>
        <Link className="fp-page-link" to="/how-it-works" style={{...base.link, ...(active==="how" ? {color:"#1F6F54",background:"#EEF4F0"} : {})}}>How it works</Link>
        <Link className="fp-page-link" to="/business-guide" style={{...base.link, ...(active==="guide" ? {color:"#1F6F54",background:"#EEF4F0"} : {})}}>Business guide</Link>
      </div>
      <Link className="fp-primary" to="/login" style={base.primary}>Sign in</Link>
    </nav>
  </>
);

import React from "react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  const steps = [
    ["01","Create your business","Register, add the business details and create the owner workspace."],
    ["02","Set up products and categories","Add products, prices, units, stock and categories that match the business."],
    ["03","Start selling","Use POS billing to create sales, record payments and keep sales history connected."],
    ["04","Keep stock updated","Sales and purchases feed the inventory workflow so the owner can see what needs attention."],
    ["05","Manage customers and suppliers","Keep business contacts and purchasing information organized with appropriate access."],
    ["06","Review reports and use AI","Understand business activity and ask questions using only data the account is authorized to access."],
  ];

  return (
    <div style={base.page}>
      <Nav active="how" />
      <main style={base.container}>
        <section className="fp-hero" style={base.hero}>
          <div>
            <span style={base.eyebrow}><span style={base.dot}/> Simple owner journey</span>
            <h1 style={base.h1}>From first setup to <span style={base.accent}>daily control.</span></h1>
            <p style={base.lead}>
              FinancePro is organized as a workflow. The owner sets up the business once,
              then uses the connected modules for daily operations and review.
            </p>
            <div style={base.actions}>
              <Link className="fp-primary" to="/register" style={base.primary}>Start your business →</Link>
              <Link className="fp-secondary" to="/business-benefits" style={base.secondary}>See the benefits</Link>
            </div>
          </div>

          <div style={base.mock}>
            <div style={base.mockTop}><span>SETUP FLOW</span><span>6 STEPS</span></div>
            <div style={base.screen}>
              {steps.slice(0,5).map(([n,t,d],i) => (
                <div key={n} style={{display:"flex",gap:13,padding:"12px 0",borderBottom:i===4?"none":"1px solid #E8ECE5"}}>
                  <div style={{...base.number,minWidth:25}}>{n}</div>
                  <div style={{flex:1}}>
                    <b style={{fontSize:13}}>{t}</b>
                    <div style={{fontSize:10.5,color:"#718096",lineHeight:1.45,marginTop:4}}>{d}</div>
                  </div>
                  <span style={{color:"#1F6F54",fontSize:14}}>✓</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={base.section}>
          <span style={base.kicker}>THE OWNER JOURNEY</span>
          <h2 style={base.sectionTitle}>Every step has a clear outcome.</h2>
          <p style={base.sectionLead}>
            The owner should know what to enter, what the platform does with it,
            and what action becomes possible next.
          </p>
          <div className="fp-grid3" style={base.grid3}>
            {steps.map(([n,t,d]) => (
              <article className="fp-card" key={n} style={base.card}>
                <div style={base.number}>{n}</div>
                <h3 style={base.cardTitle}>{t}</h3>
                <p style={base.cardText}>{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fp-band" style={base.band}>
          <span style={base.kicker}>KEEP IT SIMPLE</span>
          <h2 style={base.bandTitle}>The product should feel like a workflow, not a software manual.</h2>
          <p style={base.bandText}>
            Keep important actions easy to find: New Sale, Add Product, Record Expense,
            View Stock Alerts, Review Reports and Ask AI.
          </p>
        </section>

        <footer style={base.footer}>FinancePro • Owner onboarding and product education.</footer>
      </main>
    </div>
  );
}
