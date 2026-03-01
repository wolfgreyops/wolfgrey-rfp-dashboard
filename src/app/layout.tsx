import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RFP Scout | WolfGrey.ai",
  description: "Automated RFP discovery dashboard for apparel opportunities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
