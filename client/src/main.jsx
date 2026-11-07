import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import store from "@/redux/store";
import { ThemeProvider } from "@/components/ThemeProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
  <ThemeProvider>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </ThemeProvider>
</StrictMode>
);