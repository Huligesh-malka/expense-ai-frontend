import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function CreateBusiness() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        owner_id: localStorage.getItem("userId") || 1,
        business_name: "",
        business_type: "",
        owner_name: "",
        phone: "",
        email: "",
        gst_number: "",
        upi_id: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        logo: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await API.post("/business/create", form);
            alert(res.data.message);

            // Save business data after creation
            localStorage.setItem(
                "businessId",
                res.data.business.id
            );
            localStorage.setItem(
                "businessName",
                res.data.business.business_name
            );
            localStorage.setItem(
                "businessType",
                res.data.business.business_type
            );

            navigate("/dashboard");
        } catch (err) {
            console.log(err);
            alert(
                err.response?.data?.message ||
                "Unable to create business."
            );
        }
    };

    return (
        <div
            style={{
                maxWidth: "900px",
                margin: "30px auto",
                background: "#fff",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 0 10px #ddd"
            }}
        >
            <h1>Create Business</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="business_name"
                    placeholder="Business Name"
                    value={form.business_name}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />

                <br /><br />

                <select
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                >
                    <option value="">Select Business Type</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="medical">Medical Shop</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="clothing">Clothing Store</option>
                    <option value="mobile">Mobile Shop</option>
                    <option value="electronics">Electronics</option>
                    <option value="hardware">Hardware</option>
                    <option value="bakery">Bakery</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="salon">Salon</option>
                    <option value="hotel">Hotel</option>
                    <option value="factory">Factory</option>
                    <option value="other">Other</option>
                </select>

                <br /><br />

                <input
                    type="text"
                    name="owner_name"
                    placeholder="Owner Name"
                    value={form.owner_name}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="email"
                    name="email"
                    placeholder="Business Email"
                    value={form.email}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="gst_number"
                    placeholder="GST Number"
                    value={form.gst_number}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="upi_id"
                    placeholder="UPI ID"
                    value={form.upi_id}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <textarea
                    name="address"
                    placeholder="Business Address"
                    rows="3"
                    value={form.address}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={form.state}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <input
                    type="text"
                    name="logo"
                    placeholder="Logo URL (Optional)"
                    value={form.logo}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <button
                    type="submit"
                    style={buttonStyle}
                >
                    Create Business
                </button>
            </form>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box"
};

const buttonStyle = {
    padding: "12px 30px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontSize: "16px"
};