package com.aracimpro.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        SharedPreferences p = context.getSharedPreferences(FuelAlertScheduler.PREFS, Context.MODE_PRIVATE);
        if (p.getBoolean("enabled", false)) FuelAlertScheduler.schedule(context);
    }
}
