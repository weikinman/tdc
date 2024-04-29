import RemoteMessenger from './RemoteMessenger';
import { SerializableData } from './types';

export default class WindowMessenger<LocalInterface, RemoteInterface> extends RemoteMessenger<LocalInterface, RemoteInterface> {
	public constructor(channelId: string, private remoteWindow: Window, localApi: LocalInterface|null) {
		super(channelId, localApi);

		window.addEventListener('message', this.handleMessageEvent);

		this.onReadyToReceive();
	}

	private handleMessageEvent = (event: MessageEvent) => {
		if (event.source !== this.remoteWindow) {
			return;
		}

		void this.onMessage(event.data);
	};

	protected override postMessage(message: SerializableData): void {
		this.remoteWindow.postMessage(message, '*');
	}

	protected override onClose(): void {
		window.removeEventListener('message', this.handleMessageEvent);
	}
}
