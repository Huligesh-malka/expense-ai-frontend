import React, { useEffect, useState } from "react";

import {
    getQR,
    updateQRStatus,
    getTables,
    createTable,
    deleteTable
} from "../api/qrOrderApi";

export default function QROrdering() {

    const [qr, setQr] = useState(null);
    const [tables, setTables] = useState([]);

    const [tableNumber, setTableNumber] = useState("");
    const [tableName, setTableName] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {

        try {

            setLoading(true);

            const [qrResponse, tableResponse] =
                await Promise.all([
                    getQR(),
                    getTables()
                ]);

            setQr(qrResponse.data);
            setTables(tableResponse.data || []);

        } catch (error) {

            alert(error.message);

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadData();
    }, []);


    const addTable = async () => {

        if (!tableNumber.trim()) {
            alert("Enter table number");
            return;
        }

        try {

            setSaving(true);

            await createTable({
                table_number: tableNumber.trim(),
                table_name: tableName.trim() || null
            });

            setTableNumber("");
            setTableName("");

            await loadData();

        } catch (error) {

            alert(error.message);

        } finally {

            setSaving(false);

        }
    };


    const removeTable = async (id) => {

        if (!window.confirm(
            "Delete this table?"
        )) {
            return;
        }

        try {

            await deleteTable(id);

            await loadData();

        } catch (error) {

            alert(error.message);

        }
    };


    const toggleQR = async () => {

        if (!qr) return;

        const newStatus =
            qr.status === "active"
                ? "inactive"
                : "active";

        try {

            await updateQRStatus(newStatus);

            await loadData();

        } catch (error) {

            alert(error.message);

        }
    };


    const copyQRLink = async () => {

        if (!qr?.qr_url) return;

        try {

            await navigator.clipboard.writeText(
                qr.qr_url
            );

            alert("QR link copied");

        } catch {

            alert(qr.qr_url);

        }
    };


    const printQR = () => {

        window.print();

    };


    if (loading) {

        return (
            <div className="qr-loading">
                Loading QR Ordering...
            </div>
        );

    }


    return (
        <div className="qr-page">

            <div className="qr-page-header">

                <div>
                    <h1>QR Ordering</h1>

                    <p>
                        Let customers scan one QR,
                        select their table and order.
                    </p>
                </div>

                <button
                    className={
                        qr?.status === "active"
                            ? "danger-btn"
                            : "success-btn"
                    }
                    onClick={toggleQR}
                >
                    {qr?.status === "active"
                        ? "Disable QR"
                        : "Enable QR"}
                </button>

            </div>


            {/* ================================= */}
            {/* QR CARD */}
            {/* ================================= */}

            <div className="qr-card">

                <div className="qr-card-left">

                    <h2>
                        Your Restaurant QR
                    </h2>

                    <p>
                        Use this single QR code
                        throughout your restaurant.
                    </p>


                    <div className="qr-status">

                        <span
                            className={
                                qr?.status === "active"
                                    ? "status-dot active"
                                    : "status-dot inactive"
                            }
                        />

                        {qr?.status === "active"
                            ? "QR Menu Active"
                            : "QR Menu Disabled"}

                    </div>


                    <div className="qr-url">

                        {qr?.qr_url}

                    </div>


                    <div className="qr-actions">

                        <button
                            onClick={copyQRLink}
                            className="secondary-btn"
                        >
                            Copy Link
                        </button>

                        <button
                            onClick={printQR}
                            className="primary-btn"
                        >
                            Print QR
                        </button>

                    </div>

                </div>


                <div className="qr-image-box">

                    {qr?.qr_url ? (

                        <img
                            src={
                                `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                                    qr.qr_url
                                )}`
                            }
                            alt="Restaurant QR Code"
                        />

                    ) : (

                        <div>
                            QR unavailable
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

                        <h2>Restaurant Tables</h2>

                        <p>
                            Customers select their table
                            after scanning the QR.
                        </p>

                    </div>

                    <span className="count-badge">
                        {tables.length} Tables
                    </span>

                </div>


                <div className="add-table">

                    <input
                        value={tableNumber}
                        onChange={(e) =>
                            setTableNumber(e.target.value)
                        }
                        placeholder="Table number"
                    />

                    <input
                        value={tableName}
                        onChange={(e) =>
                            setTableName(e.target.value)
                        }
                        placeholder="Table name (optional)"
                    />

                    <button
                        onClick={addTable}
                        disabled={saving}
                        className="primary-btn"
                    >
                        + Add Table
                    </button>

                </div>


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
                                Table {table.table_number}
                            </strong>

                            {table.table_name && (
                                <span>
                                    {table.table_name}
                                </span>
                            )}

                            <button
                                className="delete-btn"
                                onClick={() =>
                                    removeTable(table.id)
                                }
                            >
                                Delete
                            </button>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}