import shim from "../shim/shim-node";
import { stringify, parse } from 'query-string';
import Setting from '../setting/index.js'
const urlUtils = {};
urlUtils.objectToQueryString = function(query) {
	if (!query) return '';

	let queryString = '';
	const s = [];
	for (const k in query) {
		if (!query.hasOwnProperty(k)) continue;
		s.push(`${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`);
	}
	queryString = s.join('&');

	return queryString;
};
/**
 * 
 */
let authInfo =  {
    access_token
: 
"EwBoA8l6BAAUbDba3x2OMJElkF7gJ4z/VbCPEz0AAUqZRXBfnsssfMOzAfG2GZKfdzpFuuhBopTsSqDychz4k2wIr1H/gZhnxfYtWpEL/1N5G3Q1pZ0U+J8ldC0/7Mh/uSFANFKfaOSzM+jYbXLQE3GfaWiK58c5PDmSu3x91RQQ0wYb6SexNocRHUw9sB4dVFuq0PIvcR7ru0+1TXcz4lCGy8Hfx9/hkM80vGXOdC8fFsqEs2m/bZS1NF1hz0MyNz9g50Z/Upw9EIIylSmmIoGCBy22jnvekooB/5gfNDn5JdnBi1+J5GDjZDTSwz2+ypeNWyJ05/wa6KmhdnhN0xmhzEU2tpkqavjyjypEBHZIGtVo33LfUYN84l74oyMDZgAACJXE2sL4HFjTOAKgEpIvUbZ9xW9G4/vKS+eLL7kKte1UIEMH6ua1s0EMpDHIQlkt4FlN+7ruryr4qqp6AzH/NVUveeaU8sj38yAJXS/niUVKluG2eQ0PVp1nTQmnSUnhNupUQX/U5PAD4kAio/tuISJHsfziVWyBRCqeHHYFZM0kiCIrsHKGRdBikYwgxLmVwi/KTStGZsd/IJcx1GugIorM9TaiSOXeDbBO9EirpEvE1h+QR7Gy34mjN4u4vSQCoFpjP/coMa59zyePL8cN9NBSJwEhsWxRy5/9kwgNZoxwUEZY6qYYsFexkzGTy2p+pnFuoiuaQDGzIomX1pDay1ObpW/oqUsES9H7PTPRTM2smUWmxSMsyzznXf5bH9fB/VQRJuLluadkrYyVa0Q5MYGpZGxHDgxy5MG5Uw1aGwUAl5wY4XCKY1OKPipy/dd4EcX1SBxGVcmlPrYRqL/9NYejPIzatmehugoq328GFDtqL/gS7VMRRGtTvyCfwd2r/MFPZO+WK79eeSvty8FqFlFvDDa/ygOZzevg+BpcV/tmYRwnL/jP6i0NoE4FJrwoxz/54SUvQzz8BNldlvuPhKU1ZjW43PQi7QRZHJBjSagk0SdgplvqNZlfyOwVG1ah6G8yq9YjPjjhq8iCdoPUy1zToOzF8JlEUWgKhCO9ACAgrZ69by1WctSTnqo0RNYIIBJlMUYvHWL9f2XoJn2I+AxvyrT7LMBSx7h/IYlv66kNRd3cky1DkJaqpxB3U1Z1VrdWbgI="
,expires_in
: 
3600
,ext_expires_in
: 
3600
,refresh_token
: 
"M.C543_SN1.0.U.-Cr2P!IwgScro7a6iRzgRJVcppTvUDpbl*hxRbq8VP!Cy*15mlLT*77fsIOAaKbIg!dTsWRSAAdQAOQs5d301JuF7W1CB6oO3O48m72IGOA5NcDTX1gTDCvuAsRbo0vz0T*jxGtqI62Edyb3*BVebJyJvT4wwNRMvC!0TkGe9MhYo5laMlUYti5ZWmjC6CUhS3Dg4bP6cBsegNI6em!gUPLNxX*yySHkEfBrdVDgBd8461gzlQVagjgHAIrHPtWK5U!Wj8QPBthDeRudEEJYAxQjmqLSDgpmvQPTI26n6a2GQWyMHGu*CVrxtJj3L7bnufttAvcs0QWZqh28VS88T2Tg$"
,scope
: 
"Files.ReadWrite"
,token_type
: 
"Bearer"
}
export default class OneDriveApi{


