'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ClipboardList, BookOpen, Calendar, ArrowRight, Sparkles, MessageSquare, Send, User } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: any;
}

export default function Home() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GuestMessage[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'guestbook'), {
        name: newName,
        message: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    { 
      title: "공지 및 게시판", desc: "연구실 주요 공지와 정보 공유", icon: ClipboardList, href: "/board", color: "bg-blue-600", shadow: "shadow-blue-900/10"
    },
    { 
      title: "데이터 라이브러리", desc: "연구 논문 및 프로젝트 데이터셋 보관", icon: BookOpen, href: "/library", color: "bg-amber-600", shadow: "shadow-amber-900/10"
    },
    { 
      title: "일정 및 미팅", desc: "주간 세미나 및 연구실 행사 일정", icon: Calendar, href: "/schedule", color: "bg-rose-600", shadow: "shadow-rose-900/10"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Interactive Hero Header */}
      <section className="relative bg-[#1A3D18] text-white pt-24 pb-32 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[120px] mix-blend-screen pointer-events-none" />
          <motion.div animate={{ x: [0, -60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-teal-400/20 blur-[150px] mix-blend-screen pointer-events-none" />
          <motion.div animate={{ x: [0, 30, 0], y: [0, 50, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-lime-500/10 blur-[100px] mix-blend-screen pointer-events-none" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="flex items-center gap-2 mb-8">
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-2 border border-white/20 shadow-xl shadow-black/10">
                <Sparkles size={14} className="text-emerald-300" /> Laboratory Intranet
              </span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-6 leading-[1.1] tracking-tighter drop-shadow-2xl">
              Landscape Architecture<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 to-teal-300">Expression Lab</span>
            </h1>
            <p className="text-emerald-50/80 text-lg md:text-xl max-w-2xl font-medium leading-relaxed drop-shadow-md">
              조경표현연구실 통합 시스템입니다.<br />
              연구원들의 데이터와 협업을 위한 지식 허브에 오신 것을 환영합니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 pb-20 relative z-20 flex flex-col xl:flex-row gap-8 items-start">
        
        {/* Left Side: Menus */}
        <div className="w-full xl:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item, i) => (
            <Link href={item.href} key={i} className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] h-full flex flex-col cursor-pointer group border border-white/50 hover:border-emerald-500/30 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]"
              >
                <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={30} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black mb-3 text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed font-medium">
                  {item.desc}
                </p>
                <div className="flex items-center text-emerald-600 font-bold text-sm gap-2 mt-auto">
                  접속하기 <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Right Side: Guestbook */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="w-full xl:w-1/3 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[600px] overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-inner"><MessageSquare size={18} fill="currentColor" /></div>
            <div>
              <h3 className="font-black text-slate-800 text-lg">연구실 방명록</h3>
              <p className="text-xs text-emerald-600 font-bold">누구나 자유롭게 남기는 소통 공간</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar relative">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 mt-10 text-sm font-medium">첫 번째 방명록을 남겨주세요! 👋</div>
            )}
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><User size={14} className="text-slate-400"/> {msg.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {msg.createdAt?.toDate?.()?.toLocaleDateString?.('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || '방금 전'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 mb-2">
              <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="이름 (필수)" className="w-1/3 bg-slate-100 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition font-medium" disabled={isSubmitting}/>
              <input required value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="출석체크, 인사말 등..." className="flex-1 bg-slate-100 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition font-medium" disabled={isSubmitting}/>
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white w-12 rounded-xl flex items-center justify-center transition disabled:opacity-50">
                <Send size={18} className="translate-x-[-2px] translate-y-[1px]" />
              </button>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
