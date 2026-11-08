package com.dunyapenceresi.app;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.view.View;
import android.widget.Toast;

public class MainActivity extends Activity {
  private WebView browser;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().setStatusBarColor(Color.rgb(5,14,25));
    getWindow().setNavigationBarColor(Color.rgb(7,19,32));
    getWindow().getDecorView().setSystemUiVisibility(0);
    browser = new WebView(this);
    browser.setBackgroundColor(Color.rgb(6,17,30));
    WebSettings settings=browser.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMediaPlaybackRequiresUserGesture(true);
    settings.setSupportMultipleWindows(false);
    settings.setDefaultTextEncodingName("UTF-8");
    browser.setWebViewClient(new WebViewClient() {
      private boolean handle(Uri uri) {
        String address = uri.toString();
        if(address.startsWith("file:///android_asset/")) return false;
        String scheme=uri.getScheme();
        if (scheme != null && (scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))) {
          try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
          catch(Exception ex) {Toast.makeText(MainActivity.this,"Bağlantı açılamadı",Toast.LENGTH_SHORT).show();}
        }
        return true;
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return handle(request.getUrl());}
      @Override public boolean shouldOverrideUrlLoading(WebView view,String url){return handle(Uri.parse(url));}
    });
    setContentView(browser);
    browser.loadUrl("file:///android_asset/index.html");
  }
  @Override public void onBackPressed() {
    if(browser != null && browser.canGoBack()) browser.goBack();
    else super.onBackPressed();
  }
  @Override protected void onDestroy(){
    if(browser != null){ browser.destroy(); browser = null;}
    super.onDestroy();
  }
}
