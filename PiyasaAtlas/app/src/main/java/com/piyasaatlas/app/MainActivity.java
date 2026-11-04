package com.piyasaatlas.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.net.Uri;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.ByteArrayOutputStream;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private WebView web;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xff06101b);
        getWindow().setNavigationBarColor(0xff06101b);
        web = new WebView(this);
        web.setBackgroundColor(0xff06101b);
        setContentView(web);
        WebSettings st = web.getSettings();
        st.setJavaScriptEnabled(true);
        st.setDomStorageEnabled(true);
        st.setAllowFileAccess(false);
        st.setAllowContentAccess(false);
        st.setAllowFileAccessFromFileURLs(false);
        st.setAllowUniversalAccessFromFileURLs(false);
        st.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if ("appassets.androidplatform.net".equals(host)) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                }
                return true;
            }
        });
        web.addJavascriptInterface(new AtlasBridge(), "AtlasBridge");
        try (InputStream is = getAssets().open("index.html")) {
            String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            web.loadDataWithBaseURL("https://appassets.androidplatform.net/", content, "text/html", "UTF-8", null);
        } catch (Exception ex) {
            web.loadDataWithBaseURL(null, "<html><body style='background:#06101b;color:white'>Arayüz yüklenemedi</body></html>", "text/html", "UTF-8", null);
        }
    }
    private void toWeb(String js) {
        WebView current=web;
        if(current!=null) runOnUiThread(() -> { if(web==current) current.evaluateJavascript(js,null); });
    }
    public final class AtlasBridge {
        @JavascriptInterface public void saveFastFeedKey(String key) {
            String cleaned = key == null ? "" : key.trim();
            if (cleaned.length() > 512) return;
            getSharedPreferences("atlas_private", MODE_PRIVATE)
                .edit().putString("hasfiyat_api_key", cleaned).apply();
        }
        @JavascriptInterface public String loadFastFeedKey() {
            return getSharedPreferences("atlas_private", MODE_PRIVATE)
                .getString("hasfiyat_api_key", "");
        }

        @JavascriptInterface public void requestTruncgil() {
            new Thread(() -> {
                HttpURLConnection c=null;
                try {
                    URL url=new URL("https://finans.truncgil.com/v4/today.json");
                    c=(HttpURLConnection)url.openConnection();
                    c.setConnectTimeout(8000);c.setReadTimeout(8000);
                    c.setRequestProperty("Accept","application/json");
                    c.setRequestProperty("User-Agent","PiyasaAtlas/0.3 Android");
                    c.setUseCaches(false);
                    if(c.getResponseCode()!=200) throw new Exception("HTTP "+c.getResponseCode());
                    try(InputStream in=c.getInputStream();ByteArrayOutputStream buffer=new ByteArrayOutputStream()){
                        byte[] b=new byte[8192];int n;int total=0;
                        while((n=in.read(b))!=-1){total+=n;if(total>200000)throw new Exception("Unexpected response size");buffer.write(b,0,n);}
                        JSONObject json=new JSONObject(buffer.toString("UTF-8"));
                        toWeb("window.onTruncgilResponse && window.onTruncgilResponse("+json.toString()+")");
                    }
                }catch(Exception error){
                    toWeb("window.onTruncgilError && window.onTruncgilError('Piyasa servisi erişilemiyor')");
                }finally{if(c!=null)c.disconnect();}
            },"atlas-markets").start();
        }
        @JavascriptInterface public void shareCsv(String csv) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, "Piyasa Atlas Portföy CSV");
                i.putExtra(Intent.EXTRA_TEXT, csv);
                startActivity(Intent.createChooser(i, "Portföy verilerini paylaş"));
            });
        }
    }
    @Override @SuppressWarnings("deprecation") public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(function(){if(document.querySelector('#sheet')?.classList.contains('open')){closeSheet();return 'done'}if(typeof page!=='undefined'&&page!=='home'){navigate('home');return 'done'}return 'exit'})()", result -> {
            if ("\"exit\"".equals(result)) MainActivity.super.onBackPressed();
        });
    }
    @Override public void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
