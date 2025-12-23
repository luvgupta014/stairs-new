import React, { useEffect, useMemo, useRef } from 'react';

export default function TermsAgreementStep({
  title,
  sections,
  version,
  checkboxText,
  accepted,
  onAcceptedChange,
  hasScrolledToBottom,
  onScrolledToBottom
}) {
  const scrollRef = useRef(null);

  const canEnableCheckbox = !!hasScrolledToBottom;

  const scrollHint = useMemo(() => {
    if (hasScrolledToBottom) return 'Scroll complete. You can now confirm agreement.';
    return 'Please scroll to the bottom to enable the agreement checkbox.';
  }, [hasScrolledToBottom]);

  useEffect(() => {
    // If terms are short (no scroll), auto-enable scroll completion.
    const el = scrollRef.current;
    if (!el) return;
    const needsScroll = el.scrollHeight > el.clientHeight + 16;
    if (!needsScroll && !hasScrolledToBottom) onScrolledToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (atBottom && !hasScrolledToBottom) onScrolledToBottom(true);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-6xl mb-2">📄</div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">Version: {version}</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        {scrollHint}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[340px] overflow-y-auto border border-gray-200 rounded-lg bg-white p-4 space-y-4"
      >
        {sections?.map((sec, idx) => (
          <div key={idx} className="space-y-2">
            <div className="font-semibold text-gray-900">{sec.heading}</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {(sec.bullets || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="pt-2 text-xs text-gray-500">
          End of Terms & Conditions.
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            disabled={!canEnableCheckbox}
            checked={!!accepted}
            onChange={(e) => onAcceptedChange(!!e.target.checked)}
            className="mt-1"
          />
          <span className={`${canEnableCheckbox ? 'text-gray-800' : 'text-gray-400'} text-sm`}>
            {canEnableCheckbox ? (
              <>
                <span className="font-semibold">I Agree</span> — {checkboxText || 'I have read and understood the above terms and accept them.'}
              </>
            ) : (
              <>
                <span className="font-semibold">I Agree</span> — (scroll to bottom to enable)
              </>
            )}
          </span>
        </label>
      </div>
    </div>
  );
}


