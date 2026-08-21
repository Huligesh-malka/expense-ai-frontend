import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Loader from "./Loader";

const ProtectedRoute = () => {
    const {
        user,
        loading,
        isAuthenticated
    } = useContext(AuthContext);

    // Wait until authentication state is restored
    if (loading) {
        return <Loader />;
    }

    // User is not logged in
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // User is authenticated
    return <Outlet />;
};

export default ProtectedRoute;