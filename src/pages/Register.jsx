
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const totalSteps = 3;

  const [currentStep, setCurrentStep] = useState(1);

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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (
        !formData.full_name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim()
      ) {
        setError("Please complete all your details.");
        return;
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.password || !formData.confirmPassword) {
        setError("Please enter and confirm your password.");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
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

    if (currentStep !== 3) {
      nextStep();
      return;
    }

    setIsLoading(true);
    setError("");

    const { confirmPassword, ...payload } = formData;

    try {
      const res = await API.post("/auth/register", payload);

      if (res.data.success) {
        navigate("/");
      } else {
        setError(
          res.data.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Please try again."
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
          localStorage.setItem(
            "businessName",
            res.data.business.business_name
          );
          localStorage.setItem(
            "businessType",
            res.data.business.business_type
          );

          navigate("/dashboard");
        } else {
          navigate("/create-business");
        }
      } else {
        setError(
          res.data.message || "Google sign-up failed. Please try again."
        );
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

  const steps = [
    {
      number: 1,
      title: "Profile",
      description: "Your basic details",
    },
    {
      number: 2,
      title: "Security",
      description: "Secure your account",
    },
    {
      number: 3,
      title: "Finish",
      description: "Review & create",
    },
  ];

  const getStepTitle = () => {
    if (currentStep === 1) return "Tell us about yourself";
    if (currentStep === 2) return "Create your password";
    return "You're almost ready";
  };

  const getStepDescription = () => {
    if (currentStep === 1)
      return "Let's start with a few details to create your account.";
    if (currentStep === 2)
      return "Choose a strong password to keep your account protected.";
    return "Take a quick look at your details before creating your account.";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          min-height: 100%;
          margin: 0;
        }

        body {
          font-family: "DM Sans", sans-serif;
          background: #f7f8fc;
        }

        .register-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          background:
            radial-gradient(circle at 12% 10%, rgba(99, 102, 241, 0.12), transparent 28%),
            radial-gradient(circle at 85% 90%, rgba(168, 85, 247, 0.10), transparent 28%),
            #f8f9fc;
          overflow: hidden;
        }

        /* =========================
           LEFT BRAND PANEL
        ========================= */

        .brand-panel {
          position: relative;
          min-height: 100vh;
          padding: 42px 56px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          background:
            radial-gradient(circle at 20% 20%, rgba(129, 140, 248, 0.28), transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(192, 132, 252, 0.20), transparent 32%),
            linear-gradient(145deg, #0c1020 0%, #11152a 45%, #171b34 100%);
        }

        .brand-panel::before {
          content: "";
          position: absolute;
          width: 560px;
          height: 560px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          top: -220px;
          left: -180px;
          box-shadow:
            0 0 0 80px rgba(255,255,255,0.015),
            0 0 0 160px rgba(255,255,255,0.012);
        }

        .brand-panel::after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          right: -170px;
          bottom: -170px;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow:
            0 0 0 70px rgba(255,255,255,0.012),
            0 0 0 140px rgba(255,255,255,0.01);
        }

        .brand-content,
        .brand-bottom,
        .brand-logo {
          position: relative;
          z-index: 2;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: "Manrope", sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .brand-logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #818cf8, #a855f7);
          box-shadow:
            0 12px 30px rgba(129, 140, 248, 0.28),
            inset 0 1px 0 rgba(255,255,255,0.3);
          font-size: 20px;
        }

        .brand-content {
          max-width: 620px;
          margin-top: auto;
          margin-bottom: auto;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          border-radius: 999px;
          color: #c7d2fe;
          background: rgba(129, 140, 248, 0.10);
          border: 1px solid rgba(129, 140, 248, 0.18);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.4px;
          margin-bottom: 25px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a5b4fc;
          box-shadow: 0 0 12px #818cf8;
        }

        .brand-title {
          margin: 0;
          max-width: 620px;
          font-family: "Manrope", sans-serif;
          font-size: clamp(42px, 4vw, 67px);
          line-height: 1.03;
          letter-spacing: -3px;
          font-weight: 800;
        }

        .gradient-text {
          background: linear-gradient(90deg, #c4b5fd, #a5b4fc, #e9d5ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .brand-description {
          max-width: 520px;
          margin: 25px 0 0;
          color: rgba(255,255,255,0.62);
          font-size: 16px;
          line-height: 1.75;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 40px;
          max-width: 600px;
        }

        .feature-card {
          padding: 16px;
          border-radius: 17px;
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.075);
          backdrop-filter: blur(16px);
          transition: 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.13);
        }

        .feature-icon {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(129,140,248,0.13);
          color: #c4b5fd;
          margin-bottom: 12px;
          font-size: 15px;
        }

        .feature-title {
          color: rgba(255,255,255,0.9);
          font-size: 13px;
          font-weight: 600;
        }

        .feature-text {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          margin-top: 4px;
        }

        .brand-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(255,255,255,0.35);
          font-size: 12px;
        }

        .secure-badge {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        /* =========================
           RIGHT FORM AREA
        ========================= */

        .form-panel {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 42px;
          position: relative;
        }

        .form-shell {
          width: 100%;
          max-width: 510px;
        }

        .mobile-brand {
          display: none;
        }

        .form-top {
          margin-bottom: 30px;
        }

        .welcome-label {
          color: #6366f1;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 9px;
        }

        .form-title {
          margin: 0;
          color: #111827;
          font-family: "Manrope", sans-serif;
          font-size: 32px;
          line-height: 1.2;
          letter-spacing: -1.4px;
          font-weight: 800;
        }

        .form-subtitle {
          margin: 9px 0 0;
          color: #7b8190;
          font-size: 14px;
          line-height: 1.6;
        }

        /* progress */

        .progress-wrapper {
          margin-bottom: 31px;
        }

        .progress-line {
          height: 3px;
          width: 100%;
          border-radius: 999px;
          background: #eceef5;
          overflow: hidden;
          margin-bottom: 18px;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          transition: width 0.45s cubic-bezier(.22,1,.36,1);
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #a2a7b2;
          cursor: pointer;
          user-select: none;
        }

        .step-number {
          width: 29px;
          height: 29px;
          border-radius: 50%;
          border: 1px solid #e2e4ec;
          background: #fff;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          transition: 0.3s ease;
        }

        .step.active {
          color: #373a46;
        }

        .step.active .step-number {
          color: white;
          border-color: #6366f1;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 6px 17px rgba(99,102,241,0.24);
        }

        .step.completed {
          color: #6366f1;
        }

        .step.completed .step-number {
          color: #6366f1;
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .step-info {
          min-width: 0;
        }

        .step-name {
          font-size: 11px;
          font-weight: 700;
        }

        .step-desc {
          margin-top: 1px;
          font-size: 9px;
          color: #b2b5bf;
        }

        /* form */

        .form-card {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(225,228,237,0.9);
          border-radius: 25px;
          padding: 28px;
          box-shadow:
            0 22px 65px rgba(31,35,54,0.07),
            0 2px 8px rgba(31,35,54,0.025);
          backdrop-filter: blur(18px);
        }

        .step-heading {
          margin-bottom: 24px;
        }

        .step-heading h2 {
          margin: 0;
          color: #171a23;
          font-family: "Manrope", sans-serif;
          font-size: 19px;
          letter-spacing: -0.5px;
        }

        .step-heading p {
          margin: 6px 0 0;
          color: #9296a2;
          font-size: 12px;
          line-height: 1.5;
        }

        .fields {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-label {
          color: #525765;
          font-size: 12px;
          font-weight: 700;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0a5b1;
          font-size: 16px;
          pointer-events: none;
          z-index: 1;
        }

        .input {
          width: 100%;
          height: 49px;
          border: 1px solid #e3e5ec;
          border-radius: 13px;
          outline: none;
          background: #fbfcfe;
          color: #171a23;
          padding: 0 14px 0 44px;
          font-family: inherit;
          font-size: 13px;
          transition: 0.25s ease;
        }

        .input::placeholder {
          color: #b5b8c2;
        }

        .input:hover {
          border-color: #d4d7e2;
        }

        .input:focus {
          background: #fff;
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
        }

        .input.error-input {
          border-color: #fca5a5;
          background: #fffafa;
        }

        .password-hint {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-top: 1px;
          color: #a1a5af;
          font-size: 10px;
        }

        /* confirmation */

        .confirm-card {
          border: 1px solid #e7e8ef;
          border-radius: 17px;
          overflow: hidden;
          background: #fbfcff;
        }

        .confirm-header {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          background: linear-gradient(135deg, #f5f3ff, #faf8ff);
          border-bottom: 1px solid #e8e7f0;
        }

        .confirm-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #ede9fe;
          color: #7c3aed;
          font-size: 17px;
        }

        .confirm-header strong {
          display: block;
          color: #262938;
          font-size: 13px;
        }

        .confirm-header span {
          display: block;
          margin-top: 3px;
          color: #999eaa;
          font-size: 10px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 13px 17px;
          border-bottom: 1px solid #eff0f4;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-label {
          color: #9ca0aa;
          font-size: 11px;
        }

        .summary-value {
          color: #292c38;
          font-size: 11px;
          font-weight: 600;
          text-align: right;
          max-width: 65%;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* buttons */

        .button-row {
          display: grid;
          grid-template-columns: 0.75fr 1.25fr;
          gap: 10px;
          margin-top: 22px;
        }

        .button {
          height: 49px;
          border: none;
          border-radius: 13px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          transition: 0.28s cubic-bezier(.22,1,.36,1);
        }

        .primary-button {
          color: white;
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          box-shadow: 0 9px 24px rgba(99,102,241,0.22);
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 13px 30px rgba(99,102,241,0.30);
        }

        .secondary-button {
          color: #686d79;
          background: #f5f6f9;
          border: 1px solid #e8e9ef;
        }

        .secondary-button:hover {
          color: #343742;
          background: #eef0f5;
        }

        .button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
        }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 15px;
          padding: 11px 13px;
          border-radius: 11px;
          background: #fff1f2;
          border: 1px solid #ffe0e3;
          color: #c2414e;
          font-size: 11px;
          line-height: 1.45;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 21px 0 15px;
          color: #b4b7c1;
          font-size: 10px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #eceef3;
        }

        .google-button {
          width: 100%;
          height: 47px;
          border: 1px solid #e1e3ea;
          border-radius: 13px;
          background: #fff;
          color: #3e424e;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.25s ease;
        }

        .google-button:hover:not(:disabled) {
          background: #fafbff;
          border-color: #cfd2dd;
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(31,35,54,0.06);
        }

        .google-logo {
          width: 18px;
          height: 18px;
        }

        .footer {
          text-align: center;
          margin-top: 20px;
          color: #9b9fa9;
          font-size: 11px;
        }

        .footer a {
          color: #6366f1;
          text-decoration: none;
          font-weight: 700;
          margin-left: 4px;
        }

        .footer a:hover {
          color: #4f46e5;
        }

        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }

        .success-check {
          width: 62px;
          height: 62px;
          margin: 0 auto 17px;
          border-radius: 20px;
          display: grid;
          place-items: center;
          background: #ecfdf5;
          color: #10b981;
          border: 1px solid #d1fae5;
          font-size: 28px;
          box-shadow: 0 10px 25px rgba(16,185,129,0.10);
        }

        .review-content {
          text-align: center;
          padding: 7px 0 5px;
        }

        .review-content h3 {
          margin: 0;
          color: #20232d;
          font-family: "Manrope", sans-serif;
          font-size: 19px;
        }

        .review-content p {
          max-width: 330px;
          margin: 7px auto 21px;
          color: #969aa6;
          font-size: 12px;
          line-height: 1.6;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-step {
          animation: slideUp 0.35s cubic-bezier(.22,1,.36,1);
        }

        /* =========================
           RESPONSIVE
        ========================= */

        @media (max-width: 1000px) {
          .register-page {
            grid-template-columns: 0.8fr 1.2fr;
          }

          .brand-panel {
            padding: 35px;
          }

          .brand-title {
            font-size: 44px;
            letter-spacing: -2px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .feature-card {
            padding: 12px;
          }

          .feature-card:nth-child(2),
          .feature-card:nth-child(3) {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .register-page {
            display: block;
            min-height: 100vh;
          }

          .brand-panel {
            display: none;
          }

          .form-panel {
            min-height: 100vh;
            padding: 25px 16px;
            align-items: flex-start;
          }

          .form-shell {
            max-width: 520px;
            margin: 0 auto;
            padding-top: 10px;
          }

          .mobile-brand {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 30px;
            font-family: "Manrope", sans-serif;
            font-size: 17px;
            font-weight: 800;
            color: #171a23;
          }

          .mobile-brand-mark {
            width: 35px;
            height: 35px;
            border-radius: 11px;
            display: grid;
            place-items: center;
            color: white;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
          }

          .form-title {
            font-size: 27px;
          }

          .form-card {
            padding: 21px;
            border-radius: 20px;
          }

          .step-desc {
            display: none;
          }

          .step {
            gap: 7px;
          }
        }

        @media (max-width: 430px) {
          .form-panel {
            padding: 20px 12px;
          }

          .form-title {
            font-size: 24px;
          }

          .form-card {
            padding: 18px;
          }

          .steps {
            gap: 5px;
          }

          .step-name {
            font-size: 10px;
          }

          .step-number {
            width: 27px;
            height: 27px;
          }

          .button-row {
            grid-template-columns: 1fr;
          }

          .secondary-button {
            order: 2;
          }
        }
      `}</style>

      <div className="register-page">

        {/* =========================
            LEFT BRAND EXPERIENCE
        ========================= */}

        <section className="brand-panel">

          <div className="brand-logo">
            <div className="brand-logo-mark">✦</div>
            Expense AI
          </div>

          <div className="brand-content">

            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Intelligent finance workspace
            </div>

            <h1 className="brand-title">
              Your money.
              <br />
              <span className="gradient-text">Under control.</span>
            </h1>

            <p className="brand-description">
              Build better financial habits with intelligent expense
              tracking, receipt management, reports and business insights
              in one simple workspace.
            </p>

            <div className="feature-grid">

              <div className="feature-card">
                <div className="feature-icon">◈</div>
                <div className="feature-title">Smart tracking</div>
                <div className="feature-text">
                  Organize expenses automatically.
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⌁</div>
                <div className="feature-title">AI insights</div>
                <div className="feature-text">
                  Turn numbers into insights.
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">↗</div>
                <div className="feature-title">Clear reports</div>
                <div className="feature-text">
                  Understand where money goes.
                </div>
              </div>

            </div>

          </div>

          <div className="brand-bottom">
            <span>© {new Date().getFullYear()} Expense AI</span>

            <div className="secure-badge">
              <span>⌾</span>
              Secure account creation
            </div>
          </div>

        </section>

        {/* =========================
            RIGHT REGISTER AREA
        ========================= */}

        <main className="form-panel">

          <div className="form-shell">

            <div className="mobile-brand">
              <div className="mobile-brand-mark">✦</div>
              Expense AI
            </div>

            <div className="form-top">

              <div className="welcome-label">
                Get started
              </div>

              <h2 className="form-title">
                Create your account
              </h2>

              <p className="form-subtitle">
                Start managing your finances with a smarter workspace.
              </p>

            </div>

            {/* Progress */}

            <div className="progress-wrapper">

              <div className="progress-line">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(currentStep / totalSteps) * 100}%`,
                  }}
                />
              </div>

              <div className="steps">

                {steps.map((step) => {

                  const active = currentStep === step.number;
                  const completed = currentStep > step.number;

                  return (
                    <div
                      key={step.number}
                      className={`step ${
                        active ? "active" : ""
                      } ${completed ? "completed" : ""}`}
                      onClick={() => {
                        if (step.number < currentStep) {
                          setCurrentStep(step.number);
                          setError("");
                        }
                      }}
                    >

                      <div className="step-number">
                        {completed ? "✓" : step.number}
                      </div>

                      <div className="step-info">
                        <div className="step-name">
                          {step.title}
                        </div>

                        <div className="step-desc">
                          {step.description}
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

            <div className="form-card">

              <div className="step-heading">

                <h2>{getStepTitle()}</h2>

                <p>{getStepDescription()}</p>

              </div>

              <form onSubmit={handleSubmit}>

                {/* STEP 1 */}

                {currentStep === 1 && (
                  <div className="fields animate-step">

                    <div className="field">

                      <label className="field-label">
                        Full name
                      </label>

                      <div className="input-wrap">

                        <span className="input-icon">
                          ♙
                        </span>

                        <input
                          className={`input ${
                            error ? "error-input" : ""
                          }`}
                          type="text"
                          name="full_name"
                          placeholder="Enter your full name"
                          value={formData.full_name}
                          onChange={handleChange}
                          autoComplete="name"
                        />

                      </div>

                    </div>

                    <div className="field">

                      <label className="field-label">
                        Email address
                      </label>

                      <div className="input-wrap">

                        <span className="input-icon">
                          @
                        </span>

                        <input
                          className={`input ${
                            error ? "error-input" : ""
                          }`}
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          autoComplete="email"
                        />

                      </div>

                    </div>

                    <div className="field">

                      <label className="field-label">
                        Phone number
                      </label>

                      <div className="input-wrap">

                        <span className="input-icon">
                          ☎
                        </span>

                        <input
                          className={`input ${
                            error ? "error-input" : ""
                          }`}
                          type="tel"
                          name="phone"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={handleChange}
                          autoComplete="tel"
                        />

                      </div>

                    </div>

                  </div>
                )}

                {/* STEP 2 */}

                {currentStep === 2 && (
                  <div className="fields animate-step">

                    <div className="field">

                      <label className="field-label">
                        Password
                      </label>

                      <div className="input-wrap">

                        <span className="input-icon">
                          ◉
                        </span>

                        <input
                          className={`input ${
                            error ? "error-input" : ""
                          }`}
                          type="password"
                          name="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="new-password"
                        />

                      </div>

                      <div className="password-hint">
                        <span>●</span>
                        Use at least 6 characters
                      </div>

                    </div>

                    <div className="field">

                      <label className="field-label">
                        Confirm password
                      </label>

                      <div className="input-wrap">

                        <span className="input-icon">
                          ✓
                        </span>

                        <input
                          className={`input ${
                            error ? "error-input" : ""
                          }`}
                          type="password"
                          name="confirmPassword"
                          placeholder="Repeat your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          autoComplete="new-password"
                        />

                      </div>

                    </div>

                  </div>
                )}

                {/* STEP 3 */}

                {currentStep === 3 && (
                  <div className="animate-step">

                    <div className="review-content">

                      <div className="success-check">
                        ✓
                      </div>

                      <h3>Ready to create your account</h3>

                      <p>
                        Everything looks good. Confirm your details
                        and start using Expense AI.
                      </p>

                    </div>

                    <div className="confirm-card">

                      <div className="confirm-header">

                        <div className="confirm-icon">
                          ✦
                        </div>

                        <div>
                          <strong>Account details</strong>
                          <span>Your information is ready</span>
                        </div>

                      </div>

                      <div className="summary-row">

                        <span className="summary-label">
                          Full name
                        </span>

                        <span className="summary-value">
                          {formData.full_name || "—"}
                        </span>

                      </div>

                      <div className="summary-row">

                        <span className="summary-label">
                          Email
                        </span>

                        <span className="summary-value">
                          {formData.email || "—"}
                        </span>

                      </div>

                      <div className="summary-row">

                        <span className="summary-label">
                          Phone
                        </span>

                        <span className="summary-value">
                          {formData.phone || "—"}
                        </span>

                      </div>

                    </div>

                  </div>
                )}

                {/* Error */}

                {error && (
                  <div className="error-box">
                    <span>!</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Buttons */}

                <div className="button-row">

                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="button secondary-button"
                      onClick={prevStep}
                      disabled={isLoading}
                    >
                      ← Back
                    </button>
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      className="button primary-button"
                      onClick={nextStep}
                      disabled={isLoading}
                    >
                      Continue
                      <span style={{ marginLeft: 8 }}>→</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="button primary-button"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          Create account
                          <span style={{ marginLeft: 8 }}>→</span>
                        </>
                      )}
                    </button>
                  )}

                </div>

                {/* Google */}

                <div className="divider">
                  <span className="divider-line" />
                  <span>OR CONTINUE WITH</span>
                  <span className="divider-line" />
                </div>

                <button
                  type="button"
                  className="google-button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                >

                  <svg
                    className="google-logo"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.79-.07-1.54-.23-2.27H12v4.3h5.23a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.42z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.48-4.03H3.27v2.53A9.74 9.74 0 0 0 12 21.75z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.52 13.83A5.84 5.84 0 0 1 6.2 12c0-.64.11-1.26.32-1.83V7.64H3.27A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.02 4.36l3.25-2.53z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 6.14c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.24 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.73 5.39l3.25 2.53C7.29 7.86 9.45 6.14 12 6.14z"
                    />
                  </svg>

                  Continue with Google

                </button>

              </form>

            </div>

            <div className="footer">

              Already have an account?

              <Link to="/">
                Sign in
              </Link>

            </div>

          </div>

        </main>

      </div>
    </>
  );
}

