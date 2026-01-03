"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateEmployeePassword } from "@/lib/actions/auth";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    Users,
    Building,
    Plane,
    Loader2,
    Pencil,
    Lock,
    Eye,
    EyeOff,
    Copy,
    CheckCircle2,
    FileText,
    DollarSign,
    UserCircle,
    Save,
    Plus,
    Trash2,
    AlertCircle
} from "lucide-react";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "on_leave" | "absent";
type TabType = "resume" | "private" | "salary";

interface EmployeeDetail {
    id: string;
    employee_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    designation: string | null;
    department: string | null;
    avatar_url: string | null;
    attendance_status: AttendanceStatus;
    joining_date: string;
    location: string | null;
    skills: string[] | null;
    about: string | null;
    what_i_love: string | null;
    hobbies: string | null;
    certifications: string[] | null;
    manager_id: string | null;
    temporary_password: string | null;

    // Private Info
    date_of_birth: string | null;
    mailing_address: string | null;
    nationality: string | null;
    personal_email: string | null;
    gender: string | null;
    marital_status: string | null;

    // Bank Details
    bank_name: string | null;
    account_number: string | null;
    bank_address: string | null;
    ifsc_code: string | null;
    pan_id: string | null;
}

interface SalaryInfoData {
    id?: string;
    profile_id: string;
    monthly_wage: number;
    yearly_wage: number;
    working_days_per_week: number;
    break_time_hours: number;
    basic_salary: number;
    basic_salary_percentage: number;
    hra: number;
    hra_percentage: number;
    standard_allowance: number;
    standard_allowance_percentage: number;
    performance_bonus: number;
    performance_bonus_percentage: number;
    lta: number;
    lta_percentage: number;
    fixed_allowance: number;
    fixed_allowance_percentage: number;
    pf_employer: number;
    pf_employer_percentage: number;
    pf_employee: number;
    pf_employee_percentage: number;
    professional_tax: number;
}

// Format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

// Status badge component
function StatusBadge({ status }: { status: AttendanceStatus }) {
    if (status === "present") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Present
            </span>
        );
    }
    if (status === "on_leave") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Plane className="h-3 w-3" />
                On Leave
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            Absent
        </span>
    );
}

