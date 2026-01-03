"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { createLeaveRequest, getLeaveRequests, getLeaveAllocation, cancelLeaveRequest, getAvailableDays, approveLeaveRequest, rejectLeaveRequest, type LeaveType } from "@/lib/actions/leaves";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Plus,
    X,
    Clock,
    CheckCircle,
    AlertCircle,
    CalendarDays,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEAVE_TYPES: Array<{ value: LeaveType; label: string; color: string }> = [
    { value: "paid_leave", label: "Paid Leave", color: "bg-emerald-100 text-emerald-700" },
    { value: "sick_leave", label: "Sick Leave", color: "bg-red-100 text-red-700" },
    { value: "unpaid_leave", label: "Unpaid Leave", color: "bg-slate-100 text-slate-700" },
    { value: "casual_leave", label: "Casual Leave", color: "bg-blue-100 text-blue-700" }
];

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600"
};

interface LeaveRequest {
    id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string | null;
    status: string;
    days_count: number;
}

interface LeaveAllocation {
    leave_type: LeaveType;
    total_days: number;
    used_days: number;
}

export default function LeavesPage() {
    const { user, isLoading: userLoading, isAdmin } = useUser();

    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allEmployeeRequests, setAllEmployeeRequests] = useState<any[]>([]); // For admin view
    const [allocation, setAllocation] = useState<Record<LeaveType, { total: number; used: number }>>({
        paid_leave: { total: 0, used: 0 },
        sick_leave: { total: 0, used: 0 },
        unpaid_leave: { total: 0, used: 0 },
        casual_leave: { total: 0, used: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        leaveType: "paid_leave" as LeaveType,
        startDate: "",
        endDate: "",
        reason: ""
    });

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            setLoading(true);

            try {
                if (isAdmin) {
                    // Admin: Fetch all leave requests with employee info
                    const supabase = createClient();

                    // Get all leave requests and join with profiles
                    const { data: requests, error: requestsError } = await supabase
                        .from('leave_request')
                        .select(`
                            *,
                            profile:profiles!leave_request_profile_id_fkey(
                                id, 
                                first_name, 
                                last_name, 
                                employee_id,
                                company_id
                            )
                        `)
                        .order('created_at', { ascending: false });

                    console.log("Admin leave requests:", requests, "Error:", requestsError);

                    if (!requestsError && requests) {
                        // Filter to only show requests from same company as admin
                        const filteredRequests = requests.filter((r: any) =>
                            r.profile?.company_id === user.company_id
                        );
                        console.log("Filtered requests:", filteredRequests);
                        setAllEmployeeRequests(filteredRequests);
                    } else if (requestsError) {
                        console.error("Error fetching leave requests:", requestsError);
                    }
                } else {
                    // Employee: Fetch only their requests and allocation
                    const [requestsResult, allocResult] = await Promise.all([
                        getLeaveRequests(),
                        getLeaveAllocation()
                    ]);

                    if (requestsResult.success && requestsResult.requests) {
                        setLeaveRequests(requestsResult.requests);
                    }

                    if (allocResult.success && allocResult.allocation) {
                        const allocationMap: Record<LeaveType, { total: number; used: number }> = {
                            paid_leave: { total: 0, used: 0 },
                            sick_leave: { total: 0, used: 0 },
                            unpaid_leave: { total: 0, used: 0 },
                            casual_leave: { total: 0, used: 0 }
                        };

                        allocResult.allocation.forEach((alloc: LeaveAllocation) => {
                            allocationMap[alloc.leave_type] = {
                                total: alloc.total_days,
                                used: alloc.used_days
                            };
                        });

                        setAllocation(allocationMap);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append("leaveType", formData.leaveType);
            formDataObj.append("startDate", formData.startDate);
            formDataObj.append("endDate", formData.endDate);
            formDataObj.append("reason", formData.reason);

            const result = await createLeaveRequest(formDataObj);

            if (result.success) {
                setMessage({ type: "success", text: result.message || "Leave request submitted successfully" });
                setShowModal(false);
                setFormData({ leaveType: "paid_leave", startDate: "", endDate: "", reason: "" });

                // Refresh requests
                const requestsResult = await getLeaveRequests();
                if (requestsResult.success && requestsResult.requests) {
                    setLeaveRequests(requestsResult.requests);
                }
            } else {
                setMessage({ type: "error", text: result.error || "Failed to submit leave request" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (requestId: string) => {
        if (!confirm("Are you sure you want to cancel this leave request?")) return;

        try {
            const result = await cancelLeaveRequest(requestId);
            if (result.success) {
                setMessage({ type: "success", text: result.message });
                const requestsResult = await getLeaveRequests();
                if (requestsResult.success && requestsResult.requests) {
                    setLeaveRequests(requestsResult.requests);
                }
            } else {
                setMessage({ type: "error", text: result.error || "Failed to cancel leave request" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to cancel leave request" });
        }
    };

    const handleApprove = async (requestId: string) => {
        if (!confirm("Approve this leave request?")) return;

        setProcessingRequestId(requestId);
        setMessage(null);

        try {
            const result = await approveLeaveRequest(requestId);
            if (result.success) {
                setMessage({ type: "success", text: result.message || "Leave request approved" });
                // Refresh the list
                const supabase = createClient();
                const { data: requests } = await supabase
                    .from('leave_request')
                    .select('*, profile:profiles(id, first_name, last_name, employee_id)')
                    .order('created_at', { ascending: false });
                if (requests) {
                    setAllEmployeeRequests(requests);
                }
            } else {
                setMessage({ type: "error", text: result.error || "Failed to approve leave request" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to approve leave request" });
            console.error(error);
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!confirm("Reject this leave request?")) return;

        setProcessingRequestId(requestId);
        setMessage(null);

        try {
            const result = await rejectLeaveRequest(requestId);
            if (result.success) {
                setMessage({ type: "success", text: result.message || "Leave request rejected" });
                // Refresh the list
                const supabase = createClient();
                const { data: requests } = await supabase
                    .from('leave_request')
                    .select('*, profile:profiles(id, first_name, last_name, employee_id)')
                    .order('created_at', { ascending: false });
                if (requests) {
                    setAllEmployeeRequests(requests);
                }
            } else {
                setMessage({ type: "error", text: result.error || "Failed to reject leave request" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to reject leave request" });
            console.error(error);
        } finally {
            setProcessingRequestId(null);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        {isAdmin ? "Leave Management" : "Time Off"}
                    </h1>
                    <p className="text-slate-600 mt-1">
                        {isAdmin
                            ? "Manage employee leave requests and allocations"
                            : "Manage your leave requests and view your leave balance"}
                    </p>
                </div>
                {!isAdmin && (
                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 w-full sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Request Leave
                    </Button>
                )}
            </div>

            {/* Messages */}
            {message && (
                <div className={cn(
                    "p-4 rounded-lg border flex items-center gap-3",
                    message.type === "success"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                )}>
                    {message.type === "success" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <p className={message.type === "success" ? "text-emerald-800" : "text-red-800"}>
                        {message.text}
                    </p>
                </div>
            )}

            {/* EMPLOYEE VIEW */}
            {!isAdmin ? (
                <>
                    {/* Leave Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {LEAVE_TYPES.map(leaveType => (
                            <div key={leaveType.value} className="bg-white rounded-lg border border-slate-200 p-4">
                                <p className="text-sm text-slate-600 mb-2">{leaveType.label}</p>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <p className="text-2xl font-bold text-slate-800">
                                        {allocation[leaveType.value].total - allocation[leaveType.value].used}
                                    </p>
                                    <p className="text-sm text-slate-500">days</p>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {allocation[leaveType.value].used} of {allocation[leaveType.value].total} used
                                </p>
                                <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all"
                                        style={{
                                            width: allocation[leaveType.value].total > 0
                                                ? `${(allocation[leaveType.value].used / allocation[leaveType.value].total) * 100}%`
                                                : "0%"
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Employee Leave Requests Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-800">My Leave Requests</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Period</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Leave Type</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Days</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Reason</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaveRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                <CalendarDays className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                                <p>No leave requests yet. Click "Request Leave" to create one.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        leaveRequests.map(request => (
                                            <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-slate-400" />
                                                        <span>
                                                            {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                                        LEAVE_TYPES.find(lt => lt.value === request.leave_type)?.color || "bg-slate-100"
                                                    )}>
                                                        {LEAVE_TYPES.find(lt => lt.value === request.leave_type)?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {request.days_count} day{request.days_count !== 1 ? "s" : ""}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">
                                                    {request.reason || "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                                        STATUS_COLORS[request.status]
                                                    )}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {request.status === "pending" && (
                                                        <button
                                                            onClick={() => handleCancel(request.id)}
                                                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Request Leave Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-800">Request Leave</h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                                    >
                                        <X className="h-5 w-5 text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <Label htmlFor="leaveType" className="text-slate-700">
                                            Leave Type <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="leaveType"
                                            value={formData.leaveType}
                                            onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
                                            className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {LEAVE_TYPES.map(lt => (
                                                <option key={lt.value} value={lt.value}>{lt.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Available: {allocation[formData.leaveType as LeaveType].total - allocation[formData.leaveType as LeaveType].used} days
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="startDate" className="text-slate-700">
                                            Start Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="endDate" className="text-slate-700">
                                            End Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="reason" className="text-slate-700">
                                            Reason (Optional)
                                        </Label>
                                        <textarea
                                            id="reason"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            placeholder="Why are you taking leave?"
                                            rows={3}
                                            className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Submit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // ADMIN VIEW
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800">All Leave Requests</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Employee</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Period</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Leave Type</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Days</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Reason</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Status</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allEmployeeRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            <CalendarDays className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                                            <p>No leave requests from employees</p>
                                        </td>
                                    </tr>
                                ) : (
                                    allEmployeeRequests.map((request: any) => (
                                        <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {request.profile?.first_name} {request.profile?.last_name}
                                                <p className="text-xs text-slate-500">{request.profile?.employee_id}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                                    LEAVE_TYPES.find(lt => lt.value === request.leave_type)?.color || "bg-slate-100"
                                                )}>
                                                    {LEAVE_TYPES.find(lt => lt.value === request.leave_type)?.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {request.days_count} day{request.days_count !== 1 ? "s" : ""}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">
                                                {request.reason || "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                                    STATUS_COLORS[request.status]
                                                )}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {request.status === "pending" && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            disabled={processingRequestId === request.id}
                                                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                                                        >
                                                            {processingRequestId === request.id ? "..." : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={processingRequestId === request.id}
                                                            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                                        >
                                                            {processingRequestId === request.id ? "..." : "Reject"}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
