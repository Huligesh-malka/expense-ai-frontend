import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

/**
 * AddPurchase — "Stock Intake Card" design
 *
 * Concept: an old godown index-card catalog — cards hung on a metal ring
 * inside a filing drawer, one card per delivery. Forest green + brass,
 * a punched ring-hole binding along the top edge, a brass tab that names
 * the card, and a wax-seal badge that stamps in once a supplier is picked.
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

    // Card index number — one per drawer card
    const [cardNumber] = useState(() => {
        const n = Math.floor(1000 + Math.random() * 9000);
        return `#${n}`;
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
    const holes = new Array(9).fill(0);

    return (
        <div className="sic-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

                .sic-root {
                    --forest: #1e3d2f;
                    --forest-deep: #14281f;
                    --brass: #b98b32;
                    --brass-light: #d9b565;
                    --cream: #f6f0e1;
                    --backdrop: #e4dcc6;
                    --ink: #241f16;
                    --ink-soft: #6e6350;
                    --maroon: #7c2d3b;
                    --sage: #4c6b45;
                    --line: #dccfae;
                    font-family: 'Inter', sans-serif;
                    color: var(--ink);
                    background: var(--backdrop);
                    min-height: 100vh;
                    padding: 44px 20px;
                }

                .sic-card {
                    max-width: 1160px;
                    margin: 0 auto;
                    background: var(--cream);
                    border-radius: 6px;
                    position: relative;
                    box-shadow: 0 20px 44px rgba(20,40,31,0.22);
                    padding: 54px 46px 42px;
                }

                /* ring-binder holes along the top edge */
                .ring-strip {
                    position: absolute;
                    top: -1px;
                    left: 0;
                    right: 0;
                    height: 28px;
                    display: flex;
                    justify-content: space-evenly;
                    padding: 0 60px;
                }
                .ring-hole {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--backdrop);
                    box-shadow: inset 0 2px 3px rgba(0,0,0,0.28);
                    margin-top: -8px;
                }

                /* brass tab sticking out top-right, like a filed index card */
                .brass-tab {
                    position: absolute;
                    top: 26px;
                    right: -14px;
                    background: var(--brass);
                    color: var(--forest-deep);
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    font-size: 12px;
                    letter-spacing: 1px;
                    padding: 8px 18px 8px 14px;
                    border-radius: 3px 0 0 3px;
                    box-shadow: -2px 3px 6px rgba(20,40,31,0.25);
                }

                .sic-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 18px;
                    border-bottom: 3px solid var(--forest);
                    padding-bottom: 18px;
                }
                .sic-eyebrow {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: var(--brass);
                    margin: 0 0 6px;
                }
                .sic-title {
                    font-family: 'Oswald', sans-serif;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 30px;
                    color: var(--forest);
                    margin: 0;
                }
                .sic-meta {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12.5px;
                    text-align: right;
                    color: var(--ink-soft);
                    line-height: 1.8;
                }
                .sic-meta b { color: var(--forest); }

                /* wax-seal badge, appears once a supplier is chosen */
                .seal {
                    position: absolute;
                    top: 58px;
                    right: 44px;
                    width: 76px;
                    height: 76px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 32% 28%, var(--brass-light), var(--brass) 65%, #92701f 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(20,40,31,0.35), inset 0 -3px 6px rgba(0,0,0,0.2);
                    transform: rotate(-6deg);
                }
                .seal span {
                    font-family: 'Oswald', sans-serif;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    color: var(--forest-deep);
                    text-align: center;
                    line-height: 1.3;
                }

                .section-label {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin: 28px 0 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .section-label::before {
                    content: "";
                    width: 8px;
                    height: 8px;
                    background: var(--brass);
                    transform: rotate(45deg);
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
                    padding: 10px 12px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14.5px;
                    color: var(--ink);
                    background: #fff;
                    border: 1.5px solid var(--line);
                    border-radius: 4px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .field select:focus,
                .field input:focus,
                .field textarea:focus {
                    border-color: var(--forest);
                    box-shadow: 0 0 0 3px rgba(30,61,47,0.12);
                }

                .ledger-wrap {
                    overflow-x: auto;
                    border: 1.5px solid var(--line);
                    border-radius: 6px;
                    margin-top: 4px;
                }
                table.ledger {
                    width: 100%;
                    min-width: 640px;
                    border-collapse: collapse;
                }
                table.ledger thead tr {
                    background: var(--forest);
                }
                table.ledger thead th {
                    color: var(--brass-light);
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    text-align: left;
                    padding: 12px 14px;
                    font-weight: 500;
                }
                table.ledger tbody tr:nth-child(odd) { background: rgba(30,61,47,0.035); }
                table.ledger tbody tr:hover { background: rgba(185,139,50,0.09); }
                table.ledger td {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--line);
                    vertical-align: middle;
                }
                table.ledger select,
                table.ledger input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 8px 8px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    background: #fff;
                    border: 1px solid var(--line);
                    border-radius: 3px;
                    outline: none;
                }
                table.ledger select:focus,
                table.ledger input:focus { border-color: var(--forest); }
                table.ledger .row-total {
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    color: var(--forest);
                }
                .remove-btn {
                    background: transparent;
                    color: var(--maroon);
                    border: 1px solid var(--maroon);
                    padding: 6px 10px;
                    border-radius: 3px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                }
                .remove-btn:hover { background: var(--maroon); color: #fff; }

                .add-row-btn {
                    margin-top: 14px;
                    background: var(--forest);
                    border: none;
                    color: var(--brass-light);
                    padding: 10px 20px;
                    border-radius: 4px;
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 13px;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .add-row-btn:hover { background: var(--forest-deep); }

                .tally-divider {
                    margin: 34px 0 22px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--ink-soft);
                }
                .tally-divider .rule { flex: 1; height: 1px; background: var(--line); }
                .tally-divider .diamond {
                    width: 9px; height: 9px;
                    background: var(--brass);
                    transform: rotate(45deg);
                }

                .totals-panel {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1.2fr;
                    gap: 22px;
                    align-items: end;
                }
                .grand-card {
                    border: 2px solid var(--forest);
                    border-radius: 6px;
                    padding: 16px 20px;
                    background: var(--forest);
                }
                .grand-card .amount-label {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--brass-light);
                    margin-bottom: 4px;
                }
                .grand-card .grand-value {
                    font-family: 'IBM Plex Mono', monospace;
                    font-weight: 600;
                    font-size: 30px;
                    color: #fff;
                }
                .grand-card .sub-value {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px;
                    color: rgba(255,255,255,0.65);
                    margin-top: 4px;
                }

                .due-strip {
                    margin-top: 22px;
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    border-radius: 4px;
                    padding: 12px 20px;
                    color: #fff;
                    background: var(--maroon);
                }
                .due-strip .amount-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.85; }
                .due-strip .due-value { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 20px; }
                .due-clear { background: var(--sage); }

                .notes-field {
                    margin-top: 30px;
                    border-top: 1px solid var(--line);
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
                    transition: transform 0.15s, opacity 0.15s, background 0.2s;
                }
                .btn:active { transform: translateY(1px); }
                .btn-ghost {
                    background: transparent;
                    color: var(--ink-soft);
                    border: 1.5px solid var(--line);
                }
                .btn-ghost:hover { border-color: var(--ink-soft); color: var(--ink); }
                .btn-primary {
                    background: var(--brass);
                    color: var(--forest-deep);
                    letter-spacing: 0.3px;
                }
                .btn-primary:hover:not(:disabled) { background: var(--brass-light); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                @media (max-width: 720px) {
                    .sic-card { padding: 50px 24px 32px; }
                    .field-grid { grid-template-columns: 1fr; }
                    .totals-panel { grid-template-columns: 1fr; }
                    .sic-header { flex-direction: column; align-items: flex-start; }
                    .seal { display: none; }
                    .brass-tab { display: none; }
                }
            `}</style>

            <div className="sic-card">
                <div className="ring-strip">
                    {holes.map((_, i) => (
                        <span className="ring-hole" key={i} />
                    ))}
                </div>

                <div className="brass-tab">CARD {cardNumber}</div>

                {form.supplier_id && (
                    <div className="seal">
                        <span>STOCK<br />IN</span>
                    </div>
                )}

                <div className="sic-header">
                    <div>
                        <p className="sic-eyebrow">Godown · Intake Register</p>
                        <h2 className="sic-title">Stock Intake Card</h2>
                    </div>
                    <div className="sic-meta">
                        Card No. <b>{cardNumber}</b><br />
                        Date &nbsp;&nbsp;&nbsp;<b>{today}</b><br />
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

                <div className="tally-divider">
                    <span className="rule" />
                    <span className="diamond" />
                    <span className="rule" />
                </div>

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
                    <div className="grand-card">
                        <div className="amount-label">Grand Total</div>
                        <div className="grand-value">₹{grandTotal.toFixed(2)}</div>
                        <div className="sub-value">Subtotal ₹{subtotal.toFixed(2)}</div>
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