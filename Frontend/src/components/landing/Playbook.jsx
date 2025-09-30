import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function LinkInBioPlaybook() {
  return (
    <div className="bg-white py-16 px-6">
      <div className="max-w-screen-xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-12">
          The Ultimate Link In Bio Playbook
        </h1>
        <p className="text-lg text-gray-700 mb-12">
          Smart tips and strategies to turn your link in bio into a traffic-driving powerhouse.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 bg-blue">
          {/* Card 1 */}
          <div className="rounded-xl shadow-lg overflow-hidden bg-blue-100">
            <Image
              src={landingPageImages.Playbook1}
              alt="TikTok Bio"
              width={500}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                How to Add a Link to Your TikTok Bio (+ What to Do If You Can’t)
              </h2>
              <p className="text-gray-600 my-4">
                All the requirements you need to meet to add a link to your bio on TikTok, how to add your link, plus solutions if the link in bio feature isn’t working for you.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                View
              </button>
            </div>
          </div>
          {/* Card 2 */}
          <div className="rounded-xl shadow-lg overflow-hidden bg-blue-100">
            <Image
              src={landingPageImages.Playbook1}
              alt="TikTok Bio"
              width={500}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                How to Add a Link to Your TikTok Bio (+ What to Do If You Can’t)
              </h2>
              <p className="text-gray-600 my-4">
                All the requirements you need to meet to add a link to your bio on TikTok, how to add your link, plus solutions if the link in bio feature isn’t working for you.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                View
              </button>
            </div>
          </div>
          {/* Card 3 */}
          <div className="rounded-xl shadow-lg overflow-hidden bg-blue-100">
            <Image
              src={landingPageImages.Playbook2}
              alt="Instagram Bio"
              width={500}
              height={300}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                How These Small Businesses Are Using Their Instagram Link in Bio
              </h2>
              <p className="text-gray-600 my-4">
                Your link in bio can do more than you think. See how real small businesses are using it to drive traffic, boost engagement, and grow.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}