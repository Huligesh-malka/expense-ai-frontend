import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import API from "../services/api";
import {
  FiArrowLeft,
  FiEdit,
  FiTruck,
  FiPhone,
  FiMail,
  FiMapPin,
  FiHash,
  FiUser,
  FiFileText,
  FiCalendar,
  FiClock,
  FiInfo,
  FiCreditCard,
  FiGlobe,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiDownload,
  FiPrinter
} from "react-icons/fi";

/* ============================================================
   DESIGN TOKENS — "Vendor Khata" concept
   Shares Laabha's bahi-khata paper/ledger language with the
   rest of the app, extended here into a vendor rolodex card
   + running-account ledger for the purchase history table.

   THEMES — same layout & signature elements (rolodex tab,
   ruled khata table, rubber-stamp badges), six distinct color
   identities so each shop owner can pick their own. Persisted
   per-browser in localStorage under "laabha_vendor_theme".
   ============================================================ */
export const VENDOR_THEMES = {
  brass: {
    label: "Brass Ledger",
    swatch: "#B8863C",
    paper: "#F3EEE1", card: "#FFFDF7", ink: "#2E3A46", inkSoft: "#5B5346",
    muted: "#9A8F79", rule: "#DCD0B4",
    accent: "#B8863C", accentDark: "#8F6A2C", accent2: "#D98E2B",
    green: "#2F5D3A", greenBg: "#E4EDE0", red: "#A23A2B", redBg: "#F3E3DD",
    indigo: "#37455E"
  },
  counter: {
    label: "Counter Green",
    swatch: "#4C7A4A",
    paper: "#EEF1E7", card: "#FCFDF8", ink: "#26332A", inkSoft: "#48543D",
    muted: "#8A9678", rule: "#D3DCC4",
    accent: "#4C7A4A", accentDark: "#345234", accent2: "#C1652D",
    green: "#2F5D3A", greenBg: "#DFEBDA", red: "#A23A2B", redBg: "#F3E3DD",
    indigo: "#2F4A3D"
  },
  rosewood: {
    label: "Rosewood Bazaar",
    swatch: "#8C3A3A",
    paper: "#F5EAE6", card: "#FFF9F7", ink: "#402626", inkSoft: "#6B4640",
    muted: "#A88880", rule: "#E6D1C7",
    accent: "#8C3A3A", accentDark: "#5E2323", accent2: "#D9942B",
    green: "#3D6B3F", greenBg: "#E3EBDD", red: "#A23A2B", redBg: "#F3E1DC",
    indigo: "#6B3A52"
  },
  peacock: {
    label: "Peacock Mint",
    swatch: "#1F7A6C",
    paper: "#E9F3F1", card: "#F9FEFC", ink: "#1F3B3A", inkSoft: "#3D615D",
    muted: "#7FA39D", rule: "#CBE3DD",
    accent: "#1F7A6C", accentDark: "#145A50", accent2: "#D98E2B",
    green: "#2F5D3A", greenBg: "#DEEBE2", red: "#A23A2B", redBg: "#F3E3DD",
    indigo: "#235C77"
  },
  vyapar: {
    label: "Indigo Vyapar",
    swatch: "#3E4E9C",
    paper: "#ECEEF6", card: "#FAFBFF", ink: "#262B45", inkSoft: "#454C74",
    muted: "#8D93B8", rule: "#D6D9EE",
    accent: "#3E4E9C", accentDark: "#2B3670", accent2: "#E0A83C",
    green: "#2F5D3A", greenBg: "#E1E9DF", red: "#A23A2B", redBg: "#F1E1E5",
    indigo: "#3E4E9C"
  },
  saffron: {
    label: "Saffron Mandi",
    swatch: "#D9720C",
    paper: "#FBF0DE", card: "#FFFAF0", ink: "#3A2A14", inkSoft: "#6B4E27",
    muted: "#B49364", rule: "#EFD9AF",
    accent: "#D9720C", accentDark: "#A6560A", accent2: "#7A8C3F",
    green: "#3F6B33", greenBg: "#E7EBD7", red: "#A6392B", redBg: "#F3E1DA",
    indigo: "#8C3A2E"
  }
};

const themeToCssVars = (t) => ({
  "--paper": t.paper, "--card": t.card, "--ink": t.ink, "--ink-soft": t.inkSoft,
  "--muted": t.muted, "--rule": t.rule, "--brass": t.accent, "--brass-dark": t.accentDark,
  "--marigold": t.accent2, "--green": t.green, "--green-bg": t.greenBg,
  "--red": t.red, "--red-bg": t.redBg, "--indigo": t.indigo
});

