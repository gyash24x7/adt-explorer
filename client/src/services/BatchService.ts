// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const MAX_CONCURRENT_QUERIES = 6;

export type PPromise = { promise?: Promise<any> };

export type BatchServiceConfig = {
	maxConcurrentQueries?: number;
	refreshSize?: number;
	refresh?: () => any;
	action: (item: any, resolve: () => void, reject: (reason?: any) => void) => any;
	update?: (p: number) => any;
	items: any[];
};

export class BatchService {
	maxConcurrentQueries: number;
	refreshSize: number;
	_count = 0;
	_items = [] as any[];
	_update?: (p: number) => any;
	_refresh?: () => any;
	_action: (item: any, resolve: () => void, reject: (reason?: any) => void) => any;

	constructor(config: BatchServiceConfig) {
		this.maxConcurrentQueries = config.maxConcurrentQueries || MAX_CONCURRENT_QUERIES;
		this.refreshSize = config.refreshSize || Math.round(config.items.length / 3);
		this._refresh = config.refresh;
		this._update = config.update;
		this._action = config.action;
		this._items = config.items;
	}

	async run() {
		const promises = [] as PPromise[];
		this._count = 0;
		this.update(0);

		for (let i = 0; i < this._items.length; i++) {
			const item = this._items[i];

			if (i % this.refreshSize === 0) {
				await this.refresh();
			}
			if (promises.length === this.maxConcurrentQueries) {
				await Promise.race(promises.map(p => p.promise));
			}

			const p: PPromise = {};
			p.promise = new Promise((resolve, reject) => {
				const res = () => {
					promises.splice(promises.indexOf(p), 1);

					try {
						this.update((this._count++ / this._items.length) * 100);
						resolve();
					} catch (e) {
						reject(e);
					}
				};

				try {
					this._action(item, res, reject);
				} catch (e) {
					reject(e);
				}
			});

			promises.push(p);
		}

		await Promise.all(promises.map(p => p.promise));
		await this.refresh();
		this.update(100);
	}

	update(p: number) {
		if (this._update) {
			this._update(p);
		}
	}

	async refresh() {
		if (this._refresh) {
			await this._refresh();
		}
	}
}
