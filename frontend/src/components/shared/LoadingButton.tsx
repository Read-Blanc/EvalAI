import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'accent' | 'hero';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      icon: Icon,
      disabled,
      className,
      variant,
      size,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={className}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {Icon && <Icon className="h-4 w-4 mr-2" />}
            {children}
          </>
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

// Usage:
// <LoadingButton 
//   isLoading={isSaving} 
//   loadingText="Saving..." 
//   icon={Save}
//   onClick={handleSave}
// >
//   Save Changes
// </LoadingButton>