// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { readFile } from "../../utils/utilities";
import { DataModel } from "../models/DataModel";

export class JsonImportPlugin {
	async tryLoad(file: File) {
		if (!file.name.endsWith(".json")) {
			return;
		}

		const data: DataModel = (await readFile(file)) as any;
		if (
			!data ||
			!data.digitalTwinsFileInfo ||
			data.digitalTwinsFileInfo.fileVersion !== "1.0.0" ||
			!data.digitalTwinsGraph
		) {
			throw new Error("Unexpected JSON contents");
		}

		return data;
	}
}
