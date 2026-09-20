import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { useParams } from "react-router-dom";
import {
    getPublicQRMenu,
    createQROrder
} from "../services/qrOrderApi";

/*
 * PUBLIC BUSINESS QR ORDERING  -  TRADING STYLE UI
 *
 * Flow:
 * Scan QR -> View business products -> Add to cart ->
 * Place order -> Owner receives order -> Owner accepts ->
 * Customer pays directly to owner.
 *
 * No table selection is used.
 * Customer only receives customer-facing product information.
 */

const LOW_STOCK_LIMIT = 5;

/* ------------------------------------------------------------ */
/* STYLES (kept in this same file)                              */
/* ------------------------------------------------------------ */

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap");

/* ============================================================
   PUBLIC QR MENU  -  TRADING STYLE
   Every class is prefixed with "tq-" so it cannot clash with
   your existing global CSS. You can delete the old styles for
   .customer-menu, .menu-product, .cart-drawer, etc.
   ============================================================ */

.tq-app {
    --bg: #0a0f1a;
    --panel: #111a2b;
    --panel-2: #16213a;
    --line: #1f2d47;
    --line-soft: #182339;
    --text: #e8eef9;
    --muted: #7f8da6;

    --up: #19d38f;
    --up-soft: rgba(25, 211, 143, 0.12);
    --down: #ff5c6c;
    --down-soft: rgba(255, 92, 108, 0.12);
    --warn: #f6b73c;
    --warn-soft: rgba(246, 183, 60, 0.12);

    --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    --sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    color: var(--text);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.45;
    background-color: var(--bg);
    background-image:
        radial-gradient(900px 420px at 50% -120px, rgba(25, 211, 143, 0.09), transparent 70%),
        linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
    background-size: auto, 40px 40px, 40px 40px;
    -webkit-font-smoothing: antialiased;
}

.tq-app *,
.tq-app *::before,
.tq-app *::after {
    box-sizing: border-box;
}

.tq-app h1,
.tq-app h2,
.tq-app h3,
.tq-app p {
    margin: 0;
}

.tq-app button,
.tq-app input,
.tq-app textarea {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
}

.tq-app button {
    cursor: pointer;
}

.tq-app button:disabled {
    cursor: not-allowed;
}

.tq-app :focus-visible {
    outline: 2px solid var(--up);
    outline-offset: 2px;
}

/* ------------------------------------------------------------
   CENTERED STATES: loading / error / success
   ------------------------------------------------------------ */

.tq-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 20px;
    text-align: center;
}

.tq-center h1,
.tq-center h2 {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.tq-center p {
    max-width: 420px;
    color: var(--muted);
}

.tq-center p strong {
    color: var(--text);
}

.tq-spinner {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--line);
    border-top-color: var(--up);
    animation: tq-spin 0.8s linear infinite;
}

@keyframes tq-spin {
    to { transform: rotate(360deg); }
}

.tq-state-icon {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    font-size: 30px;
    font-weight: 700;
    border: 1px solid transparent;
}

.tq-state-icon.is-up {
    color: var(--up);
    background: var(--up-soft);
    border-color: rgba(25, 211, 143, 0.35);
}

.tq-state-icon.is-down {
    color: var(--down);
    background: var(--down-soft);
    border-color: rgba(255, 92, 108, 0.35);
}

/* ------------------------------------------------------------
   RECEIPT
   ------------------------------------------------------------ */

.tq-receipt {
    width: 100%;
    max-width: 420px;
    margin: 8px 0 6px;
    padding: 6px 18px 18px;
    text-align: left;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
}

.tq-receipt-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 0;
    border-bottom: 1px dashed var(--line);
}

.tq-receipt-row span {
    color: var(--muted);
}

.tq-receipt-row strong {
    font-family: var(--mono);
    font-weight: 700;
}

.tq-amount {
    color: var(--up);
    font-size: 18px;
}

.tq-status {
    padding: 4px 10px;
    font-size: 12px;
    color: var(--warn);
    background: var(--warn-soft);
    border-radius: 999px;
}

.tq-receipt-note {
    margin-top: 14px;
    padding: 12px 14px;
    background: var(--panel-2);
    border-radius: 10px;
}

.tq-receipt-note strong {
    display: block;
    margin-bottom: 4px;
}

.tq-receipt-note p {
    max-width: none;
    font-size: 13.5px;
    color: var(--muted);
}

.tq-primary {
    width: 100%;
    max-width: 420px;
    padding: 14px 18px;
    font-weight: 700;
    color: #04150e;
    background: var(--up);
    border: 0;
    border-radius: 12px;
}

.tq-primary:hover {
    filter: brightness(1.08);
}

.tq-secondary {
    padding: 10px 18px;
    font-weight: 600;
    color: var(--up);
    background: var(--up-soft);
    border: 1px solid rgba(25, 211, 143, 0.35);
    border-radius: 10px;
}

/* ------------------------------------------------------------
   HEADER
   ------------------------------------------------------------ */

.tq-top {
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(10, 15, 26, 0.86);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--line);
}

