import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

const Blog = () => {
  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <h2 className="text-center text-3xl font-semibold text-blue-600 mb-12">Blog</h2>
      <p className="text-center text-lg text-gray-600 mb-12">
        This blog discusses the importance of creating engaging presentations and offers tips on how to craft visually compelling slides.
      </p>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Blog Post 1 */}
        <div className="shadow-lg rounded-lg overflow-hidden bg-blue-100">
          <Image
            src={landingPageImages.Blog1}
            alt="Design Review"
            width={600}
            height={400}
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Review presentations</h3>
            <p className="text-gray-600 mb-4">
              How do you create compelling presentations that wow your colleagues and impress your managers?
            </p>
            <div className="flex items-center">
              <Image
                src={landingPageImages.BlogAvatar1}
                alt="Olivia Rhye"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Olivia Rhye</span>
            </div>
          </div>
          <a href="#" className="inline-block mt-4 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 text-center">
            Read More
          </a>
        </div>

        {/* Blog Post 2 */}
        <div className="shadow-lg rounded-lg overflow-hidden bg-blue-100">
          <Image
            src={landingPageImages.Blog2}
            alt="Migrating to Linear"
            width={600}
            height={400}
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Migrating to Linear 101</h3>
            <p className="text-gray-600 mb-4">
              Linear helps streamline software projects, sprints, tasks, and bug tracking. Here’s how to get started.
            </p>
            <div className="flex items-center">
              <Image
                src={landingPageImages.BlogAvatar2}
                alt="Phoenix Baker"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Phoenix Baker</span>
            </div>
          </div>
          <a href="#" className="inline-block mt-4 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 text-center">
            Read More
          </a>
        </div>

        {/* Blog Post 3 */}
        <div className="shadow-lg rounded-lg overflow-hidden bg-blue-100">
          <Image
            src={landingPageImages.Blog3}
            alt="Building your API Stack"
            width={600}
            height={400}
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Building your API Stack</h3>
            <p className="text-gray-600 mb-4">
              The rise of RESTful APIs has been met by a rise in tools for creating, testing, and managing them.
            </p>
            <div className="flex items-center">
              <Image
                src={landingPageImages.BlogAvatar3}
                alt="Lana Steiner"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Lana Steiner</span>
            </div>
          </div>
          <a href="#" className="inline-block mt-4 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 text-center">
            Read More
          </a>
        </div>
      </div>
    </div>
  );
};

export default Blog;