package com.fsamplabs.streameridle;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/** Serves the bundled web game from assets/www over a secure https origin. */
final class AssetServer {
    static final String HOST = "appassets.androidplatform.net";
    static final String START_URL = "https://" + HOST + "/assets/www/index.html";

    private AssetServer() {}

    static boolean isLocal(Uri uri) {
        return uri != null && HOST.equals(uri.getHost());
    }

    static WebResourceResponse handle(Context ctx, WebResourceRequest req) {
        Uri uri = req.getUrl();
        if (!isLocal(uri)) return null;
        String path = uri.getPath();
        if (path == null || !path.startsWith("/assets/")) return notFound();
        String asset = path.substring("/assets/".length());
        if (asset.contains("..")) return notFound();
        try {
            InputStream in = ctx.getAssets().open(asset);
            WebResourceResponse res = new WebResourceResponse(mime(asset), "UTF-8", in);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            headers.put("Access-Control-Allow-Origin", "*");
            res.setResponseHeaders(headers);
            return res;
        } catch (IOException e) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        WebResourceResponse r = new WebResourceResponse("text/plain", "UTF-8", null);
        r.setStatusCodeAndReasonPhrase(404, "Not Found");
        return r;
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }
}
