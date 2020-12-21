// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DefaultButton } from "@fluentui/react";
import React from "react";
import jsonMarkup from "json-markup";

import { ModalComponent } from "../../../common/ModalComponent/ModalComponent";

export type PropertyInspectorPatchInformationComponentProps = {
	isVisible?: boolean;
	patch: any;
	closeModal: () => void;
};

export const PropertyInspectorPatchInformationComponent = (
	props: PropertyInspectorPatchInformationComponentProps
) => {
	const getMarkup = (p: any) => ({ __html: jsonMarkup(p || []) });

	return (
		<ModalComponent isVisible={props.isVisible} className="pi-patch-modal">
			<h2 className="heading-2">Patch Information</h2>
			<pre dangerouslySetInnerHTML={getMarkup(props.patch)} />
			<div className="btn-group">
				<DefaultButton className="modal-button close-button" onClick={props.closeModal}>
					Close
				</DefaultButton>
			</div>
		</ModalComponent>
	);
};
