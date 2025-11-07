import { ConsoleLogType, ConsolePlatform, MessageFormat } from "./types";

export class CustomConsole {
	private static _sharedConsoleBrowser: BrowserMp | null = null;
	private static _sharedView: boolean = false;
	private static _sharedStopLog: boolean = false;
	private static _sharedKeyView: number = 46;
	private static _sharedLogBuffer: Array<{
		message: string;
		platform: ConsolePlatform;
		format: MessageFormat;
	}> = [];
	private static _instanceCount: number = 0;
	private _nativeConsole: { log: Function, warn: Function, info: Function, error: Function} | null = null;

	private readonly _platform: ConsolePlatform;
	private readonly _prefix: string;
	private _isDestroyed: boolean = false;

	constructor(prefix: string = '', keyView?: number) {
		this._platform = this.detectPlatform();
		if (this._platform === ConsolePlatform.Local){
			const nativeConsole = console;
			this._nativeConsole = {
				log: console.log.bind(nativeConsole),
				warn: console.warn.bind(nativeConsole),
				info: console.info.bind(nativeConsole),
				error: console.error.bind(nativeConsole),
			};
		}
		this._prefix = prefix;
		CustomConsole._instanceCount++;

		if (this._platform === ConsolePlatform.Client) {
			if (keyView !== undefined) CustomConsole._sharedKeyView = keyView;
			if (!CustomConsole._sharedConsoleBrowser) this.initializeSharedBrowser();
		}
	}

	private static setViewConsole(): void {
		if (!CustomConsole._sharedConsoleBrowser) return;

		try {
			CustomConsole._sharedView = !CustomConsole._sharedView;
			CustomConsole._sharedStopLog = true;
			CustomConsole._sharedConsoleBrowser.call("setViewCustomConsole", CustomConsole._sharedView);
			CustomConsole._sharedStopLog = false;

			CustomConsole.flushSharedLogBuffer();
		} catch (error) {
			mp.console.logError('Error toggling console view');
			CustomConsole._sharedStopLog = false;
		}
	}

	private static flushSharedLogBuffer(): void {
		if (!CustomConsole._sharedConsoleBrowser || CustomConsole._sharedLogBuffer.length === 0) return;

		const logsToFlush = [...CustomConsole._sharedLogBuffer];
		CustomConsole._sharedLogBuffer = [];

		logsToFlush.forEach(log => {
			try {
				CustomConsole._sharedConsoleBrowser!.call("addCustomConsoleLog", log.platform, log.message, log.format);
			} catch (error) {
				mp.console.logError('Error flushing log buffer');
				CustomConsole._sharedLogBuffer.push(log);
			}
		});
	}

	private initializeSharedBrowser(): void {
		try {
			mp.keys.bind(CustomConsole._sharedKeyView, false, CustomConsole.setViewConsole);
			CustomConsole._sharedConsoleBrowser = mp.browsers.new('package://interface/customConsole/index.html');
			mp.events.add("addCustomConsoleLogToClient", CustomConsole.pushSharedConsoleLog);

			CustomConsole.flushSharedLogBuffer();
		} catch (error) {
			mp.console.logError('Failed to initialize shared CustomConsole browser');
		}
	}

	private static pushSharedConsoleLog(message: string, platform: ConsolePlatform, formatType: MessageFormat): void {
		if (CustomConsole._sharedConsoleBrowser && !CustomConsole._sharedStopLog) {
			try {
				CustomConsole._sharedConsoleBrowser.call("addCustomConsoleLog", platform, message, formatType);
			} catch (error) {
				mp.console.logError('Failed to call browser method');
				CustomConsole._sharedLogBuffer.push({message, platform, format: formatType});
			}
		} else {
			CustomConsole._sharedLogBuffer.push({message, platform, format: formatType});
		}
	}

	log(...messages: any[]): void {
		if (this._isDestroyed) return;
		messages.forEach(message => this.platformCallConsole(ConsoleLogType.log, message));
	}

	warn(...messages: any[]): void {
		if (this._isDestroyed) return;
		messages.forEach(message => this.platformCallConsole(ConsoleLogType.warn, message));
	}

	error(...messages: any[]): void {
		if (this._isDestroyed) return;
		messages.forEach(message => this.platformCallConsole(ConsoleLogType.error, message));
	}

	info(...messages: any[]): void {
		if (this._isDestroyed) return;
		messages.forEach(message => this.platformCallConsole(ConsoleLogType.info, message));
	}

	private platformCallConsole(type: ConsoleLogType, message: any): void {
		const formatType = this.getMessageType(message);
		const mesString = this.messageToString(message, formatType);
    const typeLabel = this.getTypeLabel(type);
		const prefixedMessage = `${typeLabel}${this._prefix === "" ? "" : `[${this._prefix}]`} ${mesString}`;

		try {
			switch (this._platform) {
				case ConsolePlatform.UI: {
					mp.events.call("addCustomConsoleLogToClient", prefixedMessage, this._platform, formatType);
					break;
				}
				case ConsolePlatform.Client: {
					CustomConsole.pushSharedConsoleLog(prefixedMessage, this._platform, formatType);
					break;
				}
				case ConsolePlatform.Server: {
					mp.players.call("addCustomConsoleLogToClient", [prefixedMessage, this._platform, formatType]);
					break;
				}
				case ConsolePlatform.Local: {
					switch (type) {
						case ConsoleLogType.warn:
							this._nativeConsole?.warn(prefixedMessage);
							break;
						case ConsoleLogType.error:
							this._nativeConsole?.error(prefixedMessage);
							break;
						case ConsoleLogType.info:
							this._nativeConsole?.info(prefixedMessage);
							break;
						default:
							this._nativeConsole?.log(prefixedMessage);
					}
					break;
				}
			}
		} catch (error) {
			this._nativeConsole?.error('CustomConsole platformCallConsole error:', error);
			this._nativeConsole?.log(`[${this._prefix}]`, message);
		}
	}

