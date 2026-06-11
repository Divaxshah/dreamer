"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Minus, Zap, Star, Shield } from "lucide-react";
import { MarketingShell } from "@/components/site/MarketingShell";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "For solo builders shipping polished marketing sites and lightweight app shells.",
    icon: Star,
    features: [
      "25 project generations per month",
      "Multi-file bundle export (.zip)",
      "Standard React & Next.js templates",
      "Community support access",
      "Standard LLM reasoning models"
    ],
    limitations: [
      "No custom design system injection",
      "No private repository sync",
      "Standard priority queue"
    ],
    cta: "Start Building",
    highlighted: false,
    colorClass: "border-blue-600",
  },
  {
    name: "Pro Studio",
    price: "$89",
    period: "/mo",
    description: "For product teams building full frontend experiences with repeatable quality.",
    icon: Zap,
    features: [
      "Unlimited project generations",
      "Advanced model access (GPT-4o, Claude 3.5 Sonnet)",
      "Deeper workspace history retention",
      "Custom UI component library injection",
      "Export directly to GitHub/GitLab",
      "Priority generation queue",
      "Dedicated email support"
    ],
    limitations: [
      "No custom model fine-tuning",
      "No white-label exports"
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    colorClass: "border-primary",
  },
  {
    name: "Max",
    price: "$249",
    period: "/mo",
    description: "For agencies and enterprises scaling serious frontend infrastructure.",
    icon: Shield,
    features: [
      "Everything in Pro Studio",
      "Custom AI Models & Fine-tuning",
      "White-label project exports",
      "24/7 Priority Phone Support",
      "Dedicated account manager",
      "Custom integration webhooks",
      "SSO & Advanced Security"
    ],
    limitations: [],
    cta: "Contact Sales",
    highlighted: false,
    colorClass: "border-purple-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="px-6 py-20 lg:px-12 bg-background relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[40%] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[30%] bg-accent/10 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-secondary/20 blur-[200px] rounded-full pointer-events-none -z-10" />
        
        <div className="mx-auto max-w-[1400px] w-full relative z-10 pt-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
            className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center justify-center mb-6">
              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider border border-primary/20">
                Plans & Pricing
              </span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="font-display text-6xl md:text-8xl tracking-tighter text-foreground mb-6 leading-[0.9] font-black">
              Scale your <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent italic font-serif font-light">velocity.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
              From solo developers to enterprise teams, we have a plan designed for how you build.
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid lg:grid-cols-3 gap-8 items-start"
          >
            {plans.map((plan, idx) => {
              const Icon = plan.icon;
              return (
                <div 
                  key={plan.name} 
                  className={`relative flex flex-col rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 bg-card/60 backdrop-blur-2xl border ${plan.highlighted ? 'border-primary shadow-2xl shadow-primary/20 scale-100 lg:scale-105 z-10' : 'border-border shadow-xl scale-100 z-0'}`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white font-bold px-6 py-1.5 rounded-full text-[11px] uppercase tracking-widest shadow-lg shadow-primary/30 z-20">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8 md:p-10 border-b border-border/50 relative overflow-hidden">
                    {plan.highlighted && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full" />}
                    
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${plan.highlighted ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-secondary text-foreground'}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    
                    <h2 className="font-display text-3xl tracking-tight font-bold mb-3">{plan.name}</h2>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-6 h-12">{plan.description}</p>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-6xl tracking-tighter font-black">{plan.price}</span>
                      <span className="text-lg text-muted-foreground font-bold">{plan.period}</span>
                    </div>
                  </div>

                  <div className="p-8 md:p-10 flex-1 flex flex-col bg-background/50 rounded-b-[2.5rem]">
                    <div className="font-bold uppercase tracking-widest text-[10px] mb-6 text-foreground/50">
                      Included Features
                    </div>
                    <ul className="space-y-5 text-sm flex-1 mb-10">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-4">
                          <div className={`mt-0.5 rounded-full p-1 shrink-0 ${plan.highlighted ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'}`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-foreground font-medium leading-relaxed">{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-4 opacity-50">
                          <div className="mt-0.5 rounded-full p-1 bg-secondary text-muted-foreground shrink-0">
                            <Minus className="w-3 h-3" />
                          </div>
                          <span className="text-muted-foreground font-medium leading-relaxed">{limitation}</span>
                        </li>
                      ))}
                    </ul>

                    <Link 
                      href={plan.highlighted ? "/studio" : "/contact"} 
                      className={`inline-flex h-16 w-full items-center justify-center rounded-2xl px-8 text-base font-bold transition-all ${plan.highlighted ? 'bg-primary text-primary-foreground shadow-[0_0_30px_-5px_var(--color-primary)] hover:shadow-[0_0_40px_-5px_var(--color-primary)] hover:scale-105 active:scale-95' : 'bg-secondary text-foreground hover:bg-foreground hover:text-background'}`}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </MarketingShell>
  );
}
