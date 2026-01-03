"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pencil,
    Plus,
    Shield,
    Key,
    Smartphone,
    Monitor,
    Loader2,
    Save,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";

type TabType = "resume" | "private" | "salary" | "security";

interface ProfileData {
    about: string | null;
    what_i_love: string | null;
    hobbies: string | null;
    skills: string[] | null;
    certifications: string[] | null;
    date_of_birth: string | null;
    mailing_address: string | null;
    nationality: string | null;
    personal_email: string | null;
    gender: string | null;
    marital_status: string | null;
    bank_name: string | null;
    account_number: string | null;
    bank_address: string | null;
    ifsc_code: string | null;
    pan_id: string | null;
}

interface SalaryData {
    monthly_wage: number;
    yearly_wage: number;
    working_days_per_week: number;
    break_time_hours: number;
    pf_employer: number;
    pf_employee: number;
    professional_tax: number;
}

export default function ProfilePage() {
    const { user, isLoading: userLoading, canViewSalary } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>("resume");
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [salaryData, setSalaryData] = useState<SalaryData | null>(null);

    // Tabs configuration - Salary Info only visible to Admin/HR
    const tabs: { id: TabType; label: string; visible: boolean }[] = [
        { id: "resume", label: "Resume", visible: true },
        { id: "private", label: "Private Info", visible: true },
        { id: "salary", label: "Salary Info", visible: canViewSalary },
        { id: "security", label: "Security", visible: true },
    ];

    // Fetch additional profile data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;

            const supabase = createClient();

            // Fetch profile details
            const { data: profile } = await supabase
                .from("profiles")
                .select("about, what_i_love, hobbies, skills, certifications, date_of_birth, mailing_address, nationality, personal_email, gender, marital_status, bank_name, account_number, bank_address, ifsc_code, pan_id")
                .eq("id", user.id)
                .single();

            if (profile) {
                setProfileData(profile);
            }

            // Fetch salary info if user can view it
            if (canViewSalary) {
                const { data: salary } = await supabase
                    .from("salary_info")
                    .select("*")
                    .eq("profile_id", user.id)
                    .single();

                if (salary) {
                    setSalaryData(salary);
                }
            }
        };

        if (!userLoading && user) {
            fetchProfileData();
        }
    }, [user, userLoading, canViewSalary]);

    const startEditing = (field: string, currentValue: string) => {
        setIsEditing(field);
        setEditValue(currentValue || "");
    };

    const saveEdit = async (field: string) => {
        if (!user) return;

        setIsSaving(true);
        const supabase = createClient();

        const { error } = await supabase
            .from("profiles")
            .update({ [field]: editValue })
            .eq("id", user.id);

        if (!error) {
            setProfileData(prev => prev ? { ...prev, [field]: editValue } : null);
        }

        setIsEditing(null);
        setIsSaving(false);
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setEditValue("");
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
            {/* Left Sidebar - Profile Card */}
            <div className="lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6 text-center">
                        {/* Avatar */}
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={`${user.first_name} ${user.last_name}`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-slate-400">
                                    {user.first_name[0]}{user.last_name?.[0] || ""}
                                </span>
                            )}
                        </div>

                        {/* Name and Role */}
                        <h2 className="text-xl font-bold text-slate-800">
                            {user.first_name} {user.last_name}
                        </h2>
                        <p className="text-slate-600 mt-1">{user.designation || "No designation"}</p>
                        <span className={cn(
                            "inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold",
                            user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-100 text-slate-700"
                        )}>
                            {user.role === "admin" ? "ADMIN" : "EMPLOYEE"}
                        </span>
                    </div>

                    {/* Employee Info */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Employee ID</span>
                                <span className="font-medium text-slate-800">{user.employee_id || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Department</span>
                                <span className="font-medium text-slate-800">{user.department || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Email</span>
                                <span className="font-medium text-slate-800 text-xs">{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Phone</span>
                                    <span className="font-medium text-slate-800">{user.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation - Vertical */}
                    <div className="border-t border-slate-200 p-2">
                        <nav className="space-y-1">
                            {tabs.filter(t => t.visible).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        activeTab === tab.id
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Right Content - Tab Content */}
            <div className="flex-1">
                {/* Resume Tab */}
                {activeTab === "resume" && (
                    <div className="space-y-6">
                        {/* About Section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">About</h3>
                                {isEditing === "about" ? (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveEdit("about")} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => startEditing("about", profileData?.about || "")}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <Pencil className="h-4 w-4 text-slate-400" />
                                    </button>
                                )}
                            </div>
                            {isEditing === "about" ? (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none"
                                    rows={4}
                                    placeholder="Tell us about yourself..."
                                />
                            ) : (
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {profileData?.about || "No information added yet. Click the edit icon to add something about yourself."}
                                </p>
                            )}
                        </div>

                        {/* What I Love Section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">What I love about my job</h3>
                                {isEditing !== "what_i_love" && (
                                    <button
                                        onClick={() => startEditing("what_i_love", profileData?.what_i_love || "")}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <Pencil className="h-4 w-4 text-slate-400" />
                                    </button>
                                )}
                                {isEditing === "what_i_love" && (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveEdit("what_i_love")} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {isEditing === "what_i_love" ? (
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none"
                                    rows={3}
                                />
                            ) : (
                                <p className="text-slate-600 text-sm">
                                    {profileData?.what_i_love || "Click edit to add what you love about your job."}
                                </p>
                            )}
                        </div>

                        {/* Skills Section */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Skills</h3>
                                <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Skills
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profileData?.skills && profileData.skills.length > 0 ? (
                                    profileData.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-sm">No skills added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Private Info Tab */}
                {activeTab === "private" && (
                    <div className="space-y-6">
                        {/* Personal Details */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoField label="Date of Birth" value={profileData?.date_of_birth || "Not set"} />
                                <InfoField label="Gender" value={profileData?.gender || "Not set"} />
                                <InfoField label="Nationality" value={profileData?.nationality || "Not set"} />
                                <InfoField label="Marital Status" value={profileData?.marital_status || "Not set"} />
                                <InfoField label="Personal Email" value={profileData?.personal_email || "Not set"} className="sm:col-span-2" />
                                <InfoField label="Mailing Address" value={profileData?.mailing_address || "Not set"} className="sm:col-span-2" />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Bank Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoField label="Bank Name" value={profileData?.bank_name || "Not set"} />
                                <InfoField label="Account Number" value={profileData?.account_number ? "****" + profileData.account_number.slice(-4) : "Not set"} />
                                <InfoField label="IFSC Code" value={profileData?.ifsc_code || "Not set"} />
                                <InfoField label="PAN ID" value={profileData?.pan_id || "Not set"} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Salary Info Tab - Only visible to Admin/HR */}
                {activeTab === "salary" && canViewSalary && (
                    <div className="space-y-6">
                        {/* Wage Info */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Compensation</h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Monthly Wage</p>
                                    <p className="text-2xl font-bold text-slate-800">₹{salaryData?.monthly_wage?.toLocaleString() || "0"}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Yearly Wage</p>
                                    <p className="text-2xl font-bold text-slate-800">₹{salaryData?.yearly_wage?.toLocaleString() || "0"}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Working Days/Week</p>
                                    <p className="text-2xl font-bold text-slate-800">{salaryData?.working_days_per_week || 5}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Break Time</p>
                                    <p className="text-2xl font-bold text-slate-800">{salaryData?.break_time_hours || 1} hr</p>
                                </div>
                            </div>
                        </div>

                        {/* PF Contributions */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">PF Contribution</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="bg-emerald-50 rounded-lg p-4">
                                    <p className="text-sm text-emerald-600">Employer Contribution</p>
                                    <p className="text-xl font-bold text-emerald-700">₹{salaryData?.pf_employer?.toLocaleString() || "0"}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-blue-600">Employee Contribution</p>
                                    <p className="text-xl font-bold text-blue-700">₹{salaryData?.pf_employee?.toLocaleString() || "0"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tax Deductions */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Deductions</h3>
                            <div className="bg-amber-50 rounded-lg p-4">
                                <p className="text-sm text-amber-600">Professional Tax</p>
                                <p className="text-xl font-bold text-amber-700">₹{salaryData?.professional_tax?.toLocaleString() || "0"}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                    <div className="space-y-6">
                        {/* Change Password */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Key className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Change Password</h3>
                                    <p className="text-sm text-slate-500">Update your password regularly for security</p>
                                </div>
                            </div>
                            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                                Change Password
                            </Button>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Smartphone className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Two-Factor Authentication</h3>
                                    <p className="text-sm text-slate-500">Add an extra layer of security</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                Enable 2FA
                            </Button>
                        </div>

                        {/* Active Sessions */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Monitor className="h-5 w-5 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Active Sessions</h3>
                                    <p className="text-sm text-slate-500">Manage your active login sessions</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Monitor className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">Current Session</p>
                                            <p className="text-xs text-slate-500">Active now</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                        This device
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for info fields
function InfoField({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div className={cn("bg-slate-50 rounded-lg p-3", className)}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-700">{value}</p>
        </div>
    );
}
