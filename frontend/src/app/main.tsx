import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { bootstrap } from "@/app/bootstrap";
import { AppProviders } from "@/app/providers";
import "@/shared/styles/index.css";

async function start(): Promise<void> {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("index.html must contain #root");
  const { router, queryClient } = await bootstrap();
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders queryClient={queryClient} router={router} />
    </StrictMode>,
  );
}

void start();
