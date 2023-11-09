import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { PusherContextProvider } from "./context/pusherContext.tsx";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster.tsx";
import { PusherEventContextProvider } from "./context/pusherEventContext.tsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
      logoutUri={import.meta.env.VITE_KINDE_LOGOUT_URL}
      redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URL}
    >
      <PusherContextProvider pusherKey={import.meta.env.VITE_PUSHER_KEY}>
        <QueryClientProvider client={queryClient}>
          <PusherEventContextProvider>
            <App />
          </PusherEventContextProvider>
          <Toaster />
        </QueryClientProvider>
      </PusherContextProvider>
    </KindeProvider>
  </React.StrictMode>
);
