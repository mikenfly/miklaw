import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <h3 className="empty-state__title">{title}</h3>
        {subtitle && <p className="empty-state__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
