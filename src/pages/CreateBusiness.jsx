
import { useState, useEffect } from "react";
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

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Check if business already exists
    useEffect(() => {
        const checkBusiness = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) return;

            try {
                const res = await API.get(`/business/profile/${userId}`);
                if (res.data.success && res.data.business) {
                    // Business exists, redirect to dashboard
                    localStorage.setItem("businessId", res.data.business.id);
                    localStorage.setItem("businessName", res.data.business.business_name);
                    localStorage.setItem("businessType", res.data.business.business_type);
                    navigate("/dashboard");
                }
            } catch (err) {
                // Business not found, stay on create page
                console.log("No business found, creating new one");
            }
        };

        checkBusiness();
    }, [navigate]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
        if (error) setError("");
        if (success) setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        // Validation
        if (!form.business_name.trim()) {
            setError("Business name is required");
            setIsLoading(false);
            return;
        }

        if (!form.business_type) {
            setError("Please select a business type");
            setIsLoading(false);
            return;
        }

        try {
            const res = await API.post("/business/create", form);
            
            if (res.data.success) {
                setSuccess("Business created successfully!");
                
                // Save business data
                localStorage.setItem("businessId", res.data.business.id);
                localStorage.setItem("businessName", res.data.business.business_name);
                localStorage.setItem("businessType", res.data.business.business_type);

                // Redirect after short delay
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } else {
                setError(res.data.message || "Unable to create business.");
            }
        } catch (err) {
            console.error("Create business error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to create business. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Modern styling
    const styles = {
        container: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "linear-gradient(145deg, #0b0e1a 0%, #1a1e2f 100%)",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: "20px",
        },
        card: {
            width: "100%",
            maxWidth: "720px",
            padding: "42px 44px",
            background: "rgba(22, 26, 40, 0.85)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            borderRadius: "32px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: "0 40px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
            transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        },
        header: {
            textAlign: "center",
            marginBottom: "32px",
        },
        logo: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            background: "linear-gradient(145deg, #6C63FF, #3f3d9e)",
            borderRadius: "20px",
            marginBottom: "18px",
            fontSize: "34px",
            fontWeight: 700,
            color: "#fff",
            boxShadow: "0 12px 32px rgba(108, 99, 255, 0.4)",
        },
        title: {
            color: "#ffffff",
            fontSize: "28px",
            fontWeight: 700,
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
        },
        subtitle: {
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "15px",
            margin: "0",
            fontWeight: 400,
        },
        form: {
            display: "flex",
            flexDirection: "column",
            gap: "18px",
        },
        grid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
        },
        fullWidth: {
            gridColumn: "1 / -1",
        },
        inputGroup: {
            display: "flex",
            flexDirection: "column",
            gap: "6px",
        },
        label: {
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.3px",
        },
        inputWrapper: {
            position: "relative",
            display: "flex",
            alignItems: "center",
        },
        inputIcon: {
            position: "absolute",
            left: "14px",
            color: "rgba(255, 255, 255, 0.25)",
            fontSize: "18px",
            pointerEvents: "none",
            lineHeight: 1,
        },
        input: {
            width: "100%",
            padding: "14px 16px 14px 46px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            color: "#ffffff",
            fontSize: "15px",
            outline: "none",
            transition: "all 0.25s ease",
            boxSizing: "border-box",
            fontFamily: "inherit",
        },
        textarea: {
            width: "100%",
            padding: "14px 16px 14px 46px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            color: "#ffffff",
            fontSize: "15px",
            outline: "none",
            transition: "all 0.25s ease",
            boxSizing: "border-box",
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: "80px",
        },
        select: {
            width: "100%",
            padding: "14px 16px 14px 46px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            color: "#ffffff",
            fontSize: "15px",
            outline: "none",
            transition: "all 0.25s ease",
            boxSizing: "border-box",
            fontFamily: "inherit",
            appearance: "none",
            cursor: "pointer",
        },
        selectOption: {
            background: "#1a1e2f",
            color: "#ffffff",
        },
        inputFocus: {
            borderColor: "rgba(108, 99, 255, 0.5)",
            background: "rgba(255, 255, 255, 0.07)",
            boxShadow: "0 0 0 4px rgba(108, 99, 255, 0.1)",
        },
        inputError: {
            borderColor: "rgba(239, 68, 68, 0.4)",
            background: "rgba(239, 68, 68, 0.06)",
        },
        inputSuccess: {
            borderColor: "rgba(52, 211, 153, 0.4)",
            background: "rgba(52, 211, 153, 0.06)",
        },
        errorMessage: {
            color: "#f87171",
            fontSize: "13px",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
        },
        successMessage: {
            color: "#34d399",
            fontSize: "13px",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
        },
        button: {
            width: "100%",
            padding: "16px",
            background: "linear-gradient(145deg, #6C63FF, #3f3d9e)",
            border: "none",
            borderRadius: "14px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 20px rgba(108, 99, 255, 0.3)",
            fontFamily: "inherit",
            letterSpacing: "0.3px",
            position: "relative",
            overflow: "hidden",
            marginTop: "8px",
        },
        buttonHover: {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 32px rgba(108, 99, 255, 0.5)",
        },
        buttonDisabled: {
            opacity: 0.6,
            cursor: "not-allowed",
            transform: "none !important",
        },
        spinner: {
            display: "inline-block",
            width: "22px",
            height: "22px",
            border: "2.5px solid rgba(255, 255, 255, 0.2)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
        },
        footer: {
            display: "flex",
            justifyContent: "center",
            marginTop: "24px",
            gap: "6px",
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: "14px",
        },
        link: {
            color: "#a78bfa",
            textDecoration: "none",
            fontWeight: 500,
            transition: "color 0.2s ease",
            borderBottom: "1px solid transparent",
        },
        linkHover: {
            color: "#c4b5fd",
            borderBottomColor: "rgba(167, 139, 250, 0.3)",
        },
        sectionTitle: {
            color: "rgba(255, 255, 255, 0.3)",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "4px",
        },
        iconMap: {
            "business_name": "🏢",
            "business_type": "📊",
            "owner_name": "👤",
            "phone": "📞",
            "email": "✉️",
            "gst_number": "📋",
            "upi_id": "💳",
            "address": "📍",
            "city": "🏙️",
            "state": "🗺️",
            "pincode": "📮",
            "logo": "🖼️",
        }
    };

    const getIcon = (name) => styles.iconMap[name] || "📌";

    const keyframes = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

    return (
        <>
            <style>{keyframes}</style>
            <div style={styles.container}>
                <div style={styles.card}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.logo}>🏪</div>
                        <h1 style={styles.title}>Create Your Business</h1>
                        <p style={styles.subtitle}>Set up your business profile to start managing finances</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* Business Details Section */}
                        <div style={styles.sectionTitle}>Business Details</div>
                        
                        <div style={styles.grid}>
                            {/* Business Name - Full Width */}
                            <div style={styles.fullWidth}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Business Name *</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("business_name")}</span>
                                        <input
                                            type="text"
                                            name="business_name"
                                            placeholder="Enter business name"
                                            value={form.business_name}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                ...styles.input,
                                                ...(error && styles.inputError),
                                                ...(success && styles.inputSuccess),
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Business Type */}
                            <div style={styles.fullWidth}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Business Type *</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("business_type")}</span>
                                        <select
                                            name="business_type"
                                            value={form.business_type}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                ...styles.select,
                                                ...(error && styles.inputError),
                                                ...(success && styles.inputSuccess),
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        >
                                            <option value="" style={styles.selectOption}>Select Business Type</option>
                                            <option value="grocery" style={styles.selectOption}>🛒 Grocery Store</option>
                                            <option value="medical" style={styles.selectOption}>💊 Medical Shop</option>
                                            <option value="restaurant" style={styles.selectOption}>🍽️ Restaurant</option>
                                            <option value="clothing" style={styles.selectOption}>👔 Clothing Store</option>
                                            <option value="mobile" style={styles.selectOption}>📱 Mobile Shop</option>
                                            <option value="electronics" style={styles.selectOption}>💻 Electronics</option>
                                            <option value="hardware" style={styles.selectOption}>🔧 Hardware</option>
                                            <option value="bakery" style={styles.selectOption}>🍞 Bakery</option>
                                            <option value="supermarket" style={styles.selectOption}>🏪 Supermarket</option>
                                            <option value="pharmacy" style={styles.selectOption}>💊 Pharmacy</option>
                                            <option value="salon" style={styles.selectOption}>✂️ Salon</option>
                                            <option value="hotel" style={styles.selectOption}>🏨 Hotel</option>
                                            <option value="factory" style={styles.selectOption}>🏭 Factory</option>
                                            <option value="other" style={styles.selectOption}>📌 Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owner Details Section */}
                        <div style={styles.sectionTitle}>Owner Details</div>
                        
                        <div style={styles.grid}>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Owner Name</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("owner_name")}</span>
                                        <input
                                            type="text"
                                            name="owner_name"
                                            placeholder="Full name"
                                            value={form.owner_name}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Phone</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("phone")}</span>
                                        <input
                                            type="text"
                                            name="phone"
                                            placeholder="+1 234 567 8900"
                                            value={form.phone}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Contact */}
                        <div style={styles.sectionTitle}>Business Contact</div>
                        
                        <div style={styles.grid}>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Business Email</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("email")}</span>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="business@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>GST Number</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("gst_number")}</span>
                                        <input
                                            type="text"
                                            name="gst_number"
                                            placeholder="GSTIN-XXXXX"
                                            value={form.gst_number}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={styles.grid}>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>UPI ID</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("upi_id")}</span>
                                        <input
                                            type="text"
                                            name="upi_id"
                                            placeholder="business@upi"
                                            value={form.upi_id}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Logo URL</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("logo")}</span>
                                        <input
                                            type="text"
                                            name="logo"
                                            placeholder="https://example.com/logo.png"
                                            value={form.logo}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Section */}
                        <div style={styles.sectionTitle}>Address</div>
                        
                        <div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Business Address</label>
                                <div style={styles.inputWrapper}>
                                    <span style={styles.inputIcon}>{getIcon("address")}</span>
                                    <textarea
                                        name="address"
                                        placeholder="Street address, building, etc."
                                        rows="3"
                                        value={form.address}
                                        onChange={handleChange}
                                        style={styles.textarea}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = styles.inputFocus.borderColor;
                                            e.target.style.background = styles.inputFocus.background;
                                            e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                        }}
                                        onBlur={(e) => {
                                            if (!e.target.value) {
                                                e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                e.target.style.boxShadow = "none";
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={styles.grid}>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>City</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("city")}</span>
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="City"
                                            value={form.city}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>State</label>
                                    <div style={styles.inputWrapper}>
                                        <span style={styles.inputIcon}>{getIcon("state")}</span>
                                        <input
                                            type="text"
                                            name="state"
                                            placeholder="State"
                                            value={form.state}
                                            onChange={handleChange}
                                            style={styles.input}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = styles.inputFocus.borderColor;
                                                e.target.style.background = styles.inputFocus.background;
                                                e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                            }}
                                            onBlur={(e) => {
                                                if (!e.target.value) {
                                                    e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                    e.target.style.boxShadow = "none";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Pincode</label>
                                <div style={styles.inputWrapper}>
                                    <span style={styles.inputIcon}>{getIcon("pincode")}</span>
                                    <input
                                        type="text"
                                        name="pincode"
                                        placeholder="123456"
                                        value={form.pincode}
                                        onChange={handleChange}
                                        style={styles.input}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = styles.inputFocus.borderColor;
                                            e.target.style.background = styles.inputFocus.background;
                                            e.target.style.boxShadow = styles.inputFocus.boxShadow;
                                        }}
                                        onBlur={(e) => {
                                            if (!e.target.value) {
                                                e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                                                e.target.style.background = "rgba(255, 255, 255, 0.04)";
                                                e.target.style.boxShadow = "none";
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div style={styles.errorMessage}>
                                <span>⚠️</span> {error}
                            </div>
                        )}
                        {success && (
                            <div style={styles.successMessage}>
                                <span>✅</span> {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                ...styles.button,
                                ...(isLoading && styles.buttonDisabled),
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform = styles.buttonHover.transform;
                                    e.target.style.boxShadow = styles.buttonHover.boxShadow;
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 4px 20px rgba(108, 99, 255, 0.3)";
                            }}
                        >
                            {isLoading ? (
                                <span style={styles.spinner} />
                            ) : (
                                "Create Business →"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <span>Already have a business?</span>
                        <a
                            href="/dashboard"
                            style={styles.link}
                            onMouseEnter={(e) => {
                                e.target.style.color = styles.linkHover.color;
                                e.target.style.borderBottomColor = styles.linkHover.borderBottomColor;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = styles.link.color;
                                e.target.style.borderBottomColor = "transparent";
                            }}
                        >
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
