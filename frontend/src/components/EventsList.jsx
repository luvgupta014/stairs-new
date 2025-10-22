import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import Spinner from './Spinner';

/**
 * EventsList Component
 * Displays a list of events with filtering and pagination
 * Reusable across different user types and contexts
 */
const EventsList = ({
  events = [],
  loading = false,
  error = null,
  userRole = 'student',
  userId = null,
  onEventAction = () => {},
  showFilters = true,
  showPagination = true,
  itemsPerPage = 9,
  emptyMessage = 'No events found',
  title = 'Events'
}) => {
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    status: '',
    dateRange: ''
  });

  // Filter events based on current filters
  useEffect(() => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm) ||
        event.sport.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        event.city.toLowerCase().includes(searchTerm)
      );
    }

    // Sport filter
    if (filters.sport) {
      filtered = filtered.filter(event => event.sport === filters.sport);
    }

    // Status filter
    if (filters.status) {
      const now = new Date();
      switch (filters.status) {
        case 'upcoming':
          filtered = filtered.filter(event => new Date(event.startDate) > now);
          break;
        case 'ongoing':
          filtered = filtered.filter(event => 
            new Date(event.startDate) <= now && new Date(event.endDate) >= now
          );
          break;
        case 'completed':
          filtered = filtered.filter(event => new Date(event.endDate) < now);
          break;
        case 'registration-open':
          filtered = filtered.filter(event => {
            const regDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : new Date(event.startDate);
            return regDeadline > now && new Date(event.startDate) > now;
          });
          break;
        default:
          break;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate >= now && eventDate <= weekFromNow;
          });
          break;
        case 'month':
          const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate >= now && eventDate <= monthFromNow;
          });
          break;
        default:
          break;
      }
    }

    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [events, filters]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      sport: '',
      status: '',
      dateRange: ''
    });
  };

  // Get unique sports from events
  const availableSports = [...new Set(events.map(event => event.sport))].sort();

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of list
    document.getElementById('events-list-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle event action and pass to parent
  const handleEventAction = (action, event) => {
    onEventAction(action, event);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Events</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div id="events-list-top" className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">{title}</h2>
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${filteredEvents.length} of ${events.length} events`}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search events..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sport Filter */}
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
                  Sport
                </label>
                <select
                  id="sport"
                  value={filters.sport}
                  onChange={(e) => handleFilterChange('sport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sports</option>
                  {availableSports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="registration-open">Registration Open</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  id="dateRange"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.search || filters.sport || filters.status || filters.dateRange) && (
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="large" />
        </div>
      ) : (
        <>
          {/* Events Grid */}
          {currentEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    userRole={userRole}
                    userId={userId}
                    onAction={handleEventAction}
                  />
                ))}
              </div>

              {/* Pagination */}
              {showPagination && totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and 2 pages around current
                    const showPage = page === 1 || page === totalPages || 
                      (page >= currentPage - 2 && page <= currentPage + 2);

                    if (!showPage) {
                      // Show ellipsis for gaps
                      if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 border rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M8 7h8m-8 0L6 9m2-2l2 2M16 7l2 2m-2-2l-2 2"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600">{emptyMessage}</p>
                {(filters.search || filters.sport || filters.status || filters.dateRange) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear filters to see all events
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsList;