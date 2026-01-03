"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    Pencil
} from "lucide-react";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus = "present" | "on_leave" | "absent";

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
    manager_id: string | null;
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

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: userLoading, canManageEmployees } = useUser();
    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [managerName, setManagerName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const id = params.id as string;

    // Fetch employee data
    useEffect(() => {
        const fetchEmployee = async () => {
            if (!user || !id) return;

            const supabase = createClient();

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

            setIsLoading(false);
        };

        if (!userLoading && user) {
            fetchEmployee();
        }
    }, [id, user, userLoading]);

    // Check if viewing own profile
    const isOwnProfile = user?.id === id;

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

    return (
        <div className="max-w-4xl mx-auto">
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
                        </div>

                        {/* Edit Button - Only for Admin/HR or own profile */}
                        {(canManageEmployees || isOwnProfile) && (
                            <Link href={isOwnProfile ? "/dashboard/profile" : `/dashboard/employees/${id}/edit`}>
                                <Button className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2">
                                    <Pencil className="h-4 w-4" />
                                    {isOwnProfile ? "My Profile" : "Edit Profile"}
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* View Only Notice - For employees viewing others */}
                    {!canManageEmployees && !isOwnProfile && (
                        <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <p className="text-sm text-slate-500 text-center">
                                👁️ Viewing employee profile in read-only mode
                            </p>
                        </div>
                    )}
                </div>

                {/* Employee Details Grid */}
                <div className="border-t border-slate-200 p-6">
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
                                        <Building className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-400">Employee ID</p>
                                            <p className="text-sm text-slate-700 font-mono">{employee.employee_id || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                {employee.about && (
                    <div className="border-t border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">About</h2>
                        <p className="text-slate-600 text-sm leading-relaxed">{employee.about}</p>
                    </div>
                )}

                {/* Skills Section */}
                {employee.skills && employee.skills.length > 0 && (
                    <div className="border-t border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {employee.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
