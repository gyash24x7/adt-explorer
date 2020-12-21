// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Fragment, useState } from "react";
import { CommandBar, ICommandBarItemProps } from "@fluentui/react";

import { ConfigurationFormComponent } from "../../Explorer/ConfigurationFormComponent/ConfigurationFormComponent";
import { PreferencesFormComponent } from "../../Explorer/PreferencesFormComponent/PreferencesFormComponent";
import { configService } from "../../../services/ConfigService";
import { eventService } from "../../../services/EventService";
import DeleteAllTwinsComponent from "./DeleteAllTwinsComponent/DeleteAllTwinsComponent";

import "./AppCommandBar.scss";
import optionalComponents from "../../../utils/optionalComponents";
import { OptionalComponentState } from "../../../routes/Explorer";
import { useLocation, useNavigate } from "@reach/router";

export type AppCommandBarProps = {
	optionalComponents?: typeof optionalComponents;
	toggleOptionalComponent?: (component: string) => void;
	optionalComponentsState?: Record<"console" | "output", OptionalComponentState>;
};

export const AppCommandBar = (props: AppCommandBarProps) => {
	const [showModal, setShowModal] = useState(false);
	const { pathname } = useLocation();
	const navigateFn = useNavigate();

	const updateAdtUrlSettings = async () => {
		try {
			const { appAdtUrl } = await configService.getConfig();
			await eventService.publishConfigure({ type: "start", appAdtUrl });
		} catch (exc) {
			if (exc.errorCode !== "user_cancelled") {
				exc.customMessage = "Error on saving settings";
				eventService.publishError(exc);
			}
		}
	};

	const navigate = (to: string) => {
		navigateFn(to).then(() => {
			console.log("Page Changed");
		});
	};

	const togglePreferencesModal = () => {
		eventService.publishPreferences(undefined);
	};

	const farItems: ICommandBarItemProps[] = [
		{
			key: "deleteTwins",
			text: "Delete All Twins",
			ariaLabel: "delete all twins",
			iconProps: { iconName: "Delete" },
			onClick: () => setShowModal(true),
			iconOnly: true,
			className: "app-toolbarButtons delete-button"
		},
		{
			key: "signIn",
			text: "ADT URL",
			ariaLabel: "adt url",
			iconOnly: true,
			iconProps: { iconName: "Signin" },
			split: true,
			onClick: () => {
				updateAdtUrlSettings().then(() => {});
			},
			className: "app-toolbarButtons"
		},
		{
			key: "settings",
			text: "Settings",
			ariaLabel: "settings",
			iconOnly: true,
			iconProps: { iconName: "Settings" },
			onClick: () => togglePreferencesModal(),
			className: "app-toolbarButtons settings-button"
		}
	];

	const items: ICommandBarItemProps[] = [
		{
			key: "home",
			text: "Home",
			ariaLabel: "home",
			onClick: () => navigate("/"),
			className: "app-toolbarButtons settings-button"
		},
		{
			key: "explorer",
			text: "Explorer",
			ariaLabel: "explorer",
			onClick: () => navigate("/explorer"),
			className: "app-toolbarButtons settings-button"
		}
	];

	return (
		<div className="app-commandbar-container">
			<CommandBar
				items={items}
				farItems={pathname.startsWith("/explorer") ? farItems : []}
				ariaLabel="Use left and right arrow keys to navigate between commands"
				className="app-commandbar"
			/>
			{pathname.startsWith("/explorer") && (
				<Fragment>
					<ConfigurationFormComponent />
					<PreferencesFormComponent
						toggleOptionalComponent={props.toggleOptionalComponent!}
						optionalComponentsState={props.optionalComponentsState!}
					/>
					<DeleteAllTwinsComponent showModal={showModal} setShowModal={setShowModal} />
				</Fragment>
			)}
		</div>
	);
};
