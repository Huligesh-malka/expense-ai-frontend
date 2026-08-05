import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function EditBusiness() {

    const navigate = useNavigate();

    const ownerId = localStorage.getItem("userId");

    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({

        id: "",

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

    useEffect(() => {

        loadBusiness();

    }, []);

    const loadBusiness = async () => {

        try {

            const res = await API.get(`/business/profile/${ownerId}`);

            setForm(res.data.business);

        }

        catch (err) {

            console.log(err);

            alert("Unable to load business profile.");

        }

        finally {

            setLoading(false);

        }

    };

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const res = await API.put(

                `/business/profile/${form.id}`,

                form

            );

            alert(res.data.message);

            localStorage.setItem(

                "businessName",

                form.business_name

            );

            localStorage.setItem(

                "businessType",

                form.business_type

            );

            navigate("/dashboard");

        }

        catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Unable to update business."

            );

        }

    };

    if (loading) {

        return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

    }

    return (

        <div
            style={{
                maxWidth: "900px",
                margin: "30px auto",
                background: "#fff",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 0 12px rgba(0,0,0,.1)"
            }}
        >

            <h2>Edit Business Profile</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="business_name"
                    placeholder="Business Name"
                    value={form.business_name}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <select
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
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
                    rows="3"
                    name="address"
                    placeholder="Business Address"
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
                    placeholder="Logo URL"
                    value={form.logo}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <br /><br />

                <button
                    type="submit"
                    style={buttonStyle}
                >
                    Save Changes
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

    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "12px 30px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px"

};