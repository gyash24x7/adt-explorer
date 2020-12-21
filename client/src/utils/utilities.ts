import jsonlint from "jsonlint";
import { Relationship } from "../services/models/DataModel";

export function readFile(file: Blob) {
	// Always return a Promise
	return new Promise<any>((resolve, reject) => {
		let content = "";
		const reader = new FileReader();
		// Wait till complete
		reader.onloadend = function (e) {
			content = e.target?.result as string;

			try {
				const result: any = jsonlint.parse(content);
				resolve(result);
			} catch (exp) {
				reject(exp);
			}
		};
		// Make sure to handle error states
		reader.onerror = function (e) {
			reject(e);
		};
		reader.readAsText(file);
	});
}

export function sortArray(array: any[], ...propertyNames: string[]) {
	array.sort((a, b) => {
		for (const p of propertyNames) {
			const pA = a[p].toUpperCase();
			const pB = b[p].toUpperCase();
			if (pA < pB) {
				return -1;
			}
			if (pA > pB) {
				return 1;
			}
		}

		return 0;
	});
}

export function capitalizeName(name: string) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getUniqueRelationshipId(relationship: Relationship) {
	return `${relationship.$sourceId}_${relationship.$relationshipId}`;
}