/* ---- PDF receipt helpers ---- */
const hexToRgb = (hex) => {
  const h = (hex || "#000000").replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigitWords = (num) => {
  if (num < 20) return ONES[num];
  const t = Math.floor(num / 10);
  const o = num % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
};
const threeDigitWords = (num) => {
  const h = Math.floor(num / 100);
  const rest = num % 100;
  let s = "";
  if (h) s += ONES[h] + " Hundred" + (rest ? " " : "");
  if (rest) s += twoDigitWords(rest);
  return s;
};

// Indian numbering (crore / lakh / thousand) — the register used on
// Indian receipts and cheques.
const rupeesInWords = (amount) => {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let n = rupees;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const hundred = n;

  const parts = [];
  if (crore) parts.push(threeDigitWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitWords(hundred));

  let words = (parts.join(" ") || "Zero") + " Rupees";
  if (paise) words += " and " + twoDigitWords(paise) + " Paise";
  return words + " Only";
};

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .vs-root {
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    background: var(--paper);
    min-height: 100vh;
    transition: background .25s ease, color .25s ease;
  }

  .vs-mono { font-family: 'JetBrains Mono', monospace; }
  .vs-display { font-family: 'Rozha One', serif; }

  .vs-root * { box-sizing: border-box; }

  .vs-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 26px;
  }

  .vs-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--rule);
    padding: 10px 16px 10px 14px;
    border-radius: 4px 10px 10px 4px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 13.5px;
    box-shadow: 3px 3px 0 var(--rule);
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .vs-back-btn:hover {
    transform: translate(1px, 1px);
    box-shadow: 2px 2px 0 var(--rule);
  }

  .vs-heading-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--brass-dark);
    margin: 0 0 2px;
  }
  .vs-heading {
    margin: 0;
    font-family: 'Rozha One', serif;
    font-size: 26px;
    color: var(--ink);
  }

  .vs-edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--indigo);
    color: #fff;
    border: none;
    padding: 11px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 3px 0 #232c3d;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .vs-edit-btn:hover { transform: translateY(1px); box-shadow: 0 2px 0 #232c3d; }

  /* ---- Rolodex vendor card ---- */
  .vs-index-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 4px 14px 14px 14px;
    padding: 34px 30px 26px;
    margin-top: 22px;
    box-shadow: 0 10px 24px rgba(43,32,10,.07);
  }
  .vs-index-card::before {
    /* punch hole, top-left, like a card-file record */
    content: "";
    position: absolute;
    top: 14px;
    left: 22px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: inset 0 1px 2px rgba(0,0,0,.25);
  }
  .vs-rolodex-tab {
    position: absolute;
    top: -20px;
    left: 26px;
    width: 54px;
    height: 40px;
    background: linear-gradient(160deg, var(--brass), var(--brass-dark));
    border-radius: 6px 10px 4px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff8ea;
    font-family: 'Rozha One', serif;
    font-size: 22px;
    box-shadow: 0 4px 8px rgba(80,55,10,.35);
    transform: rotate(-2deg);
  }

  .vs-vendor-row {
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
  }
  .vs-vendor-icon {
    width: 66px;
    height: 66px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--rule);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .vs-vendor-name { margin: 0; font-family: 'Rozha One', serif; font-size: 25px; color: var(--ink); }
  .vs-vendor-company { margin: 3px 0 0; color: var(--ink-soft); font-size: 14px; }

  .vs-ref {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    color: var(--muted);
  }

  /* rubber-stamp badge, used for both supplier status and invoice status */
  .vs-stamp {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    border: 1.5px solid currentColor;
  }
  .vs-stamp--green { color: var(--green); background: var(--green-bg); }
  .vs-stamp--red { color: var(--red); background: var(--red-bg); }
  .vs-stamp--amber { color: var(--brass-dark); background: #F6EAD2; }
  .vs-stamp--grey { color: var(--muted); background: #EFEAE0; }

  /* ---- record cards (contact / address) ---- */
  .vs-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    margin-top: 22px;
  }
  @media (max-width: 760px) {
    .vs-grid-2 { grid-template-columns: 1fr; }
  }

  .vs-card {
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 22px;
    box-shadow: 0 4px 14px rgba(43,32,10,.05);
  }

  .vs-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-family: 'Rozha One', serif;
    font-size: 16px;
    color: var(--brass-dark);
    padding-bottom: 10px;
    border-bottom: 1px dashed var(--rule);
  }

  /* dotted "index card" leader row: LABEL .......... value */
  .vs-leader {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 7px 0;
  }
  .vs-leader-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--muted);
    white-space: nowrap;
  }
  .vs-leader-dots {
    flex: 1;
    border-bottom: 1.5px dotted var(--rule);
    height: 0;
    margin-bottom: 3px;
  }
  .vs-leader-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13.5px;
    color: var(--ink);
    white-space: nowrap;
    max-width: 55%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---- pinned note ---- */
  .vs-note {
    position: relative;
    background: #FBF6E6;
    border: 1px solid #E7D9A8;
    border-radius: 2px;
    padding: 16px 18px;
    font-size: 14px;
    color: var(--ink-soft);
    line-height: 1.5;
    transform: rotate(-0.4deg);
    box-shadow: 0 6px 14px rgba(43,32,10,.06);
    min-height: 40px;
  }
  .vs-note::before {
    content: "";
    position: absolute;
    top: -10px;
    left: 26px;
    width: 46px;
    height: 18px;
    background: rgba(216,196,120,.55);
    border: 1px solid rgba(184,134,60,.3);
    transform: rotate(-3deg);
  }
  .vs-note--empty { color: var(--muted); font-style: italic; }

  .vs-meta-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px dashed var(--rule);
  }
  .vs-meta-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .vs-meta-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--ink);
  }

  /* ---- ledger / purchase table ---- */
  .vs-ledger-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 4px;
  }
  .vs-count-chip {
    background: var(--indigo);
    color: #fff;
    padding: 5px 13px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .vs-ledger-wrap {
    position: relative;
    margin-top: 18px;
    padding-left: 26px;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 43px,
      var(--rule) 43px,
      var(--rule) 44px
    );
  }
  .vs-ledger-wrap::before {
    content: "";
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--red);
    opacity: .55;
  }

  .vs-ledger-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1100px;
  }
  .vs-ledger-table thead th {
    text-align: left;
    font-size: 11.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--brass-dark);
    font-weight: 700;
    padding: 0 14px 10px;
  }
  .vs-ledger-table tbody td {
    padding: 12px 14px;
    font-size: 14px;
    color: var(--ink);
    vertical-align: middle;
  }
  .vs-ledger-table tbody tr:hover { background: rgba(216,196,120,.12); }

  .vs-invoice-no {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
  }
  .vs-amt { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .vs-amt--paid { color: var(--green); }
  .vs-amt--due { color: var(--red); }

  .vs-btn-pay {
    border: none;
    background: var(--marigold);
    color: #fff;
    padding: 7px 13px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .vs-btn-history {
    border: 1px solid var(--rule);
    background: var(--card);
    color: var(--ink-soft);
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }
  .vs-btn-receipt {
    border: none;
    background: var(--indigo);
    color: #fff;
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }
  .vs-btn-receipt:hover {
    opacity: 0.9;
  }

  .vs-empty {
    text-align: center;
    padding: 44px 20px;
    color: var(--muted);
    background: repeating-linear-gradient(
      to bottom, transparent, transparent 27px, var(--rule) 27px, var(--rule) 28px
    );
    border-radius: 10px;
  }

  /* ---- modals ---- */
  .vs-overlay {
    position: fixed;
    inset: 0;
    background: rgba(30,22,10,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .vs-receipt {
    background: var(--card);
    width: 100%;
    max-width: 460px;
    border-radius: 4px;
    padding: 28px 26px 24px;
    box-shadow: 0 24px 60px rgba(0,0,0,.28);
    position: relative;
  }
  .vs-receipt::before {
    content: "";
    position: absolute;
    top: -1px; left: 0; right: 0; height: 10px;
    background-image: radial-gradient(circle at 10px 0, transparent 6px, var(--paper) 6.5px);
    background-size: 20px 10px;
    background-repeat: repeat-x;
  }
  .vs-receipt-title {
    margin: 6px 0 18px;
    font-family: 'Rozha One', serif;
    font-size: 20px;
    color: var(--ink);
  }
  .vs-receipt-summary {
    background: var(--paper);
    border: 1px dashed var(--rule);
    padding: 14px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .vs-field-label {
    display: block;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink-soft);
    margin-bottom: 6px;
  }
  .vs-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--rule);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: #fff;
    font-family: 'JetBrains Mono', monospace;
    color: var(--ink);
  }
  select.vs-input, textarea.vs-input { font-family: 'Inter', sans-serif; }
  .vs-input:focus { border-color: var(--brass); box-shadow: 0 0 0 3px rgba(184,134,60,.15); }

  .vs-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
  .vs-btn-cancel {
    border: 1px solid var(--rule);
    background: #fff;
    color: var(--ink-soft);
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  .vs-btn-confirm {
    border: none;
    background: var(--green);
    color: #fff;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }
  .vs-btn-confirm:disabled { opacity: .6; cursor: not-allowed; }

  /* passbook history modal */
  .vs-passbook {
    background: var(--card);
    width: 100%;
    max-width: 560px;
    border-radius: 10px;
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 24px 60px rgba(0,0,0,.28);
  }
  .vs-passbook-close {
    border: none;
    background: var(--paper);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 15px;
    color: var(--ink-soft);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vs-entry {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px dotted var(--rule);
  }
  .vs-entry-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--paper);
    border: 1px solid var(--rule);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--brass-dark);
    margin-right: 8px;
  }

  .vs-bal {
    font-size: 10.5px;
    color: var(--muted);
    white-space: nowrap;
  }
  .vs-bal strong { color: var(--red); font-weight: 700; }

  .vs-btn-download {
    border: 1px solid var(--brass);
    background: transparent;
    color: var(--brass-dark);
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    white-space: nowrap;
    transition: background .15s ease, color .15s ease;
  }
  .vs-btn-download:hover { background: var(--brass); color: #fff; }
  .vs-btn-download:disabled { opacity: .5; cursor: not-allowed; }

  .vs-theme-picker {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--card);
    border: 1px solid var(--rule);
    padding: 7px 10px;
    border-radius: 20px;
  }
  .vs-theme-label {
    font-size: 11px;
    color: var(--muted);
    margin-right: 2px;
    white-space: nowrap;
  }
  .vs-swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
  }
  .vs-swatch--active {
    border-color: var(--ink);
    transform: scale(1.12);
  }

  .vs-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--rule);
    border-top: 4px solid var(--brass);
    border-radius: 50%;
    animation: vs-spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes vs-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }

  /* Receipt Detail Modal Styles */
  .vs-receipt-detail {
    background: var(--card);
    width: 100%;
    max-width: 700px;
    border-radius: 10px;
    padding: 30px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 24px 60px rgba(0,0,0,.28);
    position: relative;
  }
  .vs-receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--rule);
  }
  .vs-receipt-header h2 {
    font-family: 'Rozha One', serif;
    margin: 0;
    color: var(--ink);
  }
  .vs-receipt-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }
  .vs-receipt-field {
    padding: 8px 0;
  }
  .vs-receipt-field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }
  .vs-receipt-field .value {
    font-size: 14px;
    color: var(--ink);
    font-family: 'JetBrains Mono', monospace;
    word-break: break-word;
  }
  .vs-receipt-field .value.amount {
    font-size: 18px;
    font-weight: 700;
    color: var(--green);
  }
  .vs-receipt-field .value.amount-due {
    color: var(--red);
  }
  .vs-receipt-words {
    background: var(--paper);
    padding: 12px 15px;
    border-radius: 8px;
    border-left: 3px solid var(--brass);
    margin: 15px 0;
    font-style: italic;
    font-size: 13px;
    color: var(--ink-soft);
  }
  .vs-receipt-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid var(--rule);
  }
  .vs-btn-print {
    border: none;
    background: var(--brass);
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .vs-btn-print:hover {
    opacity: 0.9;
  }
  .vs-receipt-payments-list {
    margin-top: 20px;
    border-top: 1px solid var(--rule);
    padding-top: 15px;
  }
  .vs-receipt-payments-list h4 {
    font-family: 'Rozha One', serif;
    margin: 0 0 12px 0;
    color: var(--ink-soft);
  }
  .vs-receipt-payment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dotted var(--rule);
    cursor: pointer;
    transition: background 0.2s;
  }
  .vs-receipt-payment-item:hover {
    background: rgba(216,196,120,.08);
  }
  .vs-receipt-payment-item.active {
    background: rgba(216,196,120,.15);
    border-left: 3px solid var(--brass);
    padding-left: 10px;
  }
  .vs-receipt-payment-item .payment-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .vs-receipt-payment-item .payment-info .method {
    font-weight: 600;
    font-size: 13px;
  }
  .vs-receipt-payment-item .payment-info .date {
    font-size: 11px;
    color: var(--muted);
  }
  .vs-receipt-payment-item .payment-amount {
    font-weight: 700;
    font-size: 15px;
    color: var(--green);
  }
  .vs-receipt-payment-item .payment-amount.due {
    color: var(--red);
  }
