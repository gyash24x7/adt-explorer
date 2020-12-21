import React, { FC } from "react";
import { Stack } from "@fluentui/react";
import { AppCommandBar, AppCommandBarProps } from "../AppCommandBar/AppCommandBar";

export type AppPageProps = AppCommandBarProps;

export const AppPage: FC<AppPageProps> = ({ children, ...rest }) => {
	return (
		<div className="main-grid">
			<div className="header">
				<Stack horizontal className="top-bar">
					<div>
						<span className="top-bar-title">GTP Simulator</span>
					</div>
					<AppCommandBar {...rest} />
				</Stack>
			</div>
			{children}
		</div>
	);
};
