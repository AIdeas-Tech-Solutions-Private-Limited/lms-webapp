import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="bg-violet-500/20 p-1.5 rounded-lg">
                <BookOpen className="w-5 h-5 text-violet-400" />
              </div>
              LMS
            </Link>
            <p className="text-sm text-gray-400">
              Learn new skills online with expert instructors.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link href="/courses" className="text-sm hover:text-violet-400 transition-colors">
                Browse Courses
              </Link>
              <Link href="/login" className="text-sm hover:text-violet-400 transition-colors">
                Login
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <div className="flex flex-col gap-2">
              <span className="text-sm">Web Development</span>
              <span className="text-sm">Programming</span>
              <span className="text-sm">Design</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} LMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