`;

export default function ViewSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(true);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyPurchase, setHistoryPurchase] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New states for receipt detail view
  const [showReceiptDetail, setShowReceiptDetail] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptPayments, setReceiptPayments] = useState([]);

  const [themeKey, setThemeKey] = useState(() => {
    try {
      return localStorage.getItem("laabha_vendor_theme") || "brass";
    } catch {
      return "brass";
    }
  });
  const theme = VENDOR_THEMES[themeKey] || VENDOR_THEMES.brass;

  const chooseTheme = (key) => {
    setThemeKey(key);
    try {
      localStorage.setItem("laabha_vendor_theme", key);
    } catch {
      /* storage unavailable — theme just won't persist */
    }
  };

  useEffect(() => {
    loadSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadSupplier = async () => {
    try {
      const [supplierRes, purchaseRes] = await Promise.all([
        API.get(`/suppliers/${id}`),
        API.get(`/purchases/suppliers/${id}/purchases`)
      ]);

      setSupplier(supplierRes.data.data);
      setPurchases(purchaseRes.data.data || []);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load supplier details");
      navigate("/suppliers");
    } finally {
      setLoading(false);
      setPurchaseLoading(false);
    }
  };

  const openPaymentModal = (purchase) => {
    const balance = Number(purchase.due_amount || 0);
    if (balance <= 0) return;

    setSelectedPurchase(purchase);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMethod("Cash");
    setReferenceNo("");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedPurchase) return;

    const amount = Number(paymentAmount);
    const balance = Number(selectedPurchase.due_amount || 0);

    if (!amount || amount <= 0) {
      alert("Enter a valid payment amount");
      return;
    }

    if (amount > balance) {
      alert(`Payment cannot be greater than ₹${balance.toFixed(2)}`);
      return;
    }

    try {
      setPaymentSaving(true);

      await API.post(`/purchases/${selectedPurchase.id}/payments`, {
        amount,
        payment_method: paymentMethod,
        reference_no: referenceNo || null,
        notes: paymentNotes || null
      });

      alert("Payment recorded successfully.");

      setShowPaymentModal(false);
      setSelectedPurchase(null);

      await loadSupplier();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  const openPaymentHistory = async (purchase) => {
    try {
      setHistoryPurchase(purchase);
      setShowHistory(true);
      setHistoryLoading(true);

      const res = await API.get(`/purchases/${purchase.id}/payments`);
      setPaymentHistory(res.data.data || []);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // New function to open receipt detail view
  const openReceiptDetail = async (purchase) => {
    try {
      setHistoryPurchase(purchase);
      setHistoryLoading(true);

      const res = await API.get(`/purchases/${purchase.id}/payments`);
      const payments = res.data.data || [];
      setReceiptPayments(payments);
      
      // Select the first payment or latest payment
      if (payments.length > 0) {
        // Sort by date descending to show latest first
        const sorted = [...payments].sort(
          (a, b) => new Date(b.payment_date) - new Date(a.payment_date)
        );
        setSelectedReceipt(sorted[0]);
      } else {
        setSelectedReceipt(null);
      }
      
      setShowReceiptDetail(true);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to load payment receipts");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Function to select a specific receipt
  const selectReceipt = (payment) => {
    setSelectedReceipt(payment);
  };

  // Running balance as of a given payment — sorts the loaded payment
  // history chronologically and sums everything up to (and including)
  // this entry, so historical receipts show the balance as it stood
  // at that moment rather than today's live due_amount.
  const runningBalance = (payment) => {
    const total = Number(historyPurchase?.total_amount || 0);
    const sorted = [...receiptPayments].sort(
      (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
    );
    const idx = sorted.findIndex((p) => p.id === payment.id);
    const upTo = idx === -1 ? sorted.length : idx + 1;
    const paidSoFar = sorted
      .slice(0, upTo)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remaining = Math.max(total - paidSoFar, 0);
    return { total, paidSoFar, remaining };
  };

  // Function to get receipt details for display
  const getReceiptDisplayData = (payment) => {
    if (!historyPurchase || !payment) return null;
    
    const { total, paidSoFar, remaining } = runningBalance(payment);
    
    return {
      receiptNo: `PAY-${String(payment.id || Date.now()).slice(-6)}`,
      date: formatDate(payment.payment_date),
      vendorName: supplier?.company_name || supplier?.supplier_name || "-",
      contactPerson: supplier?.supplier_name || "-",
      gstin: supplier?.gst_number || "-",
      invoiceNo: historyPurchase.invoice_no,
      totalAmount: total,
      paidSoFar: paidSoFar,
      remaining: remaining,
      paymentAmount: Number(payment.amount || 0),
      paymentMethod: payment.payment_method || "-",
      referenceNo: payment.reference_no || "-",
      notes: payment.notes || "-",
      amountWords: rupeesInWords(Number(payment.amount || 0)),
      status: remaining <= 0 ? "Paid" : (paidSoFar > 0 ? "Partial" : "Unpaid")
    };
  };

  const downloadReceipt = (payment) => {
    if (!historyPurchase) return;

    const doc = new jsPDF({ unit: "pt", format: "a5" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const [ar, ag, ab] = hexToRgb(theme.accent);
    const [ir, ig, ib] = hexToRgb(theme.ink);
    const [sr, sg, sb] = hexToRgb(theme.inkSoft);
    const [mr, mg, mb] = hexToRgb(theme.muted);
    const [rr, rg, rb] = hexToRgb(theme.rule);
    const [gr, gg, gb] = hexToRgb(theme.green);
    const [gbr, gbg, gbb] = hexToRgb(theme.greenBg);
    const [xr, xg, xb] = hexToRgb(theme.red);

    // header band
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, W, 74, "F");
    doc.setTextColor(255, 253, 247);
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text("Payment Receipt", 32, 38);
    doc.setFont("courier", "normal");
    doc.setFontSize(8.5);
    doc.text("VENDOR KHATA  ·  LAABHA", 32, 54);

    let y = 100;

    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(ir, ig, ib);
    doc.text(`Receipt No.  PAY-${String(payment.id || Date.now()).slice(-6)}`, 32, y);
    doc.text(formatDate(payment.payment_date), W - 32, y, { align: "right" });

    y += 20;
    doc.setDrawColor(rr, rg, rb);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(32, y, W - 32, y);
    doc.setLineDashPattern([], 0);

    // ---- Paid To: exact company_name first, contact person second ----
    y += 26;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(ir, ig, ib);
    doc.text("Paid To", 32, y);
    y += 16;
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text(supplier?.company_name || supplier?.supplier_name || "-", 32, y);

    if (supplier?.company_name && supplier?.supplier_name && supplier.company_name !== supplier.supplier_name) {
      y += 14;
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(sr, sg, sb);
      doc.text(`Contact: ${supplier.supplier_name}`, 32, y);
      doc.setTextColor(ir, ig, ib);
    }
    if (supplier?.gst_number) {
      y += 14;
      doc.setFont("courier", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(sr, sg, sb);
      doc.text(`GSTIN: ${supplier.gst_number}`, 32, y);
      doc.setTextColor(ir, ig, ib);
    }

    y += 24;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Against Invoice", 32, y);
    y += 16;
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice No.  ${historyPurchase.invoice_no}`, 32, y);

    // ---- Total / Paid so far / Remaining, as of this payment ----
    y += 22;
    const { total, paidSoFar, remaining } = runningBalance(payment);
    const colW = (W - 64) / 3;
    const statY = y;
    [
      { label: "Total", value: total, color: [ir, ig, ib] },
      { label: "Paid So Far", value: paidSoFar, color: [gr, gg, gb] },
      { label: "Remaining", value: remaining, color: [xr, xg, xb] }
    ].forEach((s, i) => {
      const x = 32 + i * colW;
      doc.setFont("courier", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(mr, mg, mb);
      doc.text(s.label, x, statY);
      doc.setFont("times", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(...s.color);
      doc.text(`Rs. ${s.value.toFixed(2)}`, x, statY + 16);
    });
    doc.setTextColor(ir, ig, ib);
    y = statY + 34;

    // ---- This payment's amount, highlighted ----
    doc.setFillColor(gbr, gbg, gbb);
    doc.roundedRect(32, y, W - 64, 58, 6, 6, "F");
    doc.setTextColor(gr, gg, gb);
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    doc.text("THIS PAYMENT", W / 2, y + 18, { align: "center" });
    doc.setFontSize(20);
    doc.text(`Rs. ${Number(payment.amount || 0).toFixed(2)}`, W / 2, y + 42, { align: "center" });
    doc.setTextColor(ir, ig, ib);

    y += 78;
    doc.setFont("courier", "normal");
    doc.setFontSize(9.5);
    doc.text(`Method     ${payment.payment_method || "-"}`, 32, y);
    if (payment.reference_no) {
      y += 14;
      doc.text(`Reference  ${payment.reference_no}`, 32, y);
    }

    y += 22;
    doc.setFont("times", "italic");
    doc.setFontSize(9);
    doc.setTextColor(sr, sg, sb);
    const words = doc.splitTextToSize(rupeesInWords(Number(payment.amount || 0)), W - 64);
    doc.text(words, 32, y);
    y += words.length * 12 + 6;

    if (payment.notes) {
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(ir, ig, ib);
      const noteLines = doc.splitTextToSize(`Note: ${payment.notes}`, W - 64);
      doc.text(noteLines, 32, y);
    }

    doc.setDrawColor(rr, rg, rb);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(32, H - 46, W - 32, H - 46);
    doc.setLineDashPattern([], 0);

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mr, mg, mb);
    doc.text("Computer-generated receipt — no signature required.", W / 2, H - 30, { align: "center" });

    doc.save(`receipt-${historyPurchase.invoice_no || "payment"}-${payment.id || ""}.pdf`);
  };

  const stampVariant = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "paid") return "vs-stamp--green";
    if (s === "inactive" || s === "unpaid") return "vs-stamp--red";
    if (s === "pending" || s === "partial") return "vs-stamp--amber";
    return "vs-stamp--grey";
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <FiCheckCircle size={13} />,
      inactive: <FiXCircle size={13} />,
      pending: <FiAlertCircle size={13} />
    };
    return icons[status?.toLowerCase()] || <FiInfo size={13} />;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="vs-root" style={{ padding: 40, ...themeToCssVars(theme) }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ textAlign: "center", paddingTop: 60 }}>
          <div className="vs-spinner" />
          <p className="vs-display" style={{ fontSize: 18, color: "var(--ink-soft)" }}>
            Opening vendor card…
          </p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="vs-root" style={{ padding: 40, textAlign: "center", ...themeToCssVars(theme) }}>
        <style>{GLOBAL_STYLES}</style>
        <p className="vs-display" style={{ fontSize: 20 }}>Supplier not found</p>
      </div>
    );
  }

  const initial = (supplier.supplier_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="vs-root" style={{ padding: 30, ...themeToCssVars(theme) }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Top bar */}
      <div className="vs-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/suppliers">
            <button className="vs-back-btn">
              <FiArrowLeft />
              Back
            </button>
          </Link>
          <div>
            <p className="vs-heading-eyebrow">Vendor Khata</p>
            <h1 className="vs-heading">Supplier Details</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="vs-theme-picker" role="radiogroup" aria-label="Card colour">
            <span className="vs-theme-label">Card colour</span>
            {Object.entries(VENDOR_THEMES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={themeKey === key}
                title={t.label}
                onClick={() => chooseTheme(key)}
                className={`vs-swatch ${themeKey === key ? "vs-swatch--active" : ""}`}
                style={{ background: t.swatch }}
              />
            ))}
          </div>

          <Link to={`/edit-supplier/${supplier.id}`}>
            <button className="vs-edit-btn">
              <FiEdit />
              Edit Supplier
            </button>
          </Link>
        </div>
      </div>

      {/* Vendor rolodex card */}
      <div className="vs-index-card">
        <div className="vs-rolodex-tab">{initial}</div>

        <div className="vs-vendor-row">
          <div className="vs-vendor-icon">
            <FiTruck size={30} color="#37455E" />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 className="vs-vendor-name">{supplier.supplier_name}</h2>
            <p className="vs-vendor-company">{supplier.company_name || "No company name"}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <span className={`vs-stamp ${stampVariant(supplier.status)}`}>
                {getStatusIcon(supplier.status)}
                {supplier.status || "Active"}
              </span>
              <span className="vs-ref">Ledger Ref&nbsp;#{String(supplier.id).padStart(3, "0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact + Address record cards */}
      <div className="vs-grid-2">
        <div className="vs-card">
          <h3 className="vs-section-title"><FiUser /> Contact Information</h3>

          <div className="vs-leader">
            <span className="vs-leader-label"><FiPhone size={13} /> Phone</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.supplier_phone || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label"><FiMail size={13} /> Email</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.supplier_email || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label"><FiGlobe size={13} /> GST No.</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.gst_number || "-"}</span>
          </div>
        </div>

        <div className="vs-card">
          <h3 className="vs-section-title"><FiMapPin /> Address Details</h3>

          <div className="vs-leader">
            <span className="vs-leader-label">Address</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.address || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label">City</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.city || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label">State</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.state || "-"}</span>
          </div>
          <div className="vs-leader">
            <span className="vs-leader-label"><FiHash size={13} /> Pincode</span>
            <span className="vs-leader-dots" />
            <span className="vs-leader-value">{supplier.pincode || "-"}</span>
          </div>
        </div>
      </div>

      {/* Notes + meta */}
      <div className="vs-card" style={{ marginTop: 22 }}>
        <h3 className="vs-section-title"><FiFileText /> Additional Information</h3>

        <div className={`vs-note ${!supplier.notes ? "vs-note--empty" : ""}`}>
          {supplier.notes || "No notes on file for this vendor."}
        </div>

        <div className="vs-meta-row">
          <div>
            <div className="vs-meta-label"><FiCalendar size={13} /> Record Opened</div>
            <div className="vs-meta-value">{formatDate(supplier.created_at)}</div>
          </div>
          <div>
            <div className="vs-meta-label"><FiClock size={13} /> Last Updated</div>
            <div className="vs-meta-value">{formatDate(supplier.updated_at)}</div>
          </div>
        </div>
      </div>

      {/* Purchase khata / ledger */}
      <div className="vs-card" style={{ marginTop: 22 }}>
        <div className="vs-ledger-head">
          <h3 className="vs-section-title" style={{ border: "none", margin: 0, paddingBottom: 0 }}>
            <FiCreditCard /> Purchase Khata
          </h3>
          <span className="vs-count-chip">
            {purchases.length} entr{purchases.length !== 1 ? "ies" : "y"}
          </span>
        </div>

        {purchaseLoading ? (
          <div className="vs-empty">Loading purchase invoices…</div>
        ) : purchases.length === 0 ? (
          <div className="vs-empty">
            <FiFileText size={26} />
            <div style={{ marginTop: 10 }}>No purchase invoices recorded for this vendor yet.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div className="vs-ledger-wrap">
              <table className="vs-ledger-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => {
                    const total = Number(purchase.total_amount || 0);
                    const paid = Number(purchase.paid_amount || 0);
                    const balance = Number(purchase.due_amount || 0);

                    let status = "Unpaid";
                    if (balance <= 0) status = "Paid";
                    else if (paid > 0) status = "Partial";

                    return (
                      <tr key={purchase.id}>
                        <td className="vs-invoice-no">{purchase.invoice_no}</td>
                        <td>{formatDate(purchase.created_at)}</td>
                        <td className="vs-amt">₹{total.toFixed(2)}</td>
                        <td className="vs-amt vs-amt--paid">₹{paid.toFixed(2)}</td>
                        <td className={`vs-amt ${balance > 0 ? "vs-amt--due" : "vs-amt--paid"}`}>
                          ₹{balance.toFixed(2)}
                        </td>
                        <td>
                          <span className={`vs-stamp ${stampVariant(status)}`}>
                            {status === "Paid" && <FiCheckCircle size={12} />}
                            {status === "Partial" && <FiAlertCircle size={12} />}
                            {status === "Unpaid" && <FiXCircle size={12} />}
                            {status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {balance > 0 && (
                              <button className="vs-btn-pay" onClick={() => openPaymentModal(purchase)}>
                                Pay ₹{balance.toFixed(2)}
                              </button>
                            )}
                            <button className="vs-btn-history" onClick={() => openPaymentHistory(purchase)}>
                              History
                            </button>
                            <button 
                              className="vs-btn-receipt" 
                              onClick={() => openReceiptDetail(purchase)}
                            >
                              <FiPrinter size={12} style={{ marginRight: 4 }} />
                              Receipts
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment modal — receipt slip */}
      {showPaymentModal && selectedPurchase && (
        <div className="vs-overlay">
          <div className="vs-receipt">
            <h2 className="vs-receipt-title">Settle Balance</h2>

            <div className="vs-receipt-summary">
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>Invoice</span>
                <div className="vs-invoice-no" style={{ marginTop: 3, fontSize: 15 }}>
                  {selectedPurchase.invoice_no}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Total</div>
                  <strong className="vs-mono">
                    ₹{Number(selectedPurchase.total_amount || 0).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Paid</div>
                  <strong className="vs-mono" style={{ color: "var(--green)" }}>
                    ₹{Number(selectedPurchase.paid_amount || 0).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>Remaining</div>
                  <strong className="vs-mono" style={{ color: "var(--red)" }}>
                    ₹{Number(selectedPurchase.due_amount || 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="vs-field-label">Payment Amount</label>
              <input
                type="number"
                min="0"
                max={Number(selectedPurchase.due_amount || 0)}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="vs-input"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="vs-field-label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="vs-input"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="vs-field-label">
                Reference No. <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="UPI / transaction / cheque number"
                className="vs-input"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="vs-field-label">
                Notes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                className="vs-input"
                style={{ resize: "vertical", fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div className="vs-modal-actions">
              <button
                className="vs-btn-cancel"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentSaving}
              >
                Cancel
              </button>
              <button className="vs-btn-confirm" onClick={submitPayment} disabled={paymentSaving}>
                {paymentSaving ? "Saving…" : `Pay ₹${Number(paymentAmount || 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history modal — passbook */}
      {showHistory && historyPurchase && (
        <div className="vs-overlay">
          <div className="vs-passbook">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <h2 className="vs-display" style={{ margin: 0, fontSize: 20 }}>Payment History</h2>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }} className="vs-mono">
                  {historyPurchase.invoice_no}
                </div>
              </div>
              <button className="vs-passbook-close" onClick={() => setShowHistory(false)}>
                <FiX />
              </button>
            </div>

            {historyLoading ? (
              <div className="vs-empty">Loading entries…</div>
            ) : paymentHistory.length === 0 ? (
              <div className="vs-empty">No payment entries recorded yet.</div>
            ) : (
              <div>
                {paymentHistory.map((payment, index) => {
                  const { total, remaining } = runningBalance(payment);
                  return (
                    <div key={payment.id} className="vs-entry">
                      <div style={{ display: "flex" }}>
                        <span className="vs-entry-num">{index + 1}</span>
                        <div>
                          <strong style={{ fontSize: 13.5 }}>{payment.payment_method}</strong>
                          {payment.reference_no && (
                            <span className="vs-mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                              {" "}• {payment.reference_no}
                            </span>
                          )}
                          <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 3 }}>
                            {formatDate(payment.payment_date)}
                          </div>
                          {payment.notes && (
                            <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink-soft)" }}>
                              {payment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <strong className="vs-mono" style={{ color: "var(--green)", fontSize: 15, whiteSpace: "nowrap" }}>
                          ₹{Number(payment.amount || 0).toFixed(2)}
                        </strong>
                        <span className="vs-mono vs-bal">
                          Total ₹{total.toFixed(2)} · Bal <strong>₹{remaining.toFixed(2)}</strong>
                        </span>
                        <button className="vs-btn-download" onClick={() => downloadReceipt(payment)}>
                          <FiDownload size={11} /> Receipt
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              className="vs-btn-cancel"
              style={{ marginTop: 20, width: "100%" }}
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Receipt Detail Modal - Shows all receipts for an invoice with separate columns */}
      {showReceiptDetail && historyPurchase && (
        <div className="vs-overlay">
          <div className="vs-receipt-detail">
            <div className="vs-receipt-header">
              <div>
                <h2>Receipts for Invoice</h2>
                <div className="vs-mono" style={{ color: "var(--muted)", fontSize: 14 }}>
                  {historyPurchase.invoice_no}
                </div>
              </div>
              <button className="vs-passbook-close" onClick={() => setShowReceiptDetail(false)}>
                <FiX />
              </button>
            </div>

            {historyLoading ? (
              <div className="vs-empty">Loading receipts…</div>
            ) : receiptPayments.length === 0 ? (
              <div className="vs-empty">No receipts found for this invoice.</div>
            ) : (
              <>
                {/* Receipt Payments List - Separate columns */}
                <div className="vs-receipt-payments-list">
                  <h4>All Receipts ({receiptPayments.length})</h4>
                  {receiptPayments.map((payment) => {
                    const { total, remaining } = runningBalance(payment);
                    const isActive = selectedReceipt?.id === payment.id;
                    return (
                      <div 
                        key={payment.id} 
                        className={`vs-receipt-payment-item ${isActive ? 'active' : ''}`}
                        onClick={() => selectReceipt(payment)}
                      >
                        <div className="payment-info">
                          <span className="method">{payment.payment_method}</span>
                          <span className="date">{formatDate(payment.payment_date)}</span>
                          {payment.reference_no && (
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                              Ref: {payment.reference_no}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="payment-amount">₹{Number(payment.amount).toFixed(2)}</div>
                          <div className="vs-bal">Bal: ₹{remaining.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Receipt Detail */}
                {selectedReceipt && (
                  <>
                    <div style={{ 
                      marginTop: 20, 
                      paddingTop: 20, 
                      borderTop: "2px solid var(--rule)" 
                    }}>
                      <h3 style={{ fontFamily: "'Rozha One', serif", marginBottom: 15 }}>
                        Receipt Details
                      </h3>
                      
                      <div className="vs-receipt-grid">
                        <div className="vs-receipt-field">
                          <label>Receipt No.</label>
                          <div className="value">PAY-{String(selectedReceipt.id).slice(-6)}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Date</label>
                          <div className="value">{formatDate(selectedReceipt.payment_date)}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Vendor</label>
                          <div className="value">{supplier?.company_name || supplier?.supplier_name}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Invoice No.</label>
                          <div className="value">{historyPurchase.invoice_no}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Payment Method</label>
                          <div className="value">{selectedReceipt.payment_method}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Reference No.</label>
                          <div className="value">{selectedReceipt.reference_no || "-"}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Amount Paid</label>
                          <div className="value amount">₹{Number(selectedReceipt.amount).toFixed(2)}</div>
                        </div>
                        <div className="vs-receipt-field">
                          <label>Status</label>
                          <div className="value">
                            <span className={`vs-stamp ${stampVariant(
                              runningBalance(selectedReceipt).remaining <= 0 ? "Paid" : 
                              (runningBalance(selectedReceipt).paidSoFar > 0 ? "Partial" : "Unpaid")
                            )}`}>
                              {runningBalance(selectedReceipt).remaining <= 0 ? "Fully Paid" : 
                               "Partial"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr 1fr", 
                        gap: 15,
                        background: "var(--paper)",
                        padding: 15,
                        borderRadius: 8,
                        marginTop: 10
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Total Invoice</div>
                          <div style={{ fontSize: 16, fontWeight: 700 }}>₹{runningBalance(selectedReceipt).total.toFixed(2)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Total Paid</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>
                            ₹{runningBalance(selectedReceipt).paidSoFar.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Balance</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--red)" }}>
                            ₹{runningBalance(selectedReceipt).remaining.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Amount in Words */}
                      <div className="vs-receipt-words">
                        <strong>Amount in Words: </strong>
                        {rupeesInWords(Number(selectedReceipt.amount))}
                      </div>

                      {selectedReceipt.notes && (
                        <div style={{ 
                          marginTop: 10, 
                          padding: 10, 
                          background: "#FBF6E6",
                          borderRadius: 6,
                          fontSize: 13
                        }}>
                          <strong>Notes: </strong>{selectedReceipt.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="vs-receipt-actions">
                      <button 
                        className="vs-btn-cancel" 
                        onClick={() => setShowReceiptDetail(false)}
                      >
                        Close
                      </button>
                      <button 
                        className="vs-btn-download" 
                        onClick={() => downloadReceipt(selectedReceipt)}
                        style={{ fontSize: 13, padding: "10px 18px" }}
                      >
                        <FiDownload size={14} /> Download PDF
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}