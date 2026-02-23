import { type CSSProperties } from 'react';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void; // 취소 버튼이 있으면 Confirm/Cancel 형태, 없으면 Alert 형태
    confirmText?: string;
    cancelText?: string;
}

export default function AlertModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "확인",
    cancelText = "취소",
}: AlertModalProps) {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.title}>{title}</div>
                </div>
                <div style={styles.body}>
                    <div style={styles.message}>{message}</div>
                </div>
                <div style={styles.footer}>
                    {onCancel && (
                        <button style={styles.cancelBtn} onClick={onCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button style={styles.confirmBtn} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
    },
    modal: {
        width: 400,
        maxWidth: "90%",
        backgroundColor: "rgba(20, 20, 20, 0.95)",
        borderRadius: 20,
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        padding: "20px 24px 10px",
        textAlign: "center",
    },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: 0.5,
    },
    body: {
        padding: "10px 24px 24px",
        textAlign: "center",
    },
    message: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 16,
        lineHeight: 1.5,
        wordBreak: "keep-all",
    },
    footer: {
        padding: "16px 24px 24px",
        display: "flex",
        gap: 12,
        justifyContent: "center",
    },
    confirmBtn: {
        padding: "12px 28px",
        borderRadius: 12,
        border: "none",
        backgroundColor: "#ffd43b",
        color: "#000",
        fontSize: 15,
        fontWeight: 900,
        cursor: "pointer",
        transition: "transform 0.1s",
        boxShadow: "0 4px 12px rgba(253, 212, 59, 0.2)",
    },
    cancelBtn: {
        padding: "12px 28px",
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        color: "#fff",
        fontSize: 15,
        fontWeight: 800,
        cursor: "pointer",
        transition: "background-color 0.2s",
    },
};
