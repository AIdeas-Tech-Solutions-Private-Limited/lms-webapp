"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { LogOut, User, BookOpen, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-violet-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-violet-600">
              <div className="bg-violet-100 p-1.5 rounded-lg">
                <BookOpen className="w-5 h-5 text-violet-600" />
              </div>
              LMS
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {user && !isAdmin && (
                <Link
                  href="/my-learning"
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                    isActive("/my-learning")
                      ? "text-violet-600 bg-violet-50"
                      : "text-gray-600 hover:text-violet-600 hover:bg-violet-50/50"
                  }`}
                >
                  My Learning
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all ${
                    pathname.startsWith("/admin")
                      ? "text-violet-600 bg-violet-50"
                      : "text-gray-600 hover:text-violet-600 hover:bg-violet-50/50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 inline mr-1" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600 px-3 py-2 rounded-lg hover:bg-violet-50/50 transition-all"
                >
                  <User className="w-4 h-4" />
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
