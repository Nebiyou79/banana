import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  ToggleButton,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  FormHelperText,
  Chip,

  alpha,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatClear,
  Title as TitleIcon,
  Link as LinkIcon,
  InsertPhoto as InsertPhotoIcon,
  Code as CodeIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Check as CheckIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  StrikethroughS as StrikethroughIcon,
  TextFields as TextFieldsIcon,
  TableChart as TableIcon,
  HorizontalRule as HorizontalRuleIcon,
  EmojiEmotions as EmojiIcon,
  Palette as PaletteIcon,
  TextFormat as TextFormatIcon,
  Spellcheck as SpellcheckIcon,
  ExpandMore as ExpandMoreIcon,
  AddLink as AddLinkIcon,
  Image as ImageIcon,
  DataObject as DataObjectIcon,
  SmartDisplay as SmartDisplayIcon,
  Functions as FunctionsIcon,
  Dashboard as DashboardIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  label?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  showToolbar?: boolean;
  showCharacterCount?: boolean;
  theme?: 'light' | 'dark';
}

interface ToolbarButton {
  icon: React.ReactNode;
  title: string;
  command: string;
  value?: string;
  group?: string;
}

interface ToolbarGroup {
  id: string;
  label: string;
  buttons: ToolbarButton[];
}

const StyledEditorContainer = styled(Paper, {
  shouldForwardProp: (prop) => !['themeMode', 'error', 'focused', 'disabled', 'readOnly'].includes(prop as string),
})<{ 
  themeMode: 'light' | 'dark';
  error?: boolean;
  focused?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}>(({ theme, themeMode, focused }) => ({
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: (theme.shape.borderRadius as number) * 2,
  backgroundColor: themeMode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.7)
    : alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(20px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: theme.shadows[2],
  
  '&:hover:not(.disabled):not(.error)': {
    borderColor: focused ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3),
    boxShadow: theme.shadows[4],
  },
  
  '&.error': {
    borderColor: theme.palette.error.main,
    '&:hover': {
      borderColor: theme.palette.error.dark,
    },
  },
  
  '&.focused:not(.disabled):not(.error)': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}, ${theme.shadows[6]}`,
  },
  
  '&.disabled': {
    backgroundColor: alpha(theme.palette.action.disabledBackground, 0.3),
    backdropFilter: 'none',
    pointerEvents: 'none',
    opacity: 0.6,
  },
  
  '&.readOnly': {
    backgroundColor: themeMode === 'dark' 
      ? alpha(theme.palette.grey[900], 0.3)
      : alpha(theme.palette.grey[50], 0.7),
  },
}));

const EditorToolbar = styled(Box, {
  shouldForwardProp: (prop) => !['themeMode', 'visible'].includes(prop as string),
})<{ themeMode: 'light' | 'dark'; visible: boolean }>(({ theme, themeMode, visible }) => ({
  padding: theme.spacing(2, 2.5),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  backgroundColor: themeMode === 'dark' 
    ? alpha(theme.palette.grey[900], 0.5)
    : alpha(theme.palette.grey[50], 0.8),
  backdropFilter: 'blur(10px)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
  alignItems: 'center',
  borderTopLeftRadius: 'inherit',
  borderTopRightRadius: 'inherit',
  minHeight: 68,
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(-10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflowX: 'auto',
  
  '&::-webkit-scrollbar': {
    height: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.2),
    borderRadius: 2,
  },
}));

const EditorContent = styled('div', {
  shouldForwardProp: (prop) => !['minHeight', 'maxHeight', 'readOnly', 'themeMode'].includes(prop as string),
})<{ 
  minHeight?: number; 
  maxHeight?: number;
  readOnly?: boolean;
  themeMode: 'light' | 'dark';
}>(({ theme, minHeight, maxHeight, readOnly, themeMode }) => ({
  padding: theme.spacing(3),
  minHeight: minHeight || 250,
  maxHeight: maxHeight || 600,
  overflowY: 'auto',
  outline: 'none',
  cursor: readOnly ? 'default' : 'text',
  position: 'relative',
  
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.2),
    borderRadius: 4,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: alpha(theme.palette.primary.main, 0.4),
  },
  
  '&:empty:before': {
    content: 'attr(data-placeholder)',
    color: theme.palette.text.disabled,
    pointerEvents: 'none',
    fontStyle: 'italic',
  },
  
  // Typography styles
  '& p': {
    margin: '0 0 1.25em 0',
    lineHeight: 1.8,
    fontSize: '1rem',
  },
  
  '& h1': {
    margin: '1.5em 0 0.75em 0',
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    background: theme.palette.mode === 'dark' 
      ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
      : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  
  '& h2': {
    margin: '1.25em 0 0.625em 0',
    fontWeight: 600,
    fontSize: '2rem',
    lineHeight: 1.3,
    color: theme.palette.text.primary,
  },
  
  '& h3': {
    margin: '1em 0 0.5em 0',
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.4,
    color: theme.palette.text.primary,
  },
  
  '& h4': {
    margin: '1em 0 0.5em 0',
    fontWeight: 500,
    fontSize: '1.25rem',
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
  },
  
  '& h5': {
    margin: '0.75em 0 0.375em 0',
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
  },
  
  '& h6': {
    margin: '0.75em 0 0.375em 0',
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
  },
  
  '& ul, & ol': {
    margin: '0 0 1.25em 0',
    paddingLeft: theme.spacing(4),
    lineHeight: 1.8,
  },
  
  '& li': {
    marginBottom: theme.spacing(0.5),
  },
  
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    padding: theme.spacing(2, 3),
    margin: theme.spacing(2.5, 0),
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    
    '&:before': {
      content: '"❝"',
      position: 'absolute',
      left: theme.spacing(1),
      top: theme.spacing(0.5),
      fontSize: '2rem',
      color: alpha(theme.palette.primary.main, 0.3),
    },
  },
  
  '& pre': {
    backgroundColor: themeMode === 'dark' 
      ? alpha(theme.palette.grey[900], 0.5)
      : alpha(theme.palette.grey[100], 0.8),
    padding: theme.spacing(2.5),
    borderRadius: (theme.shape.borderRadius as number) * 1.5,
    overflowX: 'auto',
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    fontSize: '0.875rem',
    lineHeight: 1.6,
    margin: theme.spacing(2, 0),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    position: 'relative',
    
    '&:before': {
      content: '"</>"',
      position: 'absolute',
      top: theme.spacing(-1),
      left: theme.spacing(2),
      fontSize: '0.75rem',
      fontWeight: 600,
      color: theme.palette.primary.main,
      backgroundColor: 'inherit',
      padding: theme.spacing(0, 1),
    },
  },
  
  '& code': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: theme.spacing(0.25, 0.75),
    borderRadius: theme.shape.borderRadius,
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    fontSize: '0.875rem',
    color: theme.palette.primary.dark,
  },
  
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transition: 'all 0.2s ease',
    position: 'relative',
    
    '&:hover': {
      color: theme.palette.primary.dark,
      borderBottomColor: theme.palette.primary.main,
      
      '&:after': {
        content: '"↗"',
        position: 'absolute',
        right: '-1.2em',
        top: '0.1em',
        fontSize: '0.8em',
        opacity: 0.8,
      },
    },
  },
  
  '& img': {
    maxWidth: '100%',
    height: 'auto',
borderRadius: (theme.shape.borderRadius as number) * 1.5,
    margin: theme.spacing(2, 0),
    boxShadow: theme.shadows[2],
    transition: 'all 0.3s ease',
    
    '&:hover': {
      transform: 'scale(1.01)',
      boxShadow: theme.shadows[6],
    },
  },
  
  '& hr': {
    border: 'none',
    height: 2,
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.5)}, transparent)`,
    margin: theme.spacing(3, 0),
  },
  
  '& table': {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    margin: theme.spacing(2, 0),
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  
  '& th, & td': {
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    textAlign: 'left',
  },
  
  '& th': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}));

const ToolbarGroupContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  padding: theme.spacing(0.5),
borderRadius: (theme.shape.borderRadius as number) * 1.5,
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  minWidth: 40,
  minHeight: 40,
  borderRadius: theme.shape.borderRadius,
  border: 'none !important',
  color: theme.palette.text.secondary,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
    transform: 'translateY(-2px)',
  },
  
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.main,
    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.16),
    },
  },
  
  '&.Mui-disabled': {
    opacity: 0.4,
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.secondary,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
    transform: 'translateY(-2px)',
  },
  
  '&.Mui-disabled': {
    opacity: 0.4,
  },
}));

const CharacterCount = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2.5),
  color: theme.palette.text.secondary,
  backgroundColor: alpha(theme.palette.grey[50], 0.7),
  backdropFilter: 'blur(10px)',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderBottomLeftRadius: 'inherit',
  borderBottomRightRadius: 'inherit',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.75rem',
  fontWeight: 500,
}));

const FloatingToolbar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -44,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: (theme.shape.borderRadius as number) * 1.5,
  boxShadow: theme.shadows[8],
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  zIndex: 1000,
  animation: 'slideIn 0.2s ease-out',
  
  '@keyframes slideIn': {
    from: {
      opacity: 0,
      transform: 'translateX(-50%) translateY(-10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(-50%) translateY(0)',
    },
  },
}));

