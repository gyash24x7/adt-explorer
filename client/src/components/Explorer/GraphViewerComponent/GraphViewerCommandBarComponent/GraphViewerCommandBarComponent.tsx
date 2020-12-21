// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component, Fragment } from "react";
import { CommandBar, ICommandBarItemProps, Icon, TextField } from "@fluentui/react";

import { GraphViewerRelationshipCreateComponent } from "../GraphViewerRelationshipCreateComponent/GraphViewerRelationshipCreateComponent";
import { GraphViewerRelationshipViewerComponent } from "../GraphViewerRelationshipViewerComponent/GraphViewerRelationshipViewerComponent";
import { GraphViewerTwinDeleteComponent } from "../GraphViewerTwinDeleteComponent/GraphViewerTwinDeleteComponent";
import { GraphViewerRelationshipDeleteComponent } from "../GraphViewerRelationshipDeleteComponent/GraphViewerRelationshipDeleteComponent";
import { eventService } from "../../../../services/EventService";
import { settingsService } from "../../../../services/SettingsService";
import { REL_TYPE_ALL, REL_TYPE_INCOMING, REL_TYPE_OUTGOING } from "../../../../services/Constants";

import "./GraphViewerCommandBarComponent.scss";
import { NodeSingular } from "cytoscape";
import { Relationship } from "../../../../services/models/DataModel";

export type GraphViewerCommandBarComponentProps = {
	className?: string;
	buttonClass: string;
	onShowAll: () => void;
	onTriggerHide: () => void;
	onHide: () => void;
	onHideWithChildren: () => void;
	onHideOthers: () => void;
	onHideNonChildren: () => void;
	onLayoutClicked: () => void;
	onZoomToFitClicked: () => void;
	onCenterClicked: () => void;
	onTwinsHide?: () => void;
	selectedNode?: NodeSingular;
	selectedNodes: NodeSingular[];
	onTwinDelete: (ids?: string[]) => void;
	onRelationshipCreate: (relationship?: Relationship) => void;
	query: string;
	onGetCurrentNodes: () => void;
	selectedEdge: any;
	canShowAll: boolean;
	onLayoutChanged: (layout: any) => void;
	layouts: string[];
	layout: string;
	hideMode: string;
};

export class GraphViewerCommandBarComponent extends Component<GraphViewerCommandBarComponentProps> {
	buttonClass = this.props.buttonClass;
	view = React.createRef<GraphViewerRelationshipViewerComponent>();
	create = React.createRef<GraphViewerRelationshipCreateComponent>();
	delete = React.createRef<GraphViewerTwinDeleteComponent>();
	deleteRel = React.createRef<GraphViewerRelationshipDeleteComponent>();
	importModelRef = React.createRef<HTMLInputElement>();
	settings = React.createRef();
	state = {
		relTypeLoading: settingsService.relTypeLoading,
		relExpansionLevel: settingsService.relExpansionLevel.toString()
	};

