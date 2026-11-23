'use client';

import { Check, Copy, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import { SITE_URL } from '@/lib/site';

interface PageActionsProps {
  markdownUrl: string;
  pageUrl: string;
}

export function PageActions({ markdownUrl, pageUrl }: PageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCopyMarkdown() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(markdownUrl);
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  const fullMarkdownUrl = `${SITE_URL}${markdownUrl}`;
  const fullPageUrl = `${SITE_URL}${pageUrl}`;
  const prompt = encodeURIComponent(
    `Read ${fullMarkdownUrl} (from ${fullPageUrl}) and answer questions about ola-map-sdk v2.0 based on it.`,
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-fd-border pb-4 text-xs">
      <button
        type="button"
        onClick={handleCopyMarkdown}
        className="inline-flex items-center gap-1.5 border border-fd-border bg-fd-background px-2.5 py-1.5 font-medium text-fd-foreground transition-colors hover:border-fd-foreground hover:bg-fd-muted"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-fd-foreground" />
            Copied Markdown
          </>
        ) : (
          <>
            <Copy className="size-3.5 text-fd-muted-foreground" />
            {loading ? 'Copying…' : 'Copy Markdown'}
          </>
        )}
      </button>

      <a
        href={markdownUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 border border-fd-border bg-fd-background px-2.5 py-1.5 font-medium text-fd-muted-foreground transition-colors hover:border-fd-foreground hover:text-fd-foreground"
      >
        <FileText className="size-3.5" />
        View .md
      </a>

      <a
        href={`https://chatgpt.com/?q=${prompt}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 border border-fd-border bg-fd-background px-2.5 py-1.5 font-medium text-fd-muted-foreground transition-colors hover:border-fd-foreground hover:text-fd-foreground"
      >
        <ExternalLink className="size-3.5" />
        Open in ChatGPT
      </a>

      <a
        href={`https://claude.ai/new?q=${prompt}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 border border-fd-border bg-fd-background px-2.5 py-1.5 font-medium text-fd-muted-foreground transition-colors hover:border-fd-foreground hover:text-fd-foreground"
      >
        <ExternalLink className="size-3.5" />
        Open in Claude
      </a>
    </div>
  );
}
