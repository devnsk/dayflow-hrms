"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Generate a company code from company name (first 2 letters, uppercase)
 */
function generateCompanyCode(companyName: string): string {
    return companyName
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 2)
        .toUpperCase();
}

/**
 * Generate employee login ID
 * Format: {CompanyCode}{FirstTwo}{LastTwo}{Year}{Serial}
 * Example: OIJODO20220001
 */
function generateEmployeeId(
    companyCode: string,
    firstName: string,
    lastName: string,
    year: number,
    serial: number
): string {
    const firstCode = firstName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
    const lastCode = lastName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
    const serialPadded = serial.toString().padStart(4, '0');

    return `${companyCode}${firstCode}${lastCode}${year}${serialPadded}`;
}

/**
 * Sign up a new company with admin user
 */
export async function signUpCompany(formData: FormData) {
    const supabase = await createClient();

    const companyName = formData.get("companyName") as string;
    const adminName = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const logoFile = formData.get("logo") as File | null;

    // Validate inputs
    if (!companyName || !adminName || !email || !password) {
        return { error: "Missing required fields" };
    }

    // Split admin name into first and last name
    const nameParts = adminName.trim().split(" ");
    const firstName = nameParts[0] || adminName;
    const lastName = nameParts.slice(1).join(" ") || "";

    // Generate company code
    const companyCode = generateCompanyCode(companyName);

    try {
        // Step 1: Create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: adminName,
                    role: "admin",
                },
            },
        });

        if (authError) {
            console.error("Auth error:", authError);
            return { error: authError.message };
        }

        if (!authData.user) {
            return { error: "Failed to create user" };
        }

        const userId = authData.user.id;

        // Step 2: Upload logo if provided
        let logoUrl: string | null = null;
        if (logoFile && logoFile.size > 0) {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${companyCode.toLowerCase()}-${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('company-logos')
                .upload(fileName, logoFile);

            if (uploadError) {
                console.error("Logo upload error:", uploadError);
                // Continue without logo, don't fail the signup
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('company-logos')
                    .getPublicUrl(fileName);
                logoUrl = publicUrl;
            }
        }

        // Step 3: Create the company record
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: companyName,
                code: companyCode,
                logo_url: logoUrl,
                email: email,
                phone: phone,
            })
            .select()
            .single();

        if (companyError) {
            console.error("Company creation error:", companyError);
            // Try to clean up the auth user
            return { error: "Failed to create company: " + companyError.message };
        }

        // Step 4: Generate employee ID for admin
        const currentYear = new Date().getFullYear();
        const employeeId = generateEmployeeId(companyCode, firstName, lastName || "Admin", currentYear, 1);

        // Step 5: Create the profile record
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                company_id: companyData.id,
                employee_id: employeeId,
                first_name: firstName,
                last_name: lastName || "",
                email: email,
                phone: phone,
                role: 'admin',
                designation: 'Administrator',
                department: 'Management',
                joining_date: new Date().toISOString().split('T')[0],
                status: 'Active',
                attendance_status: 'absent',
                is_first_login: false, // Admin set their own password
            });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            return { error: "Failed to create profile: " + profileError.message };
        }

        // Step 6: Initialize the employee serial counter
        await supabase
            .from('employee_serial_counter')
            .insert({
                company_id: companyData.id,
                year: currentYear,
                last_serial: 1,
            });

        revalidatePath('/');

        return {
            success: true,
            employeeId,
            message: "Company registered successfully! Please check your email to verify your account."
        };

    } catch (error) {
        console.error("Signup error:", error);
        return { error: "An unexpected error occurred" };
    }
}

/**
 * Create a new employee (Admin/HR only)
 */
