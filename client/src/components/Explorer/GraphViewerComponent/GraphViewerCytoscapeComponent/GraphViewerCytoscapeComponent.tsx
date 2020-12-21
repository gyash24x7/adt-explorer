// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape, {
	BaseLayoutOptions,
	BreadthFirstLayoutOptions,
	CircleLayoutOptions,
	ConcentricLayoutOptions,
	Core,
	CoseLayoutOptions,
	EventObject,
	GridLayoutOptions,
	NodeSingular,
	NullLayoutOptions,
	PresetLayoutOptions,
	RandomLayoutOptions
} from "cytoscape";
import fcose from "cytoscape-fcose";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import klay from "cytoscape-klay";
import dblclick from "cytoscape-dblclick";

import {
	colaOptions,
	colors,
	dagreOptions,
	fcoseOptions,
	graphStyles,
	klayOptions
} from "./config";
import { getUniqueRelationshipId } from "../../../../utils/utilities";
import "./GraphViewerCytoscapeComponent.scss";
import { settingsService } from "../../../../services/SettingsService";
import { DigitalTwin, Relationship } from "../../../../services/models/DataModel";

export type LayoutOptions =
	| NullLayoutOptions
	| CoseLayoutOptions
	| BaseLayoutOptions
	| BreadthFirstLayoutOptions
	| CircleLayoutOptions
	| RandomLayoutOptions
	| PresetLayoutOptions
	| GridLayoutOptions
	| ConcentricLayoutOptions;

cytoscape.use(klay);
cytoscape.use(dagre);
cytoscape.use(cola);
cytoscape.use(fcose);
cytoscape.use(dblclick);

export const GraphViewerCytoscapeLayouts: Record<string, LayoutOptions> = {
	Cola: colaOptions,
	Dagre: dagreOptions,
	fCoSE: fcoseOptions,
	Klay: klayOptions
};

export type GraphViewerCytoscapeComponentProps = {
	onNodeClicked?: (data?: {
		selectedNode?: NodeSingular;
		selectedNodes?: NodeSingular[];
	}) => Promise<void>;
	onEdgeClicked?: (data: any) => void;
	onControlClicked?: (e: EventObject) => void;
	onNodeDoubleClicked?: (data?: { id: any }) => void;
};

export class GraphViewerCytoscapeComponent extends Component<GraphViewerCytoscapeComponentProps> {
	state = {};
	graphControl: Core | undefined = undefined;
	selectedNodes: NodeSingular[] = [];
	layout = "Klay";

	addTwins(twins: DigitalTwin[]) {
		const mapped = twins
			.filter(x => this.graphControl!.$id(x.$dtId).length === 0)
			.map(x => ({
				data: {
					id: x.$dtId,
					label: x.$dtId,
					modelId: x.$metadata.$model,
					category: "Twin"
				}
			}));

		this.graphControl!.add(mapped);
	}

	removeTwins(twins: string[]) {
		if (twins) {
			twins.forEach(x => {
				const i = this.selectedNodes.findIndex(y => y.id() === x);
				if (i >= 0) {
					this.selectedNodes.splice(i, 1);
				}

				this.graphControl!.$id(x).remove();
			});
		}
	}

	hideSelectedTwins() {
		this.clearSelection();
		const cy = this.graphControl!;
		this.selectedNodes.forEach(x => {
			cy.$id(x.id()).toggleClass("hide", true);
		});
		cy.$(":selected").unselect();
		this.selectedNodes = [];
	}

	hideOtherTwins() {
		this.clearSelection();
		const cy = this.graphControl!;
		cy.nodes().forEach(node => {
			if (this.selectedNodes.filter(n => n.id() === node.id()).length === 0) {
				cy.$id(node.id()).toggleClass("hide", true);
			}
		});
	}

	hideNonChildren() {
		this.clearSelection();
		const cy = this.graphControl!;
		const relatedNodesIds = this.getSelectedNodesChildrenIds();
		cy.nodes().forEach(cyNode => {
			if (relatedNodesIds.indexOf(cyNode.id()) === -1) {
				cy.$id(cyNode.id()).toggleClass("hide", true);
			}
		});
	}

