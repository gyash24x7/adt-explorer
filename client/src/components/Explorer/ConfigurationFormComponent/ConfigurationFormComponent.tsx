// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { FormEvent, MouseEvent, useState } from "react";
import {
	DefaultButton,
	Dropdown,
	FocusZone,
	FocusZoneTabbableElements,
	Icon,
	IDropdownOption,
	ISelectableOption,
	PrimaryButton,
	TextField
} from "@fluentui/react";
import { ModalComponent } from "../../common/ModalComponent/ModalComponent";
import { eventService } from "../../../services/EventService";
import { Environment, settingsService } from "../../../services/SettingsService";

import "./ConfigurationFormComponent.scss";
import { useMount } from "react-use";

let environments = settingsService.environments;

export const ConfigurationFormComponent = () => {
	const [showModal, setShowModal] = useState(false);
	const [appAdtUrl, setAppAdtUrl] = useState("");
	const [environmentOptions, setEnvironmentOptions] = useState<string[]>([]);

	const loadConfigurationSettings = (evt: any) => {
		if (evt.type === "start") {
			setShowModal(true);
			setAppAdtUrl(evt.appAdtUrl);
		}
	};

	const saveConfigurationsSettings = (e: FormEvent | MouseEvent) => {
		e.preventDefault();
		const config = { appAdtUrl };
		if (validateConfig(config)) {
			saveEnvironment(config);
			eventService.publishConfigure({ type: "end", config });
			resetModalState();
		}
	};

	const saveEnvironment = (config: Environment["config"]) => {
		const { appAdtUrl } = config;
		let envOptions = [...environmentOptions];
		let envs = [...environments];

		if (envs) {
			const env = envs.find(env => env.name === appAdtUrl);
			if (env) env.config = config;
			else {
				envs.push({ name: appAdtUrl, config });
				envOptions.push(appAdtUrl);
			}
		} else {
			envs = [{ name: appAdtUrl, config }];
			envOptions.push(appAdtUrl);
		}

		setEnvironmentOptions(envOptions);
		settingsService.environments = envs;
	};

	const validateConfig = (config: Environment["config"]) => {
		if (!config.appAdtUrl) {
			eventService.publishError("All fields are required.");
			return false;
		}

		if (!config.appAdtUrl.startsWith("https")) {
			eventService.publishError("ADT URL must start with ‘https’.");
			return false;
		}

		const regexp = /^(https):\/\/[\w-]+.api.[\w-.]+.[\w-.]+digitaltwins[\w-.]+/gm;
		if (!regexp.test(config.appAdtUrl)) {
			eventService.publishError(
				"ADT URL must match the format 'https://<name>.api.<dc>.<domain>'."
			);
			return false;
		}

		return true;
	};

	const closeConfigurationSettings = (e: MouseEvent<any>) => {
		e.preventDefault();
		eventService.publishConfigure({ type: "end" });
		resetModalState();
	};

	const resetModalState = () => {
		setShowModal(false);
		setAppAdtUrl("");
	};

	const onSelectedEnvironmentChange = (option?: IDropdownOption) => {
		if (environments && option) {
			const environment = environments.find(env => env.name === option.key);
			if (environment) {
				setAppAdtUrl(environment.config.appAdtUrl);
			}
		}
	};

	const onRemoveEnvironmentClick = (evt: MouseEvent<HTMLElement>, item?: IDropdownOption) => {
		evt.stopPropagation();
		const filteredOptions = environmentOptions.filter(option => option !== item?.key);
		settingsService.environments = environments.filter(env => env.name !== item?.key);
		setEnvironmentOptions(filteredOptions);

		if (item?.key === appAdtUrl) resetModalState();
	};

	const onRenderOption = (item?: ISelectableOption) => (
		<div className="dropdown-option" onClick={() => onSelectedEnvironmentChange(item)}>
			<span>{item?.text}</span>
			<Icon
				className="close-icon"
				iconName="ChromeClose"
				aria-hidden="true"
				onClick={e => onRemoveEnvironmentClick(e, item)}
				aria-label={`Remove ${item?.text} environment`}
				role="button"
				title="Remove environment"
				tabIndex={0}
			/>
		</div>
	);

	const onAppAdtUrlChange = (evt: any) => setAppAdtUrl(evt.target.value);

	const getStyles = () => ({ root: { width: 450 } });

	useMount(() => {
		eventService.subscribeConfigure(evt => loadConfigurationSettings(evt));
		if (environments) {
			setEnvironmentOptions(environments.map(env => env.name));
		}
	});

	return (
		<ModalComponent isVisible={showModal} className="configuration-settings">
			<FocusZone
				handleTabKey={FocusZoneTabbableElements.all}
				isCircularNavigation
				defaultActiveElement="#appClientIdField"
			>
				<form onSubmit={saveConfigurationsSettings}>
					<h2 className="heading-2">Azure Digital Twins URL</h2>
					<div className="select-settings">
						<Dropdown
							placeholder="Selected Environment"
							options={environmentOptions
								.filter(env => env !== appAdtUrl)
								.map(env => ({ key: env, text: env }))}
							onRenderOption={onRenderOption}
							styles={{ dropdown: { width: "100%" } }}
						/>
						<TextField
							required
							id="appAdtUrlField"
							label="ADT URL"
							className="configuration-input"
							styles={getStyles}
							value={appAdtUrl}
							onChange={onAppAdtUrlChange}
						/>
					</div>
					<p>Configuration data is saved in local storage.</p>
					<div className="btn-group">
						<PrimaryButton type="submit" className="modal-button save-button">
							Save
						</PrimaryButton>
						<DefaultButton
							className="modal-button cancel-button"
							onClick={closeConfigurationSettings}
						>
							Cancel
						</DefaultButton>
					</div>
				</form>
			</FocusZone>
		</ModalComponent>
	);
};
