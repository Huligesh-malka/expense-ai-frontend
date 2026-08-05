import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function EditBusiness() {
    const navigate = useNavigate();
    const ownerId = localStorage.getItem("userId");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        } catch (err) {
            console.log(err);
            alert("Unable to load business profile.");
        } finally {
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
        setSaving(true);
        try {
            await API.put(`/business/profile/${form.id}`, form);
            localStorage.setItem("businessName", form.business_name);
            localStorage.setItem("businessType", form.business_type);
            alert("Business profile updated successfully!");
            navigate("/dashboard");
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Unable to update business.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}></div>
                <p style={styles.loadingText}>Loading your business profile...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>Edit Business Profile</h2>
                    <button 
                        onClick={() => navigate("/dashboard")} 
                        style={styles.backButton}
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {/* Profile Preview */}
                <div style={styles.profilePreview}>
                    <div style={styles.avatarContainer}>
                        {form.logo ? (
                            <img src={form.logo} alt="Business Logo" style={styles.avatar} />
                        ) : (
                            <div style={styles.avatarPlaceholder}>
                                <span style={styles.avatarText}>🏢</span>
                            </div>
                        )}
                    </div>
                    <div style={styles.profileInfo}>
                        <h3 style={styles.businessName}>{form.business_name || "Business Name"}</h3>
                        <span style={styles.businessType}>
                            {form.business_type ? form.business_type.toUpperCase() : "BUSINESS"}
                        </span>
                        <p style={styles.ownerName}>👤 {form.owner_name || "Owner Name"}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                        {/* Left Column */}
                        <div style={styles.formColumn}>
                            <h4 style={styles.sectionTitle}>Business Information</h4>
                            
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Business Name *</label>
                                <input
                                    type="text"
                                    name="business_name"
                                    placeholder="Enter business name"
                                    value={form.business_name || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Business Type *</label>
                                <select
                                    name="business_type"
                                    value={form.business_type || ""}
                                    onChange={handleChange}
                                    style={styles.select}
                                    required
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
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Owner Name</label>
                                <input
                                    type="text"
                                    name="owner_name"
                                    placeholder="Enter owner's full name"
                                    value={form.owner_name || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Logo URL</label>
                                <input
                                    type="text"
                                    name="logo"
                                    placeholder="https://example.com/logo.png"
                                    value={form.logo || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={styles.formColumn}>
                            <h4 style={styles.sectionTitle}>Contact & Location</h4>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Enter phone number"
                                    value={form.phone || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter business email"
                                    value={form.email || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>GST Number</label>
                                <input
                                    type="text"
                                    name="gst_number"
                                    placeholder="Enter GST number"
                                    value={form.gst_number || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>UPI ID</label>
                                <input
                                    type="text"
                                    name="upi_id"
                                    placeholder="Enter UPI ID"
                                    value={form.upi_id || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Address</label>
                                <textarea
                                    rows="2"
                                    name="address"
                                    placeholder="Enter business address"
                                    value={form.address || ""}
                                    onChange={handleChange}
                                    style={styles.textarea}
                                />
                            </div>

                            <div style={styles.row}>
                                <div style={styles.halfGroup}>
                                    <label style={styles.label}>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={form.city || ""}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                                <div style={styles.halfGroup}>
                                    <label style={styles.label}>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="State"
                                        value={form.state || ""}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    placeholder="Enter pincode"
                                    value={form.pincode || ""}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            style={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={styles.saveButton}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}

// ===== Styles =====
const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    card: {
        maxWidth: "1100px",
        width: "100%",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "40px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        flexWrap: "wrap",
        gap: "15px"
    },
    title: {
        fontSize: "26px",
        fontWeight: "700",
        color: "#0f172a",
        margin: 0
    },
    backButton: {
        padding: "10px 20px",
        background: "#f1f5f9",
        border: "none",
        borderRadius: "10px",
        color: "#475569",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease"
    },
    profilePreview: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "20px",
        background: "#f8fafc",
        borderRadius: "14px",
        marginBottom: "30px",
        border: "1px solid #e2e8f0",
        flexWrap: "wrap"
    },
    avatarContainer: {
        width: "70px",
        height: "70px",
        flexShrink: 0
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "3px solid #fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    avatarText: {
        fontSize: "30px"
    },
    profileInfo: {
        flex: 1
    },
    businessName: {
        fontSize: "20px",
        fontWeight: "600",
        color: "#0f172a",
        margin: "0 0 5px 0"
    },
    businessType: {
        display: "inline-block",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "#fff",
        padding: "3px 12px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600",
        letterSpacing: "0.5px",
        marginBottom: "5px"
    },
    ownerName: {
        color: "#64748b",
        fontSize: "14px",
        margin: "5px 0 0 0"
    },
    form: {
        marginTop: "10px"
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "35px",
        marginBottom: "30px"
    },
    formColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },
    sectionTitle: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#0f172a",
        margin: "0 0 5px 0",
        paddingBottom: "10px",
        borderBottom: "2px solid #e2e8f0"
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    label: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#475569"
    },
    input: {
        padding: "11px 14px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        color: "#0f172a",
        outline: "none"
    },
    select: {
        padding: "11px 14px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        color: "#0f172a",
        outline: "none",
        cursor: "pointer"
    },
    textarea: {
        padding: "11px 14px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        transition: "all 0.3s ease",
        backgroundColor: "#fff",
        color: "#0f172a",
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit"
    },
    row: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px"
    },
    halfGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "15px",
        paddingTop: "25px",
        borderTop: "2px solid #e2e8f0"
    },
    cancelButton: {
        padding: "11px 30px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        background: "#fff",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease"
    },
    saveButton: {
        padding: "11px 35px",
        border: "none",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
    },
    loadingContainer: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea, #764ba2)"
    },
    loader: {
        width: "48px",
        height: "48px",
        border: "4px solid rgba(255,255,255,0.2)",
        borderTop: "4px solid #ffffff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px"
    },
    loadingText: {
        color: "#fff",
        fontSize: "18px",
        fontWeight: "500"
    }
};

// Add hover effects
const hoverStyle = document.createElement("style");
hoverStyle.textContent = `
    button:hover {
        transform: translateY(-2px);
    }
    button:active {
        transform: translateY(0);
    }
    .cancel-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }
    .save-btn:hover {
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
    }
    input:hover, textarea:hover, select:hover {
        border-color: #94a3b8;
    }
    input:focus, textarea:focus, select:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
`;
document.head.appendChild(hoverStyle);