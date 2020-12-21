declare module "jsonlint";
declare module "react-excel-renderer";
declare module "react-console-emulator" {
	import * as React from "react";

	interface OptionProps {
		autoFocus?: boolean;
		dangerMode?: boolean;
		disableOnProcess?: boolean;
		noDefaults?: boolean;
		noAutomaticStdout?: boolean;
		noHistory?: boolean;
		noAutoScroll?: boolean;
	}

	interface LabelProps {
		welcomeMessage: boolean | string | string[];
		promptLabel: string;
		errorText?: string;
	}

	interface CommandProps {
		commands?: Record<
			string,
			{ description: string; usage?: string; fn: (...args: string[]) => any }
		>;
		commandCallback?: () => {};
	}

	export type TerminalProps = CommandProps & LabelProps & OptionProps & StyleProps;

	export default class Terminal extends React.Component<TerminalProps, {}> {}
}

declare module "cytoscape-cola";
declare module "cytoscape-dagre";
declare module "cytoscape-klay";
declare module "cytoscape-fcose";
declare module "react-cytoscapejs" {
	import cytoscape, { ElementDefinition, LayoutOptions, Stylesheet } from "cytoscape";
	import { CSSProperties, FC } from "react";

	type CytoscapeComponentProps = {
		id?: string;
		cy?: (cy: cytoscape.Core) => void;
		style?: CSSProperties;
		elements: ElementDefinition[];
		layout?: LayoutOptions;
		stylesheet?: Stylesheet | Stylesheet[] | string;
		className?: string;
		zoom?: number;
		pan?: Position;
		minZoom?: number;
		maxZoom?: number;
		zoomingEnabled?: boolean;
		userZoomingEnabled?: boolean;
		boxSelectionEnabled?: boolean;
		autoungrabify?: boolean;
		autounselectify?: boolean;
	};

	interface CytoscapeComponentInterface extends FC<CytoscapeComponentProps> {
		normalizeElements(
			data: { nodes: ElementDefinition[]; edges: ElementDefinition[] } | ElementDefinition[]
		): ElementDefinition[];
	}

	const CytoscapeComponent: CytoscapeComponentInterface;

	export = CytoscapeComponent;
}

declare module "json-markup";
declare module "jsoneditor-react";
