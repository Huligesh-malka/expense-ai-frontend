import React, {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    getQR,
    updateQRStatus
} from "../services/qrOrderApi";

/*
 * OWNER SIDE  -  QR ORDERING PAGE  -  TRADING STYLE UI
 *
 * Styles are kept inside this same file (see STYLES below).
 * Every class is prefixed with "qo-" so it cannot clash with
 * your existing global CSS.
 */

/* ------------------------------------------------------------ */
/* STYLES                                                       */
/* ------------------------------------------------------------ */

const STYLES = `
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap");

.qo-page {
    --bg: #0a0f1a;
    --panel: #111a2b;
    --panel-2: #16213a;
    --line: #1f2d47;
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
    max-width: 1120px;
    margin: 0 auto;
    padding: 20px 16px 32px;
    color: var(--text);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.45;
    background-color: var(--bg);
    background-image:
        radial-gradient(800px 360px at 50% -100px, rgba(25, 211, 143, 0.09), transparent 70%),
        linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
    background-size: auto, 40px 40px, 40px 40px;
    border-radius: 18px;
    -webkit-font-smoothing: antialiased;
}

@media (min-width: 720px) {
    .qo-page {
        padding: 28px 28px 40px;
    }
}

.qo-page *,
.qo-page *::before,
.qo-page *::after {
    box-sizing: border-box;
}

.qo-page h1,
.qo-page h2,
.qo-page h3,
.qo-page p {
    margin: 0;
}

.qo-page button {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    cursor: pointer;
}

.qo-page button:disabled {
    cursor: not-allowed;
}

.qo-page :focus-visible {
    outline: 2px solid var(--up);
    outline-offset: 2px;
}

/* ---------------- buttons ---------------- */

.qo-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 18px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid transparent;
    border-radius: 10px;
    transition: filter 0.15s, transform 0.1s, background 0.15s;
}

.qo-btn:active:not(:disabled) {
    transform: scale(0.98);
}

.qo-btn:disabled {
    opacity: 0.6;
}

.qo-btn-primary {
    color: #04150e;
    background: var(--up);
}

.qo-btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
}

.qo-btn-ghost {
    color: var(--text);
    background: var(--panel-2);
    border-color: var(--line);
}

.qo-btn-ghost:hover:not(:disabled) {
    border-color: #2b3f63;
}

.qo-btn-up {
    color: var(--up);
    background: var(--up-soft);
    border-color: rgba(25, 211, 143, 0.45);
}

.qo-btn-down {
    color: var(--down);
    background: var(--down-soft);
    border-color: rgba(255, 92, 108, 0.45);
}

.qo-btn-up:hover:not(:disabled),
.qo-btn-down:hover:not(:disabled) {
    filter: brightness(1.15);
}

/* ---------------- loading / error ---------------- */

.qo-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 60vh;
    text-align: center;
}

.qo-center h2 {
    font-size: 22px;
}

.qo-center p {
    max-width: 380px;
    color: var(--muted);
}

.qo-spinner {
    width: 42px;
    height: 42px;
    border: 3px solid var(--line);
    border-top-color: var(--up);
    border-radius: 50%;
    animation: qo-spin 0.8s linear infinite;
}

@keyframes qo-spin {
    to { transform: rotate(360deg); }
}

/* ---------------- header ---------------- */

.qo-head {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
}

@media (min-width: 720px) {
    .qo-head {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
    }
}

.qo-head h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.qo-head p {
    max-width: 560px;
    margin-top: 6px;
    color: var(--muted);
}

.qo-head-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.qo-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid transparent;
    border-radius: 999px;
}

.qo-pill i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
}

.qo-pill.is-live {
    color: var(--up);
    background: var(--up-soft);
    border-color: rgba(25, 211, 143, 0.35);
}

.qo-pill.is-live i {
    animation: qo-pulse 1.8s ease-out infinite;
    box-shadow: 0 0 0 0 rgba(25, 211, 143, 0.6);
}

.qo-pill.is-off {
    color: var(--down);
    background: var(--down-soft);
    border-color: rgba(255, 92, 108, 0.35);
}

@keyframes qo-pulse {
    70% { box-shadow: 0 0 0 7px rgba(25, 211, 143, 0); }
    100% { box-shadow: 0 0 0 0 rgba(25, 211, 143, 0); }
}

/* ---------------- hero ---------------- */

.qo-hero {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 16px;
}

@media (min-width: 860px) {
    .qo-hero {
        grid-template-columns: 1fr 340px;
        gap: 32px;
        padding: 28px;
    }
}

.qo-hero-main {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
}

.qo-hero-main h2 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.qo-hero-main > p {
    max-width: 480px;
    color: var(--muted);
}

.qo-status-line {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    font-weight: 500;
    border-radius: 10px;
}

.qo-status-line.is-live {
    color: var(--up);
    background: var(--up-soft);
}

.qo-status-line.is-off {
    color: var(--down);
    background: var(--down-soft);
}

.qo-status-line small {
    display: block;
    font-size: 12.5px;
    font-weight: 400;
    color: var(--muted);
}

.qo-dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
}

.qo-link-label {
    margin-top: 4px;
    font-size: 13px;
    color: var(--muted);
}

.qo-link {
    padding: 12px 14px;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 13px;
    white-space: nowrap;
    color: var(--up);
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    scrollbar-width: thin;
}

.qo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 4px;
}

@media (max-width: 480px) {
    .qo-actions .qo-btn {
        flex: 1 1 100%;
    }
}

/* ---------------- QR frame ---------------- */

.qo-qr-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.qo-qr {
    position: relative;
    width: 100%;
    max-width: 340px;
    padding: 22px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 0 0 1px var(--line), 0 18px 50px rgba(25, 211, 143, 0.14);
}

.qo-qr img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
}

.qo-qr.is-off img {
    filter: grayscale(1) blur(2px);
    opacity: 0.35;
}

.qo-qr-off {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 20px;
    font-weight: 700;
    color: var(--down);
}

.qo-corner {
    position: absolute;
    width: 22px;
    height: 22px;
    border: 3px solid var(--up);
}

.qo-corner.tl { top: 8px; left: 8px; border-right: 0; border-bottom: 0; border-top-left-radius: 8px; }
.qo-corner.tr { top: 8px; right: 8px; border-left: 0; border-bottom: 0; border-top-right-radius: 8px; }
.qo-corner.bl { bottom: 8px; left: 8px; border-right: 0; border-top: 0; border-bottom-left-radius: 8px; }
.qo-corner.br { bottom: 8px; right: 8px; border-left: 0; border-top: 0; border-bottom-right-radius: 8px; }

.qo-qr-caption {
    font-size: 13px;
    color: var(--muted);
    text-align: center;
}

/* ---------------- section cards ---------------- */

.qo-section {
    margin-top: 16px;
    padding: 20px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 16px;
}

@media (min-width: 720px) {
    .qo-section {
        padding: 24px 28px;
    }
}

.qo-section-head {
    margin-bottom: 18px;
}

.qo-section-head h2 {
    font-size: 18px;
    font-weight: 700;
}

.qo-section-head p {
    margin-top: 3px;
    font-size: 14px;
    color: var(--muted);
}

/* ---------------- info table ---------------- */

.qo-info {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
}

@media (min-width: 720px) {
    .qo-info {
        grid-template-columns: 1fr 1fr;
    }
}

.qo-info > div {
    min-width: 0;
    padding: 12px 14px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 10px;
}

.qo-info span {
    display: block;
    margin-bottom: 4px;
    font-size: 12.5px;
    color: var(--muted);
}

.qo-info strong {
    display: block;
    font-family: var(--mono);
    font-size: 13.5px;
    font-weight: 500;
    word-break: break-all;
}

.qo-info .is-live {
    color: var(--up);
}

.qo-info .is-off {
    color: var(--down);
}

/* ---------------- steps (a real sequence) ---------------- */

.qo-steps {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

@media (min-width: 560px) {
    .qo-steps {
        grid-template-columns: 1fr 1fr;
    }
}

@media (min-width: 900px) {
    .qo-steps {
        grid-template-columns: repeat(4, 1fr);
    }
}

.qo-step {
    position: relative;
    padding: 16px;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 12px;
}

.qo-step-no {
    display: inline-grid;
    place-items: center;
    min-width: 36px;
    height: 28px;
    margin-bottom: 10px;
    padding: 0 8px;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--up);
    background: var(--up-soft);
    border-radius: 8px;
}

.qo-step h3 {
    margin-bottom: 4px;
    font-size: 15.5px;
    font-weight: 600;
}

.qo-step p {
    font-size: 13.5px;
    color: var(--muted);
}

/* ---------------- benefits ---------------- */

.qo-benefits {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

@media (min-width: 560px) {
    .qo-benefits {
        grid-template-columns: 1fr 1fr;
    }
}

@media (min-width: 900px) {
    .qo-benefits {
        grid-template-columns: repeat(4, 1fr);
    }
}

.qo-benefit {
    padding: 16px;
    border-left: 3px solid var(--up);
    background: var(--panel-2);
    border-radius: 0 12px 12px 0;
}

.qo-benefit strong {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
}

.qo-benefit span {
    font-size: 13.5px;
    color: var(--muted);
}

/* ---------------- order lifecycle ---------------- */

.qo-flow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.qo-flow span {
    padding: 9px 14px;
    font-size: 14px;
    font-weight: 500;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 999px;
}

.qo-flow span.is-final {
    color: var(--up);
    background: var(--up-soft);
    border-color: rgba(25, 211, 143, 0.45);
}

.qo-flow b {
    font-family: var(--mono);
    color: var(--muted);
}

/* ---------------- toast ---------------- */

.qo-toast {
    position: fixed;
    left: 50%;
    top: calc(20px + env(safe-area-inset-top, 0px));
    z-index: 200;
    max-width: calc(100% - 32px);
    padding: 12px 18px;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    background: #16213a;
    border: 1px solid #1f2d47;
    border-left: 4px solid #ff5c6c;
    border-radius: 10px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    transform: translateX(-50%);
    animation: qo-drop 0.2s ease-out;
}

.qo-toast.is-success {
    border-left-color: #19d38f;
}

@keyframes qo-drop {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

/* ---------------- print: only the QR poster ---------------- */

.qo-print {
    display: none;
}

@media print {
    body * {
        visibility: hidden !important;
    }

    .qo-print,
    .qo-print * {
        visibility: visible !important;
    }

    .qo-print {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        padding: 60px 40px;
        color: #000;
        background: #fff;
        font-family: "IBM Plex Sans", system-ui, sans-serif;
        text-align: center;
    }

    .qo-print h2 {
        margin: 0;
        font-size: 44px;
    }

    .qo-print p {
        margin: 0;
        font-size: 18px;
        color: #333;
    }

    .qo-print img {
        width: 360px;
        height: 360px;
    }

    .qo-print code {
        font-size: 13px;
        word-break: break-all;
        color: #555;
    }
}

/* ---------------- reduced motion ---------------- */

@media (prefers-reduced-motion: reduce) {
    .qo-page *,
    .qo-page *::before,
    .qo-page *::after,
    .qo-toast {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
    }
}
`;

