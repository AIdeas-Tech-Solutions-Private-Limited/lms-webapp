"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Enrollment } from "@/types";
import Loading from "@/components/Loading";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function MyLearningPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.enrollments
        .getMy()
        .then((res) => setEnrollments(res.enrollments))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Learning</h1>

      {enrollments.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-violet-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-violet-600" />
          </div>
          <p className="text-gray-500 mb-4">You haven&apos;t been assigned any courses yet.</p>
          <p className="text-sm text-gray-400">Contact your admin to get access to courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white rounded-2xl shadow-sm border border-violet-100/50 overflow-hidden hover:shadow-lg hover:shadow-violet-100/50 transition-all"
            >
              <div className="aspect-video bg-gradient-to-br from-violet-50 to-indigo-50 relative">
                {enrollment.courseThumbnail ? (
                  <img
                    src={enrollment.courseThumbnail}
                    alt={enrollment.courseTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-violet-300 text-4xl font-bold">
                    {enrollment.courseTitle?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {enrollment.courseTitle}
                </h3>
                {enrollment.categoryName && (
                  <span className="text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full font-medium">
                    {enrollment.categoryName}
                  </span>
                )}
                <div className="mt-4">
                  <ProgressBar
                    completed={enrollment.completedSessions}
                    total={enrollment.totalSessions}
                  />
                </div>
                <Link
                  href={`/courses/${enrollment.courseSlug}`}
                  className="mt-4 block text-center text-violet-600 hover:text-violet-700 font-medium text-sm"
                >
                  {enrollment.progress > 0 ? "Continue Learning" : "Start Learning"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
