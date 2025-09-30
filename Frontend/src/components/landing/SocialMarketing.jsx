'use client';
import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function BlueBackgroundWithImage() {
  return (
    <div className="relative bg-blue-800 py-10 flex justify-center items-center">
      {/* Blue Background */}
      <div className="absolute inset-0 bg-blue-600 z-0"></div>

      {/* Social Marketing Font Image (On top of the other image) */}
      <div className="absolute z-20 top-1/6 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center transition-transform duration-300 hover:scale-110">
        <Image
          src={landingPageImages.SocialMarketingFont}
          alt="Social Marketing Font"
          // width={1200}
          // height={900}
          // objectFit="contain"
        />
      </div>

      {/* Content with Image and Text side by side */}
      <div className="relative z-10 space-x-8">
        {/* Marketinggirl Image */}
        <div className="relative z-10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <Image
            src={landingPageImages.MarketingGirl}
            alt="Image above Blue Background"
            // width={500}
            // height={600}
            // objectFit="cover"
          />
        </div>
      </div>
      {/* Text and Button on the Right */}
      <div className="text-white text-left absolute z-40 top-9/12 left-9/12">
        <p className="text-lg mb-4">
          One link in bio, endless possibilities. Whether you're on Instagram, TikTok, or Twitter, Start Page gives you a flexible, on-brand way to guide your audience to all of your content.
        </p>
        <button className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 transition-transform duration-300 hover:scale-110">
          Get Started Now
        </button>
      </div>
    </div>
  );
}