// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ExcelImportPlugin } from "./plugins/ExcelImportPlugin";
import { JsonImportPlugin } from "./plugins/JsonImportPlugin";
import { apiService } from "./ApiService";
import { print } from "./LoggingService";
import { BatchService } from "./BatchService";
import { DataModel, DigitalTwinGraph, Relationship } from "./models/DataModel";

const ImportPlugins = [ExcelImportPlugin, JsonImportPlugin];

class ImportService {
	async tryLoad(file: File) {
		for (const P of ImportPlugins) {
			const plugin = new P();
			if (plugin.tryLoad) {
				return plugin.tryLoad(file);
			}
		}

		return;
	}

	async save(data: DataModel) {
		if (data.digitalTwinsModels.length > 0) {
			await this.saveModels(data);
		}
		if (
			data.digitalTwinsGraph.digitalTwins.length > 0 ||
			data.digitalTwinsGraph.relationships.length > 0
		) {
			await this.saveData(data);
		}
	}

	async saveModels(data: DataModel) {
		const currentModels = await apiService.queryModels();
		const missingModels = data.digitalTwinsModels.filter(x =>
			currentModels.every(y => x["@id"] !== y.model["@id"])
		);
		if (missingModels.length > 0) {
			await apiService.addModels(missingModels);
		}
	}

	async saveData(data: DataModel) {
		const results: DigitalTwinGraph = { digitalTwins: [], relationships: [] };
		await apiService.initialize();
		const twinsBs = new BatchService({
			items: data.digitalTwinsGraph.digitalTwins,
			action: (item, resolve, reject) => {
				print(`- Create twin ${item.$dtId}`);
				apiService.addTwin(item.$dtId, item).then(resolve, e => {
					print(`*** Error in creating twin: ${e}`, "error");
					results.digitalTwins.push(item);
					reject(e);
				});
			}
		});
		await twinsBs.run();

		const groupedRels = data.digitalTwinsGraph.relationships.reduce((p, c) => {
			p[c.$relationshipName] = p[c.$relationshipName] || [];
			p[c.$relationshipName].push(c);
			return p;
		}, {} as Record<string, Relationship[]>);

		for (const rel of Object.keys(groupedRels)) {
			const relBs = new BatchService({
				items: groupedRels[rel],
				action: (item, resolve, reject) => {
					print(
						`- Create relationship ${item.$relationshipName} from ${item.$sourceId} to ${item.$targetId}`
					);
					apiService
						.addRelationship(
							item.$sourceId,
							item.$targetId,
							item.$relationshipName,
							item.$relationshipId
						)
						.then(resolve, e => {
							print(`*** Error in creating relationship: ${e}`, "error");
							results.relationships.push(item);
							reject(e);
						});
				}
			});
			await relBs.run();
		}

		if (results.digitalTwins.length > 0 || results.relationships.length > 0) {
			const twins =
				results.digitalTwins.length > 0
					? `twins ${results.digitalTwins.map(x => x.$dtId).join(", ")}`
					: "";

			const joiner =
				results.digitalTwins.length > 0 && results.relationships.length > 0 ? " and " : "";

			const rels =
				results.relationships.length > 0
					? `relationships ${results.relationships
							.map(x => `${x.$sourceId} ${x.$relationshipId} ${x.$targetId}`)
							.join(", ")}`
					: "";

			const msg = `Failed to create ${twins}${joiner}${rels}`;

			throw new Error(msg);
		}
	}
}

export const importService = new ImportService();
