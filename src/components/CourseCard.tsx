import Link from "next/link";
import { Course } from "@/types";
import { Clock, BarChart3, User } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group bg-white rounded-2xl shadow-sm border border-violet-100/50 overflow-hidden hover:shadow-lg hover:shadow-violet-100/50 hover:border-violet-200 transition-all duration-300"
    >
      <div className="aspect-video bg-gradient-to-br from-violet-50 to-indigo-50 relative overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-violet-300 text-4xl font-bold">
            {course.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {course.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {course.instructor && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {course.instructor}
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.duration}
            </span>
          )}
          {course.sessionCount !== undefined && (
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {course.sessionCount} sessions
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
