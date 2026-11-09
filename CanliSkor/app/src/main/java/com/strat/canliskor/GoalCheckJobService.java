package com.strat.canliskor;

import android.app.Notification;
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
import org.json.JSONTokener;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Periodic best-effort alerts. NOT instant push: Android jobs run >=15 min apart. */
public class GoalCheckJobService extends JobService {
    private static final String PREFS="background_goals";
    private static final String CHANNEL="canli_skor_favorites";
    private static final int JOB=25520;
    private static final int MAX_TRACKED=25;
    private final ExecutorService executor=Executors.newSingleThreadExecutor();

    public static void setTracked(Context ctx,String input){
        try{
            JSONArray selected=new JSONArray(input), clean=new JSONArray();
            Set<String> seen=new HashSet<>();
            for(int i=0;i<selected.length()&&clean.length()<MAX_TRACKED;i++){
                JSONObject e=selected.optJSONObject(i);if(e==null)continue;
                String provider=e.optString("provider","");
                String id=e.optString("id",""),slug=e.optString("slug","");
                if("bsd".equals(provider)&&!id.matches("[0-9]{1,12}"))continue;
                if("sportscore".equals(provider)&&!slug.matches("[a-z0-9-]{3,140}"))continue;
                if(!"bsd".equals(provider)&&!"sportscore".equals(provider))continue;
                String key=provider+":"+("bsd".equals(provider)?id:slug);
                if(!seen.add(key))continue;
                clean.put(new JSONObject().put("key",key).put("provider",provider)
                   .put("id",id).put("slug",slug)
                   .put("home",e.optString("home","")).put("away",e.optString("away","")));
            }
            ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit()
                .putString("tracked",clean.toString()).apply();
            reschedule(ctx);
        }catch(Exception ignored){}
    }
    public static void schedule(Context ctx,boolean enabled,String token){
        ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit()
          .putBoolean("enabled",enabled).putString("token",token==null?"":token).apply();
        reschedule(ctx);
    }
    private static void reschedule(Context ctx){
        JobScheduler jobs=(JobScheduler)ctx.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if(jobs==null)return;
        SharedPreferences p=ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        if(!p.getBoolean("enabled",false) || "[]".equals(p.getString("tracked","[]"))){
            jobs.cancel(JOB);return;
        }
        JobInfo info=new JobInfo.Builder(JOB,new ComponentName(ctx,GoalCheckJobService.class))
          .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true)
          .setPeriodic(15L*60_000L).build();
        jobs.schedule(info);
    }
    @Override public boolean onStartJob(JobParameters params){
        executor.execute(()->{
            try{pollFavorites();}catch(Exception ignored){}
            new Handler(Looper.getMainLooper()).post(()->jobFinished(params,false));
        });
        return true;
    }
    @Override public boolean onStopJob(JobParameters params){return true;}
    @Override public void onDestroy(){executor.shutdownNow();super.onDestroy();}

    private static JSONObject fetch(String uri,String token)throws Exception {
        URL u=new URL(uri);
        if(!"https".equals(u.getProtocol()) || !("sports.bzzoiro.com".equals(u.getHost())||"sportscore.com".equals(u.getHost())))
            throw new SecurityException("Invalid API host");
        HttpURLConnection conn=(HttpURLConnection)u.openConnection();
        conn.setConnectTimeout(8000);conn.setReadTimeout(10000);conn.setInstanceFollowRedirects(false);
        conn.setRequestProperty("Accept","application/json");
        if("sports.bzzoiro.com".equals(u.getHost())&&!token.isEmpty())
            conn.setRequestProperty("Authorization","Token "+token);
        try {
            if(conn.getResponseCode()!=200)throw new Exception("HTTP "+conn.getResponseCode());
            try(InputStream in=conn.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] buf=new byte[8192];int n,total=0;
                while((n=in.read(buf))!=-1){out.write(buf,0,n);total+=n;if(total>1_200_000)throw new Exception("Response too large");}
                Object json=new JSONTokener(out.toString(StandardCharsets.UTF_8.name())).nextValue();
                if(json instanceof JSONObject)return (JSONObject)json;
                if(json instanceof JSONArray)return new JSONObject().put("results",json);
                throw new Exception("Invalid JSON");
            }
        }finally{conn.disconnect();}
    }
    private static String value(JSONObject j,String...names){
        if(j==null)return "";
        for(String k:names){
            Object x=j.opt(k);
            if(x!=null&&x!=JSONObject.NULL&&!String.valueOf(x).trim().isEmpty())return String.valueOf(x);
        }
        return "";
    }
    private static int num(String s){try{return Integer.parseInt(s);}catch(Exception e){return -1;}}
    private static JSONObject core(JSONObject r){
        JSONObject m=r.optJSONObject("match");if(m!=null)return m;
        JSONObject d=r.optJSONObject("data");
        if(d!=null){m=d.optJSONObject("match");return m!=null?m:d;}
        m=r.optJSONObject("event");return m!=null?m:r;
    }
    private static int[] scores(JSONObject j){
        JSONObject score=j.optJSONObject("score"),goals=j.optJSONObject("goals");
        int h=num(value(j,"home_score","score_home","homeGoals"));
        int a=num(value(j,"away_score","score_away","awayGoals"));
        if(score!=null){if(h<0)h=num(value(score,"home","home_score"));if(a<0)a=num(value(score,"away","away_score"));}
        if(goals!=null){if(h<0)h=num(value(goals,"home"));if(a<0)a=num(value(goals,"away"));}
        return new int[]{h,a};
    }
    private static String state(JSONObject j){
        JSONObject time=j.optJSONObject("time");
        String status=value(j,"status","match_status","state");
        String clock=value(time,"status","phase").toLowerCase().replace(' ','_').replace('-','_');
        if(clock.equals("ht")||clock.equals("half_time")||clock.equals("halftime")
          ||clock.equals("interval")||clock.equals("finished")||clock.equals("ft"))status=clock;
        if(status.isEmpty())status=value(time,"status","phase","display");
        String s=status.toLowerCase().replace(' ','_').replace('-','_');
        if(s.equals("finished")||s.equals("ft")||s.equals("ended")||s.equals("complete")
          ||s.equals("completed")||s.equals("aet")||s.equals("after_penalties"))return "FT";
        if(s.equals("ht")||s.equals("half_time")||s.equals("halftime")||s.equals("interval")
          ||s.equals("break")||s.equals("half_time_break"))return "HT";
        String phase=value(j,"phase","period","match_phase").toLowerCase();
        if(phase.equals("ht")||phase.equals("half_time")||phase.equals("halftime")||phase.equals("interval")
            ||j.optBoolean("is_halftime")||j.optBoolean("is_half_time"))return "HT";
        return "LIVE";
    }
    private static JSONArray incidents(JSONObject response,JSONObject match){
        for(String field:new String[]{"incidents","events","timeline","actions"}){
            JSONArray arr=match.optJSONArray(field);if(arr!=null)return arr;
            arr=response.optJSONArray(field);if(arr!=null)return arr;
        }
        JSONArray arr=response.optJSONArray("results");
        return arr!=null?arr:new JSONArray();
    }
    private static Set<String> reds(JSONArray a){
        Set<String> result=new HashSet<>();
        for(int i=0;i<a.length();i++){
            JSONObject e=a.optJSONObject(i);if(e==null)continue;
            String type=value(e,"type","incident_type","event_type","action_type").toLowerCase();
            String color=value(e,"card","card_type","color","detail","value").toLowerCase();
            if(!type.contains("card")&&!type.contains("booking"))continue;
            if(!color.contains("red")&&!color.contains("kırmızı")&&!color.contains("kirmizi")
               &&!color.contains("second_yellow")&&!color.contains("2nd_yellow"))continue;
            result.add(value(e,"id","event_id")+":"+value(e,"minute","time")
               +":"+value(e,"player","player_name")+":"+value(e,"is_home","side")+":"+color);
        }
        return result;
    }
    private static Set<String> toSet(JSONArray arr){
        Set<String> result=new HashSet<>();
        if(arr!=null)for(int i=0;i<arr.length();i++)result.add(arr.optString(i));
        return result;
    }
    private static JSONArray toArray(Set<String> items){
        JSONArray r=new JSONArray();for(String a:items)r.put(a);return r;
    }
    private static String team(JSONObject sub,JSONObject match,String side){
        Object v=match.opt(side);
        if(v instanceof JSONObject){
            String n=value((JSONObject)v,"name","short_name");if(!n.isEmpty())return n;
        }
        String n=value(match,side+"_team_name",side+"_name");
        return !n.isEmpty()?n:sub.optString(side,side.equals("home")?"Ev sahibi":"Deplasman");
    }
    private void pollFavorites()throws Exception {
        SharedPreferences prefs=getSharedPreferences(PREFS,MODE_PRIVATE);
        if(!prefs.getBoolean("enabled",false))return;
        JSONArray list=new JSONArray(prefs.getString("tracked","[]"));
        JSONObject old=new JSONObject(prefs.getString("snapshots","{}"));
        JSONObject next=new JSONObject(prefs.getString("snapshots","{}"));
        String token=prefs.getString("token","");
        for(int i=0;i<list.length()&&i<MAX_TRACKED;i++){
            JSONObject sub=list.optJSONObject(i);if(sub==null)continue;
            String key=sub.optString("key",""),provider=sub.optString("provider","");
            if(key.isEmpty())continue;
            String url,incidentsUrl="";
            if(provider.equals("bsd")){
                if(token.isEmpty())continue;
                url="https://sports.bzzoiro.com/api/v2/events/"+sub.optString("id")+"/";
                incidentsUrl=url+"incidents/";
            }else if(provider.equals("sportscore")){
                url="https://sportscore.com/api/widget/match/?sport=football&slug="+
                    URLEncoder.encode(sub.optString("slug"),"UTF-8");
            }else continue;
            try {
                JSONObject response=fetch(url,token),match=core(response);
                int[] score=scores(match);
                String status=state(match);
                JSONArray all=incidents(response,match);
                if(!incidentsUrl.isEmpty()){
                    try{JSONObject incidentResponse=fetch(incidentsUrl,token);
                        all=incidents(incidentResponse,new JSONObject());}catch(Exception ignored){}
                }
                Set<String> red=reds(all);
                JSONArray redArray=toArray(red);
                JSONObject prior=old.optJSONObject(key);
                JSONObject snapshot=new JSONObject().put("home",score[0]).put("away",score[1])
                    .put("status",status).put("reds",redArray);
                String home=team(sub,match,"home"),away=team(sub,match,"away");
                String line=score[0]>=0&&score[1]>=0?
                  home+" "+score[0]+" - "+score[1]+" "+away:home+" - "+away;
                if(prior!=null){
                    int h=prior.optInt("home",-1),a=prior.optInt("away",-1);
                    if((h>=0&&score[0]>h)||(a>=0&&score[1]>a))
                        send(key+"-goal","⚽ GOL!",line);
                    String before=prior.optString("status","LIVE");
                    if(status.equals("HT")&&!before.equals("HT"))send(key+"-ht","⏱ İlk yarı sona erdi",line);
                    if(status.equals("FT")&&!before.equals("FT"))send(key+"-ft","🏁 Maç sona erdi",line);
                    Set<String> previousReds=toSet(prior.optJSONArray("reds"));
                    for(String r:red)if(!previousReds.contains(r))
                        send(key+"-red-"+r,"🟥 Kırmızı kart!",line);
                }
                next.put(key,snapshot);
            }catch(Exception ignored){/* Keep old snapshot on errors; do not fabricate alerts. */}
        }
        prefs.edit().putString("snapshots",next.toString()).apply();
    }
    public static void testNotification(Context ctx){
        notify(ctx,"test","🔔 Deneme bildirimi","Canlı Skor+ bildirim kanalı çalışıyor.");
    }
    private void send(String id,String title,String message){notify(this,id,title,message);}
    private static void notify(Context ctx,String id,String title,String message){
        if(Build.VERSION.SDK_INT>=33&&ctx.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
          !=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
        NotificationManager manager=(NotificationManager)ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        if(Build.VERSION.SDK_INT>=26){
            NotificationChannel channel=new NotificationChannel(CHANNEL,"Favori maç bildirimleri",NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Gol, kırmızı kart, devre arası ve maç sonu");
            manager.createNotificationChannel(channel);
        }
        Intent intent=new Intent(ctx,MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi=PendingIntent.getActivity(ctx,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|
          (Build.VERSION.SDK_INT>=23?PendingIntent.FLAG_IMMUTABLE:0));
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?
          new Notification.Builder(ctx,CHANNEL):new Notification.Builder(ctx);
        builder.setSmallIcon(android.R.drawable.stat_notify_more).setContentTitle(title)
          .setContentText(message).setStyle(new Notification.BigTextStyle().bigText(message))
          .setAutoCancel(true).setContentIntent(pi).setDefaults(Notification.DEFAULT_ALL);
        manager.notify(id.hashCode(),builder.build());
    }
}
