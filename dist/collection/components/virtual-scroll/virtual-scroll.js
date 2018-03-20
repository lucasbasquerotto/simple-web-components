export class VirtualScrollComponent {
    constructor() {
        this.items = [];
        this.buffer = 0;
        this.scrollAnimationTime = 1500;
        // private currentTween: any;
        this.cumulativeHeights = [];
        this.showAmountLoop = new Set();
        // Cache of the last scroll height to prevent setting CSS when not needed. 
        this.totalScrollHeight = -1;
        // Cache of the last top padding to prevent setting CSS when not needed. 
        this.lastTopPadding = -1;
        console.log('virtual-scroll');
    }
    componentWillLoad() {
        console.log('componentWillLoad');
        this.addParentEventHandlers(this.parentScroll || this.el);
    }
    componentDidLoad() {
        console.log('componentDidLoad');
        this.refresh();
    }
    componentDidUnload() {
        this.removeParentEventHandlers();
    }
    componentWillUpdate() {
        console.log('componentWillUpdate');
        this.refresh();
    }
    refresh(forceViewportUpdate = false) {
        window.requestAnimationFrame(() => this.calculateItems(forceViewportUpdate));
    }
    addParentEventHandlers(parentScroll) {
        this.removeParentEventHandlers();
        console.log('parentScroll');
        if (parentScroll) {
            const handler = () => this.refresh();
            parentScroll.addEventListener('scroll', handler);
            this.disposeScrollHandler = () => parentScroll.removeEventListener('scroll', handler);
        }
    }
    removeParentEventHandlers() {
        if (this.disposeScrollHandler) {
            this.disposeScrollHandler();
            this.disposeScrollHandler = undefined;
        }
    }
    getContent() {
        return this.el.shadowRoot.querySelector('.scrollable-content');
    }
    getShimElement() {
        return this.el.shadowRoot.querySelector('.total-padding');
    }
    calculateItems(forceUpdate = false) {
        let { start = 0, startBuffer = 0, end = 0, endBuffer = 0 } = this.calculateValues();
        if ((start !== this.previousStart) || (end !== this.previousEnd) || (forceUpdate === true)) {
            let items = this.items || [];
            this.viewPortItems = items.slice(startBuffer, endBuffer);
            this.onUpdate && this.onUpdate(this.viewPortItems);
            console.log('slice', start, end, startBuffer, endBuffer);
            // emit 'start' event
            if ((start !== this.previousStart) && (start === 0)) {
                this.onStart && this.onStart({ start, end });
            }
            // emit 'end' event
            if ((end !== this.previousEnd) && (end === (items.length - 1))) {
                this.onEnd && this.onEnd({ start, end });
            }
            this.previousStart = start;
            this.previousStartBuffer = startBuffer;
            this.previousEnd = end;
            const showAmount = end - start;
            if (!this.showAmountLoop.has(showAmount)) {
                this.showAmountLoop.add(showAmount);
                return this.refresh();
            }
        }
        this.showAmountLoop.clear();
    }
    calculateValues() {
        let el = this.parentScroll || this.el;
        let elScrollTop = el.scrollTop;
        let childrenContent = this.el.children;
        let itemCount = (this.items || []).length;
        let offsetTop = this.parentScroll ? this.el.offsetTop : 0;
        let scrollHeight = Math.max(0, (this.totalScrollHeight || 0) - offsetTop);
        let scrollTop = Math.max(0, elScrollTop - offsetTop);
        let viewHeight = el.clientHeight || 0;
        let startIdx = 0;
        let showCount = 0;
        let heightAvg = 0;
        if (childrenContent && childrenContent.length) {
            let previousStart = this.previousStartBuffer || 0;
            let current = previousStart;
            let cumulativeHeights = this.cumulativeHeights || [];
            let len = cumulativeHeights.length;
            let cumulativeHeight = 0;
            // console.log('previousStart', previousStart, current, scrollTop, len, heightAvg);			
            if (len < current) {
                if (len > 0) {
                    cumulativeHeight = cumulativeHeights[len - 1];
                }
                for (let i = len; i < current; i++) {
                    cumulativeHeight += heightAvg;
                    cumulativeHeights[i] = cumulativeHeight;
                }
                len = cumulativeHeights.length;
            }
            if (current) {
                cumulativeHeight = cumulativeHeights[current - 1];
            }
            console.log('current0', current, previousStart);
            for (let child of Array.from(childrenContent)) {
                let childHeight = child.getBoundingClientRect().height || heightAvg;
                // console.log('childHeight', childHeight, previousStart, len, current, cumulativeHeight);
                cumulativeHeight += childHeight;
                cumulativeHeights[current] = cumulativeHeight;
                current++;
            }
            heightAvg = Math.max(cumulativeHeight / current, 1);
            console.log('current1', current);
            while ((scrollTop + viewHeight > cumulativeHeight) && (current < itemCount)) {
                cumulativeHeight += heightAvg;
                cumulativeHeights[current] = cumulativeHeight;
                current++;
            }
            console.log('cumulativeHeight', cumulativeHeight, cumulativeHeights.length, current);
            this.cumulativeHeights = cumulativeHeights.slice(0, current);
            len = cumulativeHeights.length;
            let idx = 0;
            let prevVal = 0;
            let currVal = 0;
            while (idx < len) {
                prevVal = currVal;
                currVal = cumulativeHeights[idx];
                if (currVal >= scrollTop) {
                    break;
                }
                idx++;
            }
            startIdx = idx + ((scrollTop - prevVal) / (currVal - prevVal));
            while (idx < len) {
                prevVal = currVal;
                currVal = cumulativeHeights[idx];
                if (currVal >= scrollTop + viewHeight) {
                    break;
                }
                idx++;
            }
            let endIdx = idx + ((scrollTop + viewHeight - prevVal) / (currVal - prevVal));
            showCount = Math.ceil(endIdx - startIdx);
            // console.log('idx', startIdx, endIdx, showCount, idx, heightAvg, this.cumulativeHeights);
        }
        showCount = Math.max(showCount, 0);
        let buffer = Math.max(0, this.buffer || 0);
        if (itemCount && !showCount) {
            showCount = Math.max(buffer, 2);
        }
        let maxStart = Math.min(Math.ceil(startIdx) + showCount, itemCount);
        let start = Math.min(maxStart, Math.floor(startIdx));
        start = Math.max(0, start || 0);
        start = Math.min(start, itemCount);
        let end = Math.min(start + showCount, itemCount);
        let startBuffer = start - buffer - 1;
        startBuffer = Math.max(0, startBuffer);
        let endBuffer = end + buffer + 1;
        endBuffer = Math.min(endBuffer, itemCount);
        let topPadding = this.cumulativeHeights[startBuffer - 1] || 0;
        if (topPadding !== this.lastTopPadding) {
            let content = this.getContent();
            content.style.transform = `translateY(${topPadding}px)`;
            content.style.webkitTransform = `translateY(${topPadding}px)`;
            this.lastTopPadding = topPadding;
        }
        scrollHeight = heightAvg * itemCount;
        const totalScrollHeight = Math.max(0, scrollHeight + offsetTop);
        if (totalScrollHeight !== this.totalScrollHeight) {
            let shim = this.getShimElement();
            shim.style.height = `${scrollHeight}px`;
            this.totalScrollHeight = scrollHeight;
            console.log('totalScrollHeight', totalScrollHeight, scrollHeight, itemCount);
        }
        console.log('calc', start, startBuffer, end, endBuffer, showCount, scrollTop, scrollHeight);
        return { start, startBuffer, end, endBuffer, showCount };
    }
    // public scrollInto(item: any) {
    // 	let el: HTMLElement = this.parentScroll || this.el;
    // 	let index: number = (this.items || []).indexOf(item);
    // 	if (index < 0 || index >= (this.items || []).length) return;
    // 	let scrollTop = (Math.floor(index) * this.heightAvg)
    // 		- (this.heightAvg * Math.min(index, this.buffer));
    // 	let animationRequest;
    // 	if (this.currentTween != undefined) this.currentTween.stop()
    // 	// totally disable animate
    // 	if (!this.scrollAnimationTime) {
    // 		el.scrollTop = scrollTop;
    // 		return;
    // 	}
    // 	this.currentTween = new tween.Tween({ scrollTop: el.scrollTop })
    // 		.to({ scrollTop }, this.scrollAnimationTime)
    // 		.easing(tween.Easing.Quadratic.Out)
    // 		.onUpdate((data) => {
    // 			if (isNaN(data.scrollTop)) {
    // 				return;
    // 			}
    // 			el.scrollTop = data.scrollTop;
    // 			this.refresh();
    // 		})
    // 		.onStop(() => {
    // 			cancelAnimationFrame(animationRequest);
    // 		})
    // 		.start();
    // 	const animate = (time?) => {
    // 		this.currentTween.update(time);
    // 		if (this.currentTween._object.scrollTop !== scrollTop) {
    // 			animationRequest = window.requestAnimationFrame(animate);
    // 		}
    // 	}
    // 	animate()
    // }
    render() {
        return [
            h("div", { class: "total-padding" }),
            h("div", { class: "scrollable-content" },
                h("slot", null))
        ];
    }
    static get is() { return "sp-virtual-scroll"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return { "buffer": { "type": Number, "attr": "buffer" }, "el": { "elementRef": true }, "items": { "type": "Any", "attr": "items" }, "onEnd": { "type": "Any", "attr": "on-end" }, "onStart": { "type": "Any", "attr": "on-start" }, "onUpdate": { "type": "Any", "attr": "on-update" }, "onVirtualChange": { "type": "Any", "attr": "on-virtual-change" }, "parentScroll": { "type": "Any", "attr": "parent-scroll" }, "scrollAnimationTime": { "type": Number, "attr": "scroll-animation-time" } }; }
    static get style() { return "/**style-placeholder:sp-virtual-scroll:**/"; }
}
