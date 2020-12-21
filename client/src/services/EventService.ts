// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { EventEmitter } from "golden-layout";

export type EventServiceActionOptions = {
	type: "emit" | "on" | "off";
	name: string;
	payload: any;
};

class EventService {
	eventHub: EventEmitter | null;
	queue = [] as EventServiceActionOptions[];

	constructor() {
		this.eventHub = null;
		this.queue = [];
	}

	initialize(eventHub: EventEmitter) {
		this.eventHub = eventHub;
		this.queue.forEach(x => this._action(x));
		this.queue = [];
	}

	publishQuery(query: string) {
		this._emit("query", { query });
	}

	subscribeQuery(callback: any) {
		this._on("query", callback);
	}

	publishLog(data: any, type?: any) {
		this._emit("log", { data, type });
	}

	subscribeLog(callback: any) {
		this._on("log", callback);
	}

	publishConfigure(evt: any) {
		this._emit("configure", evt);
	}

	subscribeConfigure(callback: (evt: any) => void) {
		this._on("configure", callback);
	}

	unsubscribeConfigure(callback: any) {
		this._off("configure", callback);
	}

	publishPreferences(evt: any) {
		this._emit("preferences", evt);
	}

	subscribePreferences(callback: any) {
		this._on("preferences", callback);
	}

	unsubscribePreferences(callback: any) {
		this._off("preferences", callback);
	}

	publishClearData() {
		this._emit("clear", undefined);
	}

	subscribeClearData(callback: any) {
		this._on("clear", callback);
	}

	unsubscribeClearData(callback: any) {
		this._off("clear", callback);
	}

	publishError(error: any) {
		this._emit("error", error);
	}

	subscribeError(callback: any) {
		this._on("error", callback);
	}

	unsubscribeError(callback: any) {
		this._off("error", callback);
	}

	publishSelection(selection: any) {
		this._emit("selection", selection);
	}

	subscribeSelection(callback: any) {
		this._on("selection", callback);
	}

	publishCreateTwin(evt: any) {
		this._emit("createtwin", evt);
	}

	subscribeCreateTwin(callback: any) {
		this._on("createtwin", callback);
	}

	publishDeleteTwin(id: any) {
		this._emit("delete", id);
	}

	subscribeDeleteTwin(callback: any) {
		this._on("delete", callback);
	}

	publishAddRelationship(evt: any) {
		this._emit("addrelationship", evt);
	}

	subscribeAddRelationship(callback: any) {
		this._on("addrelationship", callback);
	}

	publishDeleteRelationship(evt: any) {
		this._emit("deleterelationship", evt);
	}

	subscribeDeleteRelationship(callback: any) {
		this._on("deleterelationship", callback);
	}

	publishCreateModel(callback: any) {
		this._emit("createmodel", callback);
	}

	subscribeCreateModel(callback: any) {
		this._on("createmodel", callback);
	}

	publishDeleteModel(evt: any) {
		this._emit("deletemodel", evt);
	}

	subscribeDeleteModel(callback: any) {
		this._on("deletemodel", callback);
	}

	publishCloseComponent(component: any) {
		this._emit("closecomponent", component);
	}

	subscribeCloseComponent(callback: any) {
		this._on("closecomponent", callback);
	}

	publishImport(evt: any) {
		this._emit("import", evt);
	}

	subscribeImport(callback: any) {
		this._on("import", callback);
	}

	publishExport(evt: any) {
		this._emit("export", evt);
	}

	subscribeExport(callback: any) {
		this._on("export", callback);
	}

	publishLoading(isLoading: any) {
		this._emit("loading", isLoading);
	}

	subscribeLoading(callback: any) {
		this._on("loading", callback);
	}

	publishModelIconUpdate(modelId: any) {
		this._emit("modeliconupdate", modelId);
	}

	subscribeModelIconUpdate(callback: any) {
		this._on("modeliconupdate", callback);
	}

	_emit = (name: string, payload: any) => this._action({ type: "emit", name, payload });

	_off = (name: string, payload: any) => this._action({ type: "off", name, payload });

	_on = (name: string, payload: any) => this._action({ type: "on", name, payload });

	_action({ type, name, payload }: EventServiceActionOptions) {
		if (this.eventHub) {
			this.eventHub[type](name, payload);
		} else {
			this.queue.push({ type, name, payload });
		}
	}
}

export const eventService = new EventService();