  private getTypeLabel(type: ConsoleLogType): string {
    switch (type) {
      case ConsoleLogType.error: return "[ERROR] ";
      case ConsoleLogType.warn:  return "[WARN] ";
      case ConsoleLogType.info:  return "[INFO] ";
      case ConsoleLogType.log:
      default:                   return "[LOG] ";
    }
  }

	private getMessageType(message: any): MessageFormat {
		if (typeof message === 'undefined') return MessageFormat.undefined;
		if (message === null) return MessageFormat.null;
		if (typeof message === 'string') return MessageFormat.string;
		if (typeof message === 'boolean') return MessageFormat.boolean;
		if (typeof message === 'number') return MessageFormat.number;
		if (typeof message === 'function') return MessageFormat.function;
		if (typeof message === 'symbol') return MessageFormat.string;
		if (typeof message === 'bigint') return MessageFormat.number;

		if (typeof message === 'object') {
			if (message instanceof Error) return MessageFormat.error;
			if (Array.isArray(message)) return MessageFormat.json;
			if (message instanceof Date) return MessageFormat.date;
			if (typeof HTMLElement !== 'undefined' && message instanceof HTMLElement) return MessageFormat.html;
			if (message instanceof Map) return MessageFormat.map;
			if (message instanceof Set) return MessageFormat.set;
			if (message instanceof RegExp) return MessageFormat.regExp;
			return MessageFormat.json;
		}

		return MessageFormat.string;
	}

	private messageToString(message: any, format: MessageFormat): string {
		try {
			switch (format) {
				case MessageFormat.undefined:
					return "undefined";
				case MessageFormat.null:
					return "null";
				case MessageFormat.string:
					return String(message);
				case MessageFormat.boolean:
					return Boolean(message).toString();
				case MessageFormat.number:
					return Number(message).toString();
				case MessageFormat.function:
					return (message as Function).toString();
				case MessageFormat.error:
					return message instanceof Error ? (message.stack || message.toString()) : String(message);
				case MessageFormat.date:
					return (message as Date).toISOString();
				case MessageFormat.html:
					return typeof message === 'string' ? message : (message as HTMLElement).outerHTML;
				case MessageFormat.map:
					return JSON.stringify(Array.from((message as Map<any, any>).entries()), null, 2);
				case MessageFormat.set:
					return JSON.stringify(Array.from((message as Set<any>).values()), null, 2);
				case MessageFormat.regExp:
					return (message as RegExp).toString();
				case MessageFormat.json:
					return JSON.stringify(message, this.jsonReplacer, 2);
				default:
					return String(message);
			}
		} catch (error) {
			return `[Error serializing: ${typeof message}]`;
		}
	}

	private jsonReplacer = (() => {
		const seen = new WeakSet();
		return (key: string, value: any) => {
			if (typeof value === 'object' && value !== null) {
				if (seen.has(value)) {
					return '[Circular]';
				}
				seen.add(value);
			}
			return value;
		};
	})();

	private detectPlatform(): ConsolePlatform {
		if (typeof (mp as any).invoke === 'function') return ConsolePlatform.UI;
		if (mp?.game && typeof mp.game.joaat === 'function') return ConsolePlatform.Client;
		if (typeof (mp as any).joaat === 'function') return ConsolePlatform.Server;
		return ConsolePlatform.Local;
	}

	static rebindKey(newKey: number): void {
		if (CustomConsole._sharedConsoleBrowser) {
			try {
				mp.keys.unbind(CustomConsole._sharedKeyView, false, CustomConsole.setViewConsole);
				mp.keys.bind(newKey, false, CustomConsole.setViewConsole);
				CustomConsole._sharedKeyView = newKey;
			} catch (error) {
				mp.console.logError('Error rebinding key');
			}
		}
	}

	getPrefix(): string {
		return this._prefix;
	}

	getPlatform(): ConsolePlatform {
		return this._platform;
	}

	isDestroyed(): boolean {
		return this._isDestroyed;
	}

	destroy(): void {
		if (this._isDestroyed) return;

		CustomConsole._instanceCount--;
		this._isDestroyed = true;

		if (CustomConsole._instanceCount <= 0 && this._platform === ConsolePlatform.Client) this.destroySharedBrowser();
	}

	private destroySharedBrowser(): void {
		if (CustomConsole._sharedConsoleBrowser) {
			try {
				mp.keys.unbind(CustomConsole._sharedKeyView, false, CustomConsole.setViewConsole);
				CustomConsole._sharedConsoleBrowser.destroy();
				mp.events.remove("addCustomConsoleLogToClient", CustomConsole.pushSharedConsoleLog);
			} catch (error) {
				mp.console.logError('Error destroying shared CustomConsole browser');
			}
		}

		CustomConsole._sharedConsoleBrowser = null;
		CustomConsole._sharedLogBuffer = [];
		CustomConsole._sharedView = false;
		CustomConsole._sharedStopLog = false;
		CustomConsole._instanceCount = 0;
	}
}