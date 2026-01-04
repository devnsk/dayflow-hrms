"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type LeaveType = "paid_leave" | "sick_leave" | "unpaid_leave" | "casual_leave";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    paid_leave: "Paid Leave",
    sick_leave: "Sick Leave",
    unpaid_leave: "Unpaid Leave",
    casual_leave: "Casual Leave"
};

/**
 * Get leave allocation for current user
 */
export async function getLeaveAllocation() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated", allocation: null };
    }

    try {
        const { data, error } = await supabase
            .from('leave_allocation')
            .select('*')
            .eq('profile_id', user.id);

        if (error) throw error;

        return { success: true, allocation: data || [] };
    } catch (error) {
        console.error("Error fetching leave allocation:", error);
        return { error: "Failed to fetch leave allocation", allocation: null };
    }
}

/**
 * Get employee's leave requests
 */
export async function getLeaveRequests() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated", requests: null };
    }

    try {
        const { data, error } = await supabase
            .from('leave_request')
            .select('*')
            .eq('profile_id', user.id)
            .order('start_date', { ascending: false });

        if (error) throw error;

        return { success: true, requests: data || [] };
    } catch (error) {
        console.error("Error fetching leave requests:", error);
        return { error: "Failed to fetch leave requests", requests: null };
    }
}

/**
 * Create a new leave request
 */
export async function createLeaveRequest(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    const leaveType = formData.get("leaveType") as LeaveType;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;

    if (!leaveType || !startDate || !endDate) {
        return { error: "Missing required fields" };
    }

    try {
        // Calculate days count
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (daysCount <= 0) {
            return { error: "End date must be after start date" };
        }

        // Get current allocation to check if enough days available
        const { data: allocation, error: allocError } = await supabase
            .from('leave_allocation')
            .select('*')
            .eq('profile_id', user.id)
            .eq('leave_type', leaveType)
            .single();

        if (!allocation && leaveType !== 'unpaid_leave') {
            return { error: `No ${LEAVE_TYPE_LABELS[leaveType]} allocation found` };
        }

        const availableDays = allocation ? (allocation.total_days - allocation.used_days) : 999;

        if (leaveType !== 'unpaid_leave' && daysCount > availableDays) {
            return { error: `Not enough ${LEAVE_TYPE_LABELS[leaveType]} available. You have ${availableDays} days left.` };
        }

        // Create leave request
        const { data: request, error: createError } = await supabase
            .from('leave_request')
            .insert({
                profile_id: user.id,
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason || null,
                days_count: daysCount,
                status: 'pending'
            })
            .select()
            .single();

        if (createError) throw createError;

        revalidatePath('/dashboard/leaves');

        return {
            success: true,
            request,
            message: `Leave request submitted successfully for ${daysCount} day(s)`
        };

    } catch (error) {
        console.error("Error creating leave request:", error);
        return { error: "Failed to create leave request" };
    }
}

/**
 * Cancel a leave request (only if pending)
 */
export async function cancelLeaveRequest(requestId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    try {
        // Check if request belongs to user and is pending
        const { data: request, error: fetchError } = await supabase
            .from('leave_request')
            .select('*')
            .eq('id', requestId)
            .eq('profile_id', user.id)
            .single();

        if (fetchError || !request) {
            return { error: "Leave request not found" };
        }

        if (request.status !== 'pending') {
            return { error: "Only pending requests can be cancelled" };
        }

        // Update request to cancelled
        const { error: updateError } = await supabase
            .from('leave_request')
            .update({ status: 'cancelled' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        revalidatePath('/dashboard/leaves');

        return { success: true, message: "Leave request cancelled" };

    } catch (error) {
        console.error("Error cancelling leave request:", error);
        return { error: "Failed to cancel leave request" };
    }
}

/**
 * Get available days count for a specific leave type
 */
export async function getAvailableDays(leaveType: LeaveType) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated", availableDays: 0 };
    }

    try {
        const { data: allocation, error } = await supabase
            .from('leave_allocation')
            .select('total_days, used_days')
            .eq('profile_id', user.id)
            .eq('leave_type', leaveType)
            .single();

        if (error || !allocation) {
            // If no allocation, return 0 available days (except unpaid leave)
            return {
                success: true,
                availableDays: leaveType === 'unpaid_leave' ? 999 : 0,
                totalDays: 0,
                usedDays: 0
            };
        }

        const availableDays = allocation.total_days - allocation.used_days;

        return {
            success: true,
            availableDays,
            totalDays: allocation.total_days,
            usedDays: allocation.used_days
        };

    } catch (error) {
        console.error("Error fetching available days:", error);
        return { error: "Failed to fetch available days", availableDays: 0 };
    }
}

/**
 * Approve a leave request (Admin only)
 */
