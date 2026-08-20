import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronLeft,
  Check,
  Lock,
  Fingerprint,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { closeClothingDecision } from '../services/geminiService';
import { DecisionResult, DecisionContext, SlotItem } from '../types';
import { ProductImage } from '../components/ProductImage';
import { OutfitModelViewer } from '../components/OutfitModelViewer';

type FlowStep = 'WELCOME' | 'GENDER' | 'BUDGET' | 'DESCRIBE' | 'READY' | 'ANALYZING' | 'RESULTS';

const StepLayout: React.FC<{ 
  title: string, 
  subtitle?: string, 
  children?: React.ReactNode, 
  onNext: () => void, 
  onBack?: () => void,
  canProceed: boolean, 
  nextLabel?: string,
  hideButton?: boolean
}> = ({ title, subtitle, children, onNext, onBack, canProceed, nextLabel = "Continue", hideButton = false }) => (
  <div className="screen animate-fade">
    <div className="scroll-area">
      <div className="mb-4 flex items-center justify-start relative pt-6">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        )}
      </div>
      <header className="mb-8 text-center px-4">
        <h2 className="title">{title}</h2>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </header>
      
      <div className="w-full flex flex-col gap-3">
        {children}
      </div>
    </div>

    {!hideButton && (
      <div className="fixed-cta">
        <button 
          onClick={onNext} 
          disabled={!canProceed}
          className="continue-btn"
        >
          {nextLabel}
        </button>
      </div>
    )}
  </div>
);

