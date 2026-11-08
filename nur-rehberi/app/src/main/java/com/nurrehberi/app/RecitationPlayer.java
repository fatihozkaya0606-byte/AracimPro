package com.nurrehberi.app;

import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import org.json.JSONObject;
import java.util.Locale;

/** Native Android MP3 streaming for authorised source-linked Qur'an recitations.
 * Never downloads / embeds podcast tracks in the APK. No microphone or file access.
 */
public final class RecitationPlayer {
  private final WebView web;
  private MediaPlayer player;
  private boolean ready=false;
  private boolean loading=false;
  private final Handler main=new Handler(Looper.getMainLooper());
  private int generation=0;
  public RecitationPlayer(WebView web){this.web=web;}

  public static boolean approved(String raw){
    if(raw==null||raw.length()>2200)return false;
    try{
      Uri uri=Uri.parse(raw);
      if(!"https".equalsIgnoreCase(uri.getScheme()))return false;
      String host=uri.getHost();
      if(host==null)return false;
      host=host.toLowerCase(Locale.ROOT);
      boolean valid=host.equals("qurancentral.com")||host.endsWith(".qurancentral.com")
        ||host.equals("mp3quran.net")||host.endsWith(".mp3quran.net");
      String path=uri.getPath();
      return valid && path!=null && path.toLowerCase(Locale.ROOT).endsWith(".mp3");
    }catch(Exception ignored){return false;}
  }
  private void emit(String state,String info){
    main.post(()->{
      try{
        if(web!=null)web.evaluateJavascript("window.NurNativeAudio&&window.NurNativeAudio.onState("+
          JSONObject.quote(state)+","+JSONObject.quote(info)+")",null);
      }catch(Exception ignored){}
    });
  }
  private void release(){
    MediaPlayer old=player;player=null;ready=false;loading=false;
    if(old!=null){try{old.reset();old.release();}catch(Exception ignored){}}
  }
  public void play(String url){
    if(!approved(url)){emit("error","Bu kayıt için izin verilen ses adresi bulunamadı.");return;}
    release();
    final int token=++generation;
    emit("loading","Ses hazırlanıyor…");
    try{
      MediaPlayer p=new MediaPlayer();
      player=p;loading=true;
      p.setAudioAttributes(new AudioAttributes.Builder()
       .setUsage(AudioAttributes.USAGE_MEDIA)
       .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
      p.setOnPreparedListener(media->{
        if(token!=generation||media!=player)return;
        loading=false;ready=true;
        try{media.start();emit("playing","Ses oynatılıyor.");}
        catch(Exception e){emit("error","Kayıt başlatılamadı.");release();}
      });
      p.setOnCompletionListener(media->{if(token!=generation)return;emit("ended","Kayıt tamamlandı.");release();});
      p.setOnErrorListener((media,what,extra)->{
        if(token!=generation)return true;
        emit("error","Android ses çözücüsü / bağlantı hatası ("+what+").");
        release();return true;
      });
      p.setDataSource(url);
      p.prepareAsync();
    }catch(Exception ex){emit("error","Ses akışı açılırken hata oluştu.");release();}
  }
  public void toggle(){
    if(player==null||!ready){emit("error","Henüz oynatılabilir ses hazır değil.");return;}
    try{
      if(player.isPlaying()){player.pause();emit("paused","Duraklatıldı.");}
      else{player.start();emit("playing","Ses oynatılıyor.");}
    }catch(Exception e){emit("error","Ses kontrolü başarısız.");}
  }
  public void stop(){generation++;release();emit("stopped","Oynatma durduruldu.");}
  public void close(){generation++;release();}
}
