import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = () => {
    const {
        user,
        loading,
        isAuthenticated
    } = useContext(AuthContext);

    // =====================================
    // WAIT FOR SESSION RESTORE
    // =====================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                }}
            >
                Loading...
            </div>
        );
    }

    // =====================================
    // NOT LOGGED IN
    // =====================================

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // =====================================
    // ADMIN USERS
    // NEVER ALLOW ADMIN INTO BUSINESS AREA
    // =====================================

    if (user.role === "admin") {
        return (
            <Navigate
                to="/admin/dashboard"
                replace
            />
        );
    }

    // =====================================
    // NORMAL BUSINESS USER
    // =====================================

    return <Outlet />;
};

export default ProtectedRoute;