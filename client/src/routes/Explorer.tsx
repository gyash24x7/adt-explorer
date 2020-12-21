import React, { Component } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { GoldenLayoutComponent } from "../components/Explorer/GoldenLayoutComponent/GoldenLayoutComponent";
import { GraphViewerComponent } from "../components/Explorer/GraphViewerComponent/GraphViewerComponent";
import { ModelViewerComponent } from "../components/Explorer/ModelViewerComponent/ModelViewerComponent";
import { PropertyInspectorComponent } from "../components/Explorer/PropertyInspectorComponent/PropertyInspectorComponent";
import { OutputComponent } from "../components/Explorer/OutputComponent/OutputComponent";
import { QueryComponent } from "../components/Explorer/QueryComponent/QueryComponent";
import { ImportComponent } from "../components/Explorer/ImportComponent/ImportComponent";
import { ExportComponent } from "../components/Explorer/ExportComponent/ExportComponent";
import { ConsoleComponent } from "../components/Explorer/ConsoleComponent/ConsoleComponent";
import { ErrorMessageComponent } from "../components/Explorer/ErrorMessageComponent/ErrorMessage";
import LoaderComponent from "../components/common/LoaderComponent/LoaderComponent";

import Messages from "../messages/messages";
import { eventService } from "../services/EventService";
import optionalComponents from "../utils/optionalComponents";
import goldenLayoutConfig from "../utils/goldenLayoutConfig";
import { AppPage } from "../components/common/AppPage";

const initialState = {
	isLoading: false,
	console: { visible: false } as OptionalComponentState,
	output: { visible: false } as OptionalComponentState
};

export type OptionalComponentState = { visible: boolean };

export type ExplorerState = typeof initialState;

export class Explorer extends Component<any, ExplorerState> {
	importComponentConfig = {
		title: "IMPORT",
		type: "react-component",
		component: "importComponent",
		id: "importComponent"
	};

	exportComponentConfig = {
		title: "EXPORT",
		type: "react-component",
		component: "exportComponent",
		id: "exportComponent"
	};

	goldenLayout = React.createRef<GoldenLayoutComponent>();
	state = initialState;

	componentDidMount() {
		eventService.subscribeImport((evt: any) => {
			const config = { props: { file: evt.file }, ...this.importComponentConfig };
			this.goldenLayout.current?.addComponent(config, 1, 1);
		});
		eventService.subscribeExport((evt: any) => {
			const config = { props: { query: evt.query }, ...this.exportComponentConfig };
			this.goldenLayout.current?.addComponent(config, 1, 1);
		});
		eventService.subscribeCloseComponent((component: any) => {
			this.goldenLayout.current?.removeComponent(component);
		});
		eventService.subscribeLoading((isLoading: boolean) => this.setState({ isLoading }));
	}

	toggleOptionalComponent = (id: string) => {
		let component;
		let isComponentVisible;
		let newState: Partial<ExplorerState>;

		switch (id) {
			case "console":
				component = optionalComponents[0];
				isComponentVisible = this.state.console.visible;
				newState = { console: { visible: !isComponentVisible } };
				break;
			case "output":
				component = optionalComponents[0];
				isComponentVisible = this.state.output.visible;
				newState = { output: { visible: !isComponentVisible } };
				break;
		}

		if (component) {
			if (isComponentVisible) {
				this.goldenLayout.current?.removeComponent(component.config.component);
			} else {
				this.goldenLayout.current?.addComponent(component.config, component.row);
			}

			this.setState(prevState => ({ ...prevState, ...newState }));
		}
	};

	onGoldenLayoutTabCreated = (tab: any) => {
		const componentName = tab.contentItem.config.component;
		let newState: Partial<ExplorerState>;

		switch (componentName) {
			case "consoleComponent":
				newState = { console: { visible: false } };
				break;

			case "outputComponent":
				newState = { output: { visible: false } };
				break;
		}

		if (componentName === "consoleComponent" || componentName === "outputComponent") {
			tab.closeElement.click(() => {
				this.setState(prevState => ({ ...prevState, ...newState }));
			});
		}
	};

	goldenLayoutComponentError = (error: Error, componentStack: string) =>
		console.error(Messages.error.render(error, componentStack, "GraphViewerCommandBar Component"));

	renderErrorPage = () => (
		<div className="error-page">
			<span>
				Azure Digital Twins Explorer has encountered an error. Please refresh the page to continue.
			</span>
		</div>
	);

	render() {
		const { isLoading, ...optionalComponentsState } = this.state;
		return (
			<>
				<ErrorBoundary
					onError={this.goldenLayoutComponentError}
					fallbackRender={this.renderErrorPage}
				>
					<AppPage
						optionalComponents={optionalComponents}
						optionalComponentsState={optionalComponentsState}
						toggleOptionalComponent={this.toggleOptionalComponent}
					>
						<GoldenLayoutComponent
							ref={this.goldenLayout}
							htmlAttrs={{ className: "work-area" }}
							config={goldenLayoutConfig}
							onTabCreated={this.onGoldenLayoutTabCreated}
							registerComponents={gLayout => {
								gLayout.registerComponent("graph", GraphViewerComponent);
								gLayout.registerComponent("modelViewer", ModelViewerComponent);
								gLayout.registerComponent("propInspector", PropertyInspectorComponent);
								gLayout.registerComponent("outputComponent", OutputComponent);
								gLayout.registerComponent("queryComponent", QueryComponent);
								gLayout.registerComponent("importComponent", ImportComponent);
								gLayout.registerComponent("exportComponent", ExportComponent);
								gLayout.registerComponent("consoleComponent", ConsoleComponent);
							}}
						/>
					</AppPage>
				</ErrorBoundary>
				<ErrorMessageComponent />
				{isLoading && <LoaderComponent />}
			</>
		);
	}
}
