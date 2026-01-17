import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unfair Tools - Sales Rep Order Management",
  description: "Modern order management platform for independent sales reps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

