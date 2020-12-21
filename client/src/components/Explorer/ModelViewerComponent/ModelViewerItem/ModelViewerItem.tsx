// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { RefObject, useRef } from "react";
import { IconButton, mergeStyleSets, Stack } from "@fluentui/react";
import { ModelItem } from "../ModelViewerComponent";

const commonStyles = {
	display: "inline-block",
	cursor: "default",
	boxSizing: "border-box",
	verticalAlign: "top",
	background: "none",
	backgroundColor: "transparent",
	border: "none"
};

const classNames = mergeStyleSets({
	item: { selectors: { "&:hover": { background: "#444" } } },
	// Overwrites the default style for Button
	check: [commonStyles, { padding: "11px 8px" }],
	cell: [commonStyles, { overflow: "hidden", height: 36, padding: 8 }]
});

export type ModelViewerItemProps = {
	item: ModelItem;
	itemIndex: number;
	onCreate: (e: any) => void;
	onDelete: (e: any) => void;
	onView: (e: any) => void;
	onUpdateModelImage: (modelId: string, ref: RefObject<HTMLInputElement>) => void;
	modelImage: any;
	onSetModelImage: (e: any, item: any, ref: RefObject<HTMLInputElement>) => void;
};

export const ModelViewerItem = (props: ModelViewerItemProps) => {
	const uploadModelImageRef = useRef<HTMLInputElement>(null);

	const onHandleModelImage = () => {
		if (props.modelImage) {
			props.onUpdateModelImage(props.item.key, uploadModelImageRef);
		} else {
			uploadModelImageRef.current?.click();
		}
	};

	return (
		<div
			className={classNames.item}
			data-is-focusable={true}
			data-selection-index={props.itemIndex}
		>
			<div
				className="mv_listItem"
				data-is-focusable={true}
				data-selection-toggle={true}
				data-selection-invoke={true}
			>
				<Stack horizontal={false}>
					<Stack horizontal>
						<div className="mv_listItemName" data-selection-invoke={true}>
							{props.item.displayName}
						</div>
						<div className="mv_buttonGroup">
							<IconButton
								iconProps={{ iconName: "Delete" }}
								id={props.item.key}
								title="Delete Model"
								ariaLabel="Delete Model"
								className="mv-loadButtons"
								onClick={props.onDelete}
							/>
							<IconButton
								iconProps={{ iconName: "ImageSearch" }}
								id={props.item.key}
								title="Upload Model Image"
								ariaLabel="Upload Model Image"
								className="mv-loadButtons"
								onClick={onHandleModelImage}
							/>
							<IconButton
								iconProps={{ iconName: "Info" }}
								id={props.item.key}
								title="View Model"
								ariaLabel="View Model"
								className="mv-loadButtons"
								onClick={props.onView}
							/>
							<IconButton
								iconProps={{ iconName: "AddTo" }}
								id={props.item.key}
								title="Create a Twin"
								ariaLabel="Create a Twin"
								className="mv-loadButtons"
								onClick={props.onCreate}
							/>
							<input
								id={props.item.key}
								type="file"
								name="image-upload"
								className="mv-fileInput"
								accept="image/png, image/jpeg"
								ref={uploadModelImageRef}
								onChange={evt => props.onSetModelImage(evt, props.item, uploadModelImageRef)}
							/>
						</div>
					</Stack>
					<div className="mv_listItemKey" data-selection-invoke={true}>
						{props.item.key}
					</div>
				</Stack>
			</div>
		</div>
	);
};
