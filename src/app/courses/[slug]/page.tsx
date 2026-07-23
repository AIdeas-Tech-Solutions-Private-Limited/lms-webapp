"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Course, Session } from "@/types";
import Loading from "@/components/Loading";
import { Clock, BarChart3, User, PlayCircle, Calendar } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.courses.getBySlug(params.slug as string);
        setCourse(data.course);
        setSessions(data.sessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  if (loading) return <Loading />;

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 gap-8">
        {/* Main Content */}
        <div>
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full aspect-video object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl flex items-center justify-center text-violet-300 text-6xl font-bold">
              {course.title.charAt(0)}
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4">
            {course.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
            {course.instructor && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> {course.instructor}
              </span>
            )}
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {course.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> {sessions.length} sessions
            </span>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-3">About this course</h2>
            <p className="text-gray-600 whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Sessions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Course Sessions</h2>
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  onClick={() => router.push(`/session/${session.id}`)}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-violet-100/50 hover:border-violet-200 cursor-pointer transition-colors"
                >
                  <span className="w-8 h-8 flex items-center justify-center bg-violet-100 text-violet-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <PlayCircle className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-gray-700">{session.title}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {session.sessionDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(session.sessionDate)}
                        </span>
                      )}
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
