import React, {
    useEffect,
    useState
} from "react";

import {
    getQR,
    updateQRStatus
} from "../services/qrOrderApi";

export default function QROrdering() {

    const [qr, setQr] = useState(null);

    const [loading, setLoading] =
        useState(true);

    const [qrUpdating, setQrUpdating] =
        useState(false);


    // =========================================================
    // LOAD BUSINESS QR
    // =========================================================

    const loadQR = async () => {

        try {

            setLoading(true);

            const response =
                await getQR();


            const payload =
                response?.data;


            setQr(
                payload?.data ||
                payload ||
                null
            );

        } catch (error) {

            console.error(
                "QR Ordering Load Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                error.message ||
                "Failed to load QR ordering"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        loadQR();

    }, []);


    // =========================================================
    // ENABLE / DISABLE QR
    // =========================================================

    const toggleQR = async () => {

        if (!qr) {
            return;
        }


        const newStatus =
            qr.status === "active"
                ? "inactive"
                : "active";


        try {

            setQrUpdating(true);


            await updateQRStatus(
                newStatus
            );


            await loadQR();

        } catch (error) {

            console.error(
                "Update QR Status Error:",
                error
            );


            alert(
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

    const copyQRLink = async () => {

        if (!qr?.qr_url) {

            alert(
                "QR link is not available"
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                qr.qr_url
            );


            alert(
                "QR ordering link copied"
            );

        } catch (error) {

            console.error(
                "Copy QR Error:",
                error
            );


            alert(qr.qr_url);
        }
    };


    // =========================================================
    // PRINT QR
    // =========================================================

    const printQR = () => {

        if (!qr?.qr_url) {

            alert(
                "QR code is not available"
            );

            return;
        }


        window.print();
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="qr-loading">

                <h2>
                    Loading QR Ordering...
                </h2>

                <p>
                    Preparing your business QR code.
                </p>

            </div>
        );
    }


    // =========================================================
    // QR NOT AVAILABLE
    // =========================================================

    if (!qr) {

        return (

            <div className="qr-loading">

                <h2>
                    QR code unavailable
                </h2>

                <p>
                    We could not load your business QR code.
                </p>

                <button
                    className="primary-btn"
                    onClick={loadQR}
                >
                    Try Again
                </button>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="qr-page">


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="qr-page-header">

                <div>

                    <div className="page-eyebrow">
                        CUSTOMER ORDERING
                    </div>

                    <h1>
                        QR Ordering
                    </h1>

                    <p>
                        Let customers scan your QR code,
                        browse products, add items to their
                        cart and place orders from their phone.
                    </p>

                </div>


                <button
                    className={
                        qr.status === "active"
                            ? "danger-btn"
                            : "success-btn"
                    }

                    onClick={toggleQR}

                    disabled={qrUpdating}
                >

                    {qrUpdating
                        ? "Updating..."
                        : qr.status === "active"
                            ? "Disable QR"
                            : "Enable QR"}

                </button>

            </div>



            {/* ================================================= */}
            {/* QR CARD */}
            {/* ================================================= */}

            <div className="qr-card">


                {/* LEFT */}

                <div className="qr-card-left">

                    <div className="qr-badge">
                        BUSINESS QR
                    </div>


                    <h2>
                        Your Business QR
                    </h2>


                    <p>
                        Place this QR code at your
                        counter, entrance, store or
                        any customer-facing location.
                    </p>


                    {/* STATUS */}

                    <div className="qr-status">

                        <span
                            className={
                                qr.status === "active"
                                    ? "status-dot active"
                                    : "status-dot inactive"
                            }
                        />

                        <span>

                            {qr.status === "active"
                                ? "QR Ordering Active"
                                : "QR Ordering Disabled"}

                        </span>

                    </div>


                    {/* LINK */}

                    <div className="qr-link-label">
                        Customer ordering link
                    </div>


                    <div className="qr-url">

                        {qr.qr_url ||
                            "QR link unavailable"}

                    </div>


                    {/* ACTIONS */}

                    <div className="qr-actions">

                        <button
                            className="secondary-btn"
                            onClick={copyQRLink}
                            disabled={!qr.qr_url}
                        >
                            Copy Link
                        </button>


                        <button
                            className="primary-btn"
                            onClick={printQR}
                            disabled={!qr.qr_url}
                        >
                            Print QR
                        </button>

                    </div>

                </div>



                {/* RIGHT - QR IMAGE */}

                <div className="qr-image-box">

                    {qr.qr_url ? (

                        <img
                            src={
                                `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
                                    qr.qr_url
                                )}`
                            }

                            alt="Business QR Code"

                            width="320"

                            height="320"
                        />

                    ) : (

                        <div className="qr-unavailable">

                            <div>
                                QR
                            </div>

                            <span>
                                QR unavailable
                            </span>

                        </div>

                    )}

                </div>

            </div>



            {/* ================================================= */}
            {/* HOW IT WORKS */}
            {/* ================================================= */}

            <div className="section-card">

                <div className="section-header">

                    <div>

                        <h2>
                            How QR Ordering Works
                        </h2>

                        <p>
                            A simple ordering experience
                            for your customers.
                        </p>

                    </div>

                </div>


                <div className="qr-flow">


                    <div className="qr-flow-item">

                        <div className="qr-flow-number">
                            01
                        </div>

                        <h3>
                            Customer Scans
                        </h3>

                        <p>
                            The customer scans your
                            business QR code.
                        </p>

                    </div>



                    <div className="qr-flow-item">

                        <div className="qr-flow-number">
                            02
                        </div>

                        <h3>
                            Select Products
                        </h3>

                        <p>
                            They browse your products
                            and add items to their cart.
                        </p>

                    </div>



                    <div className="qr-flow-item">

                        <div className="qr-flow-number">
                            03
                        </div>

                        <h3>
                            Place Order
                        </h3>

                        <p>
                            The order is sent directly
                            to your business dashboard.
                        </p>

                    </div>



                    <div className="qr-flow-item">

                        <div className="qr-flow-number">
                            04
                        </div>

                        <h3>
                            Accept & Process
                        </h3>

                        <p>
                            Review the order, accept it
                            and process the payment.
                        </p>

                    </div>

                </div>

            </div>



            {/* ================================================= */}
            {/* CUSTOMER EXPERIENCE */}
            {/* ================================================= */}

            <div className="section-card">

                <div className="section-header">

                    <div>

                        <h2>
                            One QR. Simple Ordering.
                        </h2>

                        <p>
                            Your customers do not need
                            another application.
                        </p>

                    </div>

                </div>


                <div className="qr-benefits">


                    <div>

                        <strong>
                            No App Required
                        </strong>

                        <span>
                            Customers order directly
                            from their browser.
                        </span>

                    </div>



                    <div>

                        <strong>
                            Product Ordering
                        </strong>

                        <span>
                            Customers see your products,
                            prices and available items.
                        </span>

                    </div>



                    <div>

                        <strong>
                            Instant Orders
                        </strong>

                        <span>
                            New orders appear directly
                            in your business dashboard.
                        </span>

                    </div>



                    <div>

                        <strong>
                            Simple Experience
                        </strong>

                        <span>
                            Scan → Select → Cart → Order.
                        </span>

                    </div>

                </div>

            </div>



            {/* ================================================= */}
            {/* OWNER FLOW */}
            {/* ================================================= */}

            <div className="section-card">

                <div className="section-header">

                    <div>

                        <h2>
                            Designed for Your Business
                        </h2>

                        <p>
                            Orders connect directly with
                            your existing business system.
                        </p>

                    </div>

                </div>


                <div className="owner-flow">

                    <span>
                        Customer Order
                    </span>

                    <b>→</b>

                    <span>
                        Owner Dashboard
                    </span>

                    <b>→</b>

                    <span>
                        Accept
                    </span>

                    <b>→</b>

                    <span>
                        Payment
                    </span>

                    <b>→</b>

                    <span>
                        Bill & Sale
                    </span>

                    <b>→</b>

                    <span>
                        Inventory Updated
                    </span>

                </div>

            </div>

        </div>
    );
}