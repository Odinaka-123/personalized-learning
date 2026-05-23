"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCourses } from "@/lib/firestore";
import { Course } from "@/types";
import {
  BookOpen,
  Search,
  Brain,
  ChevronRight,
  Clock,
  Layers,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function LearnPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getCourses()
        .then(setCourses)
        .finally(() => setFetching(false));
    }
  }, [user]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar />

      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Browse courses
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Enrol in a course to start your adaptive learning journey
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Courses grid */}
        {fetching ?
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        : filtered.length === 0 ?
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-purple-400" />
            </div>
            <p className="text-white font-semibold text-lg">No courses yet</p>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              {search ?
                "No courses match your search."
              : "No courses have been published yet. Check back soon!"}
            </p>
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((course) => (
              <div
                key={course.id}
                onClick={() => router.push(`/learn/${course.id}`)}
                className="bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-2xl p-5 sm:p-6 cursor-pointer transition-all hover:bg-white/[0.07] group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Brain size={18} className="text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {course.topics?.length ?? 0} topics
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    Adaptive
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full">
                    Free
                  </span>
                  <span className="text-purple-400 text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                    Enrol <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        }
      </main>
    </div>
  );
}
