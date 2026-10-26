import React from 'react';
import { PewaLogo } from './PewaLogo';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = (props) => {
  return <PewaLogo {...props} />;
};
