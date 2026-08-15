import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

/**
 * AddPurchase — "Goods Received Note" design
 *
 * Concept: a supplier delivery challan / stock-intake booklet, staple-bound
 * on the left margin, with a carbon-copy tear line separating the item
 * ledger from the office totals, and a rubber ink stamp that appears once
 * a supplier is chosen — as if the godown clerk just received the goods.
 */
export default function AddPurchase() {
    const navigate = useNavigate();
    const businessId = localStorage.getItem("businessId");

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        supplier_id: "",
        payment_method: "Cash",
        payment_status: "Paid",
        paid_amount: "",
        discount: 0,
        tax: 0,
        notes: ""
    });

    const [items, setItems] = useState([
        { product_id: "", quantity: 1, purchase_price: 0, tax: 0 }
    ]);

    // GRN number — generated once per visit, like tearing a fresh page off the pad
    const [grnNumber] = useState(() => {
        const n = Math.floor(100 + Math.random() * 900);
        return `GRN-${new Date().getFullYear()}-${n}`;
    });

    const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    useEffect(() => {
        loadSuppliers();
        loadProducts();
    }, []);

    const loadSuppliers = async () => {
        try {
            const res = await API.get(`/suppliers?business_id=${businessId}`);
            setSuppliers(res.data.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await API.get(`/products?business_id=${businessId}`);
            setProducts(res.data.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    const handleForm = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleItem = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    const addRow = () => {
        setItems([...items, { product_id: "", quantity: 1, purchase_price: 0, tax: 0 }]);
    };

    const removeRow = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.purchase_price),
        0
    );

    const grandTotal = subtotal - Number(form.discount || 0) + Number(form.tax || 0);
    const dueAmount = grandTotal - Number(form.paid_amount || 0);

    const handleSubmit = async () => {
        if (!form.supplier_id) {
            return alert("Select Supplier");
        }
        if (items.length === 0) {
            return alert("Add Products");
        }
        const emptyRow = items.some((item) => !item.product_id);
        if (emptyRow) {
            return alert("Please select a product for all rows");
        }

        try {
            setLoading(true);
            await API.post("/purchases", {
                business_id: businessId,
                supplier_id: form.supplier_id,
                discount: Number(form.discount || 0),
                tax: Number(form.tax || 0),
                payment_method: form.payment_method,
                payment_status: form.payment_status,
                paid_amount: Number(form.paid_amount || 0),
                notes: form.notes,
                products: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: Number(item.quantity),
                    purchase_price: Number(item.purchase_price),
                    tax: Number(item.tax || 0)
                }))
            });
            alert("Purchase Saved Successfully");
            navigate("/purchases");
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Purchase Failed");
        } finally {
            setLoading(false);
        }
    };

    const selectedSupplier = suppliers.find((s) => s.id == form.supplier_id);

    return (
        <div className="grn-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

                .grn-root {
                    --kraft: #e7dbc0;
                    --paper: #fbf7ee;
                    --ink: #2c2013;
                    --ink-soft: #6b5c47;
                    --rust: #a3431c;
                    --rust-deep: #7c3115;
                    --indigo: #2f4858;
                    --green: #3f6b4c;
                    --amber: #b5741f;
                    --line: #d8c9a8;
                    font-family: 'Inter', sans-serif;
                    color: var(--ink);
                    background: var(--kraft);
                    background-image:
                        radial-gradient(circle at 1px 1px, rgba(44,32,19,0.06) 1px, transparent 0);
                    background-size: 18px 18px;
                    min-height: 100vh;
                    padding: 40px 20px;
                }

                .grn-card {
                    max-width: 1180px;
                    margin: 0 auto;
                    background: var(--paper);
                    border: 1px solid var(--line);
                    border-radius: 4px;
                    position: relative;
                    padding: 40px 46px 40px 74px;
                    box-shadow: 0 18px 40px rgba(44,32,19,0.16), 0 2px 0 var(--paper);
                }

                /* staple-bound left margin */
                .staple-margin {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 40px;
                    background: linear-gradient(90deg, rgba(44,32,19,0.05), transparent);
                    border-right: 1px dashed var(--line);
                }
                .staple {
                    position: absolute;
                    left: 14px;
                    width: 11px;
                    height: 11px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 30%, #d9cdb1, #a99a7a 70%);
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.35), 0 1px 1px rgba(255,255,255,0.4);
                }
                .staple::after {
                    content: "";
                    position: absolute;
                    inset: 3px;
                    border-radius: 50%;
                    background: var(--paper);
                }

                .grn-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid var(--ink);
                }
                .grn-eyebrow {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 2.5px;
                    color: var(--rust);
                    text-transform: uppercase;
                    margin: 0 0 4px;
                }
                .grn-title {
                    font-family: 'Rozha One', serif;
                    font-size: 34px;
                    margin: 0;
                    color: var(--ink);
                }
                .grn-meta {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12.5px;
                    text-align: right;
                    border: 1px dashed var(--rust);
                    border-radius: 3px;
                    padding: 10px 16px;
                    color: var(--rust-deep);
                    background: rgba(163,67,28,0.05);
                    line-height: 1.7;
                }
                .grn-meta b { color: var(--ink); }

                .stamp {
                    position: absolute;
                    top: 26px;
                    right: 46px;
                    width: 118px;
                    height: 118px;
                    border: 3px solid var(--rust);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    transform: rotate(-11deg);
                    color: var(--rust);
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    font-size: 11px;
                    letter-spacing: 1px;
                    line-height: 1.5;
                    opacity: 0.85;
                    mix-blend-mode: multiply;
                    pointer-events: none;
                }
                .stamp::before {
                    content: "";
                    position: absolute;
                    inset: 7px;
                    border: 1px solid var(--rust);
                    border-radius: 50%;
                }

                .section-label {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin: 30px 0 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .section-label::after {
                    content: "";
                    flex: 1;
                    height: 1px;
                    background: var(--line);
                }

                .field-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                .field label {
                    display: block;
                    font-size: 12.5px;
                    font-weight: 600;
                    color: var(--ink-soft);
                    margin-bottom: 6px;
                }
                .field select,
                .field input,
                .field textarea {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px 2px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14.5px;
                    color: var(--ink);
                    background: transparent;
                    border: none;
                    border-bottom: 1.5px solid var(--line);
                    outline: none;
                    transition: border-color 0.2s;
                }
                .field select:focus,
                .field input:focus,
                .field textarea:focus {
                    border-bottom-color: var(--rust);
                }

                .ledger-wrap {
                    overflow-x: auto;
                    border: 1px solid var(--line);
                    border-radius: 4px;
                    margin-top: 4px;
                }
                table.ledger {
                    width: 100%;
                    min-width: 640px;
                    border-collapse: collapse;
                }
                table.ledger thead tr {
                    background: var(--rust);
                }
                table.ledger thead th {
                    color: #fbf3e8;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    text-align: left;
                    padding: 12px 14px;
                    font-weight: 500;
                }
                table.ledger tbody tr:nth-child(odd) { background: rgba(163,67,28,0.045); }
                table.ledger tbody tr:hover { background: rgba(163,67,28,0.09); }
                table.ledger td {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--line);
                    vertical-align: middle;
                }
                table.ledger select,
                table.ledger input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 7px 4px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: transparent;
                    border: none;
                    border-bottom: 1.5px solid var(--line);
                    outline: none;
                }
                table.ledger select:focus,
                table.ledger input:focus { border-bottom-color: var(--rust); }
                table.ledger .row-total {
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    color: var(--indigo);
                }
                .remove-btn {
                    background: transparent;
                    color: var(--rust-deep);
                    border: 1px solid var(--rust-deep);
                    padding: 6px 10px;
                    border-radius: 3px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                }
                .remove-btn:hover { background: var(--rust-deep); color: #fff; }

                .add-row-btn {
                    margin-top: 14px;
                    background: transparent;
                    border: 1.5px dashed var(--rust);
                    color: var(--rust-deep);
                    padding: 10px 20px;
                    border-radius: 4px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 13px;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: background 0.2s, border-style 0.2s;
                }
                .add-row-btn:hover { background: rgba(163,67,28,0.08); border-style: solid; }

                .tear-divider {
                    margin: 36px 0 24px;
                    text-align: center;
                    position: relative;
                    color: var(--ink-soft);
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10.5px;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                }
                .tear-divider::before {
                    content: "";
                    position: absolute;
                    left: 0; right: 0; top: 50%;
                    border-top: 2px dashed var(--line);
                }
                .tear-divider span {
                    position: relative;
                    background: var(--paper);
                    padding: 0 14px;
                }

                .totals-panel {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1.2fr;
                    gap: 22px;
                    align-items: end;
                }
                .total-box {
                    border: 1px solid var(--line);
                    border-radius: 4px;
                    padding: 18px 20px;
                    background: rgba(44,32,19,0.02);
                }
                .total-box .amount-label {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin-bottom: 4px;
                }
                .total-box .amount-value {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 15px;
                    color: var(--ink);
                }
                .grand-stamp {
                    border: 2px solid var(--indigo);
                    border-radius: 4px;
                    padding: 16px 22px;
                    background: rgba(47,72,88,0.05);
                    transform: rotate(-1.2deg);
                }
                .grand-stamp .amount-label { color: var(--indigo); }
                .grand-stamp .grand-value {
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    font-size: 30px;
                    color: var(--indigo);
                }

                .due-strip {
                    margin-top: 22px;
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    border: 2px dashed var(--amber);
                    border-radius: 4px;
                    padding: 12px 20px;
                    transform: rotate(-0.6deg);
                    color: var(--amber);
                    background: rgba(181,116,31,0.06);
                }
                .due-strip .amount-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; }
                .due-strip .due-value { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 20px; }
                .due-clear { color: var(--green); border-color: var(--green); background: rgba(63,107,76,0.06); }
                .due-clear .amount-label, .due-clear .due-value { color: var(--green); }

                .notes-field {
                    margin-top: 30px;
                    border-top: 1px dashed var(--line);
                    padding-top: 18px;
                }
                .notes-field textarea { resize: vertical; }

                .actions {
                    margin-top: 34px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 14px;
                }
                .btn {
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    font-size: 14px;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    border: none;
                    transition: transform 0.15s, opacity 0.15s;
                }
                .btn:active { transform: translateY(1px); }
                .btn-ghost {
                    background: transparent;
                    color: var(--ink-soft);
                    border: 1.5px solid var(--line);
                }
                .btn-ghost:hover { border-color: var(--ink-soft); color: var(--ink); }
                .btn-primary {
                    background: var(--rust);
                    color: #fbf3e8;
                    letter-spacing: 0.3px;
                }
                .btn-primary:hover:not(:disabled) { background: var(--rust-deep); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                @media (max-width: 720px) {
                    .grn-card { padding: 32px 24px 32px 54px; }
                    .field-grid { grid-template-columns: 1fr; }
                    .totals-panel { grid-template-columns: 1fr; }
                    .grn-header { flex-direction: column; }
                    .stamp { display: none; }
                }
            `}</style>

            <div className="grn-card">
                <div className="staple-margin">
                    <span className="staple" style={{ top: 46 }} />
                    <span className="staple" style={{ top: "50%", marginTop: -6 }} />
                    <span className="staple" style={{ bottom: 46 }} />
                </div>

                {form.supplier_id && (
                    <div className="stamp">GOODS<br />RECEIVED<br />✓ {today}</div>
                )}

                <div className="grn-header">
                    <div>
                        <p className="grn-eyebrow">Stock Intake · Godown Copy</p>
                        <h2 className="grn-title">Goods Received Note</h2>
                    </div>
                    <div className="grn-meta">
                        GRN No. <b>{grnNumber}</b><br />
                        Date &nbsp;&nbsp;&nbsp;&nbsp;<b>{today}</b><br />
                        Supplier <b>{selectedSupplier ? selectedSupplier.supplier_name : "—"}</b>
                    </div>
                </div>

                <p className="section-label">Supplier &amp; Terms</p>
                <div className="field-grid">
                    <div className="field">
                        <label>Supplier *</label>
                        <select name="supplier_id" value={form.supplier_id} onChange={handleForm}>
                            <option value="">Select Supplier</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.supplier_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Payment Method</label>
                        <select name="payment_method" value={form.payment_method} onChange={handleForm}>
                            <option>Cash</option>
                            <option>UPI</option>
                            <option>Card</option>
                            <option>Bank</option>
                            <option>Credit</option>
                        </select>
                    </div>
                </div>

                <p className="section-label">Items Received</p>
                <div className="ledger-wrap">
                    <table className="ledger">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th width="100">Qty</th>
                                <th width="140">Purchase Price</th>
                                <th width="110">Tax</th>
                                <th width="140">Total</th>
                                <th width="80">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => {
                                const total = Number(item.quantity) * Number(item.purchase_price);
                                return (
                                    <tr key={index}>
                                        <td>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => {
                                                    const product = products.find((p) => p.id == e.target.value);
                                                    handleItem(index, "product_id", e.target.value);
                                                    handleItem(index, "purchase_price", product?.purchase_price || 0);
                                                }}
                                            >
                                                <option value="">Select Product</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.product_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItem(index, "quantity", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.purchase_price}
                                                onChange={(e) => handleItem(index, "purchase_price", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.tax}
                                                onChange={(e) => handleItem(index, "tax", e.target.value)}
                                            />
                                        </td>
                                        <td className="row-total">₹{total.toFixed(2)}</td>
                                        <td>
                                            {items.length > 1 && (
                                                <button type="button" className="remove-btn" onClick={() => removeRow(index)}>
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <button type="button" className="add-row-btn" onClick={addRow}>
                    + Add Product Line
                </button>

                <div className="tear-divider"><span>✂ carbon copy · office totals below</span></div>

                <div className="totals-panel">
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Discount</label>
                        <input
                            type="number"
                            name="discount"
                            min="0"
                            step="0.01"
                            value={form.discount}
                            onChange={handleForm}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                        <label>Tax</label>
                        <input
                            type="number"
                            name="tax"
                            min="0"
                            step="0.01"
                            value={form.tax}
                            onChange={handleForm}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grand-stamp">
                        <div className="amount-label">Grand Total</div>
                        <div className="grand-value">₹{grandTotal.toFixed(2)}</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                            Subtotal ₹{subtotal.toFixed(2)}
                        </div>
                    </div>
                </div>

                <p className="section-label">Payment</p>
                <div className="field-grid">
                    <div className="field">
                        <label>Payment Status</label>
                        <select name="payment_status" value={form.payment_status} onChange={handleForm}>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div className="field">
                        <label>Paid Amount</label>
                        <input
                            type="number"
                            name="paid_amount"
                            min="0"
                            step="0.01"
                            value={form.paid_amount}
                            onChange={handleForm}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className={`due-strip ${dueAmount <= 0 ? "due-clear" : ""}`}>
                    <span className="amount-label">{dueAmount <= 0 ? "Settled" : "Due Amount"}</span>
                    <span className="due-value">₹{Math.abs(dueAmount).toFixed(2)}</span>
                </div>

                <div className="notes-field">
                    <div className="field">
                        <label>Notes</label>
                        <textarea
                            name="notes"
                            rows="4"
                            value={form.notes}
                            onChange={handleForm}
                            placeholder="Additional notes about this delivery..."
                        />
                    </div>
                </div>

                <div className="actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate("/purchases")}>
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving..." : "Save Purchase"}
                    </button>
                </div>
            </div>
        </div>
    );
}