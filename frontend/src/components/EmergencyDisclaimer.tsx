import { ShieldAlert } from 'lucide-react';

/**
 * Mandatory emergency disclaimer (docs/Rules.md RULE 1.4).
 *
 * Must be visible on every hazard, risk and AI-guidance surface. The wording is
 * fixed by the rules document — do not paraphrase or shorten it.
 */

export const EMERGENCY_DISCLAIMER_TEXT =
  'DisasterWatch is an informational decision-support tool. It does not replace official emergency broadcast systems or lawful instructions from civil defense authorities.';

interface EmergencyDisclaimerProps {
  /** 'bar' is a single compact line; 'panel' is a bordered block. */
  variant?: 'bar' | 'panel';
  className?: string;
}

export const EmergencyDisclaimer: React.FC<EmergencyDisclaimerProps> = ({
  variant = 'panel',
  className = '',
}) => {
  if (variant === 'bar') {
    return (
      <div
        className={`flex items-start gap-2 px-3 py-2 rounded-lg bg-tertiary/10 border border-tertiary/30 ${className}`}
        role="note"
      >
        <ShieldAlert className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-on-surface-variant">
          {EMERGENCY_DISCLAIMER_TEXT}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg bg-tertiary/10 border border-tertiary/30 ${className}`}
      role="note"
    >
      <ShieldAlert className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed text-on-surface-variant">
        {EMERGENCY_DISCLAIMER_TEXT}
      </p>
    </div>
  );
};
