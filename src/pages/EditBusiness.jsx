

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { 
    FiArrowLeft, 
    FiSave, 
    FiUser, 
    FiBriefcase, 
    FiMail, 
    FiPhone, 
    FiMapPin, 
    FiGlobe, 
    FiHash, 
    FiCreditCard,
    FiImage,
    FiBuilding,
    FiHome,
    FiLoader,
    FiCheckCircle
} from "react-icons/fi";

export default function EditBusiness() {
    const navigate = useNavigate();
    const ownerId = localStorage.getItem("userId");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
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
        setSaveSuccess(false);

        try {
            const res = await API.put(`/business/profile/${form.id}`, form);
            
            localStorage.setItem("businessName", form.business_name);
            localStorage.setItem("businessType", form.business_type);
            
            setSaveSuccess(true);
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Unable to update business.");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={loadingContainerStyle}>
                <div style={loaderWrapperStyle}>
                    <FiLoader size={48} style={loaderIconStyle} />
                    <p style={loadingTextStyle}>Loading your business profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageContainerStyle}>
            {/* Background Decoration */}
            <div style={bgDecorationStyle1} />
            <div style={bgDecorationStyle2} />
            <div style={bgDecorationStyle3} />

            <div style={cardContainerStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <button onClick={() => navigate("/dashboard")} style={backButtonStyle}>
                        <FiArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <div style={headerBadgeStyle}>
                        <FiBriefcase size={16} />
                        <span>Business Settings</span>
                    </div>
                </div>

                {/* Profile Preview */}
                <div style={profilePreviewStyle}>
                    <div style={avatarContainerStyle}>
                        {form.logo ? (
                            <img src={form.logo} alt="Business Logo" style={avatarImageStyle} />
                        ) : (
                            <div style={avatarPlaceholderStyle}>
                                <FiBuilding size={48} color="#fff" />
                            </div>
                        )}
                        <div style={avatarBadgeStyle}>
                            <FiImage size={14} color="#fff" />
                        </div>
                    </div>
                    <div style={profileInfoStyle}>
                        <h1 style={profileNameStyle}>{form.business_name || "Business Name"}</h1>
                        <span style={profileTypeStyle}>
                            {form.business_type ? form.business_type.toUpperCase() : "BUSINESS"}
                        </span>
                        <p style={profileOwnerStyle}>
                            <FiUser size={14} />
                            {form.owner_name || "Owner Name"}
                        </p>
                    </div>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                    <div style={successMessageStyle}>
                        <FiCheckCircle size={24} />
                        <span>Profile updated successfully! Redirecting...</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={formGridStyle}>
                        {/* Left Column */}
                        <div style={formColumnStyle}>
                            <div style={sectionTitleStyle}>
                                <FiBuilding size={18} />
                                <h3>Business Information</h3>
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiBriefcase size={16} />
                                    Business Name *
                                </label>
                                <input
                                    type="text"
                                    name="business_name"
                                    placeholder="Enter your business name"
                                    value={form.business_name || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiGrid size={16} />
                                    Business Type *
                                </label>
                                <select
                                    name="business_type"
                                    value={form.business_type || ""}
                                    onChange={handleChange}
                                    style={selectStyle}
                                    required
                                >
                                    <option value="">Select Business Type</option>
                                    <option value="grocery">🛒 Grocery Store</option>
                                    <option value="medical">💊 Medical Shop</option>
                                    <option value="restaurant">🍽️ Restaurant</option>
                                    <option value="clothing">👔 Clothing Store</option>
                                    <option value="mobile">📱 Mobile Shop</option>
                                    <option value="electronics">💻 Electronics</option>
                                    <option value="hardware">🔧 Hardware</option>
                                    <option value="bakery">🍞 Bakery</option>
                                    <option value="supermarket">🏪 Supermarket</option>
                                    <option value="pharmacy">💉 Pharmacy</option>
                                    <option value="salon">💇 Salon</option>
                                    <option value="hotel">🏨 Hotel</option>
                                    <option value="factory">🏭 Factory</option>
                                    <option value="other">📌 Other</option>
                                </select>
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiUser size={16} />
                                    Owner Name
                                </label>
                                <input
                                    type="text"
                                    name="owner_name"
                                    placeholder="Enter owner's full name"
                                    value={form.owner_name || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiImage size={16} />
                                    Logo URL
                                </label>
                                <input
                                    type="text"
                                    name="logo"
                                    placeholder="https://example.com/logo.png"
                                    value={form.logo || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={formColumnStyle}>
                            <div style={sectionTitleStyle}>
                                <FiMail size={18} />
                                <h3>Contact & Location</h3>
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiPhone size={16} />
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Enter phone number"
                                    value={form.phone || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiMail size={16} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter business email"
                                    value={form.email || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiHash size={16} />
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    name="gst_number"
                                    placeholder="Enter GST number"
                                    value={form.gst_number || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiCreditCard size={16} />
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    name="upi_id"
                                    placeholder="Enter UPI ID"
                                    value={form.upi_id || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiMapPin size={16} />
                                    Address
                                </label>
                                <textarea
                                    rows="2"
                                    name="address"
                                    placeholder="Enter business address"
                                    value={form.address || ""}
                                    onChange={handleChange}
                                    style={textareaStyle}
                                />
                            </div>

                            <div style={rowStyle}>
                                <div style={halfInputGroupStyle}>
                                    <label style={labelStyle}>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={form.city || ""}
                                        onChange={handleChange}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={halfInputGroupStyle}>
                                    <label style={labelStyle}>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="State"
                                        value={form.state || ""}
                                        onChange={handleChange}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FiHome size={16} />
                                    Pincode
                                </label>
                                <input
                                    type="text"
                                    name="pincode"
                                    placeholder="Enter pincode"
                                    value={form.pincode || ""}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={actionContainerStyle}>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            style={cancelButtonStyle}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={saveButtonStyle}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <FiLoader size={20} style={spinStyle} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave size={20} />
                                    Save Changes
                                </>
                            )}
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
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}
            </style>
        </div>
    );
}

// ===== Styles =====
const pageContainerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};

const bgDecorationStyle1 = {
    position: "absolute",
    top: "-100px",
    right: "-100px",
    width: "400px",
    height: "400px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "50%",
    pointerEvents: "none"
};

const bgDecorationStyle2 = {
    position: "absolute",
    bottom: "-150px",
    left: "-150px",
    width: "500px",
    height: "500px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "50%",
    pointerEvents: "none"
};

const bgDecorationStyle3 = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "800px",
    height: "800px",
    background: "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
};

const cardContainerStyle = {
    maxWidth: "1100px",
    width: "100%",
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.2)",
    position: "relative",
    zIndex: 1,
    animation: "slideIn 0.5s ease",
    border: "1px solid rgba(255,255,255,0.2)"
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "15px"
};

const backButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    backgroundColor: "#f1f5f9"
};

const headerBadgeStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
};

const profilePreviewStyle = {
    display: "flex",
    alignItems: "center",
    gap: "25px",
    padding: "25px",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
    borderRadius: "16px",
    marginBottom: "30px",
    border: "1px solid #e2e8f0",
    flexWrap: "wrap"
};

const avatarContainerStyle = {
    position: "relative",
    width: "80px",
    height: "80px",
    flexShrink: 0
};

const avatarImageStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};

const avatarPlaceholderStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "4px solid #fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};

const avatarBadgeStyle = {
    position: "absolute",
    bottom: "0",
    right: "0",
    background: "#2563eb",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #fff",
    boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
};

const profileInfoStyle = {
    flex: 1
};

const profileNameStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 5px 0"
};

const profileTypeStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    marginBottom: "8px"
};

const profileOwnerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "14px",
    margin: "0"
};

const successMessageStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#dcfce7",
    color: "#16a34a",
    padding: "16px 20px",
    borderRadius: "12px",
    marginBottom: "25px",
    border: "1px solid #86efac",
    fontWeight: "500"
};

const formStyle = {
    marginTop: "10px"
};

const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    marginBottom: "30px"
};

const formColumnStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
};

const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "5px",
    paddingBottom: "10px",
    borderBottom: "2px solid #e2e8f0"
};

const inputGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
};

const labelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569"
};

const inputStyle = {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
    color: "#0f172a",
    outline: "none"
};

const textareaStyle = {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit"
};

const selectStyle = {
    padding: "12px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
    color: "#0f172a",
    outline: "none",
    cursor: "pointer"
};

const rowStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px"
};

const halfInputGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
};

const actionContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px",
    paddingTop: "25px",
    borderTop: "2px solid #e2e8f0"
};

const cancelButtonStyle = {
    padding: "12px 30px",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    background: "#fff",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
};

const saveButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 35px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
};

const loadingContainerStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)"
};

const loaderWrapperStyle = {
    textAlign: "center",
    color: "#fff"
};

const loaderIconStyle = {
    animation: "spin 1s linear infinite",
    marginBottom: "20px"
};

const loadingTextStyle = {
    fontSize: "18px",
    fontWeight: "500",
    opacity: 0.9
};

const spinStyle = {
    animation: "spin 1s linear infinite"
};

// Add hover effects via CSS (will be applied globally)
const hoverStyles = `
    input:hover, textarea:hover, select:hover {
        border-color: #94a3b8;
    }
    input:focus, textarea:focus, select:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
    .cancel-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }
    .save-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
    }
    .save-btn:active {
        transform: translateY(0);
    }
`;

// Inject hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = hoverStyles;
document.head.appendChild(styleSheet);