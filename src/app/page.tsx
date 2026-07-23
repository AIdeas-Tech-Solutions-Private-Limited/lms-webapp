"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Course, Category } from "@/types";
import CourseCard from "@/components/CourseCard";
import Loading from "@/components/Loading";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [coursesResult, categoriesResult] = await Promise.allSettled([
        api.courses.getAll({ limit: "6" }),
        api.categories.getAll(),
      ]);
      if (coursesResult.status === "fulfilled") {
        setCourses(coursesResult.value.courses);
      }
      if (categoriesResult.status === "fulfilled") {
        setCategories(categoriesResult.value.categories);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Start Learning Today
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Unlock Your
              <span className="block text-violet-200">Potential</span>
            </h1>
            <p className="text-lg text-violet-100 mb-8 leading-relaxed">
              Browse expert-led courses and start learning today. Master web
              development, programming, and more.
            </p>
            <div className="flex gap-4">
              <Link
                href="/courses"
                className="bg-white text-violet-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-violet-50 transition-all flex items-center gap-2 shadow-xl shadow-violet-900/20"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Popular Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/courses?category=${cat.id}`}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-violet-100/50 text-center hover:shadow-lg hover:shadow-violet-100/50 hover:border-violet-200 transition-all duration-300 group"
                >
                  <div className="bg-violet-50 group-hover:bg-violet-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                    <BookOpen className="w-7 h-7 text-violet-600" />
                  </div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Courses
            </h2>
            <Link
              href="/courses"
              className="text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
