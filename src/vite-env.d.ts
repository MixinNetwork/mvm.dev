/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, any>;
  export default component;
}

declare module "pako" {
  export function gzip(data: string): Uint8Array;
  export function ungzip(
    data: Uint8Array,
    options: { to: "string" },
  ): string;
  export function ungzip(data: Uint8Array): Uint8Array;
}
