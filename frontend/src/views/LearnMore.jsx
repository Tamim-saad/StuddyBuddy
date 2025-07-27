import React from "react";
import { useNavigate } from "react-router-dom";
import studybuddy from "../assets/images/studybuddy.png";

const LearnMore = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const features = [
    {
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Smart PDF Processing",
      description: "Upload any PDF document and watch as our AI extracts, analyzes, and organizes the content for optimal learning.",
      benefits: [
        "Automatic text extraction and formatting",
        "Intelligent content organization",
        "Cross-reference capabilities",
        "Searchable document library"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "AI-Powered Learning",
      description: "Experience personalized learning with our advanced AI that adapts to your study patterns and preferences.",
      benefits: [
        "Personalized study recommendations",
        "Adaptive difficulty levels",
        "Learning pattern analysis",
        "Smart content suggestions"
      ]
    },
    {
      icon: (
        <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: "Interactive Study Tools",
      description: "Engage with your study materials through interactive annotations, notes, and collaborative features.",
      benefits: [
        "Real-time collaboration",
        "Interactive annotations",
        "Smart note-taking",
        "Progress tracking"
      ]
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Upload",
      description: "Create your account and upload your study materials. Our platform supports PDF files and automatically processes them for you.",
      icon: (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      number: "02",
      title: "AI Processing",
      description: "Our advanced AI analyzes your documents, extracts key information, and then indexes it for personalized study materials.",
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Study & Learn",
      description: "Access your processed materials, take quizzes, create notes, and track your progress with our comprehensive study tools.",
      icon: (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
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
            <a href="/services" className="hover:text-green-500">Services</a>
            <a href="/learn-more" className="text-green-500 font-semibold">Learn More</a>
        
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
            Learn More About <span className="text-green-500">StuddyBuddy</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our AI-powered platform revolutionizes the way you study, 
            making learning more effective, engaging, and personalized than ever before.
          </p>
        </div>

        {/* Features Deep Dive */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why Choose StuddyBuddy?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{step.number}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Key Benefits</h2>
          <div className="grid md:grid-cols-1 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">For Students</h3>
              <ul className="space-y-3">
                <li className="flex items-start justify-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Save time with automated content processing</span>
                </li>
                <li className="flex items-start justify-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Improve retention with personalized study materials</span>
                </li>
                <li className="flex items-start justify-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Track progress and identify areas for improvement</span>
                </li>
                <li className="flex items-start justify-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">Access study materials anytime, anywhere</span>
                </li>
              </ul>
            </div>
          </div>
        </div>



        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who are already using StuddyBuddy to improve their academic performance.
          </p>
          <button
            className="bg-green-500 text-white text-xl px-8 py-4 rounded-md hover:bg-green-400 transition-colors"
            onClick={handleGetStarted}
          >
            Start Learning Today
          </button>
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

export default LearnMore; 