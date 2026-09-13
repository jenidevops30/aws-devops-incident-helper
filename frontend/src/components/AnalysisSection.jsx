export default function AnalysisSection({ title, icon, items, type = 'bullet', emptyMessage = 'No specific items found for this section.' }) {
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <div className="card analysis-section-card">
      <h3>
        {icon && <span aria-hidden="true">{icon}</span>}
        <span>{title}</span>
      </h3>

      {!hasItems ? (
        <p className="empty-list-msg">{emptyMessage}</p>
      ) : type === 'summary' ? (
        <p className="analysis-summary-text">{items}</p>
      ) : type === 'numbered' ? (
        <ol className="analysis-list">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="analysis-list">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
