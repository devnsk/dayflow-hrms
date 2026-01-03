"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pencil,
    Plus,
    Shield,
    Key,
    Monitor,
    Loader2,
    Save,
    X,
    Trash2,
    AlertCircle,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { updateProfileField, addSkill, removeSkill, updateSalaryInfo } from "@/lib/actions/profile";

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
    basic_salary?: number;
    basic_salary_percentage?: number;
    hra?: number;
    hra_percentage?: number;
    dearness_allowance?: number;
    dearness_allowance_percentage?: number;
    standard_allowance?: number;
    standard_allowance_percentage?: number;
}

export default function ProfilePage() {
    const { user, isLoading: userLoading, canViewSalary } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>("resume");
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [newSkill, setNewSkill] = useState("");
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [isLoadingSalary, setIsLoadingSalary] = useState(false);

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

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

            try {
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
                    setIsLoadingSalary(true);
                    const { data: salary, error: salaryError } = await supabase
                        .from("salary_info")
                        .select("*")
                        .eq("profile_id", user.id)
                        .single();

                    if (salary) {
                        setSalaryData(salary);
                    } else if (!salaryError || salaryError?.code !== "PGRST116") {
                        // PGRST116 means no rows found, which is okay
                        console.log("Salary data not found for this user yet");
                    }
                    setIsLoadingSalary(false);
                }
            } catch (err) {
                console.error("Error fetching profile data:", err);
                setIsLoadingSalary(false);
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
        setError(null);

        const result = await updateProfileField(field, editValue);

        if (result.error) {
            setError(result.error);
        } else {
            setProfileData(prev => prev ? { ...prev, [field]: editValue } : null);
            setIsEditing(null);
        }

        setIsSaving(false);
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setEditValue("");
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;

        setIsAddingSkill(true);
        setError(null);

        const result = await addSkill(newSkill.trim());

        if (result.error) {
            setError(result.error);
        } else {
            const currentSkills = profileData?.skills || [];
            setProfileData(prev => prev ? { ...prev, skills: [...currentSkills, newSkill.trim()] } : null);
            setNewSkill("");
        }

        setIsAddingSkill(false);
    };

    const handleRemoveSkill = async (skillToRemove: string) => {
        setError(null);

        const result = await removeSkill(skillToRemove);

        if (result.error) {
            setError(result.error);
        } else {
            setProfileData(prev => prev ? { ...prev, skills: (prev.skills || []).filter(s => s !== skillToRemove) } : null);
        }
    };

    // Password change handler
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All fields are required");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordError("New password must be different from current password");
            return;
        }

        setIsChangingPassword(true);

        try {
            const supabase = createClient();

            // Verify current password by attempting re-authentication
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || "",
                password: currentPassword
            });

            if (signInError) {
                setPasswordError("Current password is incorrect");
                setIsChangingPassword(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setPasswordError(updateError.message || "Failed to update password");
                setIsChangingPassword(false);
                return;
            }

            // Clear form and show success
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Close modal after 2 seconds
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess(false);
            }, 2000);

        } catch (err) {
            setPasswordError("An error occurred while changing password");
            console.error(err);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const isSalaryEditing = isEditing && [
        "monthly_wage", "yearly_wage", "working_days_per_week", "break_time_hours",
        "pf_employer", "pf_employee", "professional_tax",
        "basic_salary", "hra", "dearness_allowance", "standard_allowance"
    ].includes(isEditing);

    const saveSalaryData = async () => {
        if (!salaryData) return;

        setIsSaving(true);
        setError(null);

        try {
            const result = await updateSalaryInfo({
                monthly_wage: salaryData.monthly_wage || 0,
                yearly_wage: salaryData.yearly_wage || 0,
                working_days_per_week: salaryData.working_days_per_week || 5,
                break_time_hours: salaryData.break_time_hours || 1,
                pf_employer: salaryData.pf_employer || 0,
                pf_employee: salaryData.pf_employee || 0,
                professional_tax: salaryData.professional_tax || 0,
                basic_salary: salaryData.basic_salary || 0,
                basic_salary_percentage: salaryData.basic_salary_percentage || 0,
                hra: salaryData.hra || 0,
                hra_percentage: salaryData.hra_percentage || 0,
                dearness_allowance: salaryData.dearness_allowance || 0,
                dearness_allowance_percentage: salaryData.dearness_allowance_percentage || 0,
                standard_allowance: salaryData.standard_allowance || 0,
                standard_allowance_percentage: salaryData.standard_allowance_percentage || 0,
            });

            if (result.error) {
                setError(result.error);
                console.error("Save error:", result.error);
            } else if (result.success) {
                setIsEditing(null);
                // Show success message briefly
                setError(null);
                console.log("Salary data saved successfully");
            }
        } catch (err) {
            console.error("Exception saving salary data:", err);
            setError(err instanceof Error ? err.message : "Failed to save salary data");
        } finally {
            setIsSaving(false);
        }
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
                            </div>
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Enter skill name"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                        className="text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleAddSkill}
                                        disabled={isAddingSkill || !newSkill.trim()}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white"
                                    >
                                        {isAddingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profileData?.skills && profileData.skills.length > 0 ? (
                                    profileData.skills.map((skill, index) => (
                                        <div
                                            key={index}
                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium flex items-center gap-2"
                                        >
                                            {skill}
                                            <button
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="hover:text-red-600 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
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
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Personal Details */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Personal Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <EditableField
                                    label="Date of Birth"
                                    fieldName="date_of_birth"
                                    value={profileData?.date_of_birth || ""}
                                    isEditing={isEditing === "date_of_birth"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("date_of_birth", profileData?.date_of_birth || "")}
                                    onSave={() => saveEdit("date_of_birth")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                    type="date"
                                />
                                <EditableField
                                    label="Gender"
                                    fieldName="gender"
                                    value={profileData?.gender || ""}
                                    isEditing={isEditing === "gender"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("gender", profileData?.gender || "")}
                                    onSave={() => saveEdit("gender")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                />
                                <EditableField
                                    label="Nationality"
                                    fieldName="nationality"
                                    value={profileData?.nationality || ""}
                                    isEditing={isEditing === "nationality"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("nationality", profileData?.nationality || "")}
                                    onSave={() => saveEdit("nationality")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                />
                                <EditableField
                                    label="Marital Status"
                                    fieldName="marital_status"
                                    value={profileData?.marital_status || ""}
                                    isEditing={isEditing === "marital_status"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("marital_status", profileData?.marital_status || "")}
                                    onSave={() => saveEdit("marital_status")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                />
                                <EditableField
                                    label="Personal Email"
                                    fieldName="personal_email"
                                    value={profileData?.personal_email || ""}
                                    isEditing={isEditing === "personal_email"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("personal_email", profileData?.personal_email || "")}
                                    onSave={() => saveEdit("personal_email")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                    type="email"
                                    fullWidth
                                />
                                <EditableField
                                    label="Mailing Address"
                                    fieldName="mailing_address"
                                    value={profileData?.mailing_address || ""}
                                    isEditing={isEditing === "mailing_address"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("mailing_address", profileData?.mailing_address || "")}
                                    onSave={() => saveEdit("mailing_address")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                    isTextarea
                                    fullWidth
                                />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Bank Details</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <EditableField
                                    label="Bank Name"
                                    fieldName="bank_name"
                                    value={profileData?.bank_name || ""}
                                    isEditing={isEditing === "bank_name"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("bank_name", profileData?.bank_name || "")}
                                    onSave={() => saveEdit("bank_name")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                />
                                <EditableField
                                    label="Account Number"
                                    fieldName="account_number"
                                    value={profileData?.account_number ? "****" + profileData.account_number.slice(-4) : ""}
                                    isEditing={isEditing === "account_number"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("account_number", profileData?.account_number || "")}
                                    onSave={() => saveEdit("account_number")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                    masked
                                />
                                <EditableField
                                    label="IFSC Code"
                                    fieldName="ifsc_code"
                                    value={profileData?.ifsc_code || ""}
                                    isEditing={isEditing === "ifsc_code"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("ifsc_code", profileData?.ifsc_code || "")}
                                    onSave={() => saveEdit("ifsc_code")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                />
                                <EditableField
                                    label="PAN ID"
                                    fieldName="pan_id"
                                    value={profileData?.pan_id || ""}
                                    isEditing={isEditing === "pan_id"}
                                    editValue={editValue}
                                    onEdit={() => startEditing("pan_id", profileData?.pan_id || "")}
                                    onSave={() => saveEdit("pan_id")}
                                    onCancel={cancelEdit}
                                    onChangeEdit={setEditValue}
                                    isSaving={isSaving}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Salary Info Tab - Only visible to Admin/HR */}
                {activeTab === "salary" && canViewSalary && (
                    <div className="space-y-6">
                        {isLoadingSalary ? (
                            <div className="flex items-center justify-center min-h-[400px]">
                                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                {/* Save Button */}
                                {isSalaryEditing && (
                                    <div className="flex gap-2 justify-end sticky top-20 bg-gradient-to-b from-slate-50 to-transparent pb-4">
                                        <Button
                                            onClick={saveSalaryData}
                                            disabled={isSaving}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                            Save Changes
                                        </Button>
                                        <Button
                                            onClick={cancelEdit}
                                            variant="outline"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                )}

                                {/* Wage Info */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800">Compensation</h3>
                                        {isEditing?.startsWith("salary") && (
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => saveSalaryData()} disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <SalaryEditField
                                            label="Monthly Wage"
                                            value={salaryData?.monthly_wage || 0}
                                            fieldName="monthly_wage"
                                            isEditing={isEditing === "monthly_wage"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("monthly_wage", (salaryData?.monthly_wage || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                        />
                                        <SalaryEditField
                                            label="Yearly Wage"
                                            value={salaryData?.yearly_wage || 0}
                                            fieldName="yearly_wage"
                                            isEditing={isEditing === "yearly_wage"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("yearly_wage", (salaryData?.yearly_wage || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                        />
                                        <SalaryEditField
                                            label="Working Days/Week"
                                            value={salaryData?.working_days_per_week || 5}
                                            fieldName="working_days_per_week"
                                            isEditing={isEditing === "working_days_per_week"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("working_days_per_week", (salaryData?.working_days_per_week || 5).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                        />
                                        <SalaryEditField
                                            label="Break Time (hours)"
                                            value={salaryData?.break_time_hours || 1}
                                            fieldName="break_time_hours"
                                            isEditing={isEditing === "break_time_hours"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("break_time_hours", (salaryData?.break_time_hours || 1).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            suffix="hr"
                                        />
                                    </div>
                                </div>

                                {/* Salary Components */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Salary Components</h3>
                                    <div className="space-y-4">
                                        <SalaryComponentField
                                            label="Basic Salary"
                                            fieldName="basic_salary"
                                            value={salaryData?.basic_salary || 0}
                                            percentage={salaryData?.basic_salary_percentage || 0}
                                            isEditing={isEditing === "basic_salary"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("basic_salary", (salaryData?.basic_salary || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                        />
                                        <SalaryComponentField
                                            label="House Rent Allowance (HRA)"
                                            fieldName="hra"
                                            value={salaryData?.hra || 0}
                                            percentage={salaryData?.hra_percentage || 0}
                                            isEditing={isEditing === "hra"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("hra", (salaryData?.hra || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                        />
                                        <SalaryComponentField
                                            label="Dearness Allowance (DA)"
                                            fieldName="dearness_allowance"
                                            value={salaryData?.dearness_allowance || 0}
                                            percentage={salaryData?.dearness_allowance_percentage || 0}
                                            isEditing={isEditing === "dearness_allowance"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("dearness_allowance", (salaryData?.dearness_allowance || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                        />
                                        <SalaryComponentField
                                            label="Standard Allowance"
                                            fieldName="standard_allowance"
                                            value={salaryData?.standard_allowance || 0}
                                            percentage={salaryData?.standard_allowance_percentage || 0}
                                            isEditing={isEditing === "standard_allowance"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("standard_allowance", (salaryData?.standard_allowance || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">PF Contribution</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <SalaryEditField
                                            label="Employer Contribution"
                                            value={salaryData?.pf_employer || 0}
                                            fieldName="pf_employer"
                                            isEditing={isEditing === "pf_employer"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("pf_employer", (salaryData?.pf_employer || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                            bgColor="emerald"
                                        />
                                        <SalaryEditField
                                            label="Employee Contribution"
                                            value={salaryData?.pf_employee || 0}
                                            fieldName="pf_employee"
                                            isEditing={isEditing === "pf_employee"}
                                            editValue={editValue}
                                            onEdit={() => startEditing("pf_employee", (salaryData?.pf_employee || 0).toString())}
                                            onChangeEdit={setEditValue}
                                            setSalaryData={setSalaryData}
                                            prefix="₹"
                                            bgColor="blue"
                                        />
                                    </div>
                                </div>

                                {/* Tax Deductions */}
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Deductions</h3>
                                    <SalaryEditField
                                        label="Professional Tax"
                                        value={salaryData?.professional_tax || 0}
                                        fieldName="professional_tax"
                                        isEditing={isEditing === "professional_tax"}
                                        editValue={editValue}
                                        onEdit={() => startEditing("professional_tax", (salaryData?.professional_tax || 0).toString())}
                                        onChangeEdit={setEditValue}
                                        setSalaryData={setSalaryData}
                                        prefix="₹"
                                        bgColor="amber"
                                    />
                                </div>
                            </>
                        )}
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
                            <Button
                                onClick={() => setShowPasswordModal(true)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                            >
                                Change Password
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

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordError(null);
                                    setPasswordSuccess(false);
                                }}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {passwordSuccess ? (
                            <div className="p-6">
                                <div className="text-center space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                        <Check className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-slate-800">Password Updated!</p>
                                    <p className="text-sm text-slate-500">Your password has been changed successfully.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                                {passwordError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <p className="text-sm">{passwordError}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Current Password <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="Enter your current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={isChangingPassword}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="Enter new password (min 8 characters)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isChangingPassword}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Confirm New Password <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isChangingPassword}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setPasswordError(null);
                                        }}
                                        disabled={isChangingPassword}
                                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for editable info fields
interface EditableFieldProps {
    label: string;
    fieldName: string;
    value: string;
    isEditing: boolean;
    editValue: string;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onChangeEdit: (value: string) => void;
    isSaving: boolean;
    type?: "text" | "email" | "date";
    isTextarea?: boolean;
    fullWidth?: boolean;
    masked?: boolean;
    className?: string;
}

function EditableField({
    label,
    fieldName,
    value,
    isEditing,
    editValue,
    onEdit,
    onSave,
    onCancel,
    onChangeEdit,
    isSaving,
    type = "text",
    isTextarea = false,
    fullWidth = false,
    masked = false,
    className
}: EditableFieldProps) {
    return (
        <div className={cn(fullWidth && "sm:col-span-2", className)}>
            <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-2">{label}</p>
                {isEditing ? (
                    <div className="flex gap-2">
                        {isTextarea ? (
                            <textarea
                                value={editValue}
                                onChange={(e) => onChangeEdit(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-md"
                                rows={3}
                            />
                        ) : (
                            <input
                                type={type}
                                value={editValue}
                                onChange={(e) => onChangeEdit(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-md"
                            />
                        )}
                        <Button
                            size="sm"
                            onClick={onSave}
                            disabled={isSaving}
                            className="bg-indigo-500 hover:bg-indigo-600"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={onCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">{masked && value ? "****" + value.slice(-4) : value || "Not set"}</p>
                        <button
                            onClick={onEdit}
                            className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                            <Pencil className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for editable salary component fields
interface SalaryComponentFieldProps {
    label: string;
    fieldName: string;
    value: number;
    percentage: number;
    isEditing: boolean;
    editValue: string;
    onEdit: () => void;
    onChangeEdit: (value: string) => void;
    setSalaryData: (data: SalaryData | ((prev: SalaryData | null) => SalaryData | null)) => void;
    prefix?: string;
}

function SalaryComponentField({
    label,
    fieldName,
    value,
    percentage,
    isEditing,
    editValue,
    onEdit,
    onChangeEdit,
    setSalaryData,
    prefix = ""
}: SalaryComponentFieldProps) {
    const updateSalaryComponentField = (newValue: string) => {
        onChangeEdit(newValue);
        setSalaryData(prev => prev ? { ...prev, [fieldName]: isNaN(Number(newValue)) ? 0 : Number(newValue) } : null);
    };

    return (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                {!isEditing && (
                    <p className="text-xs text-slate-500">{percentage}%</p>
                )}
            </div>
            {isEditing ? (
                <div className="flex gap-2 items-center">
                    {prefix && <span className="text-sm font-bold text-slate-600">{prefix}</span>}
                    <input
                        type="number"
                        value={editValue}
                        onChange={(e) => updateSalaryComponentField(e.target.value)}
                        placeholder="0"
                        className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-md"
                    />
                    <span className="text-xs text-slate-500">/month</span>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-800">
                        {prefix}{value?.toLocaleString() || "0"}
                    </p>
                    <button
                        onClick={onEdit}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                        <Pencil className="h-4 w-4 text-slate-400" />
                    </button>
                </div>
            )}
        </div>
    );
}

// Helper component for editable salary fields
interface SalaryEditFieldProps {
    label: string;
    fieldName: string;
    value: number;
    isEditing: boolean;
    editValue: string;
    onEdit: () => void;
    onChangeEdit: (value: string) => void;
    setSalaryData: (data: SalaryData | ((prev: SalaryData | null) => SalaryData | null)) => void;
    prefix?: string;
    suffix?: string;
    bgColor?: "slate" | "emerald" | "blue" | "amber";
}

function SalaryEditField({
    label,
    fieldName,
    value,
    isEditing,
    editValue,
    onEdit,
    onChangeEdit,
    setSalaryData,
    prefix = "",
    suffix = "",
    bgColor = "slate"
}: SalaryEditFieldProps) {
    const bgColorMap = {
        slate: "bg-slate-50",
        emerald: "bg-emerald-50",
        blue: "bg-blue-50",
        amber: "bg-amber-50"
    };

    const textColorMap = {
        slate: "text-slate-800",
        emerald: "text-emerald-700",
        blue: "text-blue-700",
        amber: "text-amber-700"
    };

    const updateSalaryField = (newValue: string) => {
        onChangeEdit(newValue);
        setSalaryData(prev => prev ? { ...prev, [fieldName]: isNaN(Number(newValue)) ? 0 : Number(newValue) } : null);
    };

    return (
        <div className={cn(bgColorMap[bgColor], "rounded-lg p-4")}>
            <p className="text-sm text-slate-500 mb-2">{label}</p>
            {isEditing ? (
                <div className="flex gap-2">
                    {prefix && <span className="text-sm font-bold text-slate-600">{prefix}</span>}
                    <input
                        type="number"
                        value={editValue}
                        onChange={(e) => updateSalaryField(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-md"
                    />
                    {suffix && <span className="text-sm font-bold text-slate-600">{suffix}</span>}
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <p className={cn("text-xl font-bold", textColorMap[bgColor])}>
                        {prefix}{value?.toLocaleString() || "0"}{suffix ? " " + suffix : ""}
                    </p>
                    <button
                        onClick={onEdit}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                        <Pencil className="h-4 w-4 text-slate-400" />
                    </button>
                </div>
            )}
        </div>
    );
}
