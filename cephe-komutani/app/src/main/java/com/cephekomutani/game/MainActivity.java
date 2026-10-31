package com.cephekomutani.game;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.*;
public class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  getWindow().setStatusBarColor(Color.rgb(16,30,40));
  getWindow().setNavigationBarColor(Color.rgb(12,27,37));
  web=new WebView(this);
  web.setBackgroundColor(Color.rgb(16,30,40));
  WebSettings s=web.getSettings();
  s.setJavaScriptEnabled(true);
  s.setDomStorageEnabled(true);
  s.setAllowFileAccess(true);
  s.setSupportZoom(false);
  s.setBuiltInZoomControls(false);
  s.setMediaPlaybackRequiresUserGesture(false);
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient());
  setContentView(web);
  web.loadUrl("file:///android_asset/index.html");
 }
 @Override public void onBackPressed(){
  if(web!=null)web.evaluateJavascript("document.getElementById('menuBtn').click()",null);
  else super.onBackPressed();
 }
 @Override public void onPause(){super.onPause();if(web!=null)web.onPause();}
 @Override public void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override public void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}