import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const AdminRoute = () => {
    const {
        user,
        loading,
        isAuthenticated
    } = useContext(AuthContext);

    // ================================
    // AUTH LOADING
    // ================================

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

    // ================================
    // NOT LOGGED IN
    // ================================

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // ================================
    // ADMIN CHECK
    // ================================

    if (user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    // ================================
    // ADMIN ALLOWED
    // ================================

    return <Outlet />;
};

export default AdminRoute;