const Label = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  
  '&.required:after': {
    content: '"*"',
    color: theme.palette.error.main,
    marginLeft: theme.spacing(0.5),
  },
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.7rem',
  fontWeight: 600,
  backgroundColor: alpha(theme.palette.success.main, 0.1),
  color: theme.palette.success.main,
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
}));

const LinkDialog = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  minWidth: 380,
  borderRadius: (theme.shape.borderRadius as number) * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[12],
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  
  '& input': {
    width: '100%',
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
    marginBottom: theme.spacing(2),
    
    '&:focus': {
      outline: 'none',
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    
    '&::placeholder': {
      color: theme.palette.text.disabled,
    },
  },
}));

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing here... ✨',
  minHeight = 250,
  maxHeight = 600,
  error = false,
  disabled = false,
  readOnly = false,
  label,
  helperText,
  required = false,
  fullWidth = true,
  showToolbar = true,
  showCharacterCount = true,
  theme: themeMode = 'light',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [linkAnchor, setLinkAnchor] = useState<null | HTMLElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ top: 0, left: 0 });
  const [activeToolbarGroup, setActiveToolbarGroup] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [spellCheck, setSpellCheck] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(themeMode);

  // Toolbar configuration
  const toolbarGroups: ToolbarGroup[] = [
    {
      id: 'history',
      label: 'History',
      buttons: [
        { icon: <UndoIcon />, title: 'Undo (Ctrl+Z)', command: 'undo', group: 'history' },
        { icon: <RedoIcon />, title: 'Redo (Ctrl+Y)', command: 'redo', group: 'history' },
      ],
    },
    {
      id: 'formatting',
      label: 'Text Formatting',
      buttons: [
        { icon: <FormatBold />, title: 'Bold (Ctrl+B)', command: 'bold', group: 'formatting' },
        { icon: <FormatItalic />, title: 'Italic (Ctrl+I)', command: 'italic', group: 'formatting' },
        { icon: <FormatUnderlined />, title: 'Underline (Ctrl+U)', command: 'underline', group: 'formatting' },
        { icon: <StrikethroughIcon />, title: 'Strikethrough', command: 'strikethrough', group: 'formatting' },
        { icon: <SubscriptIcon />, title: 'Subscript', command: 'subscript', group: 'formatting' },
        { icon: <SuperscriptIcon />, title: 'Superscript', command: 'superscript', group: 'formatting' },
      ],
    },
    {
      id: 'structure',
      label: 'Document Structure',
      buttons: [
        { icon: <TextFieldsIcon />, title: 'Text Format', command: 'format', group: 'structure' },
        { icon: <FormatListBulleted />, title: 'Bulleted List', command: 'insertUnorderedList', group: 'structure' },
        { icon: <FormatListNumbered />, title: 'Numbered List', command: 'insertOrderedList', group: 'structure' },
        { icon: <FormatQuote />, title: 'Blockquote', command: 'formatBlock', value: '<blockquote>', group: 'structure' },
        { icon: <HorizontalRuleIcon />, title: 'Horizontal Rule', command: 'insertHorizontalRule', group: 'structure' },
      ],
    },
    {
      id: 'alignment',
      label: 'Alignment',
      buttons: [
        { icon: <FormatAlignLeft />, title: 'Align Left', command: 'justifyLeft', group: 'alignment' },
        { icon: <FormatAlignCenter />, title: 'Align Center', command: 'justifyCenter', group: 'alignment' },
        { icon: <FormatAlignRight />, title: 'Align Right', command: 'justifyRight', group: 'alignment' },
        { icon: <FormatAlignJustify />, title: 'Justify', command: 'justifyFull', group: 'alignment' },
      ],
    },
    {
      id: 'media',
      label: 'Media & Insert',
      buttons: [
        { icon: <AddLinkIcon />, title: 'Insert Link', command: 'link', group: 'media' },
        { icon: <ImageIcon />, title: 'Insert Image', command: 'image', group: 'media' },
        { icon: <DataObjectIcon />, title: 'Insert Code', command: 'code', group: 'media' },
        { icon: <TableIcon />, title: 'Insert Table', command: 'table', group: 'media' },
        { icon: <SmartDisplayIcon />, title: 'Insert Video', command: 'video', group: 'media' },
        { icon: <FunctionsIcon />, title: 'Insert Math', command: 'math', group: 'media' },
      ],
    },
    {
      id: 'advanced',
      label: 'Advanced',
      buttons: [
        { icon: <SpellcheckIcon />, title: 'Toggle Spell Check', command: 'spellcheck', group: 'advanced' },
        { icon: <PaletteIcon />, title: 'Text Color', command: 'foreColor', group: 'advanced' },
        { icon: <DashboardIcon />, title: 'Background Color', command: 'backColor', group: 'advanced' },
        { icon: <EmojiIcon />, title: 'Insert Emoji', command: 'emoji', group: 'advanced' },
        { icon: <FormatClear />, title: 'Clear Formatting', command: 'removeFormat', group: 'advanced' },
      ],
    },
  ];

  // Heading options
  const headingOptions = [
    { level: 0, label: 'Normal Text', icon: <TextFormatIcon /> },
    { level: 1, label: 'Heading 1', icon: <TitleIcon /> },
    { level: 2, label: 'Heading 2', icon: <TitleIcon /> },
    { level: 3, label: 'Heading 3', icon: <TitleIcon /> },
    { level: 4, label: 'Heading 4', icon: <TitleIcon /> },
    { level: 5, label: 'Heading 5', icon: <TitleIcon /> },
    { level: 6, label: 'Heading 6', icon: <TitleIcon /> },
  ];

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      updateHistory(value);
      updateCounts(value);
    }
  }, [value]);

  // Update counts
  const updateCounts = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '');
    setCharacterCount(text.length);
    setWordCount(text.split(/\s+/).filter(word => word.length > 0).length);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current?.contains(e.target as Node) || disabled || readOnly) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            execCommand('underline');
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'k':
            e.preventDefault();
            const selection = window.getSelection();
            if (selection && selection.toString()) {
              setLinkText(selection.toString());
              setLinkAnchor(document.activeElement as HTMLElement);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, readOnly]);

  const updateHistory = (content: string) => {
    const newHistory = [...history.slice(0, historyIndex + 1), content];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateHistory(content);
      updateCounts(content);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    if (html && !html.includes('<img')) {
      // Clean and sanitize HTML
      const cleanHtml = html.replace(/<(\/?(?:div|span|font|style)[^>]*)>/gi, '');
      document.execCommand('insertHTML', false, cleanHtml);
    } else {
      document.execCommand('insertText', false, text);
    }
    
    handleContentChange();
  };

  const execCommand = (command: string, value?: string) => {
    if (command === 'link') {
      const selection = window.getSelection();
      if (selection) {
        setLinkText(selection.toString());
        setLinkAnchor(editorRef.current);
      }
      return;
    }
    
    if (command === 'image') {
      handleImageInsert();
      return;
    }
    
    if (command === 'code') {
      handleCodeInsert();
      return;
    }
    
    if (command === 'table') {
      handleTableInsert();
      return;
    }
    
    if (command === 'spellcheck') {
      setSpellCheck(!spellCheck);
      if (editorRef.current) {
        editorRef.current.spellcheck = !spellCheck;
      }
      return;
    }
    
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const content = history[newIndex];
      onChange(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        updateCounts(content);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const content = history[newIndex];
      onChange(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        updateCounts(content);
      }
    }
  };

  const handleHeadingSelect = (level: number) => {
    if (level === 0) {
      execCommand('formatBlock', '<p>');
    } else {
      execCommand('formatBlock', `<h${level}>`);
    }
    setHeadingAnchor(null);
  };

  const handleLinkInsert = () => {
    if (linkUrl.trim()) {
      const selection = window.getSelection();
      let text = linkText.trim();
      
      if (!text && selection?.toString()) {
        text = selection.toString();
      } else if (!text) {
        text = linkUrl;
      }

      const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" title="${linkUrl}" class="rich-text-link">${text}</a>`;
      document.execCommand('insertHTML', false, html);
      handleContentChange();
      
      setLinkUrl('');
      setLinkText('');
      setLinkAnchor(null);
    }
  };

  const handleImageInsert = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const alt = prompt('Enter image description (alt text):', 'Image');
      const caption = prompt('Enter image caption (optional):', '');
      const html = `
        <div class="rich-text-image">
          <img src="${url}" alt="${alt || 'Image'}" />
          ${caption ? `<div class="image-caption">${caption}</div>` : ''}
        </div>
      `;
      document.execCommand('insertHTML', false, html);
      handleContentChange();
    }
  };

  const handleCodeInsert = () => {
    const code = prompt('Enter code:');
    if (code) {
      const language = prompt('Enter programming language (optional):');
      const html = `<pre class="code-block"><code${language ? ` class="language-${language}"` : ''}>${code}</code></pre>`;
      document.execCommand('insertHTML', false, html);
      handleContentChange();
    }
  };

  const handleTableInsert = () => {
    const rows = prompt('Number of rows (max 10):', '3');
    const cols = prompt('Number of columns (max 10):', '3');
    const rowNum = Math.min(parseInt(rows || '3'), 10);
    const colNum = Math.min(parseInt(cols || '3'), 10);
    
    let tableHtml = '<table class="rich-text-table">';
    tableHtml += '<thead><tr>';
    for (let i = 0; i < colNum; i++) {
      tableHtml += `<th>Header ${i + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    
    for (let i = 0; i < rowNum; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < colNum; j++) {
        tableHtml += `<td>Cell ${i + 1},${j + 1}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    
    document.execCommand('insertHTML', false, tableHtml);
    handleContentChange();
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      
      if (editorRect) {
        setFloatingToolbarPosition({
          top: rect.top - editorRect.top - 50,
          left: rect.left - editorRect.left + (rect.width / 2),
        });
        setShowFloatingToolbar(true);
      }
    } else {
      setShowFloatingToolbar(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setActiveToolbarGroup('formatting');
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowFloatingToolbar(false);
    }, 200);
  };

  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <EditorToolbar themeMode={currentTheme} visible={isFocused || showToolbar}>
        {toolbarGroups.map((group) => (
          <ToolbarGroupContainer key={group.id}>
            {group.buttons.map((button) => (
              <Tooltip 
                key={`${group.id}-${button.command}`} 
                title={button.title}
                arrow
                placement="top"
              >
                <span>
                  <StyledIconButton
                    size="small"
                    onClick={() => execCommand(button.command, button.value)}
                    disabled={disabled}
                    onMouseEnter={() => setActiveToolbarGroup(group.id)}
                    onMouseLeave={() => setActiveToolbarGroup(null)}
                  >
                    {button.icon}
                  </StyledIconButton>
                </span>
              </Tooltip>
            ))}
          </ToolbarGroupContainer>
        ))}
        
        {/* Theme toggle */}
        <StyledIconButton
          size="small"
          onClick={() => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light')}
        >
          <AutoAwesomeIcon />
        </StyledIconButton>
      </EditorToolbar>
    );
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', position: 'relative' }}>
      {label && (
        <Label className={required ? 'required' : ''} variant="body2">
          {label}
          {!readOnly && (
            <StatusChip
              label={`${wordCount} words`}
              size="small"
            />
          )}
        </Label>
      )}
      
      <StyledEditorContainer
        themeMode={currentTheme}
        error={error}
        focused={isFocused}
        disabled={disabled}
        readOnly={readOnly}
        className={`${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${readOnly ? 'readOnly' : ''}`}
        elevation={0}
      >
        {renderToolbar()}
        
        <Box position="relative">
          {showFloatingToolbar && !readOnly && !disabled && (
            <FloatingToolbar style={floatingToolbarPosition}>
              <Tooltip title="Bold (Ctrl+B)">
                <StyledIconButton size="small" onClick={() => execCommand('bold')}>
                  <FormatBold />
                </StyledIconButton>
              </Tooltip>
              <Tooltip title="Italic (Ctrl+I)">
                <StyledIconButton size="small" onClick={() => execCommand('italic')}>
                  <FormatItalic />
                </StyledIconButton>
              </Tooltip>
              <Tooltip title="Link (Ctrl+K)">
                <StyledIconButton size="small" onClick={() => execCommand('link')}>
                  <AddLinkIcon />
                </StyledIconButton>
              </Tooltip>
            </FloatingToolbar>
          )}
          
          <EditorContent
            ref={editorRef}
            contentEditable={!disabled && !readOnly}
            onInput={handleContentChange}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
            data-placeholder={placeholder}
            minHeight={minHeight}
            maxHeight={maxHeight}
            readOnly={readOnly}
            themeMode={currentTheme}
            spellCheck={spellCheck}
            suppressContentEditableWarning
          />
        </Box>

        {showCharacterCount && !readOnly && (
          <CharacterCount>
            <span>{wordCount} words</span>
            <span>{characterCount} characters</span>
            <span>Reading time: {Math.ceil(wordCount / 200)} min</span>
            <span>Spell check: {spellCheck ? 'ON' : 'OFF'}</span>
          </CharacterCount>
        )}
      </StyledEditorContainer>

      {helperText && (
        <FormHelperText 
          error={error} 
          sx={{ 
            mt: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: '0.75rem',
          }}
        >
          {error ? '⚠️' : '💡'} {helperText}
        </FormHelperText>
      )}

      {/* Heading Menu */}
      <Menu
        anchorEl={headingAnchor}
        open={Boolean(headingAnchor)}
        onClose={() => setHeadingAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {headingOptions.map((option) => (
          <MenuItem
            key={option.level}
            onClick={() => handleHeadingSelect(option.level)}
            sx={{
              py: 1.5,
              px: 2,
              gap: 2,
              fontSize: option.level === 0 ? '1rem' : 
                     option.level === 1 ? '1.5rem' : 
                     option.level === 2 ? '1.25rem' : '1rem',
              fontWeight: option.level === 0 ? 400 : 600,
              color: option.level === 0 ? 'text.secondary' : 'text.primary',
            }}
          >
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Link Insert Dialog */}
      {linkAnchor && (
        <Menu
          anchorEl={linkAnchor}
          open={Boolean(linkAnchor)}
          onClose={() => {
            setLinkAnchor(null);
            setLinkUrl('');
            setLinkText('');
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
          }}
        >
          <LinkDialog>
            <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
              Insert Link
            </Typography>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && handleLinkInsert()}
            />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link text (optional)"
              onKeyDown={(e) => e.key === 'Enter' && handleLinkInsert()}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <StyledIconButton
                onClick={() => {
                  setLinkAnchor(null);
                  setLinkUrl('');
                  setLinkText('');
                }}
              >
                Cancel
              </StyledIconButton>
              <StyledIconButton
                onClick={handleLinkInsert}
                disabled={!linkUrl.trim()}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '&:disabled': {
                    backgroundColor: 'action.disabled',
                  },
                }}
              >
                <CheckIcon />
                Insert
              </StyledIconButton>
            </Box>
          </LinkDialog>
        </Menu>
      )}
    </Box>
  );
};

export default RichTextEditor;