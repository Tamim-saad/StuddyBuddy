import React from "react";
import { useNavigate } from "react-router-dom";
import studybuddy from "../assets/images/studybuddy.png";

const AboutUs = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div className="bg-green-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={studybuddy} alt="StuddyBuddy" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-800">StuddyBuddy</span>
          </div>
          <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
            <a href="/" className="hover:text-green-500">Home</a>
            <a href="/about" className="text-green-500 font-semibold">About Us</a>
            <a href="/services" className="hover:text-green-500">Services</a>
            
          </nav>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-400"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            About <span className="text-green-500">StuddyBuddy</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering students with AI-driven study tools to make learning more effective, 
            engaging, and personalized than ever before.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
            <p className="text-gray-600">
              To revolutionize the way students learn by providing intelligent, 
              personalized study tools that adapt to individual learning styles 
              and help achieve academic excellence.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Vision</h3>
            <p className="text-gray-600">
              To become the leading AI-powered study platform that makes quality 
              education accessible to every student, fostering a generation of 
              confident, independent learners.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Story</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-600 mb-4">
              We are undergraduate students of the 
              Department of Computer Science and Engineering at BUET.
               As part of our CSE408 Software Development course, 
               we are working on a project named StuddyBuddy. 
               The goal of this project is to create an interactive and 
               intelligent study companion that helps students organize 
               their learning process more effectively. 
               Through this project, we aim to enhance our practical
               software engineering skills while building something impactful for students.
              </p>
          
            </div>
            <div className="text-center">
              <img 
                src={studybuddy} 
                alt="StuddyBuddy Story" 
                className="w-64 h-64 mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We constantly push the boundaries of what's possible in educational technology.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Student-First</h3>
              <p className="text-gray-600">
                Every feature we build is designed with students' needs and success in mind.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from code quality to user experience.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 justify-items-center max-w-4xl">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Tamim Hasan Saad</h3>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Habiba Rafique Saima </h3>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Sadia Afrin Sithi</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-center py-6 shadow-inner">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} StuddyBuddy. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AboutUs; 