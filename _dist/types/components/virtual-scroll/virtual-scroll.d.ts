import { EventEmitter } from '@stencil/core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent {
    render(): JSX.Element[];
    private static idCount;
    uniqueId: string;
    element: HTMLElement;
    items: any[];
    scrollbarWidth: number;
    scrollbarHeight: number;
    childWidth: number;
    childHeight: number;
    bufferAmount: number;
    scrollAnimationTime: number;
    private refreshHandler;
    private _parentScroll;
    parentScroll: Element | Window;
    update: EventEmitter<any[]>;
    change: EventEmitter<ChangeEvent>;
    start: EventEmitter<ChangeEvent>;
    end: EventEmitter<ChangeEvent>;
    private viewPortItems;
    private previousStart;
    private previousEnd;
    private startupLoop;
    private currentTween;
    private cumulativeHeights;
    private heightAvg;
    private itemCount;
    private itemsPerRow;
    private itemsPerCol;
    private disposeScrollHandler;
    private disposeResizeHandler;
    /** Cache of the last scroll height to prevent setting CSS when not needed. */
    private _scrollHeight;
    /** Cache of the last top padding to prevent setting CSS when not needed. */
    private lastTopPadding;
    constructor();
    componentWillLoad(): void;
    componentDidUnload(): void;
    componentWillUpdate(): void;
    refresh(forceViewportUpdate?: boolean): void;
    scrollInto(item: any): void;
    private addParentEventHandlers(parentScroll);
    private removeParentEventHandlers();
    private getContent();
    private getShimElement();
    private countItemsPerRow();
    private getElementsOffset();
    private calculateItems(forceViewportUpdate?);
    private calculateDimensions();
    private calculateCurrentIndex(scrollTop);
}
