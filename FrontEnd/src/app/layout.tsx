import type { Metadata } from "next";

import "../app/styles/main.css";

export const metadata: Metadata = {
  title: "Uplixer",
  description: "Easiest converter out there",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="background">{children}</body>
    </html>
  );
}
