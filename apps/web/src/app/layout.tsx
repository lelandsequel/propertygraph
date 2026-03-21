import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROPERTYGRAPH — CRE Intelligence",
  description: "Commercial real estate ownership intelligence and network analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-white antialiased">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
            <a href="/" className="text-sm font-bold tracking-widest text-white hover:text-accent transition-colors">
              PROPERTYGRAPH
            </a>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span>HARRIS COUNTY TX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-signal-green inline-block" />
              <span>LIVE</span>
            </div>
          </div>
        </nav>
        <main className="pt-12">
          {children}
        </main>
      </body>
    </html>
  );
}
