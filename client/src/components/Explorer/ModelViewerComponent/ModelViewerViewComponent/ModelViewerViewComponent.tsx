// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, FocusZone, FocusZoneTabbableElements } from "@fluentui/react";
import jsonMarkup from "json-markup";

import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";
import { apiService } from "../../../../services/ApiService";
import { print } from "../../../../services/LoggingService";

import "./ModelViewerViewComponent.scss";
import { ModelItem } from "../ModelViewerComponent";

export class ModelViewerViewComponent extends Component {
	state = { isLoading: false, showModal: false, model: null as any };

	getMarkup = (model: any) => {
		return { __html: jsonMarkup(model) as string };
	};

	open = async (item: ModelItem) => {
		this.setState({ showModal: true, isLoading: true, model: null });

		let data = {} as any;
		try {
			data = await apiService.getModelById(item.key);
		} catch (exp) {
			print(`Error in retrieving model. Requested ${item.key}. Exception: ${exp}`, "error");
		}

		this.setState({ model: data.model ? data.model : data, isLoading: false });
	};

	close = (e: any) => {
		e.preventDefault();
		this.setState({ showModal: false });
	};

	render() {
		const { model, showModal, isLoading } = this.state;
		return (
			<ModalComponent isVisible={showModal} isLoading={isLoading} className="mv-model-view-modal">
				<FocusZone
					handleTabKey={FocusZoneTabbableElements.all}
					isCircularNavigation
					defaultActiveElement="#close-model-btn"
				>
					<form onSubmit={this.close}>
						<h2 className="heading-2">Model Information</h2>
						<div className="pre-wrapper modal-scroll">
							{model && <pre dangerouslySetInnerHTML={this.getMarkup(model)} />}
						</div>
						<div className="btn-group">
							<DefaultButton
								id="close-model-btn"
								className="modal-button close-button"
								type="submit"
								onClick={this.close}
							>
								Close
							</DefaultButton>
						</div>
					</form>
				</FocusZone>
			</ModalComponent>
		);
	}
}
