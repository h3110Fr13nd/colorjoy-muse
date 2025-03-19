
import React, { useState, useEffect, useCallback } from 'react';
import ColorColumn from './ColorColumn';
import { 
  generatePalette, 
  generateRandomColor, 
  parsePaletteFromURL,
  exportPaletteAsURL
} from '@/utils/colorUtils';
import { toast } from '@/components/ui/use-toast';
import { 
  RefreshCw, 
  Save, 
  Copy, 
  Share2, 
  Download, 
  Upload, 
  ExternalLink, 
  EyeOff, 
  Eye,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

const ColorPalette: React.FC = () => {
  const [colors, setColors] = useState<string[]>(Array(5).fill('#FFFFFF'));
  const [lockedColors, setLockedColors] = useState<boolean[]>(Array(5).fill(false));
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Generate colors on first load or parse from URL
  useEffect(() => {
    const urlPalette = parsePaletteFromURL();
    if (urlPalette && urlPalette.length > 0) {
      setColors(urlPalette);
      setLockedColors(Array(urlPalette.length).fill(false));
    } else {
      generateNewPalette();
    }
    
    // Add spacebar event listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        generateNewPalette();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const generateNewPalette = useCallback(() => {
    setIsGenerating(true);
    
    // Animation timing
    setTimeout(() => {
      setColors(prevColors => {
        return prevColors.map((color, index) => {
          if (lockedColors[index]) {
            return color;
          }
          return generateRandomColor();
        });
      });
      setIsGenerating(false);
    }, 300);
  }, [lockedColors]);
  
  const toggleLock = (index: number) => {
    setLockedColors(prev => {
      const newLocks = [...prev];
      newLocks[index] = !newLocks[index];
      return newLocks;
    });
  };
  
  const updateColor = (index: number, newColor: string) => {
    setColors(prev => {
      const newColors = [...prev];
      newColors[index] = newColor;
      return newColors;
    });
  };

  const addColor = (index: number) => {
    const newColor = generateRandomColor();
    setColors(prev => {
      const newColors = [...prev];
      newColors.splice(index, 0, newColor);
      return newColors;
    });
    setLockedColors(prev => {
      const newLocks = [...prev];
      newLocks.splice(index, 0, false);
      return newLocks;
    });
    
    toast({
      title: "Color Added",
      description: "A new color has been added to your palette.",
      duration: 2000,
    });
  };

  const removeColor = (index: number) => {
    if (colors.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "Your palette must have at least one color.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    
    setColors(prev => {
      const newColors = [...prev];
      newColors.splice(index, 1);
      return newColors;
    });
    setLockedColors(prev => {
      const newLocks = [...prev];
      newLocks.splice(index, 1);
      return newLocks;
    });
    
    toast({
      title: "Color Removed",
      description: "The color has been removed from your palette.",
      duration: 2000,
    });
  };
  
  const exportPalette = () => {
    // Convert colors to CSS variables
    const cssVariables = colors.map((color, index) => {
      return `--color-${index + 1}: ${color};`;
    }).join('\n');
    
    // Create and trigger download
    const element = document.createElement('a');
    const file = new Blob([cssVariables], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'color-palette.css';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Palette Exported",
      description: "Your color palette has been downloaded as CSS variables.",
      duration: 3000,
    });
  };
  
  const sharePalette = () => {
    const url = exportPaletteAsURL(colors);
    navigator.clipboard.writeText(url);
    
    toast({
      title: "Link Copied!",
      description: "Sharable link copied to clipboard.",
      duration: 3000,
    });
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-white backdrop-blur-sm bg-opacity-90 z-10">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold logo-text text-blue-600">ColorJoy</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={generateNewPalette}
                  className={isGenerating ? 'animate-spin' : ''}
                >
                  <RefreshCw size={18} className="mr-1" />
                  Generate
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate new palette (or press Spacebar)</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={sharePalette}
                >
                  <Share2 size={18} className="mr-1" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy sharable link</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={exportPalette}
                >
                  <Download size={18} className="mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export palette as CSS</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowInstructions(!showInstructions)}
                >
                  {showInstructions ? <EyeOff size={18} className="mr-1" /> : <Eye size={18} className="mr-1" />}
                  {showInstructions ? "Hide Tips" : "Show Tips"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showInstructions ? "Hide instructions" : "Show instructions"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="default" size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700">
            Save Palette
          </Button>
        </div>
      </header>
      
      {/* Instructions */}
      {showInstructions && (
        <div className="flex justify-center p-3 bg-gray-50 text-gray-500 border-b border-gray-100 animate-slide-down text-sm">
          <p className="spacebar-hint">
            Press the <kbd className="px-2 py-1 bg-white rounded shadow-sm mx-1">spacebar</kbd> to generate new color palettes!
          </p>
        </div>
      )}
      
      {/* Color Columns with Add Color Buttons */}
      <div className="flex-grow relative">
        {/* Add color button at the beginning */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white shadow-md border border-gray-200" 
                onClick={() => addColor(0)}
              >
                <Plus size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add color at beginning</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Color columns */}
        <div 
          className={`flex w-full h-full ${isGenerating ? 'opacity-80' : 'opacity-100'}`}
          style={{ 
            transition: 'all 0.3s ease'
          }}
        >
          {colors.map((color, index) => (
            <div 
              key={`column-${index}`} 
              className="flex-1 h-full"
              style={{ minWidth: 0 }} // Prevent flex items from overflowing
            >
              <ColorColumn
                key={`${index}-${color}`}
                color={color}
                locked={lockedColors[index]}
                onLockToggle={() => toggleLock(index)}
                onColorChange={(newColor) => updateColor(index, newColor)}
                onRemove={() => removeColor(index)}
                className={isGenerating ? 'animate-color-change' : ''}
              />
            </div>
          ))}
        </div>

        {/* Add color buttons between columns */}
        {colors.map((_, index) => (
          <div 
            key={`add-btn-${index}`} 
            className="absolute z-10" 
            style={{ 
              left: `${((index + 1) / colors.length) * 100}%`, 
              top: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-white shadow-md border border-gray-200" 
                  onClick={() => addColor(index + 1)}
                >
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add color</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;
