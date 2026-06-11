import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Github, Twitter, Linkedin, Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-background relative overflow-hidden font-sans border-t border-border/10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col px-6 py-24 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl leading-none rounded-2xl rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-primary/20">
                W
              </div>
              <span className="font-display text-2xl tracking-tight text-foreground font-bold">Webmaker</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed text-lg max-w-sm">
              The multi-file frontend generation engine. Stop writing boilerplate, start generating production-ready experiences.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="#" className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-all hover:scale-110"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-all hover:scale-110"><Github className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-all hover:scale-110"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-all hover:scale-110"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h4 className="text-foreground font-display font-bold text-lg mb-2">Product</h4>
            <Link href="/studio" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Studio</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Pricing</Link>
            <Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Login / Sign Up</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Changelog</Link>
          </div>
          
          <div className="flex flex-col gap-5">
            <h4 className="text-foreground font-display font-bold text-lg mb-2">Resources</h4>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Documentation</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Community</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Showcase</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Blog</Link>
          </div>

          <div className="flex flex-col gap-5">
            <h4 className="text-foreground font-display font-bold text-lg mb-2">Legal</h4>
            <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Privacy Policy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Terms of Service</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 duration-200 w-fit">Cookie Policy</Link>
          </div>
        </div>
        
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 text-sm font-medium z-10 border-t border-border/40">
          <div className="flex flex-nowrap items-center justify-center sm:justify-start gap-3 sm:gap-6">
            <p className="text-muted-foreground whitespace-nowrap shrink-0">{new Date().getFullYear()} Webmaker Inc. All Rights Reserved.</p>
            <div className="shrink-0"><ThemeToggle /></div>
          </div>
          <p className="text-muted-foreground hidden sm:block">Designed with ❤️ in India.</p>
        </div>
      </div>

      <div className="w-full relative flex flex-col items-center justify-end overflow-hidden pt-6 sm:pt-12 md:pt-20 pb-0 select-none pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 h-full w-full" />
        <h1 
          className="text-[15vw] leading-[0.75] font-display font-black tracking-tighter text-transparent bg-clip-text relative z-0 opacity-[0.8]"
          style={{ 
            backgroundImage: "linear-gradient(to bottom, var(--color-foreground) 0%, transparent 100%)",
            transform: "translateY(15%)"
          }}
        >
          WEBMAKER
        </h1>
      </div>
    </footer>
  );
}