	farItems: ICommandBarItemProps[] = [
		{
			key: "deleteTwin",
			text: "Delete Selected Twins",
			ariaLabel: "delete selected twins",
			iconProps: { iconName: "Delete" },
			onClick: () => this.delete.current!.open(),
			iconOnly: true,
			disabled: !this.props.selectedNode,
			className: this.buttonClass
		},
		{
			key: "getRelationship",
			text: "Get Relationships",
			ariaLabel: "get relationships",
			iconProps: { iconName: "Relationship" },
			onClick: () => this.view.current!.open(),
			iconOnly: true,
			className: this.buttonClass,
			disabled: !this.props.selectedNodes || this.props.selectedNodes.length !== 1
		},
		{
			key: "addRelationship",
			text: "Add Relationship",
			ariaLabel: "add relationship",
			iconProps: { iconName: "AddLink" },
			onClick: () => this.create.current!.open(),
			iconOnly: true,
			className: this.buttonClass,
			disabled: !this.props.selectedNodes || this.props.selectedNodes.length !== 2
		},
		{
			key: "deleteRelationship",
			text: "Delete Relationship",
			ariaLabel: "delete relationship",
			iconProps: { iconName: "RemoveLink" },
			onClick: () => this.deleteRel.current!.open(),
			iconOnly: true,
			className: this.buttonClass,
			disabled: !this.props.selectedEdge
		},
		{
			key: "exportGraph",
			text: "Export Graph",
			iconProps: { iconName: "CloudDownload" },
			onClick: () => this.onExportGraphClicked(),
			iconOnly: true,
			className: this.buttonClass,
			disabled: !this.props.query
		},
		{
			key: "importGraph",
			text: "Import Graph",
			iconProps: { iconName: "CloudUpload" },
			onClick: () => this.importModelRef.current!.click(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "expansionLevel",
			text: "Expansion Level",
			ariaLabel: "Select number of layers to expand",
			iconProps: { iconName: "Org" },
			className: this.buttonClass,
			iconOnly: true,
			commandBarButtonAs: () => this.renderRelationshipExpansionItem()
		},
		{
			key: "showTwins",
			text: "Show All",
			iconProps: { iconName: "RedEye" },
			onClick: () => this.props.onShowAll(),
			iconOnly: true,
			className: this.buttonClass,
			disabled: !this.props.canShowAll
		},
		{
			key: "hideTwins",
			text: "Hide",
			ariaLabel: "show all twins",
			iconProps: { iconName: "Hide" },
			iconOnly: true,
			split: true,
			onClick: () => this.props.onTriggerHide(),
			disabled: !this.props.selectedNodes,
			className: `${this.buttonClass} command-bar-dropdown`,
			subMenuProps: {
				items: [
					{
						key: "hide-selected",
						text: "Hide selected",
						ariaLabel: "Hide selected",
						iconProps: { iconName: "hide-selected" === this.props.hideMode ? "CheckMark" : "" },
						onClick: () => this.props.onHide()
					},
					{
						key: "hide-with-children",
						text: "Hide selected and children",
						ariaLabel: "Hide selected and children",
						iconProps: {
							iconName: "hide-with-children" === this.props.hideMode ? "CheckMark" : ""
						},
						onClick: () => this.props.onHideWithChildren()
					},
					{
						key: "hide-others",
						text: "Hide all others",
						ariaLabel: "Hide all others",
						iconProps: { iconName: "hide-others" === this.props.hideMode ? "CheckMark" : "" },
						onClick: () => this.props.onHideOthers()
					},
					{
						key: "hide-non-children",
						text: "Hide non-children",
						ariaLabel: "Hide non children",
						iconProps: { iconName: "hide-non-children" === this.props.hideMode ? "CheckMark" : "" },
						onClick: () => this.props.onHideNonChildren()
					}
				]
			}
		},
		{
			key: "expansionMode",
			text: "Expansion Mode",
			ariaLabel: "select expansion mode",
			iconOnly: true,
			iconProps: { iconName: "ModelingView" },
			className: `${this.buttonClass} command-bar-dropdown`,
			split: true,
			subMenuProps: {
				items: [
					{
						key: REL_TYPE_INCOMING,
						text: "In",
						ariaLabel: "In",
						iconProps: {
							iconName: this.state.relTypeLoading === REL_TYPE_INCOMING ? "CheckMark" : ""
						},
						onClick: () => this.onSelectedRelTypeChange(REL_TYPE_INCOMING)
					},
					{
						key: REL_TYPE_OUTGOING,
						text: "Out",
						ariaLabel: "Out",
						iconProps: {
							iconName: this.state.relTypeLoading === REL_TYPE_OUTGOING ? "CheckMark" : ""
						},
						onClick: () => this.onSelectedRelTypeChange(REL_TYPE_OUTGOING)
					},
					{
						key: REL_TYPE_ALL,
						text: "In/Out",
						ariaLabel: "In/Out",
						iconProps: {
							iconName: this.state.relTypeLoading === REL_TYPE_ALL ? "CheckMark" : ""
						},
						onClick: () => this.onSelectedRelTypeChange(REL_TYPE_ALL)
					}
				]
			}
		},
		{
			key: "relayout",
			text: "Run Layout",
			ariaLabel: "run layout",
			iconOnly: true,
			iconProps: { iconName: "ArrangeSendToBack" },
			onClick: () => this.props.onLayoutClicked(),
			className: this.buttonClass,
			split: true,
			subMenuProps: {
				items: this.props.layouts.map(x => ({
					key: x,
					text: x,
					ariaLabel: x.toLowerCase(),
					iconProps: { iconName: this.props.layout === x ? "CheckMark" : "" },
					onClick: () => this.props.onLayoutChanged(x)
				}))
			},
			disabled: !this.props.query
		},
		{
			key: "zoomToFit",
			text: "Zoom to Fit",
			ariaLabel: "zoom to fit",
			iconOnly: true,
			iconProps: { iconName: "ZoomToFit" },
			onClick: () => this.props.onZoomToFitClicked(),
			className: this.buttonClass
		},
		{
			key: "centerGraph",
			text: "Center Graph",
			ariaLabel: "center graph",
			iconOnly: true,
			iconProps: { iconName: "FitPage" },
			onClick: () => this.props.onCenterClicked(),
			className: this.buttonClass
		}
	];

	renderRelationshipExpansionItem = () => (
		<div className="expansion-level-option">
			<Icon iconName="Org" />
			<TextField
				id="relExpansionLevelField"
				className="command-bar-input configuration-input numeric-input"
				value={this.state.relExpansionLevel}
				onChange={this.onExpansionLevelChange}
				type="number"
				min="1"
				max="5"
			/>
		</div>
	);

	onSelectedRelTypeChange = (type: string) => {
		settingsService.relTypeLoading = type;
		this.setState({ relTypeLoading: type });
	};

	onExpansionLevelChange = (evt: any) => {
		this.setState({ relExpansionLevel: evt.target.value });
		settingsService.relExpansionLevel = parseInt(evt.target.value);
	};

	onImportGraphClicked = (evt: any) => {
		eventService.publishImport({ file: evt.target.files[0] });
		this.importModelRef.current!.value = "";
	};

	onExportGraphClicked() {
		const { query } = this.props;
		eventService.publishExport({ query });
	}

	render() {
		const {
			selectedNode,
			selectedNodes,
			onTwinDelete,
			onRelationshipCreate,
			query,
			onGetCurrentNodes,
			selectedEdge
		} = this.props;

		return (
			<Fragment>
				<CommandBar
					items={[]}
					className={"gv-commandbar" + this.props.className || ""}
					farItems={this.farItems}
					ariaLabel="Use left and right arrow keys to navigate between commands"
				/>
				<input
					id="file-input"
					type="file"
					name="name"
					className="gc-fileInput"
					ref={this.importModelRef}
					onChange={this.onImportGraphClicked}
				/>
				<GraphViewerRelationshipCreateComponent
					ref={this.create}
					selectedNode={selectedNode}
					selectedNodes={selectedNodes}
					onCreate={onRelationshipCreate}
				/>
				<GraphViewerRelationshipViewerComponent selectedNode={selectedNode} ref={this.view} />
				<GraphViewerTwinDeleteComponent
					selectedNode={selectedNode}
					selectedNodes={selectedNodes}
					query={query}
					ref={this.delete}
					onDelete={onTwinDelete}
					onGetCurrentNodes={onGetCurrentNodes}
				/>
				<GraphViewerRelationshipDeleteComponent selectedEdge={selectedEdge} ref={this.deleteRel} />
			</Fragment>
		);
	}
}
