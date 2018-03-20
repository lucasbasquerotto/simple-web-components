import { Component, Element, Prop, State } from '@stencil/core';

interface Item {
	name: string;
	text: string;
}
@Component({
	tag: 'my-component',
	styleUrl: 'my-component.css',
	shadow: true
})
export class MyComponent {

	@Element() el: HTMLElement;

	@Prop() first: string;
	@Prop() last: string;

	private count = 0;
	private amount = 40000;
	private intervals = [3000, 6000];

	@State() items: Array<Item> = this.createItems();
	@State() scrollItems: Array<Item>;

	private updateItems(scrollItems: Array<Item>) {
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
		for (let interval of (this.intervals || [])) {
			setTimeout(() => this.items = this.createItems(), interval);
		}
	}

	public render() {
		return (
			<div>
				Hello, World! I'm {this.first} {this.last}<br/>

				<sp-virtual-scroll 
					items={this.items} 
					onUpdate={scrollItems => this.updateItems(scrollItems)}
					onVirtualChange={event => console.log('onVirtualChange', event)}
					onStart={event => console.log('onStart', event)}
					onEnd={event => console.log('onEnd', event)}
					parentScroll={this.el}
					buffer={10}
				>
					{(this.scrollItems || []).map(item => {				
						return (<div class={item.name} style={ {'width': '100%'} }>
							<div style={ {'width': '100%'} }>{item.text}</div>
							{item.text.split('').map(c => <div style={ {'width': '100%'} }>|{c}|</div>)}
						</div>);
					})}
				</sp-virtual-scroll>
				
				Hello, World! I'm {this.first} {this.last}<br/>
			</div>
		);
	}
}
