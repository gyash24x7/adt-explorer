// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { Link } from "@fluentui/react";

import LoaderComponent from "../../common/LoaderComponent/LoaderComponent";
import { exportService } from "../../../services/ExportService";
import { eventService } from "../../../services/EventService";

import "./ExportComponent.scss";
import { useMount } from "react-use";

export type ExportComponentProps = {
	query: any;
};

export const ExportComponent = ({ query }: ExportComponentProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [downloadUrl, setDownloadUrl] = useState<string>();

	const download = () => {
		if (!!downloadUrl) {
			setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
			setDownloadUrl(undefined);
		}
	};

	useMount(async () => {
		let data = null;
		try {
			data = await exportService.save(query);
		} catch (exc) {
			exc.customMessage = "Error in exporting graph";
			eventService.publishError(exc);
		}

		if (data) {
			const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
			const downloadUrl = URL.createObjectURL(blob);
			setDownloadUrl(downloadUrl);
		}

		setIsLoading(false);
	});

	return (
		<div className="ev-grid">
			{downloadUrl && (
				<div className="ev-control">
					<Link href={downloadUrl} download onClick={download}>
						Download
					</Link>
				</div>
			)}
			{isLoading && <LoaderComponent />}
		</div>
	);
};
