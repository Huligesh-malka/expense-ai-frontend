import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

        {

            product_id: "",

            quantity: 1,

            purchase_price: 0,

            tax: 0

        }

    ]);

    useEffect(() => {

        loadSuppliers();

        loadProducts();

    }, []);

    const loadSuppliers = async () => {

        try {

            const res = await axios.get(

                `http://localhost:5000/api/suppliers?business_id=${businessId}`

            );

            setSuppliers(res.data.data || []);

        } catch (err) {

            console.log(err);

        }

    };

    const loadProducts = async () => {

        try {

            const res = await axios.get(

                `http://localhost:5000/api/products?business_id=${businessId}`

            );

            setProducts(res.data.data || []);

        } catch (err) {

            console.log(err);

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

        subtotal

        -

        Number(form.discount || 0)

        +

        Number(form.tax || 0);

    const handleSubmit = async () => {

        if (!form.supplier_id) {

            return alert("Select Supplier");

        }

        if (items.length === 0) {

            return alert("Add Products");

        }

        // Check if any product row is empty
        const emptyRow = items.some(item => !item.product_id);
        if (emptyRow) {
            return alert("Please select a product for all rows");
        }

        try {

            setLoading(true);

            await axios.post(

                "http://localhost:5000/api/purchases",

                {

                    business_id: businessId,

                    supplier_id: form.supplier_id,

                    discount: Number(form.discount || 0),

                    tax: Number(form.tax || 0),

                    payment_method: form.payment_method,

                    payment_status: form.payment_status,

                    paid_amount: Number(form.paid_amount || 0),

                    notes: form.notes,

                    products: items.map(item => ({
                        product_id: item.product_id,
                        quantity: Number(item.quantity),
                        purchase_price: Number(item.purchase_price),
                        tax: Number(item.tax || 0)
                    }))

                }

            );

            alert("Purchase Saved Successfully");

            navigate("/purchase");

        } catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Purchase Failed"

            );

        } finally {

            setLoading(false);

        }

    };

    const inputStyle = {

        width: "100%",

        padding: "12px",

        marginTop: 6,

        border: "1px solid #d1d5db",

        borderRadius: 8,

        fontSize: 15,

        outline: "none",

        boxSizing: "border-box",

        transition: "border-color 0.2s"

    };

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

                <h2 style={{ margin: 0, color: "#1f2937" }}>Add Purchase</h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 20,
                        marginTop: 20
                    }}
                >

                    <div>

                        <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                            Supplier *
                        </label>

                        <select

                            name="supplier_id"

                            value={form.supplier_id}

                            onChange={handleForm}

                            style={inputStyle}

                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}

                        >

                            <option value="">

                                Select Supplier

                            </option>

                            {

                                suppliers.map((supplier) => (

                                    <option

                                        key={supplier.id}

                                        value={supplier.id}

                                    >

                                        {supplier.supplier_name}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                    <div>

                        <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                            Payment Method
                        </label>

                        <select

                            name="payment_method"

                            value={form.payment_method}

                            onChange={handleForm}

                            style={inputStyle}

                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}

                        >

                            <option>Cash</option>

                            <option>UPI</option>

                            <option>Card</option>

                            <option>Bank</option>

                            <option>Credit</option>

                        </select>

                    </div>

                </div>

                {/* Product Table */}

                <div
                    style={{
                        marginTop: 30
                    }}
                >

                    <h3 style={{ margin: 0, color: "#1f2937" }}>Purchase Items</h3>

                    <div style={{ overflowX: "auto" }}>

                        <table
                            width="100%"
                            cellPadding="10"
                            style={{
                                borderCollapse: "collapse",
                                marginTop: 15,
                                minWidth: "600px"
                            }}
                        >

                            <thead>

                                <tr
                                    style={{
                                        background: "#2563eb",
                                        color: "#fff"
                                    }}
                                >

                                    <th align="left">Product</th>

                                    <th width="120">Qty</th>

                                    <th width="150">Purchase Price</th>

                                    <th width="120">Tax</th>

                                    <th width="150">Total</th>

                                    <th width="80">Action</th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    items.map((item, index) => {

                                        const total =

                                            Number(item.quantity)

                                            *

                                            Number(item.purchase_price);

                                        return (

                                            <tr key={index}>

                                                <td>

                                                    <select

                                                        value={item.product_id}

                                                        onChange={(e) => {
                                                            const product = products.find(
                                                                p => p.id == e.target.value
                                                            );
                                                            handleItem(index, "product_id", e.target.value);
                                                            handleItem(
                                                                index,
                                                                "purchase_price",
                                                                product?.purchase_price || 0
                                                            );
                                                        }}

                                                        style={inputStyle}

                                                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                                                    >

                                                        <option value="">

                                                            Select Product

                                                        </option>

                                                        {

                                                            products.map((product) => (

                                                                <option

                                                                    key={product.id}

                                                                    value={product.id}

                                                                >

                                                                    {product.product_name}

                                                                </option>

                                                            ))

                                                        }

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

                                                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                                                    />

                                                </td>

                                                <td>

                                                    <input

                                                        type="number"

                                                        min="0"

                                                        step="0.01"

                                                        value={item.purchase_price}

                                                        onChange={(e) =>

                                                            handleItem(

                                                                index,

                                                                "purchase_price",

                                                                e.target.value

                                                            )

                                                        }

                                                        style={inputStyle}

                                                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                                                    />

                                                </td>

                                                <td>

                                                    <input

                                                        type="number"

                                                        min="0"

                                                        step="0.01"

                                                        value={item.tax}

                                                        onChange={(e) =>

                                                            handleItem(

                                                                index,

                                                                "tax",

                                                                e.target.value

                                                            )

                                                        }

                                                        style={inputStyle}

                                                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                                                    />

                                                </td>

                                                <td>

                                                    <strong>

                                                        ₹{total.toFixed(2)}

                                                    </strong>

                                                </td>

                                                <td>

                                                    {

                                                        items.length > 1 &&

                                                        <button

                                                            type="button"

                                                            onClick={() => removeRow(index)}

                                                            style={{

                                                                background: "#ef4444",

                                                                color: "#fff",

                                                                border: "none",

                                                                padding: "8px 12px",

                                                                borderRadius: 6,

                                                                cursor: "pointer",

                                                                transition: "background 0.2s"

                                                            }}

                                                            onMouseEnter={(e) => e.target.style.background = "#dc2626"}
                                                            onMouseLeave={(e) => e.target.style.background = "#ef4444"}
                                                        >

                                                            Remove

                                                        </button>

                                                    }

                                                </td>

                                            </tr>

                                        );

                                    })

                                }

                            </tbody>

                        </table>

                    </div>

                    <button

                        type="button"

                        onClick={addRow}

                        style={{

                            marginTop: 15,

                            background: "#2563eb",

                            color: "#fff",

                            padding: "10px 20px",

                            border: "none",

                            borderRadius: 8,

                            cursor: "pointer",

                            display: "inline-flex",

                            alignItems: "center",

                            gap: 8,

                            transition: "background 0.2s"

                        }}

                        onMouseEnter={(e) => e.target.style.background = "#1d4ed8"}
                        onMouseLeave={(e) => e.target.style.background = "#2563eb"}
                    >

                        + Add Product

                    </button>

                </div>

                {/* Totals */}

                <div
                    style={{
                        marginTop: 35,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 20
                    }}
                >

                    <div>

                        <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                            Discount
                        </label>

                        <input

                            type="number"

                            name="discount"

                            min="0"

                            step="0.01"

                            value={form.discount}

                            onChange={handleForm}

                            style={inputStyle}

                            placeholder="0.00"

                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                        />

                    </div>

                    <div>

                        <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                            Tax
                        </label>

                        <input

                            type="number"

                            name="tax"

                            min="0"

                            step="0.01"

                            value={form.tax}

                            onChange={handleForm}

                            style={inputStyle}

                            placeholder="0.00"

                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                        />

                    </div>

                </div>

                <div
                    style={{
                        marginTop: 30,
                        padding: 20,
                        background: "#f8fafc",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0"
                    }}
                >

                    <h3 style={{ margin: 0, marginBottom: 10, color: "#1f2937" }}>
                        Subtotal : ₹{subtotal.toFixed(2)}
                    </h3>

                    <h2
                        style={{
                            margin: 0,
                            color: "#2563eb"
                        }}
                    >

                        Grand Total : ₹{grandTotal.toFixed(2)}

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

                        <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                            Payment Status
                        </label>

                        <select
                            name="payment_status"
                            value={form.payment_status}
                            onChange={handleForm}
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                        >

                            <option value="Paid">Paid</option>

                            <option value="Partial">Partial</option>

                            <option value="Pending">Pending</option>

                        </select>

                    </div>

                    <div>

                        <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                            Paid Amount
                        </label>

                        <input
                            type="number"
                            name="paid_amount"
                            min="0"
                            step="0.01"
                            value={form.paid_amount}
                            onChange={handleForm}
                            style={inputStyle}
                            placeholder="0.00"
                            onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                        />

                    </div>

                </div>

                {/* Due Amount */}

                <div
                    style={{
                        marginTop: 25,
                        background: "#fff7ed",
                        padding: 20,
                        borderRadius: 10,
                        border: "1px solid #fdba74"
                    }}
                >

                    <h3
                        style={{
                            margin: 0,
                            color: "#c2410c"
                        }}
                    >

                        Due Amount : ₹{

                            (grandTotal -

                                Number(form.paid_amount || 0)

                            ).toFixed(2)

                        }

                    </h3>

                </div>

                {/* Notes */}

                <div
                    style={{
                        marginTop: 25
                    }}
                >

                    <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                        Notes
                    </label>

                    <textarea

                        name="notes"

                        rows="4"

                        value={form.notes}

                        onChange={handleForm}

                        style={{
                            ...inputStyle,
                            resize: "vertical"
                        }}

                        placeholder="Additional notes about this purchase..."

                        onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                    />

                </div>

                {/* Buttons */}

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

                        onClick={() => navigate("/purchase")}

                        style={{

                            padding: "12px 22px",

                            background: "#6b7280",

                            color: "#fff",

                            border: "none",

                            borderRadius: 8,

                            cursor: "pointer",

                            transition: "background 0.2s"

                        }}

                        onMouseEnter={(e) => e.target.style.background = "#4b5563"}
                        onMouseLeave={(e) => e.target.style.background = "#6b7280"}
                    >

                        Cancel

                    </button>

                    <button

                        type="button"

                        onClick={handleSubmit}

                        disabled={loading}

                        style={{

                            padding: "12px 25px",

                            background: loading ? "#93c5fd" : "#2563eb",

                            color: "#fff",

                            border: "none",

                            borderRadius: 8,

                            cursor: loading ? "not-allowed" : "pointer",

                            fontWeight: "bold",

                            transition: "background 0.2s",

                            opacity: loading ? 0.7 : 1

                        }}

                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.background = "#1d4ed8";
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.background = "#2563eb";
                        }}
                    >

                        {

                            loading

                                ?

                                "Saving..."

                                :

                                "Save Purchase"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}