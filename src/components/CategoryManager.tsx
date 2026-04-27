'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, Edit2, X, CheckCircle2, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface CategoryManagerProps {
  categories: string[];
  fallbackCategory: string;
  addCategory: (name: string) => Promise<boolean>;
  deleteCategory: (name: string) => Promise<number>;
  renameCategory: (oldName: string, newName: string) => Promise<boolean>;
  accentColor?: string;
}

export default function CategoryManager({ categories, fallbackCategory, addCategory, deleteCategory, renameCategory, accentColor = 'blue' }: CategoryManagerProps) {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isAdmin) return null;

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProcessing('add');
    const ok = await addCategory(trimmed);
    setProcessing(null);
    if (ok) {
      showMsg(`"${trimmed}" 카테고리가 추가되었습니다.`);
      setNewName('');
    } else {
      showMsg('이미 존재하는 카테고리입니다.', 'error');
    }
  };

  const handleDelete = async (cat: string) => {
    if (cat === fallbackCategory) {
      showMsg(`"${cat}"는 기본 카테고리이므로 삭제할 수 없습니다.`, 'error');
      return;
    }
    if (!confirm(`"${cat}" 카테고리를 삭제하시겠습니까?\n\n해당 카테고리의 게시글은 "${fallbackCategory}"(으)로 자동 이동됩니다.`)) return;
    setProcessing(cat);
    const movedCount = await deleteCategory(cat);
    setProcessing(null);
    if (movedCount > 0) {
      showMsg(`"${cat}" 삭제 완료. ${movedCount}개 게시글이 "${fallbackCategory}"(으)로 이동되었습니다.`);
    } else {
      showMsg(`"${cat}" 카테고리가 삭제되었습니다.`);
    }
  };

  const handleRename = async (oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCat(null);
      return;
    }
    setProcessing(oldName);
    const ok = await renameCategory(oldName, trimmed);
    setProcessing(null);
    if (ok) {
      showMsg(`"${oldName}" → "${trimmed}" 변경 완료 (게시글도 자동 반영)`);
      setEditingCat(null);
    } else {
      showMsg('이미 존재하는 이름입니다.', 'error');
    }
  };

  const accentBg = accentColor === 'amber' ? 'bg-amber-600' : accentColor === 'teal' ? 'bg-teal-600' : 'bg-blue-600';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
        title="카테고리 관리"
      >
        <Settings size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Tag size={20}/> 카테고리 관리</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition"><X size={20}/></button>
              </div>

              {/* 메시지 */}
              <AnimatePresence>
                {message && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6 space-y-2 max-h-[50vh] overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition">
                    {editingCat === cat ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(cat)}
                          autoFocus
                        />
                        <button onClick={() => handleRename(cat)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" disabled={processing === cat}>
                          {processing === cat ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                        </button>
                        <button onClick={() => setEditingCat(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition"><X size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                          <Tag size={14} className="text-slate-400"/> {cat}
                          {cat === fallbackCategory && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">기본</span>}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {processing === cat ? (
                            <Loader2 size={16} className="animate-spin text-slate-400 m-1.5"/>
                          ) : (
                            <>
                              <button onClick={() => { setEditingCat(cat); setEditName(cat); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="이름 변경"><Edit2 size={14}/></button>
                              {cat !== fallbackCategory && (
                                <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="삭제"><Trash2 size={14}/></button>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {categories.length === 0 && (
                  <p className="text-center text-slate-400 py-6 text-sm">카테고리가 없습니다.</p>
                )}
              </div>

              {/* 새 카테고리 추가 */}
              <div className="p-6 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    placeholder="새 카테고리 이름"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim() || processing === 'add'}
                    className={`${accentBg} text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50`}
                  >
                    {processing === 'add' ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>} 추가
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
