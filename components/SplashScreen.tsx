
import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = 2500; // Faster load
    const intervalTime = 50;
    const increment = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + increment;
      });
    }, intervalTime);

    const steps = [
      () => setStep(1), // Logo
      () => setStep(2), // Init
      () => setStep(3), // Sync
      () => setTimeout(onComplete, 500) // Finish
    ];

    let current = 0;
    const stepInterval = setInterval(() => {
      if (current < steps.length) {
        steps[current]();
        current++;
      } else {
        clearInterval(stepInterval);
      }
    }, 600);

    return () => {
      clearInterval(timer);
      clearInterval(stepInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden font-mono select-none">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, #B30000 25%, #B30000 26%, transparent 27%, transparent 74%, #B30000 75%, #B30000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #B30000 25%, #B30000 26%, transparent 27%, transparent 74%, #B30000 75%, #B30000 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
        
        {/* Logo Animation */}
        <div className={`mb-8 transition-all duration-500 transform ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
           <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-klaus-red/30 rounded-full animate-[spin_3s_linear_infinite]"></div>
              <div className="relative z-10 text-5xl font-black text-white tracking-tighter">
                K<span className="text-klaus-red">.</span>
              </div>
           </div>
        </div>

        {/* Text Sequence */}
        <div className="h-12 flex flex-col items-center justify-center w-full text-center space-y-1">
          {step >= 1 && (
             <h1 className="text-xl font-black tracking-[0.2em] text-white animate-fade-in">
                KLAUS
             </h1>
          )}
          
          <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2 h-4">
             {step === 1 && <span className="text-klaus-red animate-pulse">{'>'} INITIALIZING...</span>}
             {step === 2 && <span className="text-yellow-500">{'>'} SECURE LINK...</span>}
             {step >= 3 && <span className="text-green-500 font-bold">{'>'} READY</span>}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-0.5 bg-gray-800 rounded-full mt-6 overflow-hidden relative">
            <div 
               className="absolute top-0 left-0 h-full bg-klaus-red shadow-[0_0_8px_#B30000] transition-all duration-100 ease-linear"
               style={{ width: `${progress}%` }}
            />
        </div>
        
        <div className="absolute bottom-[-100px] text-[8px] text-gray-800 font-bold tracking-widest">
            V3.1 // SYSTEM ONLINE
        </div>

      </div>
    </div>
  );
};
