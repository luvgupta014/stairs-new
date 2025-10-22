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
    
    return now < regDeadline && now < startDate;
  };

  // Check if user owns this event
  const isOwner = () => {
    if (userRole === 'coach') return event.coachId === userId;
    if (userRole === 'institute') return event.instituteId === userId;
    if (userRole === 'club') return event.clubId === userId;
    return false;
  };

  // Get creator name
  const getCreatorName = () => {
    if (event.coach) return event.coach.name;
    if (event.institute) return event.institute.name;
    if (event.club) return event.club.name;
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
    onAction(action, event);
  };

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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.venue}, {event.city}
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            {event.currentParticipants || 0} / {event.maxParticipants} participants
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
            {event.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {/* Student Actions */}
          {userRole === 'student' && (
            <>
              <button
                onClick={() => handleAction('view')}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
              
              {isRegistrationOpen() && (
                event.isRegistered ? (
                  <button
                    onClick={() => handleAction('unregister')}
                    className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                  >
                    Unregister
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('register')}
                    disabled={event.currentParticipants >= event.maxParticipants}
                    className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {event.currentParticipants >= event.maxParticipants ? 'Full' : 'Register'}
                  </button>
                )
              )}
            </>
          )}

          {/* Creator Actions */}
          {(userRole === 'coach' || userRole === 'institute' || userRole === 'club') && isOwner() && (
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
          {userRole === 'admin' && (
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