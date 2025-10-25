import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = ({ 
  to, 
  label = 'Back', 
  className = '', 
  variant = 'default',
  onClick,
  ...props 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back in history
    }
  };

  const baseClasses = 'inline-flex items-center space-x-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    default: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md focus:ring-gray-500',
    button: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 focus:ring-gray-500',
    link: 'text-blue-600 hover:text-blue-800 focus:ring-blue-500',
    minimal: 'text-gray-500 hover:text-gray-700 focus:ring-gray-500',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg focus:ring-blue-500'
  };

  const variantClasses = variants[variant] || variants.default;

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <FaArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;