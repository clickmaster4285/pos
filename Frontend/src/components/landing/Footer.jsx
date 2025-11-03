"use client";

import { ShoppingCart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-card/50 py-12 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Roadmap'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Resources', links: ['Documentation', 'Help Center', 'Community', 'Partners'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
          ].map((col, i) => (
            <div key={i}>
              <h3 className="font-semibold mb-4">{col.title}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span className="font-semibold">SmartPOS</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 SmartPOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};