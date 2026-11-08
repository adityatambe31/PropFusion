import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form with gradient background */}
      <div className="flex-1 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 flex items-center justify-center relative">
        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <span className="text-gray-900 font-bold text-2xl">₹</span>
          </div>
        </Link>

        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-white/80 mb-8">{subtitle}</p>}

          {children}
        </div>
      </div>

      {/* Right side - Testimonial */}
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-black via-gray-900 to-gray-800 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="max-w-lg relative z-10 space-y-8">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
            <div className="text-6xl mb-4 text-white/80">&quot;</div>
            <p className="text-white text-xl mb-8 leading-relaxed">
              &quot;Managing my finances has never been easier. The interface is
              intuitive and the features are exactly what I need.&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-linear-to-br from-gray-400 to-gray-600 rounded-full"></div>
              <div>
                <p className="text-white font-semibold">Sarah Johnson</p>
                <p className="text-white/70 text-sm">
                  Finance Manager at TechCorp
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-2">
              Get started with PropFusion
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Track your expenses, set budgets, and achieve your financial
              goals.
            </p>
            <Link
              href="/auth/sign-up"
              className="text-gray-300 hover:text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              Create an account
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
