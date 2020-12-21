// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { FocusZone, FocusZoneTabbableElements, IconButton, Toggle } from "@fluentui/react";

import { eventService } from "../../../services/EventService";
import { settingsService } from "../../../services/SettingsService";
import { ModalComponent } from "../../common/ModalComponent/ModalComponent";

import "./PreferencesFormComponent.scss";
import { OptionalComponentState } from "../../../routes/Explorer";

export type PreferencesFormComponentProps = {
	toggleOptionalComponent: (component: string) => void;
	optionalComponentsState: Record<"console" | "output", OptionalComponentState>;
};

export class PreferencesFormComponent extends Component<PreferencesFormComponentProps> {
	state = { showModal: false, eagerLoading: false, caching: false };

	componentDidMount() {
		eventService.subscribePreferences(this.loadExistingSettings);
	}

	loadExistingSettings = () => {
		this.setState({
			showModal: true,
			eagerLoading: settingsService.eagerLoading,
			caching: settingsService.caching
		});
	};

	closeSettings = (e: any) => {
		e.preventDefault();
		this.resetModalState();
	};

	resetModalState = () => {
		this.setState({ showModal: false, eagerLoading: false, caching: false });
	};

	getStyles = () => ({ root: { width: 250 } });

	onEagerLoadingChange = (_: any, checked = false) => {
		this.setState({ eagerLoading: checked });
		settingsService.eagerLoading = checked;
	};

	onCachingChange = (_: any, checked = false) => {
		this.setState({ caching: checked });
		settingsService.caching = checked;
	};

	onToggleOptionalComponentChange = (comp: string) => this.props.toggleOptionalComponent(comp);

	render() {
		const { optionalComponentsState } = this.props;
		const { showModal, eagerLoading, caching } = this.state;

		return (
			<ModalComponent isVisible={showModal} className="preference-settings">
				<FocusZone
					handleTabKey={FocusZoneTabbableElements.all}
					isCircularNavigation
					defaultActiveElement="#eagerLoadingField"
				>
					<form>
						<IconButton
							iconProps={{ iconName: "Clear" }}
							ariaLabel="Close Preferences Modal"
							className="pr-close-icon"
							onClick={this.closeSettings}
						/>
						<h2 className="heading-2">Performance</h2>
						<Toggle
							id="eagerLoadingField"
							className="configuration-input"
							checked={eagerLoading}
							onChange={this.onEagerLoadingChange}
							label="Eager Loading"
							inlineLabel
						/>
						<Toggle
							id="cachingField"
							className="configuration-input"
							checked={caching}
							onChange={this.onCachingChange}
							label="Caching"
							inlineLabel
						/>
						<h2 className="heading-2">View</h2>
						<Toggle
							id="showConsoleField"
							className="configuration-input"
							checked={optionalComponentsState.console.visible}
							onChange={() => this.onToggleOptionalComponentChange("console")}
							label="Console"
							inlineLabel
						/>
						<Toggle
							id="showOutputField"
							className="configuration-input"
							checked={optionalComponentsState.output.visible}
							onChange={() => this.onToggleOptionalComponentChange("output")}
							label="Output"
							inlineLabel
						/>
					</form>
				</FocusZone>
			</ModalComponent>
		);
	}
}
