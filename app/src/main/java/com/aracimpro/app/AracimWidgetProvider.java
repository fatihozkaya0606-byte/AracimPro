package com.aracimpro.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class AracimWidgetProvider extends AppWidgetProvider {
    private static final String PREF = "aracim_widget";

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        SharedPreferences p = context.getSharedPreferences(PREF, Context.MODE_PRIVATE);
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_aracim);
        rv.setTextViewText(R.id.widgetTitle, p.getString("title", "Aracım Pro"));
        rv.setTextViewText(R.id.widgetSubtitle, p.getString("subtitle", "Aracını ekleyerek başla"));
        rv.setTextViewText(R.id.widgetDetail, p.getString("detail", "Bakım • Yakıt • Gider"));
        PendingIntent pi = PendingIntent.getActivity(context, 0, new Intent(context, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        rv.setOnClickPendingIntent(R.id.widgetRoot, pi);
        manager.updateAppWidget(id, rv);
    }

    public static void storeAndRefresh(Context context, String title, String subtitle, String detail) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit()
                .putString("title", title).putString("subtitle", subtitle).putString("detail", detail).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, AracimWidgetProvider.class));
        for (int id : ids) updateOne(context, manager, id);
    }
}
