"use client";

import { ArrowUpIcon, PaperclipIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AttachmentTag } from "@/components/workbench/attachment-tag";
import { uploadFile } from "@/lib/api";
import { rememberFilename } from "@/lib/local-store";
import type { UploadedFile } from "@/lib/types";

/**
 * file_reader_tool in backend/app/agent/graph.py supports exactly these
 * extensions; anything else is handled by the vision tool, which needs an
 * image mime type.
 */
const ACCEPT = ".pdf,.docx,.txt,.csv,image/*";

interface ComposerProps {
  onSend: (content: string, fileIds: string[]) => Promise<unknown>;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

export function Composer({
  onSend,
  disabled,
  autoFocus,
  placeholder = "ask anything, or attach a file…",
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grow with the content instead of scrolling inside a fixed box.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  const busy = Boolean(disabled) || uploading > 0;
  const canSend = value.trim().length > 0 && !busy;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      setUploading((count) => count + 1);
      try {
        const uploaded = await uploadFile(file);
        rememberFilename(uploaded.id, uploaded.original_filename);
        setAttachments((current) => [...current, uploaded]);
      } catch (err) {
        toast.error(`Could not upload ${file.name}`, {
          description: (err as Error).message,
        });
      } finally {
        setUploading((count) => count - 1);
      }
    }
  };

  const submit = async () => {
    if (!canSend) return;

    const content = value.trim();
    const fileIds = attachments.map((attachment) => attachment.id);

    // Clear optimistically so the box is ready for the next turn; the caller
    // keeps its own copy of the text for a retry if the run fails.
    setValue("");
    setAttachments([]);

    try {
      await onSend(content, fileIds);
    } catch {
      // Surfaced by the thread's failure notice; nothing to add here.
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-card transition-shadow focus-within:border-primary/40">
      {attachments.length > 0 || uploading > 0 ? (
        <div className="flex flex-wrap gap-2 border-b px-4 pt-3.5 pb-3">
          {attachments.map((attachment) => (
            <AttachmentTag
              key={attachment.id}
              name={attachment.original_filename}
              size={attachment.size}
              onRemove={() =>
                setAttachments((current) =>
                  current.filter((item) => item.id !== attachment.id)
                )
              }
            />
          ))}
          {Array.from({ length: uploading }).map((_, index) => (
            <AttachmentTag key={`uploading-${index}`} name="" uploading />
          ))}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={value}
        autoFocus={autoFocus}
        rows={1}
        aria-label="Message"
        placeholder={disabled ? "thinking…" : placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        // `field-sizing:fixed` disables Chromium's own content sizing so the
        // height is driven purely by the effect above, in every browser.
        className="block max-h-52 w-full resize-none overflow-y-auto border-0 bg-transparent px-4 pt-4 pb-2 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-muted-foreground [field-sizing:fixed] focus:outline-none"
      />

      <div className="flex items-center justify-between gap-3 px-3 pb-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files);
              // Reset so re-picking the same file fires change again.
              event.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Attach a file"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
          >
            <PaperclipIcon className="size-4" aria-hidden />
          </button>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            pdf · docx · txt · csv · images
          </span>
        </div>

        <button
          type="button"
          aria-label="Send"
          disabled={!canSend}
          onClick={() => void submit()}
          className="btn-brand flex size-9 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35"
        >
          <ArrowUpIcon className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
