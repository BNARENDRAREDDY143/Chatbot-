import { useState, useEffect, createContext, useContext } from "react";
import { api } from "@/services/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check MongoDB session via token
    const initAuth = async () => {
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const signUp = async (email, password, username) => {
    const res = await api.register({ email, password, username });
    setUser(res.user);
    return res;
  };

  const signIn = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.user);
    return res;
  };

  const signOut = async () => {
    api.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    const updated = await api.getMe();
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};