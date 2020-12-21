// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { ModalComponent } from "../../ModalComponent/ModalComponent";
import { DefaultButton } from "@fluentui/react";
import { apiService } from "../../../../services/ApiService";
import { eventService } from "../../../../services/EventService";
import { print } from "../../../../services/LoggingService";

export type DeleteAllTwinsComponentProps = {
	showModal: boolean;
	setShowModal: (val: boolean) => void;
};

const DeleteAllTwinsComponent = ({ setShowModal, showModal }: DeleteAllTwinsComponentProps) => {
	const [isLoading, setIsLoading] = useState(false);

	const deleteAllTwins = async () => {
		setIsLoading(true);

		print(`*** Deleting all twins`, "info");
		try {
			const allTwins = await apiService.getAllTwins();
			const ids = allTwins ? allTwins.map(twin => twin.$dtId) : [];
			await apiService.deleteAllTwins(ids);
			eventService.publishClearData();
		} catch (exc) {
			exc.customMessage = "Error deleting twins";
			eventService.publishError(exc);
		}

		setIsLoading(false);
	};

	const cancel = () => setShowModal(false);

	const confirm = async () => {
		await deleteAllTwins();
		cancel();
	};

	return (
		<ModalComponent isVisible={showModal} isLoading={isLoading} className="gc-dialog">
			<h2 className="heading-2">Are you sure?</h2>
			<div className="btn-group">
				<DefaultButton className="modal-button save-button" onClick={confirm}>
					Delete
				</DefaultButton>
				<DefaultButton className="modal-button cancel-button" onClick={cancel}>
					Cancel
				</DefaultButton>
			</div>
		</ModalComponent>
	);
};

export default DeleteAllTwinsComponent;
