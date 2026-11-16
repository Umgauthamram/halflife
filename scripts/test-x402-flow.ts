import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const rawPk = process.env.metamask_private_key || "";
const pk = (rawPk.startsWith("0x") ? rawPk : `0x${rawPk}`) as `0x${string}`;
const account = privateKeyToAccount(pk);

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"),
});

async function main() {
  console.log("Step 1: Request 402 challenge...");
  const res1 = await fetch("http://13.237.89.59:7148/engine/v1/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "FX_NOW_EUR",
      params: { currency: "EUR" },
    }),
  });

  const paymentRequiredRaw = res1.headers.get("payment-required");
  if (!paymentRequiredRaw) {
    console.log("No payment-required header!");
    return;
  }

  const paymentRequired = JSON.parse(Buffer.from(paymentRequiredRaw, "base64").toString("utf-8"));
  const exactOption = paymentRequired.accepts.find(
    (a: any) => a.network === "eip155:11155111" && a.scheme === "exact"
  );

  console.log("Step 2: Sign EIP-712 authorization...");
  const domain = {
    name: exactOption.extra?.name || "USD Coin",
    version: exactOption.extra?.version || "2",
    chainId: 11155111,
    verifyingContract: exactOption.asset as `0x${string}`,
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
    from: account.address,
    to: exactOption.payTo as `0x${string}`,
    value: BigInt(exactOption.amount),
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await walletClient.signTypedData({
    account,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message: authMessage,
  });

  console.log("Step 3: Construct x402 v2 PaymentSignature payload...");
  const paymentPayload = {
    x402Version: paymentRequired.x402Version || 2,
    resource: paymentRequired.resource,
    accepted: exactOption,
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: exactOption.payTo,
        value: exactOption.amount,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };

  const paymentSignatureHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

  console.log("Step 4: Retry ask with payment-signature header...");
  const res2 = await fetch("http://13.237.89.59:7148/engine/v1/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "payment-signature": paymentSignatureHeader,
    },
    body: JSON.stringify({
      intent: "FX_NOW_EUR",
      params: { currency: "EUR" },
    }),
  });

  console.log("Res2 status:", res2.status);
  console.log("Res2 headers:", Object.fromEntries(res2.headers.entries()));
  const bodyText = await res2.text();
  console.log("Res2 body:", bodyText);
}

main().catch(console.error);
