'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import EditorToolbar from './EditorToolbar';
import EditorImageUpload, { triggerImageUpload } from './EditorImageUpload';

const lowlight = createLowlight(common);

interface BlogEditorProps {
  content?: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}

export default function BlogEditor({ content, onChange }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // CodeBlockLowlight로 대체
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Placeholder.configure({
        placeholder: '내용을 입력하세요...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content || undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm sm:prose-base max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
      <EditorToolbar editor={editor} onImageUpload={triggerImageUpload} />
      <EditorImageUpload editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
