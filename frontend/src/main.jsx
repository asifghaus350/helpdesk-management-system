import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Load saved theme before the application starts
const savedSettings = localStorage.getItem("settings");

if (savedSettings) {
  const settings = JSON.parse(savedSettings);

  const theme = settings.theme || "light";

  document.documentElement.classList.toggle(
    "dark",
    theme === "dark"
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);