import React from "react";
import { useNavigate } from "react-router-dom";
import studybuddy from "../assets/images/studybuddy.png";

const Services = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const services = [
    {
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "PDF Annotation & Analysis",
      description: "Upload your study materials and get intelligent annotations, summaries, and key insights extracted automatically.",
      features: [
        "Smart text extraction from PDFs",
        "Automatic key point identification",
        "Interactive annotation tools",
        "Export annotated documents"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "AI-Powered Quiz Generation",
      description: "Transform your study materials into personalized quizzes with multiple choice and comprehensive questions.",
      features: [
        "Automatic quiz generation from content",
        "Multiple question types (MCQ, CQ)",
        "Difficulty level adjustment",
        "Performance tracking and analytics"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: "Smart Sticky Notes",
      description: "Create, organize, and manage your study notes with AI assistance for better retention and organization.",
      features: [
        "AI-generated note suggestions",
        "Smart categorization",
        "Search and filter capabilities",
        "Cloud synchronization"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Study Planner & Scheduler",
      description: "Plan your study sessions with intelligent scheduling, task management, and progress tracking.",
      features: [
        "Smart study scheduling",
        "Task prioritization",
        "Progress tracking",
        "Pomodoro timer integration"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Pomodoro Timer",
      description: "Stay focused and productive with our integrated Pomodoro timer for effective time management.",
      features: [
        "Customizable work/break intervals",
        "Session tracking",
        "Focus mode",
        "Productivity analytics"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Progress Analytics",
      description: "Track your learning progress with detailed analytics and insights to optimize your study habits.",
      features: [
        "Study time tracking",
        "Performance metrics",
        "Learning pattern analysis",
        "Personalized recommendations"
      ]
    }
  ];

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
            <a href="/about" className="hover:text-green-500">About Us</a>
            <a href="/services" className="text-green-500 font-semibold">Services</a>
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
            Our <span className="text-green-500">Services</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the comprehensive suite of AI-powered tools designed to transform 
            your learning experience and boost your academic performance.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="mb-6">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Upload & Process</h3>
              <p className="text-gray-600">
                Upload your study materials and let our AI process and analyze the content.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-500">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">AI Enhancement</h3>
              <p className="text-gray-600">
                Get intelligent annotations, quizzes, and study tools generated automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-500">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Study & Improve</h3>
              <p className="text-gray-600">
                Use our tools to study effectively and track your progress over time.
              </p>
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

export default Services; 