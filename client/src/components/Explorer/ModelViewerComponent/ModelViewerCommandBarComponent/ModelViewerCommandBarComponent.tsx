// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { CommandBar } from "@fluentui/react";
import ModelViewerDeleteAllModelsComponent from "../ModelViewerDeleteAllModelsComponent/ModelViewerDeleteAllModelsComponent";

export type ModelViewerCommandBarComponentProps = {
	buttonClass?: string;
	onUploadModelImagesClicked: () => void;
	onDownloadModelsClicked: () => void;
	onUploadModelClicked: () => void;
	className?: string;
};

export class ModelViewerCommandBarComponent extends Component<ModelViewerCommandBarComponentProps> {
	buttonClass = this.props.buttonClass;
	delete = React.createRef<ModelViewerDeleteAllModelsComponent>();

	farItems = [
		{
			key: "uploadModelImages",
			text: "Upload Model Images",
			iconProps: { iconName: "ImageSearch" },
			onClick: () => this.props.onUploadModelImagesClicked(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "downloadModels",
			text: "Download Models",
			iconProps: { iconName: "CloudDownload" },
			onClick: () => this.props.onDownloadModelsClicked(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "uploadModel",
			text: "Upload a Model",
			iconProps: { iconName: "CloudUpload" },
			onClick: () => this.props.onUploadModelClicked(),
			iconOnly: true,
			className: this.buttonClass
		},
		{
			key: "deleteModels",
			text: "Delete All Models",
			ariaLabel: "delete all models",
			iconProps: { iconName: "Delete" },
			onClick: () => this.delete.current?.open(),
			iconOnly: true,
			className: this.buttonClass
		}
	];

	render() {
		return (
			<div>
				<CommandBar
					className={this.props.className}
					items={[]}
					farItems={this.farItems}
					ariaLabel="Use left and right arrow keys to navigate between commands"
				/>
				<ModelViewerDeleteAllModelsComponent ref={this.delete} />
			</div>
		);
	}
}
