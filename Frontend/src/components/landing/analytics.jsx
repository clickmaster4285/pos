'use client';

import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';
  
export default function Home() {
  return (
    <div className="bg-pink-100 py-16">
      <div className="container mx-auto px-6">
        <div className="space-y-12">
          {/* Multimedia Section */}
          <div className="flex flex-col md:flex-row items-center from-pink-100 to-white-300 p-6 border border-gray-200 rounded-xl shadow-lg">
            <div className="md:w-1/2 transition-transform duration-300 hover:scale-110">
              <Image
                src={landingPageImages.Analytics1}
                alt="Multimedia"
                width={700}
                height={300}
                className="rounded-xl"
              />
            </div>
            <div className="md:w-1/2 md:pl-8 mt-4 md:mt-0">
              <h3 className="text-2xl font-semibold text-blue-800">More Than Just Links</h3>
              <p className="text-gray-600 mt-2">Go beyond the basics with embedded videos, feature your latest posts, showcase products, and more...</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-transform duration-300 hover:scale-110">
                Get Started Now
              </button>
            </div>
          </div>

          {/* All Channels Section */}
          <div className="flex flex-col md:flex-row items-center bg-pink p-6 border border-gray-200 rounded-xl shadow-lg">
            <div className="md:w-1/2 md:pl-8 mt-4 md:mt-0">
              <h3 className="text-2xl font-semibold text-blue-800">Works Wherever You Share</h3>
              <p className="text-gray-600 mt-2">Whether you're on Instagram, TikTok, or Twitter, Start Page gives you a flexible way to guide your audience...</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-transform duration-300 hover:scale-110">
                Get Started Now
              </button>
            </div>
            <div className="md:w-1/2 transition-transform duration-300 hover:scale-110">
              <Image
                src={landingPageImages.Analytics2}
                alt="All Channels"
                width={700}
                height={300}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Analytics Section */}
          <div className="flex flex-col md:flex-row items-center bg-pink p-6 border border-gray-200 rounded-xl shadow-lg">
            <div className="md:w-1/2 transition-transform duration-300 hover:scale-110">
              <Image
                src={landingPageImages.Analytics3}
                alt="Analytics"
                width={400}
                height={300}
                className="rounded-xl"
              />
            </div>
            <div className="md:w-1/2 md:pl-8 mt-4 md:mt-0">
              <h3 className="text-2xl font-semibold text-blue-800">Insights To Help You Grow</h3>
              <p className="text-gray-600 mt-2">See which links get the most clicks, track engagement, and refine your link strategy all from one simple dashboard...</p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-transform duration-300 hover:scale-110">
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}