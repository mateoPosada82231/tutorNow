"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
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

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isTutor = user?.role === "TUTOR";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/login");
  }

  const navLinkClass = (href: string) =>
    `hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 sm:inline-flex ${
      pathname === href
        ? "bg-brand-poli/10 text-brand-poli"
        : "text-text-muted hover:text-brand-poli"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border-color bg-bg-surface shadow-sm transition-colors duration-300">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
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
          <span className="hidden text-xs font-medium text-text-muted md:block">
            Politecnico JIC
          </span>
        </Link>

        <nav
          className="ml-6 flex items-center gap-1"
          aria-label="Navegacion principal"
        >
          <Link href="/dashboard" className={navLinkClass("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Panel
          </Link>
          {isTutor && (
            <Link href="/tutoring" className={navLinkClass("/tutoring")}>
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              Panel de tutor
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu de usuario"
              className="flex min-h-[44px] items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors duration-200 hover:bg-brand-poli/10 focus:outline-none focus:ring-2 focus:ring-brand-poli"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] text-sm font-bold text-white shadow-md">
                {initialsOf(user?.fullName)}
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-text-main sm:block">
                {user?.fullName?.split(" ")[0]}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-text-muted transition-transform duration-200 ${
                  menuOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border-color bg-bg-surface py-1 shadow-xl transition-colors duration-300"
              >
                <div className="border-b border-border-color px-4 py-3">
                  <p className="truncate text-sm font-semibold text-text-main">
                    {user?.fullName ?? "Usuario"}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {user?.email}
                  </p>
                  <span className="mt-2 inline-flex items-center rounded-full bg-brand-poli/10 px-2.5 py-0.5 text-xs font-semibold text-brand-poli">
                    {isTutor
                      ? "Tutor"
                      : user?.role === "ADMIN"
                        ? "Administrador"
                        : "Estudiante"}
                  </span>
                </div>

                <Link
                  href="/profile"
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main transition-colors duration-150 hover:bg-brand-poli/10"
                >
                  <User
                    className="h-4 w-4 text-text-muted"
                    aria-hidden="true"
                  />
                  Mi perfil
                </Link>
                {isTutor && (
                  <Link
                    href="/tutoring"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main transition-colors duration-150 hover:bg-brand-poli/10"
                  >
                    <BookOpenCheck
                      className="h-4 w-4 text-text-muted"
                      aria-hidden="true"
                    />
                    Panel de tutor
                  </Link>
                )}
                <Link
                  href="/settings/password"
                  role="menuitem"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main transition-colors duration-150 hover:bg-brand-poli/10"
                >
                  <KeyRound
                    className="h-4 w-4 text-text-muted"
                    aria-hidden="true"
                  />
                  Cambiar contrasena
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors duration-150 hover:bg-error/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
