
import styles from "./Card.module.css";
export default function Card({ icon, value, label, borderColor }) {
  return (
    <div
      className={styles.card}
      style={{ borderTopColor: borderColor }}
    >
      <div className={styles.topRow}>
        <div className={styles.iconBadge} style={{ color: borderColor, backgroundColor: `${borderColor}14` }}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className={styles.value}>{value}</h3>
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}
