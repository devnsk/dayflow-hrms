// Employee data - In production, this would come from your Supabase database

export type AttendanceStatus = "present" | "on_leave" | "absent";

export interface Employee {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    joiningDate: string;
    status: "Active" | "On Leave" | "Inactive";
    attendanceStatus: AttendanceStatus;
    avatar?: string;
    salary?: number;
    address?: string;
    emergencyContact?: string;
    manager?: string;
    company?: string;
    location?: string;
    // Private info
    dateOfBirth?: string;
    mailingAddress?: string;
    nationality?: string;
    personalEmail?: string;
    gender?: string;
    maritalStatus?: string;
    // Bank details
    bankName?: string;
    accountNumber?: string;
    bankAddress?: string;
    ifscCode?: string;
    panId?: string;
    // Resume/About
    about?: string;
    whatILove?: string;
    hobbies?: string;
    skills?: string[];
    certifications?: string[];
}

export interface SalaryInfo {
    monthlyWage: number;
    yearlyWage: number;
    workingDaysPerWeek: number;
    breakTimeHours: number;
    components: SalaryComponent[];
    pfContribution: {
        employer: number;
        employee: number;
    };
    taxDeductions: {
        professionalTax: number;
    };
}

export interface SalaryComponent {
    name: string;
    amount: number;
    unit: "month" | "year";
    percentage: number;
}

