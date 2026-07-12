import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export function ProgressTerminal() {
  const steps = [
    "> Initializing AI Agentic Workflow...",
    "> Establishing secure connection to financial APIs...",
    "> Scraping real-time market data from Yahoo Finance...",
    "> Fetching 6 months of historical price action...",
    "> Reading latest news articles and sentiment indicators...",
    "> Feeding context into LLaMA 3.3 70B Versatile model...",
    "> Synthesizing fundamentals and market sentiment...",
    "> Formulating definitive investment decision..."
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, Math.random() * 1200 + 800); // Random delay between 800ms and 2000ms
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-slate-900 rounded-xl border border-slate-700 p-6 font-mono text-sm shadow-2xl text-left overflow-hidden relative animate-slide-up">
      <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-700 pb-2">
        <Terminal size={16} />
        <span>agent_terminal_v1.0.sh</span>
      </div>
      <div className="space-y-2 h-48 flex flex-col justify-end">
        {steps.slice(0, currentStep + 1).map((step, idx) => (
          <div key={idx} className={`animate-fade-in ${idx === currentStep ? 'text-green-400' : 'text-slate-500'}`}>
            {step}
            {idx === currentStep && <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  );
}
