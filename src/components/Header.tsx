"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Creative Production Suite
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Home
            </Link>
            <Link
              href="/video-analyzer"
              className={`text-sm font-medium transition-colors ${
                isActive("/video-analyzer")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Video Analyzer
            </Link>
            <Link
              href="/video-analyzer"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

