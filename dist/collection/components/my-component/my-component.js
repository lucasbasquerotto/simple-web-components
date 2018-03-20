export class MyComponent {
    constructor() {
        this.count = 0;
        this.amount = 40000;
        this.intervals = [3000, 6000];
        this.items = this.createItems();
    }
    updateItems(scrollItems) {
        console.log('updateItems', scrollItems, (this.items || []).length);
        this.scrollItems = scrollItems;
    }
    createItems() {
        let aux = (this.count * this.amount) + 1;
        this.count++;
        let items = (this.items || []).concat('.'.repeat(this.amount).split('').map((_, idx) => ({
            name: 'item-' + (idx + aux),
            text: 'Item ' + (idx + aux),
        })));
        console.log('createItems', items.length);
        return items;
    }
    componentDidLoad() {
        for (let interval of (this.intervals || [])) {
            setTimeout(() => this.items = this.createItems(), interval);
        }
    }
    render() {
        return (h("div", null,
            "Hello, World! I'm ",
            this.first,
            " ",
            this.last,
            h("br", null),
            h("sp-virtual-scroll", { items: this.items, onUpdate: scrollItems => this.updateItems(scrollItems), onVirtualChange: event => console.log('onVirtualChange', event), onStart: event => console.log('onStart', event), onEnd: event => console.log('onEnd', event), parentScroll: this.el, buffer: 10 }, (this.scrollItems || []).map(item => {
                return (h("div", { class: item.name, style: { 'width': '100%' } },
                    h("div", { style: { 'width': '100%' } }, item.text),
                    item.text.split('').map(c => h("div", { style: { 'width': '100%' } },
                        "|",
                        c,
                        "|"))));
            })),
            "Hello, World! I'm ",
            this.first,
            " ",
            this.last,
            h("br", null)));
    }
    static get is() { return "my-component"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return { "el": { "elementRef": true }, "first": { "type": String, "attr": "first" }, "items": { "state": true }, "last": { "type": String, "attr": "last" }, "scrollItems": { "state": true } }; }
    static get style() { return "/**style-placeholder:my-component:**/"; }
}
