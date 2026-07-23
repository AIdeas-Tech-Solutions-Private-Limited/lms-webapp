"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Loading from "@/components/Loading";
import { BookOpen, Users, GraduationCap, ListChecks } from "lucide-react";

export default function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      api.admin.getDashboard().then(setStats).finally(() => setLoading(false));
    }
  }, [isAdmin]);

  if (authLoading || loading) return <Loading />;

  const cards = [
    { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "from-violet-500 to-indigo-500", shadow: "shadow-violet-200" },
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-200" },
    { label: "Total Enrollments", value: stats.totalEnrollments, icon: GraduationCap, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-200" },
    { label: "Total Sessions", value: stats.totalSessions, icon: ListChecks, color: "from-rose-500 to-pink-500", shadow: "shadow-rose-200" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-violet-100/50 p-6">
            <div className="flex items-center gap-4">
              <div className={`bg-gradient-to-r ${card.color} p-3 rounded-xl shadow-lg ${card.shadow}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/courses"
          className="bg-white rounded-2xl shadow-sm border border-violet-100/50 p-6 hover:shadow-lg hover:shadow-violet-100/50 hover:border-violet-200 transition-all group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">Manage Courses</h3>
          <p className="text-sm text-gray-500 mt-1">Add, edit, or delete courses</p>
        </Link>
        <Link
          href="/admin/enrollments"
          className="bg-white rounded-2xl shadow-sm border border-violet-100/50 p-6 hover:shadow-lg hover:shadow-violet-100/50 hover:border-violet-200 transition-all group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">Enroll Student</h3>
          <p className="text-sm text-gray-500 mt-1">Assign courses to students by email</p>
        </Link>
        <Link
          href="/admin/students"
          className="bg-white rounded-2xl shadow-sm border border-violet-100/50 p-6 hover:shadow-lg hover:shadow-violet-100/50 hover:border-violet-200 transition-all group"
        >
          <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">View Students</h3>
          <p className="text-sm text-gray-500 mt-1">See all enrolled students</p>
        </Link>
      </div>
    </div>
  );
}
