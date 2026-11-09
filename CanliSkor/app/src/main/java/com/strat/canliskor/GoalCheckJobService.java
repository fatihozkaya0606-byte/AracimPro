package com.strat.canliskor;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Android background-compatible, best-effort goal check.
 * Minimum periodicity is 15 minutes; it is NOT an instant push service.
 * Force-stop, battery saving, notifications permission and network can delay/stop checks.
 */
public class GoalCheckJobService extends JobService {
    private static final int JOB_ID = 25520;
    private static final String PREFS = "background_goals";
    private static final String CHANNEL = "canli_skor_gol";
    private static final long MIN_PERIOD = 15L * 60L * 1000L;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public static void schedule(Context context, boolean enabled, String token) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putBoolean("enabled",enabled).putString("token",token).apply();
        JobScheduler jobs=(JobScheduler)context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if(jobs == null)return;
        if (!enabled || token == null || token.trim().isEmpty()) { jobs.cancel(JOB_ID); return; }
        JobInfo job=new JobInfo.Builder(JOB_ID,new ComponentName(context,GoalCheckJobService.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPersisted(true)
            .setPeriodic(MIN_PERIOD)
            .build();
        jobs.schedule(job);
    }

    @Override public boolean onStartJob(JobParameters params) {
        executor.execute(() -> {
            try { checkGoals(); } catch(Exception ignored) { /* Retry at next scheduled interval. */ }
            new Handler(Looper.getMainLooper()).post(() -> jobFinished(params,false));
        });
        return true;
    }
    @Override public boolean onStopJob(JobParameters params) {return true;}
    @Override public void onDestroy() {executor.shutdownNow();super.onDestroy();}

    private static String readStream(InputStream input)throws Exception {
        try(InputStream in=input;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] chunk=new byte[8192];int n,total=0;
            while((n=in.read(chunk))!=-1){out.write(chunk,0,n);total+=n;if(total>1_500_000)throw new Exception("Response too large");}
            return out.toString(StandardCharsets.UTF_8.name());
        }
    }
    private JSONObject loadPage(String token,int offset)throws Exception {
        URL u=new URL("https://sports.bzzoiro.com/api/v2/events/live/?limit=200&offset="+offset);
        HttpURLConnection c=(HttpURLConnection)u.openConnection();
        c.setConnectTimeout(8000);c.setReadTimeout(11000);c.setInstanceFollowRedirects(false);
        c.setRequestProperty("Accept","application/json");c.setRequestProperty("Authorization","Token "+token);
        try{
            if(c.getResponseCode()!=200)throw new Exception("Bad status");
            return new JSONObject(readStream(c.getInputStream()));
        }finally {c.disconnect();}
    }
    private static Object score(JSONObject row, String primary, String alternate, String pair){
        Object v=row.opt(primary);if(v == null||v==JSONObject.NULL)v=row.opt(alternate);
        if(v == null||v==JSONObject.NULL){JSONObject s=row.optJSONObject("score");if(s!=null)v=s.opt(pair);}
        return v==null||v==JSONObject.NULL?null:v;
    }
    private void checkGoals()throws Exception {
        SharedPreferences prefs=getSharedPreferences(PREFS,MODE_PRIVATE);
        String token=prefs.getString("token","");
        if(!prefs.getBoolean("enabled",false)||token==null||token.isEmpty())return;
        JSONObject previous=new JSONObject(prefs.getString("scores","{}"));
        JSONObject current=new JSONObject();
        for(int page=0;page<5;page++){
            JSONObject data=loadPage(token,page*200);JSONArray rows=data.optJSONArray("results");
            if(rows==null)rows=data.optJSONArray("events");
            if(rows==null)break;
            for(int i=0;i<rows.length();i++){
                JSONObject e=rows.optJSONObject(i);if(e==null)continue;
                if(!"live".equalsIgnoreCase(e.optString("status","live")))continue;
                String id=e.optString("id","");if(id.isEmpty())continue;
                Object home=score(e,"home_score","score_home","home");
                Object away=score(e,"away_score","score_away","away");
                if(home==null||away==null)continue;
                int h,a;try{h=Integer.parseInt(home.toString());a=Integer.parseInt(away.toString());}catch(Exception ignored){continue;}
                current.put(id,new JSONArray().put(h).put(a));
                JSONArray old=previous.optJSONArray(id);
                if(old!=null&&(h>old.optInt(0)||a>old.optInt(1))){
                    String ht=e.optString("home_team_name",e.optString("home_name","Ev sahibi"));
                    String at=e.optString("away_team_name",e.optString("away_name","Deplasman"));
                    JSONObject homeTeam=e.optJSONObject("home_team");JSONObject awayTeam=e.optJSONObject("away_team");
                    if(homeTeam!=null)ht=homeTeam.optString("name",ht);
                    if(awayTeam!=null)at=awayTeam.optString("name",at);
                    sendNotification(id,ht+" "+h+" - "+a+" "+at);
                }
            }
            String next=data.optString("next","");
            if(next.isEmpty()||next.equals("null")||rows.length()<200)break;
        }
        // Retain scores across polls for a currently live game; finished games disappear naturally.
        prefs.edit().putString("scores",current.toString()).apply();
    }
    private void sendNotification(String id,String score){
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(manager==null)return;
        if(Build.VERSION.SDK_INT>=33 &&
          checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
        if(Build.VERSION.SDK_INT>=26){
            NotificationChannel channel=new NotificationChannel(CHANNEL,"Gol bildirimleri",NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Canlı maç gol bildirimi");manager.createNotificationChannel(channel);
        }
        Intent intent=new Intent(this,MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi=PendingIntent.getActivity(this,0,intent,
          PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT>=23?PendingIntent.FLAG_IMMUTABLE:0));
        android.app.Notification.Builder builder=Build.VERSION.SDK_INT>=26?
          new android.app.Notification.Builder(this,CHANNEL):new android.app.Notification.Builder(this);
        builder.setSmallIcon(android.R.drawable.stat_notify_more)
          .setContentTitle("⚽ GOL! · Canlı Skor+").setContentText(score)
          .setStyle(new android.app.Notification.BigTextStyle().bigText(score))
          .setAutoCancel(true).setContentIntent(pi).setDefaults(android.app.Notification.DEFAULT_ALL);
        manager.notify(id.hashCode(),builder.build());
    }
}