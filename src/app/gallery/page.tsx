'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, X, CheckCircle2, Trash2, Loader2, ChevronLeft, ChevronRight, Upload, User, Clock, Maximize2, Trees, Camera } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/auth-context';

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  author: string;
  authorEmail?: string;
  createdAt: any;
}

const GALLERY_CATEGORIES = [
  { key: '전체', label: '전체', icon: ImageIcon },
  { key: '조경표현', label: '조경표현', icon: Trees },
  { key: '일반사진', label: '일반사진', icon: Camera },
];

export default function GalleryPage() {
  const { user, isAdmin, userName } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('조경표현');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const canDelete = (item: GalleryItem) => {
    if (!user) return false;
    if (isAdmin) return true;
    return item.authorEmail === user.email;
  };

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as GalleryItem[]);
    });
    return () => unsubscribe();
  }, []);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || files.length === 0) {
      showToast('이미지를 선택해주세요.', 'error');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, file);
        const imageUrl = await getDownloadURL(uploadTask.ref);

        await addDoc(collection(db, 'gallery'), {
          title: formTitle || file.name.replace(/\.[^/.]+$/, ''),
          imageUrl,
          category: formCategory,
          author: userName || user.email,
          authorEmail: user.email,
          createdAt: serverTimestamp(),
        });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      showToast(`${files.length}개의 이미지가 업로드되었습니다!`);
      setIsFormOpen(false);
      setFormTitle('');
      setFiles([]);
    } catch (err) {
      console.error(err);
      showToast('업로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;
    await deleteDoc(doc(db, 'gallery', id));
    showToast('이미지가 삭제되었습니다.');
    if (lightboxIdx !== null) setLightboxIdx(null);
  };

  const filteredItems = items.filter(item =>
    selectedCategory === '전체' || item.category === selectedCategory
  );

  // Lightbox navigation
  const goNext = useCallback(() => {
    if (lightboxIdx !== null && lightboxIdx < filteredItems.length - 1) setLightboxIdx(lightboxIdx + 1);
  }, [lightboxIdx, filteredItems.length]);

  const goPrev = useCallback(() => {
    if (lightboxIdx !== null && lightboxIdx > 0) setLightboxIdx(lightboxIdx - 1);
  }, [lightboxIdx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIdx, goNext, goPrev]);

  const categoryCounts: Record<string, number> = { '전체': items.length };
  items.forEach(item => {
    const c = item.category || '일반사진';
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${toast.type === 'success' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'}`}>
            <CheckCircle2 size={18} /> {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><ImageIcon className="text-teal-600 w-8 h-8" /> 갤러리</h1>
          <p className="text-slate-500 mt-1 text-sm">조경표현 및 일반사진을 올리고 열람하는 공간입니다.</p>
        </div>
        {user && (
          <button onClick={() => setIsFormOpen(!isFormOpen)} 
            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition flex items-center gap-2 self-start" disabled={isUploading}
          >
            {isFormOpen ? <X size={18} /> : <Plus size={18} />} {isFormOpen ? '닫기' : '사진 올리기'}
          </button>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div className="mb-6 flex gap-2">
        {GALLERY_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border whitespace-nowrap transition-all
              ${selectedCategory === cat.key 
                ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-600'
              }`}
          >
            <cat.icon size={16} />
            {cat.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === cat.key ? 'bg-white/20' : 'bg-slate-100'}`}>
              {categoryCounts[cat.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 업로드 폼 */}
      <AnimatePresence>
        {isFormOpen && user && (
          <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h2 className="text-lg font-bold mb-4 text-teal-900">사진 업로드</h2>
            <div className="space-y-4">
              <input placeholder="제목 (선택)" className="input-field focus:border-teal-500" value={formTitle} onChange={e => setFormTitle(e.target.value)} disabled={isUploading}/>
              <select className="input-field w-48 focus:border-teal-500" value={formCategory} onChange={e => setFormCategory(e.target.value)} disabled={isUploading}>
                <option value="조경표현">조경표현</option>
                <option value="일반사진">일반사진</option>
              </select>
              
              <div className="border-2 border-dashed border-teal-200 p-6 rounded-xl relative hover:bg-teal-50/50 transition">
                <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isUploading}/>
                <div className="flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                  {files.length > 0 ? (
                     <div className="font-bold text-teal-600 flex items-center gap-2"><Upload size={18}/> {files.length}개 이미지 선택됨</div>
                  ) : (
                     <>
                      <Upload size={32} className="mb-2 text-teal-400" />
                      <p className="text-sm font-bold">이미지를 선택하세요 (여러 장 가능)</p>
                     </>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-teal-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              <button type="submit" className="bg-teal-600 text-white w-full py-4 rounded-xl font-black flex items-center justify-center gap-2" disabled={isUploading || files.length === 0}>
                {isUploading ? <><Loader2 size={18} className="animate-spin" /> 업로드 중 ({uploadProgress}%)...</> : '사진 업로드하기'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 이미지 그리드 */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredItems.map((item, idx) => (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="break-inside-avoid group relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:border-teal-200 transition-all cursor-pointer bg-white"
            onClick={() => setLightboxIdx(idx)}
          >
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" 
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="font-bold text-sm truncate">{item.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-white/70 text-xs flex items-center gap-1"><User size={10}/> {item.author}</p>
                  <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">{item.category}</span>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-1">
                <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/40 transition"><Maximize2 size={14}/></button>
                {canDelete(item) && (
                  <button onClick={(e) => handleDelete(e, item.id)} className="p-1.5 bg-red-500/70 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition"><Trash2 size={14}/></button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={40} />
          </div>
          <p className="text-slate-500 font-medium">아직 등록된 사진이 없습니다.</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && filteredItems[lightboxIdx] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center" 
            onClick={() => setLightboxIdx(null)}
          >
            <button onClick={() => setLightboxIdx(null)} className="absolute top-6 right-6 text-white/60 hover:text-white transition z-10"><X size={32}/></button>
            
            {lightboxIdx > 0 && (
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition bg-white/10 backdrop-blur-sm rounded-full p-3 z-10">
                <ChevronLeft size={28}/>
              </button>
            )}
            {lightboxIdx < filteredItems.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition bg-white/10 backdrop-blur-sm rounded-full p-3 z-10">
                <ChevronRight size={28}/>
              </button>
            )}

            <motion.div 
              key={lightboxIdx}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-5xl max-h-[85vh] w-full px-4 flex flex-col items-center" 
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={filteredItems[lightboxIdx].imageUrl} 
                alt={filteredItems[lightboxIdx].title} 
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />
              <div className="mt-4 text-center text-white">
                <p className="text-lg font-bold">{filteredItems[lightboxIdx].title}</p>
                <div className="flex items-center justify-center gap-3 mt-1 text-white/60 text-sm">
                  <span className="flex items-center gap-1"><User size={14}/> {filteredItems[lightboxIdx].author}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{filteredItems[lightboxIdx].category}</span>
                  <span className="text-xs">{filteredItems[lightboxIdx].createdAt?.toDate?.()?.toLocaleDateString?.() || ''}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
