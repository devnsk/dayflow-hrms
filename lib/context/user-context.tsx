"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Only 2 roles: admin (includes HR permissions) and employee
export type UserRole = "admin" | "employee";

export interface UserProfile {
    id: string;
    employee_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    designation: string | null;
    department: string | null;
    avatar_url: string | null;
    company_id: string | null;
    company_name?: string | null;
    company_logo?: string | null;
    is_first_login: boolean;
    attendance_status: string | null;
}

interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;        // Admin has all HR permissions
    isEmployee: boolean;
    canManageEmployees: boolean;  // Only Admin can manage employees
    canViewSalary: boolean;       // Only Admin can view salary info
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const fetchUserProfile = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            // Fetch profile with company info
            const { data: profile, error } = await supabase
                .from("profiles")
                .select(`
                    *,
                    company:companies(name, logo_url)
                `)
                .eq("id", authUser.id)
                .single();

            if (error || !profile) {
                console.error("Error fetching profile:", error);
                setUser(null);
                setIsLoading(false);
                return;
            }

            // Normalize role - treat 'hr' as 'admin' for backwards compatibility
            const normalizedRole: UserRole = profile.role === "hr" ? "admin" : (profile.role as UserRole);

            setUser({
                id: profile.id,
                employee_id: profile.employee_id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                phone: profile.phone,
                role: normalizedRole,
                designation: profile.designation,
                department: profile.department,
                avatar_url: profile.avatar_url,
                company_id: profile.company_id,
                company_name: profile.company?.name || null,
                company_logo: profile.company?.logo_url || null,
                is_first_login: profile.is_first_login,
                attendance_status: profile.attendance_status,
            });
        } catch (error) {
            console.error("Error in fetchUserProfile:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        setIsLoading(true);
        await fetchUserProfile();
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            // Use window.location for a hard redirect to ensure clean state
            window.location.href = "/auth/login";
        } catch (error) {
            console.error("Error logging out:", error);
            // Force redirect even if signOut fails
            window.location.href = "/auth/login";
        }
    };

    useEffect(() => {
        fetchUserProfile();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_IN") {
                    await fetchUserProfile();
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const isAdmin = user?.role === "admin";

    const value: UserContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isEmployee: user?.role === "employee",
        canManageEmployees: isAdmin,  // Only Admin can manage
        canViewSalary: isAdmin,       // Only Admin can view salary
        refreshUser,
        logout,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

// Higher-order component for role-based access
export function withRole(allowedRoles: UserRole[]) {
    return function WithRoleComponent<P extends object>(
        WrappedComponent: React.ComponentType<P>
    ) {
        return function WithRoleWrapper(props: P) {
            const { user, isLoading } = useUser();
            const router = useRouter();

            useEffect(() => {
                if (!isLoading && user && !allowedRoles.includes(user.role)) {
                    // Redirect to appropriate page based on role
                    router.push("/dashboard/employees");
                }
            }, [user, isLoading, router]);

            if (isLoading) {
                return (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                );
            }

            if (!user || !allowedRoles.includes(user.role)) {
                return null;
            }

            return <WrappedComponent {...props} />;
        };
    };
}
