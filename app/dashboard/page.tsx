import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    UserCheck,
    Clock,
    AlertCircle,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

type ChangeType = "positive" | "negative" | "neutral";

const stats: {
    title: string;
    value: string;
    change: string;
    changeType: ChangeType;
    description: string;
    icon: typeof Users;
    gradient: string;
    bgColor: string;
}[] = [
        {
            title: "Total Employees",
            value: "128",
            change: "+4",
            changeType: "positive",
            description: "from last month",
            icon: Users,
            gradient: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-50",
        },
        {
            title: "On Leave Today",
            value: "12",
            change: "4%",
            changeType: "neutral",
            description: "of total workforce",
            icon: UserCheck,
            gradient: "from-amber-500 to-orange-500",
            bgColor: "bg-amber-50",
        },
        {
            title: "Pending Requests",
            value: "5",
            change: "-2",
            changeType: "positive",
            description: "from yesterday",
            icon: AlertCircle,
            gradient: "from-rose-500 to-pink-500",
            bgColor: "bg-rose-50",
        },
        {
            title: "Avg Attendance",
            value: "94%",
            change: "+1%",
            changeType: "positive",
            description: "from last week",
            icon: Clock,
            gradient: "from-emerald-500 to-teal-500",
            bgColor: "bg-emerald-50",
        },
    ];

const recentLeaveRequests = [
    { name: "John Doe", type: "Sick Leave", days: 2, status: "Pending", avatar: "JD", color: "from-indigo-400 to-purple-500" },
    { name: "Sarah Smith", type: "Vacation", days: 5, status: "Approved", avatar: "SS", color: "from-emerald-400 to-teal-500" },
    { name: "Mike Johnson", type: "Personal", days: 1, status: "Pending", avatar: "MJ", color: "from-amber-400 to-orange-500" },
    { name: "Emily Brown", type: "Sick Leave", days: 3, status: "Rejected", avatar: "EB", color: "from-rose-400 to-pink-500" },
];

const upcomingHolidays = [
    { name: "Republic Day", date: "Jan 26, 2026", daysLeft: 23 },
    { name: "Holi", date: "Mar 03, 2026", daysLeft: 59 },
    { name: "Good Friday", date: "Mar 20, 2026", daysLeft: 76 },
];

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-8">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back! Here&apos;s what&apos;s happening with your team.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className={`${stat.bgColor} border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} opacity-90 group-hover:opacity-100 transition-opacity shadow-sm`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
                            <div className="flex items-center gap-1 mt-1">
                                {stat.changeType === "positive" ? (
                                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                ) : stat.changeType === "negative" ? (
                                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                                ) : null}
                                <span className={`text-xs font-medium ${stat.changeType === "positive" ? "text-emerald-600" :
                                    stat.changeType === "negative" ? "text-rose-600" : "text-slate-500"
                                    }`}>
                                    {stat.change}
                                </span>
                                <span className="text-xs text-slate-400">{stat.description}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Leave Requests */}
                <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-800">Recent Leave Requests</CardTitle>
                                <CardDescription className="text-slate-500">
                                    Latest leave requests from your team
                                </CardDescription>
                            </div>
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                                View all
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentLeaveRequests.map((request, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${request.color} flex items-center justify-center shadow-sm`}>
                                            <span className="text-xs font-medium text-white">{request.avatar}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{request.name}</p>
                                            <p className="text-sm text-slate-500">{request.type} • {request.days} day{request.days > 1 ? "s" : ""}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === "Approved"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : request.status === "Rejected"
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}>
                                        {request.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Holidays */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                            Upcoming Holidays
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {upcomingHolidays.map((holiday, index) => (
                            <div
                                key={index}
                                className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-800">{holiday.name}</p>
                                        <p className="text-sm text-slate-500">{holiday.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-indigo-600">{holiday.daysLeft}</p>
                                        <p className="text-xs text-slate-400">days left</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 shadow-lg">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                        <p className="text-sm text-indigo-100">Common tasks at your fingertips</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                            <Users className="h-4 w-4" />
                            Add Employee
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm">
                            <Calendar className="h-4 w-4" />
                            Approve Leaves
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm">
                            <TrendingUp className="h-4 w-4" />
                            View Reports
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
