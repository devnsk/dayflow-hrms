// Database types for Supabase

// Only 2 roles: admin (includes HR permissions) and employee
export type UserRole = 'admin' | 'employee';
export type AttendanceStatus = 'present' | 'on_leave' | 'absent';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive';

// Company table type
export interface Company {
    id: string;
    name: string;
    code: string;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    created_at: string;
    updated_at: string;
}

// Profile table type (extends auth.users)
export interface Profile {
    id: string; // Same as auth.users id
    company_id: string | null;
    employee_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    designation: string | null;
    department: string | null;
    avatar_url: string | null;
    joining_date: string;
    status: EmployeeStatus;
    attendance_status: AttendanceStatus;

    // Private Information
    date_of_birth: string | null;
    mailing_address: string | null;
    nationality: string | null;
    personal_email: string | null;
    gender: string | null;
    marital_status: string | null;

    // Bank Details
    bank_name: string | null;
    account_number: string | null;
    bank_address: string | null;
    ifsc_code: string | null;
    pan_id: string | null;

    // Resume/About
    about: string | null;
    what_i_love: string | null;
    hobbies: string | null;
    skills: string[] | null;
    certifications: string[] | null;

    // Manager
    manager_id: string | null;
    location: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;

    // First login flag
    is_first_login: boolean;
}

// Salary Info table type
export interface SalaryInfo {
    id: string;
    profile_id: string;
    monthly_wage: number;
    yearly_wage: number;
    working_days_per_week: number;
    break_time_hours: number;
    pf_employer: number;
    pf_employee: number;
    professional_tax: number;
    created_at: string;
    updated_at: string;
}

// Salary Component table type
export interface SalaryComponent {
    id: string;
    salary_info_id: string;
    name: string;
    amount: number;
    unit: 'month' | 'year';
    percentage: number;
    created_at: string;
}

// Attendance table type
export interface Attendance {
    id: string;
    profile_id: string;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: AttendanceStatus;
    notes: string | null;
    created_at: string;
}

// Employee Serial Counter table type
export interface EmployeeSerialCounter {
    id: string;
    company_id: string;
    year: number;
    last_serial: number;
}

// Database schema type for Supabase client
export interface Database {
    public: {
        Tables: {
            companies: {
                Row: Company;
                Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Company, 'id' | 'created_at'>>;
            };
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
            };
            salary_info: {
                Row: SalaryInfo;
                Insert: Omit<SalaryInfo, 'id' | 'created_at' | 'updated_at'> & {
                    id?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Omit<SalaryInfo, 'id' | 'created_at'>>;
            };
            salary_components: {
                Row: SalaryComponent;
                Insert: Omit<SalaryComponent, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<SalaryComponent, 'id' | 'created_at'>>;
            };
            attendance: {
                Row: Attendance;
                Insert: Omit<Attendance, 'id' | 'created_at'> & {
                    id?: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Attendance, 'id' | 'created_at'>>;
            };
            employee_serial_counter: {
                Row: EmployeeSerialCounter;
                Insert: Omit<EmployeeSerialCounter, 'id'> & { id?: string };
                Update: Partial<Omit<EmployeeSerialCounter, 'id'>>;
            };
        };
    };
}

// Helper type for profile with company info
export interface ProfileWithCompany extends Profile {
    company?: Company | null;
}

// Helper type for creating a new employee
export interface CreateEmployeeInput {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    designation?: string;
    department?: string;
    joining_date?: string;
    role?: UserRole;
}

// Helper type for signup
export interface SignUpInput {
    company_name: string;
    admin_name: string;
    email: string;
    phone: string;
    password: string;
    logo?: File;
}
