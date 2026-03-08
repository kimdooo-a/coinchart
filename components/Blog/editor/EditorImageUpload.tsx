'use client';

import { useRef } from 'react';
import type { Editor } from '@tiptap/react';

interface EditorImageUploadProps {
  editor: Editor | null;
}

export default function EditorImageUpload({ editor }: EditorImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '이미지 업로드 실패');
        return;
      }

      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }

    // 파일 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
      onChange={handleUpload}
      className="hidden"
      id="blog-image-upload"
    />
  );
}

// 업로드 트리거 함수
export function triggerImageUpload() {
  document.getElementById('blog-image-upload')?.click();
}