    clientId_;

    client_secret;

    auth_;

    loginBaseUrl_ = 'https://login.microsoftonline.com';

    graphBaseUrl_ = 'https://graph.microsoft.com'

    accountProperties_;

    listeners_ = {
        authRefreshed:[]
    };

    constructor(clientId,clientSecret){
        this.clientId_ = clientId;
        this.client_secret = clientSecret;
        this.auth_ = {};//authInfo;
    }

    loginBaseUrl() {
     return this.loginBaseUrl_;   
    }

    graphBaseUrl() {
     return this.graphBaseUrl_   
    }

    clientId() {
     return this.clientId_;   
    }
    clientSecret(){
        return this.client_secret;
    }

    dispatch(eventName, param) {
		const ls = this.listeners_[eventName];
		for (let i = 0; i < ls.length; i++) {
			ls[i](param);
		}
	}

	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	on(eventName, callback) {
		this.listeners_[eventName].push(callback);
	}

    isPublic() {
     return false;   
    }
    tokenBaseUrl() {
		return `${''}/common/oauth2/v2.0/token`;
	}

	nativeClientRedirectUrl() {
		return `${this.loginBaseUrl()}/common/oauth2/nativeclient`;
	}
    authCodeUrl(redirectUri) {
		const query = {
			client_id: this.clientId_,
			scope: 'files.readwrite offline_access sites.readwrite.all',
			response_type: 'code',
			redirect_uri: redirectUri,
			prompt: 'login',
		};
		return `${this.loginBaseUrl()}/common/oauth2/v2.0/authorize?${stringify(query)}`;
	}
	async execTokenRequest(code, redirectUri) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const body = {};
		body['client_id'] = this.clientId();
		if (!this.isPublic()) body['client_secret'] = this.clientSecret();
		body['code'] = code;
		body['redirect_uri'] = redirectUri;
		body['grant_type'] = 'authorization_code';

		const r = await shim.fetch(this.tokenBaseUrl(), {
			method: 'POST',
			body: urlUtils.objectToQueryString(body),
			headers: {
				['Content-Type']: 'application/x-www-form-urlencoded',
			},
		});

		if (!r.ok) {
			const text = await r.text();
			throw new Error(`Could not retrieve auth code: ${r.status}: ${r.statusText}: ${text}`);
		}

