import React from 'react';
import { Link } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';

/**
 * PermissionGateNotice
 * A friendly UI for "403 / permission missing" screens.
 */
const PermissionGateNotice = ({
  title = 'Access required',
  description = 'You don’t have permission to use this feature for this event.',
  requiredLabel = '',
  primaryAction,
  secondaryAction,
  eventLink,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <div className="text-2xl font-bold">{title}</div>
          <div className="text-indigo-100 text-sm mt-1">
            {description}
          </div>
        </div>

        <div className="p-6">
          {requiredLabel ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="mt-0.5 text-amber-700" />
                <div>
                  <div className="font-semibold">Required permission</div>
                  <div className="text-sm">{requiredLabel}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="text-sm text-gray-700">
            If you believe you should have access, ask Admin to grant it for this event.
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {primaryAction ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className={`px-4 py-3 rounded-lg font-semibold text-white ${primaryAction.className || 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {primaryAction.label}
              </button>
            ) : null}

            {eventLink ? (
              <Link
                to={eventLink}
                className="px-4 py-3 rounded-lg font-semibold border border-gray-300 hover:border-gray-400 text-gray-900 text-center"
              >
                Back to Event
              </Link>
            ) : null}

            {secondaryAction ? (
              <a
                href={secondaryAction.href}
                className="px-4 py-3 rounded-lg font-semibold border border-gray-300 hover:border-gray-400 text-gray-900 text-center"
              >
                {secondaryAction.label}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionGateNotice;


