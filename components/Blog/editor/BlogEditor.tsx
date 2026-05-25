'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import { getEditorExtensions } from '@/lib/blog-editor-extensions';
import EditorToolbar from './EditorToolbar';
import EditorImageUpload, { triggerImageUpload, uploadImage } from './EditorImageUpload';
import BlogPostContent from '@/components/Blog/BlogPostContent';

export type ViewMode = 'wysiwyg' | 'html' | 'preview';
export type EditorTone = 'light' | 'dark';

interface BlogEditorProps {
  content?: string;
  onChange: (content: string) => void;
  tone?: EditorTone;
}

export default function BlogEditor({ content, onChange, tone = 'light' }: BlogEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');
  const [htmlSource, setHtmlSource] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useEditor({
    // SSR 감지 시 TipTap이 throw하므로 명시적으로 비활성(하이드레이션 미스매치 방지).
    // Next dynamic ssr:false 마운트(예: /admin/board)에서도 첫 렌더 throw를 막는다.
    immediatelyRender: false,
    extensions: [
      ...getEditorExtensions(),
      Placeholder.configure({
        placeholder: '내용을 입력하세요...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: [
          'prose prose-sm sm:prose-base max-w-none min-h-[400px] p-4 focus:outline-none',
          tone === 'dark' ? 'prose-invert' : '',
        ]
          .filter(Boolean)
          .join(' '),
      },
      // 이미지 드래그앤드롭
      handleDrop: (_view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();

        uploadImage(file).then((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
      // 이미지 클립보드 붙여넣기
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            uploadImage(file).then((url) => {
              if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  // HTML 모드 전환 시 소스 동기화
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (!editor) return;

    setViewMode((prev) => {
      if (mode === 'html') {
        // WYSIWYG/Preview → HTML: 현재 에디터 HTML을 textarea에 반영
        setHtmlSource(editor.getHTML());
      } else if (prev === 'html') {
        // HTML → 다른 모드: textarea 내용을 에디터에 반영
        editor.commands.setContent(htmlSource);
        onChange(htmlSource);
      }
      return mode;
    });
  }, [editor, htmlSource, onChange]);

  // HTML 소스 수정 시
  const handleHtmlSourceChange = useCallback((newHtml: string) => {
    setHtmlSource(newHtml);
  }, []);

  // ESC로 전체화면 해제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const containerClass = isFullscreen
    ? tone === 'dark'
      ? 'fixed inset-0 z-50 bg-black flex flex-col overflow-hidden'
      : 'fixed inset-0 z-50 bg-surface-container-lowest flex flex-col overflow-hidden'
    : tone === 'dark'
      ? 'border border-white/10 rounded-xl overflow-hidden bg-black/40'
      : 'border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest';

  return (
    <div className={containerClass}>
      <EditorToolbar
        editor={editor}
        onImageUpload={triggerImageUpload}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        tone={tone}
      />
      <EditorImageUpload editor={editor} />

      {viewMode === 'wysiwyg' && (
        <div className={isFullscreen ? 'flex-1 overflow-y-auto' : ''}>
          <EditorContent editor={editor} />
        </div>
      )}

      {viewMode === 'html' && (
        <textarea
          value={htmlSource}
          onChange={(e) => handleHtmlSourceChange(e.target.value)}
          className={`w-full bg-black/60 text-green-400 font-mono text-sm p-4 focus:outline-none resize-none ${
            isFullscreen ? 'flex-1' : 'min-h-[400px]'
          }`}
          spellCheck={false}
        />
      )}

      {viewMode === 'preview' && (
        <div className={`p-6 ${isFullscreen ? 'flex-1 overflow-y-auto' : 'min-h-[400px]'}`}>
          <BlogPostContent content={editor?.getHTML() || ''} />
        </div>
      )}
    </div>
  );
}
