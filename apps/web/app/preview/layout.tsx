/**
 * Dedicated layout for /preview/[id] pages.
 * Completely isolated from the root layout so that no webmaker fonts, globals.css
 * padding, or <TooltipProvider> wrapper affect the full-screen project preview.
 */
export const metadata = {
  title: "Webmaker Preview",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }}>
      {children}
    </div>
  );
}
