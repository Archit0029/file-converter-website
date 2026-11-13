import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Infinity as InfinityIcon, 
  Sliders, 
  Lock, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: '100% Client-Side Privacy',
      description:
        'Unlike cloud converters that upload your documents to remote third-party servers, OmniConvert runs algorithms right in your browser memory. Your files never leave your device.',
      badge: 'Zero Risk',
    },
    {
      icon: Zap,
      title: 'Zero Latency & Instant Conversions',
      description:
        'Enjoy near-instant processing times powered by HTML5 Canvas, WebAssembly, and modern Web Workers. No waiting in server queues or uploading gigabytes of data.',
      badge: 'Real-time',
    },
    {
      icon: InfinityIcon,
      title: 'Unlimited File Sizes & No Quotas',
      description:
        'Convert as many images, PDFs, videos, and spreadsheets as your machine can handle without hitting annoying daily file limits or paywalls.',
      badge: 'Forever Free',
    },
    {
      icon: Sliders,
      title: 'Precision Compression Sliders',
      description:
        'Fine-tune image compression quality, adjust image dimensions, strip bloated EXIF metadata, and preview before-and-after byte savings in real time.',
      badge: 'Pro Controls',
    },
  ];

  return (
    <section className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>Enterprise-Grade Security Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Professionals Prefer OmniConvert
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Engineered from scratch to solve the biggest flaws in traditional file converters:
            intrusive ads, slow queue times, file size limits, and security vulnerabilities.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl p-6 glass-card border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Trust Metric Badges */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-300">100+</div>
              <p className="text-xs text-slate-300 mt-1 font-medium">Supported Formats</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">0 KB</div>
              <p className="text-xs text-slate-300 mt-1 font-medium">Uploaded to Server</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-purple-300">0.0s</div>
              <p className="text-xs text-slate-300 mt-1 font-medium">Queue Wait Time</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-300">100%</div>
              <p className="text-xs text-slate-300 mt-1 font-medium">Free & Private</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
