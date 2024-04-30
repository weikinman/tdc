
import shim from './shim/shim-node.js';
// import BaseItem from './models/BaseItem';
import time from './time.js';

// import JoplinError from './JoplinError';
import * as ArrayUtils from './ArrayUtils';
import { sprintf } from 'sprintf-js';
import {Mutex} from 'async-mutex';

const logger = {
	info(){},
	debug(val){
		console.log('file-api',val)
	}
}

function systemPath(itemOrId, extension = null) {
	if (extension === null) extension = 'md';

	if (typeof itemOrId === 'string') return `${itemOrId}.${extension}`;
	else return `${itemOrId.id}.${extension}`;
}

function isSystemPath(path) {
	// 1b175bb38bba47baac22b0b47f778113.md
	if (!path || !path.length) return false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	let p = path.split('/');
	p = p[p.length - 1];
	p = p.split('.');
	if (p.length !== 2) return false;
	return p[0].length === 32 && p[1] === 'md';
}
function pathToId(path) {
	const p = path.split('/');
	const s = p[p.length - 1].split('.');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	let name = s[0];
	if (!name) return name;
	name = name.split('-');
	return name[name.length - 1];
}
const BaseItem = {
	systemPath,
	isSystemPath,
	pathToId
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
function requestCanBeRepeated(error) {
	const errorCode = typeof error === 'object' && error.code ? error.code : null;

	// Unauthorized/forbidden error - means username or password is incorrect or other
	// permission issue, which won't be fixed by repeating the request.
	if (errorCode === 403 || errorCode === 401) return false;

	// The target is explicitly rejecting the item so repeating wouldn't make a difference.
	if (errorCode === 'rejectedByTarget' || errorCode === 'isReadOnly') return false;

	// We don't repeat failSafe errors because it's an indication of an issue at the
	// server-level issue which usually cannot be fixed by repeating the request.
	// Also we print the previous requests and responses to the log in this case,
	// so not repeating means there will be less noise in the log.
	if (errorCode === 'failSafe') return false;

	return true;
}

// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
async function tryAndRepeat(fn, count) {
	let retryCount = 0;

	// Don't use internal fetch retry mechanim since we
	// are already retrying here.
	const shimFetchMaxRetryPrevious = shim.fetchMaxRetrySet(0);
	const defer = () => {
		shim.fetchMaxRetrySet(shimFetchMaxRetryPrevious);
	};

	while (true) {
		try {
			const result = await fn();
			defer();
			return result;
		} catch (error) {
			if (retryCount >= count || !requestCanBeRepeated(error)) {
				defer();
				throw error;
			}
			retryCount++;
			await time.sleep(1 + retryCount * 3);
		}
	}
}


class FileApi {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	baseDir_;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	driver_;
	logger_ = logger;
	syncTargetId_ = null;
	tempDirName_ = null;
	requestRepeatCount_ = null; // For testing purpose only - normally this value should come from the driver
	remoteDateOffset_ = 0;
	remoteDateNextCheckTime_ = 0;
	remoteDateMutex_ = new Mutex();
	initialized_ = false;

	// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any -- Old code before rule was applied, Old code before rule was applied
	constructor(baseDir, driver) {
		this.baseDir_ = baseDir;
		this.driver_ = driver;
		this.driver_.fileApi_ = this;
	}

	async initialize() {
		if (this.initialized_) return;
		this.initialized_ = true;
		if (this.driver_.initialize) return this.driver_.initialize(this.fullPath(''));
	}

	// This can be true if the driver implements uploading items in batch. Will
	// probably only be supported by Joplin Server.
	get supportsMultiPut() {
		return !!this.driver().supportsMultiPut;
	}

	// This can be true when the sync target timestamps (updated_time) provided
	// in the delta call are guaranteed to be accurate. That requires
	// explicitly setting the timestamp, which is not done anymore on any sync
	// target as it wasn't accurate (for example, the file system can't be
	// relied on, and even OneDrive for some reason doesn't guarantee that the
	// timestamp you set is what you get back).
	//
	// The only reliable one at the moment is Joplin Server since it reads the
	// updated_time property directly from the item (it unserializes it
	// server-side).
	get supportsAccurateTimestamp() {
		return !!this.driver().supportsAccurateTimestamp;
	}

	get supportsLocks() {
		return !!this.driver().supportsLocks;
	}

	async fetchRemoteDateOffset_() {
		const tempFile = `${this.tempDirName()}/timeCheck${Math.round(Math.random() * 1000000)}.txt`;
		const startTime = Date.now();
		await this.put(tempFile, 'timeCheck');

		// Normally it should be possible to read the file back immediately but
		// just in case, read it in a loop.
		const loopStartTime = Date.now();
		let stat = null;
		while (Date.now() - loopStartTime < 5000) {
			stat = await this.stat(tempFile);
			if (stat) break;
			await time.msleep(200);
		}

		if (!stat) throw new Error('Timed out trying to get sync target clock time');

		void this.delete(tempFile); // No need to await for this call

		const endTime = Date.now();
		const expectedTime = Math.round((endTime + startTime) / 2);
		return stat.updated_time - expectedTime;
	}

	// Approximates the current time on the sync target. It caches the time offset to
	// improve performance.
	async remoteDate() {
		const shouldSyncTime = () => {
			return !this.remoteDateNextCheckTime_ || Date.now() > this.remoteDateNextCheckTime_;
		};

		if (shouldSyncTime()) {
			const release = await this.remoteDateMutex_.acquire();

			try {
				// Another call might have refreshed the time while we were waiting for the mutex,
				// so check again if we need to refresh.
				if (shouldSyncTime()) {
					this.remoteDateOffset_ = await this.fetchRemoteDateOffset_();
					// The sync target clock should rarely change but the device one might,
					// so we need to refresh relatively frequently.
					this.remoteDateNextCheckTime_ = Date.now() + 10 * 60 * 1000;
				}
			} catch (error) {
				logger.warn('Could not retrieve remote date - defaulting to device date:', error);
				this.remoteDateOffset_ = 0;
				this.remoteDateNextCheckTime_ = Date.now() + 60 * 1000;
			} finally {
				release();
			}
		}

		return new Date(Date.now() + this.remoteDateOffset_);
	}

	// Ideally all requests repeating should be done at the FileApi level to remove duplicate code in the drivers, but
	// historically some drivers (eg. OneDrive) are already handling request repeating, so this is optional, per driver,
	// and it defaults to no repeating.
	requestRepeatCount() {
		if (this.requestRepeatCount_ !== null) return this.requestRepeatCount_;
		if (this.driver_.requestRepeatCount) return this.driver_.requestRepeatCount();
		return 0;
	}

	lastRequests() {
		return this.driver_.lastRequests ? this.driver_.lastRequests() : [];
	}

	clearLastRequests() {
		if (this.driver_.clearLastRequests) this.driver_.clearLastRequests();
	}

	baseDir() {
		return typeof this.baseDir_ === 'function' ? this.baseDir_() : this.baseDir_;
	}

	tempDirName() {
		if (this.tempDirName_ === null) throw Error('Temp dir not set!');
		return this.tempDirName_;
	}

	setTempDirName(v) {
		this.tempDirName_ = v;
	}

	fsDriver() {
		return shim.fsDriver();
	}

	driver() {
		return this.driver_;
	}

	setSyncTargetId(v) {
		this.syncTargetId_ = v;
	}

	syncTargetId() {
		if (this.syncTargetId_ === null) throw new Error('syncTargetId has not been set!!');
		return this.syncTargetId_;
	}

	setLogger(l) {
		if (!l) l = logger;
		this.logger_ = l;
	}

	logger() {
		return this.logger_;
	}

	fullPath(path) {
		const output = [];
		if (this.baseDir()) output.push(this.baseDir());
		if (path) output.push(path);
		return output.join('/');
	}

	// DRIVER MUST RETURN PATHS RELATIVE TO `path`
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async list(path = '', options = null) {
		if (!options) options = {};
		if (!('includeHidden' in options)) options.includeHidden = false;
		if (!('context' in options)) options.context = null;
		if (!('includeDirs' in options)) options.includeDirs = true;
		if (!('syncItemsOnly' in options)) options.syncItemsOnly = false;

		logger.debug(`list ${this.baseDir()}`);

		const result = await tryAndRepeat(() => this.driver_.list(this.fullPath(path), options), this.requestRepeatCount());

		if (!options.includeHidden) {
			const temp = [];
			for (let i = 0; i < result.items.length; i++) {
				if (!result.items[i].path) temp.push(result.items[i]);
			}
			result.items = temp;
		}

		if (!options.includeDirs) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			result.items = result.items.filter((f) => !f.isDir);
		}

		if (options.syncItemsOnly) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			result.items = result.items.filter((f) => !f.isDir && BaseItem.isSystemPath(f.path));
		}

		return result;
	}

	// Deprecated
	setTimestamp(path, timestampMs) {
		logger.debug(`setTimestamp ${this.fullPath(path)}`);
		return tryAndRepeat(() => this.driver_.setTimestamp(this.fullPath(path), timestampMs), this.requestRepeatCount());
		// return this.driver_.setTimestamp(this.fullPath(path), timestampMs);
	}

	mkdir(path) {
		logger.debug(`mkdir ${this.fullPath(path)}`);
		return tryAndRepeat(() => this.driver_.mkdir(this.fullPath(path)), this.requestRepeatCount());
	}

	async stat(path) {
		logger.debug(`stat ${this.fullPath(path)}`);

		const output = await tryAndRepeat(() => this.driver_.stat(this.fullPath(path)), this.requestRepeatCount());

		if (!output) return output;
		output.path = path;
		return output;
	}

	// Returns UTF-8 encoded string by default, or a Response if `options.target = 'file'`
	get(path, options = null) {
		if (!options) options = {};
		if (!options.encoding) options.encoding = 'utf8';
		logger.debug(`get ${this.fullPath(path)}`);
		return tryAndRepeat(() => this.driver_.get(this.fullPath(path), options), this.requestRepeatCount());
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async put(path, content, options = null) {
		logger.debug(`put ${this.fullPath(path)}`, options);

		if (options && options.source === 'file') {
			if (!(await this.fsDriver().exists(options.path))) throw new Error(`File not found: ${options.path}`, 'fileNotFound');
		}

		return tryAndRepeat(() => this.driver_.put(this.fullPath(path), content, options), this.requestRepeatCount());
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async multiPut(items, options = null) {
		if (!this.driver().supportsMultiPut) throw new Error('Multi PUT not supported');
		return tryAndRepeat(() => this.driver_.multiPut(items, options), this.requestRepeatCount());
	}

	delete(path) {
		logger.debug(`delete ${this.fullPath(path)}`);
		return tryAndRepeat(() => this.driver_.delete(this.fullPath(path)), this.requestRepeatCount());
	}

	// Deprecated
	move(oldPath, newPath) {
		logger.debug(`move ${this.fullPath(oldPath)} => ${this.fullPath(newPath)}`);
		return tryAndRepeat(() => this.driver_.move(this.fullPath(oldPath), this.fullPath(newPath)), this.requestRepeatCount());
	}

	// Deprecated
	format() {
		return tryAndRepeat(() => this.driver_.format(), this.requestRepeatCount());
	}

	clearRoot() {
		return tryAndRepeat(() => this.driver_.clearRoot(this.baseDir()), this.requestRepeatCount());
	}

	delta(path, option = null) {
		logger.debug(`delta ${this.fullPath(path)}`);
		return tryAndRepeat(() => this.driver_.delta(this.fullPath(path), options), this.requestRepeatCount());
	}

	async acquireLock(type, clientTyp, clientId) {
		if (!this.supportsLocks) throw new Error('Sync target does not support built-in locks');
		return tryAndRepeat(() => this.driver_.acquireLock(type, clientType, clientId), this.requestRepeatCount());
	}

	async releaseLock(type, clientTyp, clientId) {
		if (!this.supportsLocks) throw new Error('Sync target does not support built-in locks');
		return tryAndRepeat(() => this.driver_.releaseLock(type, clientType, clientId), this.requestRepeatCount());
	}

	async listLocks() {
		if (!this.supportsLocks) throw new Error('Sync target does not support built-in locks');
		return tryAndRepeat(() => this.driver_.listLocks(), this.requestRepeatCount());
	}

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
function basicDeltaContextFromOptions_(options) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	const output = {
		timestamp: 0,
		filesAtTimestamp: [],
		statsCache: null,
		statIdsCache: null,
		deletedItemsProcessed: false,
	};

	if (!options || !options.context) return output;

	const d = new Date(options.context.timestamp);

	output.timestamp = isNaN(d.getTime()) ? 0 : options.context.timestamp;
	output.filesAtTimestamp = Array.isArray(options.context.filesAtTimestamp) ? options.context.filesAtTimestamp.slice() : [];
	output.statsCache = options.context && options.context.statsCache ? options.context.statsCache : null;
	output.statIdsCache = options.context && options.context.statIdsCache ? options.context.statIdsCache : null;
	output.deletedItemsProcessed = options.context && 'deletedItemsProcessed' in options.context ? options.context.deletedItemsProcessed : false;

	return output;
}

// This is the basic delta algorithm, which can be used in case the cloud service does not have
// a built-in delta API. OneDrive and Dropbox have one for example, but Nextcloud and obviously
// the file system do not.
// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any -- Old code before rule was applied, Old code before rule was applied
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
		if (options.wipeOutFailSafe && percentDeleted >= 0.90) throw new Error(sprintf('Fail-safe: Sync was interrupted because %d%% of the data (%d items) is about to be deleted. To override this behaviour disable the fail-safe in the sync settings.', Math.round(percentDeleted * 100), deletedItems.length), 'failSafe');

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

export { FileApi, basicDelta };
