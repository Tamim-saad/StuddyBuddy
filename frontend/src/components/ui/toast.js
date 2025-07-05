import { toast as reactToast } from "react-toastify";

// Toast utility function with shadcn-style API
export const toast = {
  success: (message, options = {}) => {
    return reactToast.success(message, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        backgroundColor: "#10b981",
        color: "white",
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
        fontWeight: "500",
        ...options.style,
      },
      ...options,
    });
  },

  error: (message, options = {}) => {
    return reactToast.error(message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        backgroundColor: "#ef4444",
        color: "white",
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
        fontWeight: "500",
        ...options.style,
      },
      ...options,
    });
  },

  info: (message, options = {}) => {
    return reactToast.info(message, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        backgroundColor: "#3b82f6",
        color: "white",
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
        fontWeight: "500",
        ...options.style,
      },
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return reactToast.warning(message, {
      position: "bottom-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        backgroundColor: "#f59e0b",
        color: "white",
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
        fontWeight: "500",
        ...options.style,
      },
      ...options,
    });
  },

  // Additional utility methods
  dismiss: (toastId) => {
    return reactToast.dismiss(toastId);
  },

  loading: (message, options = {}) => {
    return reactToast.info(message, {
      position: "bottom-right",
      autoClose: false,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      style: {
        backgroundColor: "#6b7280",
        color: "white",
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
        fontWeight: "500",
        ...options.style,
      },
      ...options,
    });
  },
};

export default toast;
