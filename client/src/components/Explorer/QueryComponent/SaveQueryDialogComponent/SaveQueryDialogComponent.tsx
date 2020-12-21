// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {
	DefaultButton,
	FocusZone,
	FocusZoneTabbableElements,
	IStyleFunction,
	ITextFieldStyleProps,
	ITextFieldStyles,
	PrimaryButton,
	TextField
} from "@fluentui/react";
import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";

export type SaveQueryDialogComponentProps = {
	isVisible?: boolean;
	onChange: (e: any) => void;
	onConfirm: (e: any) => void;
	onCancel: (e: any) => void;
	query?: string;
};

export const SaveQueryDialogComponent = (props: SaveQueryDialogComponentProps) => {
	const { isVisible, onChange, onConfirm, onCancel, query } = props;

	const getLabelStyles: IStyleFunction<any, any> = props => ({
		root: [props.required && { fontSize: "10px" }]
	});

	const getStyles: IStyleFunction<ITextFieldStyleProps, ITextFieldStyles> = props => ({
		fieldGroup: [
			{ height: "20px" },
			props.required && { fontSize: "10px", borderColor: "lightgray" }
		],
		subComponentStyles: { label: getLabelStyles }
	});

	return (
		<ModalComponent isVisible={isVisible} className="qc-save-query">
			<FocusZone
				handleTabKey={FocusZoneTabbableElements.all}
				isCircularNavigation
				defaultActiveElement="#queryNameField"
			>
				<form onSubmit={onConfirm}>
					<h2 className="heading-2">Save Query</h2>
					<TextField
						id="queryNameField"
						className="query-name-input"
						styles={getStyles}
						value={query}
						onChange={onChange}
						required
						autoFocus
					/>
					<div className="btn-group">
						<PrimaryButton type="submit" className="modal-button save-button" onClick={onConfirm}>
							Save
						</PrimaryButton>
						<DefaultButton className="modal-button cancel-button" onClick={onCancel}>
							Cancel
						</DefaultButton>
					</div>
				</form>
			</FocusZone>
		</ModalComponent>
	);
};
