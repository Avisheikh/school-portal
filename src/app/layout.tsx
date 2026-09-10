import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "School of Social Development (SOSD) | Bodgaun",
    template: "%s | SOSD Bodgaun",
  },
  description:
    "Village education project in Indrawati-11, Bodgaun, Sindhupalchowk. Donate to support kindergarten, elementary learning and community programmes since 2021.",
  icons: { icon: "/media/logo.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${jakarta.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
