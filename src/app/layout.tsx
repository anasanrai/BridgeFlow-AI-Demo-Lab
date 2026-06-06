import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BridgeFlow AI Demo Lab",
  description: "Test live AI voice agents, chat bots, and RAG systems. Built by BridgeFlow.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary min-h-screen text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
