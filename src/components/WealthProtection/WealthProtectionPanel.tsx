import React from 'react';
import { AlertTriangle, TrendingDown, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import type { WealthValidationResult } from '../../lib/validation/wealth-protection';

interface WealthProtectionPanelProps {
  validation: WealthValidationResult;
  className?: string;
}

export function WealthProtectionPanel({ validation, className = '' }: WealthProtectionPanelProps) {
  const [errorsExpanded, setErrorsExpanded] = React.useState(true);
  const [warningsExpanded, setWarningsExpanded] = React.useState(true);

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <div
        className={`bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2.5 text-emerald-900">
          <Shield className="h-5 w-5 shrink-0" />
          <h3 className="font-bold">Financial Health: Good</h3>
        </div>
        <p className="text-emerald-800 text-sm mt-1">
          Your financial plan appears to be on track with no major concerns detected.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Critical errors — collapsible */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setErrorsExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 text-red-900 hover:bg-red-100/70 transition-colors"
            aria-expanded={errorsExpanded}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <h3 className="font-bold text-[15px] sm:text-base text-left truncate">
                Critical Financial Issues
              </h3>
              <span className="text-[11px] font-bold bg-red-200 text-red-800 rounded-full px-2 py-0.5 leading-none shrink-0">
                {validation.errors.length}
              </span>
            </div>
            {errorsExpanded ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-red-700" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-red-700" />
            )}
          </button>
          {errorsExpanded && (
            <ul className="px-4 sm:px-5 pb-4 pt-0.5 space-y-2">
              {validation.errors.map((error, index) => (
                <li
                  key={index}
                  className="text-red-900 text-sm leading-relaxed flex items-start gap-2.5"
                >
                  <span className="text-red-500 mt-1 shrink-0" aria-hidden="true">
                    •
                  </span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Warnings — collapsible. Uses amber (not yellow) for clearer contrast
          against white text on the pale background. */}
      {validation.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setWarningsExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 text-amber-900 hover:bg-amber-100/70 transition-colors"
            aria-expanded={warningsExpanded}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <TrendingDown className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
              <h3 className="font-bold text-[15px] sm:text-base text-left truncate">
                Financial Warnings
              </h3>
              <span className="text-[11px] font-bold bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 leading-none shrink-0">
                {validation.warnings.length}
              </span>
            </div>
            {warningsExpanded ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-amber-700" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-amber-700" />
            )}
          </button>
          {warningsExpanded && (
            <ul className="px-4 sm:px-5 pb-4 pt-0.5 space-y-2">
              {validation.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-amber-900 text-sm leading-relaxed flex items-start gap-2.5"
                >
                  <span className="text-amber-500 mt-1 shrink-0" aria-hidden="true">
                    •
                  </span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
