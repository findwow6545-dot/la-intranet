'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, Search, Trash2, X, CheckCircle2, User, Clock, Paperclip, FileImage, Video, Loader2, Edit2 } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  createdAt: any;
}

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const emptyForm = { title: '', content: '', author: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getAttachmentType = (type: string) => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let attachmentUrl = '';
    let attachmentType = '';

    try {
      if (file) {
        const storageRef = ref(storage, `board/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        attachmentUrl = await getDownloadURL(uploadTask.ref);
        attachmentType = getAttachmentType(file.type);
      }

      const savePayload: any = { ...formData };
      if (file) {
        savePayload.attachmentUrl = attachmentUrl;
        savePayload.attachmentType = attachmentType;
      }

      if (editingId) {
        await updateDoc(doc(db, 'board', editingId), savePayload);
        showToast('게시글이 성공적으로 수정되었습니다!');
      } else {
        await addDoc(collection(db, 'board'), { 
          ...savePayload,
          createdAt: serverTimestamp() 
        });
        showToast('게시글이 성공적으로 등록되었습니다!');
      }

      setIsFormOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      setFile(null);
    } catch (err) {
      console.error(err);
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (e: React.MouseEvent, p: Post) => {
    e.stopPropagation();
    setFormData({ title: p.title, content: p.content, author: p.author });
    setEditingId(p.id);
    setFile(null); // 수정 시 기존 파일은 유지되나, UI 표시는 복잡하므로 새로 덮어쓸 파일만 받도록 함
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`"${title}" 게시글을 정말 삭제하시겠습니까?`)) return;
    await deleteDoc(doc(db, 'board', id));
    if (selectedPost?.id === id) setSelectedPost(null);
    showToast('게시글이 삭제되었습니다.');
  };

  const filteredPosts = posts.filter(p => p.title.includes(searchTerm) || p.content.includes(searchTerm));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
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
          <p className="text-slate-500 mt-1 text-sm">첨부파일(이미지, 영상)과 함께 게시글을 남길 수 있습니다.</p>
        </div>
        <button onClick={() => {
            setIsFormOpen(!isFormOpen);
            if (!isFormOpen) { setFormData(emptyForm); setEditingId(null); setFile(null); }
          }} 
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2" disabled={isUploading}
        >
          {isFormOpen ? <X size={18} /> : <Plus size={18} />} {isFormOpen ? '닫기' : '글쓰기'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h2 className="text-lg font-bold mb-4">{editingId ? '게시글 수정' : '새 게시글 작성'}</h2>
            <div className="space-y-4">
              <input required placeholder="제목" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} disabled={isUploading}/>
              <input required placeholder="작성자 이름" className="input-field" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} disabled={isUploading}/>
              <textarea required placeholder="내용을 입력하세요..." className="input-field h-32 resize-none" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} disabled={isUploading}/>
              
              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl relative hover:bg-slate-50 transition">
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading}/>
                <div className="flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                  {file ? (
                     <div className="font-bold text-blue-600 flex items-center gap-2"><Paperclip size={18}/> {file.name}</div>
                  ) : (
                     <>
                      <FileImage size={24} className="mb-2 text-slate-400" />
                      <p className="text-sm font-bold">새 파일 첨부 (수정 시 미선택하면 기존 파일 유지)</p>
                      <p className="text-xs mt-1">(최대 1개 파일, 파이어베이스 스토리지에 저장)</p>
                     </>
                  )}
                </div>
              </div>

              <button type="submit" className="bg-blue-600 text-white w-full py-4 rounded-xl font-black flex items-center justify-center gap-2" disabled={isUploading}>
                {isUploading && <Loader2 size={18} className="animate-spin" />}
                {isUploading ? '저장 중...' : (editingId ? '게시글 수정 완료' : '게시글 등록하기')}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input type="text" placeholder="제목이나 내용으로 검색..." className="input-field pl-12 h-14" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filteredPosts.map(post => (
          <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">{post.title}</h3>
              <div className="flex gap-1">
                <button onClick={(e) => handleEdit(e, post)} className="text-slate-300 hover:text-blue-500 transition p-1"><Edit2 size={16} /></button>
                <button onClick={(e) => handleDelete(e, post.id, post.title)} className="text-slate-300 hover:text-red-500 transition p-1"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <p className="text-slate-600 text-sm line-clamp-2 mb-4">{post.content}</p>
            
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 border-t border-slate-50 pt-4 mt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded-md text-slate-600"><User size={12} /> {post.author}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {post.createdAt?.toDate?.()?.toLocaleDateString?.() || '상세 보기'}</span>
              </div>
              {post.attachmentUrl && (
                <span className="flex items-center gap-1 text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-md">
                   {post.attachmentType === 'video' ? <Video size={14}/> : <FileImage size={14}/>} 첨부됨
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredPosts.length === 0 && <p className="text-center text-slate-400 py-10 w-full">조건에 맞는 게시글이 없습니다.</p>}
      </div>

      {selectedPost && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white max-w-2xl w-full rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2 mr-4">{selectedPost.title}</h2>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><User size={14} className="text-blue-600"/> {selectedPost.author}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Clock size={14}/> {selectedPost.createdAt?.toDate?.()?.toLocaleString?.() || '최근'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { setSelectedPost(null); handleEdit(e, selectedPost!); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm flex items-center gap-1 transition"><Edit2 size={16}/> 수정</button>
                  <button onClick={() => setSelectedPost(null)} className="p-2 bg-slate-200/50 text-slate-500 rounded-lg hover:bg-slate-200 transition"><X size={20}/></button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap mb-8">{selectedPost.content}</p>
                
                {selectedPost.attachmentUrl && (
                  <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 p-2">
                    {selectedPost.attachmentType === 'image' && (
                      <img src={selectedPost.attachmentUrl} alt="첨부 이미지" className="w-full h-auto rounded-xl max-h-[500px] object-contain bg-black/5" />
                    )}
                    {selectedPost.attachmentType === 'video' && (
                      <video src={selectedPost.attachmentUrl} controls className="w-full h-auto rounded-xl max-h-[500px] bg-black" />
                    )}
                    {selectedPost.attachmentType === 'file' && (
                      <a href={selectedPost.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-300 text-blue-600 font-bold transition">
                        <Paperclip size={24} /> 일반 파일 다운로드 (새 탭에서 열기)
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
