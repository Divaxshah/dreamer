"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Mail, ArrowRight, Code2, Zap, Layers, Terminal } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row relative overflow-hidden font-sans bg-background">
      {/* Decorative Background for the whole page */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10 hidden md:block" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[150px] rounded-full pointer-events-none -z-10 hidden md:block" />

      {/* Left side - Branding & Showcase */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-[#0a0a0a] relative flex-col p-8 lg:p-16 border-r border-border/20 text-white overflow-hidden">
        {/* Abstract shapes & Gradients */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] bg-gradient-to-tr from-primary/20 via-accent/10 to-purple-500/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[10%] w-[30vw] h-[30vw] bg-gradient-to-br from-blue-500/10 to-primary/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        
        <div className="relative z-10 flex justify-between items-start w-full shrink-0 mb-16 lg:mb-20">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="h-10 w-10 lg:h-12 lg:w-12 bg-primary text-primary-foreground flex items-center justify-center font-display text-xl lg:text-2xl leading-none rounded-2xl shadow-[0_0_30px_-5px_var(--color-primary)]">
              W
            </div>
            <span className="font-display text-xl lg:text-2xl tracking-tight font-bold">Webmaker</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-2xl shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-display text-4xl lg:text-6xl xl:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]">
              Architect <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-orange-400 italic font-serif font-light pr-4 drop-shadow-2xl">beautiful</span> systems.
            </h1>
            <p className="text-lg lg:text-xl text-white/60 font-medium leading-relaxed max-w-xl">
              Join thousands of engineers generating production-ready React architectures instantly. Stop writing boilerplate.
            </p>
          </motion.div>
        </div>
        
        {/* Dynamic Showcase Element */}
        <div className="relative z-10 w-full flex-1 min-h-[250px] lg:min-h-[300px] mt-8 lg:mt-12 perspective-[2000px] flex items-end justify-end">
           {mounted && (
             <motion.div 
               initial={{ opacity: 0, rotateX: 20, y: 100 }}
               animate={{ opacity: 1, rotateX: 0, y: 0 }}
               transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
               className="w-[110%] lg:w-[100%] max-w-[700px] h-full max-h-[350px] bg-[#111]/80 backdrop-blur-2xl rounded-tl-[2rem] border-t border-l border-white/10 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transform origin-bottom-right"
             >
                {/* Editor Header */}
                <div className="h-12 lg:h-14 bg-white/5 border-b border-white/5 flex items-center px-4 lg:px-6 justify-between shrink-0">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-red-500/80" />
                     <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-yellow-500/80" />
                     <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-green-500/80" />
                   </div>
                   <div className="flex gap-4 text-white/40 text-[10px] lg:text-xs font-mono">
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-md text-white/80 border border-white/5">
                         <Terminal className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                         Terminal
                      </div>
                      <div className="flex items-center gap-2 hover:text-white/80 cursor-pointer px-3 py-1.5 hidden sm:flex">
                         <Code2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                         Editor
                      </div>
                   </div>
                </div>

                {/* Editor Body */}
                <div className="flex-1 p-6 lg:p-8 relative font-mono text-xs lg:text-sm leading-relaxed overflow-hidden flex">
                   <div className="flex flex-col text-white/20 pr-4 lg:pr-6 select-none items-end">
                      {Array.from({ length: 10 }).map((_, i) => <div key={i}>{i + 1}</div>)}
                   </div>
                   <div className="flex-1">
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 1, duration: 0.5 }}
                      >
                         <span className="text-blue-400">import</span> &#123; <span className="text-yellow-200">Architect</span> &#125; <span className="text-blue-400">from</span> <span className="text-green-300">&apos;@webmaker/core&apos;</span>;
                      </motion.div>
                      <br/>
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: 1.5, duration: 0.5 }}
                      >
                         <span className="text-blue-400">const</span> app <span className="text-blue-400">=</span> <span className="text-blue-400">new</span> <span className="text-yellow-200">Architect</span>(&#123;
                         <br/>
                         &nbsp;&nbsp;framework: <span className="text-green-300">&apos;nextjs&apos;</span>,
                         <br/>
                         &nbsp;&nbsp;styling: <span className="text-green-300">&apos;tailwind&apos;</span>,
                         <br/>
                         &nbsp;&nbsp;components: <span className="text-green-300">&apos;shadcn&apos;</span>
                         <br/>
                         &#125;);
                      </motion.div>
                      <br/>
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: 2, duration: 0.5 }}
                        className="flex items-center gap-2 mt-2 bg-white/5 p-2 lg:p-3 rounded-lg border border-white/10 w-fit"
                      >
                         <span className="text-purple-400">await</span> app.<span className="text-yellow-200">generate</span>(<span className="text-green-300">&apos;Build auth page&apos;</span>);
                         <motion.div 
                           animate={{ opacity: [1, 0, 1] }} 
                           transition={{ duration: 1, repeat: Infinity }}
                           className="w-1.5 h-3 lg:w-2 lg:h-4 bg-white/80 inline-block ml-1"
                         />
                      </motion.div>
                   </div>
                   
                   {/* Floating Feature Cards */}
                   <motion.div 
                     initial={{ opacity: 0, y: 20, x: 20 }}
                     animate={{ opacity: 1, y: 0, x: 0 }}
                     transition={{ delay: 2.5, duration: 0.8, type: "spring", stiffness: 100 }}
                     className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl items-center gap-3 hidden xl:flex"
                   >
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                         <Zap className="w-4 h-4" />
                      </div>
                      <div>
                         <div className="text-xs font-bold text-white">Zero Boilerplate</div>
                         <div className="text-[10px] text-white/50 font-sans">Ready in 2.4s</div>
                      </div>
                   </motion.div>
                   
                   <motion.div 
                     initial={{ opacity: 0, y: 20, x: 20 }}
                     animate={{ opacity: 1, y: 0, x: 0 }}
                     transition={{ delay: 2.8, duration: 0.8, type: "spring", stiffness: 100 }}
                     className="absolute top-28 right-8 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl items-center gap-3 hidden xl:flex"
                   >
                      <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(255,189,46,0.3)]">
                         <Layers className="w-4 h-4" />
                      </div>
                      <div>
                         <div className="text-xs font-bold text-white">Full Architecture</div>
                         <div className="text-[10px] text-white/50 font-sans">Pages, API, Hooks</div>
                      </div>
                   </motion.div>
                </div>
             </motion.div>
           )}
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-background overflow-y-auto">
        <div className="md:hidden w-full flex justify-start mb-8 shrink-0">
           <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center font-display text-2xl leading-none rounded-2xl shadow-lg">
              W
            </div>
            <span className="font-display text-2xl tracking-tight text-foreground font-bold">Webmaker</span>
          </Link>
        </div>

        <div className="w-full max-w-sm lg:max-w-md relative z-10 my-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
             <button 
               onClick={() => setIsLogin(true)}
               className={`text-lg font-display font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${isLogin ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
             >
               Log in
             </button>
             <button 
               onClick={() => setIsLogin(false)}
               className={`text-lg font-display font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${!isLogin ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
             >
               Sign up
             </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5 lg:gap-6"
            >
              <div className="text-center mb-2 lg:mb-4">
                <h2 className="text-2xl lg:text-3xl font-display font-bold tracking-tight mb-2">
                  {isLogin ? "Welcome back" : "Create an account"}
                </h2>
                <p className="text-muted-foreground text-xs lg:text-sm font-medium">
                  {isLogin ? "Enter your details to access your workspace." : "Start building production architectures for free."}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button className="flex items-center justify-center gap-3 w-full h-12 lg:h-14 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-bold transition-all border border-border/60 hover:border-border hover:shadow-sm">
                  <Github className="w-5 h-5" />
                  {isLogin ? "Log in with GitHub" : "Sign up with GitHub"}
                </button>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-[10px] lg:text-[11px] uppercase tracking-widest font-bold">or continue with email</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>

              <form className="flex flex-col gap-4 lg:gap-5" onSubmit={(e) => e.preventDefault()}>
                {!isLogin && (
                  <div className="flex flex-col gap-1.5 lg:gap-2">
                    <label className="text-xs lg:text-sm font-bold text-foreground">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Jane Doe"
                      className="h-12 lg:h-14 rounded-2xl border border-border/60 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
                    />
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <label className="text-xs lg:text-sm font-bold text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                    <input 
                      type="email" 
                      placeholder="jane@example.com"
                      className="h-12 lg:h-14 w-full rounded-2xl border border-border/60 bg-background/50 pl-11 lg:pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 lg:gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs lg:text-sm font-bold text-foreground">Password</label>
                    {isLogin && <a href="#" className="text-[10px] lg:text-xs text-primary font-bold hover:underline">Forgot password?</a>}
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="h-12 lg:h-14 rounded-2xl border border-border/60 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all"
                  />
                </div>

                <button className="mt-2 flex items-center justify-center gap-2 w-full h-12 lg:h-14 rounded-2xl bg-primary text-primary-foreground font-bold shadow-[0_0_20px_-5px_var(--color-primary)] hover:shadow-[0_0_30px_-5px_var(--color-primary)] hover:scale-[1.02] transition-all active:scale-95 group">
                  {isLogin ? "Log in" : "Create account"}
                  <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
              
              <p className="text-center text-[10px] lg:text-xs text-muted-foreground mt-2 lg:mt-4 leading-relaxed">
                By continuing, you agree to our <br className="hidden lg:block"/><Link href="/terms" className="text-foreground hover:underline font-bold">Terms of Service</Link> and <Link href="/privacy" className="text-foreground hover:underline font-bold">Privacy Policy</Link>.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
