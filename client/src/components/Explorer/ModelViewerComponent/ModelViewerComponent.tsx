// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component, RefObject } from "react";
import { Selection, SelectionMode, SelectionZone, TextField } from "@fluentui/react";

import { ModelViewerCommandBarComponent } from "./ModelViewerCommandBarComponent/ModelViewerCommandBarComponent";
import { ModelViewerViewComponent } from "./ModelViewerViewComponent/ModelViewerViewComponent";
import { ModelViewerCreateComponent } from "./ModelViewerCreateComponent/ModelViewerCreateComponent";
import { ModelViewerDeleteComponent } from "./ModelViewerDeleteComponent/ModelViewerDeleteComponent";
import { ModelViewerUpdateModelImageComponent } from "./ModelViewerUpdateModelImageComponent/ModelViewerUpdateModelImageComponent";
import LoaderComponent from "../../common/LoaderComponent/LoaderComponent";
import { readFile, sortArray } from "../../../utils/utilities";
import { print } from "../../../services/LoggingService";
import { ModelViewerItem } from "./ModelViewerItem/ModelViewerItem";
import { apiService } from "../../../services/ApiService";
import { eventService } from "../../../services/EventService";
import { settingsService } from "../../../services/SettingsService";

import "./ModelViewerComponent.scss";
import { DigitalTwinsModelData } from "@azure/digital-twins-core";

export type ModelItem = {
	displayName: string;
	key: string;
};

export class ModelViewerComponent extends Component {
	state = { items: [] as ModelItem[], filterText: "", isLoading: false };
	originalItems = [] as ModelItem[];
	uploadModelRef = React.createRef<HTMLInputElement>();
	uploadModelImagesRef = React.createRef<HTMLInputElement>();
	createRef = React.createRef<ModelViewerCreateComponent>();
	viewRef = React.createRef<ModelViewerViewComponent>();
	deleteRef = React.createRef<ModelViewerDeleteComponent>();
	updateModelImageRef = React.createRef<ModelViewerUpdateModelImageComponent>();
	inputFileRef: HTMLInputElement | null = null;

	async componentDidMount() {
		eventService.subscribeDeleteModel((id?: string) => {
			if (id) {
				this.originalItems.splice(
					this.originalItems.findIndex(i => i.key === id),
					1
				);
				const items = this.originalItems;
				this.setState({ items, filterText: "" });
			}
		});
		eventService.subscribeCreateModel(() => this.retrieveModels());

		await this.retrieveModels();

		eventService.subscribeConfigure(evt => {
			if (evt.type === "end" && evt.config) {
				this.retrieveModels();
			}
		});

		eventService.subscribeClearData(() => {
			this.setState({ items: [], isLoading: false });
		});
	}

	async retrieveModels() {
		this.setState({ isLoading: true });

		let list = [] as DigitalTwinsModelData[];
		try {
			list = await apiService.queryModels();
		} catch (exc) {
			exc.customMessage = "Error fetching models";
			eventService.publishError(exc);
		}

		const items = list.map(m => ({
			displayName: (m.displayName && m.displayName.en) || m.id,
			key: m.id
		}));
		sortArray(items, "displayName", "key");

		this.originalItems = items.slice(0, items.length);
		this.setState({ items, isLoading: false });
	}

	onFilterChanged = (_: any, text?: string) => {
		this.setState({
			filterText: text || "",
			items: !!text
				? this.originalItems.filter(item => item.key.toLowerCase().indexOf(text.toLowerCase()) >= 0)
				: this.originalItems
		});
	};

	handleUpload = async (evt: any) => {
		const files = evt.target.files;
		this.setState({ isLoading: true });

		print("*** Uploading selected models", "info");
		const list = [] as DigitalTwinsModelData[];
		try {
			for (const file of files) {
				print(`- working on ${file.name}`);
				const dtdl = await readFile(file);
				if (dtdl?.length) {
					dtdl.forEach((model: any) => list.push(model));
				} else {
					list.push(dtdl);
				}
			}
		} catch (exc) {
			exc.customMessage = "Parsing error";
			eventService.publishError(exc);
		}

		if (list.length > 0) {
			try {
				const res = await apiService.addModels(list);
				print("*** Upload result:", "info");
				print(JSON.stringify(res, null, 2), "info");
			} catch (exc) {
				exc.customMessage = "Upload error";
				eventService.publishError(exc);
			}
		}

		this.setState({ isLoading: false });
		await this.retrieveModels();
		if (this.uploadModelRef.current) this.uploadModelRef.current.value = "";
	};

