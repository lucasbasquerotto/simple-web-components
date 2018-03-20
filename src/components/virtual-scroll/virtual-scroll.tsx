import { Component, Element, Prop } from '@stencil/core';
import * as tween from '@tweenjs/tween.js';

export interface ChangeEvent {
	start?: number;
	end?: number;
}

@Component({
	tag: 'sp-virtual-scroll',
	styleUrl: 'virtual-scroll.pcss',
	shadow: true
})
export class VirtualScrollComponent {

	render() {
		return [
			<div class="total-padding"></div>,
			<div id={this.uniqueId} class="scrollable-content">
				<slot/>
			</div>
		];
	}

	private static idCount = 1;

	public uniqueId = 'sp-virtual-scroll-' + (VirtualScrollComponent.idCount++) + '-' + (new Date()).getTime();

	@Element() el: HTMLElement;

	@Prop() items: any[] = [];

	@Prop() scrollbarWidth: number = 0;

	@Prop() scrollbarHeight: number = 0;

	@Prop() childWidth: number;

	@Prop() childHeight: number;

	@Prop() bufferAmount: number = 0;

	@Prop() scrollAnimationTime: number = 1500;
	
	@Prop() parentScroll: Element | Window;

	@Prop() update: (list: any[]) => void;	

	@Prop() change: (event: ChangeEvent) => void;

	@Prop() start: (event: ChangeEvent) => void;

	@Prop() end: (event: ChangeEvent) => void;

	private viewPortItems: any[];
	private previousStart: number;
	private previousEnd: number;
	private startupLoop: boolean = true;
	private currentTween: any;
	
	private cumulativeHeights: Array<number> = [];
	private heightAvg: number;

	private itemCount: number;
	private itemsPerRow: number;
	private itemsPerCol: number;

	private disposeScrollHandler: () => void | undefined;
	private disposeResizeHandler: () => void | undefined;

	/** Cache of the last scroll height to prevent setting CSS when not needed. */
	private _scrollHeight = -1;

	/** Cache of the last top padding to prevent setting CSS when not needed. */
	private lastTopPadding = -1;

	constructor() {
		console.log('virtual-scroll');	
	}

	public componentWillLoad() {
		console.log('componentWillLoad');
		this.addParentEventHandlers(this.parentScroll || this.el);
	}

	public componentDidLoad() {
		console.log('componentDidLoad');
		this.refresh();
	}

	public componentDidUnload() {
		this.removeParentEventHandlers();
	}

	public componentWillUpdate() {
		console.log('componentWillUpdate');
		this.refresh();
	}

	public refresh(forceViewportUpdate: boolean = false) {
		console.log('refresh');		
		window.requestAnimationFrame(() => this.calculateItems(forceViewportUpdate));
	}

	public scrollInto(item: any) {
		let el: Element = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.el;
		let index: number = (this.items || []).indexOf(item);
		if (index < 0 || index >= (this.items || []).length) return;

		let scrollTop = (Math.floor(index / this.itemsPerRow) * this.heightAvg)
			- (this.heightAvg * Math.min(index, this.bufferAmount));

		let animationRequest;

		if (this.currentTween != undefined) this.currentTween.stop()

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

		const animate = (time?) => {
			this.currentTween.update(time);
			if (this.currentTween._object.scrollTop !== scrollTop) {
				animationRequest = window.requestAnimationFrame(animate);
			}
		}

		animate()
	}

	private addParentEventHandlers(parentScroll: Element | Window) {
		this.removeParentEventHandlers();
		console.log('parentScroll');	

		if (parentScroll) {
			const handler = () => this.refresh();

			parentScroll.addEventListener('scroll', handler);
			this.disposeScrollHandler = () => parentScroll.removeEventListener('scroll', handler);

			if (parentScroll instanceof Window) {
				window.addEventListener('resize', handler);
				this.disposeResizeHandler = () => window.removeEventListener('resize', handler);
			}
		}
	}

	private removeParentEventHandlers() {
		if (this.disposeScrollHandler) {
			this.disposeScrollHandler();
			this.disposeScrollHandler = undefined;
		}
		if (this.disposeResizeHandler) {
			this.disposeResizeHandler();
			this.disposeResizeHandler = undefined;
		}
	}

	private getContent(): HTMLElement {
		return this.el.shadowRoot.querySelector('.scrollable-content');
	}

	private getShimElement(): HTMLElement {
		return (this.el.shadowRoot.querySelector('.total-padding') as HTMLElement);
	}

	private countItemsPerRow() {
		let offsetTop;
		let itemsPerRow;
		let children = this.el.children;
		let len = children && children.length || 0;

		for (itemsPerRow = 0; itemsPerRow < len; itemsPerRow++) {
			let child = (children[itemsPerRow] as HTMLElement);

			if (offsetTop != undefined && offsetTop !== child.offsetTop) {
				break
			};

			offsetTop = child.offsetTop;
		}

		return itemsPerRow;
	}

	private getElementsOffset(): number {
		let offsetTop = 0;

		if (this.parentScroll) {
			offsetTop += this.el.offsetTop;
		}

		return offsetTop;
	}

	private calculateItems(forceViewportUpdate: boolean = false) {
		let el = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.el;

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

		let topPadding = this.cumulativeHeights[start - this.bufferAmount - 1] || 0;

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
			this.update && this.update(this.viewPortItems);

			console.log('slice', start, end);				

			// emit 'start' event
			if ((start !== this.previousStart) && (this.startupLoop === false)) {
				this.start && this.start({ start, end });
			}

			// emit 'end' event
			if ((end !== this.previousEnd) && (this.startupLoop === false)) {
				this.end && this.end({ start, end });
			}

			this.previousStart = start;
			this.previousEnd = end;

			if (this.startupLoop === true) {
				this.refresh();
			} else {
				this.change && this.change({ start, end });
			}
		} else if (this.startupLoop === true) {
			this.startupLoop = false;
			this.refresh();
		}
	}

	private calculateDimensions() {
		let el: Element = this.parentScroll instanceof Window ? document.body : this.parentScroll || this.el;
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

		if (itemsPerCol === 1 && Math.floor(scrollTop / scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
			itemsPerRow = itemsPerRowByCalc;
		}

		console.log('scrollHeight', scrollHeight, childHeight, itemCount, itemsPerRow, itemsPerCol);	

		if (scrollHeight !== this._scrollHeight) {
			let shim = this.getShimElement();
			shim.style.height = `${scrollHeight}px`;
			this._scrollHeight = scrollHeight;
		}

		this.heightAvg = childHeight;
		this.itemCount = itemCount;
		this.itemsPerRow = itemsPerRow;
		this.itemsPerCol = itemsPerCol;
	}

	private calculateCurrentIndex(scrollTop: number) {
		let indexByScrollTop: number = null;

		let childrenContent = this.el.children;

		if (childrenContent && childrenContent.length) {
			let previousStart = this.previousStart || 0;
			let heightAvg: number = Math.max(this.heightAvg || 0, 1);

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
		} else {
			let indexByScrollTop = scrollTop / this._scrollHeight * this.itemCount / this.itemsPerRow;
	
			console.log('indexByScrollTop', indexByScrollTop, scrollTop, this._scrollHeight);
		}

		return indexByScrollTop;
	}
}