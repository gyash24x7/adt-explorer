// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { CommandBar, ICommandBarItemProps } from "@fluentui/react";

export type ImportCommandBarProps = {
	isSaveEnabled?: boolean;
	onSaveClicked: () => void;
	className?: string;
};

export const ImportCommandBar = (props: ImportCommandBarProps) => {
	const farItems: ICommandBarItemProps[] = [
		{
			key: "startImport",
			text: "Start Import",
			iconProps: { iconName: "Save" },
			onClick: () => props.onSaveClicked(),
			iconOnly: true,
			className: "iv-toolbarButtons",
			disabled: !props.isSaveEnabled
		}
	];

	return (
		<div className={props.className}>
			<CommandBar
				items={[]}
				farItems={farItems}
				ariaLabel="Use left and right arrow keys to navigate between commands"
			/>
		</div>
	);
};
