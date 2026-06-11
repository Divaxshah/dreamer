import { MarketingShell } from "@/components/site/MarketingShell";

export default function PrivacyPolicyPage() {
  return (
    <MarketingShell>
      <div className="min-h-screen bg-background relative overflow-hidden font-sans pb-32">
        {/* Decorative backgrounds */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-accent/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-32 relative z-10">
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-bold uppercase tracking-widest mb-6">
              Legal Information
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              Privacy <span className="text-primary italic font-serif font-light">Policy.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium border-l-4 border-primary pl-6 py-2">
              Effective Date: March 13, 2026<br/>
              Last Updated: March 13, 2026
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-muted-foreground">
            <p className="text-xl font-medium text-foreground">
              Webmaker (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (webmaker.dev), use our application, or otherwise engage with our services.
            </p>
            
            <hr className="my-12 border-border/50" />

            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, information derived from your use of the Services, and information from third-party sources. This includes:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, password, and communication preferences.</li>
              <li><strong>Workspace Data:</strong> Code, prompts, configurations, and project metadata generated or provided during your use of the Webmaker Studio.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including IP addresses, browser types, session durations, and error logs.</li>
              <li><strong>Payment Information:</strong> Processed securely via our third-party payment processors (e.g., Stripe). We do not store full credit card details on our servers.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the collected information for various professional and operational purposes, including to:
            </p>
            <ul>
              <li>Provide, operate, and maintain the Webmaker platform.</li>
              <li>Process transactions and send related information, including confirmations and receipts.</li>
              <li>Improve, personalize, and expand our Services by understanding usage patterns.</li>
              <li>Provide customer support and respond to technical inquiries.</li>
              <li>Communicate with you regarding updates, security alerts, and administrative messages.</li>
            </ul>

            <h2>3. Artificial Intelligence and Model Training</h2>
            <p>
              <strong>Your Code is Yours.</strong> Webmaker relies on large language models (LLMs) to generate frontend architecture. By default, <strong>we do not use your proprietary prompts or generated code to train our foundational models</strong>. Information sent to third-party model providers (like OpenAI or Anthropic) is governed by strict enterprise data processing agreements that prohibit training on your data.
            </p>

            <h2>4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal data. We may share your information only in the following situations:
            </p>
            <ul>
              <li><strong>Service Providers:</strong> We share data with trusted third-party vendors who provide cloud hosting, analytics, and payment processing services.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition.</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement enterprise-grade technical and organizational measures to secure your personal data against accidental loss and unauthorized access. However, no security system is impenetrable, and we cannot guarantee absolute security of your data over the internet.
            </p>

            <h2>6. Your Data Rights</h2>
            <p>
              Depending on your location (e.g., under GDPR or CCPA), you may have rights to access, correct, delete, or restrict the processing of your personal data. You can exercise these rights by contacting us at privacy@webmaker.dev.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact our Data Protection Officer at:
            </p>
            <div className="bg-secondary p-6 rounded-2xl border border-border/50 mt-6 font-mono text-sm">
              Email: privacy@webmaker.dev<br/>
              Address: Webmaker Inc., 100 Innovation Way, Suite 400, San Francisco, CA 94105
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
