import React, { useEffect, useState } from "react";

import {
    getQR,
    updateQRStatus,
    getTables,
    createTable,
    deleteTable
} from "../services/qrOrderApi";

export default function QROrdering() {

    const [qr, setQr] = useState(null);
    const [tables, setTables] = useState([]);

    const [tableNumber, setTableNumber] = useState("");
    const [tableName, setTableName] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [qrUpdating, setQrUpdating] = useState(false);

    // =========================================
    // LOAD QR + TABLES
    // =========================================

    const loadData = async () => {
        try {
            setLoading(true);

            const [qrResponse, tableResponse] =
                await Promise.all([
                    getQR(),
                    getTables()
                ]);

            // Axios response:
            // qrResponse.data = backend JSON
            //
            // Backend:
            // {
            //   success: true,
            //   data: {...}
            // }

            const qrPayload = qrResponse?.data;
            const tablePayload = tableResponse?.data;

            setQr(
                qrPayload?.data ||
                qrPayload ||
                null
            );

            setTables(
                tablePayload?.data ||
                []
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
        loadData();
    }, []);


    // =========================================
    // ADD TABLE
    // =========================================

    const addTable = async () => {

        if (!tableNumber.trim()) {
            alert("Enter table number");
            return;
        }

        try {

            setSaving(true);

            await createTable({
                table_number:
                    tableNumber.trim(),

                table_name:
                    tableName.trim() || null
            });

            setTableNumber("");
            setTableName("");

            await loadData();

        } catch (error) {

            console.error(
                "Create Table Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                error.message ||
                "Failed to create table"
            );

        } finally {

            setSaving(false);

        }
    };


    // =========================================
    // DELETE TABLE
    // =========================================

    const removeTable = async (id) => {

        const confirmed = window.confirm(
            "Delete this table?"
        );

        if (!confirmed) {
            return;
        }

        try {

            await deleteTable(id);

            await loadData();

        } catch (error) {

            console.error(
                "Delete Table Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                error.message ||
                "Failed to delete table"
            );

        }
    };


    // =========================================
    // ENABLE / DISABLE QR
    // =========================================

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

            await loadData();

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


    // =========================================
    // COPY QR LINK
    // =========================================

    const copyQRLink = async () => {

        if (!qr?.qr_url) {
            alert("QR link is not available");
            return;
        }

        try {

            await navigator.clipboard.writeText(
                qr.qr_url
            );

            alert("QR link copied");

        } catch (error) {

            console.error(
                "Copy QR Error:",
                error
            );

            alert(qr.qr_url);

        }
    };


    // =========================================
    // PRINT QR
    // =========================================

    const printQR = () => {

        if (!qr?.qr_url) {
            alert("QR code is not available");
            return;
        }

        window.print();
    };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (
            <div className="qr-loading">
                <h2>Loading QR Ordering...</h2>
                <p>
                    Connecting to your business
                    QR service.
                </p>
            </div>
        );

    }


    // =========================================
    // PAGE
    // =========================================

    return (

        <div className="qr-page">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="qr-page-header">

                <div>

                    <h1>
                        QR Ordering
                    </h1>

                    <p>
                        Customers scan one QR
                        code to open your menu.
                    </p>

                </div>


                <button
                    className={
                        qr?.status === "active"
                            ? "danger-btn"
                            : "success-btn"
                    }
                    onClick={toggleQR}
                    disabled={qrUpdating}
                >

                    {qrUpdating
                        ? "Updating..."
                        : qr?.status === "active"
                            ? "Disable QR"
                            : "Enable QR"}

                </button>

            </div>


            {/* ================================= */}
            {/* QR CODE */}
            {/* ================================= */}

            <div className="qr-card">

                <div className="qr-card-left">

                    <h2>
                        Your Restaurant QR
                    </h2>

                    <p>
                        Place this QR code on
                        tables, counters or bills.
                    </p>


                    {/* STATUS */}

                    <div className="qr-status">

                        <span
                            className={
                                qr?.status === "active"
                                    ? "status-dot active"
                                    : "status-dot inactive"
                            }
                        />

                        <span>
                            {qr?.status === "active"
                                ? "QR Menu Active"
                                : "QR Menu Disabled"}
                        </span>

                    </div>


                    {/* QR URL */}

                    {qr?.qr_url ? (

                        <div className="qr-url">

                            {qr.qr_url}

                        </div>

                    ) : (

                        <div className="qr-url">

                            QR link unavailable

                        </div>

                    )}


                    {/* ACTIONS */}

                    <div className="qr-actions">

                        <button
                            onClick={copyQRLink}
                            className="secondary-btn"
                            disabled={!qr?.qr_url}
                        >
                            Copy Link
                        </button>


                        <button
                            onClick={printQR}
                            className="primary-btn"
                            disabled={!qr?.qr_url}
                        >
                            Print QR
                        </button>

                    </div>

                </div>


                {/* ================================= */}
                {/* QR IMAGE */}
                {/* ================================= */}

                <div className="qr-image-box">

                    {qr?.qr_url ? (

                        <img
                            src={
                                `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                    qr.qr_url
                                )}`
                            }
                            alt="Restaurant QR Code"
                            width="300"
                            height="300"
                        />

                    ) : (

                        <div className="qr-unavailable">

                            <div>
                                📱
                            </div>

                            <span>
                                QR unavailable
                            </span>

                        </div>

                    )}

                </div>

            </div>


            {/* ================================= */}
            {/* TABLES */}
            {/* ================================= */}

            <div className="section-card">

                <div className="section-header">

                    <div>

                        <h2>
                            Restaurant Tables
                        </h2>

                        <p>
                            Add your tables so customers
                            can select their table after
                            scanning the QR.
                        </p>

                    </div>


                    <span className="count-badge">
                        {tables.length}{" "}
                        {tables.length === 1
                            ? "Table"
                            : "Tables"}
                    </span>

                </div>


                {/* ADD TABLE */}

                <div className="add-table">

                    <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) =>
                            setTableNumber(
                                e.target.value
                            )
                        }
                        placeholder="Table number"
                        disabled={saving}
                    />


                    <input
                        type="text"
                        value={tableName}
                        onChange={(e) =>
                            setTableName(
                                e.target.value
                            )
                        }
                        placeholder="Table name (optional)"
                        disabled={saving}
                    />


                    <button
                        onClick={addTable}
                        disabled={saving}
                        className="primary-btn"
                    >

                        {saving
                            ? "Adding..."
                            : "+ Add Table"}

                    </button>

                </div>


                {/* TABLE LIST */}

                {tables.length === 0 ? (

                    <div className="empty-tables">

                        <div>
                            🪑
                        </div>

                        <h3>
                            No tables added
                        </h3>

                        <p>
                            Add your restaurant tables
                            above.
                        </p>

                    </div>

                ) : (

                    <div className="table-grid">

                        {tables.map((table) => (

                            <div
                                className="table-box"
                                key={table.id}
                            >

                                <div className="table-icon">
                                    🪑
                                </div>


                                <strong>
                                    Table{" "}
                                    {table.table_number}
                                </strong>


                                {table.table_name && (

                                    <span>
                                        {
                                            table.table_name
                                        }
                                    </span>

                                )}


                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        removeTable(
                                            table.id
                                        )
                                    }
                                >
                                    Delete
                                </button>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>

    );

}