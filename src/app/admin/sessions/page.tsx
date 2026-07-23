"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Session, Course } from "@/types";
import Loading from "@/components/Loading";
import { Plus, Pencil, Trash2, Calendar, Clock } from "lucide-react";

function AdminSessionsContent() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    pdfUrl: "",
    order: 0,
    courseId: "",
    sessionDate: "",
    duration: "",
    published: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSessions = () => {
    if (selectedCourseId) {
      api.sessions.getByCourse(selectedCourseId).then((res) => setSessions(res.sessions));
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      api.courses.getAllAdmin().then((res) => {
        setCourses(res.courses);
        if (!selectedCourseId && res.courses.length > 0) {
          setSelectedCourseId(res.courses[0].id);
        }
        setLoading(false);
      });
    }
  }, [isAdmin]);

  useEffect(() => {
    loadSessions();
  }, [selectedCourseId]);

  const resetForm = () => {
    setForm({ title: "", description: "", videoUrl: "", pdfUrl: "", order: 0, courseId: "", sessionDate: "", duration: "", published: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (session: Session) => {
    setForm({
      title: session.title,
      description: session.description || "",
      videoUrl: session.videoUrl || "",
      pdfUrl: session.pdfUrl || "",
      order: session.order,
      courseId: session.courseId,
      sessionDate: session.sessionDate ? session.sessionDate.split("T")[0] : "",
      duration: session.duration || "",
      published: session.published,
    });
    setEditingId(session.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, courseId: selectedCourseId };
    if (editingId) {
      await api.sessions.update(editingId, data);
    } else {
      await api.sessions.create(data);
    }
    resetForm();
    loadSessions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    await api.sessions.delete(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  if (authLoading || loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Sessions</h1>
          {selectedCourse && (
            <p className="text-sm text-gray-500 mt-1">for <span className="font-medium text-violet-600">{selectedCourse.title}</span></p>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 flex items-center gap-2 shadow-md shadow-violet-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Session
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-violet-100/50 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Session Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" required />
            <input type="number" placeholder="Session Number" value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <input type="date" placeholder="Session Date" value={form.sessionDate}
              onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <input type="text" placeholder="Duration (e.g., 30 Minutes)" value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <input type="text" placeholder="Video URL (YouTube)" value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <input type="text" placeholder="Notes PDF URL" value={form.pdfUrl}
              onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <label className="flex items-center gap-2 px-4 py-2">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              Published
            </label>
          </div>
          <textarea placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
          <div className="flex gap-4">
            <button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 transition-all">
              {editingId ? "Update Session" : "Create Session"}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-violet-100/50 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-violet-50/50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">#</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Title</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Duration</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Video</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((session, i) => (
              <tr key={session.id} className="hover:bg-violet-50/30 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{session.order || i + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{session.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.sessionDate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {session.duration || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[150px]">
                  {session.videoUrl || "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(session)} className="text-violet-600 hover:text-violet-800 mr-3">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(session.id)} className="text-rose-600 hover:text-rose-800">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminSessionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminSessionsContent />
    </Suspense>
  );
}
