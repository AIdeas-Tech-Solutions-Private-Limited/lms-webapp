"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Session, Course } from "@/types";
import Loading from "@/components/Loading";
import ProgressBar from "@/components/ProgressBar";
import { ChevronLeft, ChevronRight, CheckCircle, Calendar, Clock } from "lucide-react";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [completed, setCompleted] = useState(false);
  const [courseProgress, setCourseProgress] = useState({
    totalSessions: 0,
    completedSessions: 0,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function load() {
      try {
        const sessionData = await api.sessions.getById(params.sessionId as string);
        setSession(sessionData.session);

        const courseData = await api.courses.getById(sessionData.session.courseId);
        setCourse(courseData.course);

        const sessionsData = await api.sessions.getByCourse(sessionData.session.courseId);
        setAllSessions(sessionsData.sessions);

        const progressData = await api.progress.getCourse(sessionData.session.courseId);
        setCourseProgress(progressData);

        const progressRes = await api.progress.getSession(params.sessionId as string);
        setCompleted(progressRes.completed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [params.sessionId, user]);

  const handleMarkComplete = async () => {
    try {
      await api.progress.markComplete(params.sessionId as string);
      setCompleted(true);
      setCourseProgress((prev) => ({
        ...prev,
        completedSessions: prev.completedSessions + 1,
        progress: Math.round(
          ((prev.completedSessions + 1) / prev.totalSessions) * 100
        ),
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentIndex = allSessions.findIndex((s) => s.id === params.sessionId);
  const prevSession = currentIndex > 0 ? allSessions[currentIndex - 1] : null;
  const nextSession =
    currentIndex < allSessions.length - 1 ? allSessions[currentIndex + 1] : null;

  if (loading || authLoading) return <Loading />;

  if (!session || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Session not found</p>
      </div>
    );
  }

  function getYouTubeId(url: string) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?#]+)/);
    return match ? match[1] : null;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main */}
        <div className="lg:col-span-3">
          {session.videoUrl && (
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden mb-6">
              {(() => {
                const ytId = getYouTubeId(session.videoUrl);
                if (ytId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <video
                    src={session.videoUrl}
                    controls
                    className="w-full h-full"
                  />
                );
              })()}
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {session.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>Session {currentIndex + 1} of {allSessions.length}</span>
            {session.sessionDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(session.sessionDate)}
              </span>
            )}
            {session.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {session.duration}
              </span>
            )}
          </div>

          {session.description && (
            <div className="prose max-w-none mb-6">
              <p className="text-gray-600 whitespace-pre-line">
                {session.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleMarkComplete}
              disabled={completed}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                completed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200"
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {completed ? "Completed" : "Mark as Complete"}
            </button>

            {session.pdfUrl && (
              <a
                href={session.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:text-violet-700 font-medium"
              >
                Download Notes
              </a>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            {prevSession ? (
              <button
                onClick={() => router.push(`/session/${prevSession.id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous Session
              </button>
            ) : (
              <div />
            )}
            {nextSession ? (
              <button
                onClick={() => router.push(`/session/${nextSession.id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors"
              >
                Next Session
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-violet-100/50 rounded-2xl p-4 sticky top-24 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
            <ProgressBar
              completed={courseProgress.completedSessions}
              total={courseProgress.totalSessions}
            />
            <div className="mt-4 space-y-1">
              {allSessions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/session/${s.id}`)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-all ${
                    s.id === params.sessionId
                      ? "bg-violet-50 text-violet-600 font-medium border border-violet-100"
                      : "hover:bg-violet-50/50 text-gray-600"
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full text-xs">
                    {i + 1}
                  </span>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
