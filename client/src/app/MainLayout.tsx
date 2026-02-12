import { Outlet } from "react-router-dom";
import GlobalLog from "../components/layout/GlobalLog";

export default function MainLayout() {
    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            <Outlet />
            <GlobalLog />
        </div>
    );
}
