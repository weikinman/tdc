
import { reg } from './libs/lib/registry.js'
// import parseUri from './libs/lib/parseUri'
import shim from './libs/lib/shim'
function parseUri(val){
	return val;
}
class OneDriveLoginScreenComponent {
	startUrl() {
		return reg
			.syncTarget()
			.api()
			.authCodeUrl(this.redirectUrl());
	}

	redirectUrl() {
		return reg
			.syncTarget()
			.api()
			.nativeClientRedirectUrl();
	}

	async webview_load(noIdeaWhatThisIs) {
		// This is deprecated according to the doc but since the non-deprecated property (source)
		// doesn't exist, use this for now. The whole component is completely undocumented
		// at the moment so it's likely to change.
		const url = noIdeaWhatThisIs.url;
		const parsedUrl = parseUri(url);

		if (!this.authCode_ && parsedUrl && parsedUrl.queryKey && parsedUrl.queryKey.code) {
			this.authCode_ = parsedUrl.queryKey.code;

			try {
				await reg
					.syncTarget()
					.api()
					.execTokenRequest(this.authCode_, this.redirectUrl(), true);
				this.props.dispatch({ type: 'NAV_BACK' });
				reg.scheduleSync(0);
			} catch (error) {
				alert(`Could not login to OneDrive. Please try again\n\n${error.message}\n\n${url}`);
			}

			this.authCode_ = null;
		}
	}

	async webview_error() {
		alert('Could not load page. Please check your connection and try again.');
	}
	setState(opts){
		console.log('setState',opts)
	}
	retryButton_click() {
		shim.setTimeout(() => {
			this.setState({
				webviewUrl: this.startUrl(),
			});
			// this.forceUpdate();
		}, 1000);
	}

}

export { OneDriveLoginScreenComponent };