// Default salary data
const getDefaultSalaryData = (profileId: string): SalaryInfoData => ({
    profile_id: profileId,
    monthly_wage: 50000,
    yearly_wage: 600000,
    working_days_per_week: 5,
    break_time_hours: 1,
    basic_salary: 25000,
    basic_salary_percentage: 50,
    hra: 12500,
    hra_percentage: 25,
    standard_allowance: 4500,
    standard_allowance_percentage: 9,
    performance_bonus: 2500,
    performance_bonus_percentage: 5,
    lta: 2000,
    lta_percentage: 4,
    fixed_allowance: 2500,
    fixed_allowance_percentage: 5,
    pf_employer: 3000,
    pf_employer_percentage: 12,
    pf_employee: 3000,
    pf_employee_percentage: 12,
    professional_tax: 200,
});

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: userLoading, canManageEmployees, canViewSalary } = useUser();
    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [managerName, setManagerName] = useState<string | null>(null);
    const [salaryInfo, setSalaryInfo] = useState<SalaryInfoData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("resume");
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Salary editing state
    const [isEditingSalary, setIsEditingSalary] = useState(false);
    const [salaryLoading, setSalaryLoading] = useState(false);
    const [salaryMessage, setSalaryMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [editedSalary, setEditedSalary] = useState<SalaryInfoData | null>(null);

    const id = params.id as string;
    const supabase = createClient();

    // Fetch employee data
    useEffect(() => {
        const fetchEmployee = async () => {
            if (!user || !id) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .eq("company_id", user.company_id)
                .single();

            if (error || !data) {
                setNotFound(true);
                setIsLoading(false);
                return;
            }

            setEmployee(data);

            // Fetch manager name if exists
            if (data.manager_id) {
                const { data: manager } = await supabase
                    .from("profiles")
                    .select("first_name, last_name")
                    .eq("id", data.manager_id)
                    .single();

                if (manager) {
                    setManagerName(`${manager.first_name} ${manager.last_name}`);
                }
            }

            // Fetch salary info if admin
            if (canViewSalary) {
                const { data: salary } = await supabase
                    .from("salary_info")
                    .select("*")
                    .eq("profile_id", id)
                    .single();

                if (salary) {
                    setSalaryInfo(salary);
                    setEditedSalary(salary);
                } else {
                    // Initialize with default values
                    const defaultSalary = getDefaultSalaryData(id);
                    setEditedSalary(defaultSalary);
                }
            }

            setIsLoading(false);
        };

        if (!userLoading && user) {
            fetchEmployee();
        }
    }, [id, user, userLoading, canViewSalary]);

    // Check if viewing own profile
    const isOwnProfile = user?.id === id;

    // Handle copy password
    const handleCopyPassword = () => {
        if (employee?.temporary_password) {
            navigator.clipboard.writeText(employee.temporary_password);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    // Handle password update
    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "Passwords do not match" });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
            return;
        }

        setPasswordLoading(true);
        setPasswordMessage(null);

        try {
            const result = await updateEmployeePassword(id, newPassword);
            if (result.success) {
                setPasswordMessage({ type: "success", text: result.message || "Password updated successfully" });
                setNewPassword("");
                setConfirmPassword("");
                setEditingPassword(false);
                if (employee) {
                    setEmployee({ ...employee, temporary_password: newPassword });
                }
                setTimeout(() => setPasswordMessage(null), 3000);
            } else {
                setPasswordMessage({ type: "error", text: result.error || "Failed to update password" });
            }
        } catch (error) {
            setPasswordMessage({ type: "error", text: "An error occurred while updating password" });
        } finally {
            setPasswordLoading(false);
        }
    };

    // Handle salary save
    const handleSaveSalary = async () => {
        if (!editedSalary) return;

        setSalaryLoading(true);
        setSalaryMessage(null);

        try {
            // Calculate yearly from monthly if needed
            const updatedSalary = {
                ...editedSalary,
                yearly_wage: editedSalary.monthly_wage * 12,
            };

            if (salaryInfo?.id) {
                // Update existing
                const { error } = await supabase
                    .from("salary_info")
                    .update(updatedSalary)
                    .eq("id", salaryInfo.id);

                if (error) throw error;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from("salary_info")
                    .insert(updatedSalary)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setEditedSalary({ ...updatedSalary, id: data.id });
                }
            }

            setSalaryInfo(updatedSalary);
            setIsEditingSalary(false);
            setSalaryMessage({ type: "success", text: "Salary information saved successfully!" });
            setTimeout(() => setSalaryMessage(null), 3000);
        } catch (error) {
            console.error("Error saving salary:", error);
            setSalaryMessage({ type: "error", text: "Failed to save salary information" });
        } finally {
            setSalaryLoading(false);
        }
    };

    // Update salary field
    const updateSalaryField = (field: keyof SalaryInfoData, value: number) => {
        if (!editedSalary) return;

        const newSalary = { ...editedSalary, [field]: value };

        // Auto-calculate percentages based on monthly wage
        if (field === 'monthly_wage') {
            newSalary.yearly_wage = value * 12;
        }

        // If it's a component amount, calculate percentage
        if (field === 'basic_salary') {
            newSalary.basic_salary_percentage = editedSalary.monthly_wage > 0
                ? Number(((value / editedSalary.monthly_wage) * 100).toFixed(2)) : 0;
        }
        if (field === 'hra') {
            newSalary.hra_percentage = editedSalary.monthly_wage > 0
                ? Number(((value / editedSalary.monthly_wage) * 100).toFixed(2)) : 0;
        }
        if (field === 'standard_allowance') {
            newSalary.standard_allowance_percentage = editedSalary.monthly_wage > 0
                ? Number(((value / editedSalary.monthly_wage) * 100).toFixed(2)) : 0;
        }
        if (field === 'performance_bonus') {
            newSalary.performance_bonus_percentage = editedSalary.monthly_wage > 0
                ? Number(((value / editedSalary.monthly_wage) * 100).toFixed(2)) : 0;
        }
        if (field === 'lta') {
            newSalary.lta_percentage = editedSalary.monthly_wage > 0
                ? Number(((value / editedSalary.monthly_wage) * 100).toFixed(2)) : 0;
        }
        if (field === 'fixed_allowance') {
            newSalary.fixed_allowance_percentage = editedSalary.monthly_wage > 0
                ? Number(((value / editedSalary.monthly_wage) * 100).toFixed(2)) : 0;
        }

        setEditedSalary(newSalary);
    };

    if (userLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Employee Not Found</h2>
                <p className="text-slate-500 mb-4">This employee doesn&apos;t exist or you don&apos;t have access.</p>
                <Link href="/dashboard/employees">
                    <Button variant="outline">Back to Employees</Button>
                </Link>
            </div>
        );
    }

    if (!employee) return null;

    const displaySalary = isEditingSalary ? editedSalary : (salaryInfo || editedSalary);

    return (
        <div className="max-w-6xl mx-auto pb-10">
            {/* Back Button */}
            <Link href="/dashboard/employees" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Employees</span>
            </Link>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header with gradient background */}
                <div className="h-32 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100" />

                {/* Profile Info */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                        {/* Avatar */}
                        <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                            {employee.avatar_url ? (
                                <img
                                    src={employee.avatar_url}
                                    alt={`${employee.first_name} ${employee.last_name}`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-slate-400">
                                    {employee.first_name[0]}{employee.last_name?.[0] || ""}
                                </span>
                            )}
                        </div>

                        {/* Name and Status */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {employee.first_name} {employee.last_name}
                                </h1>
                                <StatusBadge status={employee.attendance_status} />
                            </div>
                            <p className="text-slate-600 mt-1">{employee.designation || "No designation"}</p>
                            <p className="text-indigo-600 font-medium">{employee.department || "No department"}</p>
                            <p className="text-sm text-slate-500 mt-1">Employee ID: {employee.employee_id || "N/A"}</p>
                        </div>

                        {/* Edit Button */}
                        {(canManageEmployees || isOwnProfile) && (
                            <Link href={isOwnProfile ? "/dashboard/profile" : `/dashboard/employees/${id}/edit`}>
                                <Button className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
                                    <Pencil className="h-4 w-4" />
                                    {isOwnProfile ? "My Profile" : "Edit Profile"}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-slate-200">
                    <div className="flex gap-1 px-6">
                        <button
                            onClick={() => setActiveTab("resume")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "resume"
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Resume
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("private")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "private"
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                Private Info
                            </div>
                        </button>
                        {canViewSalary && (
                            <button
                                onClick={() => setActiveTab("salary")}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "salary"
                                        ? "border-indigo-600 text-indigo-600"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Salary Info
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Resume Tab */}
                    {activeTab === "resume" && (
                        <div className="space-y-6">
                            {/* Contact & Work Info Grid */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Contact Information */}
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-indigo-500" />
                                        Contact Information
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Email</p>
                                                    <p className="text-sm text-slate-700">{employee.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {employee.phone && (
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-400">Phone</p>
                                                        <p className="text-sm text-slate-700">{employee.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {employee.location && (
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-400">Location</p>
                                                        <p className="text-sm text-slate-700">{employee.location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Work Information */}
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-indigo-500" />
                                        Work Information
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Joining Date</p>
                                                    <p className="text-sm text-slate-700">{formatDate(employee.joining_date)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {managerName && (
                                            <div className="p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Users className="h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-400">Manager</p>
                                                        <p className="text-sm text-slate-700">{managerName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Admin Only: Show Password */}
                                        {canManageEmployees && employee.temporary_password && !editingPassword && (
                                            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg shadow-sm">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <Lock className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Login Password</p>
                                                            <div className="mt-2 p-3 bg-white rounded border border-amber-200 font-mono text-sm font-semibold tracking-wider">
                                                                {showPassword ? employee.temporary_password : '••••••••••••'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="p-2 hover:bg-amber-200 rounded-lg transition-colors text-amber-700 hover:text-amber-900"
                                                        >
                                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                        <button
                                                            onClick={handleCopyPassword}
                                                            className={`p-2 rounded-lg transition-colors ${copiedPassword ? "bg-emerald-100 text-emerald-700" : "hover:bg-amber-200 text-amber-700"}`}
                                                        >
                                                            {copiedPassword ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                                        </button>
                                                        <button onClick={() => setEditingPassword(true)} className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                                                            Change
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* About Section */}
                            {employee.about && (
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">About</h2>
                                    <p className="text-slate-600 text-sm leading-relaxed">{employee.about}</p>
                                </div>
                            )}

                            {/* Skills Section */}
                            {employee.skills && employee.skills.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Skills</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {employee.skills.map((skill, index) => (
                                            <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certifications */}
                            {employee.certifications && employee.certifications.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Certifications</h2>
                                    <div className="space-y-2">
                                        {employee.certifications.map((cert, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                <span className="text-sm text-slate-700">{cert}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Private Info Tab */}
                    {activeTab === "private" && (
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Date of Birth</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.date_of_birth ? formatDate(employee.date_of_birth) : "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Gender</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.gender || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Marital Status</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.marital_status || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Nationality</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.nationality || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Personal Email</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.personal_email || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Mailing Address</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.mailing_address || "Not set"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Bank Details</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Bank Name</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.bank_name || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">Account Number</p>
                                        <p className="text-sm text-slate-700 mt-1 font-mono">{employee.account_number || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">IFSC Code</p>
                                        <p className="text-sm text-slate-700 mt-1 font-mono">{employee.ifsc_code || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400">PAN Number</p>
                                        <p className="text-sm text-slate-700 mt-1 font-mono">{employee.pan_id || "Not set"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg md:col-span-2">
                                        <p className="text-xs text-slate-400">Bank Address</p>
                                        <p className="text-sm text-slate-700 mt-1">{employee.bank_address || "Not set"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Salary Info Tab - Admin Only */}
                    {activeTab === "salary" && canViewSalary && displaySalary && (
                        <div className="space-y-6">
                            {/* Message */}
                            {salaryMessage && (
                                <div className={cn(
                                    "p-4 rounded-lg border flex items-center gap-3",
                                    salaryMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                                )}>
                                    {salaryMessage.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    {salaryMessage.text}
                                </div>
                            )}

                            {/* Edit/Save Buttons */}
                            <div className="flex justify-end gap-2">
                                {isEditingSalary ? (
                                    <>
                                        <Button variant="outline" onClick={() => { setIsEditingSalary(false); setEditedSalary(salaryInfo || getDefaultSalaryData(id)); }}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveSalary} disabled={salaryLoading} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                                            {salaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={() => setIsEditingSalary(true)} variant="outline" className="gap-2">
                                        <Pencil className="h-4 w-4" />
                                        Edit Salary
                                    </Button>
                                )}
                            </div>

                            {/* Salary Overview */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                                    <p className="text-xs text-emerald-700 font-medium mb-1">Monthly Wage</p>
                                    {isEditingSalary ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-emerald-900">₹</span>
                                            <Input
                                                type="number"
                                                value={displaySalary.monthly_wage}
                                                onChange={(e) => updateSalaryField('monthly_wage', Number(e.target.value))}
                                                className="text-lg font-bold bg-white"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-2xl font-bold text-emerald-900">₹{displaySalary.monthly_wage.toLocaleString()}</p>
                                    )}
                                    <p className="text-xs text-emerald-600 mt-1">/month</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                                    <p className="text-xs text-indigo-700 font-medium mb-1">Yearly Wage</p>
                                    <p className="text-2xl font-bold text-indigo-900">₹{displaySalary.yearly_wage.toLocaleString()}</p>
                                    <p className="text-xs text-indigo-600 mt-1">/year</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg">
                                    <p className="text-xs text-slate-600 font-medium mb-1">Working Days / Break</p>
                                    {isEditingSalary ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={displaySalary.working_days_per_week}
                                                onChange={(e) => updateSalaryField('working_days_per_week', Number(e.target.value))}
                                                className="w-16 text-center"
                                            />
                                            <span className="text-sm text-slate-600">days</span>
                                            <Input
                                                type="number"
                                                value={displaySalary.break_time_hours}
                                                onChange={(e) => updateSalaryField('break_time_hours', Number(e.target.value))}
                                                className="w-16 text-center"
                                            />
                                            <span className="text-sm text-slate-600">hrs</span>
                                        </div>
                                    ) : (
                                        <p className="text-xl font-bold text-slate-800">{displaySalary.working_days_per_week} days / {displaySalary.break_time_hours} hrs</p>
                                    )}
                                </div>
                            </div>

                            {/* Salary Components */}
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Salary Components</h2>
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Component</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount (₹/month)</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-slate-700">Basic Salary</td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditingSalary ? (
                                                        <Input type="number" value={displaySalary.basic_salary} onChange={(e) => updateSalaryField('basic_salary', Number(e.target.value))} className="w-28 text-right ml-auto" />
                                                    ) : (
                                                        <span className="font-medium">₹{displaySalary.basic_salary.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-500">{displaySalary.basic_salary_percentage}%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-slate-700">House Rent Allowance (HRA)</td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditingSalary ? (
                                                        <Input type="number" value={displaySalary.hra} onChange={(e) => updateSalaryField('hra', Number(e.target.value))} className="w-28 text-right ml-auto" />
                                                    ) : (
                                                        <span className="font-medium">₹{displaySalary.hra.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-500">{displaySalary.hra_percentage}%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-slate-700">Standard Allowance</td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditingSalary ? (
                                                        <Input type="number" value={displaySalary.standard_allowance} onChange={(e) => updateSalaryField('standard_allowance', Number(e.target.value))} className="w-28 text-right ml-auto" />
                                                    ) : (
                                                        <span className="font-medium">₹{displaySalary.standard_allowance.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-500">{displaySalary.standard_allowance_percentage}%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-slate-700">Performance Bonus</td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditingSalary ? (
                                                        <Input type="number" value={displaySalary.performance_bonus} onChange={(e) => updateSalaryField('performance_bonus', Number(e.target.value))} className="w-28 text-right ml-auto" />
                                                    ) : (
                                                        <span className="font-medium">₹{displaySalary.performance_bonus.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-500">{displaySalary.performance_bonus_percentage}%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-slate-700">Leave Travel Allowance (LTA)</td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditingSalary ? (
                                                        <Input type="number" value={displaySalary.lta} onChange={(e) => updateSalaryField('lta', Number(e.target.value))} className="w-28 text-right ml-auto" />
                                                    ) : (
                                                        <span className="font-medium">₹{displaySalary.lta.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-500">{displaySalary.lta_percentage}%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-slate-700">Fixed Allowance</td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditingSalary ? (
                                                        <Input type="number" value={displaySalary.fixed_allowance} onChange={(e) => updateSalaryField('fixed_allowance', Number(e.target.value))} className="w-28 text-right ml-auto" />
                                                    ) : (
                                                        <span className="font-medium">₹{displaySalary.fixed_allowance.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-slate-500">{displaySalary.fixed_allowance_percentage}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* PF Contribution & Tax Deductions */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Provident Fund */}
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Provident Fund (PF) Contribution</h2>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">Employer</p>
                                                    <p className="text-xs text-blue-600">PF is calculated based on the basic salary</p>
                                                </div>
                                                <div className="text-right">
                                                    {isEditingSalary ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">₹</span>
                                                            <Input type="number" value={displaySalary.pf_employer} onChange={(e) => updateSalaryField('pf_employer', Number(e.target.value))} className="w-24 text-right" />
                                                        </div>
                                                    ) : (
                                                        <p className="text-lg font-bold text-blue-900">₹{displaySalary.pf_employer.toLocaleString()}</p>
                                                    )}
                                                    <p className="text-xs text-blue-600">{displaySalary.pf_employer_percentage}% /month</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-800">Employee</p>
                                                    <p className="text-xs text-blue-600">PF is calculated based on the basic salary</p>
                                                </div>
                                                <div className="text-right">
                                                    {isEditingSalary ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">₹</span>
                                                            <Input type="number" value={displaySalary.pf_employee} onChange={(e) => updateSalaryField('pf_employee', Number(e.target.value))} className="w-24 text-right" />
                                                        </div>
                                                    ) : (
                                                        <p className="text-lg font-bold text-blue-900">₹{displaySalary.pf_employee.toLocaleString()}</p>
                                                    )}
                                                    <p className="text-xs text-blue-600">{displaySalary.pf_employee_percentage}% /month</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax Deductions */}
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Tax Deductions</h2>
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-red-800">Professional Tax</p>
                                                <p className="text-xs text-red-600">Professional Tax deducted from the gross salary</p>
                                            </div>
                                            <div className="text-right">
                                                {isEditingSalary ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">₹</span>
                                                        <Input type="number" value={displaySalary.professional_tax} onChange={(e) => updateSalaryField('professional_tax', Number(e.target.value))} className="w-24 text-right" />
                                                    </div>
                                                ) : (
                                                    <p className="text-lg font-bold text-red-900">₹{displaySalary.professional_tax.toLocaleString()}</p>
                                                )}
                                                <p className="text-xs text-red-600">/month</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
