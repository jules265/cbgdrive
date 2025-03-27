import  { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
}

export default function Card({ children, className = '', title, subtitle, footer }: CardProps) {
  return (
    <div className={`bg-card rounded-lg shadow-md ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-muted">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && <div className="px-6 py-3 bg-muted border-t border-muted">{footer}</div>}
    </div>
  );
}
 