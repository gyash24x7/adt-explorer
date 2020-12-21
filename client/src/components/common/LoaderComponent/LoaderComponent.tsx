// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { getTheme, Link, Spinner } from "@fluentui/react";

import "./LoaderComponent.scss";

export type LoaderComponentProps = {
	message?: string;
	cancel?: () => void;
};

const LoaderComponent = (props: LoaderComponentProps) => {
	const { message, cancel } = props;
	const styles = {
		circle: {
			border: `5px solid ${getTheme().palette.themeDarker}`,
			borderTopColor: getTheme().palette.themeTertiary,
			height: 56,
			width: 56
		}
	};

	return (
		<div className="app-loader">
			<div className="content">
				<Spinner styles={styles} />
				{message && <div className="status">{message}</div>}
				<div className="cancel">{cancel && <Link onClick={cancel}>Cancel</Link>}</div>
			</div>
		</div>
	);
};

export default LoaderComponent;
