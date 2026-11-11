"use client";

import { useState } from "react";
import ApiKeysDrawer, { type AgentDrawerData } from "./api-keys-drawer";
import { toggleAgentStatusAction } from "./actions";

export interface SerializedAgent {
  id: string;
  name: string;
  mode: string;
  status: string;
  walletAddress?: string;
  dailyCapUsdc: number;
  perAskCapUsdc: number;
}

interface AgentsClientProps {
  initialAgents: SerializedAgent[];
  initialKeysMap: Record<string, string>;
  initialCountsMap: Record<string, number>;
}

export default function AgentsClient({
  initialAgents,
  initialKeysMap,
  initialCountsMap,
}: AgentsClientProps) {
  const [agents, setAgents] = useState<SerializedAgent[]>(initialAgents);
  const [keysMap, setKeysMap] = useState<Record<string, string>>(initialKeysMap);
  const [countsMap, setCountsMap] = useState<Record<string, number>>(initialCountsMap);

  // Drawer State
  const [selectedAgent, setSelectedAgent] = useState<AgentDrawerData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = (agent: SerializedAgent) => {
    setSelectedAgent({
      id: agent.id,
      name: agent.name,
      mode: agent.mode,
      status: agent.status,
      walletAddress: agent.walletAddress,
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleKeyChange = (agentId: string, latestPrefix?: string) => {
    if (latestPrefix) {
      setKeysMap((prev) => ({ ...prev, [agentId]: latestPrefix }));
    }
    setCountsMap((prev) => ({
      ...prev,
      [agentId]: (prev[agentId] || 0) + (latestPrefix ? 1 : 0),
    }));
  };

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a))
    );
    try {
      await toggleAgentStatusAction(agentId, currentStatus);
    } catch {
      // Revert if error
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: currentStatus } : a))
      );
    }
  };

  return (
    <>
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Wallet Address</th>
              <th className="px-4 py-3">API Key</th>
              <th className="px-4 py-3 text-right">Daily Cap</th>
              <th className="px-4 py-3 text-right">Per-Ask Cap</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {agents.map((agent) => {
              const isPaused = agent.status === "paused";
              const existingKeyPrefix = keysMap[agent.id];
              const keyCount = countsMap[agent.id] || (existingKeyPrefix ? 1 : 0);

              return (
                <tr key={agent.id} className="hover:bg-[var(--background)] transition">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{agent.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                        agent.mode === "halflife"
                          ? "border border-green-800 bg-green-50 text-green-800"
                          : "border border-gray-400 bg-gray-100 text-gray-700"
                      }`}
                    >
                      {agent.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                        !isPaused ? "text-[var(--success)] font-semibold" : "text-[var(--error)]"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">
                    {agent.walletAddress
                      ? `${agent.walletAddress.slice(0, 8)}...${agent.walletAddress.slice(-6)}`
                      : "Generating..."}
                  </td>

                  {/* API Key Interactive Column */}
                  <td className="px-4 py-3">
                    {existingKeyPrefix ? (
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(agent)}
                        className="group flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono hover:border-purple-600 hover:bg-purple-50/50 transition cursor-pointer"
                        title="Click to view all keys, cancel keys, or generate a new key"
                      >
                        <span className="font-semibold text-[var(--foreground)] group-hover:text-purple-900">
                          {existingKeyPrefix}...
                        </span>
                        <span className="rounded bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 text-[10px] font-bold">
                          Manage ({keyCount}) &rarr;
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(agent)}
                        className="rounded border border-green-700 bg-green-50 px-2.5 py-1 text-xs font-mono font-medium text-green-800 hover:bg-green-100 transition shadow-xs cursor-pointer"
                      >
                        + API Keys
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-xs">
                    ${agent.dailyCapUsdc.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    ${agent.perAskCapUsdc.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(agent.id, agent.status)}
                      className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition"
                    >
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-Over Drawer Component */}
      <ApiKeysDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        agent={selectedAgent}
        onKeyChange={handleKeyChange}
      />
    </>
  );
}
