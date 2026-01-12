"use client";

import { useEffect, useMemo, useState } from "react";
import { androidStoreUrl, iosStoreUrl } from "../../../src/urls";

const REDIRECT_DELAY_MS = 1800;

function detectStoreUrl() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return androidStoreUrl;
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return iosStoreUrl;
  return null;
}

export default function ContentRedirect() {
  const [cancelled, setCancelled] = useState(false);
  const storeUrl = useMemo(() => detectStoreUrl(), []);

  useEffect(() => {
    if (!storeUrl || cancelled) return;
    const timer = window.setTimeout(() => {
      window.location.href = storeUrl;
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [storeUrl, cancelled]);

  if (!storeUrl) return null;

  return (
    <div className="card redirect-card">
      <p className="redirect-note">
        Se o app não estiver instalado, você será redirecionado para a loja em instantes.
      </p>
      <div className="redirect-actions">
        <a className="button secondary" href={storeUrl}>
          Ir para a loja agora
        </a>
        <button className="button secondary" onClick={() => setCancelled(true)}>
          Ficar no site
        </button>
      </div>
    </div>
  );
}
