package com.nurrehberi.app;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class PrayerBootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i) {
   if(i!=null&&("android.intent.action.BOOT_COMPLETED".equals(i.getAction())||
     "android.intent.action.MY_PACKAGE_REPLACED".equals(i.getAction())||
     "android.intent.action.TIME_SET".equals(i.getAction())||
     "android.intent.action.TIMEZONE_CHANGED".equals(i.getAction())))
     PrayerAlarmScheduler.restore(c);
 }
}
