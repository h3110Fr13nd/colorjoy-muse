import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bookmark, ImageIcon, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useSavedPalettes } from '@/hooks/useSavedPalettes';
import HeaderActions from './HeaderActions';
import type { HeaderAction } from './headerActions';

interface NavTabProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavTab: React.FC<NavTabProps> = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    end
    aria-label={label}
    className={({ isActive }) =>
      cn(
        'relative inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors lg:px-2.5 [&_svg]:h-4 [&_svg]:w-4',
        isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      )
    }
  >
    {icon}
    <span className="hidden lg:inline">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        aria-label={`${badge} saved`}
        className={cn(
          'rounded-full font-semibold',
          // Compact: small counter bubble on the icon's corner so it takes no horizontal space.
          'absolute -right-1 -top-1 h-4 min-w-4 bg-blue-600 px-1 text-center text-[10px] leading-4 text-white',
          // Full: inline pill next to the label.
          'lg:static lg:h-auto lg:min-w-0 lg:bg-blue-100 lg:px-1.5 lg:text-xs lg:leading-5 lg:text-blue-700'
        )}
      >
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

interface AppHeaderProps {
  /** Page-specific actions; collapse into a "More" menu on small screens. */
  actions?: HeaderAction[];
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ actions, className }) => {
  const { palettes } = useSavedPalettes();

  return (
    <header
      className={cn(
        'z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white/90 px-3 backdrop-blur-sm md:h-16 md:gap-4 md:px-4',
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-6">
        <Link to={ROUTES.generator} aria-label="ColorJoy home" className="shrink-0 text-xl font-bold logo-text text-blue-600 md:text-2xl">
          {/* Compact mark on very narrow phones so the header stays on one row. */}
          <span
            aria-hidden
            className="block h-7 w-7 rounded-lg bg-[conic-gradient(from_45deg,#2563eb,#db2777,#f59e0b,#10b981,#2563eb)] shadow-inner min-[380px]:hidden"
          />
          <span className="max-[379px]:hidden">ColorJoy</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          <NavTab to={ROUTES.generator} icon={<Palette />} label="Generator" />
          <NavTab to={ROUTES.image} icon={<ImageIcon />} label="From Image" />
          <NavTab to={ROUTES.saved} icon={<Bookmark />} label="Saved Palettes" badge={palettes.length} />
        </nav>
      </div>

      {actions && actions.length > 0 && (
        <div className="flex shrink-0 items-center">
          <HeaderActions actions={actions} />
        </div>
      )}
    </header>
  );
};

export default AppHeader;
