// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useRef } from "react";
import Terminal from "react-console-emulator";
import { v4 as uuidv4 } from "uuid";

import { apiService } from "../../../services/ApiService";
import { eventService } from "../../../services/EventService";
import { ModelService } from "../../../services/ModelService";
import { REL_TYPE_INCOMING } from "../../../services/Constants";

import "./ConsoleComponent.scss";
import { DigitalTwinsModelData } from "@azure/digital-twins-core";

export const ConsoleComponent = () => {
	const terminalRef = useRef<any>(null);

	const pushToStdout = (message: string) => {
		if (terminalRef.current) {
			terminalRef.current.pushToStdout(message);
			terminalRef.current.scrollToBottom();
		}
	};

	const patchTwin = async (
		twinId: string,
		operation: "add" | "remove" | "replace" | "move" | "copy" | "test" | "_get",
		propertyName: string,
		value: string
	) => {
		if (twinId && operation && propertyName && value) {
			try {
				const twin = await apiService.getTwinById(twinId);
				const properties = await new ModelService().getProperties(twin.$metadata.$model);
				const filteredProps = Object.keys(properties).filter(p => p === propertyName);

				if (filteredProps.length <= 0) {
					pushToStdout("*** Property doesn't exist!");
					return;
				}

				const prop = properties[filteredProps[0]];

				let newArg4: any = value;
				switch (prop.schema) {
					case "dtmi:dtdl:instance:Schema:integer;2":
						newArg4 = parseInt(value, 10);
						break;
					case "dtmi:dtdl:instance:Schema:double;2":
					case "dtmi:dtdl:instance:Schema:long;2":
					case "dtmi:dtdl:instance:Schema:float;2":
						newArg4 = parseFloat(value);
						break;
					case "dtmi:dtdl:instance:Schema:boolean;2":
						newArg4 = value.toLowerCase() === "true";
						break;
					default:
						break;
				}

				const patch: any = { op: operation, path: `/${propertyName}`, value: newArg4 };
				const result = await apiService.updateTwin(twinId, [patch]);
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(`*** Error patching twin: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getTwin = async (twinId: string) => {
		if (!!twinId) {
			try {
				const result = await apiService.getTwinById(twinId);
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(`*** Error retrieving twin from ADT: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const addTwin = async (modelId: string, newTwinId: string) => {
		if (modelId && newTwinId) {
			try {
				const modelService = new ModelService();
				const payload = await modelService.createPayload(modelId);
				const result = await apiService.addTwin(newTwinId, payload);
				eventService.publishCreateTwin({ $dtId: newTwinId, $metadata: { $model: modelId } });
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(`*** Error creating twin from ADT: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const deleteTwin = async (twinId: string) => {
		if (twinId) {
			try {
				await apiService.deleteTwin(twinId);
				eventService.publishDeleteTwin(twinId);
				pushToStdout(`*** Deleted Twin with ID: ${twinId}`);
			} catch (exc) {
				pushToStdout(`*** Error deleting twin from ADT: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const deleteAllTwins = async (...twinIds: string[]) => {
		if (twinIds && twinIds.length > 0) {
			try {
				await apiService.deleteAllTwins(twinIds);
				pushToStdout(`*** Deleted twins with ids: ${twinIds}`);
			} catch (exc) {
				pushToStdout(`*** Error deleting twins: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getRelationships = async (sourceTwinId: string, type?: string) => {
		if (sourceTwinId) {
			try {
				const edgeList = await apiService.queryRelationships(sourceTwinId, type);
				if (edgeList !== null) {
					if (edgeList.length <= 0) {
						pushToStdout(`*** No relationships found.`);
					}

					for (const edge of edgeList) {
						pushToStdout(JSON.stringify(edge, null, 2));
					}
				}
			} catch (exc) {
				pushToStdout(`*** Error getting relationships: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getIncomingRelationships = async (sourceTwinId: string) => {
		await getRelationships(sourceTwinId, REL_TYPE_INCOMING);
	};

	const addRelationship = async (sourceId: string, targetId: string, relName: string) => {
		if (sourceId && targetId && relName) {
			try {
				const relId = uuidv4();
				const result = await apiService.addRelationship(sourceId, targetId, relName, relId);
				eventService.publishAddRelationship({
					$sourceId: sourceId,
					$relationshipId: relId,
					$relationshipName: relName,
					$targetId: targetId
				});
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(`*** Error creating relationship: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const deleteRelationship = async (twinId: string, relationshipId: string) => {
		if (twinId && relationshipId) {
			try {
				await apiService.deleteRelationship(twinId, relationshipId);
				eventService.publishDeleteRelationship({
					$sourceId: twinId,
					$relationshipId: relationshipId
				});
				pushToStdout(`*** Deleted relationship with ID: ${relationshipId}`);
			} catch (exc) {
				pushToStdout(`*** Error deleting relationship: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getModel = async (modelId: string) => {
		if (modelId) {
			try {
				const result = await apiService.getModelById(modelId);
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(`*** Error retrieving model from ADT: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getModels = async () => {
		try {
			const result = await apiService.queryModels();
			pushToStdout(JSON.stringify(result, null, 2));
		} catch (exc) {
			pushToStdout(`*** Error retrieving models from ADT: ${exc}`);
		}
	};

	const addModel = async (modelJson: string) => {
		if (modelJson) {
			try {
				const model: DigitalTwinsModelData = JSON.parse(modelJson);
				eventService.publishCreateModel(undefined);
				const result = await apiService.addModels([model]);
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(
					`*** Error creating model - Ensure there are no spaces in your input. You should NOT escape your JSON string: ${exc}`
				);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const deleteModel = async (modelId: string) => {
		if (modelId) {
			try {
				await apiService.deleteModel(modelId);
				eventService.publishDeleteModel(modelId);
				pushToStdout(`*** Deleted model with ID: ${modelId}`);
			} catch (exc) {
				pushToStdout(`*** Error deleting model: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const deleteAllModels = async () => {
		try {
			await new ModelService().deleteAll();
			eventService.publishClearData();
			pushToStdout(`*** All models deleted.`);
		} catch (exc) {
			pushToStdout(`*** Error deleting all models: ${exc}`);
		}
	};

	const query = async (...args: string[]) => {
		if (args) {
			try {
				const query = `${Array.from(args).join(" ")}`;
				const result = await apiService.queryTwins(query);
				pushToStdout(JSON.stringify(result, null, 2));
			} catch (exc) {
				pushToStdout(`*** Error retrieving data from ADT: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const observeProperties = async (twinId: string, property: string) => {
		if (twinId && property) {
			try {
				const twin = await apiService.getTwinById(twinId);
				if (twin[property]) {
					pushToStdout(
						`*** Observed property ${property} for TwinId '${twinId}': ${twin[property]}`
					);
				} else {
					pushToStdout(`*** Property ${property} not found for TwinId '${twinId}'`);
				}
			} catch (exc) {
				pushToStdout(`*** Error observing properties: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getRelationship = async (sourceTwinId: string, relationshipId: string) => {
		if (sourceTwinId && relationshipId) {
			try {
				const relationship = await apiService.getRelationship(sourceTwinId, relationshipId);
				if (relationship) {
					pushToStdout(`${JSON.stringify(relationship, null, 2)}`);
				} else {
					pushToStdout(`*** Relationship ${relationshipId} not found for TwinId '${sourceTwinId}'`);
				}
			} catch (exc) {
				pushToStdout(`*** Error getting the relationship: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const getEventRoutes = async () => {
		try {
			const eventRoutes = await apiService.getEventRoutes();
			pushToStdout(`${JSON.stringify(eventRoutes, null, 2)}`);
		} catch (exc) {
			pushToStdout(`*** Error getting the event routes: ${exc}`);
		}
	};

	const getEventRoute = async (routeId: string) => {
		if (routeId) {
			try {
				const eventRoute = await apiService.getEventRoute(routeId);
				if (eventRoute) {
					pushToStdout(`${JSON.stringify(eventRoute, null, 2)}`);
				} else {
					pushToStdout(`*** Event route with id ${routeId} not found.`);
				}
			} catch (exc) {
				pushToStdout(`*** Error getting the event route: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const addEventRoute = async (routeId: string, endpointId: string, filter: string) => {
		if (routeId && endpointId && filter) {
			try {
				const eventRoute = await apiService.addEventRoute(routeId, endpointId, filter);
				pushToStdout(`${JSON.stringify(eventRoute, null, 2)}`);
			} catch (exc) {
				pushToStdout(`*** Error creating the event route: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const deleteEventRoute = async (routeId: string) => {
		if (routeId) {
			try {
				await apiService.deleteEventRoute(routeId);
				pushToStdout(`*** Deleted event route with ID: ${routeId}`);
			} catch (exc) {
				pushToStdout(`*** Error deleting the event route: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const decommissionModel = async (modelId: string) => {
		if (modelId) {
			try {
				await apiService.decommissionModel(modelId);
				pushToStdout(`*** Decommission Model with ID: ${modelId}`);
			} catch (exc) {
				pushToStdout(`*** Error decommissioning model: ${exc}`);
			}
		} else {
			pushToStdout("*** Not enough params");
		}
	};

	const commands = {
		patchTwin: {
			description: "patch a digital twin",
			usage: "patchTwin <twinId:string> <operation:string> <propertyName:string> <value:string>",
			fn: patchTwin
		},
		getTwin: {
			description: "get a digital twin",
			usage: "getTwin <twinId:string>",
			fn: getTwin
		},
		addTwin: {
			description: "add a digital twin",
			usage: "addTwin <modelId:string> <newTwinId:string>",
			fn: addTwin
		},
		delTwin: {
			description: "delete a digital twin",
			usage: "delTwin <twinId:string>",
			fn: deleteTwin
		},
		delAllTwins: {
			description: "delete all digital twins",
			usage: "delAllTwins <twinId:string>",
			fn: deleteAllTwins
		},
		getRels: {
			description: "get relationships",
			usage: "getRels <twinId:string>",
			fn: getRelationships
		},
		getRel: {
			description: "get a specific relationship by id",
			usage: "getRel <sourceTwinId:string> <relationshipId:string>",
			fn: getRelationship
		},
		getIncomRel: {
			description: "get incoming relationship",
			usage: "getIncomRel <twinId:string>",
			fn: getIncomingRelationships
		},
		addRel: {
			description: "add relationship",
			usage: "addRel <sourceId:string> <targetId:string> <relationshipName:string>",
			fn: addRelationship
		},
		delRel: {
			description: "delete relationship",
			usage: "delRel <twinId:string> <relationshipId:string>",
			fn: deleteRelationship
		},
		getModel: {
			description: "get model info",
			usage: "getModel <modelId:string>",
			fn: getModel
		},
		getModels: {
			description: "get models info",
			usage: "getModels <modelId:string>",
			fn: getModels
		},
		addModel: {
			description: "add model (ensure JSON has no spaces and is not escaped)",
			usage: "addModel <modelJSON:string>",
			fn: addModel
		},
		delModel: {
			description: "delete model",
			usage: "delModel <modelId:string>",
			fn: deleteModel
		},
		delAllModels: {
			description: "Deletes all models in your instance",
			usage: "delAllModels",
			fn: deleteAllModels
		},
		query: {
			description: "query twins",
			usage: "query <string>",
			fn: query
		},
		observeProperties: {
			description: "observes the selected properties on the selected twins",
			usage: "observeProperties <twinId:string> <propertyName:string>",
			fn: observeProperties
		},
		getEventRoutes: {
			description: "get all the event routes",
			usage: "getEventRoutes",
			fn: getEventRoutes
		},
		getEventRoute: {
			description: "get a specific route by id",
			usage: "getEventRoute <routeId:string>",
			fn: getEventRoute
		},
		addEventRoute: {
			description: "creates a new event route",
			usage: "addEventRoute <routeId:string> <endpointId:string> <filter:bool>",
			fn: addEventRoute
		},
		delEventRoute: {
			description: "deletes an event route by the id",
			usage: "delEventRoute <routeId:string>",
			fn: deleteEventRoute
		},
		decommissionModel: {
			description: "decommission model",
			usage: "decommissionModel <modelId:string>",
			fn: decommissionModel
		}
	};

	return (
		<Terminal
			welcomeMessage="ADT Explorer command prompt"
			commands={commands}
			contentClassName="cc-content"
			inputClassName="cc-input"
			messageClassName="cc-message"
			promptLabel="$>"
			className="cc-console"
			ref={terminalRef}
		/>
	);
};
