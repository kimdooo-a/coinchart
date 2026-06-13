'use client';

import type { Editor } from '@tiptap/react';
import type { ViewMode } from './BlogEditor';
import ColorPicker from './ColorPicker';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  ImageIcon,
  Link2,
  Code2,
  Undo,
  Redo,
  Table as TableIcon,
  Youtube,
  Maximize,
  Minimize,
  Type,
} from 'lucide-react';

function ToolButton({
  onClick,
  isActive = false,
  children,
  title,
  disabled = false,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : disabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-white/10 mx-1" />;
}

interface EditorToolbarProps {
  editor: Editor | null;
  onImageUpload: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  tone?: 'light' | 'dark';
}

export default function EditorToolbar({
  editor,
  onImageUpload,
  viewMode,
  onViewModeChange,
  isFullscreen,
  onToggleFullscreen,
  tone = 'light',
}: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertYoutube = () => {
    const url = window.prompt('YouTube URL을 입력하세요:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const isWysiwyg = viewMode === 'wysiwyg';

  const wrapperClass =
    tone === 'dark'
      ? 'flex flex-wrap items-center gap-0.5 p-2 border-b border-white/10 bg-white/5'
      : 'flex flex-wrap items-center gap-0.5 p-2 border-b border-outline-variant bg-surface-container text-on-surface';

  return (
    <div className={wrapperClass}>
      {/* 실행 취소/재실행 */}
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        title="실행 취소"
        disabled={!isWysiwyg}
      >
        <Undo className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        title="다시 실행"
        disabled={!isWysiwyg}
      >
        <Redo className="w-4 h-4" />
      </ToolButton>

      <Divider />

      {/* 텍스트 스타일 */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="굵게"
        disabled={!isWysiwyg}
      >
        <Bold className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="기울임"
        disabled={!isWysiwyg}
      >
        <Italic className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="밑줄"
        disabled={!isWysiwyg}
      >
        <UnderlineIcon className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="취소선"
        disabled={!isWysiwyg}
      >
        <Strikethrough className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="인라인 코드"
        disabled={!isWysiwyg}
      >
        <Code className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="형광펜"
        disabled={!isWysiwyg}
      >
        <Highlighter className="w-4 h-4" />
      </ToolButton>

      <Divider />

      {/* 텍스트 색상 */}
      <ColorPicker
        currentColor={editor.getAttributes('textStyle').color || ''}
        onColorChange={(color) => {
          if (color) {
            editor.chain().focus().setColor(color).run();
          } else {
            editor.chain().focus().unsetColor().run();
          }
        }}
        title="글자색"
      >
        <Type className="w-4 h-4" />
      </ColorPicker>

      <Divider />

      {/* 헤딩 */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1"
        disabled={!isWysiwyg}
      >
        <Heading1 className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2"
        disabled={!isWysiwyg}
      >
        <Heading2 className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3"
        disabled={!isWysiwyg}
      >
        <Heading3 className="w-4 h-4" />
      </ToolButton>

      <Divider />

      {/* 정렬 */}
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="왼쪽 정렬"
        disabled={!isWysiwyg}
      >
        <AlignLeft className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="가운데 정렬"
        disabled={!isWysiwyg}
      >
        <AlignCenter className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="오른쪽 정렬"
        disabled={!isWysiwyg}
      >
        <AlignRight className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="양쪽 정렬"
        disabled={!isWysiwyg}
      >
        <AlignJustify className="w-4 h-4" />
      </ToolButton>

      <Divider />

      {/* 리스트/블록 */}
      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="불릿 리스트"
        disabled={!isWysiwyg}
      >
        <List className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="번호 리스트"
        disabled={!isWysiwyg}
      >
        <ListOrdered className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="인용"
        disabled={!isWysiwyg}
      >
        <Quote className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="구분선"
        disabled={!isWysiwyg}
      >
        <Minus className="w-4 h-4" />
      </ToolButton>

      <Divider />

      {/* 미디어/삽입 */}
      <ToolButton onClick={insertTable} title="표 삽입" disabled={!isWysiwyg}>
        <TableIcon className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={onImageUpload} title="이미지 삽입" disabled={!isWysiwyg}>
        <ImageIcon className="w-4 h-4" />
      </ToolButton>
      <ToolButton onClick={insertYoutube} title="YouTube 삽입" disabled={!isWysiwyg}>
        <Youtube className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="링크 삽입"
        disabled={!isWysiwyg}
      >
        <Link2 className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="코드 블록"
        disabled={!isWysiwyg}
      >
        <Code2 className="w-4 h-4" />
      </ToolButton>

      <Divider />

      {/* 뷰모드 탭 */}
      <div className="flex items-center bg-white/5 rounded-lg overflow-hidden ml-auto">
        {(['wysiwyg', 'html', 'preview'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === mode
                ? 'bg-primary text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {mode === 'wysiwyg' ? '편집' : mode === 'html' ? 'HTML' : '미리보기'}
          </button>
        ))}
      </div>

      {/* 전체화면 */}
      <ToolButton
        onClick={onToggleFullscreen}
        title={isFullscreen ? '전체화면 해제' : '전체화면'}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </ToolButton>
    </div>
  );
}
