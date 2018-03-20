import '../../stencil.core';
export interface ChangeEvent {
    start?: number;
    end?: number;
}
export declare class VirtualScrollComponent {
    el: HTMLElement;
    items: any[];
    buffer: number;
    scrollAnimationTime: number;
    parentScroll: HTMLElement;
    onUpdate: (list: any[]) => void;
    onVirtualChange: (event: ChangeEvent) => void;
    onStart: (event: ChangeEvent) => void;
    onEnd: (event: ChangeEvent) => void;
    private viewPortItems;
    private previousStart;
    private previousStartBuffer;
    private previousEnd;
    private cumulativeHeights;
    private showAmountLoop;
    private totalScrollHeight;
    private lastTopPadding;
    private disposeScrollHandler;
    constructor();
    componentWillLoad(): void;
    componentDidLoad(): void;
    componentDidUnload(): void;
    componentWillUpdate(): void;
    refresh(forceViewportUpdate?: boolean): void;
    private addParentEventHandlers(parentScroll);
    private removeParentEventHandlers();
    private getContent();
    private getShimElement();
    private calculateItems(forceUpdate?);
    private calculateValues();
    render(): JSX.Element[];
}
