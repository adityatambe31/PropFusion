"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Play,
  Home as HomeIcon,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  ArrowUpRight,
  Star,
  Users,
  Building,
  TrendingUp,
  X,
  Menu,
  Search,
  Clock,
  ShieldCheck,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
};

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function StaggerContainer({
  children,
  className = "",
  staggerDelay = 100,
  baseDelay = 0,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
          <div
            key={i}
            className="transition-all duration-700 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(40px)",
              transitionDelay: `${baseDelay + i * staggerDelay}ms`,
            }}
          >
            {child}
          </div>
        ))
        : (
          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(40px)",
              transitionDelay: `${baseDelay}ms`,
            }}
          >
            {children}
          </div>
        )}
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow:
          "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PropertyCard({
  image,
  title,
  location,
  beds,
  baths,
  sqft,
  year,
  description,
  index,
}: {
  image: string;
  title: string;
  location: string;
  beds: string;
  baths: string;
  sqft: string;
  year: string;
  description: string;
  index: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <div
      ref={ref}
      className="group relative rounded-3xl overflow-hidden transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1)"
          : "translateY(60px) scale(0.95)",
        transitionDelay: `${index * 150}ms`,
      }}
    >
      <GlassCard className="h-full">
        <div className="relative h-64 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-white border border-white/20">
              Live
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
              <MapPin size={10} /> {location.split(",")[0]}
            </span>
          </div>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="p-6">
          <h3 className="font-body text-xl font-semibold text-white mb-2 group-hover:text-[#c9a96e] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-white/40 mb-4 line-clamp-2">{description}</p>
          <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
            <span className="flex items-center gap-1">
              <HomeIcon size={12} /> {beds}
            </span>
            <span className="flex items-center gap-1">
              <Building size={12} /> {baths}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={12} /> {sqft}
            </span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-white/30">Built {year}</span>
            <button className="flex items-center gap-2 text-sm text-[#c9a96e] hover:text-[#dfc08a] transition-colors">
              View More <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default function Home() {
  const { data: session, isPending } = useSession();
  const isAuthed = Boolean(session?.user);
  const router = useRouter();
  const signInHref = "/auth/sign-in?callbackURL=/auth/post-signin-redirect";
  const getStartedHref = "/auth/sign-up?callbackURL=/auth/post-signin-redirect";

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/auth/post-signin-redirect");
    }
  }, [session, isPending, router]);

  const [scrollY, setScrollY] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  }, []);

  const scrollProgress =
    typeof window !== "undefined" && typeof document !== "undefined"
      ? Math.min(
        (scrollY / (document.body.scrollHeight - window.innerHeight || 1)) *
        100,
        100,
      )
      : 0;

  function AnimatedCounter({
    target,
    suffix = "",
    prefix = "",
  }: {
    target: number;
    suffix?: string;
    prefix?: string;
  }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let start = 0;
            const duration = 2000;
            const increment = target / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= target) {
                setCount(target);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }
        },
        { threshold: 0.5 },
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [target, hasAnimated]);

    return (
      <span ref={ref} className="tabular-nums">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </span>
    );
  }

  const categories = ["All", "Real Estate", "Agriculture", "Reports", "Alerts", "Security"];

  const valueProps = [
    {
      icon: Clock,
      title: "Portfolio Setup",
      description:
        "Move from sign-in to the right portfolio in a guided, low-friction flow.",
    },
    {
      icon: UserCheck,
      title: "Role-Based Access",
      description:
        "Give owners, managers, and team members exactly the tools they need.",
    },
    {
      icon: Building,
      title: "Asset Coverage",
      description:
        "Track properties, land parcels, tenants, leases, and documents in one place.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Operations",
      description:
        "Protected sessions and clean reporting for sensitive operational data.",
    },
  ];

  const platformCards = [
    {
      title: "Real Estate Portfolio",
      category: "Real Estate",
      subtitle: "Vacancy, tenants, lease dates, maintenance",
      description:
        "Monitor occupied and vacant units, lease timelines, maintenance dates, and financial performance.",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    },
    {
      title: "Agriculture Portfolio",
      category: "Agriculture",
      subtitle: "Land parcels, crops, harvest cycles",
      description:
        "Manage acreage, seasonal crop data, revenue, expenses, and harvest planning in one workspace.",
      image:
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1200&q=80",
    },
    {
      title: "Reports & Exports",
      category: "Reports",
      subtitle: "PDF / CSV summaries",
      description:
        "Generate reports with filters, financial summaries, and shareable exports for stakeholders.",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    },
    {
      title: "Alerts & Notifications",
      category: "Alerts",
      subtitle: "Lease expiry, payments, maintenance",
      description:
        "Keep teams ahead of deadlines with proactive notifications for important events and follow-ups.",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
    },
    {
      title: "Security & Access",
      category: "Security",
      subtitle: "Authentication, RBAC, sessions",
      description:
        "Protect sensitive data with secure login, session handling, and role-based access.",
      image:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&q=80",
    },
  ];

  const visiblePlatformCards = platformCards.filter((card) => {
    const matchesCategory =
      selectedCategory === "All" || card.category === selectedCategory;
    const haystack = `${card.title} ${card.subtitle} ${card.description}`.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === "" || haystack.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const workflowSteps = [
    {
      step: "01",
      title: "Sign In",
      description:
        "Secure authentication opens the right workspace for the user.",
    },
    {
      step: "02",
      title: "Select Portfolio",
      description:
        "Choose real estate or agriculture and load the matching dashboard.",
    },
    {
      step: "03",
      title: "Manage Assets",
      description:
        "Track properties, land parcels, tenants, leases, documents, and finances.",
    },
    {
      step: "04",
      title: "Report & Act",
      description:
        "Export reports, follow alerts, and make decisions from a clean dashboard.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden selection:bg-[#c9a96e] selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        .grain-overlay::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
          opacity: 0.5;
        }

        .scroll-timeline {
          position: fixed;
          top: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, #c9a96e, #dfc08a, #c9a96e);
          z-index: 100;
          transition: width 0.1s linear;
          box-shadow: 0 0 10px rgba(201, 169, 110, 0.5);
        }

        .layered-text {
          position: relative;
          display: inline-block;
        }
        .layered-text::before {
          content: attr(data-text);
          position: absolute;
          left: 2px;
          top: 2px;
          color: rgba(201, 169, 110, 0.15);
          z-index: -1;
        }
        .layered-text::after {
          content: attr(data-text);
          position: absolute;
          left: 4px;
          top: 4px;
          color: rgba(201, 169, 110, 0.08);
          z-index: -2;
        }

        .glass-nav {
          background: rgba(10, 10, 10, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .gradient-border {
          position: relative;
          border-radius: 24px;
        }
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 25px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(201, 169, 110, 0.3), transparent, rgba(201, 169, 110, 0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out 2s infinite; }
        .animate-float-slow { animation: float 8s ease-in-out 1s infinite; }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201, 169, 110, 0.2); }
          50% { box-shadow: 0 0 40px rgba(201, 169, 110, 0.4); }
        }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 30s linear infinite; }

        @keyframes text-reveal {
          0% { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        .text-reveal { animation: text-reveal 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #c9a96e40; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #c9a96e80; }

        .video-modal {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
        }
      `}</style>

      <div className="scroll-timeline" style={{ width: `${scrollProgress}%` }} />
      <div className="grain-overlay" />

      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-[1px] bg-[#c9a96e]" />
            <Link href="/" className="flex items-center gap-2 group">
              <HomeIcon size={20} className="text-[#c9a96e]" />
              <span className="font-display text-xl font-light tracking-[0.2em] uppercase text-white/90 group-hover:text-[#c9a96e] transition-colors">
                PropFusion
              </span>
            </Link>
            <div className="w-8 h-[1px] bg-[#c9a96e]" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              ["Platform", "platform"],
              ["Workflow", "workflow"],
              ["Security", "security"],
              ["Contact", "contact"],
            ].map(([label, target]) => (
              <button
                key={label}
                onClick={() => scrollToSection(target)}
                className="font-body text-xs font-medium tracking-[0.15em] uppercase text-white/40 hover:text-[#c9a96e] transition-colors relative group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#c9a96e] group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs font-body tracking-wider uppercase text-white/50 hover:border-[#c9a96e]/50 hover:text-[#c9a96e] transition-all">
              <MapPin size={12} /> Global
            </button>
            {!isAuthed && (
              <Link
                href={signInHref}
                className="hidden sm:block font-body text-xs font-medium tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
            <Link href={getStartedHref}>
              <span className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-[#c9a96e] text-[#0a0a0a] font-body text-xs font-semibold tracking-[0.12em] uppercase rounded-full hover:bg-[#dfc08a] transition-all pulse-glow">
                Get Started <ArrowRight size={12} />
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white/70"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
            {[
              ["Platform", "platform"],
              ["Workflow", "workflow"],
              ["Security", "security"],
              ["Contact", "contact"],
            ].map(([label, target]) => (
              <button
                key={label}
                onClick={() => scrollToSection(target)}
                className="block w-full text-left font-body text-base text-white/70 hover:text-[#c9a96e] transition-colors py-2 tracking-[0.1em] uppercase"
              >
                {label}
              </button>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {!isAuthed && (
                <Link
                  href={signInHref}
                  className="font-body text-sm text-white/50 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              )}
              <Link
                href={getStartedHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#c9a96e] text-[#0a0a0a] font-body text-sm font-semibold tracking-[0.12em] uppercase rounded-full hover:bg-[#dfc08a] transition-all"
              >
                Get Started <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section
        ref={heroRef}
        id="home"
        className="relative min-h-screen flex items-center overflow-hidden pt-24"
      >
        <div
          className="absolute inset-0 z-0"
          style={{ transform: `translateY(${scrollY * 0.25}px)` }}
        >
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Aerial city skyline"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-[#0a0a0a]/65 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <StaggerContainer staggerDelay={120} className="space-y-8">
              <p className="font-body text-xs font-medium tracking-[0.3em] uppercase text-[#c9a96e]">
                Smart portfolio operations
              </p>

              <h1 className="font-display font-light leading-[0.92] tracking-tight max-w-4xl">
                <span className="block text-reveal" style={{ fontSize: "clamp(44px, 7vw, 118px)" }}>
                  YOUR PROPERTY
                </span>
                <span className="block text-reveal" style={{ fontSize: "clamp(44px, 7vw, 118px)", animationDelay: "0.15s" }}>
                  AND LAND DATA
                </span>
                <span
                  className="block layered-text text-[#c9a96e]"
                  data-text="IN ONE COMMAND CENTER"
                  style={{ fontSize: "clamp(44px, 7vw, 118px)", animationDelay: "0.3s" }}
                >
                  IN ONE COMMAND CENTER
                </span>
              </h1>

              <p className="font-body text-base lg:text-lg font-light text-white/55 max-w-2xl leading-relaxed">
                PropFusion is a portfolio management platform for real estate and agriculture. Track assets, leases, tenants, land parcels, reports, alerts, and financial performance in one secure workspace.
              </p>

              <div className="max-w-2xl">
                <div className={`flex items-center gap-3 p-2 rounded-2xl bg-white/[0.05] border backdrop-blur-xl transition-all duration-300 ${searchFocused ? "border-[#c9a96e]/40 bg-white/[0.08]" : "border-white/10"}`}>
                  <div className="flex items-center gap-2 pl-4 flex-1">
                    <Search size={18} className="text-white/40" />
                    <input
                      type="text"
                      placeholder="Search properties, parcels, reports, or alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="bg-transparent text-white font-body text-sm placeholder:text-white/30 focus:outline-none w-full"
                      aria-label="Search portfolio content"
                    />
                  </div>
                  <Link
                    href={getStartedHref}
                    className="flex-shrink-0 px-5 py-2.5 bg-[#c9a96e] text-[#0a0a0a] font-body text-sm font-semibold rounded-xl hover:bg-[#dfc08a] transition-all"
                  >
                    Explore
                  </Link>
                </div>
                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full font-body text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-[#c9a96e] text-[#0a0a0a]" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href={getStartedHref}>
                  <span className="inline-flex items-center gap-3 px-8 py-4 bg-[#c9a96e] text-[#0a0a0a] font-body text-sm font-semibold tracking-[0.12em] uppercase rounded-full hover:bg-[#dfc08a] transition-all pulse-glow">
                    Request Access <ArrowRight size={14} />
                  </span>
                </Link>
                <button onClick={() => setIsVideoModalOpen(true)} className="group flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#c9a96e] group-hover:bg-[#c9a96e]/10 transition-all">
                    <Play size={20} className="text-white group-hover:text-[#c9a96e] transition-colors ml-1" />
                  </div>
                  <span className="font-body text-sm tracking-wider uppercase text-white/60 group-hover:text-white transition-colors">
                    View platform preview
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] overflow-hidden">
                      <Image src={`https://i.pravatar.cc/150?img=${i + 10}`} alt="User" width={40} height={40} className="object-cover" sizes="40px" />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-display text-lg text-white">4 workflows</p>
                  <p className="font-body text-xs text-white/40">Real estate, agriculture, reports, alerts</p>
                </div>
              </div>
            </StaggerContainer>

            <div className="relative lg:pl-4">
              <StaggerContainer staggerDelay={110} baseDelay={100}>
                <GlassCard className="p-6 lg:p-8 gradient-border">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-body text-xs tracking-[0.2em] uppercase text-[#c9a96e]">Dashboard snapshot</p>
                      <p className="font-display text-2xl text-white">Portfolio at a glance</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">Live</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      ["Properties", "128 active"],
                      ["Lands", "42 parcels"],
                      ["Reports", "17 exported"],
                      ["Alerts", "9 pending"],
                    ].map(([label, value]) => (
                      <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="font-body text-xs text-white/40 uppercase tracking-[0.2em]">{label}</p>
                        <p className="font-display text-2xl text-white mt-2">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative h-52 rounded-3xl overflow-hidden mb-5">
                    <Image src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80" alt="Dashboard and reports" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3">
                      {[["NOI", "$62k"], ["Vacancy", "3.4%"], ["Yield", "8.2%"]].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 p-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</p>
                          <p className="font-display text-lg text-white mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="font-body text-sm text-white/45">
                    Designed for owners and operators who need one place to manage performance, compliance, and growth.
                  </p>
                </GlassCard>
              </StaggerContainer>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
      </section>

      <div className="border-y border-white/[0.06] py-5 overflow-hidden bg-[#0a0a0a] relative z-20">
        <div className="marquee-track flex items-center gap-12 whitespace-nowrap">
          {[
            "Portfolio Intelligence",
            "Lease Management",
            "Land Operations",
            "Financial Reports",
            "Alerts & Notifications",
            "Secure Access",
            "Portfolio Intelligence",
            "Lease Management",
            "Land Operations",
            "Financial Reports",
            "Alerts & Notifications",
            "Secure Access",
          ].map((item, i) => (
            <span key={i} className="font-body text-xs tracking-[0.3em] uppercase text-white/20 flex items-center gap-12">
              {item} <span className="text-[#c9a96e]/30">◆</span>
            </span>
          ))}
        </div>
      </div>

      <section id="platform" className="relative py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer staggerDelay={100} className="text-center mb-16">
            <p className="font-body text-xs tracking-[0.3em] uppercase text-[#c9a96e] mb-4">
              Platform highlights
            </p>
            <h2 className="font-display text-4xl lg:text-5xl font-light leading-tight mb-6">
              Built Around the Way PropFusion Actually Works
            </h2>
            <p className="font-body text-sm text-white/40 max-w-2xl mx-auto leading-relaxed">
              The landing page should promise a platform, not a property brochure: portfolio selection, dashboards, reporting, alerts, and secure access across real estate and agriculture.
            </p>
          </StaggerContainer>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop, i) => {
              const { ref, isVisible } = useScrollReveal(0.15);
              return (
                <div
                  key={prop.title}
                  ref={ref}
                  className="group text-center p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-[#c9a96e]/30 hover:bg-white/[0.04] transition-all duration-500"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(40px)",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#c9a96e]/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-[#c9a96e]/20 transition-colors">
                    <prop.icon size={28} className="text-[#c9a96e]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-body text-lg font-semibold text-white mb-3">{prop.title}</h3>
                  <p className="font-body text-sm text-white/50 leading-relaxed">{prop.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-white/45">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">{visiblePlatformCards.length} sections visible</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Filter: {selectedCategory}</span>
            {searchQuery && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Search: {searchQuery}</span>}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mt-10">
            {visiblePlatformCards.map((card, index) => (
              <PropertyCard
                key={card.title}
                image={card.image}
                title={card.title}
                location={card.subtitle}
                beds={index % 2 === 0 ? "Portfolio" : "Module"}
                baths={index % 2 === 0 ? "Overview" : "Workflow"}
                sqft={card.category}
                year="2026"
                description={card.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative py-28 px-6 lg:px-12 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer staggerDelay={100} className="text-center mb-16">
            <p className="font-body text-xs tracking-[0.3em] uppercase text-[#c9a96e] mb-4">Workflow</p>
            <h2 className="font-display text-4xl lg:text-5xl font-light leading-tight mb-6">From Sign-In to Insight in Four Steps</h2>
          </StaggerContainer>

          <div className="grid lg:grid-cols-4 gap-6">
            {workflowSteps.map((item, i) => {
              const { ref, isVisible } = useScrollReveal(0.15);
              return (
                <div
                  key={item.step}
                  ref={ref}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06]"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(30px)",
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <p className="font-body text-xs tracking-[0.3em] uppercase text-[#c9a96e] mb-4">{item.step}</p>
                  <h3 className="font-display text-2xl text-white mb-3">{item.title}</h3>
                  <p className="font-body text-sm text-white/50 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="security" className="relative py-28 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <StaggerContainer staggerDelay={100}>
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={16} className="text-[#c9a96e]" />
              <span className="font-body text-xs tracking-[0.2em] uppercase text-[#c9a96e]">Security & Reporting</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-light leading-tight mb-6">Built for Sensitive Operational Data</h2>
            <p className="font-body text-sm text-white/40 leading-relaxed mb-8 max-w-md">
              PropFusion should feel trustworthy and calm: secure access, clean audit trails, filtered reports, and reminders that keep teams ahead of lease expiries, payments, and maintenance.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[["Access", "RBAC"], ["Reports", "PDF / CSV"], ["Alerts", "Cron driven"], ["Sessions", "Encrypted"]].map(([label, value]) => (
                <GlassCard key={label} className="p-4">
                  <p className="font-body text-[10px] uppercase tracking-[0.25em] text-white/40">{label}</p>
                  <p className="font-display text-xl text-white mt-2">{value}</p>
                </GlassCard>
              ))}
            </div>
          </StaggerContainer>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: "We needed one place for leases, land, reporting, and alerts. PropFusion gives the team that operating view.",
                author: "Portfolio Manager",
                role: "Operations",
                image: "https://i.pravatar.cc/150?img=5",
              },
              {
                quote: "The product should feel premium but practical, with a clear path from login to the right dashboard.",
                author: "Project Stakeholder",
                role: "Product Review",
                image: "https://i.pravatar.cc/150?img=11",
              },
            ].map((item, i) => {
              const { ref, isVisible } = useScrollReveal(0.15);
              return (
                <div
                  key={item.author}
                  ref={ref}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06]"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(30px)",
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} size={14} className="text-[#c9a96e] fill-[#c9a96e]" />
                    ))}
                  </div>
                  <p className="font-body text-sm text-white/70 leading-relaxed mb-8">&ldquo;{item.quote}&rdquo;</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                      <Image src={item.image} alt={item.author} width={48} height={48} className="object-cover" sizes="48px" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-white">{item.author}</p>
                      <p className="font-body text-xs text-white/40">{item.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="relative py-24 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80" alt="Office overview" fill className="object-cover opacity-10" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <StaggerContainer staggerDelay={100}>
            <GlassCard className="gradient-border p-8 lg:p-16">
              <p className="font-body text-xs tracking-[0.3em] uppercase text-[#c9a96e] mb-4">Ready to build</p>
              <h2 className="font-display text-3xl lg:text-5xl font-light mb-4">Turn Portfolio Data Into Faster Decisions</h2>
              <p className="font-body text-sm text-white/40 mb-8 max-w-2xl mx-auto">
                Unified dashboards, automated alerts, and exportable reports so operators act with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={getStartedHref} className="px-8 py-4 bg-[#c9a96e] text-[#0a0a0a] font-body text-sm font-semibold tracking-[0.12em] uppercase rounded-full hover:bg-[#dfc08a] transition-all">
                  Request Access
                </Link>
                <Link href={signInHref} className="px-8 py-4 bg-white/5 border border-white/10 text-white font-body text-sm font-medium tracking-[0.12em] uppercase rounded-full hover:bg-white/10 transition-all">
                  Sign In
                </Link>
              </div>
            </GlassCard>
          </StaggerContainer>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 lg:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[1px] bg-[#c9a96e]" />
                <span className="font-display text-xl font-light tracking-[0.2em] uppercase text-white/90">PropFusion</span>
              </div>
              <p className="font-body text-sm text-white/40 leading-relaxed mb-6">
                A portfolio management platform for real estate and agriculture assets.
              </p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <button key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#c9a96e] hover:border-[#c9a96e]/30 transition-all" aria-label="Social link">
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-body text-xs tracking-[0.2em] uppercase text-white/60 mb-6">Navigation</h4>
              <div className="space-y-4">
                {[["Platform", "platform"], ["Workflow", "workflow"], ["Security", "security"], ["Contact", "contact"]].map(([label, target]) => (
                  <button key={label} onClick={() => scrollToSection(target)} className="block font-body text-sm text-white/40 hover:text-[#c9a96e] transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-body text-xs tracking-[0.2em] uppercase text-white/60 mb-6">Modules</h4>
              <div className="space-y-4">
                {["Real Estate Dashboard", "Agriculture Dashboard", "Reports & Exports", "Notifications"].map((item) => (
                  <span key={item} className="block font-body text-sm text-white/40">{item}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-body text-xs tracking-[0.2em] uppercase text-white/60 mb-6">Stay in the loop</h4>
              <p className="font-body text-sm text-white/40 mb-6">Use the design system to keep the landing page focused on product clarity, trust, and conversion.</p>
              <div className="relative mb-6">
                <input type="text" placeholder="Request a demo" className="w-full pl-4 pr-12 py-3 rounded-full bg-white/5 border border-white/10 text-white font-body text-sm placeholder:text-white/30 focus:outline-none focus:border-[#c9a96e]/50 transition-all" aria-label="Request a demo" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#c9a96e] flex items-center justify-center">
                  <ArrowRight size={14} className="text-[#0a0a0a]" />
                </button>
              </div>
              <div className="flex gap-4">
                <Link href={signInHref} className="font-body text-xs text-white/40 hover:text-[#c9a96e] transition-colors">Sign In</Link>
                <Link href={getStartedHref} className="font-body text-xs text-white/40 hover:text-[#c9a96e] transition-colors">Get Started</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-xs text-white/20">© {new Date().getFullYear()} PropFusion. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[1px] bg-[#c9a96e]" />
              <span className="font-body text-xs text-white/30 tracking-wider">PROPFUSION</span>
              <div className="w-6 h-[1px] bg-[#c9a96e]" />
            </div>
          </div>
        </div>
      </footer>

      {isVideoModalOpen && (
        <div className="video-modal fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsVideoModalOpen(false)}>
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black">
            <button onClick={() => setIsVideoModalOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all" aria-label="Close video">
              <X size={20} />
            </button>
            <video src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4" autoPlay controls className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
