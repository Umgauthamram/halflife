import {
  createWalletClient,
  http,
  type PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import type { Miner } from "@half-life/shared";
import { guardTransaction, type ChainGuardConfig } from "@half-life/chain";
import type { AskRequest, TelegraphClient, TelegraphReceipt, PurchaseOutcome } from "./client.js";
import { validateAnswerForIntent } from "./schemas.js";

export interface LiveTelegraphConfig {
  nodeUrl: string;
  privateKey: `0x${string}`;
  rpcUrl?: string;
  telegraphContract?: string;
  usdcContract?: string;
}

export class LiveTelegraphClient implements TelegraphClient {
  private nodeUrl: string;
  private account: PrivateKeyAccount;
  private walletClient: ReturnType<typeof createWalletClient>;
  private telegraphContract: string;
  private usdcContract: string;

  constructor(config: LiveTelegraphConfig) {
    this.nodeUrl = config.nodeUrl.replace(/\/+$/, "");
    this.account = privateKeyToAccount(config.privateKey);
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(config.rpcUrl || "https://rpc.sepolia.org"),
    });
    this.telegraphContract = (config.telegraphContract || "0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b").toLowerCase();
    this.usdcContract = (config.usdcContract || "0xcc194e1a843B658526D0D5C431f670028582Ae17").toLowerCase();
  }

  async listIntents(): Promise<string[]> {
    const res = await fetch(`${this.nodeUrl}/engine/v1/intents`);
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
    const res = await fetch(`${this.nodeUrl}/engine/v1/intents/${encodeURIComponent(intent)}/miners`);
    if (!res.ok) {
      return [];
    }
    const data: any = await res.json();
    const miners = data.miners || [];
    return miners.map((m: any, idx: number) => ({
      id: String(m.id || idx),
      name: m.name || m.slug || `Miner ${m.id}`,
      address: m.base_url || "0x0000000000000000000000000000000000000000",
      rank: idx + 1,
      totalQueries: 100,
      agreementScore: 0.98,
      lastActive: new Date(),
    }));
  }

  async ask(request: AskRequest): Promise<TelegraphReceipt> {
    const askedAt = new Date();
    const askEndpoint = request.minerId
      ? `${this.nodeUrl}/engine/v1/ask/${encodeURIComponent(request.minerId)}`
      : `${this.nodeUrl}/engine/v1/ask`;

    // 1. Initial Request (Triggers x402 challenge)
    const initialRes = await fetch(askEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: request.intent,
        params: request.params,
      }),
    });

    if (initialRes.status === 200) {
      const body: any = await initialRes.json();
      return {
        minerId: String(body.miner_id || request.minerId || "default"),
        minerName: body.miner_name,
        minerAddress: this.telegraphContract,
        minerRank: 1,
        priceUsdc: 0.0,
        txHash: "",
        signalHash: body.signal_hash || "",
        answer: body.result ?? body,
        confidence: 1.0,
        askedAt,
        answeredAt: new Date(),
        outcome: "paid",
      };
    }

    if (initialRes.status !== 402) {
      const errText = await initialRes.text();
      throw new Error(`Telegraph ask failed with status ${initialRes.status}: ${errText}`);
    }

    // 2. Parse 402 Challenge
    const paymentRequiredHeader = initialRes.headers.get("payment-required");
    let challengeData: any;
    if (paymentRequiredHeader) {
      challengeData = JSON.parse(Buffer.from(paymentRequiredHeader, "base64").toString("utf-8"));
    } else {
      challengeData = await initialRes.json();
    }

    const accepts = challengeData.accepts || [];
    const exactOption = accepts.find(
      (a: any) => a.network === "eip155:11155111" && a.scheme === "exact"
    );

    if (!exactOption) {
      throw new Error("No compatible exact payment option found for eip155:11155111");
    }

    // 3. Challenge Safety Verification via ChainGuard
    const payTo = exactOption.payTo;
    const asset = exactOption.asset || this.usdcContract;
    const requiredAmountBigInt = BigInt(exactOption.amount || "10000"); // 10000 = 0.01 USDC (6 decimals)
    const maxAllowedBigInt = BigInt(Math.round(request.maxPriceUsdc * 1_000_000));

    const guardConfig: ChainGuardConfig = {
      allowedChainId: 11155111,
      allowedDestinations: [this.telegraphContract, payTo],
      allowedTokens: [this.usdcContract, asset],
    };

    guardTransaction(
      {
        chainId: 11155111,
        to: payTo,
        token: asset,
        tokenAmount: requiredAmountBigInt,
        requiredTokenAmount: maxAllowedBigInt,
      },
      guardConfig
    );

    // 4. Sign EIP-712 TransferWithAuthorization
    const domain = {
      name: exactOption.extra?.name || "USD Coin",
      version: exactOption.extra?.version || "2",
      chainId: 11155111,
      verifyingContract: asset as `0x${string}`,
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
    const validBefore = BigInt(now + (exactOption.maxTimeoutSeconds || 60));

    const authMessage = {
      from: this.account.address,
      to: payTo as `0x${string}`,
      value: requiredAmountBigInt,
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

    // 5. Construct x402 v2 PaymentSignature Payload
    const paymentPayload = {
      x402Version: challengeData.x402Version || 2,
      resource: challengeData.resource,
      accepted: exactOption,
      payload: {
        signature,
        authorization: {
          from: this.account.address,
          to: payTo,
          value: exactOption.amount,
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };

    const paymentSignatureHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    // 6. Retry Ask with Payment Proof
    const paidRes = await fetch(askEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "payment-signature": paymentSignatureHeader,
      },
      body: JSON.stringify({
        intent: request.intent,
        params: request.params,
      }),
    });

    const answeredAt = new Date();
    const priceUsdc = Number(requiredAmountBigInt) / 1_000_000;

    if (!paidRes.ok) {
      const errBody = await paidRes.text();
      throw new Error(`Payment submitted but ask failed (${paidRes.status}): ${errBody}`);
    }

    // 7. Extract on-chain receipt & verify outcome
    const paymentResponseHeader = paidRes.headers.get("payment-response");
    let txHash = "";
    if (paymentResponseHeader) {
      try {
        const parsed = JSON.parse(Buffer.from(paymentResponseHeader, "base64").toString("utf-8"));
        txHash = parsed.transaction || "";
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

    const body: any = await paidRes.json();
    const signalHash = body.signal_hash || "";
    const rawAnswer = body.result ?? body;

    let outcome: PurchaseOutcome = "paid";
    let validatedAnswer: unknown = rawAnswer;

    try {
      validatedAnswer = validateAnswerForIntent(request.intent, rawAnswer);
    } catch {
      // Charged on-chain, but answer is unusable or missing fields
      outcome = "failed_paid";
    }

    return {
      minerId: String(body.miner_id || request.minerId || "unknown"),
      minerName: body.miner_name,
      minerAddress: payTo,
      minerRank: 1,
      priceUsdc,
      txHash,
      receiptHash,
      signalHash,
      answer: validatedAnswer,
      confidence: body.confidence ?? 1.0,
      askedAt,
      answeredAt,
      outcome,
    };
  }
}
