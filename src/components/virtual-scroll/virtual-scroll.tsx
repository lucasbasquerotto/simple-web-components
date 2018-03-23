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
	startBuffer: number;
	start: number;
	end: number;
	endBuffer: number;
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
	private previousEndBuffer: number;
	private previousEnd: number;
	// private lastScrollTop: number;
	private lastIdx: number;
	private totalScrollHeight: number;
	private beforeEmpty: number;
	// private currentTween: any;
	
	private previousIntervals = new Set<string>();

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
		const values = this.calculateValues(calculatePosition);

		if (values == null) {
			return;
		}

		const { start = 0, startBuffer = 0, end = 0, endBuffer = 0 } = values;
		const changed = (start !== this.previousStart) || (end !== this.previousEnd);

		if (forceUpdate) {
			this.previousIntervals.clear();
		}

		if (changed && !forceUpdate) {
			if (this.previousIntervals.has(`${start}|${end}`)) {
				return;
			}
		}

		if (changed) {
			this.previousIntervals.add(`${start}|${end}`);
		}

		if (changed || forceUpdate) {
			let items = this.items || [];
			this.viewPortItems = items.slice(startBuffer, endBuffer);
			this.update && this.update(this.viewPortItems);

			console.log('slice', startBuffer, start, end, endBuffer, changed);	

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
				this.previousEndBuffer = endBuffer;

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

		let previousStartBuffer = this.previousStartBuffer || 0;
		const dataList = VirtualScrollComponent.createChildInfoList(children, previousStartBuffer, this.ignoreClass) || [];
		const currentItemsCount = dataList.filter(item => !!item.itemHeight).length;

		if (!currentItemsCount) {
			const start = 0;
			const startBuffer = 0;
			const end = Math.min(Math.max(buffer, 2), itemCount - 1);
			const endBuffer = Math.min(end + buffer, itemCount - 1);
			console.log('initial');			
			return { start, startBuffer, end, endBuffer };
		}

		const heightAvg = dataList.reduce((prev, item) => prev + item.itemHeight, 1) / currentItemsCount;
		console.log('heightAvg', heightAvg, dataList);
		

		let currentIdx = this.lastIdx || 0;
		
		if (calculatePosition) {			
			currentIdx = VirtualScrollComponent.calculateCurrentIndex(dataList, heightAvg, scrollTop, this.beforeEmpty);
			this.lastIdx = currentIdx;
			// this.lastScrollTop = scrollTop;
			// console.log('calculatePosition', currentIdx, this.lastIdx);
		}

		let viewHeight = el.clientHeight || 0;

		let positions = VirtualScrollComponent.calculatePositions(dataList, currentIdx, heightAvg, viewHeight, buffer, itemCount);
		let { startBuffer, start, end, endBuffer, beforeEmpty, beforePadding, afterPadding, afterEmpty } = positions;

		if (currentIdx !== positions.currentIdx) {
			console.log('different', currentIdx, positions.currentIdx);			
			currentIdx = positions.currentIdx;
			this.lastIdx = currentIdx;
		}

		let update = true;

		if (calculatePosition) {
			// When position is changed (like when scrolling is done) but the items are different, don't change the view
			if ((startBuffer !== this.previousStartBuffer) || (endBuffer !== this.previousEndBuffer)) {		
				update = false;
			}
		}

		if (update) {
			{
				// console.log('beforeEmpty', beforeEmpty, this.beforeEmpty, beforePadding, itemCount);
				let newScrollTop = beforeEmpty + beforePadding;
				// console.log('newScrollTop2', newScrollTop, el.scrollTop, scrollTop, ' - ' , offsetTop, beforeEmpty, beforePadding);		
				// el.scrollTop = newScrollTop;
				let beforeEmptyNew = beforeEmpty + (newScrollTop - scrollTop);
				const expectedIdx = VirtualScrollComponent.calculateCurrentIndex(dataList, heightAvg, newScrollTop, 0);
				console.log('expectedIdx', expectedIdx, currentIdx, beforeEmptyNew, newScrollTop, scrollTop, ' - ' , offsetTop, beforeEmpty, beforePadding);
			}
	
			if (beforeEmpty !== this.beforeEmpty) {
				console.log('beforeEmpty', beforeEmpty, this.beforeEmpty, beforePadding);
	
				let content = this.getContent();
				content.style.transform = `translateY(${beforeEmpty}px)`;
				content.style.webkitTransform = `translateY(${beforeEmpty}px)`;
				this.beforeEmpty = beforeEmpty;			
			}
	
			let scrollHeight = beforeEmpty + beforePadding + viewHeight + afterPadding + afterEmpty;
			const totalScrollHeight = Math.max(0, scrollHeight + offsetTop);

			console.log('viewHeight', viewHeight, offsetTop, heightAvg, ' - ', totalScrollHeight, scrollTop);
	
			if (totalScrollHeight !== this.totalScrollHeight) {
				console.log('totalScrollHeight', totalScrollHeight, this.totalScrollHeight, scrollHeight, itemCount);
	
				let shim = this.getShimElement();
				shim.style.height = `${scrollHeight}px`;
				this.totalScrollHeight = scrollHeight;
			}
	
			if (!calculatePosition) {
				// let newScrollTop = offsetTop + beforeEmpty + beforePadding;
				// console.log('newScrollTop', newScrollTop, el.scrollTop, scrollTop, ' - ' , offsetTop, beforeEmpty, beforePadding);		
				// el.scrollTop = newScrollTop;
			}
		}

		console.log('calc', startBuffer, start, end, endBuffer, ' - ', currentIdx, ' - ', scrollTop, update, calculatePosition);
		
		return { start, startBuffer, end, endBuffer };
	}

	private static createChildInfoList(children: Array<HTMLElement>, previousStartBuffer: number, ignoreClass: string) {
		const dataList: Array<ChildInfo> = [];
		let current = previousStartBuffer || 0;
		let diff = current; 

		if (children && children.length) {
			for (let child of children) {
				let childHeight = child.getBoundingClientRect().height || 0;
				const slot = child.attributes.getNamedItem('slot');
				let ignore = (ignoreClass && child.classList.contains(ignoreClass)) || slot;
				let group = dataList[current - diff];
				let totalHeight = (group && group.totalHeight) || 0;
				let itemHeight = (group && group.itemHeight) || 0;
				totalHeight += childHeight;
				itemHeight = ignore ? itemHeight : (itemHeight + childHeight);
				dataList[current - diff] = { idx: current, totalHeight, itemHeight };
				current = ignore ? current : (current + 1);
			}
		}

		return dataList;
	}

	private static calculateCurrentIndex(dataList: Array<ChildInfo>, heightAvg: number, scrollTop: number, beforeEmpty: number) {
		let currentIdx = 0;
		if (beforeEmpty) {}
		
		if (scrollTop) {
			let distance = Math.max(scrollTop, 0);
			let i = 0;
			let len = dataList.length;

			// Iterate the loaded items to calculate the height
			while (distance && (i < len)) {
				let item = dataList[i];
				let values = this.calculateItemDistance(item, currentIdx, distance);
				// console.log('calculateCurrentIndex', currentIdx, values.currentIdx, distance, values.currentDistance, item.totalHeight);

				currentIdx = values.currentIdx;
				distance = values.currentDistance;
				i++;
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
	
	private static calculateItemDistance(item: ChildInfo, currentIdx: number, currentDistance: number) {
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
	
	private static calculatePositions(dataList: Array<ChildInfo>, currentIdx: number, heightAvg: number, viewHeight: number, buffer: number, itemCount: number): PositionsInfo {
		const roundedIdx = Math.floor(currentIdx);

		currentIdx = Math.max(currentIdx, 0);
		currentIdx = Math.min(currentIdx, itemCount - 1);

		let beforePadding = 0;
		let afterPadding = -viewHeight;

		const start = roundedIdx;
		let end = start;

		buffer = Math.max(buffer || 0, 1);
		
		let startBuffer = start - buffer;
		startBuffer = Math.max(0, startBuffer);

		let first = null;
		let last = startBuffer;
		let beforeEmpty = 0;
		let beforeEmptyCount = 0;
		let afterEmpty = 0;
		let afterEmptyCount = 0;

		dataList.forEach(item => {
			if (item.idx < roundedIdx) {
				const totalHeight = item.totalHeight;
				const increment = item.itemHeight ? 1 : 0;

				if (increment) {
					first = first || item.idx;
				}

				if (item.idx >= startBuffer) {
					beforePadding += totalHeight;
				} else {
					beforeEmptyCount += increment;
					beforeEmpty += totalHeight;
				}
			} else if (item.idx === roundedIdx) {
				beforePadding += (item.totalHeight * (currentIdx - roundedIdx));
				afterPadding += (item.totalHeight * (roundedIdx + 1 - currentIdx));
			} else {
				if (item.itemHeight && (afterPadding < 0)) {
					end++;
				}
				
				const totalHeight = item.totalHeight;
				const increment = item.itemHeight ? 1 : 0;

				if (increment) {
					if (last < item.idx) {
						last = item.idx;
					}
				}

				if (item.idx <= (end + buffer)) {
					afterPadding += totalHeight;
				} else {
					afterEmptyCount += increment;
					afterEmpty += totalHeight;
				}

			}
		});

		// there is space left and there are items that can be shown after
		const incomplete = (afterPadding < 0) && (end < (itemCount - 1));

		if (incomplete) {
			end += Math.ceil(-(afterPadding / heightAvg));
		}

		end = Math.min(end, itemCount - 1);

		let endBuffer = end + buffer;
		endBuffer = Math.min(endBuffer, itemCount - 1);

		beforePadding += Math.max((first - startBuffer) * heightAvg, 0);
		afterPadding += Math.max((endBuffer - last) * heightAvg, 0);

		console.log('calcDimensions', 
			startBuffer, start, end, endBuffer, 
			' - ', 
			beforeEmpty, beforePadding, 
			' - ', 
			afterPadding, afterEmpty,
			' - ', 
			first, startBuffer, first - startBuffer, beforeEmptyCount
		);		
		
		// let newIdx = currentIdx;

		// The currentIdx is bellow the maximum position that the top of the page can go
		// And the the last item in the viewport (end) is the last of all items
		// Change the currentIdx value to the lesser value
		// if ((afterPadding < 0) && (end === (itemCount - 1)) && (start > 0)) {
		// 	if (beforePadding + afterPadding > 0) {
		// 		let reverseItems = dataList.reverse();

		// 		for (let item of reverseItems) {
		// 			newIdx = item.idx;
		// 			let dimensions = this.calculateItemDistance(item, newIdx, afterPadding);
		// 			newIdx = dimensions.currentIdx;
		// 			afterPadding = dimensions.currentDistance;

		// 			if (afterPadding >= 0) {
		// 				break;
		// 			}
		// 		}
		// 	} else {
		// 		afterPadding += beforePadding;
		// 		newIdx = dataList[0].idx;
		// 	}

		// 	if (afterPadding < 0) {
		// 		newIdx += (afterPadding / heightAvg);
		// 	}
		// }

		// if (newIdx !== currentIdx) {
		// 	console.log('calculatePositions again', newIdx, currentIdx, ' - ', afterPadding, afterEmpty);			
		// 	return this.calculatePositions(dataList, newIdx, heightAvg, viewHeight, buffer, itemCount);
		// }

		const beforeAmountEmpty = Math.max(startBuffer - beforeEmptyCount, 0);
		beforeEmpty += beforeAmountEmpty * heightAvg;

		const afterAmountEmpty = Math.max(itemCount - 1 - (endBuffer + afterEmptyCount), 0);
		afterEmpty += afterAmountEmpty * heightAvg;

		return { currentIdx, startBuffer, start, end, endBuffer, beforePadding, beforeEmpty, afterPadding, afterEmpty };
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