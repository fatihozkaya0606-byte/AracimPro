package com.nurrehberi.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONException;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
 private WebView browser;
 private WebViewAssetLoader loader;
 private GeolocationPermissions.Callback locationCallback;
 private String locationOrigin;
 private static final int LOCATION_CODE = 3109;
 private static final int NOTIFY_CODE = 3110;
 private Uri pendingPrayerUri;

 @Override public void onCreate(Bundle state) {
   super.onCreate(state);
   getWindow().setStatusBarColor(Color.rgb(8,40,32));
   getWindow().setNavigationBarColor(Color.rgb(8,40,32));

   loader = new WebViewAssetLoader.Builder()
      .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
      .build();
   browser = new WebView(this);
   browser.setBackgroundColor(Color.rgb(246,247,243));
   WebSettings settings = browser.getSettings();
   settings.setJavaScriptEnabled(true);
   settings.setDomStorageEnabled(true);
   settings.setAllowFileAccess(false);
   settings.setAllowContentAccess(false);
   settings.setMediaPlaybackRequiresUserGesture(true);
   settings.setGeolocationEnabled(true);
   settings.setDefaultTextEncodingName("UTF-8");
   settings.setSupportMultipleWindows(false);
   browser.setWebViewClient(new WebViewClient() {
     @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
        return loader.shouldInterceptRequest(req.getUrl());
     }
     @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
        return req.isForMainFrame() && goExternal(req.getUrl());
     }
     @Override public boolean shouldOverrideUrlLoading(WebView v, String address) {
        Uri uri=Uri.parse(address); if("www.youtube-nocookie.com".equals(uri.getHost()) || "www.youtube.com".equals(uri.getHost())) return false; return goExternal(uri);
     }
   });
   browser.setWebChromeClient(new WebChromeClient() {
     @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
       if (!origin.startsWith("https://appassets.androidplatform.net")) {
          cb.invoke(origin,false,false);
          return;
       }
       if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
          cb.invoke(origin,true,false);
       } else {
          locationCallback = cb; locationOrigin = origin;
          requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},LOCATION_CODE);
       }
     }
   });
   setContentView(browser);
   browser.loadUrl("https://appassets.androidplatform.net/assets/index.html");
 }
 private boolean goExternal(Uri uri) {
   if (uri==null) return true;
   if("nur".equals(uri.getScheme())) { handlePrayerAction(uri); return true; }
   if("appassets.androidplatform.net".equals(uri.getHost())) return false;
   String scheme=uri.getScheme();
   if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
     try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch(Exception ignored) {}
   }
   return true;
 }

 private void handlePrayerAction(Uri uri){
   String action=uri.getHost();
   if("disable".equals(action)){
     PrayerAlarmScheduler.disable(this);
     Toast.makeText(this,"Namaz bildirimleri kapatıldı.",Toast.LENGTH_LONG).show();
     return;
   }
   if(!"schedule".equals(action)&&!"test".equals(action))return;
   if(android.os.Build.VERSION.SDK_INT>=33 &&
     checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
     pendingPrayerUri=uri;
     requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFY_CODE);
     return;
   }
   if("test".equals(action)){
     PrayerAlarmReceiver.notify(this,"Test","Nur Rehberi");
     Toast.makeText(this,"Test bildirimi gönderildi.",Toast.LENGTH_SHORT).show();
     return;
   }
   try{
     String city=uri.getQueryParameter("city"),items=uri.getQueryParameter("items");
     if(items==null)throw new JSONException("empty schedule");
     int count=PrayerAlarmScheduler.enable(this,city,items);
     Toast.makeText(this,count+" namaz vakti bildirimi ayarlandı. Her ay güncelleyin.",Toast.LENGTH_LONG).show();
   }catch(Exception e){
     Toast.makeText(this,"Bildirim kurulamadı. Tekrar deneyin.",Toast.LENGTH_LONG).show();
   }
 }
 @Override public void onRequestPermissionsResult(int req,String[] perms,int[] grants){
   super.onRequestPermissionsResult(req,perms,grants);
   if(req==NOTIFY_CODE){
      Uri saved=pendingPrayerUri; pendingPrayerUri=null;
      if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED&&saved!=null)
        handlePrayerAction(saved);
      else Toast.makeText(this,"Bildirim izni verilmedi.",Toast.LENGTH_LONG).show();
      return;
   }
   if(req==LOCATION_CODE && locationCallback!=null) {
      boolean allowed = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED
        || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED;
      locationCallback.invoke(locationOrigin,allowed,false);
      locationCallback=null; locationOrigin=null;
   }
 }
 @Override public void onBackPressed() {
   if(browser==null) {super.onBackPressed();return;}
   browser.evaluateJavascript("(function(){if(typeof st!=='undefined'&&st.page!=='home'){go('home');return true;}return false;})()", val -> {
     if(!"true".equals(val)) MainActivity.super.onBackPressed();
   });
 }
 @Override protected void onDestroy() {
   if(browser!=null){browser.destroy();browser=null;}
   super.onDestroy();
 }
}
