'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

const MANAGERS = [
  { id: 'npm', cmd: 'npm install ola-map-sdk' },
  { id: 'pnpm', cmd: 'pnpm add ola-map-sdk' },
  { id: 'yarn', cmd: 'yarn add ola-map-sdk' },
  { id: 'bun', cmd: 'bun add ola-map-sdk' },
] as const;

export function InstallCommand() {
  const [active, setActive] = useState<(typeof MANAGERS)[number]>(MANAGERS[0]);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(active.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col border border-fd-border bg-fd-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border bg-fd-muted px-2 py-1.5">
        <div className="flex items-center gap-1">
          {MANAGERS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(m)}
              className={`px-2 py-0.5 font-mono text-[11px] font-medium transition-colors ${
                active.id === m.id
                  ? 'bg-fd-foreground text-fd-background'
                  : 'text-fd-muted-foreground hover:text-fd-foreground'
              }`}
            >
              {m.id}
            </button>
          ))}
        </div>
        <span className="pr-1 font-mono text-[10px] text-fd-muted-foreground">
          0 deps · ESM + CJS
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-3 px-3.5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto font-mono text-[13px] text-fd-foreground">
          <span className="select-none text-fd-muted-foreground">$</span>
          <code className="whitespace-nowrap">{active.cmd}</code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy install command"
          className="inline-flex shrink-0 items-center gap-1.5 border border-fd-border bg-fd-background px-2.5 py-1 font-mono text-[11px] text-fd-muted-foreground transition-colors hover:border-fd-foreground hover:text-fd-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3 text-fd-foreground" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
