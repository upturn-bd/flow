"use client";

import { useState } from "react";
import { EnvelopeSimple, Phone, MapPin, PaperPlaneTilt, Question, ChatCircleDots, BookOpen } from "@phosphor-icons/react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission - replace with actual API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", company: "", subject: "", message: "" });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I get started with Flow?",
      answer: "Sign up for a free trial account, complete the onboarding wizard, and start adding your employees. Our setup guide will walk you through each step."
    },
    {
      question: "Can I import existing employee data?",
      answer: "Yes! Flow supports bulk import via CSV files. You can also migrate data from other HR systems with our import tools."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards (Visa, Mastercard, American Express), bank transfers, and bKash/Nagad for Bangladesh-based customers."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption, secure servers, and comply with data protection regulations. Your data is backed up daily."
    },
    {
      question: "Can I customize Flow for my organization?",
      answer: "Yes, Flow offers extensive customization options including custom fields, workflows, approval chains, and role-based access control."
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">How Can We Help?</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Have questions about Flow? We&apos;re here to help. Reach out to our team and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChatCircleDots className="w-6 h-6 text-blue-600" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Live Chat</h3>
              <p className="text-gray-600 text-sm mt-1">Chat with our support team in real-time during business hours.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Documentation</h3>
              <p className="text-gray-600 text-sm mt-1">Browse our comprehensive guides and tutorials.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Question className="w-6 h-6 text-purple-600" weight="fill" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">FAQs</h3>
              <p className="text-gray-600 text-sm mt-1">Find quick answers to common questions below.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Your Company Ltd."
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="sales">Sales & Pricing</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="partnership">Partnership Opportunities</option>
                  <option value="feedback">Product Feedback</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              {submitStatus === "success" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  Thank you for your message! We&apos;ll get back to you within 24 hours.
                </div>
              )}

              {submitStatus === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt className="w-5 h-5" weight="fill" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <EnvelopeSimple className="w-6 h-6 text-blue-600" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <a href="mailto:support@upturn.com.bd" className="text-blue-600 hover:underline">
                      support@upturn.com.bd
                    </a>
                    <p className="text-gray-500 text-sm mt-1">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Phone className="w-6 h-6 text-green-600" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <a href="tel:+8801XXXXXXXXX" className="text-blue-600 hover:underline">
                      +880 1XXX-XXXXXX
                    </a>
                    <p className="text-gray-500 text-sm mt-1">Sun - Thu, 9:00 AM - 6:00 PM (BST)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Office</h3>
                    <p className="text-gray-600">
                      154 Shantinagar, Flat - B6<br />
                      Paltan, Dhaka - 1217<br />
                      Bangladesh
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Business Hours</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Sunday - Thursday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Friday</span>
                  <span className="font-medium">Closed</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                * All times are in Bangladesh Standard Time (BST, UTC+6)
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white rounded-lg shadow-sm group"
                >
                  <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                    {faq.question}
                    <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Links to Legal Pages */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Looking for legal information?{" "}
            <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a>
            {" • "}
            <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
            {" • "}
            <a href="/cookie-policy" className="text-blue-600 hover:underline">Cookie Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
