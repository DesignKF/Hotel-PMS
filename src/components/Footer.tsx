import React from 'react';
import { MoshiUrbanLogo } from './MoshiUrbanLogo';
import { ShieldCheck, Mail, Phone, ExternalLink, Globe } from 'lucide-react';
import { HOSTEL_CONFIG } from '../data/initialData';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-1 border-t border-subtle text-secondary text-xs py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-subtle">
          {/* Logo and Subtitle */}
          <div className="space-y-1.5">
            <MoshiUrbanLogo type="full" className="h-12 sm:h-14 w-auto" />
            <p className="text-xs text-tertiary">
              Moshi Town, Mount Kilimanjaro, Tanzania
            </p>
          </div>

          {/* Quick links & contact */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-secondary">
            <a 
              href={`tel:${HOSTEL_CONFIG.contactPhone}`} 
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-tertiary" />
              <span>{HOSTEL_CONFIG.contactPhone}</span>
            </a>

            <a 
              href={`mailto:${HOSTEL_CONFIG.contactEmail}`} 
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-tertiary" />
              <span>{HOSTEL_CONFIG.contactEmail}</span>
            </a>

            <a 
              href={HOSTEL_CONFIG.website} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1.5 hover:text-primary transition-colors text-primary underline font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>moshiurban.co.tz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-tertiary">
          <div>
            &copy; {new Date().getFullYear()} Moshi Urban Hostel. All rights reserved. Back-End Reservations &amp; Availability PMS.
          </div>
          <div className="flex items-center gap-2 text-[var(--status-success-text)] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Real-time availability synced with Google Calendar</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
