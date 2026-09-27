import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  // Step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.full_name || !formData.email || !formData.phone) {
        setError("Please fill in all fields.");
        return;
      }
    }
    if (currentStep === 2) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { confirmPassword, ...payload } = formData;

    try {
      const res = await API.post("/auth/register", payload);

      if (res.data.success) {
        navigate("/");
      } else {
        setError(res.data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Server error. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await API.post("/auth/google", { idToken });

      if (res.data.success) {
        localStorage.setItem("userId", res.data.user.id);
        localStorage.setItem("userName", res.data.user.full_name);
        localStorage.setItem("userEmail", res.data.user.email);

        if (res.data.business) {
          localStorage.setItem("businessId", res.data.business.id);
          localStorage.setItem("businessName", res.data.business.business_name);
          localStorage.setItem("businessType", res.data.business.business_type);
          navigate("/dashboard");
        } else {
          navigate("/create-business");
        }
      } else {
        setError(res.data.message || "Google sign-up failed. Please try again.");
      }
    } catch (err) {
      console.error("Google sign-up error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-up cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Please allow popups for this site.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Google sign-up failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Modern Step Wizard Styles ---
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
      maxWidth: "520px",
      padding: "42px 40px",
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
    // Step Progress
    progressContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "32px",
      position: "relative",
    },
    progressBar: {
      position: "absolute",
      top: "50%",
      left: "10%",
      right: "10%",
      height: "2px",
      background: "rgba(255,255,255,0.06)",
      transform: "translateY(-50%)",
      zIndex: 0,
    },
    progressFill: {
      position: "absolute",
      top: "50%",
      left: "10%",
      height: "2px",
      background: "linear-gradient(90deg, #6C63FF, #a78bfa)",
      transform: "translateY(-50%)",
      zIndex: 1,
      transition: "width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
    stepDot: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
      zIndex: 2,
      cursor: "pointer",
    },
    dot: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: 600,
      transition: "all 0.3s ease",
      border: "2px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.04)",
      color: "rgba(255,255,255,0.3)",
    },
    dotActive: {
      background: "linear-gradient(145deg, #6C63FF, #3f3d9e)",
      borderColor: "#6C63FF",
      color: "#fff",
      boxShadow: "0 8px 24px rgba(108, 99, 255, 0.35)",
    },
    dotCompleted: {
      background: "rgba(108, 99, 255, 0.2)",
      borderColor: "#6C63FF",
      color: "#6C63FF",
    },
    stepLabel: {
      fontSize: "11px",
      color: "rgba(255,255,255,0.3)",
      fontWeight: 500,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    stepLabelActive: {
      color: "rgba(255,255,255,0.7)",
    },
    // Form
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    stepContent: {
      animation: "fadeIn 0.3s ease",
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
    inputFocus: {
      borderColor: "rgba(108, 99, 255, 0.5)",
      background: "rgba(255, 255, 255, 0.07)",
      boxShadow: "0 0 0 4px rgba(108, 99, 255, 0.1)",
    },
    inputError: {
      borderColor: "rgba(239, 68, 68, 0.4)",
      background: "rgba(239, 68, 68, 0.06)",
    },
    errorMessage: {
      color: "#f87171",
      fontSize: "13px",
      marginTop: "4px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    // Buttons
    buttonRow: {
      display: "flex",
      gap: "12px",
      marginTop: "8px",
    },
    button: {
      flex: 1,
      padding: "15px",
      background: "linear-gradient(145deg, #6C63FF, #3f3d9e)",
      border: "none",
      borderRadius: "14px",
      color: "#fff",
      fontSize: "15px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 20px rgba(108, 99, 255, 0.3)",
      fontFamily: "inherit",
      letterSpacing: "0.3px",
      position: "relative",
      overflow: "hidden",
    },
    buttonSecondary: {
      flex: 1,
      padding: "15px",
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: "14px",
      color: "rgba(255, 255, 255, 0.6)",
      fontSize: "15px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      letterSpacing: "0.3px",
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
      width: "20px",
      height: "20px",
      border: "2.5px solid rgba(255, 255, 255, 0.2)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    },
    // Footer
    footer: {
      display: "flex",
      justifyContent: "center",
      marginTop: "28px",
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
    divider: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      margin: "6px 0 4px 0",
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      background: "rgba(255, 255, 255, 0.05)",
    },
    dividerText: {
      color: "rgba(255, 255, 255, 0.2)",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      fontWeight: 500,
    },
    socialRow: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
      marginTop: "4px",
    },
    socialBtn: {
      flex: 1,
      padding: "11px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      borderRadius: "12px",
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    socialBtnHover: {
      background: "rgba(255, 255, 255, 0.07)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      color: "#fff",
    },
  };

  // Keyframe animations
  const keyframes = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={styles.stepContent}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  style={{
                    ...styles.input,
                    ...(error && styles.inputError),
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
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    ...styles.input,
                    ...(error && styles.inputError),
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
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📞</span>
                <input
                  type="text"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{
                    ...styles.input,
                    ...(error && styles.inputError),
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
        );
      case 2:
        return (
          <div style={styles.stepContent}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="•••••••• (min. 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  style={{
                    ...styles.input,
                    ...(error && styles.inputError),
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
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔐</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{
                    ...styles.input,
                    ...(error && styles.inputError),
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
        );
      case 3:
        return (
          <div style={styles.stepContent}>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
              <h3 style={{ color: "#fff", margin: "0 0 8px 0", fontWeight: 600 }}>
                Almost there!
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", margin: "0", fontSize: "14px" }}>
                Review your details and create your account
              </p>
              <div style={{ 
                marginTop: "20px", 
                background: "rgba(255,255,255,0.03)", 
                borderRadius: "14px", 
                padding: "16px",
                textAlign: "left",
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Name</span>
                  <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>{formData.full_name || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Email</span>
                  <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>{formData.email || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Phone</span>
                  <span style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>{formData.phone || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.container}>
        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo}>✨</div>
            <h1 style={styles.title}>Create Account</h1>
            <p style={styles.subtitle}>Join Expense AI and start managing your finances</p>
          </div>

          {/* Step Progress */}
          <div style={styles.progressContainer}>
            <div style={{ ...styles.progressBar }} />
            <div
              style={{
                ...styles.progressFill,
                width: `${((currentStep - 1) / (totalSteps - 1)) * 80 + 10}%`,
              }}
            />
            {[1, 2, 3].map((step) => (
              <div key={step} style={styles.stepDot} onClick={() => setCurrentStep(step)}>
                <div
                  style={{
                    ...styles.dot,
                    ...(currentStep === step && styles.dotActive),
                    ...(currentStep > step && styles.dotCompleted),
                  }}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                <span
                  style={{
                    ...styles.stepLabel,
                    ...(currentStep === step && styles.stepLabelActive),
                  }}
                >
                  {step === 1 ? "Details" : step === 2 ? "Security" : "Confirm"}
                </span>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {renderStepContent()}

            {/* Error Message */}
            {error && (
              <div style={styles.errorMessage}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={styles.buttonRow}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={styles.buttonSecondary}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.08)";
                    e.target.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.04)";
                    e.target.style.color = "rgba(255, 255, 255, 0.6)";
                  }}
                >
                  ← Back
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
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
                  Continue →
                </button>
              ) : (
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
                  {isLoading ? <span style={styles.spinner} /> : "Create Account →"}
                </button>
              )}
            </div>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or sign up with</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Social Buttons */}
            <div style={styles.socialRow}>
              <button
                type="button"
                style={styles.socialBtn}
                onMouseEnter={(e) => {
                  e.target.style.background = styles.socialBtnHover.background;
                  e.target.style.borderColor = styles.socialBtnHover.borderColor;
                  e.target.style.color = styles.socialBtnHover.color;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.03)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.target.style.color = "rgba(255, 255, 255, 0.5)";
                }}
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <span>🔵</span> Google
              </button>
              <button
                type="button"
                style={styles.socialBtn}
                onMouseEnter={(e) => {
                  e.target.style.background = styles.socialBtnHover.background;
                  e.target.style.borderColor = styles.socialBtnHover.borderColor;
                  e.target.style.color = styles.socialBtnHover.color;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.03)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.target.style.color = "rgba(255, 255, 255, 0.5)";
                }}
                onClick={() => alert("GitHub sign-up coming soon!")}
                disabled={isLoading}
              >
                <span>⚫</span> GitHub
              </button>
            </div>
          </form>

          {/* Footer */}
          <div style={styles.footer}>
            <span>Already have an account?</span>
            <Link
              to="/"
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
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}