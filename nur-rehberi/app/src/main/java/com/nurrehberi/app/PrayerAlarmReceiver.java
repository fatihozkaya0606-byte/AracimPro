package com.nurrehberi.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.Manifest;

public final class PrayerAlarmReceiver extends BroadcastReceiver {
  private static final String CHANNEL="nur_ezan_short_v1";
  @Override public void onReceive(Context context,Intent intent) {
    if(intent==null||!"com.nurrehberi.app.PRAYER_ALERT".equals(intent.getAction()))return;
    String prayer=intent.getStringExtra("prayer");
    String city=intent.getStringExtra("city");
    if(prayer==null)prayer="Namaz";
    if(city==null)city="Türkiye";
    notify(context,prayer,city);
  }

  public static void notify(Context c,String prayer,String city){
    NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
    if(nm==null)return;
    if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
    Uri sound=Uri.parse("android.resource://"+c.getPackageName()+"/raw/ezan_notify");
    if(Build.VERSION.SDK_INT>=26){
      NotificationChannel channel=new NotificationChannel(CHANNEL,"Namaz vakti • kısa ezan",NotificationManager.IMPORTANCE_HIGH);
      channel.setDescription("Hesaplanan namaz vakti bildirimleri — kısa ezan sesi");
      AudioAttributes attributes=new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build();
      channel.setSound(sound,attributes);
      channel.enableVibration(true);
      nm.createNotificationChannel(channel);
    }
    Intent open=new Intent(c,MainActivity.class);
    open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent content=PendingIntent.getActivity(c,81,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,CHANNEL):new Notification.Builder(c);
    b.setSmallIcon(R.drawable.ic_nur)
     .setContentTitle(prayer+" vakti • "+city)
     .setContentText("Nur Rehberi • Namaz vakti hatırlatması")
     .setContentIntent(content)
     .setAutoCancel(true)
     .setColor(Color.rgb(8,83,57));
    if(Build.VERSION.SDK_INT<26)b.setSound(sound);
    int id=(int)(System.currentTimeMillis()/60000L%100000);
    nm.notify(id,b.build());
  }
}
