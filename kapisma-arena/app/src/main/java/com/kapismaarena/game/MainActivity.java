package com.kapismaarena.game;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.View;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;

public class MainActivity extends Activity {
    private WebView web;
    private final Object introLock = new Object();
    private AudioTrack introTrack;
    private int introGeneration = 0;
    private class NativeAudioBridge {
        @JavascriptInterface public void playIntro(){ startIntroMusic(); }
        @JavascriptInterface public void stopIntro(){ stopIntroMusic(); }
    }
    @Override public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(3,9,25));
        getWindow().setNavigationBarColor(Color.rgb(3,9,25));
        web=new WebView(this);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new NativeAudioBridge(),"NativeAudio");
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.setBackgroundColor(Color.rgb(3,9,25));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }
    private void stopIntroMusic(){
        synchronized(introLock){
            introGeneration++;
            if(introTrack!=null){
                try{introTrack.stop();}catch(Exception ignored){}
                try{introTrack.release();}catch(Exception ignored){}
                introTrack=null;
            }
        }
    }
    // Short original synthesized instrumental, no external files, network, or copyrighted recordings.
    private void startIntroMusic(){
        stopIntroMusic();
        final int id;
        synchronized(introLock){ id=introGeneration; }
        new Thread(()->{
            final int sr=22050, seconds=4, sampleCount=sr*seconds;
            short[] samples=new short[sampleCount];
            double[] roots={196.00, 261.63, 174.61, 196.00};
            double[] notes={392.00,523.25,587.33,659.25,783.99,659.25,587.33,783.99,880.00,1046.5};
            for(int n=0;n<sampleCount;n++){
                double t=(double)n/sr;
                double env=Math.min(1.0,t*14.0)*Math.min(1.0,Math.max(0,(3.55-t)*3.5));
                int chord=Math.min(3,(int)(t/.89));
                double root=roots[chord];
                int step=Math.min(notes.length-1,(int)(t/.355));
                double beat=t-(step*.355);
                double melodyEnv=Math.exp(-beat*4.2);
                double bass=Math.sin(2*Math.PI*root*t)*.14;
                double fifth=Math.sin(2*Math.PI*root*1.4983*t)*.095;
                double third=Math.sin(2*Math.PI*root*1.2599*t)*.075;
                double melody=Math.sin(2*Math.PI*notes[step]*t)*(.18*melodyEnv);
                double shimmer=Math.sin(2*Math.PI*notes[step]*2*t)*(.036*melodyEnv);
                double output=(bass+fifth+third+melody+shimmer)*env;
                samples[n]=(short)(Math.max(-1,Math.min(1,output))*32767);
            }
            synchronized(introLock){
                if(introGeneration!=id)return;
                try{
                    AudioTrack track=new AudioTrack.Builder()
                      .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                      .setAudioFormat(new AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(sr).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                      .setBufferSizeInBytes(samples.length*2)
                      .setTransferMode(AudioTrack.MODE_STATIC)
                      .build();
                    track.write(samples,0,samples.length);
                    introTrack=track;
                    track.play();
                }catch(Exception ignored){}
            }
        },"arena-intro-music").start();
    }
    @Override protected void onPause(){ stopIntroMusic();super.onPause(); }
    @Override public void onBackPressed(){
        web.evaluateJavascript("window.goBack && window.goBack()",null);
    }
    @Override public void onDestroy(){
        stopIntroMusic();
        if(web!=null)web.destroy();
        super.onDestroy();
    }
}
