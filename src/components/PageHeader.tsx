import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  overline?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  overline
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-subtle">
      <div className="space-y-1">
        {overline && (
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--primary-gold)]">
            {overline}
          </div>
        )}
        <h1 className="page-h1 text-[28px] text-primary">
          {title}
        </h1>
        <p className="text-sm text-secondary max-w-2xl">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

