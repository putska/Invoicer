// components/engineering/RichTextEditor.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your notes...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false,
    blockquote: false,
    code: false,
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  // Check which formatting is active
  const checkActiveStates = () => {
    if (!editorRef.current) return;

    setIsActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      blockquote:
        document.queryCommandState("formatBlock") &&
        document.queryCommandValue("formatBlock") === "blockquote",
      code:
        document.queryCommandState("formatBlock") &&
        document.queryCommandValue("formatBlock") === "code",
    });
  };

  const executeCommand = (command: string, value?: string) => {
    if (disabled) return;

    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveStates();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleKeyUp = () => {
    checkActiveStates();
    handleContentChange();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleContentChange();
  };

  const formatButton = (
    icon: React.ReactNode,
    command: string,
    isActiveKey: keyof typeof isActive,
    title: string,
    value?: string
  ) => (
    <Button
      type="button"
      variant={isActive[isActiveKey] ? "default" : "outline"}
      size="sm"
      onClick={() => executeCommand(command, value)}
      disabled={disabled}
      title={title}
      className="h-8 w-8 p-0"
    >
      {icon}
    </Button>
  );

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        {formatButton(<Bold className="h-4 w-4" />, "bold", "bold", "Bold")}
        {formatButton(
          <Italic className="h-4 w-4" />,
          "italic",
          "italic",
          "Italic"
        )}
        {formatButton(
          <Underline className="h-4 w-4" />,
          "underline",
          "underline",
          "Underline"
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {formatButton(
          <List className="h-4 w-4" />,
          "insertUnorderedList",
          "unorderedList",
          "Bullet List"
        )}
        {formatButton(
          <ListOrdered className="h-4 w-4" />,
          "insertOrderedList",
          "orderedList",
          "Numbered List"
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {formatButton(
          <Quote className="h-4 w-4" />,
          "formatBlock",
          "blockquote",
          "Quote",
          "blockquote"
        )}
        {formatButton(
          <Code className="h-4 w-4" />,
          "formatBlock",
          "code",
          "Code Block",
          "code"
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand("undo")}
          disabled={disabled}
          title="Undo"
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => executeCommand("redo")}
          disabled={disabled}
          title="Redo"
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        className={cn(
          "min-h-[120px] p-3 outline-none",
          "prose prose-sm max-w-none",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          disabled && "bg-gray-50 text-gray-500"
        )}
        style={{
          wordBreak: "break-word",
          lineHeight: "1.6",
        }}
        onInput={handleContentChange}
        onKeyUp={handleKeyUp}
        onMouseUp={checkActiveStates}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
