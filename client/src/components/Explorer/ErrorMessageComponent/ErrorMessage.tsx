// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { DefaultButton } from "@fluentui/react";
import { ModalComponent } from "../../common/ModalComponent/ModalComponent";
import { eventService } from "../../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE } from "../../../services/Constants";
import { print } from "../../../services/LoggingService";
import { useMount } from "react-use";

import "./ErrorMessage.scss";

export const ErrorMessageComponent = () => {
	const [showModal, setShowModal] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const close = () => setShowModal(false);

	useMount(() => {
		eventService.subscribeError((exc: any) => {
			let message;
			if (exc && exc.name === "RestError" && !exc.code) {
				message = CUSTOM_AUTH_ERROR_MESSAGE;
			} else {
				message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
			}

			print(message, "error");

			setErrorMessage(message);
			setShowModal(true);
		});
	});

	return (
		<ModalComponent isVisible={showModal} className="error-message">
			<div className="message-container">
				<h2 className="heading-2">Error</h2>
				<p>{errorMessage}</p>
				<div className="btn-group">
					<DefaultButton className="modal-button close-button" onClick={close}>
						Close
					</DefaultButton>
				</div>
			</div>
		</ModalComponent>
	);
};
