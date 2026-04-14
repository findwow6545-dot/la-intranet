'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, Search, Trash2, Edit2, X, CheckCircle2, User, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: any;
}

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({ title: '', content: '', author: '' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'board'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'board'), { ...formData, createdAt: serverTimestamp() });
      showToast('게시글이 등록되었습니다!');
      setIsFormOpen(false);
      setFormData({ title: '', content: '', author: '' });
    } catch (err) {
      showToast('등록 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 게시글을 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'board', id));
    showToast('게시글이 삭제되었습니다.');
  };

  const filteredPosts = posts.filter(p => p.title.includes(searchTerm) || p.content.includes(searchTerm));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><ClipboardList className="text-blue-600 w-8 h-8" /> 공지 및 게시판</h1>
          <p className="text-slate-500 mt-1 text-sm">연구실 주요 공지와 정보를 공유합니다.</p>
        </div>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2">
          {isFormOpen ? <X size={18} /> : <Plus size={18} />} {isFormOpen ? '닫기' : '글쓰기'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4">새 게시글 작성</h2>
            <div className="space-y-4">
              <input required placeholder="제목" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <input required placeholder="작성자 이름" className="input-field" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              <textarea required placeholder="내용을 입력하세요..." className="input-field h-32 resize-none" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              <button type="submit" className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold">등록하기</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input type="text" placeholder="제목이나 내용으로 검색..." className="input-field pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filteredPosts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-slate-900">{post.title}</h3>
              <button onClick={() => handleDelete(post.id, post.title)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
            </div>
            <p className="text-slate-600 text-sm whitespace-pre-wrap mb-4">{post.content}</p>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-50 pt-4 mt-2">
              <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {post.createdAt?.toDate().toLocaleDateString() || '방금 전'}</span>
            </div>
          </div>
        ))}
        {filteredPosts.length === 0 && <p className="text-center text-slate-400 py-10">게시글이 없습니다.</p>}
      </div>
    </div>
  );
}
