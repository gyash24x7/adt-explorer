// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DigitalTwinsClient, DigitalTwinsModelData } from "@azure/digital-twins-core";
import { DefaultHttpClient, WebResourceLike } from "@azure/core-http";
import { TokenCredential } from "@azure/identity";
import { BatchService } from "./BatchService";
import { configService } from "./ConfigService";
import { REL_TYPE_ALL, REL_TYPE_INCOMING, REL_TYPE_OUTGOING } from "./Constants";
import { print } from "./LoggingService";
import { settingsService } from "./SettingsService";
import { Relationship } from "./models/DataModel";
import { Operation } from "fast-json-patch";

const getAllTwinsQuery = "SELECT * FROM digitaltwins";

const getTwinsFromQueryResponse = (response: any[]) => {
	const list = [...response];
	const twins = [];
	for (let i = 0; i < list.length; i++) {
		const current = list[i];
		if (current.$dtId) {
			twins.push(current);
			continue;
		}

		for (const k of Object.keys(current)) {
			const v = current[k];
			if (typeof v === "object") {
				list.push(v);
			} else if (Array.isArray(v)) {
				v.forEach(x => list.push(x));
			}
		}
	}

	return twins;
};

class CustomHttpClient {
	client = new DefaultHttpClient();

	sendRequest(httpRequest: WebResourceLike) {
		const url = new URL(httpRequest.url);
		httpRequest.headers.set("x-adt-host", url.hostname);

		const baseUrl = new URL(window.location.origin);
		url.host = baseUrl.host;
		url.pathname = `/api/proxy${url.pathname}`;
		url.protocol = baseUrl.protocol;
		httpRequest.url = url.toString();

		return this.client!.sendRequest(httpRequest);
	}
}

class ApiService {
	client: DigitalTwinsClient | null = null;

	async initialize() {
		const { appAdtUrl } = await configService.getConfig();

		const nullTokenCredentials: TokenCredential = {
			getToken: async () => null
		};

		const httpClient = new CustomHttpClient();
		this.client = new DigitalTwinsClient(appAdtUrl, nullTokenCredentials, { httpClient });
	}

	async queryTwinsPaged(query: string, callback: (res: any[]) => Promise<any>) {
		await this.initialize();

		let count = 1;
		for await (const page of this.client!.queryTwins(query).byPage()) {
			print(`Ran query for twins, page ${count++}:`, "info");
			print(JSON.stringify(page, null, 2), "info");
			await callback(getTwinsFromQueryResponse(page.value!));
		}
	}

	async queryTwins(query: string) {
		const list: any[] = [];
		await this.queryTwinsPaged(query, async items => items.forEach(list.push));

		return list;
	}

	async getAllTwins() {
		return this.queryTwins(getAllTwinsQuery);
	}

	async getTwinById(twinId: string) {
		await this.initialize();

		const response = await this.client!.getDigitalTwin(twinId);
		return response.body;
	}

	async addTwin(twinId: string, payload: string) {
		await this.initialize();
		return this.client!.upsertDigitalTwin(twinId, payload);
	}

	async updateTwin(twinId: string, patch: Operation[]) {
		await this.initialize();
		return await this.client!.updateDigitalTwin(twinId, patch);
	}

	async queryRelationshipsPaged(
		twinId: string,
		callback: (v: any[]) => Promise<any>,
		type = REL_TYPE_OUTGOING
	) {
		await this.initialize();

		const operations = type === REL_TYPE_ALL ? [REL_TYPE_OUTGOING, REL_TYPE_INCOMING] : [type];
		for (let i = 0; i < operations.length; i++) {
			const op = operations[i];
			const isFinalOp = i === operations.length - 1;
			const baseOperation =
				op === REL_TYPE_INCOMING
					? this.client!.listIncomingRelationships
					: this.client!.listRelationships;

			let count = 1;
			for await (const page of baseOperation(twinId).byPage()) {
				print(`Ran query for relationships for twin ${twinId}, page ${count++}:`, "info");
				print(JSON.stringify(page, null, 2), "info");

				// The response type for the incoming relationships doesn't match the outgoing call so we'll remap it
				if (op === REL_TYPE_INCOMING) {
					page.value!.forEach(x => {
						["sourceId", "relationshipId", "relationshipName", "relationshipLink"]
							.filter(y => !!x[y])
							.forEach(y => {
								x[`$${y}`] = x[y];
								delete x[y];
							});
						x.$targetId = twinId;
					});
				}

				// Indicate to the caller that we're not done in the case where we are calling multiple operations
				const callbackResponse = [...page.value!];
				if (page.nextLink || !isFinalOp) {
					// @ts-ignore
					callbackResponse.nextLink = true;
				}

				await callback(callbackResponse);
			}
		}
	}

	async queryRelationships(twinId: string, type = REL_TYPE_OUTGOING) {
		const list: any[] = [];
		await this.queryRelationshipsPaged(twinId, async items => items.forEach(list.push), type);
		return list;
	}

	async addRelationship(
		sourceId: string,
		targetId: any,
		relationshipType: any,
		relationshipId: string
	) {
		await this.initialize();

		return await this.client!.upsertRelationship(sourceId, relationshipId, {
			$relationshipName: relationshipType,
			$targetId: targetId
		});
	}

	async queryModels() {
		await this.initialize();

		const list = [];
		const models = this.client!.listModels([], true);
		for await (const model of models) {
			list.push(model);
		}

		return list;
	}

	async getModelById(modelId: string) {
		await this.initialize();
		return await this.client!.getModel(modelId, true);
	}

	async addModels(models: any[]) {
		await this.initialize();
		return await this.client!.createModels(models);
	}

