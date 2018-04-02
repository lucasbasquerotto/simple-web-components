import { Component, Element, Prop, State } from '@stencil/core';

export interface VirtualScrollExampleItem {
	name: string;
	text: string;
}

@Component({
	tag: 'virtual-scroll-example',
	styleUrl: 'virtual-scroll-example.pcss',
	shadow: true
})
export class VirtualScrollExample {

	@Element() el: HTMLElement;

	@Prop() first: string;
	@Prop() last: string;

	private count = 0;
	private amount = 400;//00;
	private repeater = '.'.repeat(0).split('');
	private intervals = [];//[3000, 6000];
	private parentScroll: HTMLElement;
	private buffer = 10;
	private useParent = false;

	@State() items: Array<VirtualScrollExampleItem> = this.createItems();
	@State() scrollItems: Array<VirtualScrollExampleItem>;

	private updateItems(scrollItems: Array<VirtualScrollExampleItem>) {
		console.log('updateItems', scrollItems, (this.items || []).length);		
		this.scrollItems = scrollItems;
	}

	private createItems() {
		let aux = (this.count * this.amount) + 1;
		this.count++;
		let items = (this.items || []).concat('.'.repeat(this.amount).split('').map((_, idx) => ({ 
			name: 'item-' + (idx + aux), 
			text: 'Item ' + (idx + aux),
			// text: 'Item ' + ((this.amount * (this.intervals.length + 1)) - (idx + aux)),
		})));
		
		console.log('createItems', items.length);
		
		return items;
	}

	public componentDidLoad() {
		this.parentScroll = this.useParent ? this.el.shadowRoot.querySelector('.container') : null;

		for (let interval of (this.intervals || [])) {
			setTimeout(() => this.items = this.createItems(), interval);
		}
	}

	render() {
		return (
			<div class={this.parentScroll ? 'container scroll-wrapper' : 'container'}>
				{(!this.parentScroll) ? null : this.repeater.map(
					() => (<div>Top Hello, World! I'm {this.first} {this.last}<br/><br/></div>)
				)}
				
				<sp-virtual-scroll 
					items={this.items} 
					onUpdate={event => this.updateItems(event.detail)}
					onChange={event => console.log('onVirtualChange', event.detail)}
					onStart={event => console.log('onStart', event.detail)}
					onEnd={event => console.log('onEnd', event.detail)}
					parentScroll={this.parentScroll}
					buffer={this.buffer}
				>
					<div slot="top">
						{this.repeater.map(() => <div>Top Section 0123456789 0123456789 0123456789<br/></div>)}
					</div>

					{(this.scrollItems || []).map(item => {				
						return (<div class={item.name} style={ {'width': '100%'} }>
							<div style={ {'width': '100%'} }>{item.text}</div>
							{item.text.split('').map(c => <div style={ {'width': '100%'} }>|{c}|</div>)}
						</div>);
					})}

					<div slot="bottom">
						{this.repeater.map(() => <div>Bottom Section 0123456789 0123456789 0123456789<br/></div>)}
					</div>
				</sp-virtual-scroll>
				
				{(!this.parentScroll) ? null : this.repeater.map(
					() => (<div>Bottom Hello, World! I'm {this.first} {this.last}<br/><br/></div>)
				)}
			</div>
		);
	}
}
