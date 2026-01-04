"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Check-in employee
 */
export async function checkIn() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated", success: false };
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const checkInTime = new Date().toISOString();

        // Check if employee is on approved leave today
        const { data: leaveToday } = await supabase
            .from("leave_request")
            .select("id, leave_type")
            .eq("profile_id", user.id)
            .eq("status", "approved")
            .lte("start_date", today)
            .gte("end_date", today)
            .limit(1);

        if (leaveToday && leaveToday.length > 0) {
            return {
                error: "You are on approved leave today. Check-in is not available.",
                success: false,
                onLeave: true
            };
        }

        // Check if attendance record for today exists
        const { data: existingAttendance, error: selectError } = await supabase
            .from("attendance")
            .select("id")
            .eq("profile_id", user.id)
            .eq("date", today)
            .single();

        if (existingAttendance?.id) {
            // Update check-in time
            const { error } = await supabase
                .from("attendance")
                .update({
                    check_in_time: checkInTime,
                    status: "present"
                })
                .eq("id", existingAttendance.id);

            if (error) {
                console.error("Check-in update error:", error);
                return { error: error.message, success: false };
            }
        } else {
            // Create new attendance record
            const { error } = await supabase
                .from("attendance")
                .insert({
                    profile_id: user.id,
                    date: today,
                    check_in_time: checkInTime,
                    status: "present"
                });

            if (error) {
                console.error("Check-in insert error:", error);
                return { error: error.message, success: false };
            }
        }

        revalidatePath('/dashboard');

        return { success: true, checkInTime };
    } catch (err) {
        console.error("Check-in exception:", err);
        return { error: err instanceof Error ? err.message : "Check-in failed", success: false };
    }
}

/**
 * Check-out employee
 */
export async function checkOut() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated", success: false };
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const checkOutTime = new Date().toISOString();

        // Get today's attendance record
        const { data: attendance, error: selectError } = await supabase
            .from("attendance")
            .select("id")
            .eq("profile_id", user.id)
            .eq("date", today)
            .single();

        if (!attendance?.id) {
            return { error: "No check-in record found for today", success: false };
        }

        // Update check-out time
        const { error } = await supabase
            .from("attendance")
            .update({
                check_out_time: checkOutTime
            })
            .eq("id", attendance.id);

        if (error) {
            console.error("Check-out update error:", error);
            return { error: error.message, success: false };
        }

        revalidatePath('/dashboard');

        return { success: true, checkOutTime };
    } catch (err) {
        console.error("Check-out exception:", err);
        return { error: err instanceof Error ? err.message : "Check-out failed", success: false };
    }
}

/**
 * Get today's attendance for current user
 */
export async function getTodayAttendance() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated", attendance: null, onLeave: false };
    }

    try {
        const today = new Date().toISOString().split('T')[0];

        // Check if on approved leave today
        const { data: leaveToday } = await supabase
            .from("leave_request")
            .select("id, leave_type, start_date, end_date")
            .eq("profile_id", user.id)
            .eq("status", "approved")
            .lte("start_date", today)
            .gte("end_date", today)
            .limit(1);

        const isOnLeave = leaveToday && leaveToday.length > 0;
        const leaveInfo = isOnLeave ? leaveToday[0] : null;

        const { data: attendance, error } = await supabase
            .from("attendance")
            .select("*")
            .eq("profile_id", user.id)
            .eq("date", today)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Fetch error:", error);
            return { error: error.message, attendance: null, onLeave: isOnLeave, leaveInfo };
        }

        return { success: true, attendance, onLeave: isOnLeave, leaveInfo };
    } catch (err) {
        console.error("Exception:", err);
        return { error: err instanceof Error ? err.message : "Failed to fetch attendance", attendance: null, onLeave: false };
    }
}

/**
 * Get all employees attendance for a specific date (Admin only)
 */
export async function getAttendanceByDate(date: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated", attendances: null };
    }

    try {
        // Verify user is admin/hr
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, company_id")
            .eq("id", user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) {
            return { error: "Unauthorized", attendances: null };
        }

        // Get all employees in the company
        const { data: attendances, error } = await supabase
            .from("attendance")
            .select(`
                id,
                date,
                check_in_time,
                check_out_time,
                status,
                profiles:profile_id (
                    id,
                    first_name,
                    last_name,
                    employee_id,
                    designation,
                    department
                )
            `)
            .eq("date", date)
            .eq("profiles.company_id", profile.company_id)
            .order("check_in_time", { ascending: false });

        if (error) {
            console.error("Fetch error:", error);
            return { error: error.message, attendances: null };
        }

        return { success: true, attendances };
    } catch (err) {
        console.error("Exception:", err);
        return { error: err instanceof Error ? err.message : "Failed to fetch attendances", attendances: null };
    }
}

/**
 * Get attendance records for date range (Admin only)
 */
export async function getAttendanceRange(startDate: string, endDate: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated", attendances: null };
    }

    try {
        // Verify user is admin/hr
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, company_id")
            .eq("id", user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) {
            return { error: "Unauthorized", attendances: null };
        }

        // Get attendance records within date range for company employees
        const { data: attendances, error } = await supabase
            .from("attendance")
            .select(`
                id,
                date,
                check_in_time,
                check_out_time,
                status,
                profiles:profile_id (
                    id,
                    first_name,
                    last_name,
                    employee_id,
                    designation,
                    department
                )
            `)
            .gte("date", startDate)
            .lte("date", endDate)
            .eq("profiles.company_id", profile.company_id)
            .order("date", { ascending: false });

        if (error) {
            console.error("Fetch error:", error);
            return { error: error.message, attendances: null };
        }

        return { success: true, attendances };
    } catch (err) {
        console.error("Exception:", err);
        return { error: err instanceof Error ? err.message : "Failed to fetch attendances", attendances: null };
    }
}
