"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAgentApiKeysAction,
  createAgentApiKeyDirectAction,
  cancelAgentApiKeyAction,
} from "./actions";

export interface AgentDrawerData {
  id: string;
  name: string;
  mode: string;
  status: string;
  walletAddress?: string;
}

interface ApiKeyItem {
  id: string;
  prefix: string;
  scopes: string[];
  status: "active" | "cancelled";
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface ApiKeysDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentDrawerData | null;
  onKeyChange?: (agentId: string, latestPrefix?: string) => void;
}

export default function ApiKeysDrawer({
  isOpen,
  onClose,
  agent,
  onKeyChange,
}: ApiKeysDrawerProps) {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New key alert
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{
    rawKey: string;
    prefix: string;
  } | null>(null);
  const [copiedRawKey, setCopiedRawKey] = useState(false);

  // Copy prefix feedback
  const [copiedPrefixId, setCopiedPrefixId] = useState<string | null>(null);

  // Confirmation state for cancellation
  const [cancellingKeyId, setCancellingKeyId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelDeleteWord, setCancelDeleteWord] = useState<string>("");

  const [isGenerating, startGenerating] = useTransition();
  const [isCancelling, startCancelling] = useTransition();

  // Load keys when drawer opens
  useEffect(() => {
    if (!isOpen || !agent) {
      setNewlyCreatedKey(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getAgentApiKeysAction(agent.id)
      .then((data) => {
        if (isMounted) {
          setKeys(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load API keys");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, agent]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Create New API Key
  const handleCreateKey = () => {
    if (!agent) return;
    setError(null);

    startGenerating(async () => {
      try {
        const result = await createAgentApiKeyDirectAction(agent.id);
        setNewlyCreatedKey({
          rawKey: result.rawKey,
          prefix: result.prefix,
        });

        // Prepend to keys list
        const newKeyItem: ApiKeyItem = {
          id: result.keyId,
          prefix: result.prefix,
          scopes: ["read", "ask"],
          status: "active",
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          revokedAt: null,
        };

        setKeys((prev) => [newKeyItem, ...prev]);
        onKeyChange?.(agent.id, result.prefix);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate key");
      }
    });
  };

  // Handle Cancel / Revoke Key
  const handleCancelKey = (keyId: string) => {
    if (!agent) return;
    if (cancelDeleteWord.trim().toUpperCase() !== "DELETE") {
      setError("Please type 'DELETE' to confirm blocking this key.");
      return;
    }
    if (!cancelReason.trim()) {
      setError("Please provide a reason for blocking this API key.");
      return;
    }

    setError(null);

    startCancelling(async () => {
      try {
        const res = await cancelAgentApiKeyAction(
          keyId,
          agent.id,
          cancelReason.trim(),
          cancelDeleteWord.trim()
        );
        if (res.success) {
          setKeys((prev) =>
            prev.map((k) =>
              k.id === keyId
                ? { ...k, status: "cancelled", revokedAt: new Date().toISOString() }
                : k
            )
          );
          setCancellingKeyId(null);
          setCancelReason("");
          setCancelDeleteWord("");

          // Update latest active key prefix in parent if available
          const remainingActive = keys.find((k) => k.id !== keyId && k.status === "active");
          onKeyChange?.(agent.id, remainingActive?.prefix);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cancel key");
      }
    });
  };

  const handleCopyRawKey = async (rawKey: string) => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopiedRawKey(true);
      setTimeout(() => setCopiedRawKey(false), 2000);
    } catch {}
  };

  const handleCopyPrefix = async (prefix: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(`${prefix}...`);
      setCopiedPrefixId(keyId);
      setTimeout(() => setCopiedPrefixId(null), 2000);
    } catch {}
  };

  if (!agent) return null;

  return (
    <>
      {/* Dimmed Background Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Animated Slide-Over Drawer flowing smoothly from Right to Left */}
      <aside
        aria-label="Agent API Keys Panel"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl sm:max-w-2xl bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] p-6 bg-[var(--background)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                API Management
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                  agent.status === "active"
                    ? "bg-green-100 text-green-900 border border-green-200"
                    : "bg-red-100 text-red-900 border border-red-200"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {agent.name}
            </h2>
            <p className="mt-1 text-xs text-[var(--secondary)] font-mono">
              Agent ID: <span className="text-[var(--foreground)]">{agent.id}</span>
              {agent.walletAddress && (
                <span className="ml-2">
                  &bull; Wallet: {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition"
            aria-label="Close API Keys Panel"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Action Bar: Create New API Key Button */}
        <div className="border-b border-[var(--border)] p-5 bg-[var(--surface)] flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Authentication Credentials</h3>
            <p className="text-xs text-[var(--secondary)] mt-0.5">
              Generate scoped API keys for autonomous execution and programmatic access.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateKey}
            disabled={isGenerating}
            className="whitespace-nowrap rounded border border-green-800 bg-green-800 px-4 py-2 text-xs font-mono font-bold text-white hover:bg-green-900 transition active:scale-98 disabled:opacity-50 shadow-xs"
          >
            {isGenerating ? "Generating..." : "+ Create New Key"}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3.5 text-xs font-mono text-red-800">
              {error}
            </div>
          )}

          {/* Newly Generated Raw Key Alert Card (shown immediately upon creation) */}
          {newlyCreatedKey && (
            <div className="rounded-lg border-2 border-green-600 bg-green-50 p-4 font-mono text-xs text-green-950 flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-green-900 text-[11px]">
                  New API Key Generated Successfully
                </span>
                <span className="text-[10px] text-green-700 bg-green-200/60 rounded px-1.5 py-0.5">
                  Save Immediately
                </span>
              </div>
              <p className="font-sans text-xs text-green-900 leading-relaxed">
                Copy your API key now. For security, Half-Life only hashes keys with SHA-256 and will never display the raw key again.
              </p>

              <div className="mt-1 flex items-center justify-between gap-2 rounded border border-green-300 bg-white p-2.5 overflow-hidden">
                <code className="text-xs font-mono break-all text-green-950 font-semibold select-all">
                  {newlyCreatedKey.rawKey}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyRawKey(newlyCreatedKey.rawKey)}
                  className="rounded bg-green-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-900 transition shrink-0"
                >
                  {copiedRawKey ? "Copied!" : "Copy Key"}
                </button>
              </div>
            </div>
          )}

          {/* Keys Listing Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)] font-semibold">
                Generated API Keys ({keys.length})
              </span>
              <span className="text-xs font-mono text-[var(--secondary)]">
                Active: {keys.filter((k) => k.status === "active").length}
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs font-mono text-[var(--secondary)]">
                Loading API keys...
              </div>
            ) : keys.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--secondary)]">
                <p className="font-medium text-[var(--foreground)]">No API keys found for this agent.</p>
                <p className="mt-1">Click &quot;+ Create New Key&quot; above to issue your first credentials.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {keys.map((key) => {
                  const isRevoked = key.status === "cancelled";
                  const isConfirming = cancellingKeyId === key.id;

                  return (
                    <div
                      key={key.id}
                      className={`rounded-lg border p-4 transition flex flex-col justify-between gap-3 ${
                        isRevoked
                          ? "border-[var(--border)] bg-[var(--surface)] opacity-60"
                          : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--foreground)]">
                              {key.prefix}...
                            </code>

                            <button
                              type="button"
                              onClick={() => handleCopyPrefix(key.prefix, key.id)}
                              className="text-[11px] font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
                            >
                              {copiedPrefixId === key.id ? "Copied" : "Copy Prefix"}
                            </button>

                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider ${
                                isRevoked
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {key.status}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--secondary)]">
                            <span>
                              Created: {key.createdAt.slice(0, 19).replace("T", " ")} UTC
                            </span>
                            {key.lastUsedAt && (
                              <span>
                                Last used: {key.lastUsedAt.slice(0, 19).replace("T", " ")} UTC
                              </span>
                            )}
                            {key.revokedAt && (
                              <span className="text-red-700">
                                Revoked: {key.revokedAt.slice(0, 19).replace("T", " ")} UTC
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action: Cancel Key / Confirm Revocation */}
                        {!isRevoked && (
                          <div className="shrink-0">
                            {!isConfirming && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingKeyId(key.id);
                                  setCancelReason("");
                                  setCancelDeleteWord("");
                                }}
                                className="rounded border border-red-200 bg-red-50/60 px-2.5 py-1 text-xs font-mono font-medium text-red-700 hover:bg-red-100 transition cursor-pointer"
                              >
                                Block Key
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Confirmation Block inside Drawer */}
                      {isConfirming && (
                        <div className="mt-3 p-3 rounded border border-red-300 bg-red-50/60 flex flex-col gap-2 font-mono text-xs">
                          <span className="font-bold text-red-900">
                            Confirm Blocking Key ({key.prefix}...)
                          </span>
                          <div>
                            <label className="text-[10px] text-red-800 uppercase block mb-0.5">
                              1. Reason for blocking:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Key leaked, testing complete..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="w-full rounded border border-red-300 bg-white px-2.5 py-1 text-xs font-mono text-red-950"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-red-800 uppercase block mb-0.5">
                              2. Type <strong>DELETE</strong> to confirm:
                            </label>
                            <input
                              type="text"
                              placeholder="DELETE"
                              value={cancelDeleteWord}
                              onChange={(e) => setCancelDeleteWord(e.target.value)}
                              className="w-full rounded border border-red-300 bg-white px-2.5 py-1 text-xs font-mono text-red-900 font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => handleCancelKey(key.id)}
                              disabled={
                                isCancelling ||
                                cancelDeleteWord.trim().toUpperCase() !== "DELETE" ||
                                !cancelReason.trim()
                              }
                              className="rounded bg-red-700 px-3 py-1 text-xs font-mono font-bold text-white hover:bg-red-800 transition disabled:opacity-40 cursor-pointer"
                            >
                              {isCancelling ? "Blocking..." : "Confirm & Block"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingKeyId(null);
                                setCancelReason("");
                                setCancelDeleteWord("");
                              }}
                              className="text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)] underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Scopes & Permissions */}
                      <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between text-[11px] font-mono text-[var(--secondary)]">
                        <span>Authorized Scopes: {key.scopes.join(", ")}</span>
                        <span>Key ID: {key.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--background)] flex items-center justify-between">
          <p className="text-[11px] text-[var(--secondary)] font-mono">
            Cancelled keys are instantly denied by the Governor with HTTP 401.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-mono font-medium text-[var(--foreground)] hover:border-[var(--border-strong)] transition"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

