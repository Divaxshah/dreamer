import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

const code = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Webmaker Studio",
    template: "%s | WM",
  },
  description: "Terminal and UI generation layer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBootScript = `
    (function () {
      try {
        var saved = window.localStorage.getItem("webmaker-theme");
        var theme = saved === "light" || saved === "dark"
          ? saved
          : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        document.documentElement.dataset.theme = theme;
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (error) {
        document.documentElement.dataset.theme = "light";
        document.documentElement.classList.remove("dark");
      }
    })();
  `;

  return (
    <html lang="en" className={cn("h-full", display.variable, body.variable, code.variable)} data-theme="light" suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased bg-background text-foreground selection:bg-foreground selection:text-background">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
