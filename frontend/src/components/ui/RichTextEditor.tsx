import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Divider,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Undo,
  Redo,
  Clear,
} from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

/* -------------------------------------------------------
   HTML SANITIZER (STRICT + SAFE)
-------------------------------------------------------- */
const sanitizeHTML = (dirty: string): string => {
  if (!dirty) return '';

  const doc = document.createElement('div');
  doc.innerHTML = dirty;

  // Remove dangerous nodes completely
  doc.querySelectorAll(
    'script,style,meta,link,iframe,object,embed,svg,math'
  ).forEach(n => n.remove());

  const ALLOWED_TAGS = new Set([
    'P',
    'BR',
    'B',
    'STRONG',
    'I',
    'EM',
    'U',
    'UL',
    'OL',
    'LI',
    'BLOCKQUOTE',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
  ]);

  const walker = document.createTreeWalker(
    doc,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  let node = walker.currentNode as HTMLElement | null;

  while (node) {
    const el = node; // Capture the node in a const to satisfy TypeScript
    if (!ALLOWED_TAGS.has(el.tagName)) {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent?.insertBefore(el.firstChild, el);
      }
      parent?.removeChild(el);
    } else {
      // Remove ALL attributes
      [...el.attributes].forEach(attr =>
        el.removeAttribute(attr.name)
      );
    }
    node = walker.nextNode() as HTMLElement | null;
  }

  return doc.innerHTML
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .trim();
};

/* -------------------------------------------------------
   CURSOR UTILITIES
-------------------------------------------------------- */
const saveSelection = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0);
};

const restoreSelection = (range: Range | null) => {
  if (!range) return;
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
};

/* -------------------------------------------------------
   COMPONENT
-------------------------------------------------------- */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing…',
  label,
  minHeight = 180,
  maxHeight = 480,
  disabled,
  readOnly,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const indexRef = useRef<number>(-1);
  const isInternalChange = useRef(false);

  /* -------------------------------------------
     Sync external value (safe)
  -------------------------------------------- */
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const clean = sanitizeHTML(value);
    if (editorRef.current.innerHTML !== clean) {
      editorRef.current.innerHTML = clean;
    }
  }, [value]);

  /* -------------------------------------------
     Save state + history
  -------------------------------------------- */
  const commit = useCallback(() => {
    if (!editorRef.current) return;

    const selection = saveSelection();
    const clean = sanitizeHTML(editorRef.current.innerHTML);

    isInternalChange.current = true;
    editorRef.current.innerHTML = clean;
    onChange(clean);

    const history = historyRef.current;
    const idx = indexRef.current;

    if (history[idx] !== clean) {
      history.splice(idx + 1);
      history.push(clean);
      indexRef.current = history.length - 1;
    }

    restoreSelection(selection);
  }, [onChange]);

  /* -------------------------------------------
     Formatting
  -------------------------------------------- */
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    commit();
  };

  /* -------------------------------------------
     Paste handler (CLEAN TEXT ONLY)
  -------------------------------------------- */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let listOpen = false;

    for (const line of lines) {
      const t = line.trim();
      if (/^[-•–—]\s+/.test(t)) {
        if (!listOpen) {
          html += '<ul>';
          listOpen = true;
        }
        html += `<li>${t.replace(/^[-•–—]\s+/, '')}</li>`;
      } else {
        if (listOpen) {
          html += '</ul>';
          listOpen = false;
        }
        if (t) html += `<p>${t}</p>`;
      }
    }

    if (listOpen) html += '</ul>';

    document.execCommand('insertHTML', false, html);
    commit();
  };

  /* -------------------------------------------
     Undo / Redo
  -------------------------------------------- */
  const undo = () => {
    const idx = indexRef.current;
    if (idx <= 0) return;

    indexRef.current -= 1;
    const html = historyRef.current[indexRef.current];
    editorRef.current!.innerHTML = html;
    onChange(html);
  };

  const redo = () => {
    const idx = indexRef.current;
    if (idx >= historyRef.current.length - 1) return;

    indexRef.current += 1;
    const html = historyRef.current[indexRef.current];
    editorRef.current!.innerHTML = html;
    onChange(html);
  };

  /* -------------------------------------------
     Render
  -------------------------------------------- */
  return (
    <Box>
      {label && (
        <Typography fontWeight={600} mb={1}>
          {label}
        </Typography>
      )}

      <Paper variant="outlined">
        <Box display="flex" gap={0.5} p={1}>
          <Tooltip title="Bold">
            <IconButton onClick={() => exec('bold')}>
              <FormatBold />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton onClick={() => exec('italic')}>
              <FormatItalic />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton onClick={() => exec('underline')}>
              <FormatUnderlined />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem />

          <Tooltip title="Bulleted List">
            <IconButton onClick={() => exec('insertUnorderedList')}>
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton onClick={() => exec('insertOrderedList')}>
              <FormatListNumbered />
            </IconButton>
          </Tooltip>

          <Tooltip title="Quote">
            <IconButton onClick={() => exec('formatBlock', 'blockquote')}>
              <FormatQuote />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem />

          <Tooltip title="Undo">
            <IconButton onClick={undo}>
              <Undo />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton onClick={redo}>
              <Redo />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clear">
            <IconButton
              onClick={() => {
                editorRef.current!.innerHTML = '';
                commit();
              }}
            >
              <Clear />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          ref={editorRef}
          contentEditable={!disabled && !readOnly}
          suppressContentEditableWarning
          onInput={commit}
          onPaste={handlePaste}
          sx={{
            px: 2,
            py: 1.5,
            minHeight,
            maxHeight,
            overflowY: 'auto',
            outline: 'none',
            fontSize: '1rem',
            lineHeight: 1.7,
            '&:empty::before': {
              content: `"${placeholder}"`,
              color: 'text.disabled',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default RichTextEditor;
