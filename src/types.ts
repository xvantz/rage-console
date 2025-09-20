export enum MessageFormat {
	error,
	boolean,
	number,
	string,
	json,
	function,
	undefined,
	null,
	date,
	html,
	map,
	set,
	regExp
}

export interface Message {
	type: ConsolePlatform
	content: string
	format: MessageFormat;
	count: number
	timestamp: number
}

export enum ConsolePlatform {
	UI = 'UI',
	Client = 'Client',
	Server = 'Server',
	Local = 'Local'
}

export enum ConsoleLogType {
	log,
	error,
	warn,
	info
}