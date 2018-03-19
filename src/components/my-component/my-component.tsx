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

	private items: Array<Item> = '.'.repeat(1000000).split('').map(
		(_, idx) => ({ name: 'item-' + (idx + 1), text: 'Item ' + (idx + 1) })
	);
	@State() scrollItems: Array<Item>;

	private updateItems(scrollItems: Array<Item>) {
		console.log('updateItems', scrollItems);		
		this.scrollItems = scrollItems;
	}

	render() {
		console.log('items', this.items);
		
		return (
			<div>
				Hello, World! I'm {this.first} {this.last}

				<sp-virtual-scroll 
					items={this.items} 
					update={scrollItems => this.updateItems(scrollItems)}
					childHeight={30}
					parentScroll={this.el}
				>
					{(this.scrollItems || []).map(item => {				
						return (<div class={item.name} style={ {'width': '100%'} }>{item.text}</div>)
					})}
				</sp-virtual-scroll>
			</div>
		);
	}
}
