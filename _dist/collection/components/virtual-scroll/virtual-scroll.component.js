import * as tween from '@tweenjs/tween.js';
export class VirtualScrollComponent {
    constructor() {
        this.uniqueId = 'sp-virtual-scroll-' + (VirtualScrollComponent.idCount++) + (new Date()).getTime();
        this.items = [];
        this.bufferAmount = 0;
        this.scrollAnimationTime = 1500;
        this.refreshHandler = () => {
            this.refresh();
        };
        this.startupLoop = true;
        this.cumulativeHeights = [];
        /** Cache of the last scroll height to prevent setting CSS when not needed. */
        this._scrollHeight = -1;
        /** Cache of the last top padding to prevent setting CSS when not needed. */
        this.lastTopPadding = -1;
    }
    render() {
        return [
            h("div", { class: "total-padding" }),
            h("div", { id: this.uniqueId, class: "scrollable-content" },
                h("slot", null))
        ];
    }
    set parentScroll(element) {
        if (this._parentScroll === element) {
            return;
        }
        this._parentScroll = element;
        this.addParentEventHandlers(this._parentScroll);
    }
    get parentScroll() {
        return this._parentScroll;
    }
    componentWillLoad() {
        this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
        this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;
        if (!this.parentScroll) {
            this.addParentEventHandlers(this.element);
        }
    }
    componentDidUnload() {
        this.removeParentEventHandlers();
    }
    componentWillUpdate() {
        //TODO
        this.startupLoop = true;
        this.refresh();
    }
    refresh(forceViewportUpdate = false) {
        window.requestAnimationFrame(() => this.calculateItems(forceViewportUpdate));
    }
    scrollInto(item) {
        let el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element;
        let index = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length)
            return;
        let scrollTop = (Math.floor(index / this.itemsPerRow) * this.heightAvg)
            - (this.heightAvg * Math.min(index, this.bufferAmount));
        let animationRequest;
        if (this.currentTween != undefined)
            this.currentTween.stop();
        // totally disable animate
        if (!this.scrollAnimationTime) {
            el.scrollTop = scrollTop;
            return;
        }
        this.currentTween = new tween.Tween({ scrollTop: el.scrollTop })
            .to({ scrollTop }, this.scrollAnimationTime)
            .easing(tween.Easing.Quadratic.Out)
            .onUpdate((data) => {
            if (isNaN(data.scrollTop)) {
                return;
            }
            el.scrollTop = data.scrollTop;
            this.refresh();
        })
            .onStop(() => {
            cancelAnimationFrame(animationRequest);
        })
            .start();
        const animate = (time) => {
            this.currentTween.update(time);
            if (this.currentTween._object.scrollTop !== scrollTop) {
                animationRequest = window.requestAnimationFrame(animate);
            }
        };
        animate();
    }
    addParentEventHandlers(parentScroll) {
        this.removeParentEventHandlers();
        if (parentScroll) {
            parentScroll.addEventListener('scroll', this.refreshHandler);
            this.disposeScrollHandler = () => parentScroll.removeEventListener('scroll', this.refreshHandler);
            if (parentScroll instanceof Window) {
                window.addEventListener('resize', this.refreshHandler);
                this.disposeResizeHandler = () => window.removeEventListener('resize', this.refreshHandler);
            }
        }
    }
    removeParentEventHandlers() {
        if (this.disposeScrollHandler) {
            this.disposeScrollHandler();
            this.disposeScrollHandler = undefined;
        }
        if (this.disposeResizeHandler) {
            this.disposeResizeHandler();
            this.disposeResizeHandler = undefined;
        }
    }
    getContent() {
        return this.element.querySelector('.scrollable-content');
    }
    getShimElement() {
        return this.element.querySelector('.total-padding');
    }
    countItemsPerRow() {
        let offsetTop;
        let itemsPerRow;
        let content = this.getContent();
        let children = content && content.children;
        for (itemsPerRow = 0; itemsPerRow < children.length; itemsPerRow++) {
            let child = children[itemsPerRow];
            if (offsetTop != undefined && offsetTop !== child.offsetTop) {
                break;
            }
            ;
            offsetTop = child.offsetTop;
        }
        return itemsPerRow;
    }
    getElementsOffset() {
        let offsetTop = 0;
        if (this.parentScroll) {
            offsetTop += this.element.offsetTop;
        }
        return offsetTop;
    }
    calculateItems(forceViewportUpdate = false) {
        let el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element;
        this.calculateDimensions();
        let items = this.items || [];
        let offsetTop = this.getElementsOffset();
        let elScrollTop = this.parentScroll instanceof Window
            ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
            : el.scrollTop;
        if (elScrollTop > this._scrollHeight) {
            elScrollTop = this._scrollHeight + offsetTop;
        }
        let scrollTop = Math.max(0, elScrollTop - offsetTop);
        let indexByScrollTop = this.calculateCurrentIndex(scrollTop);
        let end = Math.ceil(indexByScrollTop) * this.itemsPerRow + this.itemsPerRow * (this.itemsPerCol + 1);
        end = Math.min(end, this.itemCount);
        let maxStartEnd = end;
        const modEnd = end % this.itemsPerRow;
        if (modEnd) {
            maxStartEnd = end + this.itemsPerRow - modEnd;
        }
        let maxStart = Math.max(0, maxStartEnd - this.itemsPerCol * this.itemsPerRow - this.itemsPerRow);
        let start = Math.min(maxStart, Math.floor(indexByScrollTop) * this.itemsPerRow);
        // let topPadding = (items == null || items.length === 0) ? 0 : (d.childHeight * Math.ceil(start / d.itemsPerRow) - (d.childHeight * Math.min(start, this.bufferAmount)));
        let topPadding = this.cumulativeHeights[start - this.bufferAmount - 1] || 0;
        console.log('topPadding', topPadding, start, this.bufferAmount);
        if (topPadding !== this.lastTopPadding) {
            let content = this.getContent();
            content.style.transform = `translateY(${topPadding}px)`;
            content.style.webkitTransform = `translateY(${topPadding}px)`;
            this.lastTopPadding = topPadding;
        }
        start = !isNaN(start) ? start : -1;
        end = !isNaN(end) ? end : -1;
        start -= this.bufferAmount;
        end += this.bufferAmount;
        start = Math.max(0, start);
        start = Math.min(start, items.length);
        end = Math.max(start, end);
        end = Math.min(end, items.length);
        if ((start !== this.previousStart) || (end !== this.previousEnd) || (forceViewportUpdate === true)) {
            this.viewPortItems = items.slice(start, end);
            this.update.emit(this.viewPortItems);
            console.log('slice', start, end);
            // emit 'start' event
            if ((start !== this.previousStart) && (this.startupLoop === false)) {
                this.start.emit({ start, end });
            }
            // emit 'end' event
            if ((end !== this.previousEnd) && (this.startupLoop === false)) {
                this.end.emit({ start, end });
            }
            this.previousStart = start;
            this.previousEnd = end;
            if (this.startupLoop === true) {
                this.refresh();
            }
            else {
                this.change.emit({ start, end });
            }
        }
        else if (this.startupLoop === true) {
            this.startupLoop = false;
            this.refresh();
        }
    }
    calculateDimensions() {
        let el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.element;
        let items = this.items || [];
        let itemCount = items.length;
        let viewWidth = el.clientWidth - this.scrollbarWidth;
        let viewHeight = el.clientHeight - this.scrollbarHeight;
        let childWidth = this.childWidth;
        let childHeight = this.heightAvg || this.childHeight;
        let itemsPerRow = Math.max(1, this.countItemsPerRow());
        let itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
        let itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        let elScrollTop = this.parentScroll instanceof Window
            ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
            : el.scrollTop;
        let scrollTop = Math.max(0, elScrollTop);
        const scrollHeight = childHeight * Math.ceil(itemCount / itemsPerRow);
        console.log('scrollHeight', scrollHeight, childHeight, itemCount, itemsPerRow);
        if (itemsPerCol === 1 && Math.floor(scrollTop / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
            itemsPerRow = itemsPerRowByCalc;
        }
        if (scrollHeight !== this._scrollHeight) {
            let shim = this.getShimElement();
            shim.style.height = `${scrollHeight}px`;
            this._scrollHeight = scrollHeight;
        }
        this.heightAvg = this.heightAvg;
        this.itemCount = itemCount;
        this.itemsPerRow = itemsPerRow;
        this.itemsPerCol = itemsPerCol;
    }
    calculateCurrentIndex(scrollTop) {
        let indexByScrollTop = null;
        let content = document.getElementById(this.uniqueId);
        let childrenContent = content && content.children;
        if (childrenContent && childrenContent.length) {
            let previousStart = this.previousStart || 0;
            let heightAvg = Math.max(this.heightAvg || 0, 1);
            let current = previousStart;
            let cumulativeHeights = this.cumulativeHeights || [];
            let len = cumulativeHeights.length;
            let cumulativeHeight = 0;
            console.log('previousStart', previousStart, current, scrollTop, len, heightAvg);
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
            for (let child of Array.from(childrenContent)) {
                let childHeight = child.getBoundingClientRect().height || this.heightAvg;
                // console.log('childHeight', childHeight, previousStart, len, current, cumulativeHeight);
                cumulativeHeight += childHeight;
                cumulativeHeights[current] = cumulativeHeight;
                current++;
            }
            heightAvg = Math.max(cumulativeHeight / current, 1);
            this.heightAvg = heightAvg;
            while (scrollTop > cumulativeHeight) {
                cumulativeHeight += heightAvg;
                cumulativeHeights[current] = cumulativeHeight;
                current++;
            }
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
            indexByScrollTop = idx + ((scrollTop - prevVal) / (currVal - prevVal));
            console.log('indexByScrollTop2', indexByScrollTop, idx, this.heightAvg, this.cumulativeHeights);
        }
        else {
            let indexByScrollTop = scrollTop / this._scrollHeight * this.itemCount / this.itemsPerRow;
            console.log('indexByScrollTop', indexByScrollTop, scrollTop, this._scrollHeight);
        }
        return indexByScrollTop;
    }
    static get is() { return "sp-virtual-scroll"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return { "bufferAmount": { "type": Number, "attr": "buffer-amount" }, "childHeight": { "type": Number, "attr": "child-height" }, "childWidth": { "type": Number, "attr": "child-width" }, "element": { "elementRef": true }, "items": { "type": "Any", "attr": "items" }, "parentScroll": { "type": "Any", "attr": "parent-scroll" }, "scrollAnimationTime": { "type": Number, "attr": "scroll-animation-time" }, "scrollbarHeight": { "type": Number, "attr": "scrollbar-height" }, "scrollbarWidth": { "type": Number, "attr": "scrollbar-width" } }; }
    static get events() { return [{ "name": "update", "method": "update", "bubbles": true, "cancelable": true, "composed": true }, { "name": "change", "method": "change", "bubbles": true, "cancelable": true, "composed": true }, { "name": "start", "method": "start", "bubbles": true, "cancelable": true, "composed": true }, { "name": "end", "method": "end", "bubbles": true, "cancelable": true, "composed": true }]; }
    static get style() { return "/**style-placeholder:sp-virtual-scroll:**/"; }
}
VirtualScrollComponent.idCount = 1;
