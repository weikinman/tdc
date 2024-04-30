import moment from 'moment';
import {basename,dirname} from './path'
async function basicDelta(path, getDirStatFn, options) {
	const outputLimit = 50;
	const itemIds = await options.allItemIdsHandler();
	if (!Array.isArray(itemIds)) throw new Error('Delta API not supported - local IDs must be provided');

	const logger = options && options.logger ? options.logger : new Logger();

	const context = basicDeltaContextFromOptions_(options);

	if (context.timestamp > Date.now()) {
		logger.warn(`BasicDelta: Context timestamp is greater than current time: ${context.timestamp}`);
		logger.warn('BasicDelta: Sync will continue but it is likely that nothing will be synced');
	}

	const newContext = {
		timestamp: context.timestamp,
		filesAtTimestamp: context.filesAtTimestamp.slice(),
		statsCache: context.statsCache,
		statIdsCache: context.statIdsCache,
		deletedItemsProcessed: context.deletedItemsProcessed,
	};

	// Stats are cached until all items have been processed (until hasMore is false)
	if (newContext.statsCache === null) {
		newContext.statsCache = await getDirStatFn(path);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		newContext.statsCache.sort((a, b) => {
			return a.updated_time - b.updated_time;
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		newContext.statIdsCache = newContext.statsCache.filter((item) => BaseItem.isSystemPath(item.path)).map((item) => BaseItem.pathToId(item.path));
		newContext.statIdsCache.sort(); // Items must be sorted to use binary search below
	}

	let output = [];

	const updateReport = {
		timestamp: context.timestamp,
		older: 0,
		newer: 0,
		equal: 0,
	};

	// Find out which files have been changed since the last time. Note that we keep
	// both the timestamp of the most recent change, *and* the items that exactly match
	// this timestamp. This to handle cases where an item is modified while this delta
	// function is running. For example:
	// t0: Item 1 is changed
	// t0: Sync items - run delta function
	// t0: While delta() is running, modify Item 2
	// Since item 2 was modified within the same millisecond, it would be skipped in the
	// next sync if we relied exclusively on a timestamp.
	for (let i = 0; i < newContext.statsCache.length; i++) {
		const stat = newContext.statsCache[i];

		if (stat.isDir) continue;

		if (stat.updated_time < context.timestamp) {
			updateReport.older++;
			continue;
		}

		// Special case for items that exactly match the timestamp
		if (stat.updated_time === context.timestamp) {
			if (context.filesAtTimestamp.indexOf(stat.path) >= 0) {
				updateReport.equal++;
				continue;
			}
		}

		if (stat.updated_time > newContext.timestamp) {
			newContext.timestamp = stat.updated_time;
			newContext.filesAtTimestamp = [];
			updateReport.newer++;
		}

		newContext.filesAtTimestamp.push(stat.path);
		output.push(stat);

		if (output.length >= outputLimit) break;
	}

	logger.info(`BasicDelta: Report: ${JSON.stringify(updateReport)}`);

	if (!newContext.deletedItemsProcessed) {
		// Find out which items have been deleted on the sync target by comparing the items
		// we have to the items on the target.
		// Note that when deleted items are processed it might result in the output having
		// more items than outputLimit. This is acceptable since delete operations are cheap.
		const deletedItems = [];
		for (let i = 0; i < itemIds.length; i++) {
			const itemId = itemIds[i];

			if (ArrayUtils.binarySearch(newContext.statIdsCache, itemId) < 0) {
				deletedItems.push({
					path: BaseItem.systemPath(itemId),
					isDeleted: true,
				});
			}
		}

		const percentDeleted = itemIds.length ? deletedItems.length / itemIds.length : 0;

		// If more than 90% of the notes are going to be deleted, it's most likely a
		// configuration error or bug. For example, if the user moves their Nextcloud
		// directory, or if a network drive gets disconnected and returns an empty dir
		// instead of an error. In that case, we don't wipe out the user data, unless
		// they have switched off the fail-safe.
		if (options.wipeOutFailSafe && percentDeleted >= 0.90) throw new JoplinError(sprintf('Fail-safe: Sync was interrupted because %d%% of the data (%d items) is about to be deleted. To override this behaviour disable the fail-safe in the sync settings.', Math.round(percentDeleted * 100), deletedItems.length), 'failSafe');

		output = output.concat(deletedItems);
	}

	newContext.deletedItemsProcessed = true;

	const hasMore = output.length >= outputLimit;

	if (!hasMore) {
		// Clear temporary info from context. It's especially important to remove deletedItemsProcessed
		// so that they are processed again on the next sync.
		newContext.statsCache = null;
		newContext.statIdsCache = null;
		delete newContext.deletedItemsProcessed;
	}

	return {
		hasMore: hasMore,
		context: newContext,
		items: output,
	};
}
// import { dirname, basename } from './path-utils';
import shim from './shim';
import Buffer from 'buffer';
// import { ltrimSlashes } from './path-utils';
const ltrimSlashes = function(value){
	return value;
}

let count = 0;
export class FileApiDriverOneDrive {
	constructor(api) {
		this.api_ = api;
		this.pathCache_ = {};
	}
	static id() {
		count = count + 1;
		return 'FileApiDriverOneDrive'+(count);
	}
	api() {
		return this.api_;
	}

	itemFilter_() {
		return {
			select: '*'//'name,file,folder,fileSystemInfo,parentReference',
		};
	}

	makePath_(path) {
		return path;
	}

	makeItems_(odItems) {
		const output = [];
		for (let i = 0; i < odItems.length; i++) {
			output.push(this.makeItem_(odItems[i]));
		}
		return output;
	}

	makeItem_(odItem) {
		const output = {
			path: odItem.name,
			isDir: 'folder' in odItem,
		};

		if ('deleted' in odItem) {
			output.isDeleted = true;
		} else {
			// output.created_time = moment(odItem.fileSystemInfo.createdDateTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('x');
			output.updated_time = Number(moment(odItem.fileSystemInfo.lastModifiedDateTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ').format('x'));
		}

		return output;
	}

	async statRaw_(path) {
		let item = null;
		try {
			console.log('statRaw_',path,this.makePath_(path), this.itemFilter_())
			item = await this.api_.execJson('GET', this.makePath_(path), this.itemFilter_());
		} catch (error) {
			if (error.code === 'itemNotFound') return null;
			throw error;
		}
		return item;
	}

	async stat(path) {
		const item = await this.statRaw_(path);
		if (!item) return null;
		return this.makeItem_(item);
	}

	async setTimestamp(path, timestamp) {
		const body = {
			fileSystemInfo: {
				lastModifiedDateTime:
					`${moment
						.unix(timestamp / 1000)
						.utc()
						.format('YYYY-MM-DDTHH:mm:ss.SSS')}Z`,
			},
		};
		const item = await this.api_.execJson('PATCH', this.makePath_(path), null, body);
		return this.makeItem_(item);
	}

	async list(path, options = null) {
		options = { context: null, ...options };

		let query = { ...this.itemFilter_(), '$top': 1000 };
		let url = `${this.makePath_(path)}:/children`;

		if (options.context) {
			// If there's a context, it already includes all required query
			// parameters, including $top
			query = null;
			url = options.context;
		}

		const r = await this.api_.execJson('GET', url, query);

		return {
			hasMore: !!r['@odata.nextLink'],
			items: this.makeItems_(r.value),
			context: r['@odata.nextLink'],
		};
	}

	async get(path, options = null) {
		if (!options) options = {};

		try {
			if (options.target === 'file') {
				const response = await this.api_.exec('GET', `${this.makePath_(path)}:/content`, null, null, options);
				return response;
			} else {
				const content = await this.api_.execText('GET', `${this.makePath_(path)}:/content`);
				return content;
			}
		} catch (error) {
			if (error.code === 'itemNotFound') return null;
			throw error;
		}
	}

	async mkdir(path) {
		let item = await this.stat(path);
		if (item) return item;

		const parentPath = dirname(path);
		item = await this.api_.execJson('POST', `${this.makePath_(parentPath)}:/children`, this.itemFilter_(), {
			name: basename(path),
			folder: {},
		});

		return this.makeItem_(item);
	}

	async put(path, content, options = null) {
		if (!options) options = {};

		let response = null;
		// We need to check the file size as files > 4 MBs are uploaded in a different way than files < 4 MB (see https://docs.microsoft.com/de-de/onedrive/developer/rest-api/concepts/upload?view=odsp-graph-online)
		let byteSize = null;

		if (options.source === 'file') {
			byteSize = (await shim.fsDriver().stat(options.path)).size;
		} else {
			options.headers = { 'Content-Type': 'text/plain' };
			byteSize = new Blob([content]).size;
		}

		path = byteSize < 4 * 1024 * 1024 ? `${this.makePath_(path)}:/content` : `${this.makePath_(path)}:/createUploadSession`;
		response = await this.api_.exec('PUT', path, null, content, options);

		return response;
	}

	delete(path) {
		return this.api_.exec('DELETE', this.makePath_(path));
	}

	async move() {
		// Cannot work in an atomic way because if newPath already exist, the OneDrive API throw an error
		// "An item with the same name already exists under the parent". Some posts suggest to use
		// @name.conflictBehavior [0]but that doesn't seem to work. So until Microsoft fixes this
		// it's not possible to do an atomic move.
		//
		// [0] https://stackoverflow.com/questions/29191091/onedrive-api-overwrite-on-move
		throw new Error('NOT WORKING');

		// let previousItem = await this.statRaw_(oldPath);

		// let newDir = dirname(newPath);
		// let newName = basename(newPath);

		// // We don't want the modification date to change when we move the file so retrieve it
		// // now set it in the PATCH operation.

		// let item = await this.api_.execJson('PATCH', this.makePath_(oldPath), this.itemFilter_(), {
		// 	name: newName,
		// 	parentReference: { path: newDir },
		// 	fileSystemInfo: {
		// 		lastModifiedDateTime: previousItem.fileSystemInfo.lastModifiedDateTime,
		// 	},
		// });

		// return this.makeItem_(item);
	}

	format() {
		throw new Error('Not implemented');
	}

	async pathDetails_(path) {
		if (this.pathCache_[path]) return this.pathCache_[path];
		const output = await this.api_.execJson('GET', path);
		this.pathCache_[path] = output;
		return this.pathCache_[path];
	}

	async clearRoot() {
		const recurseItems = async (path) => {
			path = ltrimSlashes(path);
			const result = await this.list(this.fileApi_.fullPath(path));
			const output = [];

			for (const item of result.items) {
				const fullPath = ltrimSlashes(`${path}/${item.path}`);
				if (item.isDir) {
					await recurseItems(fullPath);
				}
				await this.delete(this.fileApi_.fullPath(fullPath));
			}

			return output;
		};

		await recurseItems('');
	}

	async delta(path, options = null) {
		const getDirStats = async path => {
			let items = [];
			let context = null;

			while (true) {
				const result = await this.list(path, { includeDirs: false, context: context });
				items = items.concat(result.items);
				context = result.context;
				if (!result.hasMore) break;
			}

			return items;
		};

		return await basicDelta(path, getDirStats, options);
	}

	async delta_BROKEN(path, options = null) {
		const output = {
			hasMore: false,
			context: {},
			items: [],
		};

		const freshStartDelta = () => {
			const accountProperties = this.api_.accountProperties_;
			const url = `/drives/${accountProperties.driveId}/root/delta`;
			const query = this.itemFilter_();
			query.select += ',deleted';
			return { url: url, query: query };
		};

		const pathDetails = await this.pathDetails_(path);
		const pathId = pathDetails.id;

		const context = options ? options.context : null;
		let url = context ? context.nextLink : null;
		let query = null;

		if (!url) {
			const info = freshStartDelta();
			url = info.url;
			query = info.query;
		}

		let response = null;
		try {
			response = await this.api_.execJson('GET', url, query);
		} catch (error) {
			if (error.code === 'resyncRequired') {
				// Error: Resync required. Replace any local items with the server's version (including deletes) if you're sure that the service was up to date with your local changes when you last sync'd. Upload any local changes that the server doesn't know about.
				// Code: resyncRequired
				// Request: GET https://graph.microsoft.com/v1.0/drive/root:/Apps/JoplinDev:/delta?select=...

				// The delta token has expired or is invalid and so a full resync is required. This happens for example when all the items
				// on the OneDrive App folder are manually deleted. In this case, instead of sending the list of deleted items in the delta
				// call, OneDrive simply request the client to re-sync everything.

				// OneDrive provides a URL to resume syncing from but it does not appear to work so below we simply start over from
				// the beginning. The synchronizer will ensure that no duplicate are created and conflicts will be resolved.

				// More info there: https://stackoverflow.com/q/46941371/561309

				const info = freshStartDelta();
				url = info.url;
				query = info.query;
				response = await this.api_.execJson('GET', url, query);
			} else {
				throw error;
			}
		}

		const items = [];

		// The delta API might return things that happens in subdirectories and outside of the joplin directory.
		// We don't want to deal with these since all the files we're interested in are at the root of the joplin directory
		// (The .resource dir is special since it's managed directly by the clients and resources never change - only the
		// associated .md file at the root is synced). So in the loop below we check that the parent is indeed the joplin
		// directory, otherwise the item is skipped.
		// At OneDrive for Business delta requests can only make at the root of OneDrive.  Not sure but it's possible that
		// the delta API also returns events for files that are copied outside of the app directory and later deleted or
		// modified when using OneDrive Personal).

		for (let i = 0; i < response.value.length; i++) {
			const v = response.value[i];
			if (v.parentReference.id !== pathId) continue;
			items.push(this.makeItem_(v));
		}

		output.items = output.items.concat(items);

		let nextLink = null;

		if (response['@odata.nextLink']) {
			nextLink = response['@odata.nextLink'];
			output.hasMore = true;
		} else {
			if (!response['@odata.deltaLink']) throw new Error(`Delta link missing: ${JSON.stringify(response)}`);
			nextLink = response['@odata.deltaLink'];
		}

		output.context = { nextLink: nextLink };

		// https://dev.onedrive.com/items/view_delta.htm
		// The same item may appear more than once in a delta feed, for various reasons. You should use the last occurrence you see.
		// So remove any duplicate item from the array.
		const temp = [];
		const seenPaths = [];
		for (let i = output.items.length - 1; i >= 0; i--) {
			const item = output.items[i];
			if (seenPaths.indexOf(item.path) >= 0) continue;
			temp.splice(0, 0, item);
			seenPaths.push(item.path);
		}

		output.items = temp;

		return output;
	}
}

