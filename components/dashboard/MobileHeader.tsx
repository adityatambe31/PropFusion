"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { NotificationBell } from "./NotificationPanel";

export function MobileHeader({ 
  onMenuClick 
}: { 
  onMenuClick: () => void 
}) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white dark:text-black font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">PropFusion</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
