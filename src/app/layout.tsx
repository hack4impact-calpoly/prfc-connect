import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRFC Connect",
  description: "Paso Robles Food Co-op Connect",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