	async deleteRelationship(twinId: string, relationshipId: string) {
		await this.initialize();
		print(`Deleting relationship ${relationshipId} for twin ${twinId}`, "warning");
		await this.client!.deleteRelationship(twinId, relationshipId);
	}

	async deleteTwin(twinId: string, skipRelationships = false) {
		if (!skipRelationships) {
			await this.deleteTwinRelationships(twinId);
		}

		print(`Deleting twin ${twinId}`, "warning");
		await this.client!.deleteDigitalTwin(twinId);
	}

	async deleteTwinRelationships(twinId: string, skipIncoming = false) {
		await this.initialize();

		const rels = await this.queryRelationships(twinId, REL_TYPE_OUTGOING);
		for (const r of rels) {
			await this.deleteRelationship(twinId, r.$relationshipId);
		}

		if (!skipIncoming) {
			const incRels = await this.queryRelationships(twinId, REL_TYPE_INCOMING);
			for (const r of incRels) {
				await this.deleteRelationship(r.$sourceId, r.$relationshipId);
			}
		}
	}

	async deleteAllTwins(ids: string[]) {
		await this.initialize();

		const relsBs = new BatchService({
			items: ids,
			action: (item, resolve, reject) => {
				this.deleteTwinRelationships(item, true).then(resolve, reject);
			}
		});
		await relsBs.run();

		const twinsBs = new BatchService({
			items: ids,
			action: (item, resolve, reject) => {
				this.deleteTwin(item, true).then(resolve, reject);
			}
		});
		await twinsBs.run();

		print("*** Delete complete", "warning");
	}

	async deleteModel(id: string) {
		await this.initialize();
		await this.client!.deleteModel(id);
		print(`*** Delete complete for model with ID: ${id}`, "warning");
	}

	async getRelationship(sourceTwinId: string, relationshipId: string) {
		print(`Get relationship with id ${relationshipId} for source twin ${sourceTwinId}`, "info");
		await this.initialize();
		return await this.client!.getRelationship(sourceTwinId, relationshipId);
	}

	async getEventRoutes() {
		print(`Get event routes`, "info");
		await this.initialize();

		const list = [];
		const eventRoutes = this.client!.listEventRoutes();
		for await (const eventRoute of eventRoutes) {
			list.push(eventRoute);
		}
		return list;
	}

	async getEventRoute(routeId: string) {
		print(`Get event route with id ${routeId}`, "info");
		await this.initialize();
		return await this.client!.getEventRoute(routeId);
	}

	async addEventRoute(routeId: string, endpointId: string, filter: string) {
		print(`Adding event route with id ${routeId}`, "info");
		await this.initialize();
		return await this.client!.upsertEventRoute(routeId, endpointId, filter);
	}

	async deleteEventRoute(routeId: string) {
		print(`Deleting event route with id ${routeId}`, "warning");
		await this.initialize();
		await this.client!.deleteEventRoute(routeId);
		print(`*** Delete complete for event route with ID: ${routeId}`, "warning");
	}

	async decommissionModel(modelId: string) {
		print(`Decommission model with ID: ${modelId}`, "info");
		await this.initialize();
		await this.client!.decomissionModel(modelId);
	}
}

class CachedApiService extends ApiService {
	cache = { relationships: {} as any, models: [] as DigitalTwinsModelData[] };

	async addModels(models: DigitalTwinsModelData[]) {
		this.cache.models = [];
		return await super.addModels(models);
	}

	async deleteModel(id: string) {
		this.cache.models = [];
		return await super.deleteModel(id);
	}

	async getModelById(id: string) {
		if (!settingsService.caching) {
			this.clearCache();
			return await super.getModelById(id);
		}

		if (this.cache.models.length <= 0) {
			await this.updateModelCache();
		}

		return this.cache.models.find(m => m.id === id) as any;
	}

	async queryModels() {
		if (!settingsService.caching) {
			this.clearCache();
			return await super.queryModels();
		}

		if (this.cache.models.length <= 0) {
			await this.updateModelCache();
		}
		return this.cache.models;
	}

	async deleteAllTwins(ids: string[]) {
		this.cache.relationships = {};
		return await super.deleteAllTwins(ids);
	}

	async updateModelCache() {
		this.cache.models = await super.queryModels();
	}

	async addRelationship(
		sourceId: string,
		targetId: any,
		relationshipType: any,
		relationshipId: string
	) {
		for (const id of [sourceId, targetId]) {
			if (this.cache.relationships[id]) {
				delete this.cache.relationships[id];
			}
		}
		return await super.addRelationship(sourceId, targetId, relationshipType, relationshipId);
	}

	async deleteRelationship(twinId: string, relationshipId: string) {
		if (this.cache.relationships[twinId]) {
			delete this.cache.relationships[twinId];
		}
		return await super.deleteRelationship(twinId, relationshipId);
	}

	async queryRelationshipsPaged(
		twinId: string,
		callback: (v: Relationship[]) => Promise<any>,
		type = REL_TYPE_OUTGOING
	) {
		if (!settingsService.caching) {
			this.clearCache();
			await super.queryRelationshipsPaged(twinId, callback, type);
			return;
		}

		let results = this.cache.relationships[twinId];
		if (results && results[type]) {
			await callback(results[type]);
			return;
		}

		if (!results) {
			this.cache.relationships[twinId] = {};
		}

		results = [];
		await super.queryRelationshipsPaged(
			twinId,
			async items => {
				items.forEach(x => results.push(x));
				await callback(items);
			},
			type
		);

		this.cache.relationships[twinId][type] = results;
	}

	clearCache() {
		this.cache.relationships = {};
		this.cache.models = [];
	}
}

export const apiService = new CachedApiService();
