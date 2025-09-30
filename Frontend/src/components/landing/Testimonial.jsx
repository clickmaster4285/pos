'use client';

import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function Testimonials() {
  return (
    <div className="bg-gradient-to-b from-pink-100 to-white-100 py-12 px-6 sm:px-12 lg:px-16">
      <h1 className="text-3xl font-semibold text-center text-blue-600 mb-8">
        Testimonials
      </h1>
      <p className="text-center text-lg text-gray-600 mb-12">
        I saw a significant increase in engagement and sales thanks to their tailored marketing approach. Highly recommended
      </p>

      {/* First row */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center mb-12 sm:px-16">
        <div className="bg-orange-200 p-6 rounded-xl shadow-lg sm:w-1/2 w-full">
          <p className="text-xl font-bold text-blue-700">GREAT MARKETING AGENCY!</p>
          <p className="text-gray-700 my-4">
            This agency helped me grow my business beyond expectations. Their strategies are innovative, and their team is incredibly professional!.Their marketing tactics are game-changing. Thanks to them, my business is thriving and I'm able to reach more customers.The team at this agency is a true partner in success. Their attention to detail and dedication sets them apart.I never thought marketing could be this easy! The results speak for themselves, and I couldn't be happier.
          </p>
          <p className="text-sm font-semibold">Jane Doe</p>
          <div className="flex mt-2">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
        </div>

        <div className="w-full sm:w-1/2 flex items-center justify-center mt-6 sm:mt-0">
          <Image
            src={landingPageImages.TestimonialGirl}
            alt="Testimonial Girl"
            width={500}
            height={500}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Second row */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center sm:px-16">
        <div className="w-full sm:w-1/2 flex items-center justify-center mt-6 sm:mt-0">
          <Image
            src={landingPageImages.TestimonialBoy}
            alt="Testimonial Boy"
            width={500}
            height={500}
            className="rounded-xl"
          />
        </div>
        <div className="bg-pink-200 p-6 rounded-xl shadow-lg sm:w-1/2 w-full mt-6 sm:mt-0">
          <p className="text-xl font-bold text-blue-700">GREAT MARKETING AGENCY!</p>
          <p className="text-gray-700 my-4">
            Exceptional service! The team understood my needs and delivered outstanding results. My go-to marketing agency.The strategies they implemented truly brought my brand to life online. I'm more confident in my marketing efforts.Professional, reliable, and effective. I have already recommended them to several of my friends in the industry.
          </p>
          <p className="text-sm font-semibold">William Henry</p>
          <div className="flex mt-2">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
}