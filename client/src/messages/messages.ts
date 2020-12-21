// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const Messages = {
	error: {
		render: (error: Error, componentStack: string, componentName: string) =>
			`${componentName} render error: ${error}. Error Component Stack: ${componentStack}`,
		service: (error: Error) => {
			const { message, stack } = error;
			return `Request failed: ${message}. ${stack}`;
		}
	}
};

export default Messages;
