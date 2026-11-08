"use client";

import { useState } from "react";
import Link from "next/link";

export default function ApiKeyBanner({
  rawKey,
  agentName,
  isNew,
}: {
  rawKey: string;
  agentName: string;
  isNew: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback if clipboard API not available
    }
  };

  return (
    <div className="rounded-lg border-2 border-green-600 bg-green-50/90 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block rounded bg-green-700 px-2 py-0.5 text-xs font-mono font-bold text-white uppercase tracking-wider">
            {isNew ? "Agent Created" : "New API Key Generated"}
          </span>
          <h2 className="mt-2 text-base font-semibold text-green-950">
            API Key for <span className="underline">{agentName}</span>
          </h2>
          <p className="mt-1 text-xs text-green-800">
            Copy and store this API key now. For your security, this key <strong>will never be shown again</strong>.
          </p>
        </div>
        <Link
          href="/app/agents"
          onClick={() => setDismissed(true)}
          className="rounded px-2 py-1 text-xs font-mono text-green-800 hover:bg-green-100 hover:text-green-950"
          title="Dismiss"
        >
          &times; Dismiss
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1 overflow-x-auto rounded border border-green-400 bg-white px-3.5 py-2.5 font-mono text-xs font-semibold text-green-950 select-all">
          {rawKey}
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="rounded border border-green-800 bg-green-800 px-5 py-2.5 text-xs font-mono font-bold text-white hover:bg-green-900 transition active:scale-98 shadow-sm"
        >
          {copied ? "✓ Copied to Clipboard!" : "Copy API Key"}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-green-800">
        <span>Header usage:</span>
        <code className="rounded border border-green-300 bg-white px-1.5 py-0.5 font-semibold">
          Authorization: Bearer {rawKey.slice(0, 16)}...
        </code>
      </div>
    </div>
  );
}
