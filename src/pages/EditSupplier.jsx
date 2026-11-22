import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

import {
    FiArrowLeft,
    FiSave,
    FiX,
    FiUser,
    FiPhone,
    FiMail,
    FiMapPin,
    FiHash,
    FiGlobe,
    FiAlertCircle,
    FiCheckCircle,
    FiBriefcase,
    FiEdit3,
    FiShield
} from "react-icons/fi";

const styles = `
.supplier-edit-page{
    min-height:100vh;
    background:#f5f7fb;
    padding:28px 24px 50px;
    color:#172033;
    font-family:inherit;
}

.supplier-edit-wrap{
    max-width:1120px;
    margin:0 auto;
}

.supplier-edit-header{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:18px;
    margin-bottom:24px;
    flex-wrap:wrap;
}

.supplier-edit-title{
    display:flex;
    align-items:center;
    gap:16px;
}

.supplier-edit-back{
    height:44px;
    width:44px;
    border:1px solid #e1e7f0;
    background:#fff;
    border-radius:13px;
    display:grid;
    place-items:center;
    color:#34445d;
    cursor:pointer;
    transition:.2s;
}

.supplier-edit-back:hover{
    background:#edf3ff;
    border-color:#c5d5ff;
    transform:translateY(-1px);
}

.supplier-edit-heading h1{
    font-size:26px;
    font-weight:800;
    letter-spacing:-.5px;
    margin:0;
    color:#15223b;
}

.supplier-edit-heading p{
    margin:5px 0 0;
    color:#73819a;
    font-size:14px;
}

.supplier-edit-pill{
    display:flex;
    align-items:center;
    gap:8px;
    background:#eaf2ff;
    color:#315fbe;
    padding:9px 13px;
    border-radius:999px;
    font-size:12px;
    font-weight:700;
}

.supplier-edit-alert{
    display:flex;
    align-items:center;
    gap:10px;
    padding:14px 16px;
    border-radius:13px;
    margin-bottom:18px;
    font-size:14px;
    font-weight:600;
}

.supplier-edit-success{
    background:#e8f8ef;
    color:#137a43;
    border:1px solid #c7eed8;
}

.supplier-edit-error{
    background:#fff0f0;
    color:#b42318;
    border:1px solid #ffd4d4;
}

.supplier-edit-grid{
    display:grid;
    gap:18px;
}

.supplier-edit-card{
    background:#fff;
    border:1px solid #e5eaf2;
    border-radius:18px;
    box-shadow:0 5px 20px rgba(18,36,70,.045);
    overflow:hidden;
}

.supplier-edit-card-head{
    display:flex;
    align-items:center;
    gap:13px;
    padding:22px 24px 18px;
    border-bottom:1px solid #edf1f6;
}

.supplier-edit-icon{
    width:42px;
    height:42px;
    border-radius:13px;
    background:#edf3ff;
    color:#3268d8;
    display:grid;
    place-items:center;
    font-size:18px;
    flex-shrink:0;
}

.supplier-edit-card-head h3{
    font-size:16px;
    margin:0;
    font-weight:800;
    color:#1c2a43;
}

.supplier-edit-card-head p{
    font-size:12px;
    margin:4px 0 0;
    color:#8491a6;
}

.supplier-edit-card-body{
    padding:24px;
}

.supplier-edit-fields{
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:20px;
}

.supplier-edit-field.full{
    grid-column:1/-1;
}

.supplier-edit-field label{
    display:block;
    margin-bottom:8px;
    color:#42516a;
    font-size:13px;
    font-weight:700;
}

.supplier-edit-field label .required{
    color:#ef4444;
    margin-left:3px;
}

.supplier-edit-input-wrap{
    position:relative;
}

.supplier-edit-input-wrap .field-icon{
    position:absolute;
    left:13px;
    top:50%;
    transform:translateY(-50%);
    color:#9aa8bb;
    pointer-events:none;
}

.supplier-edit-field input,
.supplier-edit-field select,
.supplier-edit-field textarea{
    box-sizing:border-box;
    width:100%;
    border:1px solid #dce3ed;
    background:#fbfcfe;
    border-radius:11px;
    padding:12px 14px;
    color:#1e293b;
    font-size:14px;
    outline:none;
    transition:.2s;
    font-family:inherit;
}

.supplier-edit-field input.has-icon{
    padding-left:40px;
}

.supplier-edit-field textarea{
    resize:vertical;
    min-height:110px;
    line-height:1.6;
}

.supplier-edit-field input:focus,
.supplier-edit-field select:focus,
.supplier-edit-field textarea:focus{
    border-color:#5b8def;
    background:#fff;
    box-shadow:0 0 0 3px rgba(59,115,220,.11);
}

.supplier-edit-field input.invalid{
    border-color:#ef4444;
    background:#fffafa;
}

.supplier-edit-help{
    font-size:12px;
    color:#8b98aa;
    margin-top:6px;
}

.supplier-edit-error-text{
    font-size:12px;
    color:#e33;
    margin-top:6px;
}

.supplier-edit-status-row{
    display:flex;
    align-items:center;
    gap:10px;
    padding:12px 14px;
    border:1px solid #e2e8f0;
    border-radius:12px;
    background:#f8fafc;
}

.supplier-edit-status-row select{
    max-width:220px;
}

.supplier-edit-footer{
    position:sticky;
    bottom:12px;
    z-index:5;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    margin-top:22px;
    padding:14px 16px;
    background:rgba(255,255,255,.94);
    backdrop-filter:blur(12px);
    border:1px solid #e3e8f0;
    border-radius:16px;
    box-shadow:0 8px 30px rgba(18,36,70,.09);
}

.supplier-edit-footer-note{
    font-size:12px;
    color:#8591a4;
    display:flex;
    align-items:center;
    gap:7px;
}

.supplier-edit-actions{
    display:flex;
    gap:10px;
}

.supplier-edit-btn{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    padding:11px 17px;
    border-radius:11px;
    font-size:14px;
    font-weight:700;
    border:1px solid transparent;
    cursor:pointer;
    transition:.2s;
}

.supplier-edit-btn.cancel{
    background:#fff;
    border-color:#dce3ed;
    color:#526178;
}

.supplier-edit-btn.cancel:hover{
    background:#f7f9fc;
}

.supplier-edit-btn.save{
    background:#235bd5;
    color:#fff;
    box-shadow:0 4px 12px rgba(35,91,213,.2);
}

.supplier-edit-btn.save:hover{
    background:#1849b5;
    transform:translateY(-1px);
}

.supplier-edit-btn:disabled{
    opacity:.65;
    cursor:not-allowed;
    transform:none;
}

.supplier-edit-loading{
    min-height:60vh;
    display:grid;
    place-items:center;
    background:#f5f7fb;
}

.supplier-edit-spinner{
    width:42px;
    height:42px;
    border:4px solid #dce5f4;
    border-top-color:#3268d8;
    border-radius:50%;
    animation:supplier-spin .8s linear infinite;
}

@keyframes supplier-spin{
    to{
        transform:rotate(360deg);
    }
}

@media(max-width:700px){
    .supplier-edit-page{
        padding:18px 12px 35px;
    }

    .supplier-edit-heading h1{
        font-size:22px;
    }

    .supplier-edit-card-head{
        padding:18px;
    }

    .supplier-edit-card-body{
        padding:18px;
    }

    .supplier-edit-fields{
        grid-template-columns:1fr;
        gap:16px;
    }

    .supplier-edit-field.full{
        grid-column:auto;
    }

    .supplier-edit-footer{
        align-items:stretch;
        flex-direction:column;
    }

    .supplier-edit-footer-note{
        justify-content:center;
    }

    .supplier-edit-actions{
        display:grid;
        grid-template-columns:1fr 1fr;
    }

    .supplier-edit-btn{
        padding:12px 10px;
    }

    .supplier-edit-pill{
        display:none;
    }
}
`;

