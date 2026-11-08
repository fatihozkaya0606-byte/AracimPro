package com.nurrehberi.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public final class PrayerAlarmScheduler {
  private static final String PREFS="nur_prayer_alerts";
  private static final int FIRST_ID=4000;
  private static final int MAX_ITEMS=160;
  private PrayerAlarmScheduler(){}

  private static AlarmManager manager(Context c){
    return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
  }

  private static PendingIntent pending(Context c,int i,String city,String prayer,long epoch){
    Intent intent=new Intent(c,PrayerAlarmReceiver.class);
    intent.setAction("com.nurrehberi.app.PRAYER_ALERT");
    intent.putExtra("city",city);
    intent.putExtra("prayer",prayer);
    intent.putExtra("epoch",epoch);
    return PendingIntent.getBroadcast(c,FIRST_ID+i,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  }

  public static void disable(Context c){
    AlarmManager am=manager(c);
    if(am!=null)for(int i=0;i<MAX_ITEMS;i++){
      PendingIntent pi=pending(c,i,"","",0);
      am.cancel(pi);pi.cancel();
    }
    c.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putBoolean("enabled",false).remove("items").apply();
  }

  public static int enable(Context c,String city,String items) throws JSONException {
    if(city==null||city.length()<2||city.length()>70)throw new JSONException("Invalid city");
    JSONArray array=new JSONArray(items);
    if(array.length()<5||array.length()>MAX_ITEMS)throw new JSONException("Invalid schedule count");
    long last=0;
    for(int i=0;i<array.length();i++){
      JSONObject o=array.getJSONObject(i);
      long t=o.getLong("t");
      String prayer=o.getString("p");
      if(t<last||t>System.currentTimeMillis()+37L*86400000||!valid(prayer))throw new JSONException("Invalid schedule time");
      last=t;
    }
    disable(c);
    SharedPreferences.Editor edit=c.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit();
    edit.putString("items",items).putString("city",city).putLong("updated",System.currentTimeMillis()).putBoolean("enabled",true).apply();
    return restore(c);
  }

  private static boolean valid(String prayer){
    return "İmsak".equals(prayer)||"Öğle".equals(prayer)||"İkindi".equals(prayer)||"Akşam".equals(prayer)||"Yatsı".equals(prayer);
  }

  public static int restore(Context c){
    SharedPreferences p=c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    if(!p.getBoolean("enabled",false))return 0;
    String raw=p.getString("items",null);
    if(raw==null)return 0;
    AlarmManager alarm=manager(c);
    if(alarm==null)return 0;
    int count=0;
    try{
      JSONArray array=new JSONArray(raw);
      String city=p.getString("city","Türkiye");
      long now=System.currentTimeMillis();
      for(int i=0;i<array.length()&&i<MAX_ITEMS;i++){
        JSONObject o=array.getJSONObject(i);
        long epoch=o.getLong("t");
        if(epoch<=now+1000)continue;
        String prayer=o.getString("p");
        if(!valid(prayer))continue;
        PendingIntent intent=pending(c,i,city,prayer,epoch);
        // Exact alarms require special permission on modern Android.
        if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.S&&alarm.canScheduleExactAlarms())
          alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,epoch,intent);
        else if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.M)
          alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,epoch,intent);
        else alarm.set(AlarmManager.RTC_WAKEUP,epoch,intent);
        count++;
      }
    }catch(Exception ignored){}
    return count;
  }
}