export async function createEmployee(formData: FormData) {
    const supabase = await createClient();

    // Get current user and verify they are admin/hr
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Get current user's profile to check role and company
    const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single();

    if (profileError || !currentProfile) {
        return { error: "Failed to get user profile" };
    }

    if (currentProfile.role !== 'admin' && currentProfile.role !== 'hr') {
        return { error: "Only Admin or HR can create employees" };
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const designation = formData.get("designation") as string;
    const department = formData.get("department") as string;
    const joiningDate = formData.get("joiningDate") as string;
    const role = (formData.get("role") as string) || 'employee';

    if (!firstName || !lastName || !email) {
        return { error: "First name, last name, and email are required" };
    }

    try {
        // Get company info
        const { data: company } = await supabase
            .from('companies')
            .select('code, name')
            .eq('id', currentProfile.company_id)
            .single();

        if (!company) {
            return { error: "Company not found" };
        }

        // Get next serial number
        const joiningYear = joiningDate ? new Date(joiningDate).getFullYear() : new Date().getFullYear();

        const { data: serialData, error: serialError } = await supabase
            .rpc('get_next_employee_serial', {
                p_company_id: currentProfile.company_id,
                p_year: joiningYear,
            });

        const serial = serialData || 1;

        // Generate employee ID
        const employeeId = generateEmployeeId(company.code, firstName, lastName, joiningYear, serial);

        // Generate temporary password
        const tempPassword = generateTempPassword();

        // Create auth user for this employee using Admin client
        const supabaseAdmin = createAdminClient();
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: `${firstName} ${lastName}`,
                role: role,
            },
        });

        if (authError) {
            console.error("Admin auth error:", authError);
            return { error: "Failed to create user authentication: " + authError.message };
        }

        if (!authData.user) {
            return { error: "Failed to create user" };
        }

        // Create profile using Admin client (bypassing RLS)
        // Use upsert in case a trigger already created a skeleton profile on auth.signup
        const { error: newProfileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                company_id: currentProfile.company_id,
                employee_id: employeeId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null,
                role: role as 'admin' | 'hr' | 'employee',
                designation: designation || null,
                department: department || null,
                joining_date: joiningDate || new Date().toISOString().split('T')[0],
                status: 'Active',
                attendance_status: 'absent',
                is_first_login: true, // Employee must change password on first login
                temporary_password: tempPassword, // Store for admin reference
            });

        if (newProfileError) {
            console.error("Profile creation error:", newProfileError);
            return { error: "Failed to create employee profile: " + newProfileError.message };
        }

        revalidatePath('/dashboard/employees');

        return {
            success: true,
            employeeId,
            tempPassword,
            message: `Employee created successfully! Login ID: ${employeeId}, Temporary Password: ${tempPassword}`,
        };

    } catch (error) {
        console.error("Create employee error:", error);
        return { error: "An unexpected error occurred" };
    }
}

/**
 * Update employee password (Admin only)
 */
export async function updateEmployeePassword(employeeId: string, newPassword: string) {
    const supabase = await createClient();

    // Get current user and verify they are admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Get current user's profile to check role
    const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single();

    if (profileError || !currentProfile) {
        return { error: "Failed to get user profile" };
    }

    if (currentProfile.role !== 'admin' && currentProfile.role !== 'hr') {
        return { error: "Only Admin or HR can update employee passwords" };
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
        return { error: "Password must be at least 8 characters long" };
    }

    try {
        // Get employee profile to verify they're in the same company
        const { data: employeeProfile, error: employeeError } = await supabase
            .from('profiles')
            .select('id, company_id, email')
            .eq('id', employeeId)
            .single();

        if (employeeError || !employeeProfile) {
            return { error: "Employee not found" };
        }

        if (employeeProfile.company_id !== currentProfile.company_id) {
            return { error: "Cannot update password for employee in different company" };
        }

        // Use admin client to update password
        const supabaseAdmin = createAdminClient();
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
            password: newPassword,
        });

        if (updateError) {
            console.error("Password update error:", updateError);
            return { error: "Failed to update password: " + updateError.message };
        }

        // Update temporary_password in profiles table
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ temporary_password: newPassword })
            .eq('id', employeeId);

        if (profileUpdateError) {
            console.error("Profile update error:", profileUpdateError);
            return { error: "Password updated but failed to store reference" };
        }

        revalidatePath('/dashboard/employees');

        return {
            success: true,
            message: `Password updated successfully for ${employeeProfile.email}`,
        };

    } catch (error) {
        console.error("Update password error:", error);
        return { error: "An unexpected error occurred" };
    }
}

