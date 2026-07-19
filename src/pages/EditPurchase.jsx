// src/pages/EditPurchase.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function EditPurchase() {
    const { id } = useParams();
    const navigate = useNavigate();
    const businessId = localStorage.getItem("businessId");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        supplier_id: "",
        payment_method: "Cash",
        payment_status: "Paid",
        paid_amount: "",
        discount: 0,
        tax: 0,
        notes: ""
    });

    const [items, setItems] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [supplierRes, productRes, purchaseRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/suppliers?business_id=${businessId}`),
                axios.get(`http://localhost:5000/api/products?business_id=${businessId}`),
                axios.get(`http://localhost:5000/api/purchases/details/${id}`)
            ]);

            setSuppliers(supplierRes.data.data || []);
            setProducts(productRes.data.data || []);

            const purchase = purchaseRes.data.purchase;
            setForm({
                supplier_id: purchase.supplier_id,
                payment_method: purchase.payment_method,
                payment_status: purchase.payment_status,
                paid_amount: purchase.paid_amount,
                discount: purchase.discount,
                tax: purchase.tax,
                notes: purchase.notes || ""
            });

            const purchaseItems = purchaseRes.data.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                purchase_price: item.purchase_price,
                tax: item.tax
            }));

            setItems(purchaseItems);
        } catch (err) {
            console.log(err);
            alert("Failed to load purchase");
        } finally {
            setLoading(false);
        }
    };

    const updatePurchase = async () => {
        try {
            setSaving(true);
            await axios.put(
                `http://localhost:5000/api/purchases/${id}`,
                {
                    supplier_id: form.supplier_id,
                    discount: Number(form.discount),
                    tax: Number(form.tax),
                    payment_method: form.payment_method,
                    payment_status: form.payment_status,
                    paid_amount: Number(form.paid_amount),
                    notes: form.notes,
                    products: items
                }
            );
            alert("Purchase Updated Successfully");
            navigate("/purchases");
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Update Failed");
        } finally {
            setSaving(false);
        }
    };

    const handleForm = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleItem = (index, field, value) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    const addRow = () => {
        setItems([
            ...items,
            {
                product_id: "",
                quantity: 1,
                purchase_price: 0,
                tax: 0
            }
        ]);
    };

    const removeRow = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    const subtotal = items.reduce(
        (sum, item) =>
            sum +
            Number(item.quantity) *
            Number(item.purchase_price),
        0
    );

    const grandTotal =
        subtotal -
        Number(form.discount || 0) +
        Number(form.tax || 0);

    const inputStyle = {
        width: "100%",
        padding: "12px",
        marginTop: 6,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box"
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: 40,
                    textAlign: "center",
                    fontSize: 20
                }}
            >
                Loading Purchase...
            </div>
        );
    }

    return (
        <div
            style={{
                background: "#f5f7fb",
                minHeight: "100vh",
                padding: 30
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "auto",
                    background: "#fff",
                    padding: 30,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)"
                }}
            >
                <h2>Edit Purchase</h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 20,
                        marginTop: 20
                    }}
                >
                    <div>
                        <label>Supplier</label>
                        <select
                            name="supplier_id"
                            value={form.supplier_id}
                            onChange={handleForm}
                            style={inputStyle}
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map((supplier) => (
                                <option
                                    key={supplier.id}
                                    value={supplier.id}
                                >
                                    {supplier.supplier_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Payment Method</label>
                        <select
                            name="payment_method"
                            value={form.payment_method}
                            onChange={handleForm}
                            style={inputStyle}
                        >
                            <option>Cash</option>
                            <option>UPI</option>
                            <option>Card</option>
                            <option>Bank</option>
                            <option>Credit</option>
                        </select>
                    </div>
                </div>

                <hr style={{ margin: "30px 0" }} />

                <h3>Purchase Items</h3>

                <table
                    width="100%"
                    cellPadding="10"
                    style={{
                        borderCollapse: "collapse"
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: "#2563eb",
                                color: "#fff"
                            }}
                        >
                            <th>Product</th>
                            <th width="100">Qty</th>
                            <th width="150">Price</th>
                            <th width="120">Tax</th>
                            <th width="140">Total</th>
                            <th width="80">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const total =
                                Number(item.quantity) *
                                Number(item.purchase_price);
                            return (
                                <tr key={index}>
                                    <td>
                                        <select
                                            value={item.product_id}
                                            onChange={(e) => {
                                                const product =
                                                    products.find(
                                                        p => p.id == e.target.value
                                                    );
                                                handleItem(
                                                    index,
                                                    "product_id",
                                                    e.target.value
                                                );
                                                handleItem(
                                                    index,
                                                    "purchase_price",
                                                    product?.purchase_price || 0
                                                );
                                            }}
                                            style={inputStyle}
                                        >
                                            <option value="">
                                                Select Product
                                            </option>
                                            {products.map(product => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
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
                                            onChange={(e) =>
                                                handleItem(
                                                    index,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                            style={inputStyle}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.purchase_price}
                                            onChange={(e) =>
                                                handleItem(
                                                    index,
                                                    "purchase_price",
                                                    e.target.value
                                                )
                                            }
                                            style={inputStyle}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            value={item.tax}
                                            onChange={(e) =>
                                                handleItem(
                                                    index,
                                                    "tax",
                                                    e.target.value
                                                )
                                            }
                                            style={inputStyle}
                                        />
                                    </td>
                                    <td>
                                        <strong>
                                            ₹{total.toFixed(2)}
                                        </strong>
                                    </td>
                                    <td>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRow(index)}
                                                style={{
                                                    background: "#ef4444",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "8px 12px",
                                                    borderRadius: 6,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <button
                    type="button"
                    onClick={addRow}
                    style={{
                        marginTop: 20,
                        background: "#2563eb",
                        color: "#fff",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer"
                    }}
                >
                    + Add Product
                </button>

                <div
                    style={{
                        marginTop: 30,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 20
                    }}
                >
                    <div>
                        <label>Discount</label>
                        <input
                            type="number"
                            name="discount"
                            value={form.discount}
                            onChange={handleForm}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label>Tax</label>
                        <input
                            type="number"
                            name="tax"
                            value={form.tax}
                            onChange={handleForm}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 30,
                        padding: 20,
                        background: "#f8fafc",
                        borderRadius: 10
                    }}
                >
                    <h3>
                        Subtotal: ₹{subtotal.toFixed(2)}
                    </h3>
                    <h2
                        style={{
                            color: "#2563eb"
                        }}
                    >
                        Grand Total: ₹{grandTotal.toFixed(2)}
                    </h2>
                </div>

                {/* Payment */}
                <div
                    style={{
                        marginTop: 30,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 20
                    }}
                >
                    <div>
                        <label>Payment Status</label>
                        <select
                            name="payment_status"
                            value={form.payment_status}
                            onChange={handleForm}
                            style={inputStyle}
                        >
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>

                    <div>
                        <label>Paid Amount</label>
                        <input
                            type="number"
                            name="paid_amount"
                            value={form.paid_amount}
                            onChange={handleForm}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 20,
                        padding: 20,
                        background: "#fff7ed",
                        borderRadius: 10
                    }}
                >
                    <h3>
                        Due Amount: ₹
                        {(
                            grandTotal -
                            Number(form.paid_amount || 0)
                        ).toFixed(2)}
                    </h3>
                </div>

                <div
                    style={{
                        marginTop: 20
                    }}
                >
                    <label>Notes</label>
                    <textarea
                        name="notes"
                        rows="4"
                        value={form.notes}
                        onChange={handleForm}
                        style={{
                            ...inputStyle,
                            resize: "vertical"
                        }}
                    />
                </div>

                <div
                    style={{
                        marginTop: 30,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 15
                    }}
                >
                    <button
                        type="button"
                        onClick={() => navigate("/purchases")}
                        style={{
                            padding: "12px 22px",
                            background: "#6b7280",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer"
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={updatePurchase}
                        disabled={saving}
                        style={{
                            padding: "12px 24px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        {saving ? "Updating..." : "Update Purchase"}
                    </button>
                </div>
            </div>
        </div>
    );
}