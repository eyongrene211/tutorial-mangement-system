import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Type-safe interfaces
/**
 * @typedef {Object} StatCardProps
 * @property {string} title
 * @property {string|number} value
 * @property {string} [subtitle]
 * @property {"blue"|"green"|"orange"|"purple"} color
 */

function StatCard({ title, value, subtitle, color }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
            {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
        </div>
    );
}

export default async function TeacherDashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
        redirect("/sign-in");
    }

    await connectDB();

    let dbUser = await User.findOne({ clerkId: userId });

    // Auto-create user if doesn't exist
    if (!dbUser) {
        const metadata = clerkUser.publicMetadata;
        const role = String(metadata.role || "teacher");

        dbUser = await User.create({
            clerkId: userId,
            email: clerkUser.emailAddresses[0].emailAddress,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
            role: role,
            studentId: null,
        });
    }

    // Check if user is actually a teacher
    if (dbUser.role !== "teacher") {
        redirect("/dashboard");
    }

    const userName = clerkUser.firstName || "Teacher";

    return (
        <DashboardLayout userName={userName} role="teacher">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {userName}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Here&apos;s your teaching overview for today
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="My Students"
                        value={25}
                        subtitle="Active students"
                        color="blue"
                    />
                    <StatCard
                        title="Today&apos;s Classes"
                        value={3}
                        subtitle="2 completed, 1 upcoming"
                        color="green"
                    />
                    <StatCard
                        title="Pending Grades"
                        value={12}
                        subtitle="Tests to grade"
                        color="orange"
                    />
                    <StatCard
                        title="Attendance Rate"
                        value="92%"
                        subtitle="This week"
                        color="purple"
                    />
                </div>

                {/* Today's Schedule */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Today&apos;s Schedule
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">Form 3 - Mathematics</p>
                                <p className="text-sm text-green-700 dark:text-green-300">9:00 AM - 10:30 AM (Completed)</p>
                            </div>
                            <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">Form 2 - Physics</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">2:00 PM - 3:30 PM (Upcoming)</p>
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">→</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-lg transition-colors text-left">
                            <p className="font-medium text-indigo-900 dark:text-indigo-400">Mark Attendance</p>
                            <p className="text-sm text-indigo-600 dark:text-indigo-500 mt-1">For today&apos;s classes</p>
                        </button>
                        <button className="p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded-lg transition-colors text-left">
                            <p className="font-medium text-green-900 dark:text-green-400">Enter Grades</p>
                            <p className="text-sm text-green-600 dark:text-green-500 mt-1">Record test scores</p>
                        </button>
                        <button className="p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 rounded-lg transition-colors text-left">
                            <p className="font-medium text-orange-900 dark:text-orange-400">View Reports</p>
                            <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">Class performance</p>
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
