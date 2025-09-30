'use client';

import Image from 'next/image';
import landingPageImages from '@/public/images/landingPageImages';

export default function FAQSection() {
  return (
    <div className="bg-blue-900 py-16 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <div className="w-1/2 text-white">
        <h2 className="text-4xl font-semibold mb-8">FAQ</h2>
        <div className="mb-4">
          <div className="cursor-pointer text-orange-400 text-lg mb-2">
            Ut Neque Augue Interdum Ad Integer Tempus Convallis?
          </div>
          <p className="text-white text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
        <div className="mb-4">
          <div className="cursor-pointer text-orange-400 text-lg mb-2">
            Dictum Feugiat Tristique Nam Commodo?
          </div>
          <p className="text-white text-sm">
            Aenean euismod elementum nisi quis eleifend quam adipiscing. Nunc
            eget lorem dolor sed viverra ipsum nunc aliquet.
          </p>
        </div>
        <div className="mb-4">
          <div className="cursor-pointer text-orange-400 text-lg mb-2">
            Scelerisque Metus Sem Nostra Pulvinar Sagittis?
          </div>
          <p className="text-white text-sm">
            Felis imperdiet proin fermentum leo vel orci. Dui vivamus arcu felis
            bibendum ut tristique et egestas.
          </p>
        </div>
        <div className="mb-4">
          <div className="cursor-pointer text-orange-400 text-lg mb-2">
            Consectetur Scelerisque Lacus Gravidia Proin Dolor Sem?
          </div>
          <p className="text-white text-sm">
            Sed risus ultricies tristique nulla aliquet enim tortor. Integer
            enim neque volutpat ac tincidunt vitae.
          </p>
        </div>
      </div>
      <div className="w-1/2 flex justify-center items-center">
        <div className="rounded-full bg-yellow-500 p-8">
          <Image
            src={landingPageImages.Faq}
            alt="FAQ Image"
            width={500}
            height={600}
            className="rounded-full"
          />
        </div>
      </div>
    </div>
  );
}