/**
 * Update employee profile information (Admin/HR only)
 */
export async function updateEmployeeInfo(employeeId: string, formData: FormData) {
    const supabase = await createClient();

    // Get current user and verify they are admin/hr
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Get current user's profile to check role
    const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single();

    if (profileError || !currentProfile) {
        return { error: "Failed to get user profile" };
    }

    if (currentProfile.role !== 'admin' && currentProfile.role !== 'hr') {
        return { error: "Only Admin or HR can update employee information" };
    }

    // Get employee to verify they're in the same company
    const { data: employee, error: employeeError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('id', employeeId)
        .single();

    if (employeeError || !employee) {
        return { error: "Employee not found" };
    }

    if (employee.company_id !== currentProfile.company_id) {
        return { error: "Cannot update employee from different company" };
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const designation = formData.get("designation") as string;
    const department = formData.get("department") as string;
    const joiningDate = formData.get("joiningDate") as string;
    const role = formData.get("role") as string;
    const location = formData.get("location") as string;

    if (!firstName || !lastName || !email) {
        return { error: "First name, last name, and email are required" };
    }

    try {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null,
                designation: designation || null,
                department: department || null,
                joining_date: joiningDate || null,
                role: role as 'admin' | 'hr' | 'employee',
                location: location || null,
            })
            .eq('id', employeeId);

        if (updateError) {
            console.error("Profile update error:", updateError);
            return { error: "Failed to update employee: " + updateError.message };
        }

        revalidatePath('/dashboard/employees');
        revalidatePath(`/dashboard/employees/${employeeId}`);

        return {
            success: true,
            message: "Employee information updated successfully",
        };

    } catch (error) {
        console.error("Update employee error:", error);
        return { error: "An unexpected error occurred" };
    }
}

// ... existing helper functions (generateTempPassword, getCurrentProfile, checkIn, checkOut, signOut) unchanged below here ...
// but since I'm overwriting, I need to include them.

/**
 * Generate a temporary password
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated", profile: null };
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            *,
            company:companies(*)
        `)
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Get profile error:", error);
        return { error: error.message, profile: null };
    }

    return { profile, error: null };
}

/**
 * Check in for attendance
 */
export async function checkIn() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already checked in today
    const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('profile_id', user.id)
        .eq('date', today)
        .single();

    if (existingAttendance?.check_in_time) {
        return { error: "Already checked in today" };
    }

    // Create or update attendance record
    const { error } = await supabase
        .from('attendance')
        .upsert({
            profile_id: user.id,
            date: today,
            check_in_time: now,
            status: 'present',
        }, {
            onConflict: 'profile_id,date'
        });

    if (error) {
        console.error("Check in error:", error);
        return { error: "Failed to check in" };
    }

    // Update profile attendance status
    await supabase
        .from('profiles')
        .update({ attendance_status: 'present' })
        .eq('id', user.id);

    revalidatePath('/dashboard');

    return { success: true, checkInTime: now };
}

/**
 * Check out for attendance
 */
export async function checkOut() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Get today's attendance
    const { data: attendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('profile_id', user.id)
        .eq('date', today)
        .single();

    if (fetchError || !attendance) {
        return { error: "No check-in found for today" };
    }

    if (!attendance.check_in_time) {
        return { error: "Please check in first" };
    }

    if (attendance.check_out_time) {
        return { error: "Already checked out today" };
    }

    // Update with check out time
    const { error } = await supabase
        .from('attendance')
        .update({ check_out_time: now })
        .eq('id', attendance.id);

    if (error) {
        console.error("Check out error:", error);
        return { error: "Failed to check out" };
    }

    revalidatePath('/dashboard');

    return { success: true, checkOutTime: now };
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
}
