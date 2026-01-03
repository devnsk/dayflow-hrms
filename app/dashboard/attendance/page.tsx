"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Loader2,
    Clock,
    User
} from "lucide-react";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AttendanceWidget from "@/components/attendance-widget";

// We need date-fns for easier date manipulation
// If not installed, I'll handle it with native Date, but assume standard library is available or user approves install.
// Checking previous responses, user context used native Date.
// I'll try to use native Date to be safe, but date-fns is 10x better.
// I will attempt to use native JavaScript Date to avoid dependency errors.

/* 
  Native Date Helper Functions 
*/
const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const formatDisplayDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

const getDayName = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
};

const addDay = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/* Type Definitions */
type AttendanceRecord = {
    id: string;
    profile_id: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
    date: string;
};

type EmployeeProfile = {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string | null;
    designation: string | null;
    department: string | null;
    avatar_url: string | null;
};

type CombinedRecord = {
    profile: EmployeeProfile;
    attendance: AttendanceRecord | null;
    workHours: string;
    extraHours: string;
};

/**
 * Employee Attendance History Component
 * Shows personal attendance records in a detailed table
 */
function EmployeeAttendanceHistory() {
    const { user } = useUser();
    const [records, setRecords] = useState<Array<{
        date: string;
        checkIn: string;
        checkOut: string;
        workHours: string;
        breakHours: string;
        status: string;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Last 30 days
        return d;
    });
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.id) return;
            setLoading(true);

            const supabase = createClient();
            const start = formatDate(startDate);
            const end = formatDate(endDate);

            try {
                const { data, error } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('profile_id', user.id)
                    .gte('date', start)
                    .lte('date', end)
                    .order('date', { ascending: false });

                if (error) throw error;

                const formattedRecords = (data || []).map(record => {
                    let workHours = "--:--";
                    let breakHours = "01:00";

                    if (record.check_in_time && record.check_out_time) {
                        const checkin = new Date(record.check_in_time);
                        const checkout = new Date(record.check_out_time);
                        const diffMs = checkout.getTime() - checkin.getTime();
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        
                        // Calculate work hours (minus break)
                        const breakMins = 60; // Default 1 hour break
                        const actualWorkMins = Math.max(0, diffMins - breakMins);
                        
                        const hours = Math.floor(actualWorkMins / 60);
                        const mins = actualWorkMins % 60;
                        workHours = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                    }

                    return {
                        date: new Intl.DateTimeFormat('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }).format(new Date(record.date)),
                        checkIn: record.check_in_time
                            ? new Date(record.check_in_time).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })
                            : '--:--',
                        checkOut: record.check_out_time
                            ? new Date(record.check_out_time).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })
                            : '--:--',
                        workHours,
                        breakHours,
                        status: record.status || 'absent'
                    };
                });

                setRecords(formattedRecords);
            } catch (error) {
                console.error('Error fetching attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user, startDate, endDate]);

    const handleDateRangeChange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setStartDate(start);
        setEndDate(end);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-800">Attendance History</h2>
                
                {/* Date Range Selector */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-slate-600">Show last:</span>
                    {[7, 15, 30, 90].map(days => (
                        <button
                            key={days}
                            onClick={() => handleDateRangeChange(days)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                            {days}d
                        </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2">
                        <input
                            type="date"
                            value={formatDate(startDate)}
                            onChange={(e) => setStartDate(new Date(e.target.value))}
                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                            type="date"
                            value={formatDate(endDate)}
                            onChange={(e) => setEndDate(new Date(e.target.value))}
                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Date</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Check In</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Check Out</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Work Hours</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Break Hours</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-sm text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading attendance records...
                                </td>
                            </tr>
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No attendance records found for this period.
                                </td>
                            </tr>
                        ) : (
                            records.map((record, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        {record.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.checkIn !== '--:--' ? (
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded text-sm font-medium">
                                                <Clock className="h-3.5 w-3.5" />
                                                {record.checkIn}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">--:--</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.checkOut !== '--:--' ? (
                                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-sm font-medium">
                                                <Clock className="h-3.5 w-3.5" />
                                                {record.checkOut}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">--:--</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-slate-800">
                                        {record.workHours}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        {record.breakHours}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                            record.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                                            record.status === 'on_leave' ? "bg-blue-100 text-blue-700" :
                                            record.checkIn !== '--:--' ? "bg-amber-100 text-amber-700" :
                                            "bg-slate-100 text-slate-600"
                                        )}>
                                            {record.status === 'present' ? 'Present' :
                                             record.status === 'on_leave' ? 'On Leave' :
                                             record.checkIn !== '--:--' ? 'Partial' :
                                             'Absent'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AttendancePage() {
    const { user, isAdmin, isLoading: userLoading } = useUser();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [mockDate, setMockDate] = useState<string>(formatDate(new Date())); // For input binding
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<CombinedRecord[]>([]);

    const supabase = createClient();

    // Sync input date with state date
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateVal = e.target.value;
        if (dateVal) {
            setMockDate(dateVal);
            setSelectedDate(new Date(dateVal));
        }
    };

    const handlePrevDay = () => {
        const newDate = addDay(selectedDate, -1);
        setSelectedDate(newDate);
        setMockDate(formatDate(newDate));
    };

    const handleNextDay = () => {
        const newDate = addDay(selectedDate, 1);
        setSelectedDate(newDate);
        setMockDate(formatDate(newDate));
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.company_id) return;
            setLoading(true);

            const dateStr = formatDate(selectedDate);

            try {
                // 1. Fetch all employees (profiles) for the company
                // Only admins/hr can see employee lists
                if (!isAdmin) {
                    setLoading(false);
                    return;
                }

                let query = supabase
                    .from('profiles')
                    .select('id, first_name, last_name, employee_id, designation, department, avatar_url')
                    .eq('company_id', user.company_id);

                // Exclude admin/HR from the employee list to avoid duplication
                query = query.neq('id', user.id);

                const { data: profiles, error: profilesError } = await query.order('first_name');

                if (profilesError) throw profilesError;

                if (!profiles || profiles.length === 0) {
                    setRecords([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch attendance for the specific date for these company employees
                const { data: attendance, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('date', dateStr)
                    .in('profile_id', profiles.map(p => p.id));

                if (attendanceError) throw attendanceError;

                // 3. Combine Data
                const combined: CombinedRecord[] = profiles.map(profile => {
                    const record = attendance?.find(a => a.profile_id === profile.id) || null;

                    let workHours = "--:--";
                    let extraHours = "--:--";

                    if (record?.check_in_time && record?.check_out_time) {
                        const start = new Date(record.check_in_time);
                        const end = new Date(record.check_out_time);
                        const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));

                        const hours = Math.floor(diffMinutes / 60);
                        const minutes = diffMinutes % 60;
                        workHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                        // Assuming standard 9 hour day for extra calculation
                        const standardMinutes = 9 * 60;
                        if (diffMinutes > standardMinutes) {
                            const extraMin = diffMinutes - standardMinutes;
                            const eh = Math.floor(extraMin / 60);
                            const em = extraMin % 60;
                            extraHours = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
                        } else {
                            extraHours = "00:00";
                        }
                    } else if (record?.check_in_time) {
                        workHours = "On Going";
                    }

                    return {
                        profile,
                        attendance: record,
                        workHours,
                        extraHours
                    };
                });

                setRecords(combined);

            } catch (error) {
                console.error("Error fetching attendance:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && !userLoading) {
            fetchData();
        }
    }, [user, userLoading, selectedDate]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const fullName = `${r.profile.first_name} ${r.profile.last_name}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase()) ||
                r.profile.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [records, searchQuery]);

    if (userLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    }

    if (!isAdmin) {
        // Employees see their own attendance widget and history
        return (
            <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
                {/* Check-in/Check-out Widget */}
                <AttendanceWidget />

                {/* Attendance History Section */}
                <EmployeeAttendanceHistory />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            {/* Admin's Own Attendance Widget */}
            <AttendanceWidget />

            {/* Header / Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">

                {/* Top Row: Title + Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200"
                        />
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-slate-100 pt-6">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevDay} className="h-10 w-10">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextDay} className="h-10 w-10">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Input
                                type="date"
                                value={mockDate}
                                onChange={handleDateChange}
                                className="h-10 w-full sm:w-48 cursor-pointer"
                            />
                        </div>
                        <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium min-w-[120px] text-center border border-slate-200">
                            {getDayName(selectedDate)}
                        </div>
                    </div>

                    <div className="text-sm font-medium text-slate-500">
                        {formatDisplayDate(selectedDate)}
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Employee</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Check In</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Check Out</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Work Hours</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Extra Hours</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Loading records...
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.profile.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-slate-200">
                                                    <AvatarImage src={record.profile.avatar_url || ""} />
                                                    <AvatarFallback className="bg-slate-100 text-slate-600">
                                                        {record.profile.first_name[0]}{record.profile.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-slate-800">
                                                        {record.profile.first_name} {record.profile.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {record.profile.department || "No Dept"} • {record.profile.designation || "Employee"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm leading-none">
                                            {record.attendance?.check_in_time ? (
                                                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(record.attendance.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">--:--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm leading-none">
                                            {record.attendance?.check_out_time ? (
                                                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(record.attendance.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">--:--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-800 font-mono text-sm">
                                            {record.workHours}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                                            {record.extraHours}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {record.attendance ? (
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                                    record.attendance.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                                                        record.attendance.status === 'on_leave' ? "bg-blue-100 text-blue-700" :
                                                            "bg-amber-100 text-amber-700"
                                                )}>
                                                    {record.attendance.status.replace('_', ' ')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-500">
                                                    Absent
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
