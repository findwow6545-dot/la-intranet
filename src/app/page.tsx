'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { GraduationCap, BookOpen, Calendar, ArrowRight, Sparkles, MessageSquare, Send, User, Maximize2, X } from 'lucide-react';
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
  const [isGuestbookExpanded, setIsGuestbookExpanded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'), limit(50));
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
      title: "스터디 게시판", desc: "연구실 학습 자료 및 정보 공유", icon: GraduationCap, href: "/study", color: "bg-blue-600", shadow: "shadow-blue-900/10"
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

        {/* Right Side: Mini Guestbook (Teaser) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="w-full xl:w-1/3 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[500px] overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-inner"><MessageSquare size={18} fill="currentColor" /></div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">연구실 방명록</h3>
                <p className="text-xs text-emerald-600 font-bold">자유롭게 남기는 소통 공간</p>
              </div>
            </div>
            <button onClick={() => setIsGuestbookExpanded(true)} className="p-2 text-emerald-600 bg-white/50 border border-emerald-200 hover:bg-white hover:shadow-sm rounded-xl transition flex items-center gap-2 text-xs font-bold px-3">
              <Maximize2 size={14} /> 전체화면
            </button>
          </div>
          
          <div className="flex-1 overflow-y-hidden relative bg-slate-50/50">
            {/* Fade out bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50/90 to-transparent z-10 pointer-events-none"></div>
            <div className="px-6 pt-6 pb-20 space-y-4">
              {messages.slice(0, 4).map(msg => (
                <div key={msg.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5"><User size={12} className="text-slate-400"/> {msg.name}</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div onClick={() => setIsGuestbookExpanded(true)} className="p-5 bg-white border-t border-slate-100 cursor-text group relative z-20">
            <div className="flex gap-2">
              <div className="bg-slate-100 text-sm rounded-xl px-4 py-3 text-emerald-600/70 font-bold flex-1 flex justify-between items-center group-hover:bg-emerald-50 transition border border-transparent group-hover:border-emerald-200">
                <span>인사말 남기기... (여기를 클릭하세요)</span> <Maximize2 size={16} />
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Expanded FULL SCREEN Guestbook Modal */}
      <AnimatePresence>
        {isGuestbookExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white max-w-4xl w-full h-full md:h-[90vh] rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
              
              {/* Header */}
              <div className="p-6 md:px-10 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-inner"><MessageSquare size={20} fill="currentColor" /></div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl">전체 방명록</h3>
                    <p className="text-sm text-emerald-600 font-bold">이곳에 방문을 기록하고 인사를 남겨보세요.</p>
                  </div>
                </div>
                <button onClick={() => setIsGuestbookExpanded(false)} className="p-3 bg-white border border-emerald-100 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition shadow-sm"><X size={24}/></button>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-slate-50 relative custom-scrollbar flex flex-col-reverse">
                 {/* Empty State */}
                 {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-10 text-sm font-medium">등록된 방명록이 없습니다.</div>
                 )}
                 <div>
                    <AnimatePresence initial={false}>
                      {messages.map((msg, idx) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 ml-auth inline-block w-full max-w-2xl`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-black text-base text-slate-800 flex items-center gap-2"><User size={16} className="text-slate-400"/> {msg.name}</span>
                            <span className="text-xs text-slate-400 font-medium">
                              {msg.createdAt?.toDate?.()?.toLocaleString?.('ko-KR', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || '방금 전'}
                            </span>
                          </div>
                          <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
              </div>

              {/* Big Input Form */}
              <form onSubmit={handleSendMessage} className="p-6 md:p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
                 <div className="flex flex-col md:flex-row gap-4 items-start">
                   <div className="w-full md:w-1/4">
                     <label className="text-xs font-bold text-slate-500 mb-1.5 block">작성자 이름 필명</label>
                     <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="당신의 이름은?" className="w-full bg-slate-50 font-bold text-base rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition border border-slate-200 focus:border-emerald-400" disabled={isSubmitting}/>
                   </div>
                   <div className="w-full md:w-3/4">
                     <label className="text-xs font-bold text-slate-500 mb-1.5 block">남길 이야기 정성껏 작성해주세요</label>
                     <div className="relative">
                       <textarea required value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="연구실 사람들에게 남기고 싶은 인사를 자유롭게 써주세요!" className="w-full h-[120px] resize-none bg-slate-50 text-base font-medium rounded-2xl px-5 py-4 pr-[80px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition border border-slate-200 focus:border-emerald-400 custom-scrollbar" disabled={isSubmitting}/>
                       <button type="submit" disabled={isSubmitting} className="absolute right-4 bottom-4 bg-emerald-600 hover:bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 hover:scale-105 active:scale-95">
                          <Send size={24} className="translate-x-[-1px] translate-y-[2px]" />
                       </button>
                     </div>
                   </div>
                 </div>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
