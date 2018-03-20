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
		let items = (this.items || []).concat('.'.repeat(this.amount).split('').map(
			(_, idx) => ({ name: 'item-' + (idx + aux), text: 'Item ' + (idx + aux) })
		));
		
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
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>
				Hello, World! I'm {this.first} {this.last}<br/>

				<sp-virtual-scroll 
					items={this.items} 
					update={scrollItems => this.updateItems(scrollItems)}
					parentScroll={this.el}
					buffer={10}
				>
					{(this.scrollItems || []).map(item => {				
						return (<div class={item.name} style={ {'width': '100%'} }>{item.text}</div>)
					})}
				</sp-virtual-scroll>
			</div>
		);
	}
}
