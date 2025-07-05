import React from "react";
import login_signupPicture from "../../assets/images/studybuddy.png";
import { useNavigate } from "react-router-dom";

const AppBar = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/login");
  };

  return (
    <div className="bg-green-50 min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
            <a href="#home" className="hover:text-green-500">
              Home
            </a>
            <a href="#about" className="hover:text-green-500">
              About Us
            </a>
            <a href="#services" className="hover:text-green-500">
              Services
            </a>
            <a href="#contact" className="hover:text-green-500">
              Contact Us
            </a>
          </nav>
          <button
            className="mt-6 bg-blue-500 text-white text-lg px-6 py-2.5 rounded-md hover:bg-blue-400"
            onClick={handleClick}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center container mx-auto px-6 py-20">
        {/* Left Content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h1
            className="
              text-6xl md:text-7xl
              font-bold
              leading-tight
              bg-gradient-to-r
              from-green-500
              to-blue-500
              text-transparent
              bg-clip-text
              font-serif
            "
          >
            Studdy Buddy <br />
          </h1>
          <p className="text-gray-800 text-lg mt-4">
            Your personal study Companion, Anytime, Anywhere
          </p>
          <button className="mt-6 bg-blue-500 text-white text-lg px-7 py-2.5 rounded-md hover:bg-blue-400">
          Learn More
          </button>
        </div>

        {/* Right Illustration */}
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src={login_signupPicture}
            alt="Landing Illustration"
            className="w-full"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-center py-4 shadow-inner">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Studdy Buddy. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AppBar;
