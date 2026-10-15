package com.kapismaarena.game;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.View;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle savedInstanceState){super.onCreate(savedInstanceState);
 getWindow().setStatusBarColor(Color.rgb(3,9,25));getWindow().setNavigationBarColor(Color.rgb(3,9,25));
 web=new WebView(this);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
 web.setWebViewClient(new WebViewClient());web.setWebChromeClient(new WebChromeClient());web.setBackgroundColor(Color.rgb(3,9,25));web.setOverScrollMode(View.OVER_SCROLL_NEVER);setContentView(web);web.loadUrl("file:///android_asset/index.html");
 }
 @Override public void onBackPressed(){web.evaluateJavascript("window.goBack && window.goBack()",null);}
 @Override public void onDestroy(){if(web!=null)web.destroy();super.onDestroy();}
}
