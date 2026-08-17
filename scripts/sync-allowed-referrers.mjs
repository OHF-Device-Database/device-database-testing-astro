// Downloads the Open Home Foundation referrer allow list to src/data/ so that
// PlausibleAnalytics.astro can inline it at build time. Wired as predev/prebuild
// in package.json: it runs once per dev server start and once per build, never
// per page render.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://www.openhomefoundation.org/allowed-referrers.json";
const OUTPUT = fileURLToPath(
	new URL("../src/data/allowed-referrers.json", import.meta.url),
);

async function fetchReferrers() {
	const response = await fetch(SOURCE_URL, {
		headers: { "User-Agent": "device-database-preview-build" },
	});
	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	const payload = await response.json();
	if (
		!Array.isArray(payload) ||
		!payload.every((entry) => typeof entry === "string")
	) {
		throw new Error("payload is not an array of strings");
	}

	return payload
		.map((entry) => entry.trim().toLowerCase().replace(/\.$/, ""))
		.filter((entry) => entry.length > 0);
}

async function localCopyExists() {
	try {
		await readFile(OUTPUT);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	await mkdir(dirname(OUTPUT), { recursive: true });

	let referrers;
	try {
		referrers = await fetchReferrers();
	} catch (error) {
		// A network hiccup must never break the build. Prefer the copy already on
		// disk; with no copy at all, write an empty list so the filter rejects
		// every referrer rather than letting a private instance URL through.
		if (await localCopyExists()) {
			console.warn(
				`[allowed-referrers] fetch failed, keeping the existing file. ${error}`,
			);
			return;
		}

		console.warn(
			`[allowed-referrers] fetch failed and no local copy exists, writing an empty list. ${error}`,
		);
		referrers = [];
	}

	await writeFile(OUTPUT, `${JSON.stringify(referrers, null, 2)}\n`);
	console.log(`[allowed-referrers] wrote ${referrers.length} domains`);
}

try {
	await main();
} catch (error) {
	console.warn(`[allowed-referrers] sync failed. ${error}`);
}
