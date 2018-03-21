import '../../stencil.core';
export interface VirtualScrollExampleItem {
    name: string;
    text: string;
}
export declare class VirtualScrollExample {
    el: HTMLElement;
    first: string;
    last: string;
    private count;
    private amount;
    private intervals;
    items: Array<VirtualScrollExampleItem>;
    scrollItems: Array<VirtualScrollExampleItem>;
    private updateItems(scrollItems);
    private createItems();
    componentDidLoad(): void;
    render(): JSX.Element;
}
