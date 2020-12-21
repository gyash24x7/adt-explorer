// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import {
	DefaultButton,
	Dropdown,
	IDropdownOption,
	IStyleFunction,
	ITextFieldStyleProps,
	ITextFieldStyles,
	TextField
} from "@fluentui/react";
import { v4 as uuidv4 } from "uuid";

import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";
import { apiService } from "../../../../services/ApiService";

import "../GraphViewerComponentShared.scss";
import { eventService } from "../../../../services/EventService";
import { ModelService } from "../../../../services/ModelService";
import { Relationship } from "../../../../services/models/DataModel";
import { NodeSingular } from "cytoscape";

export type GraphViewerRelationshipCreateComponentProps = {
	onCreate?: (relationship?: Relationship) => void;
	selectedNode?: NodeSingular;
	selectedNodes: NodeSingular[];
};

export class GraphViewerRelationshipCreateComponent extends Component<GraphViewerRelationshipCreateComponentProps> {
	state = {
		isLoading: false,
		showModal: false,
		relationshipItems: [] as any[],
		relationshipId: null as any,
		hasRequiredRelError: false
	};

	getStyles: IStyleFunction<ITextFieldStyleProps, ITextFieldStyles> = props => {
		const { required } = props;
		return {
			fieldGroup: [{ height: "20px" }, required && { fontSize: "10px", borderColor: "lightgray" }],
			subComponentStyles: { label: this.getLabelStyles }
		};
	};

	getLabelStyles: IStyleFunction<any, any> = props => {
		const { required } = props;
		return { root: [required && { fontSize: "10px" }] };
	};

	onSelectedRelChange = (_e: any, i?: IDropdownOption) => {
		this.setState({ relationshipId: i?.key, hasRequiredRelError: false });
	};

	save = async () => {
		const { onCreate } = this.props;
		const { relationshipId, relationshipItems } = this.state;

		if (relationshipId === null) {
			this.setState({ hasRequiredRelError: true });
		} else {
			const { sourceId, targetId } = this.getNodes();
			this.setState({ isLoading: true });
			try {
				const id = uuidv4();
				const rel = relationshipItems[relationshipId];
				await apiService.addRelationship(sourceId, targetId, rel, id);
				if (onCreate) {
					onCreate({
						$sourceId: sourceId,
						$relationshipId: id,
						$relationshipName: rel,
						$targetId: targetId
					});
				}
			} catch (exc) {
				exc.customMessage = "Error creating relationship";
				eventService.publishError(exc);
			}
			this.setState({ isLoading: false, showModal: false });
		}
	};

	cancel = () => {
		const { onCreate } = this.props;
		if (onCreate) onCreate();

		this.setState({ showModal: false });
	};

	open = async () => {
		this.setState({ showModal: true, isLoading: true });

		const { selectedNode, selectedNodes } = this.props;
		const sourceModelId = (selectedNodes.find(x => x.id() !== selectedNode?.id()) as any).modelId;
		const targetModelId = (selectedNode as any).modelId;

		try {
			const relationshipItems = await new ModelService().getRelationships(
				sourceModelId,
				targetModelId
			);
			this.setState({ relationshipItems });
		} catch (exc) {
			this.setState({ relationshipItems: [] });
			exc.customMessage = `Error in retrieving model. Requested ${sourceModelId}`;
			eventService.publishError(exc);
		}

		this.setState({ isLoading: false });
	};

	getNodes() {
		const { selectedNode, selectedNodes } = this.props;
		const source = selectedNodes && selectedNodes.find(x => x.id() !== selectedNode?.id());
		const sourceId = source ? source.id() : "";
		const targetId = selectedNode ? selectedNode.id() : "";

		return { sourceId, targetId };
	}

	render() {
		const {
			relationshipItems,
			relationshipId,
			isLoading,
			showModal,
			hasRequiredRelError
		} = this.state;
		const { sourceId, targetId } = this.getNodes();

		return (
			<ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
				<h2 className="heading-2">Create Relationship</h2>
				<h4>Source ID</h4>
				<TextField
					disabled
					readOnly
					id="sourceIdField"
					className="modal-input"
					styles={this.getStyles}
					value={sourceId}
				/>
				<h4>Target ID</h4>
				<TextField
					disabled
					readOnly
					id="targetIdField"
					className="modal-input"
					styles={this.getStyles}
					value={targetId}
				/>
				<h4>Relationship</h4>
				<Dropdown
					required
					placeholder="Select an option"
					className="modal-input"
					selectedKey={relationshipId}
					options={relationshipItems.map((q, i) => ({ key: i, text: q }))}
					styles={{
						dropdown: { width: 208 }
					}}
					errorMessage={hasRequiredRelError ? "Please select a relationship" : undefined}
					onChange={this.onSelectedRelChange}
				/>
				<div className="btn-group">
					<DefaultButton className="modal-button save-button" onClick={this.save}>
						Save
					</DefaultButton>
					<DefaultButton className="modal-button cancel-button" onClick={this.cancel}>
						Cancel
					</DefaultButton>
				</div>
			</ModalComponent>
		);
	}
}