export default function EditSupplier() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        supplier_name: "",
        company_name: "",
        supplier_phone: "",
        supplier_email: "",
        gst_number: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        notes: "",
        status: "active"
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Load supplier
    useEffect(() => {
        loadSupplier();
    }, [id]);

    const loadSupplier = async () => {
        try {
            const res = await API.get(`/suppliers/${id}`);
            const data = res.data.data;

            setFormData({
                supplier_name: data.supplier_name || "",
                company_name: data.company_name || "",
                supplier_phone: data.supplier_phone || "",
                supplier_email: data.supplier_email || "",
                gst_number: data.gst_number || "",
                address: data.address || "",
                city: data.city || "",
                state: data.state || "",
                pincode: data.pincode || "",
                notes: data.notes || "",
                status: data.status || "active"
            });
        } catch (err) {
            console.error(err);
            alert("Failed to load supplier details");
            navigate("/suppliers");
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }

        setSuccessMessage("");
        setErrorMessage("");
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.supplier_name.trim()) {
            newErrors.supplier_name = "Supplier name is required";
        }

        if (!formData.supplier_phone.trim()) {
            newErrors.supplier_phone = "Phone number is required";
        } else if (
            !/^[0-9]{10}$/.test(
                formData.supplier_phone.replace(/\s/g, "")
            )
        ) {
            newErrors.supplier_phone =
                "Please enter a valid 10-digit phone number";
        }

        if (
            formData.supplier_email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplier_email)
        ) {
            newErrors.supplier_email =
                "Please enter a valid email address";
        }

        if (
            formData.pincode &&
            !/^[0-9]{6}$/.test(formData.pincode)
        ) {
            newErrors.pincode =
                "Please enter a valid 6-digit pincode";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            // Opening balance removed
            await API.put(`/suppliers/${id}`, formData);

            setSuccessMessage("Supplier updated successfully!");

            setTimeout(() => {
                navigate("/suppliers");
            }, 1200);

        } catch (err) {
            console.error(err);

            setErrorMessage(
                err.response?.data?.message ||
                "Failed to update supplier"
            );
        } finally {
            setSaving(false);
        }
    };

    // Reusable input component
    const input = (
        name,
        label,
        placeholder,
        icon,
        options = {}
    ) => (
        <div
            className={`supplier-edit-field ${
                options.full ? "full" : ""
            }`}
        >
            <label htmlFor={name}>
                {label}

                {options.required && (
                    <span className="required">*</span>
                )}
            </label>

            <div className={icon ? "supplier-edit-input-wrap" : ""}>
                {icon && (
                    <span className="field-icon">
                        {icon}
                    </span>
                )}

                <input
                    id={name}
                    name={name}
                    type={options.type || "text"}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`
                        ${icon ? "has-icon" : ""}
                        ${errors[name] ? "invalid" : ""}
                    `}
                    autoComplete={options.autoComplete || "off"}
                />
            </div>

            {errors[name] && (
                <div className="supplier-edit-error-text">
                    {errors[name]}
                </div>
            )}

            {options.help && (
                <div className="supplier-edit-help">
                    {options.help}
                </div>
            )}
        </div>
    );

    // Loading screen
    if (loading) {
        return (
            <>
                <style>{styles}</style>

                <div className="supplier-edit-loading">
                    <div style={{ textAlign: "center" }}>
                        <div className="supplier-edit-spinner" />

                        <p
                            style={{
                                color: "#718096",
                                marginTop: 14
                            }}
                        >
                            Loading supplier details...
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>

            <div className="supplier-edit-page">
                <div className="supplier-edit-wrap">

                    {/* Header */}
                    <header className="supplier-edit-header">
                        <div className="supplier-edit-title">

                            <button
                                className="supplier-edit-back"
                                type="button"
                                onClick={() => navigate("/suppliers")}
                                aria-label="Back to suppliers"
                            >
                                <FiArrowLeft />
                            </button>

                            <div className="supplier-edit-heading">
                                <h1>Edit Supplier</h1>

                                <p>
                                    Update supplier profile and contact information
                                </p>
                            </div>
                        </div>

                        <div className="supplier-edit-pill">
                            <FiShield />
                            Supplier profile management
                        </div>
                    </header>

                    {/* Messages */}
                    {successMessage && (
                        <div className="supplier-edit-alert supplier-edit-success">
                            <FiCheckCircle />
                            {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="supplier-edit-alert supplier-edit-error">
                            <FiAlertCircle />
                            {errorMessage}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="supplier-edit-grid"
                    >

                        {/* Supplier Information */}
                        <section className="supplier-edit-card">

                            <div className="supplier-edit-card-head">
                                <div className="supplier-edit-icon">
                                    <FiUser />
                                </div>

                                <div>
                                    <h3>Supplier Information</h3>
                                    <p>
                                        Basic identity and company details
                                    </p>
                                </div>
                            </div>

                            <div className="supplier-edit-card-body">
                                <div className="supplier-edit-fields">

                                    {input(
                                        "supplier_name",
                                        "Supplier Name",
                                        "Enter supplier name",
                                        <FiUser />,
                                        { required: true }
                                    )}

                                    {input(
                                        "company_name",
                                        "Company Name",
                                        "Enter company or business name",
                                        <FiBriefcase />
                                    )}

                                </div>
                            </div>
                        </section>

                        {/* Contact Details */}
                        <section className="supplier-edit-card">

                            <div className="supplier-edit-card-head">
                                <div className="supplier-edit-icon">
                                    <FiPhone />
                                </div>

                                <div>
                                    <h3>Contact Details</h3>
                                    <p>
                                        Phone, email and GST information
                                    </p>
                                </div>
                            </div>

                            <div className="supplier-edit-card-body">
                                <div className="supplier-edit-fields">

                                    {input(
                                        "supplier_phone",
                                        "Phone Number",
                                        "Enter phone number",
                                        <FiPhone />,
                                        {
                                            required: true,
                                            type: "tel"
                                        }
                                    )}

                                    {input(
                                        "supplier_email",
                                        "Email Address",
                                        "name@example.com",
                                        <FiMail />,
                                        { type: "email" }
                                    )}

                                    {input(
                                        "gst_number",
                                        "GST Number",
                                        "Enter GST number",
                                        <FiGlobe />,
                                        {
                                            help: "GST field accepts any value; no GST format restriction."
                                        }
                                    )}

                                </div>
                            </div>
                        </section>

                        {/* Address */}
                        <section className="supplier-edit-card">

                            <div className="supplier-edit-card-head">
                                <div className="supplier-edit-icon">
                                    <FiMapPin />
                                </div>

                                <div>
                                    <h3>Address Information</h3>
                                    <p>
                                        Supplier location and postal details
                                    </p>
                                </div>
                            </div>

                            <div className="supplier-edit-card-body">
                                <div className="supplier-edit-fields">

                                    {input(
                                        "address",
                                        "Street Address",
                                        "Enter street address",
                                        <FiMapPin />,
                                        { full: true }
                                    )}

                                    {input(
                                        "city",
                                        "City",
                                        "Enter city",
                                        <FiMapPin />
                                    )}

                                    {input(
                                        "state",
                                        "State",
                                        "Enter state",
                                        <FiGlobe />
                                    )}

                                    {input(
                                        "pincode",
                                        "Pincode",
                                        "Enter pincode",
                                        <FiHash />
                                    )}

                                </div>
                            </div>
                        </section>

                        {/* Status & Notes */}
                        <section className="supplier-edit-card">

                            <div className="supplier-edit-card-head">
                                <div className="supplier-edit-icon">
                                    <FiShield />
                                </div>

                                <div>
                                    <h3>Supplier Status & Notes</h3>
                                    <p>
                                        Manage supplier availability and additional information
                                    </p>
                                </div>
                            </div>

                            <div className="supplier-edit-card-body">
                                <div className="supplier-edit-fields">

                                    <div className="supplier-edit-field">
                                        <label htmlFor="status">
                                            Supplier Status
                                        </label>

                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="active">
                                                Active
                                            </option>

                                            <option value="inactive">
                                                Inactive
                                            </option>
                                        </select>

                                        <div className="supplier-edit-help">
                                            Inactive suppliers can be retained in your records.
                                        </div>
                                    </div>

                                    <div className="supplier-edit-field full">
                                        <label htmlFor="notes">
                                            Notes
                                        </label>

                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            placeholder="Add any notes about this supplier..."
                                        />
                                    </div>

                                </div>
                            </div>
                        </section>

                        {/* Footer Actions */}
                        <div className="supplier-edit-footer">

                            <div className="supplier-edit-footer-note">
                                <FiEdit3 />
                                Changes will be saved to this supplier profile
                            </div>

                            <div className="supplier-edit-actions">

                                <button
                                    type="button"
                                    className="supplier-edit-btn cancel"
                                    onClick={() => navigate("/suppliers")}
                                >
                                    <FiX />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="supplier-edit-btn save"
                                    disabled={saving}
                                >
                                    <FiSave />

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                            </div>
                        </div>

                    </form>

                </div>
            </div>
        </>
    );
}