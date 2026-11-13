import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Floating button that smoothly scrolls the window back to the top once the user has scrolled down. */
const ScrollToTopButton: React.FC<{ threshold?: number }> = ({ threshold = 400 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <Button
      size="icon"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-6 right-6 z-30 h-11 w-11 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700 transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp />
    </Button>
  );
};

export default ScrollToTopButton;
