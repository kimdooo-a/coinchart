'use client';

import { useState, useRef, useEffect } from 'react';

const PRESET_COLORS = [
  '#FF5733', '#FF8C00', '#FFD700', '#32CD32', '#00CED1',
  '#1E90FF', '#8A2BE2', '#FF69B4', '#DC143C', '#FFFFFF',
  '#E0E0E0', '#A0A0A0', '#666666', '#333333', '#000000',
];

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  children: React.ReactNode;
  title: string;
}

export default function ColorPicker({ currentColor, onColorChange, children, title }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        className={`p-2 rounded-lg transition-colors ${
          currentColor && currentColor !== '#000000'
            ? 'bg-white/10 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <div className="relative">
          {children}
          <div
            className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 rounded-full"
            style={{ backgroundColor: currentColor || '#FFFFFF' }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 min-w-[180px]">
          <div className="grid grid-cols-5 gap-1 mb-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
                className={`w-7 h-7 rounded border transition-transform hover:scale-110 ${
                  currentColor === color ? 'border-primary ring-1 ring-primary' : 'border-white/20'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <input
              type="color"
              value={currentColor || '#FFFFFF'}
              onChange={(e) => {
                onColorChange(e.target.value);
                setIsOpen(false);
              }}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
            <span className="text-xs text-gray-500">커스텀</span>
            <button
              type="button"
              onClick={() => {
                onColorChange('');
                setIsOpen(false);
              }}
              className="ml-auto text-xs text-gray-400 hover:text-white"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
