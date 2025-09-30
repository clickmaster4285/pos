import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function StandOutSection() {
  return (
    <div className="bg-gradient-to-r from-pink-100 to-pink-100 py-16">
      <div className="container mx-auto text-left">
        {/* Grid for the feature boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col bg-blue-100 p-6 border border-gray-200 rounded-xl">
            <Image
              src={landingPageImages.Vector1}
              alt="Designed for social"
              // width={50}
              // height={50}
            />
            <h3 className="mt-4 text-lg font-medium text-gray-700">Designed for Social</h3>
            <p className="text-gray-500">One link to showcase your content, products, and offers optimized for Instagram, TikTok, and more.</p>
          </div>
          <div className="flex flex-col bg-blue-100 p-6 border border-gray-200 rounded-xl">
            <Image
              src={landingPageImages.Vector2}
              alt="Fully customizable"
              // width={50}
              // height={50}
            />
            <h3 className="mt-4 text-lg font-medium text-gray-700">Fully Customizable</h3>
            <p className="text-gray-500">One link to showcase your content, products, and offers optimized for Instagram, TikTok, and more.</p>
          </div>
          <div className="flex flex-col bg-blue-100 p-6 border border-gray-200 rounded-xl">
            <Image
              src={landingPageImages.Vector3}
              alt="More than links"
              // width={50}
              // height={50}
            />
            <h3 className="mt-4 text-lg font-medium text-gray-700">More Than Links</h3>
            <p className="text-gray-500">One link to showcase your content, products, and offers optimized for Instagram, TikTok, and more.</p>
          </div>
          <div className="flex flex-col bg-blue-100 p-6 border border-gray-200 rounded-xl">
            <Image
              src={landingPageImages.Vector4}
              alt="Built for growth"
              // width={50}
              // height={50}
            />
            <h3 className="mt-4 text-lg font-medium text-gray-700">Built for Growth</h3>
            <p className="text-gray-500">One link to showcase your content, products, and offers optimized for Instagram, TikTok, and more.</p>
          </div>
        </div>

        {/* Main title and description */}
        <div className="max-w-screen-xl mx-auto text-center py-16">
          <h2 className="text-4xl font-semibold text-gray-800 mb-6 text-center">
            Stand Out On Social
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Ditch the generic links and design a page that feels like an extension
            of you and your brand. Choose from flexible layouts, customize colors,
            and add media to make it uniquely yours.
          </p>
        </div>

        {/* Image section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-6 sm:px-12 lg:px-40">
          <div className="flex transition-transform duration-300 hover:scale-110">
            <Image
              src={landingPageImages.StandOutSocial1}
              alt="Image 1"
              // width={200}
              // height={200}
              className="rounded-lg"
            />
          </div>
          <div className="flex transition-transform duration-300 hover:scale-110">
            <Image
              src={landingPageImages.StandOutSocial2}
              alt="Image 2"
              // width={200}
              // height={200}
              className="rounded-lg"
            />
          </div>
          <div className="flex transition-transform duration-300 hover:scale-110">
            <Image
              src={landingPageImages.StandOutSocial3}
              alt="Image 3"
              // width={200}
              // height={200}
              className="rounded-lg"
            />
          </div>
          <div className="flex transition-transform duration-300 hover:scale-110">
            <Image
              src={landingPageImages.StandOutSocial4}
              alt="Image 4"
              // width={250}
              // height={200}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}