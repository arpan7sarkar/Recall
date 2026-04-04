import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recall — Your Personal Knowledge Base",
  description:
    "Save, organise, and rediscover anything from the internet. AI-powered tagging, semantic search, and knowledge graph visualisation.",
  keywords: ["knowledge base", "bookmarks", "AI tagging", "second brain", "research"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-sans)" }}>
          <QueryProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