export const mockEmployees: Employee[] = [
    {
        id: "1",
        employeeId: "EMP001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@company.com",
        phone: "+91 98765 43210",
        department: "Engineering",
        designation: "Senior Software Engineer",
        joiningDate: "2022-03-15",
        status: "Active",
        attendanceStatus: "present",
        salary: 120000,
        address: "123 Tech Park, Bangalore",
        manager: "Sarah Wilson",
        company: "Dayflow Inc.",
        location: "Bangalore",
        dateOfBirth: "1990-05-15",
        nationality: "Indian",
        gender: "Male",
        maritalStatus: "Married",
        skills: ["React", "TypeScript", "Node.js"],
        certifications: ["AWS Certified Developer"],
    },
    {
        id: "2",
        employeeId: "EMP002",
        firstName: "Sarah",
        lastName: "Smith",
        email: "sarah.smith@company.com",
        phone: "+91 98765 43211",
        department: "Design",
        designation: "UI/UX Lead",
        joiningDate: "2021-07-20",
        status: "Active",
        attendanceStatus: "present",
        salary: 95000,
        address: "456 Creative Hub, Mumbai",
        manager: "Mike Johnson",
        company: "Dayflow Inc.",
        location: "Mumbai",
        dateOfBirth: "1992-08-22",
        nationality: "Indian",
        gender: "Female",
        maritalStatus: "Single",
        skills: ["Figma", "Sketch", "Adobe XD"],
    },
    {
        id: "3",
        employeeId: "EMP003",
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@company.com",
        phone: "+91 98765 43212",
        department: "Engineering",
        designation: "Engineering Manager",
        joiningDate: "2020-01-10",
        status: "Active",
        attendanceStatus: "present",
        salary: 150000,
        address: "789 Innovation Center, Delhi",
        company: "Dayflow Inc.",
        location: "Delhi",
        dateOfBirth: "1985-03-10",
        nationality: "Indian",
        gender: "Male",
        maritalStatus: "Married",
        skills: ["Leadership", "Agile", "System Design"],
    },
    {
        id: "4",
        employeeId: "EMP004",
        firstName: "Emily",
        lastName: "Brown",
        email: "emily.brown@company.com",
        phone: "+91 98765 43213",
        department: "HR",
        designation: "HR Manager",
        joiningDate: "2021-11-05",
        status: "On Leave",
        attendanceStatus: "on_leave",
        salary: 85000,
        address: "321 Business Park, Pune",
        manager: "David Lee",
        company: "Dayflow Inc.",
        location: "Pune",
        dateOfBirth: "1991-12-03",
        nationality: "Indian",
        gender: "Female",
        maritalStatus: "Married",
    },
    {
        id: "5",
        employeeId: "EMP005",
        firstName: "David",
        lastName: "Lee",
        email: "david.lee@company.com",
        phone: "+91 98765 43214",
        department: "Operations",
        designation: "COO",
        joiningDate: "2019-06-15",
        status: "Active",
        attendanceStatus: "present",
        salary: 200000,
        address: "555 Executive Tower, Bangalore",
        company: "Dayflow Inc.",
        location: "Bangalore",
        dateOfBirth: "1980-07-25",
        nationality: "Indian",
        gender: "Male",
        maritalStatus: "Married",
    },
    {
        id: "6",
        employeeId: "EMP006",
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya.sharma@company.com",
        phone: "+91 98765 43215",
        department: "Marketing",
        designation: "Marketing Specialist",
        joiningDate: "2023-02-28",
        status: "Active",
        attendanceStatus: "absent",
        salary: 65000,
        address: "888 Media Hub, Mumbai",
        manager: "Emily Brown",
        company: "Dayflow Inc.",
        location: "Mumbai",
        dateOfBirth: "1995-09-18",
        nationality: "Indian",
        gender: "Female",
        maritalStatus: "Single",
    },
    {
        id: "7",
        employeeId: "EMP007",
        firstName: "Rahul",
        lastName: "Verma",
        email: "rahul.verma@company.com",
        phone: "+91 98765 43216",
        department: "Engineering",
        designation: "Frontend Developer",
        joiningDate: "2023-08-01",
        status: "Active",
        attendanceStatus: "present",
        salary: 75000,
        address: "999 Tech Zone, Hyderabad",
        manager: "John Doe",
        company: "Dayflow Inc.",
        location: "Hyderabad",
        dateOfBirth: "1996-04-12",
        nationality: "Indian",
        gender: "Male",
        maritalStatus: "Single",
        skills: ["React", "JavaScript", "CSS"],
    },
    {
        id: "8",
        employeeId: "EMP008",
        firstName: "Ananya",
        lastName: "Patel",
        email: "ananya.patel@company.com",
        phone: "+91 98765 43217",
        department: "Finance",
        designation: "Financial Analyst",
        joiningDate: "2022-09-12",
        status: "Active",
        attendanceStatus: "on_leave",
        salary: 70000,
        address: "111 Finance District, Chennai",
        manager: "David Lee",
        company: "Dayflow Inc.",
        location: "Chennai",
        dateOfBirth: "1993-11-28",
        nationality: "Indian",
        gender: "Female",
        maritalStatus: "Single",
    },
    {
        id: "9",
        employeeId: "EMP009",
        firstName: "Arjun",
        lastName: "Kumar",
        email: "arjun.kumar@company.com",
        phone: "+91 98765 43218",
        department: "Engineering",
        designation: "Backend Developer",
        joiningDate: "2023-05-10",
        status: "Active",
        attendanceStatus: "present",
        salary: 80000,
        address: "222 Code Valley, Bangalore",
        manager: "Mike Johnson",
        company: "Dayflow Inc.",
        location: "Bangalore",
        dateOfBirth: "1994-06-20",
        nationality: "Indian",
        gender: "Male",
        maritalStatus: "Single",
        skills: ["Python", "Django", "PostgreSQL"],
    },
];

export const departments = [
    "Engineering",
    "Design",
    "HR",
    "Marketing",
    "Finance",
    "Operations",
    "Sales",
];

export const designations = [
    "Software Engineer",
    "Senior Software Engineer",
    "Engineering Manager",
    "UI/UX Designer",
    "UI/UX Lead",
    "HR Manager",
    "HR Executive",
    "Marketing Specialist",
    "Marketing Manager",
    "Financial Analyst",
    "Finance Manager",
    "COO",
    "CEO",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
];
