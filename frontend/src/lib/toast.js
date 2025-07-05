import { toast as baseToast } from "../hooks/use-toast"

export const toast = {
  success: (message, options = {}) => {
    return baseToast({
      title: "Success",
      description: message,
      variant: "success",
      duration: options.autoClose || 3000,
      ...options,
    })
  },

  error: (message, options = {}) => {
    return baseToast({
      title: "Error",
      description: message,
      variant: "destructive",
      duration: options.autoClose || 5000,
      ...options,
    })
  },

  info: (message, options = {}) => {
    return baseToast({
      title: "Info",
      description: message,
      variant: "default",
      duration: options.autoClose || 4000,
      ...options,
    })
  },

  warning: (message, options = {}) => {
    return baseToast({
      title: "Warning",
      description: message,
      variant: "default",
      duration: options.autoClose || 4000,
      ...options,
    })
  },

  // Direct access to the base toast function
  ...baseToast,
}

export default toast
