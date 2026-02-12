import { useEffect, useRef, type CSSProperties } from "react";
import { useGameStore } from "../../stores/game.store";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalLog() {
    const { logs, isLogOpen, toggleLog } = useGameStore();
    const logRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const containerStyle: CSSProperties = {
        position: "fixed",
        left: 20,
        bottom: 20,
        width: 300,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
    };

    const panelStyle: CSSProperties = {
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px 12px 0 0",
        display: "flex",
        flexDirection: "column",
        maxHeight: 250,
        pointerEvents: "auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        overflow: "hidden",
    };

    const headerStyle: CSSProperties = {
        background: "rgba(255, 255, 255, 0.05)",
        padding: "8px 12px",
        fontSize: 12,
        fontWeight: 900,
        color: "rgba(255, 255, 255, 0.6)",
        letterSpacing: "0.1em",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    };

    const bodyStyle: CSSProperties = {
        padding: "8px 12px",
        overflowY: "auto",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.9)",
    };

    const toggleBtnStyle: CSSProperties = {
        background: isLogOpen ? "rgba(255, 255, 255, 0.1)" : "rgba(10, 10, 15, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: isLogOpen ? "0 0 12px 12px" : "12px",
        color: "rgba(205, 165, 78, 1)",
        fontSize: 12,
        fontWeight: 900,
        padding: "6px 16px",
        cursor: "pointer",
        pointerEvents: "auto",
        alignSelf: "flex-start",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
    };

    return (
        <div style={containerStyle}>
            <AnimatePresence>
                {isLogOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 20, height: 0 }}
                        style={panelStyle}
                    >
                        <div style={headerStyle}>
                            <span>CHRONICLE</span>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50" }} />
                        </div>
                        <div ref={logRef} style={bodyStyle}>
                            {logs.length === 0 ? (
                                <div style={{ opacity: 0.3, fontStyle: "italic", fontSize: 12 }}>아직 기록된 여정이 없습니다...</div>
                            ) : (
                                logs.map((l, i) => (
                                    <div key={i} style={{ borderLeft: "2px solid rgba(205, 165, 78, 0.3)", paddingLeft: 8, lineHeight: 1.4 }}>
                                        {l}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={toggleLog}
                style={toggleBtnStyle}
                onMouseEnter={(e) => {
                    e.currentTarget.style.filter = "brightness(1.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                    e.currentTarget.style.transform = "none";
                }}
            >
                <span style={{ fontSize: 14 }}>{isLogOpen ? "🔽" : "📜"}</span>
                {isLogOpen ? "LOG HIDE" : "LOG SHOW"}
            </button>
        </div>
    );
}
