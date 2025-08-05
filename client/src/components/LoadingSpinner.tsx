interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ className = "", size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin border-4 border-primary border-t-transparent rounded-full ${sizeClasses[size]}`}></div>
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function FullPageLoader({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}