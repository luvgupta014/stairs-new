import React from 'react';

/**
 * EventCard Component
 * Displays event information with role-based actions
 * Reusable across different user types
 */
const EventCard = ({ 
  event, 
  userRole = 'student', 
  userId = null, 
  onAction = () => {} 
}) => {
  if (!event) return null;
  const isStudent = userRole === 'student' || userRole === 'STUDENT';
  const hasCategories = !!(event.categoriesAvailable && event.categoriesAvailable.trim());

  const parseCategoryPreview = (text) => {
    if (!text || typeof text !== 'string' || !text.trim()) return [];
    // Prefer showing Age Groups if present; otherwise show the first section.
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const findLine = (keywords) =>
      lines.find(l => {
        const lower = l.toLowerCase();
        return keywords.some(k => lower.includes(k));
      });
    const ageLine = findLine(['age group', 'age', 'group', 'division', 'category', 'class', 'weight']);
    const target = ageLine || lines[0] || '';
    const match = target.match(/^([^:]+):\s*(.+)$/);
    if (!match) return [];
    const values = match[2].split(',').map(v => v.trim()).filter(Boolean);
    return values.slice(0, 4);
  };

  const getLevelBadge = () => {
    const lvl = (event.level || 'DISTRICT').toString().toUpperCase();
    const label = lvl === 'DISTRICT' ? 'District'
      : lvl === 'STATE' ? 'State'
      : lvl === 'NATIONAL' ? 'National'
      : lvl === 'SCHOOL' ? 'School'
      : lvl;
    const cls = lvl === 'DISTRICT' ? 'bg-green-100 text-green-800'
      : lvl === 'STATE' ? 'bg-blue-100 text-blue-800'
      : lvl === 'NATIONAL' ? 'bg-purple-100 text-purple-800'
      : lvl === 'SCHOOL' ? 'bg-amber-100 text-amber-800'
      : 'bg-gray-100 text-gray-800';
    return (
      <span className={`${cls} px-2 py-1 rounded text-xs font-medium`}>
        {label}
      </span>
    );
  };

  // Get event status
  const getEventStatus = () => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
  };

  const eventStatus = getEventStatus();

  // Check if registration is open
  const isRegistrationOpen = () => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const regDeadline = event.registrationDeadline ? 
      new Date(event.registrationDeadline) : startDate;
    
    // Registration is open if:
    // 1. Current time is before registration deadline
    // 2. Current time is before event start date
    // 3. Event hasn't reached max capacity
    return now < regDeadline && 
           now < startDate && 
           (event.currentParticipants || 0) < event.maxParticipants;
  };

  // Check if user can unregister
  const canUnregister = () => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    
    // Can unregister if:
    // 1. User is registered
    // 2. Event hasn't started yet
    return event.isRegistered && now < startDate;
  };

  // Check if user owns this event
  const isOwner = () => {
    if (userRole === 'coach' || userRole === 'COACH') return event.coachId === userId;
    if (userRole === 'institute' || userRole === 'INSTITUTE') return event.instituteId === userId;
    if (userRole === 'club' || userRole === 'CLUB') return event.clubId === userId;
    return false;
  };

  // Get creator name
  const getCreatorName = () => {
    if (event.organizer?.name) return event.organizer.name;
    if (event.coach?.name) return event.coach.name;
    if (event.institute?.name) return event.institute.name;
    if (event.club?.name) return event.club.name;
    if (event.createdBy?.name) return event.createdBy.name;
    return 'Unknown';
  };

  // Get status badge styling
  const getStatusBadge = () => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (eventStatus) {
      case 'upcoming':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'ongoing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Handle action click
  const handleAction = (action) => {
    console.log('🔥 EventCard handleAction called with:', action);
    console.log('📊 Event data:', { id: event.id, name: event.name });
    console.log('👤 User role:', userRole);
    console.log('🎯 onAction type:', typeof onAction);
    
    if (typeof onAction === 'function') {
      onAction(action, event);
      console.log('✅ onAction called successfully');
    } else {
      console.error('❌ onAction is not a function:', onAction);
    }
  };

  console.log('🎨 EventCard render - userRole:', userRole, 'event:', event.name);
  console.log('🔍 Student check:', (userRole === 'student' || userRole === 'STUDENT'));

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Event Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {event.name}
          </h3>
          <span className={getStatusBadge()}>
            {eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1)}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {event.sport}
          </span>
          {getLevelBadge()}
          {event.eventFee > 0 && (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
              ₹{event.eventFee}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          by {getCreatorName()}
        </p>
      </div>

      {/* Event Details */}
      <div className="p-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M8 7h8m-8 0L6 9m2-2l2 2M16 7l2 2m-2-2l-2 2" />
            </svg>
            {new Date(event.startDate).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const query = event.latitude && event.longitude 
                  ? `${event.latitude},${event.longitude}`
                  : encodeURIComponent(`${event.venue}, ${event.city}, ${event.state || ''}`);
                const url = event.latitude && event.longitude
                  ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${query}`;
                window.open(url, '_blank');
              }}
              className="text-left hover:text-blue-600 hover:underline transition-colors"
              title="Open in Google Maps"
            >
              {event.venue}, {event.city}
            </button>
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            {isStudent ? (
              <span>
                Registration: {event?.maxParticipants && (event.currentParticipants || 0) >= event.maxParticipants ? 'Full' : 'Open'}
              </span>
            ) : (
              <span>
                {event.currentParticipants || 0} / {event.maxParticipants} participants
              </span>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Category preview (public list) */}
        {event.categoriesAvailable && event.categoriesAvailable.trim() && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              {parseCategoryPreview(event.categoriesAvailable).map((c) => (
                <span key={c} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-100">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {/* Student Actions */}
          {isStudent && (
            <>
              <button
                onClick={(e) => {
                  console.log('🖱️ View Details button clicked!');
                  e.preventDefault();
                  e.stopPropagation();
                  handleAction('view');
                }}
                type="button"
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                style={{ minWidth: '100px' }}
              >
                View Details
              </button>
              
              {/* Registration/Unregistration buttons */}
              {event.isRegistered ? (
                // Show unregister button if user is registered
                <button
                  onClick={() => handleAction('unregister')}
                  disabled={!canUnregister()}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    canUnregister() 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                  title={!canUnregister() ? 'Cannot unregister after event has started' : 'Unregister from this event'}
                >
                  {canUnregister() ? 'Unregister' : 'Registered'}
                </button>
              ) : (
                // Show register button if user is not registered and registration is open
                isRegistrationOpen() && (
                  <button
                    onClick={() => handleAction(hasCategories ? 'view' : 'register')}
                    disabled={event.currentParticipants >= event.maxParticipants}
                    className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={hasCategories ? 'Select your category on the event details page to register' : 'Register for this event'}
                  >
                    {event.currentParticipants >= event.maxParticipants
                      ? 'Full'
                      : 'Register'}
                  </button>
                )
              )}
            </>
          )}

          {/* Creator Actions */}
          {(userRole === 'coach' || userRole === 'COACH' || userRole === 'institute' || userRole === 'INSTITUTE' || userRole === 'club' || userRole === 'CLUB') && isOwner() && (
            <>
              <button
                onClick={() => handleAction('view')}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Manage
              </button>
              
              <button
                onClick={() => handleAction('edit')}
                className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
              
              {eventStatus === 'completed' && (
                <button
                  onClick={() => handleAction('uploadResults')}
                  className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                >
                  Upload Results
                </button>
              )}
            </>
          )}

          {/* Admin Actions */}
          {(userRole === 'admin' || userRole === 'ADMIN') && (
            <>
              <button
                onClick={() => handleAction('view')}
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                View
              </button>
              
              <button
                onClick={() => handleAction('edit')}
                className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors"
              >
                Edit
              </button>
            </>
          )}

          {/* Event Incharge Actions */}
          {(userRole === 'EVENT_INCHARGE' || userRole === 'event_incharge') && (
            <>
              <button
                onClick={() => handleAction('view')}
                className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors"
                style={{ minWidth: '120px' }}
              >
                Open Event
              </button>

              {event?.permissionOverride?.studentManagement ? (
                <button
                  onClick={() => handleAction('participants')}
                  className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm hover:bg-emerald-700 transition-colors"
                  title="View registered students"
                >
                  Students
                </button>
              ) : null}

              {event?.permissionOverride?.resultUpload ? (
                <button
                  onClick={() => handleAction('results')}
                  className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors"
                  title="Upload/manage results"
                >
                  Results
                </button>
              ) : null}

              {event?.permissionOverride?.certificateManagement ? (
                <button
                  onClick={() => handleAction('certificates')}
                  className="bg-amber-600 text-white px-3 py-2 rounded-md text-sm hover:bg-amber-700 transition-colors"
                  title="Issue certificates"
                >
                  Certificates
                </button>
              ) : null}
            </>
          )}

          {/* Results Download for all (if available) */}
          {event.hasResults && (
            <button
              onClick={() => handleAction('downloadResults')}
              className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors"
            >
              Download Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;