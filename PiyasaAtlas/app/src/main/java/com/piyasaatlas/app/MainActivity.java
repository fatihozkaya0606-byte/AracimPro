package com.piyasaatlas.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
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
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new AtlasBridge(), "AtlasBridge");
        try (InputStream is = getAssets().open("index.html")) {
            String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            web.loadDataWithBaseURL("https://appassets.androidplatform.net/", content, "text/html", "UTF-8", null);
        } catch (Exception ex) {
            web.loadDataWithBaseURL(null, "<html><body style='background:#06101b;color:white'>Arayüz yüklenemedi</body></html>", "text/html", "UTF-8", null);
        }
    }
    public final class AtlasBridge {
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
