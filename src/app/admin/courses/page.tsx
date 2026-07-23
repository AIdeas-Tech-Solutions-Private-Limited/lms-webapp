"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Course } from "@/types";
import Loading from "@/components/Loading";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminCoursesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    duration: "",
    instructor: "",
    published: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      api.courses.getAllAdmin().then((res) => {
        setCourses(res.courses);
        setLoading(false);
      });
    }
  }, [isAdmin]);

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      description: "",
      thumbnail: "",
      duration: "",
      instructor: "",
      published: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (course: Course) => {
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnail: course.thumbnail || "",
      duration: course.duration || "",
      instructor: course.instructor || "",
      published: course.published,
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.courses.update(editingId, form);
    } else {
      await api.courses.create(form);
    }
    resetForm();
    const res = await api.courses.getAllAdmin();
    setCourses(res.courses);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course and all its sessions?")) return;
    await api.courses.delete(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  if (authLoading || loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 flex items-center gap-2 shadow-md shadow-violet-200 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-violet-100/50 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" required />
            <input type="text" placeholder="Slug" value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" required />
            <input type="text" placeholder="Thumbnail URL" value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <input type="text" placeholder="Duration (e.g., 4 weeks)" value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" />
            <input type="text" placeholder="Instructor" value={form.instructor}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
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
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50/50" required />
          <div className="flex gap-4">
            <button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 transition-all">
              {editingId ? "Update Course" : "Create Course"}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white border border-violet-100/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-violet-100/50 transition-all">
            <div className="aspect-video bg-gradient-to-br from-violet-50 to-indigo-50 relative">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-violet-300 text-4xl font-bold">
                  {course.title.charAt(0)}
                </div>
              )}
              <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-medium ${course.published ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                {course.published ? "Published" : "Draft"}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
              <div className="flex items-center gap-2">
                <Link href={`/admin/sessions?courseId=${course.id}`} className="flex-1 text-center text-sm py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all font-medium">
                  Sessions
                </Link>
                <button onClick={() => handleEdit(course)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(course.id)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
