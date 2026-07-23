const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getMe: () => request<{ user: any }>("/auth/me"),
  },
  categories: {
    getAll: () => request<{ categories: any[] }>("/categories"),
    getBySlug: (slug: string) =>
      request<{ category: any }>(`/categories/${slug}`),
    create: (body: { name: string; slug: string }) =>
      request<{ category: any }>("/categories", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { name: string; slug: string }) =>
      request<{ category: any }>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/categories/${id}`, {
        method: "DELETE",
      }),
  },
  courses: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<{ courses: any[]; pagination: any }>(`/courses${query}`);
    },
    getAllAdmin: () =>
      request<{ courses: any[] }>("/courses/admin/all"),
    getFeatured: () =>
      request<{ courses: any[] }>("/courses/featured"),
    getBySlug: (slug: string) =>
      request<{ course: any; sessions: any[] }>(`/courses/slug/${slug}`),
    getById: (id: string) =>
      request<{ course: any }>(`/courses/${id}`),
    create: (body: any) =>
      request<{ course: any }>("/courses", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: any) =>
      request<{ course: any }>(`/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/courses/${id}`, {
        method: "DELETE",
      }),
  },
  sessions: {
    getByCourse: (courseId: string) =>
      request<{ sessions: any[] }>(`/sessions/course/${courseId}`),
    getById: (id: string) =>
      request<{ session: any }>(`/sessions/${id}`),
    create: (body: any) =>
      request<{ session: any }>("/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: any) =>
      request<{ session: any }>(`/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/sessions/${id}`, {
        method: "DELETE",
      }),
  },
  enrollments: {
    getMy: () =>
      request<{ enrollments: any[] }>("/enrollments/my"),
    getAll: () =>
      request<{ enrollments: any[] }>("/enrollments"),
    enroll: (email: string, courseId: string) =>
      request<{ enrollment: any; student: any }>(`/enrollments`, {
        method: "POST",
        body: JSON.stringify({ email, courseId }),
      }),
  },
  progress: {
    markComplete: (sessionId: string) =>
      request<{ progress: any }>(`/progress/${sessionId}/complete`, {
        method: "POST",
      }),
    getSession: (sessionId: string) =>
      request<{ completed: boolean }>(`/progress/${sessionId}`),
    getCourse: (courseId: string) =>
      request<{ totalSessions: number; completedSessions: number; progress: number }>(
        `/progress/course/${courseId}`
      ),
  },
  profile: {
    get: () => request<{ user: any }>("/profile"),
    update: (body: { name?: string; avatar?: string }) =>
      request<{ user: any }>("/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    changePassword: (body: {
      currentPassword: string;
      newPassword: string;
    }) =>
      request<{ message: string }>("/profile/change-password", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },
  admin: {
    getDashboard: () =>
      request<{
        totalCourses: number;
        totalStudents: number;
        totalEnrollments: number;
        totalSessions: number;
      }>("/admin/dashboard"),
    getStudents: () =>
      request<{ students: any[] }>("/admin/students"),
  },
};