const GridSlot: React.FC<{ slot: SlotItem }> = ({ slot }) => {
  return (
    <div className="bg-white rounded-xl text-center p-3">
      <a 
        href={slot.product_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[3/4] relative bg-gray-50 mb-3 rounded-lg overflow-hidden border border-gray-100 group cursor-pointer"
      >
        <ProductImage 
          src={slot.image_url} 
          alt={slot.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <ExternalLink size={24} className="text-white drop-shadow-md" />
        </div>
      </a>
      
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{slot.brand}</p>
      <h4 className="text-sm font-medium leading-tight mb-1 text-black line-clamp-2 min-h-[2.5em]">{slot.name}</h4>
      <p className="text-sm font-semibold text-black">${slot.price}</p>
    </div>
  );
};

export const DecisionEngine: React.FC = () => {
  const [step, setStep] = useState<FlowStep>('WELCOME');
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [canProceed, setCanProceed] = useState(false);
  const [localNote, setLocalNote] = useState('');

  const [context, setContext] = useState<DecisionContext>({
    gender: 'Men',
    identity: 'Men',
    build: 'Regular',
    fit: 'Tailored',
    age: '25-34',
    occasion: 'Everyday',
    colorDNA: 'Neutral',
    exclusions: '',
    investment: 200, 
    inspiration: 'Clean & sharp',
    refinement: '',
    currency: 'USD'
  });

  const STEPS: FlowStep[] = ['WELCOME', 'GENDER', 'BUDGET', 'DESCRIBE', 'READY', 'ANALYZING', 'RESULTS'];

  const next = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx < STEPS.length - 1) {
      const nextStep = STEPS[currentIdx + 1];
      if (step === 'DESCRIBE') {
        setContext(prev => ({ ...prev, refinement: localNote }));
      }
      setStep(nextStep);
      setCanProceed(['DESCRIBE', 'BUDGET', 'READY', 'RESULTS'].includes(nextStep));
    }
  };

  const prev = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx > 0) {
      setStep(STEPS[currentIdx - 1]);
      setCanProceed(true);
    }
  };

  const updateContext = (field: keyof DecisionContext, val: any) => {
    setContext(prev => ({ ...prev, [field]: val }));
    setCanProceed(true);
    if (['GENDER'].includes(step)) {
      setTimeout(next, 200); 
    }
  };

  const executeStyling = async () => {
    setStep('ANALYZING');
    try {
      const res = await closeClothingDecision(context);
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setStep('RESULTS');
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNote(e.target.value);
    setCanProceed(true);
  };

  if (step === 'WELCOME') return (
    <div className="screen animate-fade">
      <div className="scroll-area flex flex-col items-center justify-center text-center">
        <div className="mt-24">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
             <Fingerprint size={32} strokeWidth={1} />
          </div>
          <h1 className="text-6xl font-light tracking-tighter mb-4 text-black">SÉVEN</h1>
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400">Authority First</p>
        </div>
      </div>
      <div className="fixed-cta">
        <button onClick={next} className="continue-btn">
          Start
        </button>
      </div>
    </div>
  );

  if (step === 'GENDER') return (
    <StepLayout title="Identity." onNext={next} onBack={prev} canProceed={canProceed} hideButton>
      {['Men', 'Women'].map((opt) => (
        <div 
          key={opt} 
          onClick={() => updateContext('gender', opt as any)} 
          className={`option-card ${context.gender === opt ? 'selected' : ''}`}
        >
          <span className="text-lg font-medium">{opt}</span>
          {context.gender === opt && <Check size={20} strokeWidth={2.5} />}
        </div>
      ))}
    </StepLayout>
  );

  if (step === 'BUDGET') return (
    <StepLayout title="Allocation." subtitle="Minimum $50 investment." onNext={next} onBack={prev} canProceed={canProceed}>
      <div className="flex flex-col gap-10 w-full mt-8">
        <div className="p-12 bg-[#fafafa] rounded-[2rem] border border-gray-100 flex flex-col items-center">
          <p className="label-text text-gray-400 mb-6">Total Budget</p>
          <div className="flex items-center">
             <span className="text-3xl font-light text-gray-300 mr-2">$</span>
             <input 
              type="number"
              value={context.investment}
              onChange={(e) => setContext(prev => ({ ...prev, investment: Math.max(50, Number(e.target.value)) }))}
              className="text-6xl font-medium bg-transparent outline-none w-48 text-center p-0 text-black border-none tracking-tighter"
              inputMode="numeric"
            />
          </div>
        </div>
        <input 
          type="range"
          min={50}
          max={5000}
          step={50}
          value={context.investment}
          onChange={(e) => setContext(prev => ({ ...prev, investment: Math.max(50, Number(e.target.value)) }))}
          className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between px-2">
           <span className="text-xs font-bold text-gray-300">Basic</span>
           <span className="text-xs font-bold text-gray-300">Flexible</span>
        </div>
      </div>
    </StepLayout>
  );

  if (step === 'DESCRIBE') return (
    <StepLayout title="Request." subtitle="e.g. Black hoodie and jeans" onNext={next} onBack={prev} canProceed={true}>
      <textarea 
        placeholder="Describe both items..."
        className="typing-pad"
        value={localNote}
        onChange={handleNoteChange}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize="sentences"
      />
    </StepLayout>
  );

  if (step === 'READY') return (
    <div className="screen animate-fade">
      <div className="scroll-area flex flex-col items-center justify-center text-center">
        <div className="mt-20">
          <div className="w-20 h-20 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Lock size={32} strokeWidth={1} className="text-black" />
          </div>
          <h2 className="title mb-3">Locked</h2>
          <p className="subtitle">Searching confirmed inventory.</p>
        </div>
      </div>
      <div className="fixed-cta">
        <button onClick={executeStyling} className="continue-btn">Execute</button>
      </div>
    </div>
  );

  if (step === 'ANALYZING') return (
    <div className="screen justify-center items-center">
      <div className="scroll-area flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-black border-black/5 rounded-full animate-spin mb-8"></div>
        <p className="text-xs font-bold uppercase tracking-[0.4em] text-black animate-pulse">Matching</p>
      </div>
    </div>
  );

  if (step === 'RESULTS') return (
    <div className="screen animate-fade">
      <div className="scroll-area">
        <div className="text-center pb-8 pt-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${result?.status === 'OK' ? 'bg-black' : 'bg-red-500'} text-white rounded-full mb-6`}>
              <ShieldCheck size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{result?.status === 'OK' ? 'Verified' : 'Status'}</span>
            </div>
            
            {result?.status === 'OK' && result?.reason && (
              <div className="p-6 bg-[#fafafa] border border-black/[0.04] rounded-[2rem] mb-8">
                <p className="text-lg font-light leading-relaxed italic text-black">
                   "{result.reason}"
                </p>
              </div>
            )}
            
            {result?.meta?.total_price && result.meta.total_price > 0 && (
              <p className="text-3xl font-medium tracking-tighter mb-4">
                ${result.meta.total_price.toFixed(2)}
              </p>
            )}
        </div>

        {result?.status === 'OK' && result.items && result.items.length > 0 && (
          <OutfitModelViewer gender={context.gender} items={result.items} />
        )}

        {result?.status === 'OK' && result.items && result.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 max-w-2xl mx-auto px-2 pb-20">
            {result.items.map((slot) => (
              <GridSlot key={slot.id} slot={slot} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 mt-12">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Fingerprint size={24} className="text-gray-300" />
             </div>
             <p className="text-gray-400 mb-2">We’re refining your match.</p>
             <p className="text-sm text-gray-300">Try a slightly broader description.</p>
          </div>
        )}
      </div>

      <div className="fixed-cta flex-col gap-3 bg-white/90 backdrop-blur-md pt-4">
          <button 
            onClick={() => setStep('WELCOME')} 
            className="w-full py-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={12} /> Reset
          </button>
      </div>
    </div>
  );

  return null; 
};