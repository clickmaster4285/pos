'use client';
import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function Home() {
  return (
    <div className="min-h-screen bg-pink-100 flex flex-col items-center justify-center py-10">
      <div className="bg-pink p-10 rounded-lg shadow-md max-w-screen-xl mx-auto text-center">
        <h1 className="text-4xl font-semibold text-center text-orange-500 mb-8 transform">
          The only link in bio you'll ever need
        </h1>
        <p className="text-lg text-gray-700 font-semibold mb-6 transform">
          Turn your social bio into a powerful, personalized hub that connects your audience to everything you create.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mb-6 transform transition-transform duration-300 hover:scale-110">
          Get Started Now
        </button>
        <div className="flex justify-center items-center mt-6 transform transition-transform duration-300 hover:scale-110">
          <Image
            src={landingPageImages.HomepageBigHero}
            alt="Social Dashboard"
            // layout="intrinsic"
            // width={700}
            // height={500}
            className="rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* Logos Section */}
      <div className="bg-pink-100 py-8">
        <div className="flex flex-wrap justify-center gap-10">
          <div className="flex items-center space-x-2">
            <Image src={landingPageImages.GooglePlus} alt="Google+" 
            // width={180} height={100}
             className="transform transition-transform duration-300 hover:scale-90" />
          </div>
          <div className="flex items-center space-x-2">
            <Image src={landingPageImages.Microsoft} alt="Microsoft" 
            // width={180} height={100}
             className="transform transition-transform duration-300 hover:scale-90" />
          </div>
          <div className="flex items-center space-x-2">
            <Image src={landingPageImages.MetaLB} alt="Meta" 
            // width={180} height={100}
             className="transform transition-transform duration-300 hover:scale-90" />
          </div>
          <div className="flex items-center space-x-2">
            <Image src={landingPageImages.LinkedIn} alt="LinkedIn" 
            // width={180} height={100}
             className="transform transition-transform duration-300 hover:scale-90" />
          </div>
          <div className="flex items-center space-x-2">
            <Image src={landingPageImages.Instagram} alt="Instagram" 
            // width={180} height={100}
             className="transform transition-transform duration-300 hover:scale-90" />
          </div>
        </div>
      </div>
    </div>
  );
}