"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Student } from "@/types";
import Loading from "@/components/Loading";

export default function AdminStudentsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      api.admin.getStudents().then((res) => {
        setStudents(res.students);
        setLoading(false);
      });
    }
  }, [isAdmin]);

  if (authLoading || loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Students</h1>

      <div className="bg-white border border-violet-100/50 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-violet-50/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Enrolled Courses</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-violet-50/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{student.enrollmentCount}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString()
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