		try {
            console.log('execTokenRequest',r)
			const json = await r.json();
            
			this.setAuth(json);
		} catch (error) {
            console.error(error);
			this.setAuth(null);
			const text = await r.text();
			error.message += `: ${text}`;
			throw error;
		}
	}
    async appDirectory() {
		const driveId = '8c34790bf5a694e7';//this.accountProperties_.driveId;
		const r = await this.execJson('GET', `/me/drives/${driveId}/special/approot`);
		return `${r.parentReference.path}/${r.name}`;
	}
    
    setAuth(auth){
        this.auth_ = auth;
        this.dispatch('authRefreshed',auth);
    }
    token() {
        let auth = this.auth_;
        if(auth){
            auth = auth;
        }else{
            // auth = this.auth_;
        }
		return auth ? auth.access_token : null;
	}
	authorizationTokenRemoved(data, depth = 0) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const newData = {};

		if (!data || typeof data !== 'object') {
			return data;
		}

		if (depth > 5) {
			return '[[depth-exceeded]]';
		}

		for (const key in data) {
			if (key === 'Authorization') {
				newData[key] = '[[DELETED]]';
			} else {
				newData[key] = this.authorizationTokenRemoved(data[key], depth + 1);
			}
		}

		return newData;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	oneDriveErrorResponseToError(errorResponse) {
		if (!errorResponse) return new Error('Undefined error');

		if (errorResponse.error) {
			const e = errorResponse.error;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			const output = new Error(e.message);
			if (e.code) output.code = e.code;
			if (e.innerError) output.innerError = e.innerError;
			return output;
		} else {
			return new Error(JSON.stringify(errorResponse));
		}
	}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async exec(method, path, query = null, data = null, options = null) {
		if (!path) throw new Error('Path is required');

		method = method.toUpperCase();

		if (!options) options = {};
		if (!options.headers) options.headers = {};
		if (!options.target) options.target = 'string';

		if (method !== 'GET') {
			options.method = method;
		}

		if (method === 'PATCH' || method === 'POST') {
			options.headers['Content-Type'] = 'application/json';
			if (data) data = JSON.stringify(data);
		}

		let url = path;

		// In general, `path` contains a path relative to the base URL, but in some
		// cases the full URL is provided (for example, when it's a URL that was
		// retrieved from the API).
		if (url.indexOf('https://') !== 0) {
			const slash = path.indexOf('/') === 0 ? '' : '/';
			url = `/v1.0${slash}${path}`;
		}

		if (query) {
			url += url.indexOf('?') < 0 ? '?' : '&';
			url += stringify(query);
		}

		if (data) options.body = data;

		options.timeout = 1000 * 60 * 5; // in ms

		for (let i = 0; i < 5; i++) {
			options.headers['Authorization'] = `bearer ${this.token()}`;
			options.headers['User-Agent'] = `ISV|Joplin|Joplin/${shim.appVersion()}`;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			const handleRequestRepeat = async (error, sleepSeconds = null) => {
				sleepSeconds ??= (i + 1) * 5;
				logger.info(`Got error below - retrying (${i})...`);
				logger.info(error);
				// await time.sleep(sleepSeconds);
			};

			let response = null;
			try {
				if (path.includes('/createUploadSession')) {
					response = await this.uploadBigFile(url, options);
				} else if (options.source === 'file' && (method === 'POST' || method === 'PUT')) {
					response = await shim.uploadBlob(url, options);
				} else if (options.target === 'string') {
					response = await shim.fetch(url, options);
				} else {
					// file
					response = await shim.fetchBlob(url, options);
				}
			} catch (error) {
				if (shim.fetchRequestCanBeRetried(error)) {
					await handleRequestRepeat(error);
					continue;
				} else {
					logger.error('Got unhandled error:', error ? error.code : '', error ? error.message : '', error);
					throw error;
				}
			}

			if (!response.ok) {
				const errorResponseText = await response.text();
				let errorResponse = null;

				try {
					errorResponse = JSON.parse(errorResponseText); // await response.json();
				} catch (error) {
					error.message = `OneDriveApi::exec: Cannot parse JSON error: ${errorResponseText} ${error.message}`;
					await handleRequestRepeat(error);
					continue;
				}

				const error = this.oneDriveErrorResponseToError(errorResponse);

				if (error.code === 'InvalidAuthenticationToken' || error.code === 'unauthenticated') {
					logger.info('Token expired: refreshing...');
					await this.refreshAccessToken();
					continue;
				} else if (error && ((error.error && error.error.code === 'generalException') || error.code === 'generalException' || error.code === 'EAGAIN')) {
					// Rare error (one Google hit) - I guess the request can be repeated
					// { error:
					//    { code: 'generalException',
					//      message: 'An error occurred in the data store.',
					//      innerError:
					//       { 'request-id': 'b4310552-c18a-45b1-bde1-68e2c2345eef',
					//         date: '2017-06-29T00:15:50' } } }

					// { FetchError: request to https://graph.microsoft.com/v1.0/drive/root:/Apps/Joplin/.sync/7ee5dc04afcb414aa7c684bfc1edba8b.md_1499352102856 failed, reason: connect EAGAIN 65.52.64.250:443 - Local (0.0.0.0:54374)
					//   name: 'FetchError',
					//   message: 'request to https://graph.microsoft.com/v1.0/drive/root:/Apps/Joplin/.sync/7ee5dc04afcb414aa7c684bfc1edba8b.md_1499352102856 failed, reason: connect EAGAIN 65.52.64.250:443 - Local (0.0.0.0:54374)',
					//   type: 'system',
					//   errno: 'EAGAIN',
					//   code: 'EAGAIN' }
					await handleRequestRepeat(error);
					continue;
				} else if (error && (error.code === 'resourceModified' || (error.error && error.error.code === 'resourceModified'))) {
					// NOTE: not tested, very hard to reproduce and non-informative error message, but can be repeated

					// Error: ETag does not match current item's value
					// Code: resourceModified
					// Header: {"_headers":{"cache-control":["private"],"transfer-encoding":["chunked"],"content-type":["application/json"],"request-id":["d...ea47"],"client-request-id":["d99...ea47"],"x-ms-ags-diagnostic":["{\"ServerInfo\":{\"DataCenter\":\"North Europe\",\"Slice\":\"SliceA\",\"Ring\":\"2\",\"ScaleUnit\":\"000\",\"Host\":\"AGSFE_IN_13\",\"ADSiteName\":\"DUB\"}}"],"duration":["96.9464"],"date":[],"connection":["close"]}}
					// Request: PATCH https://graph.microsoft.com/v1.0/drive/root:/Apps/JoplinDev/f56c5601fee94b8085524513bf3e352f.md null "{\"fileSystemInfo\":{\"lastModifiedDateTime\":\"....\"}}" {"headers":{"Content-Type":"application/json","Authorization":"bearer ...

					await handleRequestRepeat(error);
					continue;
				} else if (error?.code === 'activityLimitReached') {
					// Wait for OneDrive throttling
					// Relavent Microsoft Docs: https://docs.microsoft.com/en-us/sharepoint/dev/general-development/how-to-avoid-getting-throttled-or-blocked-in-sharepoint-online#best-practices-to-handle-throttling
					// Decrement retry count as multiple sync threads will cause repeated throttling errors - this will wait until throttling is resolved to continue, preventing a hard stop on the sync
					i--;

					const retryAfter = response.headers?.get?.('retry-after') ?? '1';
					let sleepSeconds = parseFloat(retryAfter);

					if (isNaN(sleepSeconds)) {
						sleepSeconds = 5;
					}

					logger.info(`OneDrive Throttle, sync thread sleeping for ${sleepSeconds} seconds...`);
					await handleRequestRepeat(error, sleepSeconds);
					continue;
				} else if (error.code === 'itemNotFound' && method === 'DELETE') {
					// Deleting a non-existing item is ok - noop
					return;
				} else {
					error.request = [
						method,
						url,
						JSON.stringify(query),
						JSON.stringify(this.authorizationTokenRemoved(data)),
						JSON.stringify(this.authorizationTokenRemoved(options)),
					].join(' ');
					error.headers = await response.headers;
					throw error;
				}
			}

			return response;
		}

		throw new Error(`Could not execute request after multiple attempts: ${method} ${url}`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	setAccountProperties(accountProperties) {
		this.accountProperties_ = accountProperties;
	}

	async execAccountPropertiesRequest(resolve,reject) {

		try {
			const response = await this.exec('GET', '/me/drive');
			const data = await response.json();
			const accountProperties = { accountType: data.driveType, driveId: data.id };
            this.setAccountProperties(accountProperties);
            resolve && resolve(data);
			return accountProperties;
		} catch (error) {
            reject && reject(error);
            // this.refreshAccessToken();
			throw new Error(`Could not retrieve account details (drive ID, Account type. Error code: ${error.code}, Error message: ${error.message}`);
            
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async execJson(method, path, query = null, data = null) {
		const response = await this.exec(method, `${path}`, query, data);
		const errorResponseText = await response.text();
		try {
			const output = JSON.parse(errorResponseText); // await response.json();
			return output;
		} catch (error) {
			error.message = `OneDriveApi::execJson: Cannot parse JSON: ${errorResponseText} ${error.message}`;
			throw error;
			// throw new Error('Cannot parse JSON: ' + text);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async execText(method, path, query = null, data = null) {
		const response = await this.exec(method, path, query, data);
		const output = await response.text();
		return output;
	}

    async refreshAccessToken() {
		if (!this.auth_ || !this.auth_.refresh_token) {
			this.setAuth(null);
			throw new Error('Cannot refresh token: authentication data is missing. Starting the synchronisation again may fix the problem.');
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const body = {};
		body['client_id'] = this.clientId();
		if (!this.isPublic()) body['client_secret'] = this.clientSecret();
		body['refresh_token'] = this.auth_.refresh_token;
		body['redirect_uri'] = 'http://localhost:1917';
		body['grant_type'] = 'refresh_token';

		const response = await shim.fetch(this.tokenBaseUrl(), {
			method: 'POST',
			body: urlUtils.objectToQueryString(body),
			headers: {
				['Content-Type']: 'application/x-www-form-urlencoded',
			},
		});

		if (!response.ok) {
			this.setAuth(null);
			const msg = await response.text();
			throw new Error(`${msg}: TOKEN: ${this.auth_}`);
		}

		const auth = await response.json();
		this.setAuth(auth);
	}
}