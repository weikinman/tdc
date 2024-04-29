import OneDriveApi from './onedrive-api';
// import { _ } from './locale';
// import Setting from './models/Setting';
// import Synchronizer from './Synchronizer';
import BaseSyncTarget from './BaseSyncTarget.js';

import { parameters } from './parameters.js';
import { FileApi } from './file-api.js';
import { FileApiDriverOneDrive } from './file-api-driver-onedrive.js';
function _(value){
	return value;
}
const settings = {};
const Setting = {
	value(val){
		return settings[val];
	},
	setValue(key,val){
		settings[key] = value;
	}
}
export default class SyncTargetOneDrive extends BaseSyncTarget {

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	api_;

	static id() {
		return 3;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	constructor(db, options = null) {
		super(db, options);
		this.api_ = null;
	}

	static targetName() {
		return 'onedrive';
	}

	static label() {
		return _('OneDrive');
	}

	static description() {
		return 'A file hosting service operated by Microsoft as part of its web version of Office.';
	}

	static supportsSelfHosted() {
		return false;
	}

	async isAuthenticated() {
		return !!this.api().auth();
	}

	syncTargetId() {
		return SyncTargetOneDrive.id();
	}

	isTesting() {
		const p = parameters();
		return !!p.oneDriveTest;
	}

	oneDriveParameters() {
		const p = parameters();
		if (p.oneDriveTest) return p.oneDriveTest;
		return p.oneDrive;
	}

	authRouteName() {
		return 'OneDriveLogin';
	}

	api() {
		// if (this.isTesting()) {
		// 	return this.fileApi_.driver().api();
		// }

		if (this.api_) return this.api_;

		const isPublic = Setting.value('appType') !== 'cli' && Setting.value('appType') !== 'desktop';

		this.api_ = new OneDriveApi(this.oneDriveParameters().id, this.oneDriveParameters().secret, isPublic);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		this.api_.on('authRefreshed', (a) => {
			this.logger().info('Saving updated OneDrive auth.');
			Setting.setValue(`sync.${this.syncTargetId()}.auth`, a ? JSON.stringify(a) : null);
		});

		let auth = Setting.value(`sync.${this.syncTargetId()}.auth`);
		if (auth) {
			try {
				auth = JSON.parse(auth);
			} catch (error) {
				this.logger().warn('Could not parse OneDrive auth token');
				this.logger().warn(error);
				auth = null;
			}

			this.api_.setAuth(auth);
		}

		return this.api_;
	}

	async initFileApi() {
		let context = Setting.value(`sync.${this.syncTargetId()}.context`);
		context = context === '' ? null : JSON.parse(context);
		let accountProperties = context ? context.accountProperties : null;
		const api = this.api();

		if (!accountProperties) {
			accountProperties = await api.execAccountPropertiesRequest();
			context ? context.accountProperties = accountProperties : context = { accountProperties: accountProperties };
			Setting.setValue(`sync.${this.syncTargetId()}.context`, JSON.stringify(context));
		}
		api.setAccountProperties(accountProperties);
		const appDir = await this.api().appDirectory();
		// the appDir might contain non-ASCII characters
		// /[^\u0021-\u00ff]/ is used in Node.js to detect the unescaped characters.
		// See https://github.com/nodejs/node/blob/bbbf97b6dae63697371082475dc8651a6a220336/lib/_http_client.js#L176
		// eslint-disable-next-line prefer-regex-literals -- Old code before rule was applied
		const baseDir = RegExp(/[^\u0021-\u00ff]/).exec(appDir) !== null ? encodeURI(appDir) : appDir;
		const fileApi = new FileApi(baseDir, new FileApiDriverOneDrive(this.api()));
		fileApi.setSyncTargetId(this.syncTargetId());
		fileApi.setLogger(this.logger());
		return fileApi;
	}

	async initSynchronizer() {
		try {
			if (!(await this.isAuthenticated())) throw new Error('User is not authenticated');
			// return new Synchronizer(this.db(), await this.fileApi(), Setting.value('appType'));
		} catch (error) {
			BaseSyncTarget.dispatch({ type: 'SYNC_REPORT_UPDATE', report: { errors: [error] } });
			throw error;
		}


	}
}
