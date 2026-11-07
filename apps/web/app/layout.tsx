import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wise: The International Account | Money Without Borders",
  description: "Save when you send, spend and receive money globally with the Wise multi-currency account and international debit card.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-[#0e0f0c] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
