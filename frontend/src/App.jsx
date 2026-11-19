import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./context/user.context";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <UserProvider>
      <AppRoutes />
      <Toaster
        position="top-center"
        containerStyle={{ top: "88px" }}
        toastOptions={{
          duration: 3500,
          style: {
            background: "#ffffff",
            color: "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
          },
          success: {
            iconTheme: { primary: "#6ee7b7", secondary: "#ecfdf5" },
            style: { background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#475569" },
          },
          error: {
            iconTheme: { primary: "#fda4af", secondary: "#fff1f2" },
            style: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#475569" },
          },
        }}
      />
    </UserProvider>
  );
}

export default App;
