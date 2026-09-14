export interface ScrollCraftApi {
  layout: () => void;
  read: () => void;
}

export interface ScrollCraftGlobal {
  mount: (root: Element | string | Document, opts?: { lerp?: number }) => ScrollCraftApi;
  reduce: boolean;
  instances: ScrollCraftApi[];
}

declare global {
  interface Window {
    ScrollCraft?: ScrollCraftGlobal;
  }
}
