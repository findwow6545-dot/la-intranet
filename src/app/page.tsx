'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, ClipboardList, BookOpen, Calendar, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const menuItems = [
    { 
      title: "연구실 연구생 명부", 
      desc: "연구원 정보 관리 및 데이터베이스 조회", 
      icon: Users, 
      href: "/members", 
      color: "bg-emerald-600",
      shadow: "shadow-emerald-900/10"
    },
    { 
      title: "공지 및 게시판", 
      desc: "연구실 주요 공지와 정보 공유", 
      icon: ClipboardList, 
      href: "/board", 
      color: "bg-blue-600",
      shadow: "shadow-blue-900/10"
    },
    { 
      title: "데이터 라이브러리", 
      desc: "연구 논문 및 프로젝트 데이터셋 보관", 
      icon: BookOpen, 
      href: "/library", 
      color: "bg-amber-600",
      shadow: "shadow-amber-900/10"
    },
    { 
      title: "일정 및 미팅", 
      desc: "주간 세미나 및 연구실 행사 일정", 
      icon: Calendar, 
      href: "/schedule", 
      color: "bg-rose-600",
      shadow: "shadow-rose-900/10"
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="bg-[#2d5a27] text-white pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 border border-white/10">
                <Sparkles size={12} className="text-emerald-300" /> Laboratory Intranet
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
              Landscape Architecture<br />
              Expression Lab
            </h1>
            <p className="text-emerald-100/70 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
              조경표현연구실 통합 인트라넷 시스템입니다.<br />
              연구원들의 데이터와 협업을 위한 지식 허브에 오신 것을 환영합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Menu Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, i) => (
            <Link href={item.href} key={i}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-card p-8 rounded-[2rem] h-full flex flex-col cursor-pointer group bg-white hover:border-emerald-500/30 transition-all shadow-xl shadow-black/5"
              >
                <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl ${item.shadow} group-hover:scale-110 transition-transform`}>
                  <item.icon size={28} />
                </div>
                <h3 className="text-2xl font-black mb-3 text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm mb-8 flex-1 leading-relaxed">
                  {item.desc}
                </p>
                <div className="flex items-center text-emerald-700 font-black text-sm gap-2">
                  접속하기 <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
          © 2026 Landscape Architecture Expression Lab.
        </p>
        <div className="flex gap-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-emerald-700">Privacy</a>
          <a href="#" className="hover:text-emerald-700">Terms</a>
          <a href="#" className="hover:text-emerald-700">Support</a>
        </div>
      </footer>
    </div>
  );
}
