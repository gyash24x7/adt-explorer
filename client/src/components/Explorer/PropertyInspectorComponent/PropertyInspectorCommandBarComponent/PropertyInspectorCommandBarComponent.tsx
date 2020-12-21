// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar, ICommandBarItemProps } from "@fluentui/react";

export type PropertyInspectorCommandBarComponentProps = {
	buttonClass?: string;
	onExpand: () => void;
	onCollapse: () => void;
	onUndo: () => void;
	onRedo: () => void;
	onSave: () => void;
	changed?: boolean;
	selection?: boolean;
};

export class PropertyInspectorCommandBarComponent extends Component<PropertyInspectorCommandBarComponentProps> {
	buttonClass = this.props.buttonClass;

	farItems: ICommandBarItemProps[] = [
		{
			key: "expandTree",
			text: "Expand Tree",
			iconProps: { iconName: "ExploreContent" },
			onClick: () => this.props.onExpand(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "collapseTree",
			text: "Collapse Tree",
			iconProps: { iconName: "CollapseContent" },
			onClick: () => this.props.onCollapse(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "undo",
			text: "Undo",
			iconProps: { iconName: "Undo" },
			onClick: () => this.props.onUndo(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "redo",
			text: "Redo",
			iconProps: { iconName: "Redo" },
			onClick: () => this.props.onRedo(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "save",
			text: "Patch Twin",
			iconProps: { iconName: "Save" },
			onClick: () => this.props.onSave(),
			iconOnly: true,
			className: this.buttonClass
		}
	];

	render() {
		const { changed, selection } = this.props;
		this.farItems.forEach(x => (x.disabled = !selection));
		this.farItems[this.farItems.length - 1].disabled = !changed;

		return (
			<div>
				<CommandBar
					items={[]}
					farItems={this.farItems}
					ariaLabel="Use left and right arrow keys to navigate between commands"
				/>
			</div>
		);
	}
}
