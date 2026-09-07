"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText(
      (node as { props: { children?: React.ReactNode } }).props.children
    );
  }
  return "";
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(extractText(children));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure origin or denied permission) — no-op.
    }
  };

  return (
    <div className="group/code relative my-4">
      <button
        type="button"
        aria-label="Copy code"
        onClick={copy}
        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity group-hover/code:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {copied ? (
          <CheckIcon className="size-3.5 text-[var(--success)]" aria-hidden />
        ) : (
          <CopyIcon className="size-3.5" aria-hidden />
        )}
      </button>
      <pre className="overflow-x-auto rounded-xl border bg-muted p-4 font-mono text-[0.8125rem] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

/**
 * Agent replies come back as markdown from qwen3, so headings, lists, tables
 * and fenced code all need real rendering. Body copy is Manrope; only
 * code-shaped things fall back to mono.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="max-w-none text-[0.9375rem] leading-[1.75] break-words text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="my-3 first:mt-0 last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="mt-6 mb-2 text-lg font-semibold first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-2 text-base font-semibold first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-1.5 text-[0.9375rem] font-semibold first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="my-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 flex list-decimal flex-col gap-1.5 pl-5 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-l-primary/50 pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b bg-muted px-3 py-2 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b px-3 py-2 align-top">{children}</td>
          ),
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children }) => {
            // Fenced blocks arrive wrapped in <pre>, which handles its own
            // styling; this branch is the inline case.
            if (className?.startsWith("language-")) {
              return <code className="font-mono">{children}</code>;
            }
            return (
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
