"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    Plus,
    Plane,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";

type AttendanceStatus = "present" | "on_leave" | "absent";

interface Employee {
    id: string;
    employee_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    designation: string | null;
    department: string | null;
    avatar_url: string | null;
    attendance_status: AttendanceStatus;
    status: string;
}

const ITEMS_PER_PAGE = 9;

// Status indicator component
function StatusIndicator({ status }: { status: AttendanceStatus }) {
    if (status === "present") {
        return (
            <div className="absolute top-3 right-3" title="Present in office">
                <div className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            </div>
        );
    }
    if (status === "on_leave") {
        return (
            <div className="absolute top-3 right-3" title="On leave">
                <Plane className="h-4 w-4 text-blue-500" />
            </div>
        );
    }
    // absent
    return (
        <div className="absolute top-3 right-3" title="Absent">
            <div className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-100" />
        </div>
    );
}

export default function EmployeesPage() {
    const { user, canManageEmployees, isLoading: userLoading } = useUser();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [departments, setDepartments] = useState<string[]>([]);

    // Fetch employees from Supabase
    useEffect(() => {
        const fetchEmployees = async () => {
            if (!user?.company_id) return;

            const supabase = createClient();
            const { data, error } = await supabase
                .from("profiles")
                .select("id, employee_id, first_name, last_name, email, designation, department, avatar_url, attendance_status, status")
                .eq("company_id", user.company_id)
                .order("first_name", { ascending: true });

            if (error) {
                console.error("Error fetching employees:", error);
                setIsLoading(false);
                return;
            }

            setEmployees(data || []);

            // Extract unique departments
            const uniqueDepts = [...new Set(data?.map(e => e.department).filter(Boolean))] as string[];
            setDepartments(uniqueDepts);

            setIsLoading(false);
        };

        if (!userLoading && user) {
            fetchEmployees();
        }
    }, [user, userLoading]);

    // Filter employees based on search and filters
    const filteredEmployees = useMemo(() => {
        return employees.filter((employee) => {
            const matchesSearch =
                searchQuery === "" ||
                `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (employee.employee_id && employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (employee.department && employee.department.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesDepartment =
                !selectedDepartment || employee.department === selectedDepartment;

            return matchesSearch && matchesDepartment;
        });
    }, [employees, searchQuery, selectedDepartment]);

    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const clearFilters = () => {
        setSelectedDepartment(null);
        setSearchQuery("");
        setCurrentPage(1);
    };

    if (userLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header with NEW Button (Admin/HR only) and Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* NEW Button - Only visible to Admin/HR */}
                {canManageEmployees ? (
                    <Link href="/dashboard/employees/add">
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 shadow-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            NEW
                        </Button>
                    </Link>
                ) : (
                    <div /> // Empty div for layout
                )}

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Department Filter Pills */}
            {departments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            setSelectedDepartment(null);
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                            !selectedDepartment
                                ? "bg-indigo-500 text-white"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        All
                    </button>
                    {departments.map((dept) => (
                        <button
                            key={dept}
                            onClick={() => {
                                setSelectedDepartment(selectedDepartment === dept ? null : dept);
                                setCurrentPage(1);
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                selectedDepartment === dept
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {dept}
                        </button>
                    ))}
                </div>
            )}

            {/* Employee Cards Grid */}
            {paginatedEmployees.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedEmployees.map((employee) => (
                        <Link
                            key={employee.id}
                            href={`/dashboard/employees/${employee.id}`}
                            className="block"
                        >
                            <div className="relative bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer group">
                                {/* Status Indicator */}
                                <StatusIndicator status={employee.attendance_status as AttendanceStatus} />

                                {/* Employee Card Content */}
                                <div className="flex flex-col items-center text-center">
                                    {/* Avatar */}
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 border-2 border-slate-200 group-hover:border-indigo-300 transition-colors overflow-hidden">
                                        {employee.avatar_url ? (
                                            <img
                                                src={employee.avatar_url}
                                                alt={`${employee.first_name} ${employee.last_name}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-semibold text-slate-400">
                                                {employee.first_name[0]}{employee.last_name?.[0] || ""}
                                            </span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <h3 className="font-semibold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                                        {employee.first_name} {employee.last_name}
                                    </h3>

                                    {/* Designation */}
                                    <p className="text-sm text-slate-500 mt-1">
                                        {employee.designation || "No designation"}
                                    </p>

                                    {/* Department Badge */}
                                    {employee.department && (
                                        <span className="mt-3 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                                            {employee.department}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No employees found</h3>
                    <p className="text-slate-500 mb-6">
                        {searchQuery || selectedDepartment
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by adding your first employee"}
                    </p>
                    {searchQuery || selectedDepartment ? (
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            Clear filters
                        </Button>
                    ) : canManageEmployees ? (
                        <Link href="/dashboard/employees/add">
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </Link>
                    ) : null}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                                "border-slate-200 min-w-[36px]",
                                currentPage === page
                                    ? "bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {page}
                        </Button>
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Present in office</span>
                </div>
                <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-blue-500" />
                    <span>On leave</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span>Absent (no time off applied)</span>
                </div>
            </div>
        </div>
    );
}
