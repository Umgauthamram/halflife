import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caldera — The Internet of Rollups",
  description: "Caldera makes it effortless to launch and scale dedicated, high-performance rollups with Arbitrum Nitro, OP Stack, Polygon CDK, and ZK Stack.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#e2e2df] text-[#070607] font-sans antialiased selection:bg-[#fc5000] selection:text-white">
        {children}
      </body>
    </html>
  );
}
