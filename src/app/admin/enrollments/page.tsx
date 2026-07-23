"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Loading from "@/components/Loading";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminEnrollmentsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      Promise.all([
        api.enrollments.getAll(),
        api.courses.getAllAdmin(),
      ]).then(([enrRes, couRes]) => {
        setEnrollments(enrRes.enrollments);
        setCourses(couRes.courses);
        setLoading(false);
      });
    }
  }, [isAdmin]);

  const handleAssign = async () => {
    if (!studentEmail || !selectedCourse) {
      setMessage({ type: "error", text: "Enter student email and select a course" });
      return;
    }

    setAssigning(true);
    setMessage(null);
    try {
      const res = await api.enrollments.enroll(studentEmail, selectedCourse);
      const course = courses.find((c) => c.id === selectedCourse);
      setEnrollments((prev) => [
        ...prev,
        {
          ...res.enrollment,
          userName: res.student?.name,
          userEmail: res.student?.email,
          courseTitle: course?.title,
        },
      ]);
      setMessage({ type: "success", text: `${studentEmail} assigned to ${course?.title}` });
      setStudentEmail("");
      setSelectedCourse("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to assign" });
    } finally {
      setAssigning(false);
    }
  };

  if (authLoading || loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Enrollments</h1>

      {/* Assign Form */}
      <div className="bg-white border border-violet-100/50 rounded-2xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-violet-600" />
          Assign Course to Student
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Email</label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            disabled={assigning || !studentEmail || !selectedCourse}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-200"
          >
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </div>

        {message && (
          <div className={`mt-4 flex items-center gap-2 text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>

      {/* Existing Enrollments Table */}
      <div className="bg-white border border-violet-100/50 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-violet-50/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Student</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Course</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="hover:bg-violet-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{enrollment.userName}</div>
                  <div className="text-xs text-gray-500">{enrollment.userEmail}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {enrollment.courseTitle}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {enrollment.createdAt
                    ? new Date(enrollment.createdAt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
