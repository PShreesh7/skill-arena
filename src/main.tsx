import { createRoot } from "react-dom/client";
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/dm-sans';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
