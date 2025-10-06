const StudentCard = ({ student, onConnect, isConnected }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-600 font-semibold text-lg">
            {student.name?.charAt(0) || 'S'}
          </span>
        </div>

        {/* Student Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {student.name || 'Student Name'}
          </h3>
          <p className="text-sm text-gray-600">
            {student.sport || 'Sport'} • {student.level || 'Level'}
          </p>
          <p className="text-sm text-gray-500">
            {student.location || 'Location'}
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
              onClick={() => onConnect(student.id)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {student.achievements?.map((achievement, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
            >
              {achievement}
            </span>
          )) || (
            <span className="text-sm text-gray-500">No achievements listed</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCard;