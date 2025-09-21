import type { ConsolePlatform, Message, MessageFormat } from "@types";

class ConsoleStoreManager {
  private readonly _MAX_MESSAGES: number = 200;
  private _view: boolean = $state(false);
  private _messages: Message[] = $state([])
  private _messageBuffer: Message[] = $state([])

  constructor() {
    setInterval(this.flushMessages.bind(this), 1000);
				if (mp.events) {
          mp.events.add("setViewCustomConsole", this.updateToggleView.bind(this));
          mp.events.add("addCustomConsoleLog", this.addMessage.bind(this));
				}
  }

  get view(){
    return this._view
  }

  get messages(){
    return this._messages
  }

  private trimMessages() {
    if (this._messages.length > this._MAX_MESSAGES) {
      this._messages.splice(0, this._messages.length - this._MAX_MESSAGES);
    }
  }

  flushMessages(){
    this._messages.push(...this._messageBuffer);
    if (this._messages.length > this._MAX_MESSAGES) {
      this._messages.splice(0, this._messages.length - this._MAX_MESSAGES);
    }
    this._messageBuffer = [];
  }

  async copyToClipboard(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  clearMessages(){
    this._messages = [];
  }

  private updateToggleView(status: boolean){
    this._view = status;
  }

  async addMessage(type: ConsolePlatform, content: string, format: MessageFormat){
    const lastMessage = this._messageBuffer[this._messageBuffer.length - 1];
    if(lastMessage && lastMessage.content === content){
      lastMessage.count += 1
    }else{
      this._messageBuffer.push({type, content, format, count: 1, timestamp: Date.now()});
    }
    this.trimMessages()
  }
}

export const consoleStore = new ConsoleStoreManager();
