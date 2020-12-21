// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import {
	DefaultButton,
	FocusZone,
	FocusZoneTabbableElements,
	PrimaryButton,
	TextField
} from "@fluentui/react";

import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";
import { ModelService } from "../../../../services/ModelService";
import { apiService } from "../../../../services/ApiService";
import { print } from "../../../../services/LoggingService";
import { eventService } from "../../../../services/EventService";

import "./ModelViewerCreateComponent.scss";
import { ModelItem } from "../ModelViewerComponent";

export type ModelViewerCreateComponentProps = {};

export type ModelViewerCreateComponentState = {
	showModal: boolean;
	isLoading: boolean;
	name: string;
	error: string;
	item?: ModelItem;
};

export class ModelViewerCreateComponent extends Component<
	ModelViewerCreateComponentProps,
	ModelViewerCreateComponentState
> {
	state: ModelViewerCreateComponentState = {
		showModal: false,
		isLoading: false,
		name: "",
		error: ""
	};

	open = (item: ModelItem) => {
		this.setState({ item, showModal: true, name: "", error: "" });
	};

	cancel = (e: any) => {
		e.preventDefault();
		this.setState({ showModal: false });
	};

	onNameChange = (evt: any) => {
		this.setState({ name: evt.target.value });
	};

	getStyles = () => ({
		fieldGroup: [{ height: "32px" }]
	});

	save = async (e: any) => {
		e.preventDefault();
		const { name, item } = this.state;
		if (name === "") {
			this.setState({ error: "Please enter a value." });
			return;
		}

		this.setState({ isLoading: true });
		try {
			print(`*** Creating a twin instance`, "info");
			const modelService = new ModelService();
			const payload = await modelService.createPayload(item!.key);
			print("Generated model payload:", "info");
			print(JSON.stringify(payload, null, 2), "info");

			const twinResult = await apiService.addTwin(name, payload);
			print("*** Creation result:", "info");
			print(JSON.stringify(twinResult, null, 2), "info");

			eventService.publishCreateTwin({ $dtId: name, $metadata: { $model: item!.key } });
		} catch (exc) {
			exc.customMessage = "Error in instance creation";
			eventService.publishError(exc);
		}

		this.setState({ showModal: false, isLoading: false });
	};

	render() {
		const { showModal, name, error, isLoading } = this.state;
		return (
			<ModalComponent isVisible={showModal} isLoading={isLoading} className="mv-create">
				<FocusZone
					handleTabKey={FocusZoneTabbableElements.all}
					isCircularNavigation
					defaultActiveElement="#outlined-required"
				>
					<form onSubmit={this.save}>
						<h2 className="heading-2">New Twin Name</h2>
						<TextField
							required
							errorMessage={error}
							id="outlined-required"
							className="name-input"
							styles={this.getStyles}
							value={name}
							onChange={this.onNameChange}
							autoFocus
						/>
						<div className="btn-group">
							<PrimaryButton type="submit" className="modal-button save-button">
								Save
							</PrimaryButton>
							<DefaultButton className="modal-button cancel-button" onClick={this.cancel}>
								Cancel
							</DefaultButton>
						</div>
					</form>
				</FocusZone>
			</ModalComponent>
		);
	}
}
