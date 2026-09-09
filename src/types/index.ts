export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  avatar?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  level: "beginner" | "intermediate" | "advanced";
  duration?: string;
  instructor?: string;
  categoryId?: string;
  categoryName?: string;
  published: boolean;
  sessionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  sessionDate?: string;
  duration?: string;
  published: boolean;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  courseLevel?: string;
  categoryName?: string;
  totalSessions: number;
  completedSessions: number;
  progress: number;
  createdAt?: string;
}

export interface CourseProgress {
  totalSessions: number;
  completedSessions: number;
  progress: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  totalSessions: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentCount: number;
  createdAt?: string;
}

export interface AdminEnrollment {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  createdAt?: string;
}

export const enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
}
