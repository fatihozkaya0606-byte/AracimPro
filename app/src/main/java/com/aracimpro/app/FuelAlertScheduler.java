package com.aracimpro.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public final class FuelAlertScheduler {
    public static final String PREFS = "fuel_alerts";
    private static final int REQUEST = 88041;
    private static final long INTERVAL = 6L * 60L * 60L * 1000L;

    private FuelAlertScheduler() {}

    public static void configure(Context context, boolean enabled, String city, String fuelType) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit().putBoolean("enabled", enabled)
                .putString("city", city == null ? "Ankara" : city)
                .putString("fuelType", fuelType == null ? "Benzin" : fuelType)
                .apply();
        if (enabled) schedule(context); else cancel(context);
    }

    public static void schedule(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(context, FuelAlertReceiver.class).setAction("com.aracimpro.app.FUEL_CHECK");
        PendingIntent pi = PendingIntent.getBroadcast(context, REQUEST, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long first = System.currentTimeMillis() + 10L * 60L * 1000L;
        am.setInexactRepeating(AlarmManager.RTC_WAKEUP, first, INTERVAL, pi);
    }

    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(context, FuelAlertReceiver.class).setAction("com.aracimpro.app.FUEL_CHECK");
        PendingIntent pi = PendingIntent.getBroadcast(context, REQUEST, i, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) { am.cancel(pi); pi.cancel(); }
    }
}
