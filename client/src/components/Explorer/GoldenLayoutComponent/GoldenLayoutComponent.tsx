import React, { Component } from "react";
import ReactDOM from "react-dom";
import GoldenLayout, { Config, ItemConfigType } from "golden-layout";

import { eventService } from "../../../services/EventService";

import "golden-layout/src/css/goldenlayout-base.css";
import "./CustomTheme.scss";
import $ from "jquery";

Object.defineProperties(window, {
	$: { value: $, writable: true },
	jQuery: { value: $, writable: true },
	jquery: { value: $, writable: true }
});

export type GoldenLayoutComponentProps = {
	config?: Config;
	registerComponents?: (gLayout: GoldenLayout) => void;
	htmlAttrs: any;
	onTabCreated: (tab: any) => void;
};

export type GoldenLayoutComponentState = {
	renderPanels: any[];
};

export class GoldenLayoutComponent extends Component<
	GoldenLayoutComponentProps,
	GoldenLayoutComponentState
> {
	containerRef = React.createRef<any>();
	goldenLayoutInstance: GoldenLayout | null = null;

	state: GoldenLayoutComponentState = { renderPanels: [] };

	render() {
		const panels = Array.from(this.state.renderPanels || []);
		const { htmlAttrs } = this.props;
		return (
			<div ref={this.containerRef} {...htmlAttrs}>
				{panels.map(panel =>
					ReactDOM.createPortal(panel._getReactComponent(), panel._container.getElement()[0])
				)}
			</div>
		);
	}

	componentRender(reactComponentHandler: any) {
		this.setState(state => {
			const newRenderPanels = new Set(state.renderPanels);
			newRenderPanels.add(reactComponentHandler);
			return { renderPanels: [...newRenderPanels] };
		});
	}

	componentDestroy(reactComponentHandler: any) {
		this.setState(state => {
			const newRenderPanels = new Set(state.renderPanels);
			newRenderPanels.delete(reactComponentHandler);
			return { renderPanels: [...newRenderPanels] };
		});
	}

	updateDimensions = () => {
		const newWidth = window.innerWidth - 4;
		const newHeight = window.innerHeight - 34;

		if (this.goldenLayoutInstance) {
			const current = (this.goldenLayoutInstance.root
				? this.goldenLayoutInstance.root.contentItems![0].contentItems.map(x => x.config)
				: this.goldenLayoutInstance.config.content![0].content!
			).filter(x => x.content && x.content.length > 0);

			if (current.some((x: any) => x.extensions && x.extensions.height)) {
				let totalFixedHeight = 0;
				let totalAllocatedHeight = 0;
				current.forEach((x: any) => {
					if (x.extensions && x.extensions.height) {
						x.height = (x.extensions.height / newHeight) * 100;
						totalFixedHeight += x.height;
					} else {
						totalAllocatedHeight += x.height;
					}
				});

				current
					.filter((x: any) => !x.extensions || !x.extensions.height)
					.forEach(
						(x: any) =>
							(x.height = Math.max(100 - totalFixedHeight, 0) * (x.height / totalAllocatedHeight))
					);
			}

			this.goldenLayoutInstance.updateSize(newWidth, newHeight);
		}
	};

	componentDidMount() {
		this.goldenLayoutInstance = new GoldenLayout(
			this.props.config || {},
			this.containerRef.current
		);

		eventService.initialize(this.goldenLayoutInstance.eventHub);

		this.updateDimensions();
		window.addEventListener("resize", this.updateDimensions);
		if (this.props.registerComponents instanceof Function) {
			this.props.registerComponents(this.goldenLayoutInstance);
		}

		(this.goldenLayoutInstance as any).reactContainer = this;
		this.goldenLayoutInstance.init();
		this.goldenLayoutInstance.on("tabCreated", this.props.onTabCreated);
		this.goldenLayoutInstance.on("itemDestroyed", () => this.updateDimensions());
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.updateDimensions);
	}

	addComponent = (config: ItemConfigType, rowIndex = 99, stackIndex = 99, rowHeight = 30) => {
		const root = this.goldenLayoutInstance!.root.contentItems[0];
		const newRowIndex = Math.min(root.contentItems.length, rowIndex);

		let item = root.contentItems[newRowIndex];
		if (!item) {
			root.addChild({ type: "row", height: rowHeight });
			item = root.contentItems[newRowIndex];
		}

		if (item) {
			if (item.isStack) {
				item.parent.replaceChild(item, { type: "row", config: {} as ItemConfigType });
				root.contentItems[newRowIndex].addChild(item);
				item = root.contentItems[newRowIndex];
			}

			if (item.isRow) {
				const newStackIndex = Math.min(item.contentItems.length, stackIndex);
				if (newStackIndex >= item.contentItems.length) {
					item.addChild({ type: "stack" });
				}

				item = item.contentItems[newStackIndex];
			}

			item.addChild(config);
		}

		this.updateDimensions();
	};

	removeComponent = (componentName: string) => {
		const items = [this.goldenLayoutInstance!.root.contentItems[0]];

		for (let i = 0; i < items.length; i++) {
			const current = items[i];

			if (current.isComponent && current.config.id === componentName) {
				current.remove();
				break;
			}

			if (current.contentItems) {
				current.contentItems.forEach(x => items.push(x));
			}
		}
	};
}

const ReactComponentHandler = (GoldenLayout as any).__lm.utils.ReactComponentHandler;

class ReactComponentHandlerPatched extends ReactComponentHandler {
	_render() {
		// Instance of GoldenLayoutComponent class
		const reactContainer = this._container.layoutManager.reactContainer;
		if (reactContainer && reactContainer.componentRender) {
			reactContainer.componentRender(this);
		}
	}

	_destroy() {
		this._container.off("open", this._render, this);
		this._container.off("destroy", this._destroy, this);
	}

	_getReactComponent() {
		const defaultProps = {
			glEventHub: this._container.layoutManager.eventHub,
			glContainer: this._container
		};
		const props = $.extend(defaultProps, this._container._config.props);
		return React.createElement(this._reactClass, props);
	}
}

(GoldenLayout as any).__lm.utils.ReactComponentHandler = ReactComponentHandlerPatched;
