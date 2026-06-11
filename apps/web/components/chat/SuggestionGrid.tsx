"use client";

const SUGGESTIONS = [
  "Editorial fintech platform with landing page, dashboard, pricing, privacy, and terms",
  "AI travel planner with marketing site, itinerary builder app, and policy pages",
  "Modern legal-tech frontend with services site, case portal, pricing, and compliance pages",
  "Luxury real estate product with public listings, client portal, privacy, and terms",
  "Healthcare booking frontend with landing page, patient app shell, and trust pages",
  "Creative agency site with project showcase, proposal dashboard, pricing, and policy pages",
  "Developer SaaS with docs-style landing page, workspace UI, pricing, privacy, and terms",
  "Interior design studio with immersive landing page, client workspace, and legal pages",
];

interface SuggestionGridProps {
  onPick: (prompt: string) => void;
}

export function SuggestionGrid({ onPick }: SuggestionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden px-6">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onPick(suggestion)}
          className="group relative p-5 text-left rounded-3xl bg-secondary/30 hover:bg-secondary/60 border border-border/50 transition-all hover:translate-y-[-4px]"
        >
          <p className="text-sm font-medium leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
            {suggestion}
          </p>
          <div className="absolute bottom-4 right-4 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}
