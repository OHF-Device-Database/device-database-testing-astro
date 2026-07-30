// @ts-check
import netlify from "@astrojs/netlify";
import node from "@astrojs/node";
import { defineConfig, envField, memoryCache } from "astro/config";

// Switch the deploy target with DEPLOY_TARGET. Defaults to "netlify" so the
// existing Netlify build is unaffected; the Docker image sets "node".
const isNodeTarget = process.env.DEPLOY_TARGET === "node";
const adapter = isNodeTarget ? node({ mode: "standalone" }) : netlify();

// https://astro.build/config
export default defineConfig({
	build: {
		// External stylesheets persist correctly across ClientRouter navigations.
		inlineStylesheets: "never",
	},
	env: {
		schema: {
			// access: "secret" keeps the value out of the build output; it is read
			// from process.env when the server starts, so one image works per environment.
			API_AUTHORITY: envField.string({
				context: "server",
				access: "secret",
				default: "http://localhost:3000",
			}),
			// Preview edition is no-indexed by default. Set NOINDEX=false in the runtime
			// environment for a real production deploy. Like API_AUTHORITY it is not baked
			// into the image: every page that consumes it is server-rendered.
			NOINDEX: envField.boolean({
				context: "server",
				access: "secret",
				optional: true,
				default: true,
			}),
		},
	},
	adapter,
	vite: {
		// The Docker image ships dist/ without node_modules, so the node build
		// must bundle every dependency into the server output.
		ssr: isNodeTarget ? { noExternal: true } : {},
	},
	experimental: {
		cache: {
			provider: memoryCache(),
		},
	},
});
