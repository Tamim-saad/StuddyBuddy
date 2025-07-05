import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Toaster component that provides toast functionality
export const Toaster = ({
  position = "bottom-right",
  autoClose = 3000,
  hideProgressBar = false,
  newestOnTop = true,
  closeOnClick = true,
  rtl = false,
  pauseOnFocusLoss = true,
  draggable = true,
  pauseOnHover = true,
  theme = "light",
  ...props
}) => {
  return (
    <ToastContainer
      position={position}
      autoClose={autoClose}
      hideProgressBar={hideProgressBar}
      newestOnTop={newestOnTop}
      closeOnClick={closeOnClick}
      rtl={rtl}
      pauseOnFocusLoss={pauseOnFocusLoss}
      draggable={draggable}
      pauseOnHover={pauseOnHover}
      theme={theme}
      style={{
        zIndex: 99999,
        ...props.style,
      }}
      toastStyle={{
        borderRadius: "8px",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
        fontWeight: "500",
        ...props.toastStyle,
      }}
      {...props}
    />
  );
};

export default Toaster;
