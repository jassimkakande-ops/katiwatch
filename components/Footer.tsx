"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a0a0a] text-white pt-14 pb-20 lg:pb-8 border-t border-gray-800/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand + Links row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center mb-5">
              <Image src="/logo.jpeg" alt="Katiwatch Logo" width={40} height={40} className="w-10 h-10 object-contain mr-3 rounded" />
              <span className="text-2xl font-black text-[#E50914] tracking-wider uppercase">Katiwatch</span>
            </Link>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              we Are Entertainment!
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <a href="mailto:katiwachug@gmail.com" className="flex items-center gap-3 hover:text-[#E50914] transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" /> katiwachug@gmail.com
              </a>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+2560765773436" className="hover:text-[#E50914] transition-colors">0765 773 436</a>
                  <a href="tel:+2560705908699" className="hover:text-[#E50914] transition-colors">0705 908 699</a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-5 text-gray-500">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative border-t border-gray-800/60 pt-6">
          <p className="text-center text-gray-600 text-xs mt-2">
            © {currentYear} katiwatch — We are Entertainment. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
