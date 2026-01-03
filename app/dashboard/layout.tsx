"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Users,
    Calendar,
    Clock,
    LogOut,
    LayoutDashboard,
    Menu,
    X,
    User,
    ChevronDown,
    Settings,
    Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { UserProvider, useUser } from "@/lib/context/user-context";
import { checkIn, checkOut } from "@/lib/actions/auth";

const navigation = [
    { name: "Employees", href: "/dashboard/employees", icon: Users },
    { name: "Attendance", href: "/dashboard/attendance", icon: Clock },
    { name: "Time Off", href: "/dashboard/leaves", icon: Calendar },
];

function DashboardNavigation({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, logout, isAdmin, canManageEmployees } = useUser();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, isLoading, router]);

    // Sync check-in status with user profile
    useEffect(() => {
        if (user?.attendance_status) {
            setIsCheckedIn(user.attendance_status === 'present');
        }
    }, [user?.attendance_status]);

    const handleLogout = async () => {
        setProfileMenuOpen(false);
        setIsLoggingOut(true);
        await logout();
    };

    const handleCheckIn = async () => {
        setCheckInLoading(true);
        const result = await checkIn();
        if (result.success) {
            setIsCheckedIn(true);
        }
        setCheckInLoading(false);
    };

    const handleCheckOut = async () => {
        setCheckInLoading(true);
        const result = await checkOut();
        if (result.success) {
            setIsCheckedIn(false);
        }
        setCheckInLoading(false);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                    {/* Left Section - Logo and Navigation */}
                    <div className="flex items-center gap-6 lg:gap-8">
                        {/* Logo */}
                        <Link href="/dashboard/employees" className="flex items-center gap-2">
                            {user.company_logo ? (
                                <img
                                    src={user.company_logo}
                                    alt={user.company_name || "Company"}
                                    className="h-9 w-9 rounded-xl object-cover"
                                />
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                                    <LayoutDashboard className="h-4 w-4 text-white" />
                                </div>
                            )}
                            <span className="hidden sm:block text-lg font-bold text-slate-800">
                                {user.company_name || "Dayflow"}
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-600"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right Section - Check In/Out, Role Badge, and Profile */}
                    <div className="flex items-center gap-3">
                        {/* Role Badge */}
                        <span className={cn(
                            "hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                            user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-100 text-slate-700"
                        )}>
                            {user.role === "admin" ? "ADMIN" : "EMPLOYEE"}
                        </span>

                        {/* Check In / Check Out Button */}
                        <div className="hidden sm:flex items-center gap-2">
                            {checkInLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : !isCheckedIn ? (
                                <button
                                    onClick={handleCheckIn}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Check In →
                                </button>
                            ) : (
                                <button
                                    onClick={handleCheckOut}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Check Out →
                                </button>
                            )}
                        </div>

                        {/* Status Indicator */}
                        <div className={cn(
                            "h-3 w-3 rounded-full transition-colors",
                            isCheckedIn ? "bg-emerald-500" : "bg-red-500"
                        )} title={isCheckedIn ? "Checked In" : "Not Checked In"} />

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={`${user.first_name} ${user.last_name}`}
                                        className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200"
                                    />
                                ) : (
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center ring-2 ring-rose-100">
                                        <span className="text-sm font-medium text-white">
                                            {user.first_name[0]}{user.last_name?.[0] || ""}
                                        </span>
                                    </div>
                                )}
                                <ChevronDown className={cn(
                                    "h-4 w-4 text-slate-500 transition-transform hidden sm:block",
                                    profileMenuOpen && "rotate-180"
                                )} />
                            </button>

                            {/* Profile Dropdown Menu */}
                            {profileMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setProfileMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <p className="text-sm font-medium text-slate-800">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {user.designation} • {user.department}
                                            </p>
                                        </div>
                                        <Link
                                            href="/dashboard/profile"
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                            onClick={() => setProfileMenuOpen(false)}
                                        >
                                            <User className="h-4 w-4" />
                                            My Profile
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href="/dashboard/settings"
                                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                                onClick={() => setProfileMenuOpen(false)}
                                            >
                                                <Settings className="h-4 w-4" />
                                                Settings
                                            </Link>
                                        )}
                                        <div className="border-t border-slate-100 mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                {isLoggingOut ? "Logging out..." : "Log Out"}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5 text-slate-600" />
                            ) : (
                                <Menu className="h-5 w-5 text-slate-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white">
                        <nav className="flex flex-col p-4 gap-1">
                            {/* Role Badge Mobile */}
                            <div className="px-4 py-2 mb-2">
                                <span className={cn(
                                    "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                                    user.role === "admin"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-slate-100 text-slate-700"
                                )}>
                                    {user.role === "admin" ? "ADMIN" : "EMPLOYEE"}
                                </span>
                            </div>

                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-600"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5",
                                            isActive ? "text-indigo-500" : "text-slate-400"
                                        )} />
                                        {item.name}
                                    </Link>
                                );
                            })}

                            {/* Mobile Check In/Out */}
                            <div className="mt-2 pt-2 border-t border-slate-200">
                                {!isCheckedIn ? (
                                    <button
                                        onClick={() => {
                                            handleCheckIn();
                                            setMobileMenuOpen(false);
                                        }}
                                        disabled={checkInLoading}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {checkInLoading ? "Loading..." : "Check In →"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleCheckOut();
                                            setMobileMenuOpen(false);
                                        }}
                                        disabled={checkInLoading}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {checkInLoading ? "Loading..." : "Check Out →"}
                                    </button>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="pt-16">
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Settings Link - Only for Admin */}
            {isAdmin && (
                <Link
                    href="/dashboard/settings"
                    className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            )}
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <DashboardNavigation>{children}</DashboardNavigation>
        </UserProvider>
    );
}
