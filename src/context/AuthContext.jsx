import {
    createContext,
    useEffect,
    useState,
} from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // =====================================
    // RESTORE LOGIN SESSION
    // =====================================

    useEffect(() => {
        const restoreSession = () => {
            try {
                const token = localStorage.getItem("token");
                const savedUser = localStorage.getItem("user");

                if (token && savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error(
                    "Failed to restore authentication:",
                    error
                );

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    // =====================================
    // LOGIN
    // =====================================

    const login = (userData, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem(
            "user",
            JSON.stringify(userData)
        );

        setUser(userData);
    };

    // =====================================
    // LOGOUT
    // =====================================

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("businessId");

        setUser(null);
    };

    // =====================================
    // AUTH STATUS
    // =====================================

    const isAuthenticated =
        !loading && !!user && !!localStorage.getItem("token");

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                loading,
                isAuthenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};