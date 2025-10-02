'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Toggle the menu visibility on mobile
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center ">
          <h6 >AutoMotive Industery</h6>
        </div>

        {/* Menu Items (Desktop) */}
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-gray-800 hover:text-blue-600">Features</a>
          <a href="#testimonials" className="text-gray-800 hover:text-blue-600">Testimonials</a>
          <a href="#pricing" className="text-gray-800 hover:text-blue-600">Pricing</a>
          <a href="#blog" className="text-gray-800 hover:text-blue-600">Blog</a>
          <a href="#how-it-works" className="text-gray-800 hover:text-blue-600">How it Works</a>
          <a href="#faq" className="text-gray-800 hover:text-blue-600">FAQs</a>
        </div>

        {/* Hamburger Button (Mobile) */}
        <div className="md:hidden flex items-center">
          <button onClick={toggleMenu} className="text-gray-800 hover:text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Button Section */}
        <div className="flex space-x-4">
          <Link href="/login">
            <button className="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500">
              Log in
            </button>
          </Link>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Get Started Now
          </button>
        </div>
      </div>

      {/* Mobile Menu (Visible when hamburger is clicked) */}
      {isMenuOpen && (
        <div className="md:hidden flex flex-col space-y-4 px-6 py-4">
          <a href="#features" className="text-gray-800 hover:text-blue-600">Features</a>
          <a href="#testimonials" className="text-gray-800 hover:text-blue-600">Testimonials</a>
          <a href="#pricing" className="text-gray-800 hover:text-blue-600">Pricing</a>
          <a href="#blog" className="text-gray-800 hover:text-blue-600">Blog</a>
          <a href="#how-it-works" className="text-gray-800 hover:text-blue-600">How it Works</a>
          <a href="#faq" className="text-gray-800 hover:text-blue-600">FAQs</a>

          <div className="flex space-x-4 mt-4">
            <button className="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500">
              Log in
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Get Started Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;