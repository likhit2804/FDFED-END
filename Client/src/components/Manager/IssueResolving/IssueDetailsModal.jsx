
import { IssueDetailsModal as UnifiedIssueDetailsModal } from "../../shared";
import { UserCheck, RefreshCw } from "lucide-react";

export const IssueDetailsModal = ({
    issue,
    isOpen,
    onClose,
    canAssign,
    canReassign,
    onAssign,
    onReassign,
}) => {
    if (!isOpen || !issue) return null;

    const actions = [];
    if (canAssign && canAssign(issue)) {
        actions.push({
            label: "Assign Worker",
            variant: "primary",
            icon: <UserCheck size={15} />,
            onClick: () => onAssign(issue),
        });
    }
    if (canReassign && canReassign(issue)) {
        actions.push({
            label: "Reassign Worker",
            variant: "warning",
            icon: <RefreshCw size={15} />,
            onClick: () => onReassign(issue),
        });
    }

    return (
        <UnifiedIssueDetailsModal
            issue={issue}
            isOpen={isOpen}
            onClose={onClose}
            role="manager"
            actions={actions}
        >
            {issue.remarks && (
                <div className="p-3 rounded-3 bg-light border mb-3">
                    <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: "10.5px" }}>
                        Manager Remarks & Instructions
                    </div>
                    <div className="text-dark" style={{ fontSize: "13px" }}>
                        {issue.remarks}
                    </div>
                </div>
            )}
        </UnifiedIssueDetailsModal>
    );
};

export default IssueDetailsModal;