const StyleTag = () => <style>{STYLES}</style>;

/* ------------------------------------------------------------ */
/* STATIC CONTENT                                               */
/* ------------------------------------------------------------ */

const STEPS = [
    {
        no: "01",
        title: "Customer scans",
        text: "The customer scans your business QR code."
    },
    {
        no: "02",
        title: "Select products",
        text: "They browse your products and add items to their cart."
    },
    {
        no: "03",
        title: "Place order",
        text: "The order is sent directly to your business dashboard."
    },
    {
        no: "04",
        title: "Accept & process",
        text: "Review the order, accept it and process the payment."
    }
];

const BENEFITS = [
    {
        title: "No app required",
        text: "Customers order directly from their browser."
    },
    {
        title: "Product ordering",
        text: "Customers see your products, prices and available items."
    },
    {
        title: "Instant orders",
        text: "New orders appear directly in your business dashboard."
    },
    {
        title: "Simple experience",
        text: "Scan → Select → Cart → Order."
    }
];

const LIFECYCLE = [
    "Customer order",
    "Owner dashboard",
    "Accept",
    "Payment",
    "Bill & sale",
    "Inventory updated"
];

export default function QROrdering() {

    const [qr, setQr] = useState(null);

    const [loading, setLoading] = useState(true);

    const [qrUpdating, setQrUpdating] = useState(false);

    const [copied, setCopied] = useState(false);

    const [toast, setToast] = useState(null);

    const toastTimer = useRef(null);
    const copiedTimer = useRef(null);


    // =========================================================
    // TOAST
    // =========================================================

    const showToast = useCallback((message, type = "error") => {
        setToast({ message, type });

        clearTimeout(toastTimer.current);

        toastTimer.current = setTimeout(
            () => setToast(null),
            2800
        );
    }, []);

    useEffect(
        () => () => {
            clearTimeout(toastTimer.current);
            clearTimeout(copiedTimer.current);
        },
        []
    );


    // =========================================================
    // LOAD BUSINESS QR
    // =========================================================

    const loadQR = useCallback(async () => {

        try {

            setLoading(true);

            const response = await getQR();

            /*
             * Expected backend response:
             *
             * {
             *   success: true,
             *   data: {
             *      id: 1,
             *      business_id: 2,
             *      qr_token: "55080..."
             *   }
             * }
             */

            const responseData = response?.data;

            const qrData =
                responseData?.data ||
                responseData;

            if (!qrData) {
                throw new Error(
                    "QR data was not returned by the server"
                );
            }

            if (!qrData.qr_token) {
                throw new Error(
                    "QR token was not returned by the server"
                );
            }

            // Build the customer URL from the current frontend
            // domain instead of depending on backend qr_url.

            const customerQRUrl =
                `${window.location.origin}/qr/${qrData.qr_token}`;

            setQr({
                ...qrData,

                qr_url: customerQRUrl,

                // If backend does not send status,
                // assume active because the API returned it.
                status: qrData.status || "active"
            });

        } catch (error) {

            console.error(
                "QR Ordering Load Error:",
                error
            );

            setQr(null);

            showToast(
                error.response?.data?.message ||
                error.message ||
                "Failed to load QR ordering"
            );

        } finally {

            setLoading(false);
        }
    }, [showToast]);


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        loadQR();
    }, [loadQR]);


    // =========================================================
    // ENABLE / DISABLE QR
    // =========================================================

    const toggleQR = async () => {

        if (!qr) return;

        const newStatus =
            qr.status === "active"
                ? "inactive"
                : "active";

        try {

            setQrUpdating(true);

            await updateQRStatus(newStatus);

            // Update UI immediately.
            setQr(current => ({
                ...current,
                status: newStatus
            }));

            showToast(
                newStatus === "active"
                    ? "QR ordering is now live"
                    : "QR ordering is disabled",
                "success"
            );

        } catch (error) {

            console.error(
                "Update QR Status Error:",
                error
            );

            showToast(
                error.response?.data?.message ||
                error.message ||
                "Failed to update QR status"
            );

        } finally {

            setQrUpdating(false);
        }
    };


    // =========================================================
    // COPY QR LINK
    // =========================================================

    const markCopied = () => {
        setCopied(true);

        clearTimeout(copiedTimer.current);

        copiedTimer.current = setTimeout(
            () => setCopied(false),
            2000
        );

        showToast("QR ordering link copied", "success");
    };

    const copyQRLink = async () => {

        if (!qr?.qr_url) {
            showToast("QR link is not available");
            return;
        }

        try {

            await navigator.clipboard.writeText(qr.qr_url);

            markCopied();

        } catch (error) {

            console.error("Copy QR Error:", error);

            // Fallback for browsers where clipboard
            // permission is blocked.

            const input = document.createElement("input");

            input.value = qr.qr_url;

            document.body.appendChild(input);

            input.select();

            document.execCommand("copy");

            document.body.removeChild(input);

            markCopied();
        }
    };


    // =========================================================
    // PRINT QR  (print styles show only the QR poster)
    // =========================================================

    const printQR = () => {

        if (!qr?.qr_url) {
            showToast("QR code is not available");
            return;
        }

        window.print();
    };


    // =========================================================
    // OPEN CUSTOMER PAGE
    // =========================================================

    const openCustomerPage = () => {

        if (!qr?.qr_url) {
            showToast("QR link is not available");
            return;
        }

        window.open(
            qr.qr_url,
            "_blank",
            "noopener,noreferrer"
        );
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (
            <div className="qo-page qo-center">
                <StyleTag />

                <div className="qo-spinner" />

                <h2>Loading QR ordering</h2>

                <p>Preparing your business QR code.</p>
            </div>
        );
    }


    // =========================================================
    // QR NOT AVAILABLE
    // =========================================================

    if (!qr) {

        return (
            <div className="qo-page qo-center">
                <StyleTag />

                <h2>QR code unavailable</h2>

                <p>
                    We could not load your business QR code.
                </p>

                <button
                    type="button"
                    className="qo-btn qo-btn-primary"
                    onClick={loadQR}
                >
                    Try again
                </button>

                {toast && (
                    <div
                        className={`qo-toast is-${toast.type}`}
                        role="status"
                    >
                        {toast.message}
                    </div>
                )}
            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    const active = qr.status === "active";

    const qrImage =
        `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&data=${encodeURIComponent(
            qr.qr_url
        )}`;

    return (

        <div className="qo-page">
            <StyleTag />


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <header className="qo-head">

                <div>
                    <h1>QR Ordering</h1>

                    <p>
                        Let customers scan your QR code,
                        browse products, add items to their
                        cart and place orders from their phone.
                    </p>
                </div>

                <div className="qo-head-actions">

                    <span
                        className={
                            active
                                ? "qo-pill is-live"
                                : "qo-pill is-off"
                        }
                    >
                        <i />
                        {active ? "Live" : "Paused"}
                    </span>

                    <button
                        type="button"
                        className={
                            active
                                ? "qo-btn qo-btn-down"
                                : "qo-btn qo-btn-up"
                        }
                        onClick={toggleQR}
                        disabled={qrUpdating}
                    >
                        {qrUpdating
                            ? "Updating..."
                            : active
                            ? "Disable QR"
                            : "Enable QR"}
                    </button>

                </div>

            </header>


            {/* ================================================= */}
            {/* QR CARD */}
            {/* ================================================= */}

            <section className="qo-hero">

                <div className="qo-hero-main">

                    <h2>Your business QR</h2>

                    <p>
                        Place this QR code at your counter,
                        entrance, store or any customer-facing
                        location.
                    </p>

                    {/* STATUS */}

                    <div
                        className={
                            active
                                ? "qo-status-line is-live"
                                : "qo-status-line is-off"
                        }
                    >
                        <span className="qo-dot" />

                        <div>
                            {active
                                ? "QR ordering active"
                                : "QR ordering disabled"}

                            <small>
                                {active
                                    ? "Customers can scan and place orders."
                                    : "Customers will not be able to place orders."}
                            </small>
                        </div>
                    </div>

                    {/* CUSTOMER LINK */}

                    <div className="qo-link-label">
                        Customer ordering link
                    </div>

                    <div className="qo-link">
                        {qr.qr_url}
                    </div>

                    {/* ACTIONS */}

                    <div className="qo-actions">

                        <button
                            type="button"
                            className="qo-btn qo-btn-primary"
                            onClick={printQR}
                        >
                            Print QR
                        </button>

                        <button
                            type="button"
                            className="qo-btn qo-btn-ghost"
                            onClick={copyQRLink}
                        >
                            {copied ? "Copied ✓" : "Copy link"}
                        </button>

                        <button
                            type="button"
                            className="qo-btn qo-btn-ghost"
                            onClick={openCustomerPage}
                        >
                            Open customer page
                        </button>

                    </div>

                </div>

                {/* QR IMAGE */}

                <div className="qo-qr-wrap">

                    <div
                        className={
                            active ? "qo-qr" : "qo-qr is-off"
                        }
                    >
                        <span className="qo-corner tl" />
                        <span className="qo-corner tr" />
                        <span className="qo-corner bl" />
                        <span className="qo-corner br" />

                        <img
                            src={qrImage}
                            alt="Business QR Code"
                            width="320"
                            height="320"
                        />

                        {!active && (
                            <div className="qo-qr-off">
                                Paused
                            </div>
                        )}
                    </div>

                    <p className="qo-qr-caption">
                        Scan with your phone to preview the
                        customer menu.
                    </p>

                </div>

            </section>


            {/* ================================================= */}
            {/* QR TOKEN INFORMATION */}
            {/* ================================================= */}

            <section className="qo-section">

                <div className="qo-section-head">
                    <h2>QR code information</h2>

                    <p>
                        This QR code is permanently connected
                        to your business.
                    </p>
                </div>

                <div className="qo-info">

                    <div>
                        <span>QR token</span>
                        <strong>{qr.qr_token}</strong>
                    </div>

                    <div>
                        <span>Business ID</span>
                        <strong>{qr.business_id}</strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong
                            className={
                                active ? "is-live" : "is-off"
                            }
                        >
                            {qr.status}
                        </strong>
                    </div>

                    <div>
                        <span>Customer URL</span>
                        <strong>{qr.qr_url}</strong>
                    </div>

                </div>

            </section>


            {/* ================================================= */}
            {/* HOW IT WORKS */}
            {/* ================================================= */}

            <section className="qo-section">

                <div className="qo-section-head">
                    <h2>How QR ordering works</h2>

                    <p>
                        A simple ordering experience for your
                        customers.
                    </p>
                </div>

                <div className="qo-steps">
                    {STEPS.map(step => (
                        <div className="qo-step" key={step.no}>
                            <span className="qo-step-no">
                                {step.no}
                            </span>

                            <h3>{step.title}</h3>

                            <p>{step.text}</p>
                        </div>
                    ))}
                </div>

            </section>


            {/* ================================================= */}
            {/* CUSTOMER EXPERIENCE */}
            {/* ================================================= */}

            <section className="qo-section">

                <div className="qo-section-head">
                    <h2>One QR. Simple ordering.</h2>

                    <p>
                        Your customers do not need another
                        application.
                    </p>
                </div>

                <div className="qo-benefits">
                    {BENEFITS.map(item => (
                        <div
                            className="qo-benefit"
                            key={item.title}
                        >
                            <strong>{item.title}</strong>

                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>

            </section>


            {/* ================================================= */}
            {/* OWNER FLOW */}
            {/* ================================================= */}

            <section className="qo-section">

                <div className="qo-section-head">
                    <h2>Designed for your business</h2>

                    <p>
                        Orders connect directly with your
                        existing business system.
                    </p>
                </div>

                <div className="qo-flow">
                    {LIFECYCLE.map((label, index) => (
                        <React.Fragment key={label}>
                            <span
                                className={
                                    index === LIFECYCLE.length - 1
                                        ? "is-final"
                                        : ""
                                }
                            >
                                {label}
                            </span>

                            {index < LIFECYCLE.length - 1 && (
                                <b>→</b>
                            )}
                        </React.Fragment>
                    ))}
                </div>

            </section>


            {/* ================================================= */}
            {/* TOAST */}
            {/* ================================================= */}

            {toast && (
                <div
                    className={`qo-toast is-${toast.type}`}
                    role="status"
                >
                    {toast.message}
                </div>
            )}


            {/* ================================================= */}
            {/* PRINT SHEET (visible only when printing) */}
            {/* ================================================= */}

            <div className="qo-print" aria-hidden="true">
                <h2>Scan to order</h2>

                <p>
                    Point your phone camera at the QR code,
                    pick your products and place your order.
                </p>

                <img
                    src={qrImage}
                    alt=""
                    width="360"
                    height="360"
                />

                <code>{qr.qr_url}</code>
            </div>

        </div>
    );
}