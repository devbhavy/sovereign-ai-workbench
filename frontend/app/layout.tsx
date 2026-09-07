import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Playfair_Display } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkbenchShell } from "@/components/workbench/workbench-shell";
import "./globals.css";

/* Code and filenames only. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/* zerith.studio's body face — the primary UI and prose font. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/*
 * Display face, standing in for zerith's licensed Gascogne. Instrument Serif
 * matched the shapes but ships a single 400 weight, so there was no way to
 * make the wordmark heavier. Playfair keeps the same high-contrast serif
 * skeleton and carries real weight up to 900.
 */
const displaySerif = Playfair_Display({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sovereign AI Workbench",
  description:
    "A local agent workbench for reading documents, inspecting images and generating reports.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexMono.variable} ${manrope.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <WorkbenchShell>{children}</WorkbenchShell>
          </TooltipProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
