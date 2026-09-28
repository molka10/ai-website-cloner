import { BrowserRouter, Routes, Route } from "react-router";
import Landing from "@/pages/Landing";
import Workspace from "@/pages/Workspace";
import History from "@/pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Workspace />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}