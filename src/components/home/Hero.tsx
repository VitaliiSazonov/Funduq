"use client";

import { motion } from "framer-motion";
import { Search, Calendar, Users, MapPin } from "lucide-react";

export default function HomeHero() {
  return (
    <section className="relative h-[95vh] min-h-[700px] flex items-center justify-center bg-charcoal overflow-hidden px-4">
      {/* Background Visual Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-transparent to-charcoal/80" />
      
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <span className="inline-block px-5 py-2 rounded-full border border-white/20 text-white/70 text-xs font-bold uppercase tracking-[0.3em] backdrop-blur-md mb-8">
            Premium Short-Term Rentals
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="text-5xl md:text-8xl font-black text-white mb-6 display-font tracking-tight"
        >
          Discover Elegant <br /> <span className="text-gold">Stay Experiences</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="text-gray-300 md:text-xl max-w-2xl mb-12 font-medium"
        >
          Curated villas, penthouses, and desert resorts across the UAE for the discerning traveler.
        </motion.p>

        {/* Search Bar Skeleton */}
        <motion.div 
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
           className="w-full max-w-4xl glass rounded-[2rem] p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-4 luxury-shadow border border-white/20"
        >
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
             <button className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/40 rounded-2xl transition-all group outline-none">
                <MapPin className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                   <span className="text-[10px] font-black uppercase text-muted tracking-widest">Location</span>
                   <span className="text-charcoal font-bold text-sm">Where are you going?</span>
                </div>
             </button>
             <button className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/40 rounded-2xl transition-all group outline-none">
                <Calendar className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                   <span className="text-[10px] font-black uppercase text-muted tracking-widest">Dates</span>
                   <span className="text-charcoal font-bold text-sm">Check-in / Check-out</span>
                </div>
             </button>
             <button className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/40 rounded-2xl transition-all group outline-none">
                <Users className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start">
                   <span className="text-[10px] font-black uppercase text-muted tracking-widest">Guests</span>
                   <span className="text-charcoal font-bold text-sm">Add guests</span>
                </div>
             </button>
          </div>
          <button className="w-full md:w-auto bg-gold text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-gold-dark transition-all duration-300 luxury-shadow">
             <Search className="w-5 h-5" />
             <span className="md:inline">Search</span>
          </button>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40"
      >
         <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Scroll</span>
         <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
      </motion.div>
    </section>
  );
}
