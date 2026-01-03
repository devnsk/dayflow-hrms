"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/user-context";
import { createEmployee } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    ChevronLeft,
    Loader2,
    Copy,
    Check,
    AlertCircle,
    UserPlus
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Departments list - in a real app this might come from DB
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

export default function AddEmployeePage() {
    const { canManageEmployees, isLoading: userLoading } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{
        employeeId: string;
        tempPassword: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [department, setDepartment] = useState("");
    const [role, setRole] = useState("employee");

    // Redirect if not authorized
    if (!userLoading && !canManageEmployees) {
        router.push("/dashboard/employees");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessData(null);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await createEmployee(formData);

            if (result.error) {
                setError(result.error);
            } else if (result.success && result.employeeId && result.tempPassword) {
                setSuccessData({
                    employeeId: result.employeeId,
                    tempPassword: result.tempPassword,
                });
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const copyCredentials = () => {
        if (!successData) return;
        const text = `Dayflow HRMS Login Credentials\nLogin ID: ${successData.employeeId}\nPassword: ${successData.tempPassword}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    // Success State - Show Credentials
    if (successData) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-emerald-100 shadow-lg overflow-hidden">
                    <div className="bg-emerald-500 px-6 py-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Employee Created Successfully!</h1>
                    </div>

                    <div className="p-8 space-y-6">
                        <p className="text-slate-600">
                            The employee account has been created. Please share these credentials with the employee securely.
                            They will be asked to change their password upon first login.
                        </p>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Login ID</p>
                                    <p className="text-sm font-mono font-medium text-slate-800 mt-1">{successData.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temporary Password</p>
                                    <p className="text-sm font-mono font-medium text-slate-800 mt-1">{successData.tempPassword}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={copyCredentials}
                                variant="outline"
                                className="flex-1 border-slate-200 hover:bg-slate-50"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2 text-emerald-500" />
                                        Copied to Clipboard
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Credentials
                                    </>
                                )}
                            </Button>
                            <Link href="/dashboard/employees" className="flex-1">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    Return to List
                                </Button>
                            </Link>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => setSuccessData(null)}
                                className="text-sm text-slate-500 hover:text-indigo-600 underline underline-offset-4"
                            >
                                Add another employee
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-2 text-slate-500 text-sm">
                <Link href="/dashboard/employees" className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Back to Employees
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-medium">Add New Employee</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">New Employee Details</h1>
                        <p className="text-slate-500 text-sm">Fill in the information to create a new employee account</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                            <Input id="firstName" name="firstName" placeholder="e.g. John" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                            <Input id="lastName" name="lastName" placeholder="e.g. Doe" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                            <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="designation">Job Title / Designation</Label>
                            <Input id="designation" name="designation" placeholder="e.g. Senior Developer" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <div className="relative">
                                <select
                                    id="department"
                                    name="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">System Role <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                    className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Role</option>
                                    <option value="employee">Employee (Standard Access)</option>
                                    <option value="admin">Administrator (Full Access)</option>
                                </select>
                            </div>
                            <p className="text-xs text-slate-500">
                                Admins have full access to manage employees and settings.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="joiningDate">Joining Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="joiningDate"
                                name="joiningDate"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Link href="/dashboard/employees">
                            <Button type="button" variant="outline" className="border-slate-200">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Employee"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
