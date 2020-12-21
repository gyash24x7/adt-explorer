// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
	DefaultButton,
	FocusZone,
	FocusZoneTabbableElements,
	PrimaryButton
} from "@fluentui/react";
import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";
import React from "react";

export type ConfirmQueryDialogComponentProps = {
	title: string;
	description?: string;
	action: string;
	isVisible?: boolean;
	onConfirm: (e: any) => void;
	onCancel: (e: any) => void;
	defaultActiveElementId?: string;
};

export const ConfirmQueryDialogComponent = (props: ConfirmQueryDialogComponentProps) => (
	<ModalComponent isVisible={props.isVisible} className="qc-confirm-delete">
		<FocusZone
			handleTabKey={FocusZoneTabbableElements.all}
			isCircularNavigation
			defaultActiveElement={`#${props.defaultActiveElementId}`}
		>
			<form onSubmit={props.onConfirm}>
				<h2 className="heading-2">{props.title}</h2>
				{props.description && <p>{props.description}</p>}
				<div className="btn-group">
					<PrimaryButton
						type="submit"
						id={props.defaultActiveElementId}
						className="modal-button save-button"
					>
						{props.action}
					</PrimaryButton>
					<DefaultButton className="modal-button cancel-button" onClick={props.onCancel}>
						Cancel
					</DefaultButton>
				</div>
			</form>
		</FocusZone>
	</ModalComponent>
);
