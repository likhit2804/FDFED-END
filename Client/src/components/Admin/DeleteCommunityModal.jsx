import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './DeleteCommunityModal.module.css';

const DeleteCommunityModal = ({ isOpen, onClose, community, deletionCounts, onConfirm, isDeleting }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText !== community.name) {
      setError('Community name does not match');
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <AlertTriangle className={styles.warningIcon} size={32} />
          <h2>Delete Community</h2>
          <button className={styles.closeBtn} onClick={handleClose} disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.info}>
            <strong>{community.name}</strong>
            <span>{community.location}</span>
          </div>

          <div className={styles.warning}>
            <p><strong>Warning:</strong> This will permanently delete all related data:</p>
          </div>

          <div className={styles.counts}>
            {deletionCounts.residents > 0 && <div><span>Residents:</span> <strong>{deletionCounts.residents}</strong></div>}
            {deletionCounts.issues > 0 && <div><span>Issues:</span> <strong>{deletionCounts.issues}</strong></div>}
            {deletionCounts.workers > 0 && <div><span>Workers:</span> <strong>{deletionCounts.workers}</strong></div>}
            {deletionCounts.securities > 0 && <div><span>Security:</span> <strong>{deletionCounts.securities}</strong></div>}
            {deletionCounts.managers > 0 && <div><span>Managers:</span> <strong>{deletionCounts.managers}</strong></div>}
            {deletionCounts.commonSpaces > 0 && <div><span>Bookings:</span> <strong>{deletionCounts.commonSpaces}</strong></div>}
            {deletionCounts.payments > 0 && <div><span>Payments:</span> <strong>{deletionCounts.payments}</strong></div>}
          </div>

          <div className={styles.confirm}>
            <label>Type <code>{community.name}</code> to confirm:</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder="Community name"
              disabled={isDeleting}
              autoComplete="off"
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || confirmText !== community.name}
            className={styles.deleteBtn}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommunityModal;
