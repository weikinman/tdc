import SyncBase from './SyncBase'
import OneDriveApi from './drive-api/onedrive-api';
import Setting from './setting/index.js'
export default class SyncOneDrive extends SyncBase{
    
    api_;

    static id() {
     return 3;   
    }

    constructor(db,options){
        super(db,options);
    }


    syncTargetId() {
     return SyncOneDrive.id();   
    }

    api() {
        if(this.api_) return this.api_;
        const clientInfo = {
            id: 'e09fc0de-c958-424f-83a2-e56a721d331b',
            secret: 'JA3cwsqSGHFtjMwd5XoF5L5',
        }
        const onedriveApi = new OneDriveApi(clientInfo.id,clientInfo.secret);

        return onedriveApi;
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
}