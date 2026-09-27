
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const totalSteps = 3;

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    {
      number: 1,
      label: "Profile",
      title: "Your details",
      description: "Tell us who you are",
      icon: "01",
    },
    {
      number: 2,
      label: "Security",
      title: "Secure access",
      description: "Create your password",
      icon: "02",
    },
    {
      number: 3,
      label: "Finish",
      title: "Review",
      description: "Confirm your account",
      icon: "03",
    },
  ];

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (!password) {
      return { score: 0, label: "Create a password", tone: "empty" };
    }
    if (score <= 2) return { score, label: "Needs improvement", tone: "weak" };
    if (score === 3) return { score, label: "Good password", tone: "medium" };
    return { score, label: "Strong password", tone: "strong" };
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (
        !formData.full_name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim()
      ) {
        setError("Please complete all required details.");
        return false;
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return false;
      }

      if (formData.phone.replace(/\D/g, "").length < 10) {
        setError("Please enter a valid phone number.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.password || !formData.confirmPassword) {
        setError("Please enter and confirm your password.");
        return false;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    if (step >= currentStep) return;
    setError("");
    setCurrentStep(step);
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
          res.data.message ||
            "We couldn't create your account. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "We couldn't connect to the server. Please try again."
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
          res.data.message ||
            "Google sign-up could not be completed. Please try again."
        );
      }
    } catch (err) {
      console.error("Google sign-up error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-up was cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError(
          "The sign-in popup was blocked. Please allow popups for this site."
        );
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Google sign-up could not be completed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    if (currentStep === 1) return "Start with the basics";
    if (currentStep === 2) return "Protect your workspace";
    return "Everything looks good";
  };

  const getStepDescription = () => {
    if (currentStep === 1)
      return "Create your Expense AI profile in a few seconds.";
    if (currentStep === 2)
      return "Choose a password that keeps your financial data protected.";
    return "Review your details and create your Expense AI account.";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');

        :root {
          --purple: #7257ff;
          --purple-dark: #563be8;
          --ink: #171827;
          --muted: #7f8497;
          --line: #e9eaf1;
          --surface: #ffffff;
          --soft: #f7f7fb;
        }

        * {
          box-sizing: border-box;
        }

        html, body, #root {
          min-height: 100%;
          margin: 0;
        }

        body {
          font-family: "DM Sans", sans-serif;
          background: #f5f6fa;
          color: var(--ink);
        }

        button, input {
          font: inherit;
        }

        .register-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(430px, 0.94fr) minmax(560px, 1.06fr);
          background:
            radial-gradient(circle at 73% 8%, rgba(115, 87, 255, .07), transparent 24%),
            #f7f8fb;
        }

        /* LEFT EXPERIENCE */

        .brand-panel {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 34px 54px 28px;
          color: #fff;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at 20% 16%, rgba(128, 108, 255, .26), transparent 27%),
            radial-gradient(circle at 88% 82%, rgba(168, 105, 255, .18), transparent 31%),
            linear-gradient(145deg, #0a0d1d 0%, #11142a 48%, #191631 100%);
        }

        .brand-panel::before,
        .brand-panel::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .brand-panel::before {
          width: 620px;
          height: 620px;
          top: -285px;
          left: -270px;
          border: 1px solid rgba(255,255,255,.09);
          box-shadow:
            0 0 0 74px rgba(255,255,255,.018),
            0 0 0 150px rgba(255,255,255,.012);
        }

        .brand-panel::after {
          width: 540px;
          height: 540px;
          right: -300px;
          bottom: -300px;
          border: 1px solid rgba(255,255,255,.07);
          box-shadow:
            0 0 0 70px rgba(255,255,255,.012),
            0 0 0 145px rgba(255,255,255,.008);
        }

        .noise {
          position: absolute;
          inset: 0;
          opacity: .035;
          pointer-events: none;
          background-image:
            radial-gradient(#fff 0.6px, transparent 0.6px);
          background-size: 6px 6px;
        }

        .brand-inner {
          position: relative;
          z-index: 2;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          width: fit-content;
          font-family: "Manrope", sans-serif;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -.5px;
        }

        .logo-mark {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 20px;
          color: #fff;
          background: linear-gradient(135deg, #8d79ff, #a74cff);
          box-shadow:
            0 12px 30px rgba(112, 80, 255, .32),
            inset 0 1px 0 rgba(255,255,255,.35);
        }

        .brand-main {
          max-width: 620px;
          margin: auto 0;
          padding: 48px 0 40px;
        }

        .mini-pill {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid rgba(163, 149, 255, .22);
          border-radius: 999px;
          color: #cfc9ff;
          background: rgba(119, 95, 255, .10);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .25px;
        }

        .pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #9b8cff;
          box-shadow: 0 0 0 5px rgba(155, 140, 255, .09), 0 0 15px #9b8cff;
        }

        .brand-title {
          margin: 25px 0 0;
          max-width: 590px;
          font-family: "Manrope", sans-serif;
          font-size: clamp(42px, 4.1vw, 68px);
          line-height: 1.02;
          letter-spacing: -3.6px;
          font-weight: 800;
        }

        .brand-gradient {
          background: linear-gradient(90deg, #c8beff 0%, #a89aff 42%, #e4c8ff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .brand-copy {
          max-width: 530px;
          margin: 25px 0 0;
          color: rgba(255,255,255,.58);
          font-size: 15px;
          line-height: 1.75;
        }

        .value-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 11px;
          margin-top: 34px;
          max-width: 600px;
        }

        .value-card {
          min-height: 116px;
          padding: 15px;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,.075);
          background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025));
          backdrop-filter: blur(16px);
          transition: transform .25s ease, border-color .25s ease, background .25s ease;
        }

        .value-card:hover {
          transform: translateY(-4px);
          border-color: rgba(180,165,255,.23);
          background: rgba(255,255,255,.09);
        }

        .value-icon {
          width: 31px;
          height: 31px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          margin-bottom: 13px;
          color: #d8d1ff;
          background: rgba(131, 110, 255, .14);
          border: 1px solid rgba(169, 154, 255, .12);
          font-size: 13px;
          font-weight: 800;
        }

        .value-title {
          color: rgba(255,255,255,.92);
          font-size: 12px;
          font-weight: 700;
        }

        .value-text {
          margin-top: 4px;
          color: rgba(255,255,255,.38);
          font-size: 10px;
          line-height: 1.45;
        }

        .brand-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: rgba(255,255,255,.35);
          font-size: 10px;
        }

        .trust {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .trust-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          color: #bdb4ff;
          background: rgba(139,124,255,.11);
        }

        /* RIGHT */

        .form-panel {
          min-height: 100vh;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 36px 56px;
        }

        .form-shell {
          width: min(100%, 610px);
        }

        .mobile-brand {
          display: none;
        }

        .top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .overline {
          margin-bottom: 8px;
          color: var(--purple);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .form-title {
          margin: 0;
          color: #151625;
          font-family: "Manrope", sans-serif;
          font-size: 31px;
          line-height: 1.14;
          letter-spacing: -1.45px;
          font-weight: 800;
        }

        .form-subtitle {
          margin: 8px 0 0;
          color: #85899b;
          font-size: 12px;
          line-height: 1.55;
        }

        .signin-top {
          padding-top: 4px;
          color: #8b8fa0;
          font-size: 11px;
          white-space: nowrap;
        }

        .signin-top a {
          color: #5f49df;
          text-decoration: none;
          font-weight: 800;
        }

        .progress-area {
          margin-bottom: 18px;
        }

        .progress-track {
          height: 4px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9eaf1;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7055ff, #9a68ff);
          box-shadow: 0 0 12px rgba(112,85,255,.22);
          transition: width .45s cubic-bezier(.22,1,.36,1);
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 13px;
        }

        .step {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          user-select: none;
        }

        .step-badge {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #969aab;
          border: 1px solid #e0e2ea;
          background: #fff;
          font-size: 9px;
          font-weight: 800;
          transition: .25s ease;
        }

        .step.active .step-badge {
          color: #fff;
          border-color: #7257ff;
          background: linear-gradient(135deg, #7257ff, #8d65ff);
          box-shadow: 0 6px 17px rgba(114,87,255,.24);
        }

        .step.completed .step-badge {
          color: #6850eb;
          border-color: #d7d0ff;
          background: #f0edff;
        }

        .step-label {
          color: #a0a4b2;
          font-size: 10px;
          font-weight: 700;
        }

        .step.active .step-label {
          color: #303243;
        }

        .step-description {
          margin-top: 2px;
          color: #b4b7c2;
          font-size: 8px;
        }

        .form-card {
          overflow: hidden;
          border: 1px solid #e6e7ee;
          border-radius: 25px;
          background: rgba(255,255,255,.94);
          box-shadow:
            0 24px 70px rgba(28,31,53,.08),
            0 3px 10px rgba(28,31,53,.025);
        }

        .card-header {
          padding: 23px 25px 18px;
          border-bottom: 1px solid #f0f1f5;
          background:
            radial-gradient(circle at 92% 0%, rgba(121,91,255,.08), transparent 25%),
            #fff;
        }

        .step-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #6f55ed;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .kicker-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #795dff;
        }

        .card-title {
          margin: 9px 0 0;
          color: #191a28;
          font-family: "Manrope", sans-serif;
          font-size: 18px;
          letter-spacing: -.6px;
          font-weight: 800;
        }

        .card-description {
          margin: 5px 0 0;
          color: #989cab;
          font-size: 10px;
          line-height: 1.5;
        }

        .card-body {
          padding: 23px 25px 25px;
        }

        .fields {
          display: grid;
          gap: 15px;
          animation: fadeUp .32s cubic-bezier(.22,1,.36,1);
        }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
        }

        .field {
          display: grid;
          gap: 7px;
        }

        .field-label {
          color: #535767;
          font-size: 10px;
          font-weight: 800;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 17px;
          color: #a7aaba;
          font-size: 12px;
          text-align: center;
          pointer-events: none;
          z-index: 1;
        }

        .input {
          width: 100%;
          height: 47px;
          padding: 0 42px 0 40px;
          outline: none;
          border: 1px solid #e2e4eb;
          border-radius: 13px;
          color: #202230;
          background: #fbfcfe;
          font-size: 12px;
          transition: .22s ease;
        }

        .input::placeholder {
          color: #b6b9c4;
        }

        .input:hover {
          border-color: #d3d5df;
        }

        .input:focus {
          border-color: #846dff;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(114,87,255,.075);
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 8px;
          color: #9b9faf;
          background: transparent;
          cursor: pointer;
        }

        .password-toggle:hover {
          color: #5e4bd5;
          background: #f3f1ff;
        }

        .password-meter {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 8px;
        }

        .meter-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .meter-bar {
          height: 4px;
          flex: 1;
          border-radius: 99px;
          background: #e9eaf0;
          transition: .2s ease;
        }

        .meter-bar.on.weak { background: #f59e0b; }
        .meter-bar.on.medium { background: #7c6cff; }
        .meter-bar.on.strong { background: #22c55e; }

        .meter-label {
          min-width: 95px;
          color: #a0a4b0;
          font-size: 9px;
          text-align: right;
        }

        .hint {
          margin-top: 6px;
          color: #a3a6b2;
          font-size: 9px;
        }

        .review {
          display: grid;
          gap: 16px;
          animation: fadeUp .32s cubic-bezier(.22,1,.36,1);
        }

        .review-hero {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 14px;
          border: 1px solid #e9e5ff;
          border-radius: 16px;
          background: linear-gradient(135deg, #f8f6ff, #fcfbff);
        }

        .review-check {
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 13px;
          color: #fff;
          background: linear-gradient(135deg, #7257ff, #956dff);
          box-shadow: 0 10px 24px rgba(114,87,255,.22);
          font-size: 17px;
        }

        .review-hero strong {
          display: block;
          color: #242535;
          font-size: 12px;
          font-weight: 800;
        }

        .review-hero span {
          display: block;
          margin-top: 3px;
          color: #999dad;
          font-size: 9px;
        }

        .summary {
          overflow: hidden;
          border: 1px solid #e7e8ee;
          border-radius: 16px;
          background: #fbfcfe;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          min-height: 43px;
          padding: 0 14px;
          border-bottom: 1px solid #eef0f4;
        }

        .summary-row:last-child {
          border-bottom: 0;
        }

        .summary-label {
          color: #9a9eaa;
          font-size: 9px;
        }

        .summary-value {
          max-width: 65%;
          overflow: hidden;
          color: #292c39;
          font-size: 10px;
          font-weight: 700;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .security-note {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 10px 11px;
          border-radius: 12px;
          color: #777b8a;
          background: #f7f7fa;
          font-size: 9px;
          line-height: 1.45;
        }

        .security-note strong {
          color: #454958;
        }

        .actions {
          display: grid;
          grid-template-columns: .75fr 1.25fr;
          gap: 10px;
          margin-top: 20px;
        }

        .button {
          height: 46px;
          border: 0;
          border-radius: 12px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
          transition: .25s cubic-bezier(.22,1,.36,1);
        }

        .primary {
          color: #fff;
          background: linear-gradient(135deg, #6f54ff, #8c62ff);
          box-shadow: 0 11px 25px rgba(112,83,255,.21);
        }

        .primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(112,83,255,.27);
        }

        .secondary {
          color: #666b7a;
          border: 1px solid #e5e6ec;
          background: #f7f8fa;
        }

        .secondary:hover:not(:disabled) {
          color: #343744;
          background: #f0f1f5;
        }

        .button:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none !important;
        }

        .error-box {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-top: 13px;
          padding: 10px 11px;
          border: 1px solid #ffdfe3;
          border-radius: 11px;
          color: #c2414e;
          background: #fff5f6;
          font-size: 9px;
          line-height: 1.45;
        }

        .error-icon {
          width: 15px;
          height: 15px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #fff;
          background: #e35d6a;
          font-size: 9px;
          font-weight: 800;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 18px 0 12px;
          color: #afb2bd;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .7px;
        }

        .divider-line {
          height: 1px;
          flex: 1;
          background: #eceef3;
        }

        .google-button {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid #e1e3e9;
          border-radius: 12px;
          color: #3e424f;
          background: #fff;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          transition: .22s ease;
        }

        .google-button:hover:not(:disabled) {
          border-color: #cfd2dc;
          background: #fbfbfd;
          box-shadow: 0 8px 20px rgba(31,35,54,.055);
          transform: translateY(-1px);
        }

        .google-logo {
          width: 17px;
          height: 17px;
        }

        .footer {
          margin-top: 16px;
          color: #9b9eab;
          font-size: 10px;
          text-align: center;
        }

        .footer a {
          margin-left: 4px;
          color: #654ce4;
          text-decoration: none;
          font-weight: 800;
        }

        .spinner {
          width: 17px;
          height: 17px;
          display: inline-block;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          vertical-align: middle;
        }

        .animate-step {
          animation: fadeUp .32s cubic-bezier(.22,1,.36,1);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1120px) {
          .register-page {
            grid-template-columns: minmax(380px, .8fr) minmax(500px, 1.2fr);
          }

          .brand-panel {
            padding-left: 38px;
            padding-right: 38px;
          }

          .form-panel {
            padding-left: 34px;
            padding-right: 34px;
          }

          .brand-title {
            font-size: 48px;
          }
        }

        @media (max-width: 900px) {
          .register-page {
            display: block;
          }

          .brand-panel {
            min-height: auto;
            padding: 28px 28px 25px;
          }

          .brand-main {
            margin: 45px 0 15px;
            padding: 0;
          }

          .brand-title {
            font-size: 46px;
          }

          .brand-copy {
            max-width: 650px;
          }

          .value-grid {
            max-width: 650px;
          }

          .brand-footer {
            margin-top: 25px;
          }

          .form-panel {
            min-height: auto;
            padding: 34px 24px 45px;
          }
        }

        @media (max-width: 620px) {
          .brand-panel {
            padding: 23px 19px;
          }

          .brand-title {
            font-size: 38px;
            letter-spacing: -2px;
          }

          .brand-copy {
            font-size: 13px;
          }

          .value-grid {
            grid-template-columns: 1fr;
          }

          .value-card {
            min-height: auto;
          }

          .value-card:nth-child(2),
          .value-card:nth-child(3) {
            display: none;
          }

          .form-panel {
            padding: 25px 14px 35px;
          }

          .top-row {
            display: block;
          }

          .signin-top {
            margin-top: 9px;
          }

          .form-title {
            font-size: 27px;
          }

          .card-header,
          .card-body {
            padding-left: 18px;
            padding-right: 18px;
          }

          .field-row {
            grid-template-columns: 1fr;
          }

          .steps {
            gap: 5px;
          }

          .step-description {
            display: none;
          }

          .actions {
            grid-template-columns: 1fr;
          }

          .secondary {
            order: 2;
          }
        }

        @media (max-width: 390px) {
          .brand-main {
            margin-top: 35px;
          }

          .brand-title {
            font-size: 33px;
          }

          .form-title {
            font-size: 24px;
          }

          .step-label {
            font-size: 9px;
          }
        }
      `}</style>

      <div className="register-page">
        <section className="brand-panel">
          <div className="noise" />

          <div className="brand-inner">
            <div className="brand-logo">
              <div className="logo-mark">✦</div>
              Expense AI
            </div>

            <div className="brand-main">
              <div className="mini-pill">
                <span className="pulse" />
                Intelligent financial workspace
              </div>

              <h1 className="brand-title">
                Your finances.
                <br />
                <span className="brand-gradient">Made simple.</span>
              </h1>

              <p className="brand-copy">
                Track expenses, organize receipts and understand your money
                with a smarter financial workspace built for everyday clarity.
              </p>

              <div className="value-grid">
                <div className="value-card">
                  <div className="value-icon">↗</div>
                  <div className="value-title">Smart tracking</div>
                  <div className="value-text">
                    Keep every expense organized in one place.
                  </div>
                </div>

                <div className="value-card">
                  <div className="value-icon">✦</div>
                  <div className="value-title">AI insights</div>
                  <div className="value-text">
                    Turn spending data into useful insights.
                  </div>
                </div>

                <div className="value-card">
                  <div className="value-icon">▥</div>
                  <div className="value-title">Clear reports</div>
                  <div className="value-text">
                    Understand trends without complicated spreadsheets.
                  </div>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <span>© {new Date().getFullYear()} Expense AI</span>
              <div className="trust">
                <span className="trust-icon">✓</span>
                Secure account setup
              </div>
            </div>
          </div>
        </section>

        <main className="form-panel">
          <div className="form-shell">
            <div className="top-row">
              <div>
                <div className="overline">Get started</div>
                <h2 className="form-title">Create your account</h2>
                <p className="form-subtitle">
                  A cleaner way to understand and manage your finances.
                </p>
              </div>

              <div className="signin-top">
                Already a member?
                <Link to="/"> Sign in</Link>
              </div>
            </div>

            <div className="progress-area">
              <div className="progress-track">
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
                      className={`step ${active ? "active" : ""} ${
                        completed ? "completed" : ""
                      }`}
                      onClick={() => goToStep(step.number)}
                    >
                      <div className="step-badge">
                        {completed ? "✓" : step.icon}
                      </div>

                      <div>
                        <div className="step-label">{step.label}</div>
                        <div className="step-description">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-card">
              <div className="card-header">
                <div className="step-kicker">
                  <span className="kicker-dot" />
                  Step {currentStep} of {totalSteps}
                </div>
                <h2 className="card-title">{getStepTitle()}</h2>
                <p className="card-description">{getStepDescription()}</p>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {currentStep === 1 && (
                    <div className="fields animate-step">
                      <div className="field">
                        <label className="field-label">Full name</label>
                        <div className="input-wrap">
                          <span className="input-icon">●</span>
                          <input
                            className="input"
                            type="text"
                            name="full_name"
                            placeholder="Enter your full name"
                            value={formData.full_name}
                            onChange={handleChange}
                            autoComplete="name"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="field-row">
                        <div className="field">
                          <label className="field-label">Email address</label>
                          <div className="input-wrap">
                            <span className="input-icon">@</span>
                            <input
                              className="input"
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
                          <label className="field-label">Phone number</label>
                          <div className="input-wrap">
                            <span className="input-icon">☎</span>
                            <input
                              className="input"
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
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="fields animate-step">
                      <div className="field">
                        <label className="field-label">Password</label>
                        <div className="input-wrap">
                          <span className="input-icon">◆</span>
                          <input
                            className="input"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create a secure password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? "◉" : "○"}
                          </button>
                        </div>

                        <div className="password-meter">
                          <div className="meter-bars">
                            {[1, 2, 3, 4, 5].map((bar) => (
                              <span
                                key={bar}
                                className={`meter-bar ${
                                  bar <= passwordStrength.score
                                    ? `on ${passwordStrength.tone}`
                                    : ""
                                }`}
                              />
                            ))}
                          </div>
                          <span className="meter-label">
                            {passwordStrength.label}
                          </span>
                        </div>

                        <div className="hint">
                          Use 6+ characters. Add numbers, uppercase letters or
                          symbols for stronger security.
                        </div>
                      </div>

                      <div className="field">
                        <label className="field-label">Confirm password</label>
                        <div className="input-wrap">
                          <span className="input-icon">✓</span>
                          <input
                            className="input"
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setShowConfirmPassword((v) => !v)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirmation password"
                                : "Show confirmation password"
                            }
                          >
                            {showConfirmPassword ? "◉" : "○"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="review animate-step">
                      <div className="review-hero">
                        <div className="review-check">✓</div>
                        <div>
                          <strong>Ready to create your account</strong>
                          <span>
                            Your profile is complete. Check the details below.
                          </span>
                        </div>
                      </div>

                      <div className="summary">
                        <div className="summary-row">
                          <span className="summary-label">Full name</span>
                          <span className="summary-value">
                            {formData.full_name || "—"}
                          </span>
                        </div>
                        <div className="summary-row">
                          <span className="summary-label">Email</span>
                          <span className="summary-value">
                            {formData.email || "—"}
                          </span>
                        </div>
                        <div className="summary-row">
                          <span className="summary-label">Phone</span>
                          <span className="summary-value">
                            {formData.phone || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="security-note">
                        <span>🔒</span>
                        <span>
                          <strong>Your account stays protected.</strong>{" "}
                          Passwords are never shown in this review.
                        </span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="error-box">
                      <span className="error-icon">!</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="actions">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        className="button secondary"
                        onClick={prevStep}
                        disabled={isLoading}
                      >
                        ← Back
                      </button>
                    )}

                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        className="button primary"
                        onClick={nextStep}
                        disabled={isLoading}
                      >
                        Continue <span style={{ marginLeft: 7 }}>→</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="button primary"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="spinner" />
                        ) : (
                          <>
                            Create my account
                            <span style={{ marginLeft: 7 }}>→</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="divider">
                    <span className="divider-line" />
                    OR CONTINUE WITH
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
            </div>

            <div className="footer">
              By creating an account, you agree to use Expense AI responsibly.
              <Link to="/"> Sign in instead</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
