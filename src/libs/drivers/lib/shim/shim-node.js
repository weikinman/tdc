import request from '../../../../utils/request'
const shim = {
    setInterval(_fn,_interval){
        return setInterval(_fn,_interval)
    },
    setTimeout(_fn,_interval) {
        return setTimeout(_fn,_interval)
    },
    clearInterval(_id){
        clearTimeout(_id);
    },
    clearTimeout(_id){
        clearTimeout(_id);
    },

    fetch(_url,_configs) {
        try{
            return fetch(_url,_configs)
        }catch(e){
            console.error('fetch error',e.stack);
        }
    },

    appVersion() {
     return '1.0.0'   
    },

    fetchRequestCanBeRetried: (error) => {
		if (!error) return false;

		// Unfortunately the error 'Network request failed' doesn't have a type
		// or error code, so hopefully that message won't change and is not localized
		if (error.message === 'Network request failed') return true;

		// request to https://public-ch3302....1fab24cb1bd5f.md failed, reason: socket hang up"
		if (error.code === 'ECONNRESET') return true;

		// OneDrive (or Node?) sometimes sends back a "not found" error for resources
		// that definitely exist and in this case repeating the request works.
		// Error is:
		// request to https://graph.microsoft.com/v1.0/drive/special/approot failed, reason: getaddrinfo ENOTFOUND graph.microsoft.com graph.microsoft.com:443
		//
		// 2024-04-07: Strictly speaking we shouldn't repeat the request if the resource doesn't
		// exist. Hopefully OneDrive has now fixed this issue and the hack is no longer necessary.
		//
		// (error.code === 'ENOTFOUND') return true;

		// network timeout at: https://public-ch3302...859f9b0e3ab.md
		if (error.message && error.message.indexOf('network timeout') === 0) return true;

		// name: 'FetchError',
		// message: 'request to https://api.ipify.org/?format=json failed, reason: getaddrinfo EAI_AGAIN api.ipify.org:443',
		// type: 'system',
		// errno: 'EAI_AGAIN',
		// code: 'EAI_AGAIN' } } reason: { FetchError: request to https://api.ipify.org/?format=json failed, reason: getaddrinfo EAI_AGAIN api.ipify.org:443
		//
		// It's a Microsoft error: "A temporary failure in name resolution occurred."
		if (error.code === 'EAI_AGAIN') return true;

		// request to https://public-...8fd8bc6bb68e9c4d17a.md failed, reason: connect ETIMEDOUT 204.79.197.213:443
		// Code: ETIMEDOUT
		if (error.code === 'ETIMEDOUT') return true;

		// ECONNREFUSED is generally temporary
		if (error.code === 'ECONNREFUSED') return true;

		return false;
	},
    platformName: () => {
		return shim.mobilePlatform();
		if (shim.isMac()) return 'darwin';
		if (shim.isWindows()) return 'win32';
		if (shim.isLinux()) return 'linux';
		if (shim.isFreeBSD()) return 'freebsd';
		if (process && process.platform) return process.platform;
		throw new Error('Cannot determine platform');
	},
    isReactNative() {
        return false;
    },
    mobilePlatform: () => {
		return ''; // Default if we're not on mobile (React Native)
	},
    isElectron: () => {
		// Renderer process
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		if (typeof window !== 'undefined' && typeof window.process === 'object' && (window.process).type === 'renderer') {
			return true;
		}

		// Main process
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!(process.versions).electron) {
			return true;
		}

		// Detect the user agent when the `nodeIntegration` option is set to true
		if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
			return true;
		}

		return false;
	},

	isPortable: () => {
		return typeof process !== 'undefined' && typeof process.env === 'object' && !!process.env.PORTABLE_EXECUTABLE_DIR;
	},
}
shim.fetchBlob = async function(url, options) {
    if (!options || !options.path) throw new Error('fetchBlob: target file path is missing');
    if (!options.method) options.method = 'GET';
    // if (!('maxRetry' in options)) options.maxRetry = 5;

    // 21 maxRedirects is the default amount from follow-redirects library
    // 20 seems to be the max amount that most popular browsers will allow
    if (!options.maxRedirects) options.maxRedirects = 21;
    if (!options.timeout) options.timeout = undefined;

    const urlParse = require('url').parse;

    url = urlParse(url.trim());
    const method = options.method ? options.method : 'GET';
    const http = url.protocol.toLowerCase() === 'http:' ? require('follow-redirects').http : require('follow-redirects').https;
    const headers = options.headers ? options.headers : {};
    const filePath = options.path;
    const downloadController = options.downloadController;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
    function makeResponse(response) {
        return {
            ok: response.statusCode < 400,
            path: filePath,
            text: () => {
                return response.statusMessage;
            },
            json: () => {
                return { message: `${response.statusCode}: ${response.statusMessage}` };
            },
            status: response.statusCode,
            headers: response.headers,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
    const requestOptions = {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port,
        method: method,
        path: url.pathname + (url.query ? `?${url.query}` : ''),
        headers: headers,
        timeout: options.timeout,
        maxRedirects: options.maxRedirects,
    };

    const resolvedProxyUrl = resolveProxyUrl(proxySettings.proxyUrl);
    requestOptions.agent = (resolvedProxyUrl && proxySettings.proxyEnabled) ? shim.proxyAgent(url.href, resolvedProxyUrl) : null;

    const doFetchOperation = async () => {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
            let file = null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
            const cleanUpOnError = (error) => {
                // We ignore any unlink error as we only want to report on the main error
                void fs.unlink(filePath)
                // eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
                    .catch(() => {})
                // eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
                    .then(() => {
                        if (file) {
                            file.close(() => {
                                file = null;
                                reject(error);
                            });
                        } else {
                            reject(error);
                        }
                    });
            };

            try {
                // Note: relative paths aren't supported
                file = fs.createWriteStream(filePath);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
                file.on('error', (error) => {
                    cleanUpOnError(error);
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
                const request = http.request(requestOptions, (response) => {

                    if (downloadController) {
                        response.on('data', downloadController.handleChunk(request));
                    }

                    response.pipe(file);

                    const isGzipped = response.headers['content-encoding'] === 'gzip';

                    file.on('finish', () => {
                        file.close(async () => {
                            if (isGzipped) {
                                const gzipFilePath = `${filePath}.gzip`;
                                await shim.fsDriver().move(filePath, gzipFilePath);

                                try {
                                    await gunzipFile(gzipFilePath, filePath);
                                    // Calling request.destroy() within the downloadController can cause problems.
                                    // The response.pipe(file) will continue even after request.destroy() is called,
                                    // potentially causing the same promise to resolve while the cleanUpOnError
                                    // is removing the file that have been downloaded by this function.
                                    if (request.destroyed) return;
                                    resolve(makeResponse(response));
                                } catch (error) {
                                    cleanUpOnError(error);
                                }

                                await shim.fsDriver().remove(gzipFilePath);
                            } else {
                                if (request.destroyed) return;
                                resolve(makeResponse(response));
                            }
                        });
                    });
                });

                request.on('timeout', () => {
                    request.destroy(new Error(`Request timed out. Timeout value: ${requestOptions.timeout}ms.`));
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
                request.on('error', (error) => {
                    cleanUpOnError(error);
                });

                request.end();
            } catch (error) {
                cleanUpOnError(error);
            }
        });
    };

    return shim.fetchWithRetry(doFetchOperation, options);
};

shim.uploadBlob = async function(url, options) {
    if (!options || !options.path) throw new Error('uploadBlob: source file path is missing');
    const content = await fs.readFile(options.path);
    options = { ...options, body: content };
    return shim.fetch(url, options);
};

shim.stringByteLength = function(string) {
    return Buffer.byteLength(string, 'utf-8');
};

// shim.Buffer = Buffer;

shim.openUrl = url => {
    // Returns true if it opens the file successfully; returns false if it could
    // not find the file.
    return shim.electronBridge().openExternal(url);
};
export default shim 