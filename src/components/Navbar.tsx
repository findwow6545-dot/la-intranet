'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X, Users, ClipboardList, BookOpen, Calendar, Home, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const navLinks = [
    { label: '홈', href: '/', icon: Home },
    { label: '연구생 명부', href: '/members', icon: Users },
    { label: '게시판', href: '/board', icon: ClipboardList },
    { label: '자료실', href: '/library', icon: BookOpen },
    { label: '일정', href: '/schedule', icon: Calendar },
  ];

  if (isAdmin) {
    navLinks.push({ label: '관리자', href: '/admin', icon: Shield });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#2d5a27] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none">조경표현연구실</p>
              <p className="text-[10px] text-slate-400 font-medium">LA Expression Lab</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                    ${isActive
                      ? 'bg-[#2d5a27] text-white shadow-lg shadow-emerald-900/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              );
            })}
            
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />

            {user ? (
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#2d5a27] hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <LogIn size={16} />
                로그인
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 pt-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3
                    ${isActive
                      ? 'bg-[#2d5a27] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              );
            })}
            
            <div className="pt-2">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all flex items-center gap-3"
                >
                  <LogOut size={18} />
                  로그아웃
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold text-[#2d5a27] hover:bg-emerald-50 transition-all flex items-center gap-3"
                >
                  <LogIn size={18} />
                  로그인
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
