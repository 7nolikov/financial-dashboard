import React from 'react';
import { AlertTriangle, TrendingDown, Shield } from 'lucide-react';
import type { WealthValidationResult } from '../../lib/validation/wealth-protection';

interface WealthProtectionPanelProps {
  validation: WealthValidationResult;
  className?: string;
}

export function WealthProtectionPanel({ validation, className = '' }: WealthProtectionPanelProps) {
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
    <div className={`space-y-4 ${className}`}>
      {/* Errors - Critical Issues */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Critical Financial Issues</h3>
          </div>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings - Important Issues */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <TrendingDown className="h-5 w-5" />
            <h3 className="font-semibold">Financial Warnings</h3>
          </div>
          <ul className="space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-yellow-700 text-sm flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface WealthWarningIndicatorProps {
  hasWarnings: boolean;
  hasErrors: boolean;
  className?: string;
}

export function WealthWarningIndicator({ hasWarnings, hasErrors, className = '' }: WealthWarningIndicatorProps) {
  if (!hasWarnings && !hasErrors) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {hasErrors ? (
        <>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-red-600 text-sm font-medium">Critical Issues</span>
        </>
      ) : (
        <>
          <TrendingDown className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-600 text-sm font-medium">Financial Warnings</span>
        </>
      )}
    </div>
  );
}
