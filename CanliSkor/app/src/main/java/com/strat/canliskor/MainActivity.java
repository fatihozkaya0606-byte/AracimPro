package com.strat.canliskor;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.KeyEvent;
import android.graphics.Color;
import org.json.JSONObject;
import java.net.URL;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private WebView web;
    private final ExecutorService pool = Executors.newFixedThreadPool(3);
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(8,16,30));
        getWindow().setNavigationBarColor(Color.rgb(13,24,40));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(8,16,30));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(true);
        web.getSettings().setAllowFileAccessFromFileURLs(false);
        web.getSettings().setAllowUniversalAccessFromFileURLs(false);
        web.addJavascriptInterface(new ScoresBridge(),"AndroidApi");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request){
                Uri uri=request.getUrl();
                if("file".equals(uri.getScheme()))return false;
                if("http".equals(uri.getScheme())||"https".equals(uri.getScheme())){
                    startActivity(new Intent(Intent.ACTION_VIEW,uri));
                }
                return true;
            }
        });
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }
    public class ScoresBridge {
        @JavascriptInterface public void request(String rawUrl, String token, String reqId){
            pool.submit(()->{
                HttpURLConnection conn=null;
                int code=500;String result="{}";
                try{
                    URL url=new URL(rawUrl);
                    String host=url.getHost();
                    if(!"https".equals(url.getProtocol()) || !(host.equals("sportscore.com")||host.equals("sports.bzzoiro.com"))) throw new SecurityException("İzin verilmeyen veri sunucusu");
                    conn=(HttpURLConnection)url.openConnection();
                    conn.setConnectTimeout(9000);conn.setReadTimeout(11000);
                    conn.setRequestProperty("Accept","application/json");
                    conn.setRequestProperty("User-Agent","CanliSkorPlus/0.1 Android");
                    if(host.equals("sports.bzzoiro.com")&&!token.isEmpty())conn.setRequestProperty("Authorization","Token "+token);
                    code=conn.getResponseCode();
                    InputStream in=(code>=200&&code<300)?conn.getInputStream():conn.getErrorStream();
                    if(in!=null){try(InputStream stream=in; ByteArrayOutputStream out=new ByteArrayOutputStream()){
                        byte[] buffer=new byte[8192];int n;int total=0;
                        while((n=stream.read(buffer))!=-1){out.write(buffer,0,n);total+=n;if(total>4_000_000)throw new Exception("Yanıt çok büyük");}
                        result=out.toString(StandardCharsets.UTF_8.name());
                    }}
                    if(result.isEmpty())result="{}";
                }catch(Exception e){code=503;result="{\"message\":"+JSONObject.quote(e.getMessage()==null?"Bağlantı hatası":e.getMessage())+"}";}
                finally{if(conn!=null)conn.disconnect();}
                final int finalCode=code;final String body=result;
                runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.__nativeResult("+JSONObject.quote(reqId)+","+finalCode+","+JSONObject.quote(body)+")",null);});
            });
        }
    }
    @Override public boolean onKeyDown(int keyCode, KeyEvent event){
        if(keyCode==KeyEvent.KEYCODE_BACK){
            web.evaluateJavascript("window.onNativeBack()",v->{if("false".equals(v)){onBackPressed();}});
            return true;
        }
        return super.onKeyDown(keyCode,event);
    }
    @Override protected void onDestroy(){
        pool.shutdownNow();
        if(web!=null){web.destroy();web=null;}
        super.onDestroy();
    }
}
