// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export type Relationship = {
	$sourceId: string;
	$targetId: string;
	$relationshipName: string;
	$relationshipId: string;
};

export type DigitalTwin = any;

export type DigitalTwinGraph = {
	digitalTwins: DigitalTwin[];
	relationships: Relationship[];
};

export class DataModel {
	digitalTwinsFileInfo = { fileVersion: "1.0.0" };
	digitalTwinsGraph: DigitalTwinGraph = { digitalTwins: [], relationships: [] };
	digitalTwinsModels = [] as any[];
}
