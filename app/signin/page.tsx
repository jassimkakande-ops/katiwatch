import { Suspense } from 'react';
import SignInContent from './SignInContent';

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md bg-[#23272f] rounded-2xl shadow-xl px-6 py-6 flex flex-col items-center border border-gray-800">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <img
              src="/logo.jpeg"
              alt="Katiwatch Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain rounded"
              style={{ margin: '0 auto' }}
            />
          </div>
          <p className="text-gray-400 text-sm">Watch your favorites</p>
        </div>
        <span className="inline-flex items-center justify-center font-bold tracking-widest text-2xl text-[#E50914]">
  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
</span>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