export async function approveLeaveRequest(requestId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    try {
        // Check if current user is admin
        const { data: adminProfile, error: adminError } = await supabase
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single();

        console.log("Admin profile:", adminProfile, "Error:", adminError);

        if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'hr')) {
            return { error: "Only admins can approve leave requests" };
        }

        // Get the leave request - simpler query
        const { data: request, error: fetchError } = await supabase
            .from('leave_request')
            .select('*')
            .eq('id', requestId)
            .single();

        console.log("Leave request:", request, "Error:", fetchError);

        if (fetchError) {
            console.error("Fetch error:", fetchError);
            return { error: `Leave request not found: ${fetchError.message}` };
        }

        if (!request) {
            return { error: "Leave request not found" };
        }

        // Get the employee's company to verify same company
        const { data: employeeProfile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', request.profile_id)
            .single();

        // Check if employee is in same company
        if (employeeProfile?.company_id !== adminProfile.company_id) {
            return { error: "Cannot approve requests for employees in different company" };
        }

        if (request.status !== 'pending') {
            return { error: "Only pending requests can be approved" };
        }

        // Update request status
        const { error: updateError } = await supabase
            .from('leave_request')
            .update({
                status: 'approved',
                approved_by: user.id,
                approved_date: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Update leave allocation (increment used_days) - skip for unpaid leave
        if (request.leave_type !== 'unpaid_leave') {
            const currentYear = new Date().getFullYear();

            console.log("Updating leave allocation for:", {
                profile_id: request.profile_id,
                leave_type: request.leave_type,
                days_count: request.days_count,
                year: currentYear
            });

            const { data: currentAlloc, error: allocFetchError } = await supabase
                .from('leave_allocation')
                .select('id, used_days, total_days')
                .eq('profile_id', request.profile_id)
                .eq('leave_type', request.leave_type)
                .eq('year', currentYear)
                .single();

            console.log("Current allocation:", currentAlloc, "Fetch error:", allocFetchError);

            if (allocFetchError) {
                console.error("Error fetching leave allocation:", allocFetchError);
                // If no allocation found, try to create one
                if (allocFetchError.code === 'PGRST116') {
                    console.log("No allocation found, creating one...");
                    const defaultDays = request.leave_type === 'paid_leave' ? 20 :
                        request.leave_type === 'sick_leave' ? 12 :
                            request.leave_type === 'casual_leave' ? 10 : 0;

                    const { error: insertError } = await supabase
                        .from('leave_allocation')
                        .insert({
                            profile_id: request.profile_id,
                            leave_type: request.leave_type,
                            total_days: defaultDays,
                            used_days: request.days_count,
                            year: currentYear
                        });

                    if (insertError) {
                        console.error("Error creating leave allocation:", insertError);
                    } else {
                        console.log("Created new allocation with used_days:", request.days_count);
                    }
                }
            } else if (currentAlloc) {
                const newUsedDays = currentAlloc.used_days + request.days_count;
                console.log("Updating used_days from", currentAlloc.used_days, "to", newUsedDays);

                const { error: allocUpdateError } = await supabase
                    .from('leave_allocation')
                    .update({
                        used_days: newUsedDays,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentAlloc.id);

                if (allocUpdateError) {
                    console.error("Error updating leave allocation:", allocUpdateError);
                } else {
                    console.log("Successfully updated leave allocation");
                }
            }
        }

        // Create attendance records with 'on_leave' status for all leave dates
        const startDate = new Date(request.start_date);
        const endDate = new Date(request.end_date);
        const attendanceRecords = [];

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            attendanceRecords.push({
                profile_id: request.profile_id,
                date: dateStr,
                status: 'on_leave',
                check_in_time: null,
                check_out_time: null
            });
        }

        // Insert or update attendance records for leave days
        for (const record of attendanceRecords) {
            // Check if attendance record already exists for this date
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('id')
                .eq('profile_id', record.profile_id)
                .eq('date', record.date)
                .single();

            if (existingAttendance?.id) {
                // Update existing record to on_leave
                await supabase
                    .from('attendance')
                    .update({ status: 'on_leave' })
                    .eq('id', existingAttendance.id);
            } else {
                // Create new on_leave attendance record
                await supabase
                    .from('attendance')
                    .insert(record);
            }
        }

        console.log("Created/updated attendance records for leave period:", attendanceRecords.length, "days");

        // Update employee's attendance_status to on_leave if leave includes today
        const today = new Date().toISOString().split('T')[0];
        if (request.start_date <= today && request.end_date >= today) {
            await supabase
                .from('profiles')
                .update({ attendance_status: 'on_leave' })
                .eq('id', request.profile_id);
            console.log("Updated profile attendance_status to on_leave");
        }

        revalidatePath('/dashboard/admin/leaves');
        revalidatePath('/dashboard/leaves');
        revalidatePath('/dashboard/employees');

        return { success: true, message: "Leave request approved" };

    } catch (error) {
        console.error("Error approving leave request:", error);
        return { error: "Failed to approve leave request" };
    }
}

/**
 * Reject a leave request (Admin only)
 */
export async function rejectLeaveRequest(requestId: string, reason?: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    try {
        // Check if current user is admin
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single();

        if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'hr')) {
            return { error: "Only admins can reject leave requests" };
        }

        // Get the leave request
        const { data: request, error: fetchError } = await supabase
            .from('leave_request')
            .select('*, profile:profiles(company_id)')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            return { error: "Leave request not found" };
        }

        // Check if employee is in same company
        if (request.profile?.company_id !== adminProfile.company_id) {
            return { error: "Cannot reject requests for employees in different company" };
        }

        if (request.status !== 'pending') {
            return { error: "Only pending requests can be rejected" };
        }

        // Update request status
        const { error: updateError } = await supabase
            .from('leave_request')
            .update({
                status: 'rejected',
                approved_by: user.id,
                approved_date: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        revalidatePath('/dashboard/admin/leaves');
        revalidatePath('/dashboard/leaves');

        return { success: true, message: "Leave request rejected" };

    } catch (error) {
        console.error("Error rejecting leave request:", error);
        return { error: "Failed to reject leave request" };
    }
}
