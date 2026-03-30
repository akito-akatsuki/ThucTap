import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Inventory AI",
  description: "AI Inventory Management",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="theme-script" strategy="beforeInteractive">
          {`(function() {
            var media = window.matchMedia('(prefers-color-scheme: dark)');
            var apply = function(event) {
              var isDark = event.matches !== undefined ? event.matches : media.matches;
              document.documentElement.classList.toggle('dark', isDark);
            };
            apply(media);
            if (media.addEventListener) {
              media.addEventListener('change', apply);
            } else if (media.addListener) {
              media.addListener(apply);
            }
          })();`}
        </Script>
        <Navbar />
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
