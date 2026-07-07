interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span className="inline-flex items-center justify-center font-bold tracking-widest text-4xl text-[#E50914]">
  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
</span>
      <p className={`text-[#E50914] mt-2 font-medium ${textSizeClasses[size]}`}>{text}</p>
    </div>
  );
}

// Full page loading spinner
export function FullPageSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading spinner (for sections)
export function InlineSpinner({ text = 'Loading...', className = 'py-12' }: { text?: string; className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

