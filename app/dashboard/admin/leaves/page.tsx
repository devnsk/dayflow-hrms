"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Check,
    X,
    Search,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronDown,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type LeaveType = "paid_leave" | "sick_leave" | "unpaid_leave" | "casual_leave";
type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    paid_leave: "Paid Leave",
    sick_leave: "Sick Leave",
    unpaid_leave: "Unpaid Leave",
    casual_leave: "Casual Leave"
};

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
    paid_leave: "bg-blue-50 text-blue-700 border-blue-200",
    sick_leave: "bg-red-50 text-red-700 border-red-200",
    unpaid_leave: "bg-amber-50 text-amber-700 border-amber-200",
    casual_leave: "bg-green-50 text-green-700 border-green-200"
};

const STATUS_COLORS: Record<RequestStatus, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-slate-50 text-slate-700 border-slate-200"
};

interface EmployeeProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    designation: string | null;
    department: string | null;
}

interface LeaveRequestWithEmployee {
    id: string;
    profile_id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    reason: string | null;
    status: RequestStatus;
    days_count: number;
    created_at: string;
    employee: EmployeeProfile;
}

export default function AdminLeavesPage() {
    const router = useRouter();
    const { user, isLoading: userLoading, canManageEmployees } = useUser();

    const [requests, setRequests] = useState<LeaveRequestWithEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | RequestStatus>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const supabase = createClient();

    // Redirect if not authorized
    useEffect(() => {
        if (!userLoading && !canManageEmployees) {
            router.push("/dashboard");
        }
    }, [userLoading, canManageEmployees, router]);

    // Fetch leave requests
    useEffect(() => {
        const fetchRequests = async () => {
            if (!user?.company_id) return;
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("leave_request")
                    .select(`
                        id,
                        profile_id,
                        leave_type,
                        start_date,
                        end_date,
                        reason,
                        status,
                        days_count,
                        created_at,
                        profiles:profile_id(
                            id,
                            first_name,
                            last_name,
                            email,
                            avatar_url,
                            designation,
                            department
                        )
                    `)
                    .eq("profiles.company_id", user.company_id)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const formattedData = (data || []).map((req: any) => ({
                    ...req,
                    employee: req.profiles
                }));

                setRequests(formattedData);
            } catch (error) {
                console.error("Error fetching leave requests:", error);
                setMessage({ type: "error", text: "Failed to load leave requests" });
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading && user) {
            fetchRequests();
        }
    }, [user, userLoading, supabase]);

    const handleApprove = async (requestId: string) => {
        setActionLoading(requestId);
        setMessage(null);

        try {
            // Get the current user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                setMessage({ type: "error", text: "Not authenticated" });
                return;
            }

            // Find the request in our local state
            const request = requests.find(r => r.id === requestId);
            if (!request) {
                setMessage({ type: "error", text: "Leave request not found" });
                return;
            }

            // Update request status to approved
            const { error: updateError } = await supabase
                .from("leave_request")
                .update({
                    status: "approved",
                    approved_by: currentUser.id,
                    approved_date: new Date().toISOString()
                })
                .eq("id", requestId);

            if (updateError) throw updateError;

            // Update leave allocation (increment used_days) - skip for unpaid leave
            if (request.leave_type !== 'unpaid_leave') {
                const { data: currentAlloc, error: allocFetchError } = await supabase
                    .from('leave_allocation')
                    .select('used_days')
                    .eq('profile_id', request.profile_id)
                    .eq('leave_type', request.leave_type)
                    .single();

                if (!allocFetchError && currentAlloc) {
                    const { error: allocUpdateError } = await supabase
                        .from('leave_allocation')
                        .update({ used_days: currentAlloc.used_days + request.days_count })
                        .eq('profile_id', request.profile_id)
                        .eq('leave_type', request.leave_type);

                    if (allocUpdateError) {
                        console.error("Error updating leave allocation:", allocUpdateError);
                        // Don't fail the entire operation if allocation update fails
                    }
                }
            }

            setMessage({ type: "success", text: "Leave request approved successfully!" });

            // Update local state
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status: "approved" } : req
            ));
        } catch (error) {
            console.error("Error approving request:", error);
            setMessage({ type: "error", text: "Failed to approve request" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoading(requestId);
        setMessage(null);

        try {
            // Get the current user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                setMessage({ type: "error", text: "Not authenticated" });
                return;
            }

            // Update request status to rejected
            const { error: updateError } = await supabase
                .from("leave_request")
                .update({
                    status: "rejected",
                    approved_by: currentUser.id,
                    approved_date: new Date().toISOString()
                })
                .eq("id", requestId);

            if (updateError) throw updateError;

            setMessage({ type: "success", text: "Leave request rejected successfully!" });

            // Update local state
            setRequests(requests.map(req =>
                req.id === requestId ? { ...req, status: "rejected" } : req
            ));
        } catch (error) {
            console.error("Error rejecting request:", error);
            setMessage({ type: "error", text: "Failed to reject request" });
        } finally {
            setActionLoading(null);
        }
    };

    // Filter requests
    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            req.employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.employee.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            filterStatus === "all" || req.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (userLoading) {
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
                <p className="text-slate-600">Only admins and HR can manage leave requests</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-10 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Leave Requests</h1>
                <p className="text-slate-600 mt-1">Manage and approve employee leave requests</p>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={cn(
                        "p-4 rounded-lg border flex items-center gap-3",
                        message.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-red-50 border-red-200 text-red-700"
                    )}
                >
                    {message.type === "success" ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <AlertCircle className="h-5 w-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by employee name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-600" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <p className="text-slate-600">Total</p>
                        <p className="text-2xl font-bold text-slate-800">{requests.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {requests.filter(r => r.status === "pending").length}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-600">Approved</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {requests.filter(r => r.status === "approved").length}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-600">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">
                            {requests.filter(r => r.status === "rejected").length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">No leave requests found</p>
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Request Card Header */}
                            <button
                                onClick={() =>
                                    setExpandedId(expandedId === request.id ? null : request.id)
                                }
                                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 text-left">
                                    {/* Employee Avatar */}
                                    <Avatar className="h-12 w-12 border-2 border-slate-200">
                                        <AvatarImage src={request.employee.avatar_url || ""} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold">
                                            {request.employee.first_name[0]}{request.employee.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Employee Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-semibold text-slate-800">
                                                {request.employee.first_name} {request.employee.last_name}
                                            </h3>
                                            <span
                                                className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                                    LEAVE_TYPE_COLORS[request.leave_type]
                                                )}
                                            >
                                                {LEAVE_TYPE_LABELS[request.leave_type]}
                                            </span>
                                            <span
                                                className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                                    STATUS_COLORS[request.status]
                                                )}
                                            >
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {request.employee.email}
                                        </p>
                                    </div>

                                    {/* Dates and Days */}
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-800">
                                            {request.days_count} day{request.days_count !== 1 ? "s" : ""}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(request.start_date).toLocaleDateString("en-GB")} -{" "}
                                            {new Date(request.end_date).toLocaleDateString("en-GB")}
                                        </p>
                                    </div>
                                </div>

                                {/* Expand Icon */}
                                <ChevronDown
                                    className={cn(
                                        "h-5 w-5 text-slate-400 transition-transform ml-4",
                                        expandedId === request.id && "rotate-180"
                                    )}
                                />
                            </button>

                            {/* Expanded Details */}
                            {expandedId === request.id && (
                                <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-4">
                                    {/* Reason */}
                                    {request.reason && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                                Reason
                                            </h4>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                {request.reason}
                                            </p>
                                        </div>
                                    )}

                                    {/* Employee Details */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                            Employee Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Designation</p>
                                                <p className="text-slate-800 font-medium">
                                                    {request.employee.designation || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Department</p>
                                                <p className="text-slate-800 font-medium">
                                                    {request.employee.department || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Date */}
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Request submitted on{" "}
                                            {new Date(request.created_at).toLocaleDateString("en-GB")}{" "}
                                            at{" "}
                                            {new Date(request.created_at).toLocaleTimeString("en-GB", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    {request.status === "pending" && (
                                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                                            <Button
                                                onClick={() => handleApprove(request.id)}
                                                disabled={actionLoading === request.id}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                            >
                                                {actionLoading === request.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(request.id)}
                                                disabled={actionLoading === request.id}
                                                variant="outline"
                                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 gap-2"
                                            >
                                                {actionLoading === request.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
