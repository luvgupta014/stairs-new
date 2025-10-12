import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Spinner from "./Spinner";

const LoginLayout = ({
  role,
  title,
  subtitle,
  icon,
  color = "blue",
  registerPath,
  onSubmit,
  loading,
  error,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-500",
      hover: "hover:bg-blue-600",
      focus: "focus:ring-blue-500",
      text: "text-blue-600",
      border: "border-blue-500",
    },
    green: {
      bg: "bg-green-500",
      hover: "hover:bg-green-600",
      focus: "focus:ring-green-500",
      text: "text-green-600",
      border: "border-green-500",
    },
    purple: {
      bg: "bg-purple-500",
      hover: "hover:bg-purple-600",
      focus: "focus:ring-purple-500",
      text: "text-purple-600",
      border: "border-purple-500",
    },
    orange: {
      bg: "bg-orange-500",
      hover: "hover:bg-orange-600",
      focus: "focus:ring-orange-500",
      text: "text-orange-600",
      border: "border-orange-500",
    },
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home */}
        <div className="text-left">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${currentColor.bg} text-white text-2xl mb-4`}
            >
              {icon}
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 mb-8">{subtitle}</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${currentColor.focus} focus:border-transparent transition-colors`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${currentColor.focus} focus:border-transparent transition-colors`}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={`h-4 w-4 ${currentColor.text} focus:ring-2 ${currentColor.focus} border-gray-300 rounded`}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className={`${currentColor.text} hover:opacity-80 transition-opacity`}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${currentColor.bg} ${currentColor.hover} text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="white" />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to={registerPath}
                className={`${currentColor.text} hover:opacity-80 font-semibold transition-opacity`}
              >
                Register here
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 text-center mb-2">
                Demo Credentials (Development)
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="bg-white p-2 rounded border">
                  <p className="font-medium text-gray-700">
                    Email: demo@{role.toLowerCase()}.com
                  </p>
                  <p className="text-gray-600">Password: demo123456</p>
                  <p className="text-xs text-green-600 mt-1">
                    ✨ Click to auto-fill and login!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    email: `demo@${role.toLowerCase()}.com`,
                    password: "demo123456",
                  });
                }}
                className={`mt-2 w-full text-xs ${currentColor.text} hover:opacity-80 transition-opacity border ${currentColor.border} rounded px-2 py-1`}
              >
                Use Demo Credentials
              </button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © 2025 STAIRS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginLayout;
