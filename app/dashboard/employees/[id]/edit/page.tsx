"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Briefcase, MapPin, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { updateEmployeeInfo } from "@/lib/actions/auth";

const DEPARTMENTS = [
    "Management",
    "Engineering",
    "Product",
    "Design",
    "HR",
    "Finance",
    "Sales",
    "Marketing",
    "Support",
];

const ROLES = [
    { value: "admin", label: "Admin" },
    { value: "hr", label: "HR" },
    { value: "employee", label: "Employee" },
];

interface EmployeeData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    designation: string | null;
    department: string | null;
    joining_date: string | null;
    location: string | null;
    role: string;
}

export default function EditEmployeePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: userLoading, canManageEmployees } = useUser();
    
    const [employee, setEmployee] = useState<EmployeeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        designation: "",
        department: "",
        joiningDate: "",
        location: "",
        role: "employee",
    });

    const id = params.id as string;

    // Redirect if not authorized
    useEffect(() => {
        if (!userLoading && !canManageEmployees) {
            router.push(`/dashboard/employees/${id}`);
        }
    }, [userLoading, canManageEmployees, id, router]);

    // Fetch employee data
    useEffect(() => {
        const fetchEmployee = async () => {
            if (!user || !id) return;

            const supabase = createClient();

            const { data, error: fetchError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .eq("company_id", user.company_id)
                .single();

            if (fetchError || !data) {
                setError("Failed to load employee data");
                setIsLoading(false);
                return;
            }

            setEmployee(data);
            setFormData({
                firstName: data.first_name || "",
                lastName: data.last_name || "",
                email: data.email || "",
                phone: data.phone || "",
                designation: data.designation || "",
                department: data.department || "",
                joiningDate: data.joining_date || "",
                location: data.location || "",
                role: data.role || "employee",
            });
            setIsLoading(false);
        };

        if (!userLoading && user && canManageEmployees) {
            fetchEmployee();
        }
    }, [id, user, userLoading, canManageEmployees]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsSubmitting(true);

        try {
            const formDataObj = new FormData();
            formDataObj.append("firstName", formData.firstName);
            formDataObj.append("lastName", formData.lastName);
            formDataObj.append("email", formData.email);
            formDataObj.append("phone", formData.phone);
            formDataObj.append("designation", formData.designation);
            formDataObj.append("department", formData.department);
            formDataObj.append("joiningDate", formData.joiningDate);
            formDataObj.append("location", formData.location);
            formDataObj.append("role", formData.role);

            const result = await updateEmployeeInfo(id, formDataObj);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/dashboard/employees/${id}`);
                }, 2000);
            } else {
                setError(result.error || "Failed to update employee");
            }
        } catch (err) {
            setError("An error occurred while updating the employee");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (userLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!canManageEmployees) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-semibold text-slate-800">Access Denied</p>
                <p className="text-slate-600">You don't have permission to edit this employee</p>
                <Link href={`/dashboard/employees/${id}`}>
                    <Button>Go Back</Button>
                </Link>
            </div>
        );
    }

    if (error && !employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-semibold text-slate-800">{error}</p>
                <Link href="/dashboard/employees">
                    <Button>Back to Employees</Button>
                </Link>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/dashboard/employees/${id}`} className="inline-flex">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Edit Employee</h1>
                    <p className="text-slate-600">Update information for {employee.first_name} {employee.last_name}</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <p className="text-emerald-800 font-medium">Employee information updated successfully!</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <User className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <Label htmlFor="firstName" className="text-slate-700">
                                First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="lastName" className="text-slate-700">
                                Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-slate-700">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone" className="text-slate-700">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Employment Information Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Employment Information</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <Label htmlFor="role" className="text-slate-700">
                                Role <span className="text-red-500">*</span>
                            </Label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="designation" className="text-slate-700">
                                Designation
                            </Label>
                            <Input
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="e.g., Manager, Developer"
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="department" className="text-slate-700">
                                Department
                            </Label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="joiningDate" className="text-slate-700">
                                Joining Date
                            </Label>
                            <Input
                                id="joiningDate"
                                name="joiningDate"
                                type="date"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                className="mt-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Location Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Location</h2>
                    </div>
                    <div>
                        <Label htmlFor="location" className="text-slate-700">
                            Work Location
                        </Label>
                        <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., New York, Remote, Mumbai"
                            className="mt-2"
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link href={`/dashboard/employees/${id}`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
