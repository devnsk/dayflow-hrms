"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update user profile field
 */
export async function updateProfileField(
    field: string,
    value: any
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

    if (error) {
        console.error("Update error:", error);
        return { error: error.message };
    }

    revalidatePath('/dashboard/profile');

    return { success: true };
}

/**
 * Update salary info
 */
export async function updateSalaryInfo(
    salaryData: {
        monthly_wage?: number;
        yearly_wage?: number;
        working_days_per_week?: number;
        break_time_hours?: number;
        pf_employer?: number;
        pf_employee?: number;
        professional_tax?: number;
        basic_salary?: number;
        basic_salary_percentage?: number;
        hra?: number;
        hra_percentage?: number;
        dearness_allowance?: number;
        dearness_allowance_percentage?: number;
        standard_allowance?: number;
        standard_allowance_percentage?: number;
    }
) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: "Not authenticated", success: false };
        }

        // Check if user is admin or HR
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            console.error("Profile fetch error:", profileError);
            return { error: "Could not verify user role", success: false };
        }

        if (profile.role !== 'admin' && profile.role !== 'hr') {
            return { error: "Only admin or HR can update salary info", success: false };
        }

        // Check if salary_info exists, if not create it
        const { data: existingSalary, error: selectError } = await supabase
            .from("salary_info")
            .select("id")
            .eq("profile_id", user.id)
            .single();

        console.log("Existing salary:", existingSalary, "Error:", selectError);

        if (existingSalary?.id) {
            // Update existing
            const { error, data } = await supabase
                .from("salary_info")
                .update(salaryData)
                .eq("profile_id", user.id)
                .select();

            if (error) {
                console.error("Update error:", error);
                return { error: error.message, success: false };
            }
            console.log("Updated salary data:", data);
        } else {
            // Create new
            const { error, data } = await supabase
                .from("salary_info")
                .insert({
                    profile_id: user.id,
                    ...salaryData
                })
                .select();

            if (error) {
                console.error("Insert error:", error);
                return { error: error.message, success: false };
            }
            console.log("Created salary data:", data);
        }

        revalidatePath('/dashboard/profile');

        return { success: true };
    } catch (err) {
        console.error("Exception in updateSalaryInfo:", err);
        return { error: err instanceof Error ? err.message : "Unknown error", success: false };
    }
}

/**
 * Add skill to profile
 */
export async function addSkill(skill: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Get current skills
    const { data: profile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return { error: "Profile not found" };
    }

    const currentSkills = profile.skills || [];

    // Add skill if not already present
    if (!currentSkills.includes(skill)) {
        currentSkills.push(skill);
    }

    const { error } = await supabase
        .from("profiles")
        .update({ skills: currentSkills })
        .eq("id", user.id);

    if (error) {
        console.error("Update error:", error);
        return { error: error.message };
    }

    revalidatePath('/dashboard/profile');

    return { success: true };
}

/**
 * Remove skill from profile
 */
export async function removeSkill(skill: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Get current skills
    const { data: profile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return { error: "Profile not found" };
    }

    const currentSkills = (profile.skills || []).filter((s: string) => s !== skill);

    const { error } = await supabase
        .from("profiles")
        .update({ skills: currentSkills })
        .eq("id", user.id);

    if (error) {
        console.error("Update error:", error);
        return { error: error.message };
    }

    revalidatePath('/dashboard/profile');

    return { success: true };
}