	handleUploadOfModelImages = async (evt: any) => {
		const files = evt.target.files;
		this.setState({ isLoading: true });
		print("*** Uploading model images", "info");
		try {
			// Get updated list of models
			const models = await apiService.queryModels();

			for (const file of files) {
				print(`- checking image: ${file.name}`);
				const fileNameWithoutExtension = file.name.split(".").slice(0, -1).join(".").toLowerCase();
				const matchedModels = models.filter(model => {
					const formattedModelName = model.id
						.toLowerCase()
						.split(":")
						.join("_")
						.split(";")
						.join("-");
					return formattedModelName === fileNameWithoutExtension;
				});

				if (matchedModels.length > 0) {
					const id = matchedModels[0].id;
					print(`*** Uploading model image for ${id}`, "info");

					await new Promise(resolve => {
						const fileReader = new FileReader();
						fileReader.onload = () => {
							settingsService.setModelImage(id, fileReader.result);
							eventService.publishModelIconUpdate(id);
							print(`*** Model image uploaded for ${id}`, "info");
							resolve();
						};
						fileReader.readAsDataURL(file);
					});
				}
			}
		} catch (exc) {
			exc.customMessage = "Error fetching models";
			eventService.publishError(exc);
		}

		this.setState({ isLoading: false });
		if (this.uploadModelImagesRef.current) this.uploadModelImagesRef.current.value = "";
	};

	onSetModelImage = (evt: any, item: ModelItem, ref: RefObject<HTMLInputElement>) => {
		const imageFile = evt.target.files[0];
		const fileReader = new FileReader();

		fileReader.addEventListener("load", () => {
			settingsService.setModelImage(item.key, fileReader.result);
			eventService.publishModelIconUpdate(item.key);
			if (ref.current) ref.current.value = "";
			this.setState({ isLoading: false });
		});

		if (imageFile) {
			fileReader.readAsDataURL(imageFile);
		}
	};

	onUpdateModelImage = (modelId: string, inputFileRef: RefObject<HTMLInputElement>) => {
		if (this.updateModelImageRef.current)
			this.updateModelImageRef.current.open(this.state.items.find(item => item.key === modelId)!);
		this.inputFileRef = inputFileRef.current;
	};

	onDeleteModelImage = (modelId: string) => {
		this.setState({ isLoading: true });
		print(`*** Removing model image for ${modelId}`, "info");
		settingsService.deleteModelImage(modelId);
		eventService.publishModelIconUpdate(modelId);
		this.setState({ isLoading: false });
	};

	onReplaceModelImage = (modelId: any) => {
		print(`*** Replacing model image for ${modelId}`, "info");
		this.inputFileRef?.click();
	};

	onView = (item: ModelItem) => this.viewRef.current?.open(item);

	onCreate = (item: ModelItem) => this.createRef.current?.open(item);

	onDelete = (item: ModelItem) => this.deleteRef.current?.open(item);

	updateModelList = (itemKey: string) => {
		this.originalItems.splice(
			this.originalItems.findIndex(i => i.key === itemKey),
			1
		);
		const items = this.originalItems;
		this.setState({ items, filterText: "" });
	};

	render() {
		const { items, isLoading, filterText } = this.state;
		return (
			<>
				<div className="mv-grid">
					<div className="mv-toolbar">
						<ModelViewerCommandBarComponent
							className="mv-commandbar"
							buttonClass="mv-toolbarButtons"
							onDownloadModelsClicked={() => this.retrieveModels()}
							onUploadModelClicked={() => this.uploadModelRef.current?.click()}
							onUploadModelImagesClicked={() => this.uploadModelImagesRef.current?.click()}
						/>
						<input
							id="file-input"
							type="file"
							name="name"
							className="mv-fileInput"
							multiple
							accept=".json"
							ref={this.uploadModelRef}
							onChange={this.handleUpload}
						/>
						<input
							id="file-input"
							type="file"
							name="name"
							className="mv-fileInput"
							multiple
							accept="image/png, image/jpeg"
							ref={this.uploadModelImagesRef}
							onChange={this.handleUploadOfModelImages}
						/>
					</div>
					<div>
						<TextField
							className="mv-filter"
							onChange={this.onFilterChanged}
							placeholder="Search"
							value={filterText}
						/>
					</div>
					<div data-is-scrollable="true" className="mv-modelListWrapper">
						<SelectionZone selection={new Selection({ selectionMode: SelectionMode.single })}>
							{items.map((item, index) => {
								const modelImage = settingsService.getModelImage(item.key);
								return (
									<ModelViewerItem
										key={item.key}
										item={item}
										itemIndex={index}
										modelImage={modelImage}
										onUpdateModelImage={this.onUpdateModelImage}
										onSetModelImage={this.onSetModelImage}
										onView={() => this.onView(item)}
										onCreate={() => this.onCreate(item)}
										onDelete={() => this.onDelete(item)}
									/>
								);
							})}
						</SelectionZone>
					</div>
					{isLoading && <LoaderComponent />}
				</div>
				<ModelViewerViewComponent ref={this.viewRef} />
				<ModelViewerCreateComponent ref={this.createRef} />
				<ModelViewerDeleteComponent ref={this.deleteRef} onDelete={this.updateModelList} />
				<ModelViewerUpdateModelImageComponent
					ref={this.updateModelImageRef}
					onDelete={this.onDeleteModelImage}
					onReplace={this.onReplaceModelImage}
				/>
			</>
		);
	}
}
