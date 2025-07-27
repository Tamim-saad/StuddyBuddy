import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "../../lib/toast";

export const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://formspree.io/f/xdoqrren", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("✅ Message sent successfully! Thank you for your feedback. We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast.error("❌ Error sending message. Please try again later or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Contact StuddyBuddy
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We'd love to hear from you! Share your feedback, ask questions, or
            report any issues you're experiencing.
          </p>
        </div>

        {/* Contact Form */}
        <Card className="max-w-2xl mx-auto shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-center">
              Send us a message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us more about your feedback or question..."
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Contact Info */}
        <div className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-envelope text-primary text-lg md:text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">
                Email Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">
                We typically respond within 24 hours
              </p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-bug text-primary text-lg md:text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">
                Bug Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">
                Help us improve StuddyBuddy
              </p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-lightbulb text-primary text-lg md:text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">
                Feature Requests
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">
                Share your ideas with us
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};