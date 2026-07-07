"use client";

import { Suspense } from 'react';
import PlayerContent from './PlayerContent';

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <span className="inline-flex items-center justify-center font-bold tracking-widest text-2xl text-[#E50914]">
  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
</span>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <PlayerContent />
    </Suspense>
  );
}

