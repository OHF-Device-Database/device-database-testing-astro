import { IntlMessageFormat } from "intl-messageformat";

import en from "../translations/en.json";

const BASE_LOCALE = "en";

/**
 * Dot-notation paths into the English source file ("home.title"), derived from
 * its shape so that a typo or a removed key fails the build. English is the
 * source of truth; other locales are managed in Lokalise and overlaid once an
 * i18n routing solution lands.
 */
type MessageKeys<T, Prefix extends string = ""> = {
	[K in keyof T & string]: T[K] extends string
		? `${Prefix}${K}`
		: MessageKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
export type TranslationKey = MessageKeys<typeof en>;

const lookup = (key: string): string | undefined => {
	let node: unknown = en;
	for (const part of key.split(".")) {
		if (typeof node !== "object" || node === null) {
			return undefined;
		}
		node = (node as Record<string, unknown>)[part];
	}

	return typeof node === "string" ? node : undefined;
};

// messages are ICU MessageFormat; parsed formats are memoized per key
const formats = new Map<string, IntlMessageFormat>();

export const localize = (
	key: TranslationKey,
	values?: Record<string, string | number>,
): string => {
	const message = lookup(key);
	if (typeof message === "undefined") {
		return key;
	}

	let format = formats.get(key);
	if (typeof format === "undefined") {
		format = new IntlMessageFormat(message, BASE_LOCALE);
		formats.set(key, format);
	}

	return String(format.format(values));
};
