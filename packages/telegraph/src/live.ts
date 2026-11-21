import {
  createWalletClient,
  http,
  type PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import crypto from "node:crypto";
import type { Miner } from "@half-life/shared";
import { guardTransaction, type ChainGuardConfig } from "@half-life/chain";
import type { AskRequest, TelegraphClient, TelegraphQuote, TelegraphReceipt, PurchaseOutcome } from "./client.js";
import { validateAnswerForIntent } from "./schemas.js";

export interface LiveTelegraphConfig {
  nodeUrl: string;
  privateKey: `0x${string}`;
  rpcUrl?: string;
  telegraphContract?: string;
  usdcContract?: string;
  payToAllowlist?: string[];
}

export class LiveTelegraphClient implements TelegraphClient {
  readonly source = "live" as const;
  private nodeUrl: string;
  private account: PrivateKeyAccount;
  private walletClient: ReturnType<typeof createWalletClient>;
  private telegraphContract: string;
  private usdcContract: string;
  private payToAllowlist: string[];

  constructor(config: LiveTelegraphConfig) {
    this.nodeUrl = config.nodeUrl.replace(/\/+$/, "");
    this.account = privateKeyToAccount(config.privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(config.rpcUrl || "https://rpc.sepolia.org"),
    });

    this.telegraphContract = (config.telegraphContract || "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b").toLowerCase();
    this.usdcContract = (config.usdcContract || process.env.USDC_ADDRESS || "0xcc194e1a843B658526D0D5C431f670028582Ae17").toLowerCase();

    const envAllowlist = (process.env.TELEGRAPH_PAYTO_ALLOWLIST || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const configuredAllowlist = (config.payToAllowlist || []).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const combinedAllowlist = Array.from(new Set([this.telegraphContract, ...envAllowlist, ...configuredAllowlist]));
    this.payToAllowlist = combinedAllowlist;
  }

  async listIntents(): Promise<string[]> {
    const res = await fetch(`${this.nodeUrl}/engine/v1/intents`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Failed to list intents from Telegraph node: ${res.statusText}`);
    }
    const data: any = await res.json();
    if (!data.intents || !Array.isArray(data.intents)) {
      return [];
    }
    return data.intents.map((i: any) => i.intent_id || i.intent_name);
  }

  async listMiners(intent: string): Promise<Miner[]> {
    const res = await fetch(`${this.nodeUrl}/engine/v1/intents/${encodeURIComponent(intent)}/miners`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return [];
    }
    const data: any = await res.json();
    const miners = data.miners || [];
    return miners.map((m: any) => ({
      id: String(m.id ?? m.miner_id ?? ""),
      name: m.name ?? m.slug,
      address: m.address ?? m.base_url,
      rank: m.rank,
      score: m.score,
      priceUsdc: typeof m.priceUsdc === "number" ? m.priceUsdc : (typeof m.price === "number" ? m.price : undefined),
    }));
  }

  async quote(request: AskRequest): Promise<TelegraphQuote> {
    const askEndpoint = request.minerId
      ? `${this.nodeUrl}/engine/v1/ask/${encodeURIComponent(request.minerId)}`
      : `${this.nodeUrl}/engine/v1/ask`;

    const res = await fetch(askEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: request.intent,
        params: request.params,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 200) {
      return {
        priceUsdc: 0.0,
        payTo: this.telegraphContract,
        asset: this.usdcContract,
        network: "eip155:11155111",
        amountRaw: 0n,
        resource: askEndpoint,
      };
    }

    if (res.status !== 402) {
      const errText = await res.text();
      throw new Error(`Telegraph quote failed with status ${res.status}: ${errText}`);
    }

    const paymentRequiredHeader = res.headers.get("payment-required");
    let challengeData: any;
    if (paymentRequiredHeader) {
      challengeData = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString("utf-8"));
    } else {
      challengeData = await res.json();
    }

    const accepts = challengeData.accepts || [];
    const exactOption = accepts.find(
      (a: any) => a.network === "eip155:11155111" && a.scheme === "exact"
    );

    if (!exactOption) {
      throw new Error("No compatible exact payment option found for eip155:11155111");
    }

    // Require exactOption.amount; reject missing, zero, or non-numeric amounts
    if (exactOption.amount === undefined || exactOption.amount === null || exactOption.amount === "") {
      throw new Error("Challenge exactOption.amount is missing");
    }
    const amountStr = String(exactOption.amount);
    if (!/^\d+$/.test(amountStr) || BigInt(amountStr) === 0n) {
      throw new Error(`Challenge exactOption.amount is invalid or zero: ${amountStr}`);
    }
    const amountRaw = BigInt(amountStr);

    // Compare against per-ask cap using exact bigint math
    const maxAllowedBigInt = BigInt(Math.floor(request.maxPriceUsdc * 1_000_000));
    if (amountRaw > maxAllowedBigInt) {
      throw new Error(
        `Required payment ${amountRaw} micro-USDC exceeds per-ask cap ${maxAllowedBigInt} micro-USDC`
      );
    }

    // Validate payTo against allowlist
    const payTo = (exactOption.payTo || "").toLowerCase();
    if (!payTo || !this.payToAllowlist.includes(payTo)) {
      throw new Error(`Payment destination '${exactOption.payTo}' is not in allowlist`);
    }

    // Validate asset against configured USDC
    const asset = (exactOption.asset || "").toLowerCase();
    if (asset !== this.usdcContract) {
      throw new Error(`Payment token '${exactOption.asset}' is not configured USDC (${this.usdcContract})`);
    }

    // Build guard allowlists from CONFIG ONLY, never from challenge
    const guardConfig: ChainGuardConfig = {
      allowedChainId: 11155111,
      allowedDestinations: this.payToAllowlist,
      allowedTokens: [this.usdcContract],
    };

    guardTransaction(
      {
        chainId: 11155111,
        to: payTo,
        token: asset,
        tokenAmount: amountRaw,
        requiredTokenAmount: maxAllowedBigInt,
      },
      guardConfig
    );

    const priceUsdc = Number(amountRaw) / 1_000_000;
    return {
      priceUsdc,
      payTo,
      asset,
      network: exactOption.network,
      amountRaw,
      resource: challengeData.resource || askEndpoint,
    };
  }

  async ask(request: AskRequest): Promise<TelegraphReceipt> {
    const askedAt = new Date();
    const askEndpoint = request.minerId
      ? `${this.nodeUrl}/engine/v1/ask/${encodeURIComponent(request.minerId)}`
      : `${this.nodeUrl}/engine/v1/ask`;

    // 1. Send unpaid request, parse & validate quote
    const quote = await this.quote(request);

    if (quote.priceUsdc === 0) {
      const freeRes = await fetch(askEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: request.intent, params: request.params }),
        signal: AbortSignal.timeout(15000),
      });
      const body: any = await freeRes.json();
      return {
        minerId: String(body.miner_id || request.minerId || "default"),
        minerName: body.miner_name,
        minerAddress: this.telegraphContract,
        minerRank: body.rank || 1,
        priceUsdc: 0.0,
        txHash: "",
        signalHash: body.signal_hash || "",
        answer: body.result ?? body,
        confidence: 1.0,
        askedAt,
        answeredAt: new Date(),
        outcome: "paid",
        source: "live",
        verification: "unverified",
      };
    }

    // 2. Sign EIP-712 TransferWithAuthorization
    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: 11155111,
      verifyingContract: quote.asset as `0x${string}`,
    };

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}` as `0x${string}`;

    const now = Math.floor(Date.now() / 1000);
    const validAfter = BigInt(now - 60);
    // Cap maxTimeoutSeconds at 120s
    const validBefore = BigInt(now + 120);

    const authMessage = {
      from: this.account.address,
      to: quote.payTo as `0x${string}`,
      value: quote.amountRaw,
      validAfter,
      validBefore,
      nonce,
    };

    const signature = await this.walletClient.signTypedData({
      account: this.account,
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message: authMessage,
    });

    // 3. Construct x402 v2 PaymentSignature Payload
    const paymentPayload = {
      x402Version: 2,
      resource: quote.resource,
      accepted: {
        network: quote.network,
        scheme: "exact",
        payTo: quote.payTo,
        asset: quote.asset,
        amount: quote.amountRaw.toString(),
      },
      payload: {
        signature,
        authorization: {
          from: this.account.address,
          to: quote.payTo,
          value: quote.amountRaw.toString(),
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };

    const paymentSignatureHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    // 4. Retry Ask with Payment Proof
    let paidRes: Response;
    try {
      paidRes = await fetch(askEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "payment-signature": paymentSignatureHeader,
        },
        body: JSON.stringify({
          intent: request.intent,
          params: request.params,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (netErr: any) {
      return {
        minerId: request.minerId || "unknown",
        minerAddress: quote.payTo,
        minerRank: 1,
        priceUsdc: quote.priceUsdc,
        txHash: "",
        signalHash: "",
        answer: null,
        askedAt,
        answeredAt: new Date(),
        outcome: "failed_paid",
        source: "live",
        verification: "unverified",
        error: `Network failure after signing payment: ${netErr.message || String(netErr)}`,
      };
    }

    // Abort if the second response is a 402 challenge differing from quoted terms
    if (paidRes.status === 402) {
      let secondChallenge: any;
      const header402 = paidRes.headers.get("payment-required");
      try {
        secondChallenge = header402
          ? JSON.parse(Buffer.from(header402, "base64").toString("utf-8"))
          : await paidRes.json();
      } catch {}

      const secondExact = secondChallenge?.accepts?.find(
        (a: any) => a.network === "eip155:11155111" && a.scheme === "exact"
      );

      if (
        secondExact &&
        (secondExact.payTo?.toLowerCase() !== quote.payTo ||
          secondExact.asset?.toLowerCase() !== quote.asset ||
          BigInt(secondExact.amount || "0") !== quote.amountRaw)
      ) {
        throw new Error("Second 402 challenge differs from quoted terms (payTo, asset, or price changed)");
      }

      return {
        minerId: request.minerId || "unknown",
        minerAddress: quote.payTo,
        minerRank: 1,
        priceUsdc: quote.priceUsdc,
        txHash: "",
        signalHash: "",
        answer: null,
        askedAt,
        answeredAt: new Date(),
        outcome: "failed_paid",
        source: "live",
        verification: "unverified",
        error: "Server returned second 402 challenge after payment submission",
      };
    }

    // Extract headers (txHash, receiptHash)
    let txHash = "";
    const paymentResponseHeader = paidRes.headers.get("payment-response");
    if (paymentResponseHeader) {
      try {
        const parsed = JSON.parse(Buffer.from(paymentResponseHeader, "base64").toString("utf-8"));
        txHash = parsed.transaction || parsed.tx_hash || "";
      } catch {}
    }

    const telegraphReceiptHeader = paidRes.headers.get("x-telegraph-receipt");
    let receiptHash = "";
    if (telegraphReceiptHeader) {
      try {
        const parsed = JSON.parse(Buffer.from(telegraphReceiptHeader, "base64").toString("utf-8"));
        receiptHash = parsed.receipt_hash || "";
        if (!txHash) txHash = parsed.tx_hash || "";
      } catch {}
    }

    // If paid retry fails (non-2xx), do NOT throw. Return TelegraphReceipt with outcome: "failed_paid"
    if (!paidRes.ok) {
      let errText = "";
      try {
        errText = await paidRes.text();
      } catch {}
      return {
        minerId: request.minerId || "unknown",
        minerAddress: quote.payTo,
        minerRank: 1,
        priceUsdc: quote.priceUsdc,
        txHash,
        receiptHash,
        signalHash: "",
        answer: null,
        askedAt,
        answeredAt: new Date(),
        outcome: "failed_paid",
        source: "live",
        verification: "unverified",
        error: `Payment submitted but ask failed (${paidRes.status}): ${errText}`,
      };
    }

    // Unparseable body -> outcome: "failed_paid"
    let body: any;
    try {
      body = await paidRes.json();
    } catch (parseErr: any) {
      return {
        minerId: request.minerId || "unknown",
        minerAddress: quote.payTo,
        minerRank: 1,
        priceUsdc: quote.priceUsdc,
        txHash,
        receiptHash,
        signalHash: "",
        answer: null,
        askedAt,
        answeredAt: new Date(),
        outcome: "failed_paid",
        source: "live",
        verification: "unverified",
        error: "Unparseable response body from Telegraph node",
      };
    }

    const signalHash = body?.signal_hash || "";
    const rawAnswer = body?.result ?? body;

    let outcome: PurchaseOutcome = "paid";
    let validatedAnswer: unknown = rawAnswer;

    if (rawAnswer === null || rawAnswer === undefined) {
      outcome = "failed_paid";
    } else {
      try {
        validatedAnswer = validateAnswerForIntent(request.intent, rawAnswer);
      } catch {
        outcome = "failed_paid";
      }
    }

    // Signal verification lookup
    let signalVerification = "unavailable";
    if (signalHash) {
      try {
        const sigRes = await fetch(`${this.nodeUrl}/engine/v1/signal/${encodeURIComponent(signalHash)}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (sigRes.ok) {
          const sigData: any = await sigRes.json();
          signalVerification = sigData?.status || (sigData?.verified ? "verified" : "confirmed");
        } else {
          signalVerification = "unavailable";
        }
      } catch {
        signalVerification = "unavailable";
      }
    }

    return {
      minerId: String(body?.miner_id || request.minerId || "unknown"),
      minerName: body?.miner_name,
      minerAddress: quote.payTo,
      minerRank: body?.rank || 1,
      priceUsdc: quote.priceUsdc,
      txHash,
      receiptHash,
      signalHash,
      answer: validatedAnswer,
      confidence: body?.confidence ?? 1.0,
      askedAt,
      answeredAt: new Date(),
      outcome,
      source: "live",
      verification: "unverified",
      signalVerification,
    };
  }
}
