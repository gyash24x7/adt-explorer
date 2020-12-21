// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { eventService } from "../../../services/EventService";
import { print } from "../../../services/LoggingService";
import "./OutputComponent.scss";

export type OutputComponentState = {
	logs: { data: string; method: string }[];
};

export class OutputComponent extends React.Component<{}, OutputComponentState> {
	state: OutputComponentState = { logs: [] };

	componentDidMount() {
		eventService.subscribeLog((data: any) => this.update(data.data, data.type));
		print("**********************************************************", "ok");
		print("*** Welcome to the Azure Digital Twins Demo Playground ***", "ok");
		print("**********************************************************", "ok");
	}

	update = (newData: string, newType: string) => {
		let newDataWithFallback = newData;
		if (!newData) newDataWithFallback = "";

		let newTypeWithFallback = newType;
		if (newType !== "error" && newType !== "info" && newType !== "warning" && newType !== "ok") {
			newTypeWithFallback = "info";
		}

		const lines = newDataWithFallback.split(/\r\n|\r|\n/);
		const nlog = lines.map(line => ({ data: line, method: newTypeWithFallback }));
		this.setState(prevState => ({ logs: [...prevState.logs, ...nlog] }));
	};

	componentDidUpdate() {
		const objDiv = document.getElementById("oc-scroll");
		if (objDiv) objDiv.scrollTop = objDiv.scrollHeight;
	}

	render() {
		const { logs } = this.state;
		return (
			<div id="oc-scroll" className="oc-output">
				{logs.map((log, i) => (
					<pre key={`log-${i}`} className={`oc-${log.method}`}>
						{log.data}
					</pre>
				))}
			</div>
		);
	}
}
