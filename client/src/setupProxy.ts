import { AccessToken, DefaultAzureCredential } from "@azure/identity";
import { createProxyMiddleware } from "http-proxy-middleware";

export default function (app: any) {
	const credential = new DefaultAzureCredential();
	let token: AccessToken | null = null;

	const pathRewrite = async function (path: string, req: any) {
		if (!token || token.expiresOnTimestamp < Date.now()) {
			token = await credential.getToken("https://digitaltwins.azure.net/.default");
		}
		req.headers.append("Authorization", token ? `Bearer ${token.token}` : "");

		return path.replace("/api/proxy", "");
	};

	app.use(
		"/api/proxy",
		createProxyMiddleware({
			changeOrigin: true,
			target: "/",
			headers: {
				connection: "keep-alive"
			},
			onProxyReq: proxyReq => {
				if (proxyReq.getHeader("origin")) {
					proxyReq.removeHeader("origin");
					proxyReq.removeHeader("referer");
				}
			},
			pathRewrite,
			router: (req: any) => `https://${req.headers["x-adt-host"]}/`
		})
	);
}
