import React, { useRef, useState, useCallback } from 'react';
import { FiBold, FiItalic, FiUnderline, FiLink, FiList, FiCode } from 'react-icons/fi';
import { LiquidButton } from '../ui/liquid-glass-button';

const toolbarButtons = [
  { icon: FiBold, command: 'bold', title: 'Bold' },
  { icon: FiItalic, command: 'italic', title: 'Italic' },
  { icon: FiUnderline, command: 'underline', title: 'Underline' },
  { icon: FiCode, command: 'insertHTML', value: '<code>', title: 'Code' },
  { icon: FiList, command: 'insertUnorderedList', title: 'Bullet List' },
  { icon: FiLink, command: 'createLink', title: 'Link' },
];

const RichTextEditor = ({ value, onChange, placeholder = 'Type here...', minHeight = 120, style: styleProp }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const execCommand = useCallback((command, valueArg) => {
    if (command === 'createLink') {
      const url = prompt('Enter URL:', 'https://');
      if (url) document.execCommand('createLink', false, url);
    } else if (command === 'insertHTML') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        if (valueArg === '<code>') {
          const selected = range.toString();
          if (selected) {
            range.deleteContents();
            const code = document.createElement('code');
            code.textContent = selected;
            range.insertNode(code);
          }
        }
      }
    } else {
      document.execCommand(command, false, valueArg || null);
    }
    if (editorRef.current) editorRef.current.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCommand('bold'); }
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCommand('italic'); }
    if (e.key === 'u' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); execCommand('underline'); }
  }, [execCommand]);

  return (
    <div style={{
      border: `1.5px solid ${isFocused ? 'var(--color-primary)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      background: 'var(--bg-input)',
      transition: 'border-color 0.15s',
      ...(styleProp || {}),
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '6px 8px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-inset)',
      }}>
        {toolbarButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <LiquidButton
              key={btn.command}
              type="button"
              title={btn.title}
              onClick={() => execCommand(btn.command, btn.value)}
              variant="ghost"
              size="icon"
              style={{ width: 28, height: 28, padding: 0 }}
            >
              <Icon size={14} />
            </LiquidButton>
          );
        })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{
          minHeight: minHeight + 'px',
          padding: '12px 14px',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          outline: 'none',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
        }
        [contenteditable] a { color: var(--color-primary); text-decoration: underline; }
        [contenteditable] code {
          background: var(--color-primary-faint);
          padding: 2px 6px; border-radius: 4px;
          font-family: var(--font-mono); font-size: 0.8125rem;
        }
        [contenteditable] ul { margin: 4px 0; padding-left: 20px; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
