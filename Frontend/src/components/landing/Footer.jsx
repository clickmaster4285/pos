import Image from 'next/image';
import Link from 'next/link';
import landingPageImages from '@/public/images/landingPageImages';

export default function Footer() {
  return (
    <footer className="bg-[#f7f3f1] py-12 text-gray-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
        <div className="flex flex-col sm:flex-row justify-between space-y-6 sm:space-y-0">
          {/* Left section */}
          <div className="flex flex-col space-y-4 sm:w-1/3">
            <Image
              src={landingPageImages.FooterLogo}
              alt="Logo"
              width={128}
              height={32}
              className="w-32 h-auto"
            />
            <p className="text-sm text-gray-600">
              Alpha AutoMotive – Top Digital Marketing Agency in Pakistan
              provides a complete range of digital marketing services to drive
              your business growth.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-orange-500 hover:text-gray-700">
                Facebook
              </Link>
              <Link href="#" className="text-orange-500 hover:text-gray-700">
                Instagram
              </Link>
              <Link href="#" className="text-orange-500 hover:text-gray-700">
                Pinterest
              </Link>
              <Link href="#" className="text-orange-500 hover:text-gray-700">
                YouTube
              </Link>
            </div>
          </div>

          {/* Centered section */}
          <div className="flex flex-col sm:flex-row space-x-8 mt-6 sm:mt-0 sm:w-2/3">
            <div className="flex flex-col space-y-4">
              <h4 className="font-semibold text-gray-700">Quick Links</h4>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                SEO Services
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                PPC Marketing
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Social Media Marketing
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Web Development
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Email Marketing
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Graphic Designing
              </Link>
            </div>

            <div className="flex flex-col space-y-4 mt-6 sm:mt-0">
              <h4 className="font-semibold text-gray-700">Useful Links</h4>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Free Consultation
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Customer Support
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Jobs
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                FAQs
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Terms and Conditions
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-orange-500"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Right section */}
          <div className="flex flex-col space-y-4 mt-6 sm:mt-0 sm:w-1/3">
            <h4 className="font-semibold text-gray-700">Contact</h4>
            <p className="text-sm text-gray-600">
              Main PWD Rd, PWD Housing Society Sector A, PWD Society, Islamabad,
              Punjab 45700, Pakistan
            </p>
            <p className="text-sm text-gray-600">Consultation: 0333-1116842</p>
            <p className="text-sm text-gray-600">
              Customer Support: 0332-5394285
            </p>
            <p className="text-sm text-gray-600">
              Email:{' '}
              <a
                href="mailto:marketing@clickmasters.pk"
                className="text-orange-500 hover:text-gray-700"
              >
                marketing@clickmasters.pk
              </a>
            </p>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-12 border-t pt-4 text-center text-sm text-gray-500">
          <p>
            &#169; 2025 All Rights Reserved: Alpha AutoMotive Digital Marketing
            Agency
          </p>
        </div>
      </div>
    </footer>
  );
}