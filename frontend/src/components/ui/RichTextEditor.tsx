// src/components/ui/CustomRichTextEditor.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Eye,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { Textarea } from '@/components/ui/textarea';

interface CustomRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

type ToolbarButton = {
  icon: React.ReactNode;
  label: string;
  action: (text: string) => string;
  preview?: boolean;
};

export const CustomRichTextEditor: React.FC<CustomRichTextEditorProps> = ({
  value,
  onChange,
  maxLength = 20000,
  placeholder = 'Write your description here...',
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (wrapper: (text: string) => string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = 
      value.substring(0, start) +
      wrapper(selectedText) +
      value.substring(end);
    
    onChange(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + wrapper('').length;
        textareaRef.current.selectionEnd = start + wrapper('').length + selectedText.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSelect = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
    }
  };

  const toolbarButtons: ToolbarButton[] = [
    {
      icon: <Bold className="h-4 w-4" />,
      label: 'Bold',
      action: (text) => text ? `**${text}**` : '**bold text**',
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: 'Italic',
      action: (text) => text ? `*${text}*` : '*italic text*',
    },
    {
      icon: <Heading1 className="h-4 w-4" />,
      label: 'Heading 1',
      action: (text) => text ? `# ${text}` : '# Heading 1',
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      label: 'Heading 2',
      action: (text) => text ? `## ${text}` : '## Heading 2',
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      label: 'Heading 3',
      action: (text) => text ? `### ${text}` : '### Heading 3',
    },
    {
      icon: <List className="h-4 w-4" />,
      label: 'Bullet List',
      action: (text) => {
        if (text) {
          return text.split('\n').map(line => `- ${line}`).join('\n');
        }
        return '- List item';
      },
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      label: 'Numbered List',
      action: (text) => {
        if (text) {
          return text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        }
        return '1. List item';
      },
    },
    {
      icon: <Quote className="h-4 w-4" />,
      label: 'Quote',
      action: (text) => text ? `> ${text}` : '> Quote',
    },
    {
      icon: <Code className="h-4 w-4" />,
      label: 'Code',
      action: (text) => text ? `\`${text}\`` : '`code`',
    },
    {
      icon: <Link className="h-4 w-4" />,
      label: 'Link',
      action: (text) => {
        if (text) {
          return `[${text}](url)`;
        }
        return '[link text](url)';
      },
    },
  ];

  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-gray-500 italic">No content</p>;

    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mt-2 mb-1">{line.slice(4)}</h3>;
      }
      
      // Lists
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={index} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      
      // Quote
      if (line.startsWith('> ')) {
        return <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic my-2">{line.slice(2)}</blockquote>;
      }
      
      // Empty line
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Process inline markdown
      let processed = line;
      
      // Bold
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Code
      processed = processed.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
      // Links
      processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-emerald-600 hover:underline" target="_blank">$1</a>');
      
      return (
        <p 
          key={index} 
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown(button.action)}
            className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-700"
            title={button.label}
          >
            {button.icon}
          </Button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          <Button
            type="button"
            variant={mode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('edit')}
            className={cn(
              "h-7 px-3",
              mode === 'edit' 
                ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('preview')}
            className={cn(
              "h-7 px-3",
              mode === 'preview' 
                ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {mode === 'edit' ? (
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleSelect}
            maxLength={maxLength}
            placeholder={placeholder}
            className="border-0 rounded-none min-h-[300px] p-4 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
            {value.length}/{maxLength}
          </div>
        </div>
      ) : (
        <div className="min-h-[300px] p-4 prose prose-sm max-w-none overflow-y-auto">
          {renderMarkdown(value)}
        </div>
      )}
    </div>
  );
};

export default CustomRichTextEditor;