"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, LogOut, AlertCircle, CheckCircle } from "lucide-react";
import { checkIn, checkOut, getTodayAttendance } from "@/lib/actions/attendance";

interface AttendanceRecord {
    id: string;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
}

export default function AttendanceWidget() {
    const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch today's attendance on mount
    useEffect(() => {
        fetchTodayAttendance();
        // Refresh every minute
        const interval = setInterval(fetchTodayAttendance, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchTodayAttendance = async () => {
        setIsLoading(true);
        const result = await getTodayAttendance();
        if (result.success) {
            setAttendance(result.attendance || null);
        } else if (result.error) {
            console.error("Error fetching attendance:", result.error);
        }
        setIsLoading(false);
    };

    const handleCheckIn = async () => {
        setIsCheckingIn(true);
        setError(null);
        setSuccessMessage(null);

        const result = await checkIn();

        if (result.success) {
            setSuccessMessage("✓ Checked in successfully");
            await fetchTodayAttendance();
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            setError(result.error || "Check-in failed");
        }

        setIsCheckingIn(false);
    };

    const handleCheckOut = async () => {
        setIsCheckingOut(true);
        setError(null);
        setSuccessMessage(null);

        const result = await checkOut();

        if (result.success) {
            setSuccessMessage("✓ Checked out successfully");
            await fetchTodayAttendance();
            setTimeout(() => setSuccessMessage(null), 3000);
        } else {
            setError(result.error || "Check-out failed");
        }

        setIsCheckingOut(false);
    };

    const formatTime = (isoString: string | null | undefined) => {
        if (!isoString) return "Not recorded";
        const date = new Date(isoString);
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Daily Attendance</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-700">{successMessage}</p>
                </div>
            )}

            {/* Status */}
            <div className="grid gap-4 mb-6 sm:grid-cols-2">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1">Check In</p>
                    <p className="text-2xl font-bold text-blue-900">
                        {formatTime(attendance?.check_in_time)}
                    </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 mb-1">Check Out</p>
                    <p className="text-2xl font-bold text-purple-900">
                        {formatTime(attendance?.check_out_time)}
                    </p>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || isCheckingOut || !!(attendance?.check_in_time && !attendance?.check_out_time)}
                    className={`flex-1 h-10 ${
                        attendance?.check_in_time && !attendance?.check_out_time
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                >
                    {isCheckingIn ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <LogIn className="h-4 w-4 mr-2" />
                    )}
                    Check In
                </Button>
                <Button
                    onClick={handleCheckOut}
                    disabled={isCheckingOut || isCheckingIn || !attendance?.check_in_time || !!attendance?.check_out_time}
                    className={`flex-1 h-10 ${
                        !attendance?.check_in_time || attendance?.check_out_time
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                            : "bg-purple-500 hover:bg-purple-600 text-white"
                    }`}
                >
                    {isCheckingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Check Out
                </Button>
            </div>

            {/* Status info */}
            <p className="text-xs text-slate-500 mt-4">
                {attendance?.check_in_time && !attendance?.check_out_time
                    ? "You are currently checked in. Click Check Out to record your departure."
                    : attendance?.check_out_time
                    ? "You have already checked out today."
                    : "Click Check In to record your arrival."}
            </p>
        </div>
    );
}
