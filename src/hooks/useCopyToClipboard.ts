import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/colorUtils';

/** Copies text and reports the result with a toast. */
export const useCopyToClipboard = () => {
  const { toast } = useToast();

  return useCallback(
    async (text: string, successMessage = `${text} has been copied to your clipboard.`) => {
      try {
        await copyToClipboard(text);
        toast({ title: 'Copied!', description: successMessage, duration: 2000 });
        return true;
      } catch {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy to clipboard. Please try again.',
          variant: 'destructive',
          duration: 2000,
        });
        return false;
      }
    },
    [toast]
  );
};
