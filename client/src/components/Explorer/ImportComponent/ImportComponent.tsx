// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useRef, useState } from "react";

import { GraphViewerCytoscapeComponent } from "../GraphViewerComponent/GraphViewerCytoscapeComponent/GraphViewerCytoscapeComponent";
import { ImportCommandBar } from "./ImportCommandBar/ImportCommandBar";
import LoaderComponent from "../../common/LoaderComponent/LoaderComponent";
import ImportStatsComponent from "./ImportStatsComponent/ImportStatsComponent";
import { importService } from "../../../services/ImportService";
import { eventService } from "../../../services/EventService";

import "./ImportComponent.scss";
import { useMount } from "react-use";
import { DataModel } from "../../../services/models/DataModel";

export type ImportComponentProps = {
	file: any;
};

export const ImportComponent = ({ file }: ImportComponentProps) => {
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [data, setData] = useState<DataModel>();

	const cyRef = useRef<GraphViewerCytoscapeComponent>(null);

	const onSaveClicked = async () => {
		setIsLoading(true);

		try {
			if (data) {
				await importService.save(data);
				setIsComplete(true);
				setShowImportModal(true);
			}
		} catch (exc) {
			exc.customMessage = "Error in importing graph";
			eventService.publishError(exc);
		}

		setIsLoading(false);
	};

	const closeModal = () => {
		setShowImportModal(false);
		eventService.publishCloseComponent("importComponent");
	};

	useMount(async () => {
		setIsLoading(true);
		let loadedData: DataModel | undefined = undefined;

		try {
			loadedData = await importService.tryLoad(file);
			if (!loadedData) setError(true);
			else {
				setData(loadedData);
				cyRef.current?.addTwins(loadedData.digitalTwinsGraph.digitalTwins);
				cyRef.current?.addRelationships(loadedData.digitalTwinsGraph.relationships);
				await cyRef.current?.doLayout();
			}
		} catch (err) {
			err.customMessage = "Error in creating graph from spreadsheet";
			eventService.publishError(err);
			setError(true);
		} finally {
			setIsLoading(false);
			setShowImportModal(false);
		}
	});

	return (
		<div className="iv-grid">
			{!error && (
				<div className="iv-toolbar">
					<ImportCommandBar
						className="iv-commandbar"
						isSaveEnabled={!isComplete}
						onSaveClicked={onSaveClicked}
					/>
				</div>
			)}
			{error && (
				<div className="iv-control">
					<p>Unrecognized file format</p>
				</div>
			)}
			{!error && (
				<div className="iv-message">
					<h4>Graph Preview Only</h4>
					<p>Full graph validation is applied on import. Click save to import.</p>
				</div>
			)}
			{!error && <GraphViewerCytoscapeComponent ref={cyRef} />}
			{isLoading && <LoaderComponent />}
			<ImportStatsComponent data={data} isVisible={showImportModal} onClose={closeModal} />
		</div>
	);
};
