import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  id: number;
  scenario: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    scenario: 'You receive an SMS saying your package is on hold. Which link is the genuine USPS website?',
    options: [
      {
        text: 'http://usps.com.tracking-parcel.top/redirection',
        isCorrect: false,
        explanation: 'Deceptive Subdomain: The attacker put "usps.com" in the subdomain prefix, but the real domain you visit is "tracking-parcel.top".'
      },
      {
        text: 'https://tools.usps.com/go/TrackConfirmAction',
        isCorrect: true,
        explanation: 'Correct! The registered domain is "usps.com" with official HTTPS encryption.'
      },
      {
        text: 'https://usps-redelivery-fee.com/verify',
        isCorrect: false,
        explanation: 'Lookalike Registered Domain: The scammer registered "usps-redelivery-fee.com" to fool people looking at the words.'
      }
    ]
  },
  {
    id: 2,
    scenario: 'You get an urgent email that your Netflix account is suspended. Which link is authentic?',
    options: [
      {
        text: 'http://netflix-billing-support.net/payment',
        isCorrect: false,
        explanation: 'Notice the unencrypted "http://" and third-party domain "netflix-billing-support.net". Netflix only uses netflix.com.'
      },
      {
        text: 'https://www.netflix.com/youraccount',
        isCorrect: true,
        explanation: 'Correct! "netflix.com" is the only authorized domain owned by Netflix.'
      },
      {
        text: 'https://netflix.customer-verification-service.org/login',
        isCorrect: false,
        explanation: 'Subdomain trick: "netflix" is just a prefix on "customer-verification-service.org".'
      }
    ]
  },
  {
    id: 3,
    scenario: 'An SMS says: "Bank of America Alert: Suspicious $842 charge. Verify now." What should you check first?',
    options: [
      {
        text: 'Whether the website has a lock icon next to the address',
        isCorrect: false,
        explanation: 'Over 80% of modern phishing sites have a valid lock icon (free SSL certificates). A lock icon only means encrypted, not honest.'
      },
      {
        text: 'The exact registered domain right before the first slash (/), ignoring subdomains',
        isCorrect: true,
        explanation: 'Correct! The registered domain (e.g. bankofamerica.com) is the cryptographic identity of who owns the server.'
      },
      {
        text: 'Whether the sender phone number looks like a real phone number',
        isCorrect: false,
        explanation: 'Caller ID and SMS sender IDs are easily spoofed by attackers using inexpensive VoIP services.'
      }
    ]
  }
];

export const PhishingQuiz: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const question = QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(idx);
    if (question.options[idx].isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div id="anatomy-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            Interactive Micro-Trainer: "Spot the Scam"
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test your ability to spot deceptive URL patterns before clicking real-world messages.
          </p>
        </div>
        {!completed && (
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Question {currentIdx + 1} of {QUESTIONS.length}
          </span>
        )}
      </div>

      {!completed ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white">
            {question.scenario}
          </p>

          <div className="space-y-2.5">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const hasAnswered = selectedOption !== null;

              let style = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700';
              if (hasAnswered) {
                if (option.isCorrect) {
                  style = 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200';
                } else if (isSelected && !option.isCorrect) {
                  style = 'bg-rose-950/40 border-rose-600/70 text-rose-200';
                } else {
                  style = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={hasAnswered}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-mono transition-all flex items-start justify-between gap-3 ${style}`}
                >
                  <span className="break-all">{option.text}</span>
                  {hasAnswered && (
                    <span className="shrink-0 mt-0.5">
                      {option.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption !== null && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed mt-4">
              <strong className={question.options[selectedOption].isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                {question.options[selectedOption].isCorrect ? 'Correct! ' : 'Incorrect! '}
              </strong>
              {question.options[selectedOption].explanation}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  {currentIdx < QUESTIONS.length - 1 ? 'Next Question' : 'View Results'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">
              Quiz Completed! Score: {score} / {QUESTIONS.length}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {score === QUESTIONS.length
                ? 'Outstanding! You can accurately dissect deceptive subdomains, suspicious TLDs, and fake urgent messages.'
                : 'Good effort! Remember: always look at the registered domain right before the first slash (/), never just the brand name in the subdomain.'}
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}
    </div>
  );
};
