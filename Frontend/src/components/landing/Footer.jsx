// In Footer.jsx - Improved contrast and readability
"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-background border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              SmartPOS
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Revolutionizing business operations with intelligent POS solutions. Trusted by thousands of businesses worldwide.
            </p>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, index) => (
                <motion.button
                  key={index}
                  className="p-2 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-sm"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-2">
              {['Features', 'Industries', 'Pricing', 'About Us', 'Contact'].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(' ', '-')}`}
                  className="block text-muted-foreground hover:text-primary transition-colors duration-300 hover:translate-x-2 transform"
                >
                  {link}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <div className="space-y-3">
              {[
                { icon: Phone, text: '+1 (555) 123-4567' },
                { icon: Mail, text: 'hello@smartpos.com' },
                { icon: MapPin, text: '123 Business Ave, Suite 100, New York, NY 10001' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-muted-foreground">
                  <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold">Stay Updated</h4>
            <p className="text-muted-foreground text-sm">
              Subscribe to get updates on new features and industry insights.
            </p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white border-gray-300 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:border-blue-400 transition-colors duration-300 shadow-sm"
              />
              <Button className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 transition-all duration-300 text-white shadow-md">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground text-sm">
            © 2024 SmartPOS. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm text-muted-foreground">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a
                key={item}
                href="#"
                className="hover:text-primary transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          <motion.button
            onClick={scrollToTop}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    </footer>
  );
};