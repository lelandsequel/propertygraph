import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

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
        <NavBar />
        <main className="pt-12">
          {children}
        </main>
      </body>
    </html>
  );
}
