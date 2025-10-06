import Spinner from './Spinner';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg"
  };
  
  const disabledClasses = (disabled || loading) ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;