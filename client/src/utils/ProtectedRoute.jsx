import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoutes = () => {
    const { user } = useAuth();

    // Check if the user is authenticated
    // If user is authenticated, return the Outlet to render child routes

    if (!user) {
        // not authenticated; will redirect to login
    }

    return user ? <Outlet /> : <Navigate to="/" />;
}

export default ProtectedRoutes;