// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { ReactNode } from "react";

import LoaderComponent from "../LoaderComponent/LoaderComponent";

import "./ModalComponent.scss";

export type ModalComponentProps = {
	className: string;
	children: ReactNode;
	isVisible?: boolean;
	isLoading?: boolean;
};

export const ModalComponent = (props: ModalComponentProps) =>
	props.isVisible ? (
		<div className={`modal-bg ${props.className} ${props.isVisible ? "visible" : ""}`}>
			<div className="modal">
				<div className="container">
					{props.children}
					{props.isLoading && <LoaderComponent />}
				</div>
			</div>
		</div>
	) : null;
