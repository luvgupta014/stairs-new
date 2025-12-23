import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TERMS, TERMS_VERSION } from '../content/terms';

const tabs = [
  { key: 'ATHLETE', label: 'Athlete / Player' },
  { key: 'COORDINATOR', label: 'Coordinator' },
  { key: 'INSTITUTION', label: 'Institutions' }
];

export default function Terms() {
  const [active, setActive] = useState('ATHLETE');

  const content = useMemo(() => TERMS[active], [active]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
            <p className="text-sm text-gray-600 mt-1">Version: {TERMS_VERSION}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  active === t.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
            <p className="text-sm text-gray-700 mt-2">{content.checkboxText}</p>

            <div className="mt-6 space-y-5">
              {content.sections.map((sec, idx) => (
                <section key={idx} className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{sec.heading}</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    {(sec.bullets || []).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t text-xs text-gray-500">
              Continued use of the STAIRS platform implies acceptance of the latest Terms & Conditions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


