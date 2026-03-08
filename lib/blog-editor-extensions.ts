// 에디터/렌더러 공유 extension 목록 (SSOT)
// BlogEditor와 BlogPostContent 양쪽에서 동일한 extension을 사용

import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Youtube from '@tiptap/extension-youtube';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

/**
 * 에디터용 extension 목록 (에디터 전용 설정 포함)
 */
export function getEditorExtensions() {
  return [
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
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Underline,
    Highlight.configure({
      multicolor: true,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    TextStyle,
    Color,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Youtube.configure({
      width: 640,
      height: 360,
      HTMLAttributes: {
        class: 'youtube-embed',
      },
    }),
  ];
}
