/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_NAME?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_PHONE_NUMBER?: string;
  readonly VITE_EMAIL?: string;
  readonly VITE_CITY?: string;
  readonly VITE_RESPONSE_TIME?: string;
  readonly VITE_CHECKOUT_MESSAGE?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
