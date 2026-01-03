"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, User, Briefcase, MapPin, Loader2 } from "lucide-react";
import { mockEmployees, departments, designations, Employee } from "@/lib/data/employees";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [id, setId] = useState<string | null>(null);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        joiningDate: "",
        salary: "",
        address: "",
        emergencyContact: "",
        manager: "",
        status: "Active" as "Active" | "On Leave" | "Inactive",
    });

    useEffect(() => {
        params.then(({ id: paramId }) => {
            setId(paramId);
            const emp = mockEmployees.find((e) => e.id === paramId);
            if (emp) {
                setEmployee(emp);
                setFormData({
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone,
                    department: emp.department,
                    designation: emp.designation,
                    joiningDate: emp.joiningDate,
                    salary: emp.salary?.toString() || "",
                    address: emp.address || "",
                    emergencyContact: emp.emergencyContact || "",
                    manager: emp.manager || "",
                    status: emp.status,
                });
            }
            setIsLoading(false);
        });
    }, [params]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In production, update in Supabase here
        console.log("Updated employee data:", formData);

        // Redirect to employee profile
        router.push(`/dashboard/employees/${id}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-white text-lg">Employee not found</p>
                <Link href="/dashboard/employees">
                    <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                        Back to Employees
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/employees/${id}`}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Edit Employee</h1>
                    <p className="text-slate-400">Update information for {employee.firstName} {employee.lastName}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-400" />
                            Personal Information
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Basic details about the employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Employment Details */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-400" />
                            Employment Details
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Job-related information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="department" className="text-slate-300">Department *</Label>
                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select department</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="designation" className="text-slate-300">Designation *</Label>
                            <select
                                id="designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                required
                                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select designation</option>
                                {designations.map((desig) => (
                                    <option key={desig} value={desig}>{desig}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-slate-300">Status *</Label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-700 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joiningDate" className="text-slate-300">Joining Date *</Label>
                            <Input
                                id="joiningDate"
                                name="joiningDate"
                                type="date"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                required
                                className="bg-slate-900/50 border-slate-700 text-white focus:border-indigo-500 [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary" className="text-slate-300">Salary (Monthly)</Label>
                            <Input
                                id="salary"
                                name="salary"
                                type="number"
                                value={formData.salary}
                                onChange={handleChange}
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manager" className="text-slate-300">Reporting Manager</Label>
                            <Input
                                id="manager"
                                name="manager"
                                value={formData.manager}
                                onChange={handleChange}
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-indigo-400" />
                            Additional Information
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Address and emergency contact
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="address" className="text-slate-300">Address</Label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 rounded-md bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="emergencyContact" className="text-slate-300">Emergency Contact</Label>
                            <Input
                                id="emergencyContact"
                                name="emergencyContact"
                                value={formData.emergencyContact}
                                onChange={handleChange}
                                placeholder="Name and phone number"
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link href={`/dashboard/employees/${id}`}>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-700"
                        >
                            Cancel
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
