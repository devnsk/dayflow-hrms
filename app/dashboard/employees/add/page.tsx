"use client";

import { useState } from "react";
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
import { ArrowLeft, Save, User, Briefcase, Phone, MapPin } from "lucide-react";
import { departments, designations } from "@/lib/data/employees";

export default function AddEmployeePage() {
    const router = useRouter();
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
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In production, save to Supabase here
        console.log("Employee data:", formData);

        // Redirect to employees list
        router.push("/dashboard/employees");
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/employees">
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Add New Employee</h1>
                    <p className="text-slate-400">Fill in the details to add a new team member</p>
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
                                placeholder="John"
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
                                placeholder="Doe"
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
                                placeholder="john.doe@company.com"
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
                                placeholder="+91 98765 43210"
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
                                placeholder="50000"
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
                                placeholder="Manager's name"
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
                                placeholder="Enter full address"
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
                    <Link href="/dashboard/employees">
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
                        {isSubmitting ? "Saving..." : "Save Employee"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
