"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Layout, TerminalSquare, Layers, CheckCircle2, Shield } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";

const features = [
  {
    title: "Multi-file Architecture",
    body: "Generate full project structures. Routes, components, and stylesheets rendered in a unified file tree.",
    icon: TerminalSquare,
    colorClass: "bg-primary",
  },
  {
    title: "Live Workspace",
    body: "Prompt, edit, and preview in real-time. A completely integrated IDE environment built for speed.",
    icon: Layout,
    colorClass: "bg-accent",
  },
  {
    title: "Production Output",
    body: "Strictly typed React code, clean semantic HTML, and fully functional Tailwind utility classes.",
    icon: Code2,
    colorClass: "bg-orange-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const titleVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function HomePage() {
  const titleWords = "From Prompt to".split(" ");

  return (
    <MarketingShell>
      {/* 1. Hero Section — one viewport minus header, no inner scroll; 100dvh avoids mobile browser chrome overflow */}
      <section className="relative px-4 sm:px-6 lg:px-12 overflow-x-hidden overflow-y-hidden flex items-center min-h-[calc(min(100dvh,100vh)-5rem)] max-h-[calc(min(100dvh,100vh)-5rem)] md:h-[calc(min(100dvh,100vh)-5rem)] pt-8 sm:pt-12 md:pt-0 pb-16 sm:pb-20 box-border">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full -z-10 animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[150px] rounded-full -z-10 animate-blob animation-delay-4000" />
        <div className="absolute top-[30%] left-[30%] w-[30%] h-[30%] bg-secondary/20 blur-[120px] rounded-full -z-10 animate-blob animation-delay-2000" />
        
        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-accent/30 border border-border/50 backdrop-blur-md hidden lg:flex items-center justify-center -z-10 shadow-2xl"
        >
          <Code2 className="w-8 h-8 text-primary/80" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0], scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] right-[10%] w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-secondary/20 border border-border/50 backdrop-blur-md hidden lg:flex items-center justify-center -z-10 shadow-2xl"
        >
           <Layers className="w-10 h-10 text-accent/80" />
        </motion.div>

        <div className="mx-auto max-w-[1400px] w-full min-w-0 relative z-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
            className="flex flex-col items-center text-center max-w-5xl mx-auto w-full min-w-0"
          >
            <motion.div variants={titleVariants} className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] xl:text-[8rem] tracking-tight text-foreground mb-6 md:mb-8 leading-[0.9] font-extrabold flex flex-col items-center justify-center z-20">
              <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 lg:gap-x-8 mb-2">
                {titleWords.map((word, idx) => (
                  <motion.span key={idx} variants={itemVariants} className="inline-block relative group">
                    {word}
                  </motion.span>
                ))}
              </div>
              <div className="flex overflow-visible pb-4 pt-2">
                <motion.span 
                  variants={itemVariants} 
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-orange-500 italic font-serif font-light transform-gpu drop-shadow-xl hover:scale-105 transition-transform duration-500 cursor-default"
                >
                  Production.
                </motion.span>
              </div>
            </motion.div>
            
            <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-2xl text-muted-foreground max-w-3xl leading-relaxed font-medium mb-10 sm:mb-12 relative px-2 sm:px-4">
              Stop fighting boilerplate. Generate complete, multi-file React architectures instantly. 
              The ultimate AI engineering partner for modern web development.
            </motion.p>
              
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-6 items-center w-full sm:w-auto px-6 sm:px-0">
              <Link href="/studio" className="group relative w-full sm:w-auto inline-flex h-16 items-center justify-center rounded-full bg-foreground px-10 text-lg font-bold text-background transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-[0_0_40px_-10px_var(--color-foreground)] overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 flex items-center gap-3">
                  Start Building Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link href="/pricing" className="group w-full sm:w-auto inline-flex h-16 items-center justify-center rounded-full bg-background border-2 border-border px-10 text-lg font-bold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95">
                View Pricing
              </Link>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-muted-foreground text-xs sm:text-sm font-medium">
               <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> No credit card required</div>
               <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Cancel anytime</div>
               <div className="hidden sm:flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Production-ready code</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. Engineering Showcase Section */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-12 relative bg-secondary/10 border-y border-border/40 overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] w-full min-w-0 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
           <div className="flex flex-col gap-10">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]">
                  Engineered for <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent italic font-serif font-light pr-2">Excellence.</span>
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-medium leading-relaxed mt-4 sm:mt-6">
                  We don&apos;t just generate single files. Webmaker architects entire component libraries, routing structures, and state management systems in seconds.
                </p>
              </motion.div>
              
              <div className="grid gap-6 mt-4">
                 {[
                   { title: "Multi-Layer Architecture", desc: "Shared state and modular components automatically wired together.", icon: Layers },
                   { title: "Real-time Inspection", desc: "Live preview synchronization with the generated code tree.", icon: Layout },
                   { title: "Enterprise Grade Security", desc: "Your code is yours. We don't train on private repositories.", icon: Shield }
                 ].map((item, i) => {
                   const Icon = item.icon;
                   return (
                     <motion.div 
                       key={i} 
                       initial={{ opacity: 0, x: -20 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ duration: 0.5, delay: i * 0.1 }}
                       className="group flex items-start gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-background border border-border transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 min-w-0"
                     >
                        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                           <Icon className="h-6 w-6 text-foreground/70 group-hover:text-primary-foreground" />
                        </div>
                        <div className="mt-1.5">
                           <h4 className="font-bold text-foreground text-xl mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                           <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                     </motion.div>
                   )
                 })}
              </div>
           </div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
             className="relative group w-full min-w-0 lg:h-[800px] flex items-center justify-center"
           >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-accent/10 to-secondary/20 blur-3xl rounded-2xl lg:rounded-[4rem] -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative w-full max-w-full aspect-square md:aspect-[4/3] lg:aspect-auto lg:h-full bg-[#0a0a0a] rounded-2xl sm:rounded-[2rem] lg:rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden transition-transform duration-700 hover:scale-[1.02] flex flex-col">
                <div className="h-14 bg-[#111] flex items-center px-6 gap-3 border-b border-white/5 z-20 shrink-0">
                   <div className="flex gap-2">
                     <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                     <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                     <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                   </div>
                   <div className="ml-4 h-6 w-48 bg-white/5 rounded flex items-center justify-center text-[10px] text-white/40 font-mono tracking-wider">
                     src/components/App.tsx
                   </div>
                </div>
                
                <div className="p-8 flex-1 relative overflow-hidden font-mono text-sm text-white/70 leading-relaxed">
                   <motion.div 
                     initial={{ y: 20, opacity: 0 }}
                     whileInView={{ y: 0, opacity: 1 }}
                     transition={{ duration: 1, delay: 0.5 }}
                   >
                     <span className="text-[#ff7b72]">import</span> &#123; useState &#125; <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">&apos;react&apos;</span>;
                     <br/><br/>
                     <span className="text-[#ff7b72]">export default function</span> <span className="text-[#d2a8ff]">App</span>() &#123;<br/>
                     &nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> [count, setCount] = <span className="text-[#d2a8ff]">useState</span>(<span className="text-[#79c0ff]">0</span>);<br/>
                     <br/>
                     &nbsp;&nbsp;<span className="text-[#ff7b72]">return</span> (<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-[#7ee787]">div</span> <span className="text-[#a5d6ff]">className</span>=<span className="text-[#a5d6ff]">&quot;min-h-screen bg-background p-8&quot;</span>&gt;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-[#7ee787]">h1</span> <span className="text-[#a5d6ff]">className</span>=<span className="text-[#a5d6ff]">&quot;text-4xl font-bold&quot;</span>&gt;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hello Webmaker<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-[#7ee787]">h1</span>&gt;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-[#7ee787]">button</span><br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#a5d6ff]">onClick</span>=&#123;() <span className="text-[#ff7b72]">=&gt;</span> <span className="text-[#d2a8ff]">setCount</span>(c <span className="text-[#ff7b72]">=&gt;</span> c + <span className="text-[#79c0ff]">1</span>)&#125;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#a5d6ff]">className</span>=<span className="text-[#a5d6ff]">&quot;mt-4 px-6 py-2 bg-primary text-white rounded-full&quot;</span><br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&gt;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Count: &#123;count&#125;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-[#7ee787]">button</span>&gt;<br/>
                     &nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-[#7ee787]">div</span>&gt;<br/>
                     &nbsp;&nbsp;);<br/>
                     &#125;
                   </motion.div>
                   {/* Animated cursor overlay - at end of code */}
                   <motion.div 
                     animate={{ opacity: [1, 0, 1] }} 
                     transition={{ duration: 1, repeat: Infinity }}
                     className="absolute bottom-8 left-[2.5rem] w-2 h-5 bg-white/80"
                   />
                </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 lg:py-32 lg:px-12 relative overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] w-full min-w-0">
          <div className="text-center mb-16 sm:mb-24 max-w-3xl mx-auto px-2">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              Everything you need to <span className="italic font-serif font-light text-primary">ship faster.</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Built on Next.js and Shadcn UI, generating code that looks and feels exactly like it was written by a senior engineer.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-[2.5rem] bg-secondary/20 border border-border transition-all duration-500 hover:bg-background hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl bg-background border border-border flex items-center justify-center mb-6 sm:mb-8 transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 shadow-lg`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-display tracking-tight font-bold mb-3 sm:mb-5 leading-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base lg:text-lg">{feature.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Pricing Hints Section */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-12 relative bg-foreground text-background rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] mx-2 sm:mx-4 md:mx-8 mb-12 sm:mb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_50%)] opacity-20" />
        <div className="mx-auto max-w-[1400px] w-full min-w-0 relative z-10 flex flex-col items-center">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20 px-2">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-4 sm:mb-6 text-background">
              Simple, <span className="italic font-serif font-light text-primary">transparent</span> pricing.
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-background/70 dark:text-muted-foreground font-medium">
              Start building for free, upgrade when you need more power.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-5xl mx-auto mb-12 sm:mb-16 px-0 sm:px-2">
            {/* Hobby Plan */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-background/5 border border-white/10 dark:bg-card dark:border-border flex flex-col items-center text-center min-w-0">
              <h3 className="text-2xl font-bold mb-2 dark:text-card-foreground">Hobby</h3>
              <div className="text-5xl font-display font-black mb-6 dark:text-card-foreground">$0<span className="text-lg text-white/50 dark:text-muted-foreground font-sans font-medium">/mo</span></div>
              <p className="text-white/60 dark:text-muted-foreground mb-8">For personal projects and exploration.</p>
              <ul className="text-sm text-left w-full space-y-3 mb-8 text-white/80 dark:text-card-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Basic generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 10 projects max</li>
                <li className="flex items-center gap-2 text-white/40 dark:text-muted-foreground"><CheckCircle2 className="w-4 h-4 dark:text-muted-foreground" /> Community support</li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-primary relative transform lg:-translate-y-4 border border-white/20 shadow-[0_0_50px_-10px_var(--color-primary)] flex flex-col items-center text-center min-w-0">
              <div className="absolute top-0 transform -translate-y-1/2 bg-background text-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
              <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
              <div className="text-5xl font-display font-black mb-6 text-white">$29<span className="text-lg text-white/70 font-sans font-medium">/mo</span></div>
              <p className="text-white/80 mb-8">For professional developers & freelancers.</p>
              <ul className="text-sm text-left w-full space-y-3 mb-8 text-white/90">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-background" /> Advanced generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-background" /> Unlimited projects</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-background" /> Export to GitHub</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-background" /> Priority support</li>
              </ul>
            </div>

            {/* Max Plan */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-background/5 border border-white/10 dark:bg-card dark:border-border flex flex-col items-center text-center min-w-0 sm:col-span-2 lg:col-span-1">
              <h3 className="text-2xl font-bold mb-2 dark:text-card-foreground">Max</h3>
              <div className="text-5xl font-display font-black mb-6 dark:text-card-foreground">$99<span className="text-lg text-white/50 dark:text-muted-foreground font-sans font-medium">/mo</span></div>
              <p className="text-white/60 dark:text-muted-foreground mb-8">For teams scaling serious infrastructure.</p>
              <ul className="text-sm text-left w-full space-y-3 mb-8 text-white/80 dark:text-card-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Pro features included</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Custom AI Models</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> White-label exports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 24/7 Phone Support</li>
              </ul>
            </div>
          </div>

          <Link href="/pricing" className="inline-flex h-14 items-center justify-center rounded-full bg-background px-10 text-base font-bold text-foreground transition-all hover:scale-105 hover:bg-primary hover:border-transparent hover:text-white border border-white/20 dark:border-border">
            Compare All Plans
          </Link>
        </div>
      </section>

      {/* 5. Final CTA Section */}
      <section className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-12 relative overflow-x-hidden flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/20 blur-[200px] rounded-full -z-10" />
        
        <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter mb-6 sm:mb-8 max-w-4xl px-2">
          Ready to stop <br className="hidden md:block"/> writing <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">boilerplate?</span>
        </h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 sm:mb-12 font-medium max-w-2xl px-2">
          Join thousands of developers building the next generation of web applications.
        </p>
        
        <Link href="/studio" className="group relative w-full sm:w-auto inline-flex h-14 sm:h-16 lg:h-20 items-center justify-center rounded-full bg-primary px-8 sm:px-12 lg:px-16 text-lg sm:text-xl lg:text-2xl font-bold text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_-15px_var(--color-primary)] hover:shadow-[0_0_80px_-10px_var(--color-primary)] overflow-hidden">
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative z-10 flex items-center gap-4">
            Get Started Now
            <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
          </span>
        </Link>
      </section>
    </MarketingShell>
  );
}
