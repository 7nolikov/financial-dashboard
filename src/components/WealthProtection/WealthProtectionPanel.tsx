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
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-green-800">
          <Shield className="h-5 w-5" />
          <h3 className="font-semibold">Financial Health: Good</h3>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Your financial plan appears to be on track with no major concerns detected.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Critical errors — collapsible */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setErrorsExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-red-800 hover:bg-red-100/60 transition-colors"
            aria-expanded={errorsExpanded}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-semibold text-left">Critical Financial Issues</h3>
              <span className="text-[11px] font-semibold bg-red-200 text-red-700 rounded-full px-2 py-0.5 leading-none">
                {validation.errors.length}
              </span>
            </div>
            {errorsExpanded
              ? <ChevronUp className="h-4 w-4 shrink-0 opacity-50" />
              : <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />}
          </button>
          {errorsExpanded && (
            <ul className="px-4 pb-3 space-y-1.5">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 shrink-0">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Warnings — collapsible */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setWarningsExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-yellow-800 hover:bg-yellow-100/60 transition-colors"
            aria-expanded={warningsExpanded}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 shrink-0" />
              <h3 className="font-semibold text-left">Financial Warnings</h3>
              <span className="text-[11px] font-semibold bg-yellow-200 text-yellow-700 rounded-full px-2 py-0.5 leading-none">
                {validation.warnings.length}
              </span>
            </div>
            {warningsExpanded
              ? <ChevronUp className="h-4 w-4 shrink-0 opacity-50" />
              : <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />}
          </button>
          {warningsExpanded && (
            <ul className="px-4 pb-3 space-y-1.5">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-700 text-sm flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
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