	getSelectedNodesChildrenIds() {
		const cy = this.graphControl!;
		const relatedNodesIds: string[] = [];

		const searchForChildren = (nodeIds: string[]) => {
			nodeIds.forEach(nodeId => {
				const selectedNode = cy.nodes().filter(n => n.id() === nodeId);
				const connectedEdges = selectedNode.connectedEdges();
				const selectedNodeRelatedNodesIds = connectedEdges
					.filter(edge => selectedNode.id() === edge.data().source)
					.map(edge => edge.data().target);
				relatedNodesIds.push(selectedNode.id());
				searchForChildren(selectedNodeRelatedNodesIds);
			});
		};

		searchForChildren(this.selectedNodes.map(n => n.id()));
		return relatedNodesIds;
	}

	hideWithChildren() {
		this.clearSelection();
		const cy = this.graphControl!;
		const relatedNodesIds = this.getSelectedNodesChildrenIds();

		cy.nodes().forEach(cyNode => {
			if (relatedNodesIds.indexOf(cyNode.id()) !== -1) {
				cy.$id(cyNode.id()).toggleClass("hide", true);
				cy.$id(cyNode.id()).unselect();
			}
		});

		cy.$(":selected").unselect();
		this.selectedNodes = [];
	}

	clearTwins() {
		this.selectedNodes = [];
		this.graphControl!.elements().remove();
	}

	getTwins() {
		return this.graphControl!.nodes().map(x => x.id());
	}

	addRelationships(relationships: Relationship[]) {
		const mapped = relationships
			.map(x => ({
				data: {
					source: x.$sourceId,
					target: x.$targetId,
					label: x.$relationshipName,
					id: getUniqueRelationshipId(x)
				}
			}))
			.filter(x => this.graphControl!.$id(x.data.id).length === 0);

		const checked = [];
		for (const rel of mapped) {
			const src = rel.data.source;
			const tar = rel.data.target;
			const el = this.graphControl!.nodes(`[id="${src}"]`);
			const elt = this.graphControl!.nodes(`[id="${tar}"]`);
			if (!el.empty() && !elt.empty()) {
				checked.push(rel);
			}
		}

		this.graphControl!.add(checked);
	}

	getRelationships() {
		return this.graphControl!.edges().map(x => x.id());
	}

	removeRelationships(relationships: string[]) {
		relationships.forEach(x => {
			this.graphControl!.$id(x).remove();
		});
	}

	getColor(i: number) {
		const im = i % colors.length;
		return colors[colors.length - 1 - im];
	}

	getBackgroundImage(modelId: string) {
		return settingsService.getModelImage(modelId);
	}

	clearSelection = () => {
		const cy = this.graphControl!;
		cy.nodes().forEach(cyNode => {
			cy.$id(cyNode.id()).toggleClass("opaque", false);
			cy.$id(cyNode.id()).toggleClass("highlight", false);
		});
		cy.edges().forEach(cyEdge => {
			cy.$id(cyEdge.id()).toggleClass("opaque", false);
			cy.$id(cyEdge.id()).toggleClass("highlight", false);
		});
	};

	showAllNodes = () => {
		const cy = this.graphControl!;
		cy.nodes().forEach(cyNode => {
			cy.$id(cyNode.id()).toggleClass("hide", false);
		});
		cy.edges().forEach(cyEdge => {
			cy.$id(cyEdge.id()).toggleClass("hide", false);
		});
	};

	doLayout() {
		const cy = this.graphControl!;
		cy.batch(() => {
			const types: any = {};
			const mtypes: any = {};
			const rtypes: any = {};
			const el = cy.nodes("*");
			const rels = cy.edges("*");

			// Color by type attribute
			for (let i = 0; i < el.length; i++) {
				types[el[i].data("type")] = `#${this.getColor(i)}`;
			}
			for (const t of Object.keys(types)) {
				cy.elements(`node[type="${t}"]`).style("background-color", types[t]);
			}

			// Color by model type
			for (let i = 0; i < el.length; i++) {
				mtypes[el[i].data("modelId")] = {
					backgroundColor: `#${this.getColor(i)}`,
					backgroundImage: this.getBackgroundImage(el[i].data("modelId"))
				};
			}
			for (const t of Object.keys(mtypes)) {
				const { backgroundColor, backgroundImage } = mtypes[t];
				cy.elements(`node[modelId="${t}"]`).style({
					"background-color": backgroundColor,
					"background-image": `url(${backgroundImage})`,
					"background-fit": "cover",
					"background-clip": "node"
				});
			}

			// Color relationships by label
			for (let i = 0; i < rels.length; i++) {
				rtypes[rels[i].data("label")] = `#${this.getColor(i)}`;
			}
			for (const r of Object.keys(rtypes)) {
				cy.elements(`edge[label="${r}"]`).style("line-color", rtypes[r]);
			}
		});

		return new Promise(resolve => {
			const layout = cy.layout(GraphViewerCytoscapeLayouts[this.layout]);
			layout.on("layoutstop", () => resolve());
			layout.run();
		});
	}

