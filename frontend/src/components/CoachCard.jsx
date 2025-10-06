const CoachCard = ({ coach, onConnect, isConnected }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-semibold text-lg">
            {coach.name?.charAt(0) || 'C'}
          </span>
        </div>

        {/* Coach Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {coach.name || 'Coach Name'}
          </h3>
          <p className="text-sm text-gray-600">
            {coach.specialization || 'Specialization'}
          </p>
          <p className="text-sm text-gray-500">
            {coach.experience || '0'} years experience
          </p>
        </div>

        {/* Action Button */}
        <div>
          {isConnected ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          ) : (
            <button
              onClick={() => onConnect(coach.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Coach Details */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Location:</span>
            <p className="font-medium">{coach.location || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-gray-500">Rating:</span>
            <div className="flex items-center">
              <span className="font-medium">{coach.rating || '0'}</span>
              <span className="text-yellow-400 ml-1">★</span>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-3">
          <span className="text-gray-500 text-sm">Certifications:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {coach.certifications?.map((cert, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {cert}
              </span>
            )) || (
              <span className="text-sm text-gray-500">No certifications listed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachCard;