'use client';

import React from 'react';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

type IconVariant = 'outline' | 'solid';

interface IconProps {
  name: string;
  variant?: IconVariant;
  size?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: unknown;
}

function Icon({
  name,
  variant = 'outline',
  size = 24,
  className = '',
  onClick,
  disabled = false,
  ...props
}: IconProps) {
  // Handle Brand Icons
  if (name === 'Facebook') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.667 4.53-4.667 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  if (name === 'Instagram') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.136.048 1.754.239 2.165.4c.545.211.933.463 1.341.871.408.408.66.796.871 1.341.161.411.352 1.03.4 2.165.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.048 1.136-.239 1.754-.4 2.165-.211.545-.463.933-.871 1.341-.408.408-.796.66-1.341.871-.411.161-1.03.352-2.165.4-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.136-.048-1.754-.239-2.165-.4a2.53 2.53 0 0 1-1.341-.871c-.408-.408-.66-.796-.871-1.341-.161-.411-.352-1.03-.4-2.165-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.048-1.136.239-1.754.4-2.165.211-.545.463-.933.871-1.341.408-.408.796-.66 1.341-.871.411-.161 1.03-.352 2.165-.4 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    );
  }

  if (name === 'Line') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <path d="M12 2C6.48 2 2 5.53 2 9.87c0 3.89 3.58 7.14 8.41 7.76.33.07.77.22.88.49.1.25.07.65.03.9l-.14 1.12c-.05.4-.25 1.57 1.26.86 1.51-.71 8.13-4.78 11.08-8.23 1.96-2.27 2.1-3.88 1.7-5.32-.23-4.41-4.71-7.45-11.22-7.45zm-1.01 12.03h-1.99c-.14 0-.25-.11-.25-.25v-7.56c0-.14.11-.25.25-.25h.5c.14 0 .25.11.25.25v6.81h1.24c.14 0 .25.11.25.25v.5c0 .14-.11.25-.25.25z" />
      </svg>
    );
  }


  const iconSet = variant === 'solid' ? HeroIconsSolid : HeroIcons;
  const IconComponent = iconSet[name as keyof typeof iconSet] as React.ComponentType<{
    width?: number;
    height?: number;
    className?: string;
    onClick?: React.MouseEventHandler;
  }>;

  if (!IconComponent) {
    return (
      <QuestionMarkCircleIcon
        width={size}
        height={size}
        className={`text-gray-400 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        onClick={disabled ? undefined : onClick}
        {...props}
      />
    );
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className={`${disabled ? 'opacity-50 cursor-not-allowed' : onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  );
}

export default Icon;