	setLayout(layout: string) {
		this.layout = layout;
	}

	updateModelIcon(modelId: string) {
		const cy = this.graphControl!;
		cy.elements(`node[modelId="${modelId}"]`).style({
			"background-image": `url(${this.getBackgroundImage(modelId)})`
		});
	}

	onNodeSelected = async ({ target }: EventObject) => {
		this.selectedNodes.push({ id: target.id(), modelId: target.data().modelId } as any);
		this.highlightRelatedNodes();
		await this.onNodeClicked();
	};

	onNodeUnselected = async (e: EventObject) => {
		const removed = this.selectedNodes.findIndex(x => x.id === e.target.id());

		if (removed >= 0) {
			this.selectedNodes.splice(removed, 1);
			this.highlightRelatedNodes();
			await this.onNodeClicked();
		}

		if (this.selectedNodes.length === 0) {
			this.clearSelection();
		}
	};

	onEdgeSelected = (e: EventObject) => {
		this.props.onEdgeClicked && this.props.onEdgeClicked(e.target.data());
	};

	onNodeClicked = async () => {
		if (this.props.onNodeClicked) {
			await this.props.onNodeClicked({
				selectedNode:
					this.selectedNodes.length > 0
						? this.selectedNodes[this.selectedNodes.length - 1]
						: undefined,
				selectedNodes: this.selectedNodes.length > 0 ? this.selectedNodes : undefined
			});
		}
	};

	onNodeDoubleClicked = (e: EventObject) => {
		if (this.props.onNodeDoubleClicked) {
			this.props.onNodeDoubleClicked({ id: e.target.id() });
		}
	};

	onControlClicked = (e: EventObject) => {
		if (e.target === this.graphControl && this.props.onControlClicked) {
			this.props.onControlClicked(e);
			this.clearSelection();
		}
	};

	highlightRelatedNodes() {
		const cy = this.graphControl!;
		cy.edges().toggleClass("highlighted", false);

		if (this.selectedNodes && this.selectedNodes.length > 0) {
			cy.edges().toggleClass("opaque", true);
			let relatedNodesIds: string[] = [];

			this.selectedNodes.forEach(selectedNodeItem => {
				const selectedNode: NodeSingular = cy.nodes().filter(n => n.id() === selectedNodeItem.id());
				const connectedEdges = selectedNode.connectedEdges();

				connectedEdges.forEach(edge => {
					cy.$id(edge.data().id).toggleClass("highlighted", true);
					cy.$id(edge.data().id).toggleClass("opaque", false);
				});

				const selectedNodeRelatedNodesIds = connectedEdges.map(edge =>
					selectedNode.id() === edge.data().source ? edge.data().target : edge.data().source
				);
				relatedNodesIds = relatedNodesIds.concat(selectedNodeRelatedNodesIds);
				relatedNodesIds.push(selectedNode.id());
			});

			cy.nodes().forEach(cyNode => {
				if (relatedNodesIds.indexOf(cyNode.id()) === -1) {
					cy.$id(cyNode.id()).toggleClass("opaque", true);
				} else {
					cy.$id(cyNode.id()).toggleClass("opaque", false);
				}
			});
		} else {
			cy.nodes().forEach(cyNode => {
				cy.$id(cyNode.id()).toggleClass("opaque", false);
			});

			cy.edges().toggleClass("opaque", false);
		}
	}

	zoomToFit() {
		this.graphControl!.fit();
	}

	center() {
		this.graphControl!.center();
	}

	render() {
		return (
			<CytoscapeComponent
				elements={[]}
				className="graph-control"
				stylesheet={graphStyles}
				maxZoom={2}
				cy={cy => {
					if (this.graphControl !== cy) {
						this.graphControl = cy;
						this.graphControl!.dblclick();
						this.graphControl!.on("select", "node", this.onNodeSelected);
						this.graphControl!.on("unselect", "node", this.onNodeUnselected);
						this.graphControl!.on("select", "edge", this.onEdgeSelected);
						this.graphControl!.on("click", this.onControlClicked);
						this.graphControl!.on("dblclick", "node", this.onNodeDoubleClicked);
					}
				}}
			/>
		);
	}
}
