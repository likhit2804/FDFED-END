
/**
 * EmptyState – centered empty slot with icon, title, and optional sub-text
 *
 * Props:
 *   icon    {ReactNode} – large illustrative icon
 *   title   {string}
 *   sub     {string}    – optional secondary text
 *   action  {ReactNode} – optional call-to-action button
 *   style   {object}    – optional inline style overrides
 *   className {string}  – optional extra class names
 */
const EmptyState = ({ icon, title = 'Nothing here yet', sub, action, style = {}, className = "" }) => (
    <div
      className={`ue-empty ${className}`.trim()}
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        ...style,
      }}
    >
        {icon && <div className="ue-empty__icon" style={{ display: 'flex', justifyContent: 'center' }}>{icon}</div>}
        <p className="ue-empty__title" style={{ textAlign: 'center' }}>{title}</p>
        {sub && <p className="ue-empty__sub" style={{ textAlign: 'center' }}>{sub}</p>}
        {action && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>{action}</div>}
    </div>
);
export default EmptyState;

