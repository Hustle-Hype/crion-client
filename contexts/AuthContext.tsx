"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://crion.onrender.com/api/v1";

interface User {
    _id: string;
    primaryWallet: string;
    name: string;
    bio: string;
    avatar: string | null;
    stakedAmount: number;
    socialLinks: any[];
    walletLinks: Array<{
        network: string;
        address: string;
        verifiedAt: string;
        isPrimary: boolean;
    }>;
    kycStatus: {
        status: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    getMe: () => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
    setTokens: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Create axios instance with interceptors
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const setTokens = (accessToken: string, refreshToken: string) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
    };

    const getMe = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setIsAuthenticated(false);
                setUser(null);
                return;
            }

            const response = await apiClient.get("/issuer/me");

            if (response.data.status === 200) {
                setUser(response.data.data);
                setIsAuthenticated(true);
                console.log("User profile loaded:", response.data.data);
            }
        } catch (error: any) {
            console.error("Get me error:", error);
            if (error.response?.status === 401) {
                // Token might be expired, try to refresh
                const refreshSuccess = await refreshToken();
                if (refreshSuccess) {
                    // Retry getting user profile
                    await getMe();
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        }
    };

    const refreshToken = async (): Promise<boolean> => {
        try {
            const refreshTokenValue = localStorage.getItem("refreshToken");
            if (!refreshTokenValue) {
                console.log("No refresh token available");
                return false;
            }

            console.log("Refreshing token...");
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken: refreshTokenValue,
            });

            if (response.data.status === 200) {
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                console.log("Token refreshed successfully");
                return true;
            }

            return false;
        } catch (error) {
            console.error("Refresh token error:", error);
            logout();
            return false;
        }
    };

    const logout = () => {
        console.log("Logging out...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsAuthenticated(false);

        toast({
            title: "Logged out",
            description: "You have been logged out successfully.",
        });
    };

    // Auto refresh token every 15 minutes
    useEffect(() => {
        let refreshInterval: NodeJS.Timeout;

        if (isAuthenticated) {
            console.log("Setting up auto refresh token every 15 minutes");
            refreshInterval = setInterval(async () => {
                console.log("Auto refreshing token...");
                const success = await refreshToken();
                if (!success) {
                    console.log("Auto refresh failed, logging out");
                    logout();
                }
            }, 15 * 60 * 1000); // 15 minutes
        }

        return () => {
            if (refreshInterval) {
                console.log("Clearing refresh interval");
                clearInterval(refreshInterval);
            }
        };
    }, [isAuthenticated]);

    // Check auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                console.log("Found token, getting user profile...");
                await getMe();
            } else {
                console.log("No token found");
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        getMe,
        logout,
        refreshToken,
        setTokens,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Export apiClient for use in other components
export { apiClient };
