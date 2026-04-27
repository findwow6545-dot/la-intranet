'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

interface BoardConfig {
  boardName: 'study' | 'library' | 'gallery';
  /** Firestore 컬렉션 이름 (게시글이 저장된 곳) */
  postsCollection: string;
  /** 게시글 문서 내 카테고리 필드명 */
  categoryField: string;
  /** 카테고리 삭제 시 게시글이 이동할 기본 카테고리 */
  fallbackCategory: string;
}

const DEFAULTS: Record<string, string[]> = {
  study: ['학습URL', '논문스터디', '기타스터디'],
  library: ['논문', '앱/웹개발', '디자인', '회의록', '기타'],
  gallery: ['조경표현', '일반사진', '기타사진'],
};

export function useBoardCategories(config: BoardConfig) {
  const { boardName, postsCollection, categoryField, fallbackCategory } = config;
  const [categories, setCategories] = useState<string[]>(DEFAULTS[boardName] || []);
  const [loading, setLoading] = useState(true);

  const docRef = doc(db, 'categories', boardName);

  // 실시간 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCategories(data.items || DEFAULTS[boardName]);
      } else {
        // 문서가 없으면 기본값으로 생성
        setDoc(docRef, { items: DEFAULTS[boardName] });
        setCategories(DEFAULTS[boardName]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [boardName]);

  const addCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return false;
    const updated = [...categories, trimmed];
    await setDoc(docRef, { items: updated });
    return true;
  };

  /** 카테고리 삭제 + 해당 카테고리 게시글을 fallbackCategory로 일괄 이동 */
  const deleteCategory = async (name: string) => {
    // 1. 해당 카테고리의 게시글을 fallback으로 변경
    const q = query(collection(db, postsCollection), where(categoryField, '==', name));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { [categoryField]: fallbackCategory });
      });
      await batch.commit();
    }

    // 2. 카테고리 목록에서 제거
    const updated = categories.filter(c => c !== name);
    await setDoc(docRef, { items: updated });
    return snapshot.size; // 이동된 게시글 수 반환
  };

  /** 카테고리 이름 변경 + 해당 카테고리 게시글도 일괄 변경 */
  const renameCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || categories.includes(trimmed)) return false;

    // 1. 해당 카테고리의 게시글 이름 변경
    const q = query(collection(db, postsCollection), where(categoryField, '==', oldName));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { [categoryField]: trimmed });
      });
      await batch.commit();
    }

    // 2. 카테고리 목록 변경
    const updated = categories.map(c => c === oldName ? trimmed : c);
    await setDoc(docRef, { items: updated });
    return true;
  };

  return { categories, loading, addCategory, deleteCategory, renameCategory };
}
