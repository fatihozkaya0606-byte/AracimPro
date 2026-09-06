package com.aracimpro.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

public class FuelAlertReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        final PendingResult pending = goAsync();
        final Context app = context.getApplicationContext();
        new Thread(() -> {
            try {
                SharedPreferences p = app.getSharedPreferences(FuelAlertScheduler.PREFS, Context.MODE_PRIVATE);
                if (!p.getBoolean("enabled", false)) return;
                String city = p.getString("city", "Ankara");
                String fuelType = p.getString("fuelType", "Benzin");
                JSONObject data = FuelDataClient.fetchDashboard(city, fuelType);
                double price = data.optDouble("selectedPrice", 0);
                double lastPrice = Double.longBitsToDouble(p.getLong("lastPriceBits", Double.doubleToRawLongBits(0d)));
                String lastHeadline = p.getString("lastHeadline", "");
                JSONArray news = data.optJSONArray("news");
                String headline = news != null && news.length() > 0 ? news.optJSONObject(0).optString("title", "") : "";

                boolean notified = false;
                if (price > 0 && lastPrice > 0 && Math.abs(price - lastPrice) >= 0.05) {
                    String dir = price > lastPrice ? "yükseldi" : "düştü";
                    notify(app, "Akaryakıt fiyatı değişti", city + " • " + fuelType + " " + String.format(new Locale("tr","TR"), "%.2f TL/L", price) + " • fiyat " + dir, 88042);
                    notified = true;
                }
                String low = headline.toLowerCase(new Locale("tr","TR"));
                if (!headline.isEmpty() && !headline.equals(lastHeadline) && (low.contains("zam") || low.contains("indirim"))) {
                    if (!notified) notify(app, "Akaryakıt gündemi", headline, 88043);
                }
                SharedPreferences.Editor e = p.edit();
                if (price > 0) e.putLong("lastPriceBits", Double.doubleToRawLongBits(price));
                if (!headline.isEmpty()) e.putString("lastHeadline", headline);
                e.apply();
            } catch (Throwable ignored) {
            } finally {
                pending.finish();
            }
        }).start();
    }

    private void notify(Context context, String title, String text, int id) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            String channel = "fuel_updates";
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationChannel c = new NotificationChannel(channel, "Akaryakıt fiyat ve zam/indirim uyarıları", NotificationManager.IMPORTANCE_DEFAULT);
                nm.createNotificationChannel(c);
            }
            PendingIntent content = PendingIntent.getActivity(context, id, new Intent(context, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(context, channel) : new Notification.Builder(context);
            b.setSmallIcon(R.drawable.ic_notification).setContentTitle(title).setContentText(text)
                    .setStyle(new Notification.BigTextStyle().bigText(text)).setAutoCancel(true).setContentIntent(content);
            nm.notify(id, b.build());
        } catch (Throwable ignored) {}
    }
}
