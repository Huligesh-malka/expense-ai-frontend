import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddSupplier() {

    const navigate = useNavigate();

    const businessId = localStorage.getItem("businessId");

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({

        supplier_name: "",

        company_name: "",

        supplier_phone: "",

        supplier_email: "",

        gst_number: "",

        address: "",

        city: "",

        state: "",

        pincode: "",

        opening_balance: "",

        notes: ""

    });

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!form.supplier_name) {

            return alert("Supplier Name is required");

        }

        if (!form.supplier_phone) {

            return alert("Supplier Phone is required");

        }

        try {

            setLoading(true);

            await axios.post(
                "http://localhost:5000/api/suppliers",
                {
                    business_id: businessId,
                    ...form,
                    opening_balance: form.opening_balance || 0
                }
            );

            alert("Supplier Added Successfully");

            navigate("/suppliers");

        } catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Failed to add supplier"
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
                    maxWidth: 900,
                    margin: "auto",
                    background: "#fff",
                    padding: 30,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)"
                }}
            >

                <h2
                    style={{
                        marginBottom: 25,
                        color: "#1f2937"
                    }}
                >
                    Add Supplier
                </h2>

                <form onSubmit={handleSubmit}>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 20
                        }}
                    >

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Supplier Name *
                            </label>

                            <input
                                type="text"
                                name="supplier_name"
                                value={form.supplier_name}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                                placeholder="Enter supplier name"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Company Name
                            </label>

                            <input
                                type="text"
                                name="company_name"
                                value={form.company_name}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Enter company name"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Phone *
                            </label>

                            <input
                                type="tel"
                                name="supplier_phone"
                                value={form.supplier_phone}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                                placeholder="Enter phone number"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Email
                            </label>

                            <input
                                type="email"
                                name="supplier_email"
                                value={form.supplier_email}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Enter email address"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                GST Number
                            </label>

                            <input
                                type="text"
                                name="gst_number"
                                value={form.gst_number}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Enter GST number"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Opening Balance
                            </label>

                            <input
                                type="number"
                                name="opening_balance"
                                value={form.opening_balance}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Address
                            </label>

                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                rows="3"
                                style={{
                                    ...inputStyle,
                                    resize: "vertical"
                                }}
                                placeholder="Enter full address"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                City
                            </label>

                            <input
                                type="text"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Enter city"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                State
                            </label>

                            <input
                                type="text"
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Enter state"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div>

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Pincode
                            </label>

                            <input
                                type="text"
                                name="pincode"
                                value={form.pincode}
                                onChange={handleChange}
                                style={inputStyle}
                                placeholder="Enter pincode"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

                        <div
                            style={{
                                gridColumn: "1 / -1"
                            }}
                        >

                            <label style={{ fontWeight: 500, fontSize: 14, color: "#374151" }}>
                                Notes
                            </label>

                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                rows="4"
                                style={{
                                    ...inputStyle,
                                    resize: "vertical"
                                }}
                                placeholder="Additional notes about the supplier"
                                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                            />

                        </div>

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
                            onClick={() => navigate("/suppliers")}
                            style={{
                                padding: "12px 22px",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                background: "#6b7280",
                                color: "#fff",
                                fontSize: 15,
                                transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#4b5563"}
                            onMouseLeave={(e) => e.target.style.background = "#6b7280"}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "12px 24px",
                                border: "none",
                                borderRadius: 8,
                                cursor: loading ? "not-allowed" : "pointer",
                                background: loading ? "#93c5fd" : "#2563eb",
                                color: "#fff",
                                fontSize: 15,
                                fontWeight: "600",
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
                                    "Save Supplier"
                            }
                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}