.tq-top-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    max-width: 1120px;
    margin: 0 auto;
    padding: 12px 16px;
}

.tq-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.tq-logo {
    flex: none;
    width: 42px;
    height: 42px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid var(--line);
}

.tq-logo-fallback {
    display: grid;
    place-items: center;
    font-size: 20px;
    font-weight: 700;
    color: #04150e;
    background: var(--up);
    border: 0;
}

.tq-brand-text {
    min-width: 0;
}

.tq-brand-text h1 {
    overflow: hidden;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.tq-brand-text p {
    font-size: 12.5px;
    color: var(--muted);
}

.tq-live {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--up);
    background: var(--up-soft);
    border: 1px solid rgba(25, 211, 143, 0.3);
    border-radius: 999px;
}

.tq-live i {
    width: 7px;
    height: 7px;
    background: var(--up);
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(25, 211, 143, 0.6);
    animation: tq-pulse 1.8s ease-out infinite;
}

@keyframes tq-pulse {
    70% { box-shadow: 0 0 0 7px rgba(25, 211, 143, 0); }
    100% { box-shadow: 0 0 0 0 rgba(25, 211, 143, 0); }
}

/* ------------------------------------------------------------
   TICKER TAPE
   ------------------------------------------------------------ */

.tq-ticker {
    overflow: hidden;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
}

.tq-ticker-track {
    display: flex;
    width: max-content;
    animation: tq-marquee 55s linear infinite;
}

.tq-ticker:hover .tq-ticker-track {
    animation-play-state: paused;
}

.tq-ticker-group {
    display: flex;
    flex: none;
}

.tq-tick {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    font-size: 13px;
    white-space: nowrap;
    border-right: 1px solid var(--line-soft);
}

.tq-tick-name {
    color: var(--muted);
    font-weight: 500;
}

.tq-tick-price {
    font-family: var(--mono);
    font-weight: 700;
}

.tq-up {
    color: var(--up);
    font-size: 11px;
}

.tq-down {
    color: var(--down);
    font-size: 11px;
}

@keyframes tq-marquee {
    to { transform: translateX(-50%); }
}

/* ------------------------------------------------------------
   LAYOUT
   ------------------------------------------------------------ */

.tq-shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 16px 16px calc(120px + env(safe-area-inset-bottom, 0px));
}

.tq-info-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
}

.tq-chip {
    padding: 6px 12px;
    font-size: 13px;
    color: var(--muted);
    text-decoration: none;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
}

a.tq-chip:hover {
    color: var(--text);
    border-color: var(--up);
}

/* ------------------------------------------------------------
   SEARCH
   ------------------------------------------------------------ */

.tq-search {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
}

.tq-search:focus-within {
    border-color: var(--up);
    box-shadow: 0 0 0 3px var(--up-soft);
}

.tq-search input {
    flex: 1;
    min-width: 0;
    padding: 14px 0;
    background: transparent;
    border: 0;
    outline: none;
}

.tq-search input::placeholder {
    color: var(--muted);
}

.tq-search button {
    width: 26px;
    height: 26px;
    line-height: 1;
    font-size: 18px;
    color: var(--muted);
    background: var(--panel-2);
    border: 0;
    border-radius: 50%;
}

/* ------------------------------------------------------------
   CATEGORY TABS
   ------------------------------------------------------------ */

.tq-tabs {
    display: flex;
    gap: 8px;
    margin: 14px -16px 0;
    padding: 0 16px 4px;
    overflow-x: auto;
    scrollbar-width: none;
}

.tq-tabs::-webkit-scrollbar {
    display: none;
}

