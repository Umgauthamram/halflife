import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Half-Life | Know when a bought answer has expired",
  description: "Measures answer decay on Telegraph and makes agents re-buy only when stale risk exceeds price.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
