import './stencil.core';
/**
 * This is an autogenerated file created by the Stencil build process.
 * It contains typing information for all components that exist in this project
 * and imports for stencil collections that might be configured in your stencil.config.js file
 */
declare global {
  namespace JSX {
    interface Element {}
    export interface IntrinsicElements {}
  }
  namespace JSXElements {}

  interface HTMLStencilElement extends HTMLElement {
    componentOnReady(): Promise<this>;
    componentOnReady(done: (ele?: this) => void): void;
  }

  interface HTMLAttributes {}
}

import {
  VirtualScrollChangeEvent,
} from './components/virtual-scroll/virtual-scroll';

import {
  MyComponent as MyComponent
} from './components/my-component/my-component';

declare global {
  interface HTMLMyComponentElement extends MyComponent, HTMLStencilElement {
  }
  var HTMLMyComponentElement: {
    prototype: HTMLMyComponentElement;
    new (): HTMLMyComponentElement;
  };
  interface HTMLElementTagNameMap {
    "my-component": HTMLMyComponentElement;
  }
  interface ElementTagNameMap {
    "my-component": HTMLMyComponentElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      "my-component": JSXElements.MyComponentAttributes;
    }
  }
  namespace JSXElements {
    export interface MyComponentAttributes extends HTMLAttributes {
      first?: string;
      last?: string;
    }
  }
}


import {
  VirtualScrollComponent as SpVirtualScroll
} from './components/virtual-scroll/virtual-scroll';

declare global {
  interface HTMLSpVirtualScrollElement extends SpVirtualScroll, HTMLStencilElement {
  }
  var HTMLSpVirtualScrollElement: {
    prototype: HTMLSpVirtualScrollElement;
    new (): HTMLSpVirtualScrollElement;
  };
  interface HTMLElementTagNameMap {
    "sp-virtual-scroll": HTMLSpVirtualScrollElement;
  }
  interface ElementTagNameMap {
    "sp-virtual-scroll": HTMLSpVirtualScrollElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      "sp-virtual-scroll": JSXElements.SpVirtualScrollAttributes;
    }
  }
  namespace JSXElements {
    export interface SpVirtualScrollAttributes extends HTMLAttributes {
      buffer?: number;
      change?: (event: VirtualScrollChangeEvent) => void;
      end?: (event: VirtualScrollChangeEvent) => void;
      items?: any[];
      parentScroll?: HTMLElement;
      scrollAnimationTime?: number;
      start?: (event: VirtualScrollChangeEvent) => void;
      update?: (list: any[]) => void;
    }
  }
}

declare global { namespace JSX { interface StencilJSX {} } }
