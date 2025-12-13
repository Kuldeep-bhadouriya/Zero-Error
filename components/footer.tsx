import Link from "next/link";
import { SocialIcon } from "react-social-icons";

export default function Footer() {
  return (
    <footer
      className="relative z-50 bg-transparent py-16 border-t border-zinc-800"
      aria-label="Footer"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Social Media Icons */}
        <div
          className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12"
          aria-label="Social Media Links"
        >
          {/* Instagram */}
          <div className="group">
            <div className="bg-black p-2 rounded-full transition-colors duration-300 group-hover:bg-[#E1306C]">
              <SocialIcon
                url="https://www.instagram.com/zero_error_esports?igsh=NHMyYXNtZWZ4cXg="
                target="_blank"
                className="transition-transform duration-300 hover:scale-125"
                aria-label="Instagram"
                bgColor="transparent"
                style={{ height: 60, width: 60 }}
              />
            </div>
          </div>

          {/* Twitter */}
          <div className="group">
            <div className="bg-black p-2 rounded-full transition-colors duration-300 group-hover:bg-[#42444b]">
              <SocialIcon
                url="https://x.com/ZeroErrorES"
                target="_blank"
                className="transition-transform duration-300 hover:scale-125"
                aria-label="Twitter"
                bgColor="transparent"
                style={{ height: 60, width: 60 }}
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="group">
            <div className="bg-black p-2 rounded-full transition-colors duration-300 group-hover:bg-[#0077B5]">
              <SocialIcon
                url="https://www.linkedin.com/company/zero-error-esports"
                target="_blank"
                className="transition-transform duration-300 hover:scale-125"
                aria-label="LinkedIn"
                bgColor="transparent"
                style={{ height: 60, width: 60 }}
              />
            </div>
          </div>

          {/* Discord */}
          <div className="group">
            <div className="bg-black p-2 rounded-full transition-colors duration-300 group-hover:bg-[#5865F2]">
              <SocialIcon
                url="https://discord.gg/zJfncArJMT"
                target="_blank"
                className="transition-transform duration-300 hover:scale-125"
                aria-label="Discord"
                bgColor="transparent"
                style={{ height: 60, width: 60 }}
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div className="group">
            <div className="bg-black p-2 rounded-full transition-colors duration-300 group-hover:bg-[#25D366]">
              <SocialIcon
                url="https://chat.whatsapp.com/JizYMt07dikCGwgqwlMGH2?mode=ac_t"
                target="_blank"
                className="transition-transform duration-300 hover:scale-125"
                aria-label="WhatsApp"
                bgColor="transparent"
                style={{ height: 60, width: 60 }}
              />
            </div>
          </div>

          {/* YouTube */}
          <div className="group">
            <div className="bg-black p-2 rounded-full transition-colors duration-300 group-hover:bg-[#FF0000]">
              <SocialIcon
                url="https://www.youtube.com/@ZeroErrorEsports/videos"
                target="_blank"
                className="transition-transform duration-300 hover:scale-125"
                aria-label="YouTube"
                bgColor="transparent"
                style={{ height: 60, width: 60 }}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <p className="text-zinc-400 mb-2 text-xs sm:text-sm uppercase tracking-wider">
            Contact Us
          </p>
          <a
            href="mailto:zeroerroresports@gmail.com"
            className="text-base sm:text-xl md:text-2xl font-bold hover:text-red-600 transition-colors break-all"
          >
            zeroerroresports@gmail.com
          </a>
        </div>

        {/* Copyright */}
      </div>
    </footer>
  );
}