.tq-tab {
    flex: none;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 999px;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.tq-tab:hover {
    color: var(--text);
}

.tq-tab.is-active {
    font-weight: 600;
    color: var(--up);
    background: var(--up-soft);
    border-color: rgba(25, 211, 143, 0.5);
}

.tq-count {
    margin: 16px 2px 12px;
    font-size: 13.5px;
    color: var(--muted);
}

.tq-count strong {
    font-family: var(--mono);
    color: var(--text);
}

/* ------------------------------------------------------------
   PRODUCT GRID
   ------------------------------------------------------------ */

.tq-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

@media (min-width: 720px) {
    .tq-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1040px) {
    .tq-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

.tq-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    transition: border-color 0.15s;
}

.tq-card:hover {
    border-color: #2b3f63;
}

.tq-card.is-out {
    opacity: 0.6;
}

.tq-card-main {
    display: flex;
    flex: 1;
    gap: 12px;
    padding: 14px 14px 12px;
}

.tq-thumb {
    display: grid;
    flex: none;
    place-items: center;
    width: 76px;
    height: 76px;
    overflow: hidden;
    font-size: 28px;
    background: var(--panel-2);
    border-radius: 10px;
}

.tq-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tq-card.is-out .tq-thumb img {
    filter: grayscale(1);
}

.tq-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.tq-cat {
    align-self: flex-start;
    padding: 2px 8px;
    font-size: 11.5px;
    color: var(--muted);
    background: var(--panel-2);
    border-radius: 6px;
}

.tq-name {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
}

.tq-desc {
    display: -webkit-box;
    overflow: hidden;
    font-size: 13px;
    color: var(--muted);
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* stock depth bar */

.tq-depth {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    padding-top: 6px;
}

.tq-depth-bar {
    flex: 1;
    height: 5px;
    overflow: hidden;
    background: var(--line);
    border-radius: 999px;
}

.tq-depth-bar i {
    display: block;
    height: 100%;
    border-radius: 999px;
}

.tq-depth-bar.is-high i { background: var(--up); }
.tq-depth-bar.is-low i { background: var(--warn); }
.tq-depth-bar.is-out i { background: var(--down); }

.tq-stock {
    flex: none;
    font-size: 12px;
    font-weight: 600;
}

.tq-stock.is-high { color: var(--up); }
.tq-stock.is-low { color: var(--warn); }
.tq-stock.is-out { color: var(--down); }

/* quote row: price + action */

.tq-quote {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px dashed var(--line);
}

.tq-quote-price {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    min-width: 0;
}

.tq-price {
    font-family: var(--mono);
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.tq-unit {
    font-size: 12.5px;
    color: var(--muted);
}

.tq-tax {
    padding: 1px 7px;
    font-size: 11.5px;
    color: var(--warn);
    background: var(--warn-soft);
    border-radius: 6px;
}

.tq-buy {
    flex: none;
    min-width: 96px;
    padding: 10px 18px;
    font-weight: 700;
    color: #04150e;
    background: var(--up);
    border: 0;
    border-radius: 10px;
    transition: filter 0.15s, transform 0.1s;
}

.tq-buy:hover:not(:disabled) {
    filter: brightness(1.1);
}

.tq-buy:active:not(:disabled) {
    transform: scale(0.97);
}

.tq-buy:disabled {
    color: var(--down);
    background: var(--down-soft);
}

/* quantity stepper */

.tq-stepper {
    display: inline-flex;
    flex: none;
    align-items: center;
    overflow: hidden;
    background: var(--panel-2);
    border: 1px solid rgba(25, 211, 143, 0.45);
    border-radius: 10px;
}

.tq-stepper button {
    width: 38px;
    height: 38px;
    font-size: 20px;
    line-height: 1;
    color: var(--up);
    background: transparent;
    border: 0;
}

.tq-stepper button:hover:not(:disabled) {
    background: var(--up-soft);
}

.tq-stepper button:disabled {
    color: var(--muted);
    opacity: 0.5;
}

.tq-stepper span {
    min-width: 32px;
    font-family: var(--mono);
    font-weight: 700;
    text-align: center;
}

/* empty state */

.tq-empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 48px 20px;
    text-align: center;
    background: var(--panel);
    border: 1px dashed var(--line);
    border-radius: 14px;
}

.tq-empty-icon {
    font-size: 38px;
}

.tq-empty h2 {
    font-size: 19px;
}

.tq-empty p {
    margin-bottom: 8px;
    color: var(--muted);
}

/* ------------------------------------------------------------
   FLOATING CART BAR
   ------------------------------------------------------------ */

.tq-floating {
    position: fixed;
    left: 50%;
    bottom: calc(14px + env(safe-area-inset-bottom, 0px));
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 14px;
    width: calc(100% - 28px);
    max-width: 520px;
    padding: 12px 14px 12px 18px;
    color: #04150e;
    background: var(--up);
    border: 0;
    border-radius: 16px;
    box-shadow: 0 14px 34px rgba(25, 211, 143, 0.28), 0 4px 14px rgba(0, 0, 0, 0.5);
    transform: translateX(-50%);
    animation: tq-rise 0.25s ease-out;
}

.tq-floating-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.tq-floating-left b {
    display: grid;
    place-items: center;
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    font-family: var(--mono);
    color: var(--up);
    background: #04150e;
    border-radius: 8px;
}

.tq-floating-total {
    margin-left: auto;
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 700;
}

.tq-floating-cta {
    padding: 8px 14px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--up);
    background: #04150e;
    border-radius: 10px;
}

@keyframes tq-rise {
    from { opacity: 0; transform: translate(-50%, 16px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

/* ------------------------------------------------------------
   TOAST
   ------------------------------------------------------------ */

.tq-toast {
    position: fixed;
    left: 50%;
    top: calc(72px + env(safe-area-inset-top, 0px));
    z-index: 80;
    max-width: calc(100% - 32px);
    padding: 12px 18px;
    font-size: 14px;
    font-weight: 500;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-left: 4px solid var(--down);
    border-radius: 10px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    transform: translateX(-50%);
    animation: tq-drop 0.2s ease-out;
}

.tq-toast.is-success {
    border-left-color: var(--up);
}

@keyframes tq-drop {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

/* ------------------------------------------------------------
   ORDER SHEET (mobile bottom sheet / desktop side drawer)
   ------------------------------------------------------------ */

.tq-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(3, 6, 12, 0.72);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
}

.tq-sheet {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 92vh;
    max-height: 92dvh;
    background: var(--panel);
    border: 1px solid var(--line);
    border-bottom: 0;
    border-radius: 20px 20px 0 0;
    animation: tq-sheet-up 0.25s ease-out;
}

@keyframes tq-sheet-up {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes tq-sheet-in {
    from { transform: translateX(40px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@media (min-width: 768px) {
    .tq-overlay {
        align-items: stretch;
        justify-content: flex-end;
    }

    .tq-sheet {
        width: 440px;
        max-height: none;
        border-radius: 0;
        border-bottom: 1px solid var(--line);
        border-right: 0;
        animation-name: tq-sheet-in;
    }
}

.tq-sheet-head {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
}

.tq-sheet-head h2 {
    font-size: 19px;
    font-weight: 700;
}

.tq-sheet-head span {
    font-size: 13px;
    color: var(--muted);
}

.tq-sheet-head button {
    width: 34px;
    height: 34px;
    font-size: 22px;
    line-height: 1;
    color: var(--muted);
    background: var(--panel-2);
    border: 0;
    border-radius: 50%;
}

.tq-sheet-body {
    flex: 1;
    padding: 6px 18px 18px;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.tq-cart-empty {
    padding: 32px 0;
    text-align: center;
    color: var(--muted);
}

/* cart lines */

.tq-line {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
        "info total"
        "stepper remove";
    align-items: center;
    gap: 10px 12px;
    padding: 14px 0;
    border-bottom: 1px dashed var(--line);
}

.tq-line-info {
    grid-area: info;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.tq-line-info strong {
    font-weight: 600;
}

.tq-line-info span {
    font-family: var(--mono);
    font-size: 12.5px;
    color: var(--muted);
}

.tq-line .tq-stepper {
    grid-area: stepper;
    justify-self: start;
}

.tq-line .tq-stepper button {
    width: 34px;
    height: 34px;
}

.tq-line-total {
    grid-area: total;
    font-family: var(--mono);
    font-weight: 700;
    text-align: right;
}

.tq-remove {
    grid-area: remove;
    justify-self: end;
    width: 30px;
    height: 30px;
    font-size: 18px;
    line-height: 1;
    color: var(--down);
    background: var(--down-soft);
    border: 0;
    border-radius: 8px;
}

/* summary */

.tq-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--panel-2);
    border-radius: 12px;
}

.tq-summary > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--muted);
}

.tq-summary strong {
    font-family: var(--mono);
    font-weight: 500;
    color: var(--text);
}

.tq-summary .tq-summary-total {
    margin-top: 4px;
    padding-top: 12px;
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    border-top: 1px dashed var(--line);
}

.tq-summary .tq-summary-total strong {
    font-size: 20px;
    font-weight: 700;
    color: var(--up);
}

/* fields */

.tq-fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
}

.tq-fields h3 {
    font-size: 15px;
    font-weight: 600;
}

.tq-fields input,
.tq-fields textarea {
    width: 100%;
    padding: 12px 14px;
    resize: vertical;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    outline: none;
}

.tq-fields input::placeholder,
.tq-fields textarea::placeholder {
    color: var(--muted);
}

.tq-fields input:focus,
.tq-fields textarea:focus {
    border-color: var(--up);
    box-shadow: 0 0 0 3px var(--up-soft);
}

/* notice */

.tq-notice {
    margin-top: 16px;
    padding: 12px 14px;
    background: var(--warn-soft);
    border: 1px solid rgba(246, 183, 60, 0.3);
    border-radius: 12px;
}

.tq-notice strong {
    display: block;
    margin-bottom: 2px;
    color: var(--warn);
}

.tq-notice p {
    font-size: 13.5px;
    color: var(--muted);
}

/* place order */

.tq-sheet-foot {
    flex: none;
    padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
    background: var(--panel);
    border-top: 1px solid var(--line);
}

.tq-place {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 15px 18px;
    font-size: 16px;
    font-weight: 700;
    color: #04150e;
    background: var(--up);
    border: 0;
    border-radius: 12px;
    box-shadow: 0 8px 22px rgba(25, 211, 143, 0.22);
    transition: filter 0.15s, transform 0.1s;
}

.tq-place strong {
    font-family: var(--mono);
    font-size: 17px;
}

.tq-place:hover:not(:disabled) {
    filter: brightness(1.08);
}

.tq-place:active:not(:disabled) {
    transform: scale(0.985);
}

.tq-place:disabled {
    justify-content: center;
    box-shadow: none;
    opacity: 0.65;
}

/* ------------------------------------------------------------
   SMALL SCREENS
   ------------------------------------------------------------ */

@media (max-width: 380px) {
    .tq-live {
        display: none;
    }

    .tq-price {
        font-size: 19px;
    }
}

/* ------------------------------------------------------------
   REDUCED MOTION
   ------------------------------------------------------------ */

@media (prefers-reduced-motion: reduce) {
    .tq-app *,
    .tq-app *::before,
    .tq-app *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
    }

    .tq-ticker-track {
        animation: none !important;
    }

    .tq-ticker {
        overflow-x: auto;
    }
}

`;

const StyleTag = () => <style>{STYLES}</style>;



/* ------------------------------------------------------------ */
/* SMALL PRESENTATIONAL PIECES                                  */
/* ------------------------------------------------------------ */

function Stepper({ quantity, onMinus, onPlus, plusDisabled }) {
    return (
        <div className="tq-stepper">
            <button
                type="button"
                onClick={onMinus}
                aria-label="Decrease quantity"
            >
                −
            </button>

            <span>{quantity}</span>

            <button
                type="button"
                onClick={onPlus}
                disabled={plusDisabled}
                aria-label="Increase quantity"
            >
                +
            </button>
        </div>
    );
}

export default function PublicQRMenu() {
    const { token } = useParams();

    const [business, setBusiness] = useState(null);
    const [products, setProducts] = useState([]);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");

    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [successOrder, setSuccessOrder] = useState(null);
    const [placedTotal, setPlacedTotal] = useState(0);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    // ------------------------------------------------------------
    // TOAST
    // ------------------------------------------------------------

    const showToast = useCallback((message, type = "error") => {
        setToast({ message, type });
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 2800);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    // ------------------------------------------------------------
    // LOAD BUSINESS + PRODUCTS
    // ------------------------------------------------------------

    useEffect(() => {
        let mounted = true;

        const loadMenu = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getPublicQRMenu(token);
                const payload = response?.data || response || {};

                if (!mounted) return;

                setBusiness(payload.business || null);
                setProducts(
                    Array.isArray(payload.products)
                        ? payload.products
                        : []
                );
            } catch (err) {
                console.error("QR Menu Error:", err);

                if (!mounted) return;

                setBusiness(null);
                setProducts([]);
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load business menu"
                );
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (token) {
            loadMenu();
        } else {
            setLoading(false);
            setError("Invalid QR code.");
        }

        return () => {
            mounted = false;
        };
    }, [token]);

    // ------------------------------------------------------------
    // CART DRAWER: LOCK SCROLL + ESC TO CLOSE
    // ------------------------------------------------------------

    useEffect(() => {
        if (!showCart) return undefined;

        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKey = e => {
            if (e.key === "Escape") setShowCart(false);
        };

        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [showCart]);

    // ------------------------------------------------------------
    // CATEGORIES
    // ------------------------------------------------------------

    const categories = useMemo(() => {
        const values = products
            .map(product => product.category)
            .filter(Boolean);

        return ["All", ...new Set(values)];
    }, [products]);

    // ------------------------------------------------------------
    // FILTER
    // ------------------------------------------------------------

    const filteredProducts = useMemo(() => {
        const text = search.trim().toLowerCase();

        return products.filter(product => {
            const name = String(
                product.product_name || ""
            ).toLowerCase();

            const description = String(
                product.description || ""
            ).toLowerCase();

            const code = String(
                product.product_code || ""
            ).toLowerCase();

            const matchesSearch =
                !text ||
                name.includes(text) ||
                description.includes(text) ||
                code.includes(text);

            const matchesCategory =
                category === "All" ||
                product.category === category;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    // ------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------

    const getStock = product =>
        Number(product?.stock || 0);

    const getTax = product =>
        Number(product?.tax || 0);

    const getUnitPrice = product => {
        const sellingPrice = Number(
            product?.selling_price || 0
        );

        const pricePer = Number(
            product?.price_per || 1
        );

        if (!Number.isFinite(sellingPrice)) return 0;
        if (!Number.isFinite(pricePer) || pricePer <= 0) {
            return sellingPrice;
        }

        return sellingPrice / pricePer;
    };

    const money = value =>
        `₹${Number(value || 0).toFixed(2)}`;

    const maxStock = useMemo(
        () =>
            Math.max(
                1,
                ...products.map(p => Number(p?.stock || 0))
            ),
        [products]
    );

    const cartQty = useMemo(() => {
        const map = {};
        cart.forEach(item => {
            map[item.id] = Number(item.quantity);
        });
        return map;
    }, [cart]);

    // Ticker tape items (repeated so short menus still fill the strip)
    const tickerItems = useMemo(() => {
        if (!products.length) return [];

        const base = products.slice(0, 24);
        const repeats = Math.max(
            1,
            Math.ceil(12 / base.length)
        );

        return Array.from({ length: repeats }, () => base).flat();
    }, [products]);

    // ------------------------------------------------------------
    // CART
    // ------------------------------------------------------------

    const addToCart = product => {
        const stock = getStock(product);

        if (stock <= 0) {
            showToast("This product is out of stock.");
            return;
        }

        const existing = cart.find(
            item => item.id === product.id
        );

        if (existing && existing.quantity >= stock) {
            showToast(`Only ${stock} available.`);
            return;
        }

        setCart(current =>
            existing
                ? current.map(item =>
                      item.id === product.id
                          ? {
                                ...item,
                                quantity: item.quantity + 1
                            }
                          : item
                  )
                : [...current, { ...product, quantity: 1 }]
        );
    };

    const removeFromCart = productId => {
        setCart(current =>
            current.filter(item => item.id !== productId)
        );
    };

    const changeQuantity = (productId, amount) => {
        const item = cart.find(entry => entry.id === productId);

        if (!item) return;

        const quantity = Number(item.quantity) + amount;

        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const stock = getStock(item);

        if (quantity > stock) {
            showToast(`Only ${stock} available.`);
            return;
        }

        setCart(current =>
            current.map(entry =>
                entry.id === productId
                    ? { ...entry, quantity }
                    : entry
            )
        );
    };

    // ------------------------------------------------------------
    // TOTALS
    // ------------------------------------------------------------

    const subtotal = useMemo(
        () =>
            cart.reduce(
                (sum, item) =>
                    sum +
                    getUnitPrice(item) *
                        Number(item.quantity),
                0
            ),
        [cart]
    );

    const tax = useMemo(
        () =>
            cart.reduce((sum, item) => {
                const itemSubtotal =
                    getUnitPrice(item) *
                    Number(item.quantity);

                return (
                    sum +
                    itemSubtotal *
                        (getTax(item) / 100)
                );
            }, 0),
        [cart]
    );

    const total = subtotal + tax;

    const cartItemCount = cart.reduce(
        (sum, item) =>
            sum + Number(item.quantity),
        0
    );

    // ------------------------------------------------------------
    // PLACE ORDER
    // ------------------------------------------------------------

    const placeOrder = async () => {
        if (!cart.length) {
            showToast("Please add products to your cart.");
            return;
        }

        if (placing) return;

        try {
            setPlacing(true);

            const response = await createQROrder({
                qr_token: token,

                customer_name:
                    customerName.trim() || null,

                customer_phone:
                    customerPhone.trim() || null,

                notes:
                    notes.trim() || null,

                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: Number(item.quantity)
                }))
            });

            const payload =
                response?.data || response || {};

            // Keep the amount before the cart is cleared
            setPlacedTotal(total);

            setSuccessOrder(
                payload?.data ||
                payload?.order ||
                payload
            );

            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setNotes("");
            setShowCart(false);
        } catch (err) {
            console.error(
                "Place QR Order Error:",
                err
            );

            showToast(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to place order"
            );
        } finally {
            setPlacing(false);
        }
    };

    // ------------------------------------------------------------
    // LOADING
    // ------------------------------------------------------------

    if (loading) {
        return (
            <div className="tq-app tq-center">
                <StyleTag />
                <div className="tq-spinner" />
                <h2>Loading menu</h2>
                <p>Fetching live prices and stock.</p>
            </div>
        );
    }

    // ------------------------------------------------------------
    // ERROR
    // ------------------------------------------------------------

    if (!business || error) {
        return (
            <div className="tq-app tq-center">
                <StyleTag />
                <div className="tq-state-icon is-down">!</div>

                <h1>QR ordering unavailable</h1>

                <p>
                    {error ||
                        "This QR code is invalid, inactive or no longer available."}
                </p>
            </div>
        );
    }

    // ------------------------------------------------------------
    // ORDER SUCCESS
    // ------------------------------------------------------------

    if (successOrder) {
        const orderNumber =
            successOrder?.order_no ||
            successOrder?.orderNumber ||
            successOrder?.id ||
            "Received";

        const orderTotal = Number(
            successOrder?.total_amount ||
            placedTotal ||
            0
        );

        return (
            <div className="tq-app tq-center">
                <StyleTag />
                <div className="tq-state-icon is-up">✓</div>

                <h1>Order placed</h1>

                <p>
                    Your order has been sent to{" "}
                    <strong>{business.business_name}</strong>.
                </p>

                <div className="tq-receipt">
                    <div className="tq-receipt-row">
                        <span>Order</span>
                        <strong>#{orderNumber}</strong>
                    </div>

                    <div className="tq-receipt-row">
                        <span>Amount</span>
                        <strong className="tq-amount">
                            {money(orderTotal)}
                        </strong>
                    </div>

                    <div className="tq-receipt-row">
                        <span>Status</span>
                        <strong className="tq-status">
                            Waiting for owner
                        </strong>
                    </div>

                    <div className="tq-receipt-note">
                        <strong>What happens next?</strong>

                        <p>
                            The owner will review and accept
                            your order. After the owner
                            accepts it, pay the amount
                            directly to the owner using the
                            payment method provided by the
                            business.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="tq-primary"
                    onClick={() => setSuccessOrder(null)}
                >
                    Continue shopping
                </button>
            </div>
        );
    }

    // ------------------------------------------------------------
    // CUSTOMER MENU
    // ------------------------------------------------------------

    return (
        <div className="tq-app">
            <StyleTag />

            {/* HEADER */}

            <header className="tq-top">
                <div className="tq-top-inner">
                    <div className="tq-brand">
                        {business.logo ? (
                            <img
                                className="tq-logo"
                                src={business.logo}
                                alt={
                                    business.business_name ||
                                    "Business"
                                }
                            />
                        ) : (
                            <div className="tq-logo tq-logo-fallback">
                                {String(
                                    business.business_name || "B"
                                )
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}

                        <div className="tq-brand-text">
                            <h1>{business.business_name}</h1>
                            <p>Order online</p>
                        </div>
                    </div>

                    <div className="tq-live">
                        <i />
                        Live menu
                    </div>
                </div>
            </header>

            {/* TICKER TAPE */}

            {tickerItems.length > 0 && (
                <div className="tq-ticker" aria-hidden="true">
                    <div className="tq-ticker-track">
                        {[0, 1].map(loop => (
                            <div
                                className="tq-ticker-group"
                                key={loop}
                            >
                                {tickerItems.map((product, index) => {
                                    const up = getStock(product) > 0;

                                    return (
                                        <span
                                            className="tq-tick"
                                            key={`${loop}-${product.id}-${index}`}
                                        >
                                            <span className="tq-tick-name">
                                                {product.product_name}
                                            </span>
                                            <span className="tq-tick-price">
                                                {money(
                                                    getUnitPrice(product)
                                                )}
                                            </span>
                                            <span
                                                className={
                                                    up
                                                        ? "tq-up"
                                                        : "tq-down"
                                                }
                                            >
                                                {up ? "▲" : "▼"}
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="tq-shell">

                {/* BUSINESS INFORMATION */}

                {(business.address ||
                    business.city ||
                    business.phone) && (
                    <div className="tq-info-strip">
                        {business.address && (
                            <span className="tq-chip">
                                📍 {business.address}
                            </span>
                        )}

                        {business.city && (
                            <span className="tq-chip">
                                {business.city}
                                {business.state
                                    ? `, ${business.state}`
                                    : ""}
                            </span>
                        )}

                        {business.phone && (
                            <a
                                className="tq-chip"
                                href={`tel:${business.phone}`}
                            >
                                📞 {business.phone}
                            </a>
                        )}
                    </div>
                )}

                {/* SEARCH */}

                <div className="tq-search">
                    <span aria-hidden="true">🔎</span>

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search products..."
                        aria-label="Search products"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* CATEGORIES */}

                <div className="tq-tabs" role="tablist">
                    {categories.map(item => (
                        <button
                            key={item}
                            type="button"
                            role="tab"
                            aria-selected={category === item}
                            className={
                                category === item
                                    ? "tq-tab is-active"
                                    : "tq-tab"
                            }
                            onClick={() => setCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* PRODUCT COUNT */}

                <div className="tq-count">
                    <strong>{filteredProducts.length}</strong>{" "}
                    {filteredProducts.length === 1
                        ? "product"
                        : "products"}{" "}
                    available
                </div>

                {/* PRODUCTS */}

                <main className="tq-grid">
                    {filteredProducts.length === 0 ? (
                        <div className="tq-empty">
                            <div className="tq-empty-icon">
                                🛍️
                            </div>

                            <h2>No products found</h2>

                            <p>Try another search or category.</p>

                            {(search || category !== "All") && (
                                <button
                                    type="button"
                                    className="tq-secondary"
                                    onClick={() => {
                                        setSearch("");
                                        setCategory("All");
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            const stock = getStock(product);
                            const outOfStock = stock <= 0;
                            const lowStock =
                                !outOfStock &&
                                stock <= LOW_STOCK_LIMIT;

                            const qty = cartQty[product.id] || 0;

                            const depth = outOfStock
                                ? 0
                                : Math.max(
                                      6,
                                      Math.min(
                                          100,
                                          (stock / maxStock) * 100
                                      )
                                  );

                            const tone = outOfStock
                                ? "is-out"
                                : lowStock
                                ? "is-low"
                                : "is-high";

                            return (
                                <article
                                    className={
                                        outOfStock
                                            ? "tq-card is-out"
                                            : "tq-card"
                                    }
                                    key={product.id}
                                >
                                    <div className="tq-card-main">
                                        <div className="tq-thumb">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={
                                                        product.product_name
                                                    }
                                                />
                                            ) : (
                                                <span>🛍️</span>
                                            )}
                                        </div>

                                        <div className="tq-body">
                                            {product.category && (
                                                <span className="tq-cat">
                                                    {product.category}
                                                </span>
                                            )}

                                            <h3 className="tq-name">
                                                {product.product_name}
                                            </h3>

                                            {product.description && (
                                                <p className="tq-desc">
                                                    {product.description}
                                                </p>
                                            )}

                                            <div className="tq-depth">
                                                <div
                                                    className={`tq-depth-bar ${tone}`}
                                                >
                                                    <i
                                                        style={{
                                                            width: `${depth}%`
                                                        }}
                                                    />
                                                </div>

                                                <span
                                                    className={`tq-stock ${tone}`}
                                                >
                                                    {outOfStock
                                                        ? "Out of stock"
                                                        : lowStock
                                                        ? `Low · ${stock} left`
                                                        : "In stock"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tq-quote">
                                        <div className="tq-quote-price">
                                            <strong className="tq-price">
                                                {money(
                                                    getUnitPrice(product)
                                                )}
                                            </strong>

                                            <small className="tq-unit">
                                                per{" "}
                                                {product.price_unit ||
                                                    "unit"}
                                            </small>

                                            {getTax(product) > 0 && (
                                                <span className="tq-tax">
                                                    +{getTax(product)}% tax
                                                </span>
                                            )}
                                        </div>

                                        {outOfStock ? (
                                            <button
                                                type="button"
                                                className="tq-buy"
                                                disabled
                                            >
                                                Unavailable
                                            </button>
                                        ) : qty > 0 ? (
                                            <Stepper
                                                quantity={qty}
                                                onMinus={() =>
                                                    changeQuantity(
                                                        product.id,
                                                        -1
                                                    )
                                                }
                                                onPlus={() =>
                                                    changeQuantity(
                                                        product.id,
                                                        1
                                                    )
                                                }
                                                plusDisabled={
                                                    qty >= stock
                                                }
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                className="tq-buy"
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                            >
                                                + Add
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    )}
                </main>
            </div>

            {/* FLOATING CART */}

            {cart.length > 0 && !showCart && (
                <button
                    type="button"
                    className="tq-floating"
                    onClick={() => setShowCart(true)}
                >
                    <span className="tq-floating-left">
                        <b>{cartItemCount}</b>
                        {cartItemCount === 1 ? "item" : "items"}
                    </span>

                    <span className="tq-floating-total">
                        {money(total)}
                    </span>

                    <span className="tq-floating-cta">
                        View order
                    </span>
                </button>
            )}

            {/* TOAST */}

            {toast && (
                <div
                    className={`tq-toast is-${toast.type}`}
                    role="status"
                >
                    {toast.message}
                </div>
            )}

            {/* CART */}

            {showCart && (
                <div
                    className="tq-overlay"
                    onClick={e => {
                        if (e.target === e.currentTarget) {
                            setShowCart(false);
                        }
                    }}
                >
                    <aside
                        className="tq-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Your order"
                    >
                        <div className="tq-sheet-head">
                            <div>
                                <h2>Your order</h2>

                                <span>
                                    {cartItemCount}{" "}
                                    {cartItemCount === 1
                                        ? "item"
                                        : "items"}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCart(false)}
                                aria-label="Close order"
                            >
                                ×
                            </button>
                        </div>

                        <div className="tq-sheet-body">

                            {/* CART ITEMS */}

                            {cart.length === 0 ? (
                                <div className="tq-cart-empty">
                                    Your cart is empty.
                                </div>
                            ) : (
                                <div className="tq-lines">
                                    {cart.map(item => (
                                        <div
                                            className="tq-line"
                                            key={item.id}
                                        >
                                            <div className="tq-line-info">
                                                <strong>
                                                    {item.product_name}
                                                </strong>

                                                <span>
                                                    {money(
                                                        getUnitPrice(item)
                                                    )}{" "}
                                                    / {item.price_unit || "unit"}
                                                </span>
                                            </div>

                                            <Stepper
                                                quantity={item.quantity}
                                                onMinus={() =>
                                                    changeQuantity(
                                                        item.id,
                                                        -1
                                                    )
                                                }
                                                onPlus={() =>
                                                    changeQuantity(
                                                        item.id,
                                                        1
                                                    )
                                                }
                                                plusDisabled={
                                                    item.quantity >=
                                                    getStock(item)
                                                }
                                            />

                                            <div className="tq-line-total">
                                                {money(
                                                    getUnitPrice(item) *
                                                        Number(
                                                            item.quantity
                                                        )
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className="tq-remove"
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }
                                                aria-label={`Remove ${item.product_name}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* SUMMARY */}

                            <div className="tq-summary">
                                <div>
                                    <span>Subtotal</span>
                                    <strong>{money(subtotal)}</strong>
                                </div>

                                <div>
                                    <span>Tax</span>
                                    <strong>{money(tax)}</strong>
                                </div>

                                <div className="tq-summary-total">
                                    <span>Total</span>
                                    <strong>{money(total)}</strong>
                                </div>
                            </div>

                            {/* CUSTOMER DETAILS */}

                            <div className="tq-fields">
                                <h3>Order details</h3>

                                <input
                                    value={customerName}
                                    onChange={e =>
                                        setCustomerName(e.target.value)
                                    }
                                    placeholder="Your name (optional)"
                                />

                                <input
                                    value={customerPhone}
                                    onChange={e =>
                                        setCustomerPhone(e.target.value)
                                    }
                                    placeholder="Phone number (optional)"
                                    type="tel"
                                />

                                <textarea
                                    value={notes}
                                    onChange={e =>
                                        setNotes(e.target.value)
                                    }
                                    placeholder="Order note (optional)"
                                    rows="3"
                                />
                            </div>

                            {/* PAYMENT MESSAGE */}

                            <div className="tq-notice">
                                <strong>Pay directly to the owner</strong>

                                <p>
                                    Place the order first. The owner
                                    will accept it and provide the
                                    payment instructions.
                                </p>
                            </div>
                        </div>

                        {/* PLACE ORDER */}

                        <div className="tq-sheet-foot">
                            <button
                                type="button"
                                className="tq-place"
                                disabled={placing || !cart.length}
                                onClick={placeOrder}
                            >
                                <span>
                                    {placing
                                        ? "Placing order..."
                                        : "Place order"}
                                </span>

                                {!placing && (
                                    <strong>{money(total)}</strong>
                                )}
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}