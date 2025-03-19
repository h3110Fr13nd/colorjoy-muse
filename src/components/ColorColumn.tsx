
import React, { useState } from 'react';
import { Lock, Unlock, Copy, Info, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  isLightColor, 
  copyToClipboard, 
  adjustBrightness, 
  getColorName 
} from '@/utils/colorUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface ColorColumnProps {
  color: string;
  locked: boolean;
  onLockToggle: () => void;
  onColorChange: (newColor: string) => void;
  className?: string;
}

const ColorColumn: React.FC<ColorColumnProps> = ({ 
  color, 
  locked, 
  onLockToggle, 
  onColorChange,
  className = ''
}) => {
  const [showAdjustments, setShowAdjustments] = useState(false);
  const { toast } = useToast();
  const isLight = isLightColor(color);
  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const hoverColor = isLight ? 'hover:bg-black/5' : 'hover:bg-white/10';
  const colorName = getColorName(color);

  const handleCopyToClipboard = async () => {
    try {
      await copyToClipboard(color);
      toast({
        title: "Copied!",
        description: `${color} has been copied to your clipboard.`,
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const adjustColor = (adjustment: number) => {
    const newColor = adjustBrightness(color, adjustment);
    onColorChange(newColor);
  };

  return (
    <div 
      className={`color-column h-full flex flex-col items-center justify-between py-10 ${className}`}
      style={{ backgroundColor: color }}
    >
      <div className="color-actions flex flex-col items-center gap-3 w-full px-4">
        <div className="flex items-center justify-between w-full max-w-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={onLockToggle} 
                  className={`p-3 rounded-full transition-all ${hoverColor} ${textColor}`}
                >
                  {locked ? <Lock size={20} /> : <Unlock size={20} />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{locked ? "Unlock color" : "Lock color"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleCopyToClipboard} 
                  className={`p-3 rounded-full transition-all ${hoverColor} ${textColor}`}
                >
                  <Copy size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy hex code</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger 
                    className={`p-3 rounded-full transition-all ${hoverColor} ${textColor}`}
                  >
                    <MoreVertical size={20} />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More options</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => setShowAdjustments(!showAdjustments)}>
                  Adjust shade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyToClipboard}>
                  Copy HEX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard(`rgb(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)})`)}>
                  Copy RGB
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowAdjustments(!showAdjustments)} 
                  className={`p-3 rounded-full transition-all ${hoverColor} ${textColor}`}
                >
                  {showAdjustments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showAdjustments ? "Hide adjustments" : "Show adjustments"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showAdjustments && (
          <div className={`${textColor} bg-white bg-opacity-10 backdrop-blur-sm p-3 rounded-lg animate-fade-in`}>
            <div className="flex gap-2">
              <button 
                onClick={() => adjustColor(-10)} 
                className={`px-2 py-1 rounded ${hoverColor}`}
              >
                Darker
              </button>
              <button 
                onClick={() => adjustColor(10)} 
                className={`px-2 py-1 rounded ${hoverColor}`}
              >
                Lighter
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <h2 className={`hex-display text-2xl font-bold mb-2 ${textColor}`}>
          {color.toUpperCase()}
        </h2>
        <p className={`color-name text-sm opacity-80 ${textColor}`}>
          {colorName}
        </p>
      </div>
    </div>
  );
};

export default ColorColumn;
