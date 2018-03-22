import { Component, Element, Prop } from '@stencil/core';

// import * as tween from '@tweenjs/tween.js';

export interface VirtualScrollChangeEvent {
	start?: number;
	end?: number;
}

@Component({
	tag: 'sp-virtual-scroll',
	styleUrl: 'virtual-scroll.pcss',
	shadow: true
})
export class VirtualScrollComponent {

	@Element() el: HTMLElement;

	@Prop() items: any[] = [];

	@Prop() buffer: number = 0;

	@Prop() scrollAnimationTime: number = 1500;
	
	@Prop() parentScroll: HTMLElement;

	@Prop() update: (list: any[]) => void;	

	@Prop() change: (event: VirtualScrollChangeEvent) => void;

	@Prop() start: (event: VirtualScrollChangeEvent) => void;

	@Prop() end: (event: VirtualScrollChangeEvent) => void;

	private lastParentScroll: HTMLElement;
	private lastItems: any[];
	private viewPortItems: any[];
	private previousStart: number;
	private previousStartBuffer: number;
	private previousEnd: number;
	// private currentTween: any;
	
	private cumulativeHeights: Array<number> = [];
	private showAmountLoop = new Set<number>();

	// Cache of the last scroll height to prevent setting CSS when not needed. 
	private totalScrollHeight = -1;

	// Cache of the last top padding to prevent setting CSS when not needed. 
	private lastTopPadding = -1;

	private disposeScrollHandler: () => void | undefined;

	constructor() {
		console.log('virtual-scroll');	
	}

	public componentDidLoad() {
		console.log('componentDidLoad');
		this.addParentEventHandlers();
		this.refresh(true);
	}

	public componentDidUnload() {
		this.removeParentEventHandlers();
	}

	public componentWillUpdate() {
		const force = (this.items !== this.lastItems);
		console.log('componentWillUpdate', force);
		this.lastItems = this.items;
		this.addParentEventHandlers();
		this.refresh(force);
	}

	public refresh(forceViewportUpdate: boolean = false) {	
		window.requestAnimationFrame(() => this.calculateItems(forceViewportUpdate));
	}

	private addParentEventHandlers() {
		if (this.parentScroll !== this.lastParentScroll) {
			this.lastParentScroll = this.parentScroll;
			let scrollWrapper = this.getScrollWrapper();
	
			this.removeParentEventHandlers();
			console.log('scrollWrapper', scrollWrapper);	
	
			if (scrollWrapper) {
				const handler = () => this.refresh();
	
				scrollWrapper.addEventListener('scroll', handler);
				this.disposeScrollHandler = () => scrollWrapper.removeEventListener('scroll', handler);
			}
		}
	}

	private removeParentEventHandlers() {
		if (this.disposeScrollHandler) {
			this.disposeScrollHandler();
			this.disposeScrollHandler = undefined;
		}
	}

	private getScrollWrapper(): HTMLElement {
		if (this.parentScroll) {
			return this.parentScroll;
		}

		let root = this.el.shadowRoot || this.el;
		return root && root.querySelector('.scroll-wrapper');
	}

	private getContent(): HTMLElement {
		let root = this.el.shadowRoot || this.el;
		return root && root.querySelector('.scrollable-content');
	}

	private getShimElement(): HTMLElement {
		let root = this.el.shadowRoot || this.el;
		return root && root.querySelector('.total-padding');
	}

	private getChildren(): Array<HTMLElement> {
		let childrenContent = this.el.shadowRoot && this.el.children;

		if (!this.el.shadowRoot) {
			const content = this.getContent();
			childrenContent = content.children;
		}

		let children: Array<HTMLElement> = null;

		if (childrenContent) {
			children = (Array.from(childrenContent) as Array<HTMLElement>);
		}

		return children;
	}

	private calculateItems(forceUpdate: boolean = false) {
		let { start = 0, startBuffer = 0, end = 0, endBuffer = 0 } = this.calculateValues();
		const changed = (start !== this.previousStart) || (end !== this.previousEnd);

		if (changed || forceUpdate) {
			let items = this.items || [];
			this.viewPortItems = items.slice(startBuffer, endBuffer);
			this.update && this.update(this.viewPortItems);

			console.log('slice', start, end, startBuffer, endBuffer, changed);	

			if (changed) {
				// emit 'start' event
				if ((start !== this.previousStart) && (start === 0)) {
					this.start && this.start({ start, end });
				}
	
				// emit 'end' event
				if ((end !== this.previousEnd) && (end === (items.length - 1))) {
					this.end && this.end({ start, end });
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
		}

		this.showAmountLoop.clear();
	}

	private calculateValues() {
		let el = this.getScrollWrapper();
		let elScrollTop = el.scrollTop;
		let children = this.getChildren();
		let itemCount = (this.items || []).length;

		let offsetTop = this.parentScroll ? this.el.offsetTop : 0;
		let scrollHeight = Math.max(0, (this.totalScrollHeight || 0) - offsetTop);
		let scrollTop = Math.max(0, elScrollTop - offsetTop);
		let viewHeight = el.clientHeight || 0;		

		let startIdx = 0;
		let showCount = 0;
		let heightAvg = 0;
		let slotHeight = 0;

		if (children && children.length) {
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

			for (let child of children) {
				let childHeight = child.getBoundingClientRect().height || heightAvg;
				const slot = child.attributes.getNamedItem('slot');	
				
				if (slot) {
					slotHeight += childHeight;
				} else {
					console.log('child', child.clientTop, child.scrollTop, child.offsetTop, cumulativeHeight);
					
					cumulativeHeight += childHeight;
					cumulativeHeights[current] = cumulativeHeight;
					current++;
				}
			}

			heightAvg = Math.max(cumulativeHeight / current, 1);			

			while ((scrollTop + viewHeight > cumulativeHeight) && (current < itemCount)) {
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

		scrollHeight = (heightAvg * itemCount) + slotHeight;
		const totalScrollHeight = Math.max(0, scrollHeight + offsetTop);

		if (totalScrollHeight !== this.totalScrollHeight) {
			let shim = this.getShimElement();
			shim.style.height = `${scrollHeight}px`;
			this.totalScrollHeight = scrollHeight;

			console.log('totalScrollHeight', totalScrollHeight, scrollHeight, itemCount);	
		}

		console.log('viewHeight', viewHeight, offsetTop, heightAvg);

		console.log('calc', start, startBuffer, end, endBuffer, ' - ', startIdx, showCount, ' - ', slotHeight, scrollTop, scrollHeight);

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
		if (this.parentScroll) {
			return (
				<div class="scroll-inner">
					<div class="total-padding"></div>
					<div class="scrollable-content">
						<slot/>
					</div>
				</div>
			);
		} else {
			return (
				<div class="scroll-wrapper">
					<div class="scroll-inner">
						<div class="total-padding"></div>
						<div class="scrollable-content">
							<slot name="top"/>
							<slot/>
							<slot name="bottom"/>
						</div>
					</div>
				</div>
			);
		}
	}
}