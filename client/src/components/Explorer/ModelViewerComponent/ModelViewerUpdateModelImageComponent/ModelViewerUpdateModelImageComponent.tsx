// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton } from "@fluentui/react";

import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";

import "./ModelViewerUpdateModelImageComponent.scss";
import { ModelItem } from "../ModelViewerComponent";

export type ModelViewerUpdateModelImageComponentProps = {
	onReplace: (item?: ModelItem) => void;
	onDelete: (modelId: string) => void;
};

export class ModelViewerUpdateModelImageComponent extends Component<ModelViewerUpdateModelImageComponentProps> {
	state = { showModal: false, item: undefined as ModelItem | undefined };

	open = (item: ModelItem) => {
		this.setState({ item, showModal: true });
	};

	cancel = () => {
		this.setState({ showModal: false });
	};

	getStyles = () => ({
		fieldGroup: [{ height: "32px" }]
	});

	update = () => {
		const { item } = this.state;
		this.props.onReplace(item);
		this.setState({ showModal: false });
	};

	delete = () => {
		const { item } = this.state;
		this.props.onDelete(item!.key);
		this.setState({ showModal: false });
	};

	render() {
		const { showModal } = this.state;
		return (
			<ModalComponent isVisible={showModal} className="mv-delete">
				<h2 className="heading-2">Model Image</h2>
				<div className="btn-group">
					<DefaultButton className="modal-button confirm-button" onClick={this.update}>
						Replace
					</DefaultButton>
					<DefaultButton className="modal-button confirm-button" onClick={this.delete}>
						Delete
					</DefaultButton>
					<DefaultButton className="modal-button cancel-button" onClick={this.cancel}>
						Cancel
					</DefaultButton>
				</div>
			</ModalComponent>
		);
	}
}
