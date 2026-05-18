import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ODIN Champion League",
  description: "Niteco internal FIFA league — season 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-body-md text-on-surface min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
