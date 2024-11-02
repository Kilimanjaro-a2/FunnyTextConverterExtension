// global.d.ts
export {};

declare global {
  interface Window {
    originalNodes: Text[];
    originalTexts: string[];
  }
}