const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  options = [], // For select inputs
  error = '',
  className = '',
  ...props 
}) => {
  const baseInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const errorClasses = error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "";
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`${baseInputClasses} ${errorClasses}`}
          {...props}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`${baseInputClasses} ${errorClasses}`}
          {...props}
        />
      ) : type === 'checkbox' ? (
        <div className="flex items-center">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={value}
            onChange={onChange}
            required={required}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...props}
          />
          {label && (
            <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          )}
        </div>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`${baseInputClasses} ${errorClasses}`}
          {...props}
        />
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormInput;