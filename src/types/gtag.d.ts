export {};

type DataLayerEvent = {
  event: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    trackWhatsAppAndRedirect?: (url: string) => boolean;
    gtag_report_conversion?: (url: string) => boolean;
  }
}
