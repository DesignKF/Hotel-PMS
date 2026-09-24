import React, { useState, useEffect } from 'react';

interface LogoProps {
  variant?: 'dark' | 'light' | 'auto'; // dark = white text, light = navy text, auto = responds to theme
  type?: 'full' | 'mark' | 'vertical'; // full horizontal logo, square emblem icon mark, or vertical stacked logo
  className?: string;
  showTagline?: boolean;
}

export const MoshiUrbanLogo: React.FC<LogoProps> = ({ 
  variant = 'auto', 
  type = 'full',
  className = 'h-9',
  showTagline = false 
}) => {
  const [imgError, setImgError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      return root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const checkDark = () => {
      const root = document.documentElement;
      setIsDarkMode(root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark');
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  const lightSrc = type === 'mark' 
    ? '/moshi_urban_mark.svg' 
    : type === 'vertical' 
      ? '/moshi-urban-logo-vertical.svg' 
      : '/moshi_urban_logo_horizontal.svg';
  const darkSrc = type === 'mark' 
    ? '/moshi_urban_mark_white.svg' 
    : type === 'vertical' 
      ? '/moshi-urban-logo-vertical-white.svg' 
      : '/moshi_urban_logo_horizontal_white.svg';

  // Determine which source to display
  const activeSrc = variant === 'dark' 
    ? darkSrc 
    : variant === 'light' 
      ? lightSrc 
      : (isDarkMode ? darkSrc : lightSrc);

  return (
    <div className="flex items-center gap-3">
      {!imgError ? (
        <img
          key={activeSrc}
          src={activeSrc}
          alt="Moshi Urban"
          className={`${className} w-auto object-contain transition-transform`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback authentic vector representation matching moshiurban.co.tz */
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary-gold)] text-[var(--primary-gold-text)] flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            MU
          </div>
          <div>
            <span className="font-bold tracking-wider text-base uppercase text-primary">
              Moshi Urban
            </span>
          </div>
        </div>
      )}

      {showTagline && (
        <div className="hidden lg:block border-l border-subtle pl-3">
          <p className="font-script text-base text-[var(--primary-gold)] leading-none -rotate-1 select-none">
            Your passport to budget bliss
          </p>
        </div>
      )}
    </div>
  );
};
