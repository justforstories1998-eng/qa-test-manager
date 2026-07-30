import React, { useRef, useState, useCallback } from 'react';
import { FiBold, FiItalic, FiUnderline, FiLink, FiList, FiCode } from 'react-icons/fi';

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
            code.style.background = 'rgba(99,102,241,0.12)';
            code.style.padding = '2px 6px';
            code.style.borderRadius = '4px';
            code.style.fontFamily = 'monospace';
            code.style.fontSize = '12px';
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

  const containerStyle = {
    border: '1px solid ' + (isFocused ? '#6366f1' : 'var(--border-color)'),
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'var(--surface-secondary)',
    transition: 'border-color 0.2s',
    ...(styleProp || {}),
  };

  return (
    <div style={containerStyle}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        padding: '6px 8px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-tertiary)',
      }}>
        {toolbarButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.command}
              type="button"
              title={btn.title}
              onClick={() => execCommand(btn.command, btn.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px',
                border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#818cf8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Icon size={14} />
            </button>
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
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--text-primary, #f1f5f9)',
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
        [contenteditable] a { color: #818cf8; text-decoration: underline; }
        [contenteditable] code {
          background: rgba(99,102,241,0.12);
          padding: 2px 6px; border-radius: 4px;
          font-family: monospace; font-size: 12px;
        }
        [contenteditable] ul { margin: 4px 0; padding-left: 20px; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
