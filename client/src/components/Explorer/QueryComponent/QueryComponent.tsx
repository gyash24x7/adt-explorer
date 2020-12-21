// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";

import { print } from "../../../services/LoggingService";
import { eventService } from "../../../services/EventService";
import { settingsService } from "../../../services/SettingsService";

import "./QueryComponent.scss";
import {
	DefaultButton,
	Dropdown,
	FocusZone,
	FocusZoneTabbableElements,
	Icon,
	IconButton,
	IDropdownOption,
	IRenderFunction,
	ISelectableOption,
	TextField
} from "@fluentui/react";
import { SaveQueryDialogComponent } from "./SaveQueryDialogComponent/SaveQueryDialogComponent";
import { ConfirmQueryDialogComponent } from "./ConfirmQueryDialogComponent/ConfirmQueryDialogComponent";

export type QueryComponentState = {
	queries: any[];
	selectedQuery: string;
	selectedQueryKey?: string;
	queryKeyToBeRemoved: string;
	showSaveQueryModal: boolean;
	showConfirmDeleteModal: boolean;
	showConfirmOverwriteModal: boolean;
	newQueryName: string;
};

export class QueryComponent extends Component<{}, QueryComponentState> {
	state: QueryComponentState = {
		queries: [] as any[],
		selectedQuery: "SELECT * FROM digitaltwins",
		queryKeyToBeRemoved: "",
		showSaveQueryModal: false,
		showConfirmDeleteModal: false,
		showConfirmOverwriteModal: false,
		newQueryName: ""
	};

	componentDidMount() {
		this.setState({ queries: settingsService.queries });
	}

	onChange = (evt: any) => {
		this.setState({ selectedQuery: evt.target.value, selectedQueryKey: undefined });
	};

	onChangeQueryName = (evt: any) => {
		this.setState({ newQueryName: evt.target.value });
	};

	executeQuery = (event: any) => {
		event.preventDefault();
		print(`Requested query: ${this.state.selectedQuery}`);
		eventService.publishQuery(this.state.selectedQuery);
	};

	saveQueryButtonClicked = () => {
		this.setState({ showSaveQueryModal: true });
	};

	saveQuery = (e: any) => {
		e.preventDefault();
		const { queries, selectedQuery, newQueryName } = this.state;

		if (newQueryName) {
			const newQueries = [...queries];
			if (queries.find(q => q.name === newQueryName)) {
				this.setState({ showSaveQueryModal: false, showConfirmOverwriteModal: true });
			} else {
				newQueries.push({ name: newQueryName, query: selectedQuery });

				this.setState({
					queries: newQueries,
					selectedQueryKey: newQueryName,
					showSaveQueryModal: false,
					newQueryName: ""
				});

				settingsService.queries = newQueries;
			}
		}
	};

	overwriteQuery = (e: any) => {
		e.preventDefault();
		const { queries, selectedQuery, newQueryName } = this.state;

		if (newQueryName) {
			const newQueries = [...queries];
			newQueries[newQueries.indexOf(newQueries.find(q => q.name === newQueryName))] = {
				name: newQueryName,
				query: selectedQuery
			};

			this.setState({
				queries: newQueries,
				selectedQueryKey: newQueryName,
				showConfirmOverwriteModal: false,
				newQueryName: ""
			});

			settingsService.queries = newQueries;
		}
	};

	cancelSaveQuery = (e: any) => {
		e.preventDefault();
		this.setState({
			showSaveQueryModal: false,
			newQueryName: "",
			showConfirmOverwriteModal: false
		});
	};

	onSelectedQueryChange = (_: any, i?: IDropdownOption) => {
		this.setState(prevState => ({
			selectedQuery: prevState.queries.find(q => q.name === i?.key).query,
			selectedQueryKey: i ? (i.key as string) : undefined
		}));
	};

	confirmDeleteQuery = (e: any) => {
		e.preventDefault();
		this.removeQuery();
		this.setState({ showConfirmDeleteModal: false, queryKeyToBeRemoved: "" });
	};

	cancelDeleteQuery = (e: any) => {
		e.preventDefault();
		this.setState({ showConfirmDeleteModal: false, queryKeyToBeRemoved: "" });
	};

	onRemoveQueryClick = (item?: ISelectableOption) => {
		this.setState({
			showConfirmDeleteModal: true,
			queryKeyToBeRemoved: item ? (item.key as string) : ""
		});
	};

	removeQuery = () => {
		const { queries } = this.state;
		const newQueries = [...queries];
		newQueries.splice(
			newQueries.indexOf(newQueries.find(q => q.name === this.state.queryKeyToBeRemoved)),
			1
		);

		this.setState({ queries: newQueries });
		settingsService.queries = newQueries;
	};

	onRenderOption: IRenderFunction<ISelectableOption> = item => (
		<div className="dropdown-option">
			<span>{item?.key}</span>
			<Icon
				className="close-icon"
				iconName="ChromeClose"
				aria-hidden="true"
				onClick={() => this.onRemoveQueryClick(item)}
				aria-label={`Remove query ${item?.key}`}
				role="button"
				title="Remove query"
				tabIndex={0}
			/>
		</div>
	);

	render() {
		const {
			queries,
			selectedQuery,
			selectedQueryKey,
			showSaveQueryModal,
			newQueryName,
			showConfirmDeleteModal,
			showConfirmOverwriteModal
		} = this.state;
		return (
			<>
				<div className="qc-grid">
					<div className="qc-queryBox">
						<div className="qc-label">
							<Dropdown
								placeholder="Saved Queries"
								selectedKey={selectedQueryKey}
								options={queries.map(q => ({ key: q.name, text: q.name }))}
								onRenderOption={this.onRenderOption}
								styles={{ dropdown: { width: 200 } }}
								onChange={this.onSelectedQueryChange}
							/>
						</div>
						<FocusZone
							handleTabKey={FocusZoneTabbableElements.all}
							isCircularNavigation
							defaultActiveElement="#queryField"
						>
							<form onSubmit={this.executeQuery}>
								<TextField
									id="queryField"
									className="qc-query"
									value={selectedQuery}
									onChange={this.onChange}
								/>
							</form>
						</FocusZone>
						<div className="qc-queryControls">
							<DefaultButton className="query-button" onClick={this.executeQuery}>
								Run Query
							</DefaultButton>
							<IconButton
								className="query-save-button"
								iconProps={{ iconName: "Save" }}
								title="Save"
								ariaLabel="Save query"
								onClick={this.saveQueryButtonClicked}
							/>
						</div>
					</div>
				</div>
				<SaveQueryDialogComponent
					isVisible={showSaveQueryModal}
					onConfirm={this.saveQuery}
					onCancel={this.cancelSaveQuery}
					onChange={this.onChangeQueryName}
					query={newQueryName}
				/>
				<ConfirmQueryDialogComponent
					title="Query Already Exists"
					description="Saving this query will overwrite the existing one."
					action="Confirm"
					isVisible={showConfirmOverwriteModal}
					onConfirm={this.overwriteQuery}
					onCancel={this.cancelSaveQuery}
					defaultActiveElementId="deleteQueryField"
				/>
				<ConfirmQueryDialogComponent
					title="Are you sure?"
					action="Delete"
					isVisible={showConfirmDeleteModal}
					onConfirm={this.confirmDeleteQuery}
					onCancel={this.cancelDeleteQuery}
				/>
			</>
		);
	}
}
