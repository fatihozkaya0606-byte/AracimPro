package com.kapismarena.testfix;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
public final class MainActivity extends Activity {
  private WebView web;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(3,10,35));
    getWindow().setNavigationBarColor(Color.rgb(3,10,35));
    web = new WebView(this);
    web.setWebViewClient(new WebViewClient());
    WebSettings ws=web.getSettings();
    ws.setJavaScriptEnabled(true);
    ws.setDomStorageEnabled(true);
    ws.setAllowFileAccess(true);
    web.setBackgroundColor(Color.rgb(2,10,38));
    setContentView(web);
    web.loadUrl("file:///android_asset/index.html");
  }
  @Override public void onBackPressed() {
    if(web!=null && web.canGoBack()) web.goBack(); else super.onBackPressed();
  }
  @Override protected void onDestroy() {
    if(web!=null){ web.destroy(); web=null; } super.onDestroy();
  }
}
