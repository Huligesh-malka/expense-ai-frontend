
const base = {
  page: { minHeight:"100vh", background:"#f7f8f5", color:"#101c2c", fontFamily:"'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  nav: { position:"sticky", top:0, zIndex:20, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 5vw", background:"rgba(247,248,245,.92)", backdropFilter:"blur(16px)", borderBottom:"1px solid #e3e6df" },
  brand: { fontFamily:"Georgia,serif", fontStyle:"italic", fontWeight:700, fontSize:24 },
  navLinks: { display:"flex", gap:8, flexWrap:"wrap" },
  link: { textDecoration:"none", color:"#445064", padding:"9px 12px", borderRadius:999, fontSize:13, fontWeight:600 },
  primary: { textDecoration:"none", background:"#1f6f54", color:"#fff", padding:"11px 17px", borderRadius:10, fontWeight:700, fontSize:14 },
  container: { width:"min(1120px,92vw)", margin:"0 auto" },
  hero: { padding:"84px 0 56px", display:"grid", gridTemplateColumns:"1.1fr .9fr", gap:48, alignItems:"center" },
  eyebrow: { display:"inline-flex", padding:"7px 11px", borderRadius:999, background:"#e8f1ec", color:"#1f6f54", fontSize:12, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase" },
  h1: { fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(42px,6vw,72px)", lineHeight:1.02, margin:"18px 0", letterSpacing:"-2px" },
  accent: { color:"#c59d23" },
  lead: { color:"#5d6878", fontSize:18, lineHeight:1.7, maxWidth:650 },
  actions: { display:"flex", gap:12, flexWrap:"wrap", marginTop:28 },
  secondary: { textDecoration:"none", color:"#101c2c", background:"#fff", border:"1px solid #dce1d8", padding:"11px 17px", borderRadius:10, fontWeight:700, fontSize:14 },
  mock: { background:"#101c2c", borderRadius:24, padding:18, boxShadow:"0 24px 60px rgba(16,28,44,.18)" },
  mockTop: { display:"flex", justifyContent:"space-between", color:"#cbd3df", fontSize:12, padding:"4px 4px 14px" },
  screen: { background:"#f8faf7", borderRadius:16, padding:18 },
  cards: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 },
  stat: { background:"#fff", border:"1px solid #e5e9e2", borderRadius:12, padding:14 },
  statLabel: { color:"#718096", fontSize:11 },
  statValue: { fontSize:22, fontWeight:800, marginTop:6 },
  section: { padding:"70px 0" },
  sectionTitle: { fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(30px,4vw,46px)", margin:"0 0 12px" },
  sectionLead: { color:"#657083", lineHeight:1.7, maxWidth:760 },
  grid3: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginTop:30 },
  card: { background:"#fff", border:"1px solid #e2e7df", borderRadius:18, padding:24, boxShadow:"0 8px 28px rgba(16,28,44,.05)" },
  number: { fontFamily:"monospace", color:"#c59d23", fontWeight:800, fontSize:13 },
  cardTitle: { fontSize:19, margin:"12px 0 8px" },
  cardText: { color:"#687487", lineHeight:1.65, fontSize:14 },
  band: { background:"#101c2c", color:"#fff", borderRadius:26, padding:"42px", margin:"30px 0" },
  footer: { padding:"35px 0 55px", color:"#718096", fontSize:13, borderTop:"1px solid #e3e6df", marginTop:50 },
};

function ResponsiveStyle() {
  return <style>{`
    @media(max-width:800px){
      .fp-hero{grid-template-columns:1fr!important;padding-top:50px!important}
      .fp-grid3{grid-template-columns:1fr!important}
      .fp-navlinks{display:none!important}
      .fp-cards{grid-template-columns:1fr!important}
    }
  `}</style>
}

import React from "react";
import { Link } from "react-router-dom";

export default function BusinessBenefits(){
  const benefits=[
    ["01","One place for daily work","Billing, products, stock, customers, purchases, expenses and reports stay connected instead of living in separate notebooks and spreadsheets."],
    ["02","See the business clearly","Owners can move from today's sales to stock, payments, expenses and business activity without searching through different tools."],
    ["03","Built for different business types","Start with a simple setup and organize the platform around the way a retail shop, grocery store, medical store, restaurant or service business operates."],
    ["04","Less repetitive work","A sale can update business records and inventory workflows so the owner does not have to enter the same information repeatedly."],
    ["05","AI when it is useful","AI can turn authorized business data into summaries, explanations and questions owners can understand instead of forcing them to read raw tables."],
    ["06","Owner control and staff roles","Owners can separate daily counter work from management access using role-based permissions and business-level data isolation."]
  ];
  return <div style={base.page}>
    <ResponsiveStyle/>
    <nav style={base.nav}><div style={base.brand}>FinancePro</div><div className="fp-navlinks" style={base.navLinks}>
      <Link to="/business-benefits" style={{...base.link,color:"#1f6f54"}}>Why FinancePro</Link>
      <Link to="/how-it-works" style={base.link}>How it works</Link>
      <Link to="/business-guide" style={base.link}>Business guide</Link>
    </div><Link to="/login" style={base.primary}>Sign in</Link></nav>
    <main style={base.container}>
      <section className="fp-hero" style={base.hero}>
        <div><span style={base.eyebrow}>For business owners</span>
          <h1 style={base.h1}>Run the work.<br/><span style={base.accent}>Understand the business.</span></h1>
          <p style={base.lead}>FinancePro is designed around the owner's daily reality: sell, restock, collect, pay, review and decide — with the information connected in one place.</p>
          <div style={base.actions}><Link to="/register" style={base.primary}>Create your business →</Link><Link to="/how-it-works" style={base.secondary}>See how it works</Link></div>
        </div>
        <div style={base.mock}><div style={base.mockTop}><span>OWNER VIEW</span><span>Live business workspace</span></div><div style={base.screen}>
          <div style={base.cards}>
            <div style={base.stat}><div style={base.statLabel}>TODAY'S SALES</div><div style={base.statValue}>₹24,850</div></div>
            <div style={base.stat}><div style={base.statLabel}>LOW STOCK</div><div style={base.statValue}>8 items</div></div>
            <div style={base.stat}><div style={base.statLabel}>PENDING</div><div style={base.statValue}>₹8,500</div></div>
          </div>
          <div style={{marginTop:14,padding:16,background:"#fff",border:"1px solid #e5e9e2",borderRadius:12}}>
            <b>AI Business Brief</b><p style={{color:"#687487",lineHeight:1.6,fontSize:13}}>Review sales, inventory and expenses together. Ask questions in plain language and investigate the underlying records.</p>
          </div>
        </div></div>
      </section>

      <section style={base.section}>
        <h2 style={base.sectionTitle}>Why an owner would use it</h2>
        <p style={base.sectionLead}>The value is not another billing screen. The value is having the important operating information connected so an owner can act faster and with more context.</p>
        <div className="fp-grid3" style={base.grid3}>{benefits.map(([n,t,d])=><article key={n} style={base.card}><div style={base.number}>{n}</div><h3 style={base.cardTitle}>{t}</h3><p style={base.cardText}>{d}</p></article>)}</div>
      </section>

      <section style={base.band}><span style={{color:"#c59d23",fontFamily:"monospace",fontSize:12}}>THE OWNER LOOP</span>
        <h2 style={{...base.sectionTitle,color:"#fff",marginTop:10}}>Sell → know → act → grow</h2>
        <p style={{...base.sectionLead,color:"#cbd3df"}}>The platform should help an owner move from an event at the counter to a useful management decision without rebuilding the information manually.</p>
      </section>
      <footer style={base.footer}>FinancePro • AI Business Management • Replace example claims with your verified product capabilities before launch.</footer>
    </main>
  </div>
}
