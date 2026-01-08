/// <reference types="vite/client" />

interface Window {
  gtag: (command: string, ...args: any[]) => void;
  dataLayer: any[];
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
  }
