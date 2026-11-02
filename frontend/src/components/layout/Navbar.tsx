"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  User,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatUnreadStore } from "@/features/chat/stores/useChatUnreadStore";
import { useChatUnreadSync } from "@/features/chat/hooks/useChatUnreadSync";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return "?";
  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type NavLinkItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};
type NavActionItem = {
  action: () => void;
  icon: React.ElementType;
  label: string;
  danger?: boolean;
};
type NavItem = NavLinkItem | NavActionItem;

export function Navbar() {
  useChatUnreadSync();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isTutor = user?.role === "TUTOR";
  const totalUnread = useChatUnreadStore((state) => state.getTotal());

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [userMenuOpen]);

  function handleLogout() {
    setUserMenuOpen(false);
    logout();
    router.push("/login");
  }

  const navItems: NavLinkItem[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Panel" },
    { href: "/tutoring/requests/new", icon: MessageSquare, label: "Publicar asesoría" },
    { href: "/tutoring/requests", icon: MessageSquare, label: "Mis asesorías" },
    ...(isTutor ? [{ href: "/tutoring/explore", icon: BookOpenCheck, label: "Explorar asesorías" }] : []),
    { href: "/tutoring/chats", icon: MessageSquare, label: "Chats", badge: totalUnread },
    ...(isTutor ? [{ href: "/tutoring", icon: BookOpenCheck, label: "Panel de tutor" }] : []),
  ];

  const userItems: NavItem[] = [
    { href: "/profile", icon: User, label: "Mi perfil" },
    { href: "/tutoring/requests/new", icon: MessageSquare, label: "Publicar asesoría" },
    { href: "/tutoring/requests", icon: MessageSquare, label: "Mis asesorías" },
    ...(isTutor ? [{ href: "/tutoring/explore", icon: BookOpenCheck, label: "Explorar asesorías" }] : []),
    { href: "/tutoring/chats", icon: MessageSquare, label: "Chats", badge: totalUnread },
    ...(isTutor ? [{ href: "/tutoring", icon: BookOpenCheck, label: "Panel de tutor" }] : []),
    { href: "/dev/inbox", icon: Inbox, label: "Bandeja simulada" },
    { href: "/settings/password", icon: KeyRound, label: "Cambiar contraseña" },
    { action: handleLogout, icon: LogOut, label: "Cerrar sesión", danger: true },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border-color bg-bg-surface/80 backdrop-blur-sm shadow-sm transition-colors duration-300">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          {/* Logo */}
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <Image
              src="/logo-pjic.png"
              alt="Politecnico Jaime Isaza Cadavid"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-cover shadow-sm transition-transform duration-200 group-hover:scale-105"
              priority
            />
            <span className="text-xl font-bold text-brand-poli">tutorNow</span>
          </Link>

          {/* Desktop main navigation – hover dropdown */}
          <div className="hidden md:block ml-6 relative group">
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={false}
              aria-label="Menú principal"
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:text-brand-poli hover:bg-brand-poli/10 transition-colors duration-200"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Menú</span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-border-color bg-bg-surface py-1 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm text-text-main transition-colors duration-150 hover:bg-brand-poli/10 ${
                    pathname.startsWith(item.href) ? "bg-brand-poli/10 text-brand-poli" : ""
                  }`}
                >
                  <item.icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-[18px] items-center justify-center rounded-full bg-brand-poli px-1.5 text-[10px] font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden ml-auto">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              className="flex min-h-[44px] items-center justify-center rounded-lg p-2 text-text-muted hover:text-brand-poli hover:bg-brand-poli/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Theme toggle + user avatar */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />

            {/* User avatar dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Menú de usuario"
                data-testid="user-menu-button"
                className="flex min-h-[44px] items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-sm font-bold text-white shadow-md">
                  {initialsOf(user?.fullName)}
                </span>
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-text-main sm:block">
                  {user?.fullName?.split(" ")[0]}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-text-muted transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border-color bg-bg-surface py-1 shadow-xl transition-colors duration-300"
                >
                  <div className="border-b border-border-color px-4 py-3">
                    <p className="truncate text-sm font-semibold text-text-main">{user?.fullName ?? "Usuario"}</p>
                    <p className="truncate text-xs text-text-muted">{user?.email}</p>
                    <span className="mt-2 inline-flex items-center rounded-full bg-brand-poli/10 px-2.5 py-0.5 text-xs font-semibold text-brand-poli">
                      {isTutor ? "Tutor" : user?.role === "ADMIN" ? "Administrador" : "Estudiante"}
                    </span>
                  </div>
                  {userItems.map((item, idx) =>
                    "href" in item ? (
                      <Link
                        key={idx}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main transition-colors duration-150 hover:bg-brand-poli/10"
                      >
                        <item.icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="ml-auto flex h-5 min-w-[18px] items-center justify-center rounded-full bg-brand-poli px-1.5 text-[10px] font-bold text-white">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <button
                        key={idx}
                        type="button"
                        role="menuitem"
                        onClick={item.action}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                          item.danger ? "text-error hover:bg-error/10" : "text-text-main hover:bg-brand-poli/10"
                        }`}
                      >
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer - rendered at root level, not inside header */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex flex-col bg-bg-surface"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="relative z-10 flex flex-col w-full max-w-sm bg-bg-surface border-r border-border-color">
            <div className="flex h-16 items-center justify-between border-b border-border-color px-4">
              <span className="text-lg font-semibold text-text-main">Menú</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-text-muted hover:text-brand-poli"
                aria-label="Cerrar menú"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-brand-poli/10 text-brand-poli"
                      : "text-text-muted hover:bg-brand-poli/10 hover:text-brand-poli"
                  }`}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-[18px] items-center justify-center rounded-full bg-brand-poli px-1.5 text-[10px] font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}