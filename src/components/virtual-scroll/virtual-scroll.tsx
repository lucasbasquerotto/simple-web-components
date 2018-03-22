import { Component, Element, Prop } from '@stencil/core';

// import * as tween from '@tweenjs/tween.js';

export interface VirtualScrollChangeEvent {
	start?: number;
	end?: number;
}

interface ChildInfo {
	idx: number; 
	totalHeight: number; 
	itemHeight: number;
}

interface PositionsInfo {
	currentIdx: number;
	start: number;
	end: number;
	beforePadding: number; 
	beforeEmpty: number; 
	afterPadding: number; 
	afterEmpty: number;
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

	@Prop() ignoreClass: string;
	
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
	// private lastScrollTop: number;
	private lastIdx: number;
	private totalScrollHeight: number;
	private beforeEmpty: number;
	// private currentTween: any;
	
	private previousIntervals = new Set<{ start: number; end: number }>();

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

	public refresh(forceUpdate = false, calculatePosition = false) {	
		window.requestAnimationFrame(() => this.calculateItems(forceUpdate, calculatePosition));
	}

	private addParentEventHandlers() {
		if (this.parentScroll !== this.lastParentScroll) {
			this.lastParentScroll = this.parentScroll;
			let scrollWrapper = this.getScrollWrapper();
	
			this.removeParentEventHandlers();
			console.log('scrollWrapper', scrollWrapper);	
	
			if (scrollWrapper) {
				const handler = () => {
					console.log('scroll');	
					this.previousIntervals.clear();				
					this.refresh(false, true);
				};
	
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

	private calculateItems(forceUpdate = false, calculatePosition = false) {
		let { start = 0, startBuffer = 0, end = 0, endBuffer = 0 } = this.calculateValues(calculatePosition);
		const changed = (start !== this.previousStart) || (end !== this.previousEnd);

		if (forceUpdate) {
			this.previousIntervals.clear();
		}

		if (changed && !forceUpdate) {
			for (let previousInterval of this.previousIntervals) {
				if ((start === previousInterval.start) && (end === previousInterval.end)) {
					return;
				}
			}
		}

		if (changed) {
			this.previousIntervals.add({ start, end });
		}

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

				// const showAmount = end - start;
			}
		}
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

	private calculateValues(calculatePosition: boolean) {
		let el = this.getScrollWrapper();
		let elScrollTop = el.scrollTop;
		let children = this.getChildren();

		let offsetTop = this.parentScroll ? this.el.offsetTop : 0;
		let scrollTop = Math.max(0, elScrollTop - offsetTop);
		// const lastScrollTop = this.lastScrollTop || 0;
		const itemCount = (this.items || []).length;
		const buffer = Math.max(0, this.buffer || 0);

		const dataList = this.createChildInfoList(children) || [];

		if (!dataList.length) {
			const start = 0;
			const end = Math.min(Math.max(buffer, 2), itemCount);
			return { start, startBuffer: start, end, endBuffer: end };
		}

		const heightAvg = dataList.reduce((prev, item) => prev + item.itemHeight, 1) / dataList.length;

		let currentIdx = this.lastIdx || 0;
		
		if (calculatePosition) {			
			currentIdx = this.calculateCurrentIndex(dataList, heightAvg, scrollTop);
			this.lastIdx = currentIdx;
			// this.lastScrollTop = scrollTop;
			// console.log('calculatePosition', currentIdx, this.lastIdx);
		}

		let viewHeight = el.clientHeight || 0;

		let positions = this.calculatePositions(dataList, currentIdx, heightAvg, viewHeight);
		const { start, end, beforeEmpty, beforePadding, afterPadding, afterEmpty } = positions;

		if (currentIdx !== positions.currentIdx) {
			console.log('different', currentIdx, positions.currentIdx);			
			currentIdx = positions.currentIdx;
			this.lastIdx = currentIdx;
		}
		
		let startBuffer = start - buffer - 1;
		startBuffer = Math.max(0, startBuffer);

		let endBuffer = end + buffer + 1;
		endBuffer = Math.min(endBuffer, itemCount);

		if (beforeEmpty !== this.beforeEmpty) {
			console.log('beforeEmpty', beforeEmpty, this.beforeEmpty, beforePadding, itemCount);

			let content = this.getContent();
			content.style.transform = `translateY(${beforeEmpty}px)`;
			content.style.webkitTransform = `translateY(${beforeEmpty}px)`;
			this.beforeEmpty = beforeEmpty;
		}

		let scrollHeight =  beforeEmpty + beforePadding + viewHeight + afterPadding + afterEmpty;
		const totalScrollHeight = Math.max(0, scrollHeight + offsetTop);

		if (totalScrollHeight !== this.totalScrollHeight) {
			console.log('totalScrollHeight', totalScrollHeight, this.totalScrollHeight, scrollHeight, itemCount);

			let shim = this.getShimElement();
			shim.style.height = `${scrollHeight}px`;
			this.totalScrollHeight = scrollHeight;
		}

		console.log('viewHeight', viewHeight, offsetTop, heightAvg);

		console.log('calc', start, startBuffer, end, endBuffer, ' - ', currentIdx, ' - ', scrollTop, scrollHeight);
/*
		let scrollHeight = Math.max(0, (this.totalScrollHeight || 0) - offsetTop);

		if (children && children.length) {
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
			showCount = Math.min(showCount, itemCount);
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
		*/
		return { start, startBuffer, end, endBuffer };
	}

	private createChildInfoList(children: Array<HTMLElement>) {
		const dataList: Array<ChildInfo> = [];
		let current = this.previousStartBuffer || 0;

		if (children && children.length) {
			for (let child of children) {
				let childHeight = child.getBoundingClientRect().height || 0;
				const slot = child.attributes.getNamedItem('slot');
				let ignore = (this.ignoreClass && child.classList.contains(this.ignoreClass)) || slot;
				let group = dataList[current];
				let totalHeight = (group && group.totalHeight) || 0;
				let itemHeight = (group && group.itemHeight) || 0;
				totalHeight += childHeight;
				itemHeight = ignore ? itemHeight : (itemHeight + childHeight);
				dataList[current] = { idx: current, totalHeight, itemHeight };
				current = ignore ? current : (current + 1);
			}
		}

		return dataList;
	}

	private calculateCurrentIndex(dataList: Array<ChildInfo>, heightAvg: number, scrollTop: number) {
		let currentIdx = 0;
		
		if (scrollTop) {
			let distance = Math.max(scrollTop - (this.beforeEmpty || 0), 0);
			let i = 0;

			// Iterate the loaded items to calculate the height
			while (distance && (i < dataList.length)) {
				let item = dataList[i];
				let values = this.calculateItemDistance(item, currentIdx, distance);
				console.log('calculateCurrentIndex', currentIdx, values.currentIdx, distance, values.currentDistance);

				currentIdx = values.currentIdx;
				distance = values.currentDistance;
			}

			// If the scroll jumped outside all the previous showing items the average is used
			if (distance) {
				currentIdx += (distance / heightAvg);
			}
		}

		return currentIdx;
	}

	// private calculateCurrentIndex(dataList: Array<ChildInfo>, heightAvg: number, distance: number) {
	// 	let currentIdx = this.lastIdx || 0;
		
	// 	// For the initial item (from the last time) and the previous or later items
	// 	if (distance) {
	// 		let reverse = (distance < 0);
	// 		let dataListAux = dataList.filter(
	// 			item => reverse ? (item.idx < currentIdx) :  (item.idx >= currentIdx)
	// 		);
	// 		dataListAux = reverse ? dataListAux.reverse() : dataListAux;
	// 		let len = dataListAux.length;

	// 		for (let count = 0; (count < len) && distance; count++) {
	// 			let item = dataListAux[count];
	// 			let values = this.calculateItemDistance(item, currentIdx, distance);
	// 			console.log('calculateCurrentIndex', currentIdx, values.currentIdx, distance, values.currentDistance);

	// 			currentIdx = values.currentIdx;
	// 			distance = values.currentDistance;
	// 		}
	// 	}

	// 	// If the scroll jumped outside all the previous showing items the average is used
	// 	if (distance) {
	// 		currentIdx += (distance / heightAvg);
	// 	}

	// 	return currentIdx;
	// }
	
	private calculateItemDistance(item: ChildInfo, currentIdx: number, currentDistance: number) {
		let height = (item && item.totalHeight) || 0;

		if (height && currentDistance) {
			// The later part of the item (from the scroll position)
			let diffHeight = (Math.floor(currentIdx + 1) - currentIdx) * height;

			if (currentDistance < 0) {
				// The previous part of the item (the total minus the later part)
				diffHeight = height - diffHeight;
				diffHeight = diffHeight || height;
			}

			if (currentDistance > 0) {
				currentIdx = Math.floor(currentIdx + 1);

				if (diffHeight > currentDistance) {
					currentIdx -= ((diffHeight - currentDistance) / height);
					currentDistance = 0;
				} else {
					currentDistance -= diffHeight;
				}
			} else {
				let currentDistanceAux = -currentDistance;
				currentIdx = Math.ceil(currentIdx - 1);

				if (diffHeight > currentDistanceAux) {
					currentIdx += ((diffHeight - currentDistanceAux) / height);
					currentDistance = 0;
				} else {
					currentDistance = -(currentDistanceAux - diffHeight);
				}
			}
		}

		return { currentIdx, currentDistance }
	}
	
	private calculatePositions(dataList: Array<ChildInfo>, currentIdx: number, heightAvg: number, viewHeight: number): PositionsInfo {
		const roundedIdx = Math.floor(currentIdx);
		const itemCount = (this.items || []).length;

		currentIdx = Math.max(currentIdx, 0);
		currentIdx = Math.min(currentIdx, itemCount);

		let beforeCount = 0;
		let beforePadding = 0;

		let afterCount = 0;
		let afterPadding = -viewHeight;

		const start = roundedIdx;
		let end = start;

		dataList.forEach(item => {
			if (item.idx < roundedIdx) {				
				beforeCount += item.itemHeight ? 1 : 0;
				beforePadding += item.totalHeight;
			} else if (item.idx === roundedIdx) {
				beforePadding += (item.totalHeight * (currentIdx - roundedIdx));
				afterPadding += (item.totalHeight * (roundedIdx + 1 - currentIdx));
			} else {
				if (item.itemHeight && (afterPadding < 0)) {
					end++;
				}

				afterCount += item.itemHeight ? 1 : 0;
				afterPadding += item.totalHeight;
			}
		});
		
		let newIdx = currentIdx;

		// The currentIdx is bellow the maximum position that the top of the page can go
		// And the the last item in the viewport (end) is the last of all items
		// Change the currentIdx value to the lesser value
		if ((afterPadding < 0) && (end === (itemCount - 1)) && (start > 0)) {

			if (beforePadding + afterPadding > 0) {
				let reverseItems = dataList.reverse();

				for (let item of reverseItems) {
					newIdx = item.idx;
					let dimensions = this.calculateItemDistance(item, newIdx, afterPadding);
					newIdx = dimensions.currentIdx;
					afterPadding = dimensions.currentDistance;

					if (afterPadding >= 0) {
						break;
					}
				}
			} else {
				afterPadding += beforePadding;
				newIdx = dataList[0].idx;
			}

			if (afterPadding < 0) {
				newIdx += (afterPadding / heightAvg);
			}
		}

		if (newIdx !== currentIdx) {
			return this.calculatePositions(dataList, newIdx, heightAvg, viewHeight);
		}

		const beforeAmountEmpty = Math.max(roundedIdx - beforeCount, 0);
		const beforeEmpty = beforeAmountEmpty * heightAvg;

		const afterAmountEmpty = Math.max(itemCount - (roundedIdx + 1 + afterCount), 0);
		const afterEmpty = afterAmountEmpty * heightAvg;

		// there is space left and there are items that can be shown after
		const incomplete = (afterPadding < 0) && (end < (itemCount - 1));

		if (incomplete) {
			end += Math.ceil(-(afterPadding / heightAvg));
		}

		end = Math.min(end, itemCount);

		return { currentIdx, start, end, beforePadding, beforeEmpty, afterPadding, afterEmpty };
	}

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