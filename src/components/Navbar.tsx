'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Menu, X, Users, ClipboardList, BookOpen, Calendar, Home } from 'lucide-react';

const navLinks = [
  { label: '홈', href: '/', icon: Home },
  { label: '회원 명부', href: '/members', icon: Users },
  { label: '게시판', href: '/board', icon: ClipboardList },
  { label: '자료실', href: '/library', icon: BookOpen },
  { label: '일정', href: '/schedule', icon: Calendar },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          </div>
        )}
      </div>
    </nav>
  );
}
