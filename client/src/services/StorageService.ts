// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

class StorageService {
	getLocalStoragePrimitive = (name: string) => localStorage.getItem(name);

	getLocalStorageObject = (name: string) => JSON.parse(<string>localStorage.getItem(name));

	setLocalStorageObject = (name: string, dataObj: any) =>
		localStorage.setItem(name, JSON.stringify(dataObj));

	removeLocalStorageObject = (name: string) => localStorage.removeItem(name);
}

export const storageService = new StorageService();
