package com.ozkaya.metaltarama;

import android.app.Activity;
import android.os.Bundle;
import android.os.SystemClock;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.content.res.ColorStateList;
import android.widget.ProgressBar;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.TextView;
import android.graphics.drawable.GradientDrawable;
import java.util.Locale;

public class MainActivity extends Activity implements SensorEventListener {
    private SensorManager sensors;
    private Sensor magnet;
    private Sensor gyro;
    private Sensor linearAcceleration;
    private int magnetAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM;
    private ToneGenerator tone;
    private Vibrator vibrator;
    private TextView fieldText, diffText, peakText, stateText, thresholdText, axesText;
    private TextView signalHeadline, signalLevel, modeNote, soundState;
    private ProgressBar signalBar;
    private SeekBar thresholdSeek;
    private TextView thresholdHint;
    private final Button[] modeButtons = new Button[4];
    private int activeMode = 0;
    private boolean alarmEnabled = true;
    private Graph graph;
    private float filtered = Float.NaN, base = Float.NaN, peak = 0f;
    private float x = 0, y = 0, z = 0;
    private float threshold = 2f;
    private int samples = 0;
    private double calSum = 0, calSq = 0;
    private float noise = 0f;
    private long alarmStart = 0, lastUi = 0, motionHoldUntil = 0, belowSince = 0;
    private boolean alarmArmed = true;
    private boolean ready = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(6,16,29));
        getWindow().setNavigationBarColor(Color.rgb(6,16,29));
        sensors = (SensorManager)getSystemService(Context.SENSOR_SERVICE);
        magnet = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        gyro = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        linearAcceleration = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
        vibrator = (Vibrator)getSystemService(VIBRATOR_SERVICE);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        try { tone = new ToneGenerator(AudioManager.STREAM_MUSIC, 100); }
        catch (RuntimeException ignored) { tone = null; }
        buildScreen();
        calibrate();
        if (magnet == null) {
            stateText.setText("Bu telefonda manyetik alan sensörü yok. Ölçüm yapılamaz.");
        }
    }

    private int dp(float v) { return Math.round(v * getResources().getDisplayMetrics().density); }
    private GradientDrawable bg(int color, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color); d.setCornerRadius(dp(radius)); return d;
    }
    private TextView text(String s, float sp, int color, boolean bold) {
        TextView v = new TextView(this); v.setText(s); v.setTextSize(sp); v.setTextColor(color);
        if(bold) v.setTypeface(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD);
        return v;
    }
    private LinearLayout section(LinearLayout root) {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(18),dp(16),dp(18),dp(16));
        l.setBackground(bg(0xff10243a, 20));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1,-2); p.setMargins(0,dp(11),0,0);
        root.addView(l,p); return l;
    }
    private void add(LinearLayout parent, View child, int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1,-2); p.topMargin=dp(top); parent.addView(child,p);
    }
    private void buildScreen() {
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.setBackgroundColor(0xff071321);
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(dp(19),dp(22),dp(19),dp(26));
        scroll.addView(root); setContentView(scroll);
        add(root,text("METAL TARAYICI",25,0xfff2f9ff,true),0);
        add(root,text("TOPRAK / KAYA  •  SENSÖR TEST",11,0xff63e6c6,true),5);
        add(root,text("Manyetik alan taraması: demir veya manyetik parazitleri gösterebilir. Cam ve altın gibi manyetik olmayan nesneleri ayırt edemez.",13,0xffa4b9c9,false),12);
        LinearLayout choose = section(root);
        add(choose,text("TARAMA MODU",12,0xff8aabc3,true),0);
        String[] labels = {"KARIŞIK","DEMİR ETKİ","HASSAS","ZAYIF SİNYAL"};
        for(int rowIndex=0;rowIndex<2;rowIndex++) {
            LinearLayout modeRow = new LinearLayout(this);
            modeRow.setOrientation(LinearLayout.HORIZONTAL);
            for(int col=0;col<2;col++) {
                final int which=rowIndex*2+col;
                Button b=new Button(this);
                b.setText(labels[which]); b.setTextSize(11); b.setAllCaps(false);
                b.setPadding(dp(2),dp(1),dp(2),dp(1)); b.setMinimumHeight(dp(46));
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(46),1f);
                lp.setMargins(dp(2),0,dp(2),0);
                modeRow.addView(b,lp);
                modeButtons[which]=b;
                b.setOnClickListener(v -> applyMode(which));
            }
            add(choose,modeRow,rowIndex==0 ? 12 : 5);
        }
        modeNote=text("",12,0xff94b4c6,false);
        add(choose,modeNote,9);

        LinearLayout sens = section(root);
        add(sens,text("HASSASİYET / ALARM EŞİĞİ",12,0xff8aabc3,true),0);
        thresholdText=text("20 µT • Dengeli",17,0xffe1f5ff,true);
        add(sens,thresholdText,8);
        thresholdSeek = new SeekBar(this);
        thresholdSeek.setMax(118);
        thresholdSeek.setProgress(18);
        thresholdSeek.setProgressTintList(ColorStateList.valueOf(0xff4ee9b9));
        add(sens,thresholdSeek,8);
        add(sens,text("SOL: Daha hassas (çok alarm)     SAĞ: Daha seçici (az alarm)",11,0xffa2b9c9,false),5);
        thresholdHint=text("Aralık: 2–120 µT. Daha düşük eşik, fiziksel menzili garanti etmez.",11,0xff8ba9be,false);
        add(sens,thresholdHint,7);
        thresholdSeek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar bar,int v,boolean user) {
                // Weak mode offers precision in 0.1 uT increments; other modes retain the v1.5 scale.
                threshold=activeMode==3 ? (0.3f+v*0.1f) : (2f+v);
                String quality=activeMode==3
                    ? (threshold<1f ? "Maksimum duyarlılık" : threshold<2.5f ? "Zayıf değişimler" : "Daha seçici")
                    : threshold<=8 ? "Çok hassas" : threshold<=15 ? "Hassas"
                    : threshold<=25 ? "Dengeli" : threshold<=45 ? "Az hassas" : "Sadece güçlü değişimler";
                thresholdText.setText(String.format(Locale.US,activeMode==3 ? "%.1f µT • %s" : "%.0f µT • %s",threshold,quality));
                if(graph!=null) graph.setThreshold(threshold);
                if(user) {
                    alarmStart=0; belowSince=0; alarmArmed=true;
                }
            }
            @Override public void onStartTrackingTouch(SeekBar s) {}
            @Override public void onStopTrackingTouch(SeekBar s) {}
        });

        LinearLayout target = section(root);
        add(target,text("SİNYAL DURUMU",12,0xff91adc4,true),0);
        signalHeadline=text("KALİBRASYON",27,0xffe1f5ff,true);
        add(target,signalHeadline,7);
        signalLevel=text("Bekleniyor...",14,0xff9db7c7,false);
        add(target,signalLevel,7);
        signalBar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        signalBar.setMax(100); signalBar.setProgress(0);
        signalBar.setProgressTintList(ColorStateList.valueOf(0xff4ee9b9));
        signalBar.setProgressBackgroundTintList(ColorStateList.valueOf(0xff294255));
        LinearLayout.LayoutParams sbp=new LinearLayout.LayoutParams(-1,dp(13));
        sbp.topMargin=dp(13);
        target.addView(signalBar,sbp);

        LinearLayout meter = section(root);
        add(meter,text("ANLIK MANYETİK ALAN",12,0xff8aabc3,true),0);
        fieldText=text("--.- µT",44,0xfff4fdff,true); add(meter,fieldText,8);
        axesText=text("X: --   Y: --   Z: --",11,0xff8daec4,false); add(meter,axesText,4);
        add(meter,text("KALİBRASYONA GÖRE FARK",11,0xff8aabc3,true),19);
        diffText=text("--.- µT",29,0xff4ef0b5,true); add(meter,diffText,4);
        peakText=text("En yüksek fark: --",12,0xffa4c8d9,false); add(meter,peakText,7);
        LinearLayout plot = section(root);
        add(plot,text("CANLI SİNYAL GRAFİĞİ",12,0xff8aabc3,true),0);
        graph = new Graph(this); LinearLayout.LayoutParams gp=new LinearLayout.LayoutParams(-1,dp(178)); gp.topMargin=dp(10); plot.addView(graph,gp);
        LinearLayout settings = section(root);
        add(settings,text("ALARM VE KALİBRASYON",13,0xffe1f5ff,true),0);
        Button cal = new Button(this);
        cal.setText("ORTAMI KALİBRE ET");
        cal.setTextColor(0xff051b22); cal.setAllCaps(false);
        cal.setBackground(bg(0xff4ee9b9,13)); add(settings,cal,10);
        cal.setOnClickListener(v -> calibrate());
        Button test = new Button(this);
        test.setText("SESİ TEST ET 🔊"); test.setAllCaps(false);
        test.setTextColor(0xffffffff);
        test.setBackground(bg(0xff2769a5,13));
        add(settings,test,9);
        test.setOnClickListener(v -> playFeedback(true));
        Button onoff = new Button(this);
        onoff.setText("ALARM: AÇIK"); onoff.setAllCaps(false);
        onoff.setTextColor(0xffe9f5fc); onoff.setBackground(bg(0xff24405b,13));
        add(settings,onoff,9);
        onoff.setOnClickListener(v -> {
            alarmEnabled=!alarmEnabled;
            onoff.setText(alarmEnabled ? "ALARM: AÇIK" : "ALARM: KAPALI");
            if(!alarmEnabled && tone!=null) tone.stopTone();
        });
        soundState=text("Ses için telefonun MEDYA sesini açın. Sesi Test Et düğmesine basın.",12,0xffa7cbe0,false);
        add(settings,soundState,9);
        stateText=text("Ölçüm bekleniyor...",13,0xffd3e7ef,false); add(settings,stateText,12);
        add(root,text("KARŞILAŞTIRMALI TEST: Telefonu bir masaya SABİT yerleştir, kılıfındaki mıknatısı çıkar. Önce ortamı kalibre et. Demir, düz cam ve altını ayrı ayrı telefona yaklaştır. Telefonu oynatmadan oluşan farkları karşılaştır. Cam uyarısı varsa çevrede metal/parazit aranmalı. Bu uygulama altın tespiti yapmaz.",12,0xff91aec1,false),17);
        if(graph!=null) graph.setThreshold(threshold);
        applyMode(0);
    }
    private void applyMode(int which) {
        activeMode=which;
        float preset=which==0 ? 20.0f : (which==1 ? 30.0f : (which==2 ? 6.0f : 0.9f));
        threshold=preset;
        if(thresholdSeek!=null) {
            int progress=which==3 ? Math.round((preset-0.3f)/0.1f) : Math.round(preset-2.0f);
            thresholdSeek.setProgress(progress);
            if(which==3) threshold=0.3f+progress*0.1f;
        }
        if(thresholdHint!=null) thresholdHint.setText(which==3
            ? "Zayıf Sinyal: 0,3–12,1 µT, 0,1 µT adımlarla. Yanlış alarm artabilir."
            : "Normal modlar: 2–120 µT. Hassasiyet, fiziksel menzili garanti etmez.");
        for(int i=0;i<modeButtons.length;i++) {
            Button b=modeButtons[i];
            if(b==null) continue;
            boolean selected=i==which;
            b.setTextColor(selected ? 0xff071b25 : 0xffd5e9fa);
            b.setBackground(bg(selected ? 0xff4ee9b9 : 0xff27445d,11));
        }
        modeNote.setText(
            which==0 ? "KARIŞIK: Genel manyetik değişimler. Metal türünü ayırt edemez." :
            which==1 ? "DEMİR ETKİ: Daha yüksek eşik. Yalnızca demiri kesin tespit etmez." :
            which==2 ? "HASSAS: Küçük manyetik değişimlerde daha sık uyarı." :
                       "ZAYIF SİNYAL+: Daha ince eşik (0,1 µT adım), hareket filtresi ve 1,2 sn doğrulama. Gürültüye duyarlıdır.");
        alarmStart=0; alarmArmed=true; belowSince=0;
    }
    private void playFeedback(boolean test) {
        try {
            AudioManager audio=(AudioManager)getSystemService(Context.AUDIO_SERVICE);
            int volume=audio==null ? 0 : audio.getStreamVolume(AudioManager.STREAM_MUSIC);
            if(tone!=null) tone.startTone(ToneGenerator.TONE_PROP_BEEP,480);
            if(vibrator!=null && vibrator.hasVibrator())
                vibrator.vibrate(VibrationEffect.createOneShot(290,VibrationEffect.DEFAULT_AMPLITUDE));
            if(test && soundState!=null) {
                soundState.setText(volume==0 ?
                    "Medya sesi kapalı! Telefonun SES AÇMA tuşuna bas." :
                    "Test sinyali gönderildi. Ses yoksa medya sesini / sessiz modu kontrol et.");
            }
        } catch(RuntimeException ex) {
            if(soundState!=null) soundState.setText("Ses başlatılamadı. Telefon medya ses ayarını kontrol et.");
        }
    }
    private void updateSignal(float delta, boolean confirmed, boolean over, boolean moving) {
        if(!ready) {
            signalHeadline.setText("KALİBRASYON");
            signalHeadline.setTextColor(0xffd7e9f4);
            signalLevel.setText("Telefonu sabit tutun...");
            signalBar.setProgress(0);
            return;
        }
        float effective=Math.max(threshold,noise*(activeMode==3 ? 3.5f : 4f));
        float factor=effective>0 ? delta/effective : 0;
        int progress=Math.min(100,Math.round(factor*25f));
        signalBar.setProgress(progress);
        int color;
        if(moving) {
            signalHeadline.setText("ÖLÇÜM BEKLETİLDİ");
            signalLevel.setText("Hareket veya sensör paraziti: daha sabit ölçüm yapın.");
            color=0xffa8b5c8;
        } else if(confirmed) {
            if(factor>=4) {
                signalHeadline.setText("GÜÇLÜ MANYETİK FARK");
                signalLevel.setText(alarmArmed ? "Güçlü manyetik değişim" : "Tek uyarı verildi. Yeni hedef için sinyalden uzaklaşın.");
                color=0xffff6767;
            } else if(factor>=2) {
                signalHeadline.setText("ORTA MANYETİK FARK");
                signalLevel.setText(alarmArmed ? "Manyetik değişim algılandı" : "Tek uyarı verildi. Yeniden uyarı için uzaklaşın.");
                color=0xffffad50;
            } else {
                signalHeadline.setText("MANYETİK FARK VAR");
                signalLevel.setText(alarmArmed ? "Zayıf manyetik değişim" : "Tek uyarı verildi. Yeniden uyarı için uzaklaşın.");
                color=0xffffdf72;
            }
        } else if(over) {
            signalHeadline.setText("KONTROL EDİLİYOR");
            signalLevel.setText("Anlık sıçrama; kalıcı sinyal bekleniyor");
            color=0xffffdf72;
        } else {
            signalHeadline.setText("SİNYAL YOK");
            signalLevel.setText("Eşik üstü kalıcı manyetik değişim yok");
            color=0xff4ee9b9;
        }
        signalHeadline.setTextColor(color);
        signalBar.setProgressTintList(ColorStateList.valueOf(color));
    }
    private void calibrate() {
        ready = false; samples = 0; calSum = 0; calSq = 0; base = Float.NaN; peak = 0;
        alarmStart=0; belowSince=0; alarmArmed=true; motionHoldUntil=0; filtered=Float.NaN;
        if(stateText!=null) stateText.setText("Kalibrasyon: Telefonu 2–3 saniye sabit tutun...");
        if(graph!=null) graph.clear();
    }
    @Override protected void onResume() {
        super.onResume();
        if(sensors != null && magnet != null) sensors.registerListener(this,magnet,SensorManager.SENSOR_DELAY_GAME);
        if(sensors != null && gyro != null) sensors.registerListener(this,gyro,SensorManager.SENSOR_DELAY_GAME);
        if(sensors != null && linearAcceleration != null) sensors.registerListener(this,linearAcceleration,SensorManager.SENSOR_DELAY_GAME);
    }
    @Override protected void onPause() {
        if(sensors != null) sensors.unregisterListener(this);
        if(tone!=null) tone.stopTone();
        super.onPause();
    }
    @Override protected void onDestroy() {
        if(tone!=null) { tone.release(); tone=null; }
        super.onDestroy();
    }
    @Override public void onAccuracyChanged(Sensor sensor,int accuracy) {
        if (sensor.getType()==Sensor.TYPE_MAGNETIC_FIELD) magnetAccuracy=accuracy;
    }
    @Override public void onSensorChanged(SensorEvent event) {
        if(event.values.length<3) return;
        if(event.sensor.getType()==Sensor.TYPE_GYROSCOPE) {
            float g=(float)Math.sqrt(event.values[0]*event.values[0]+event.values[1]*event.values[1]+event.values[2]*event.values[2]);
            if(g > 0.65f) motionHoldUntil=SystemClock.elapsedRealtime()+900;
            return;
        }
        if(event.sensor.getType()==Sensor.TYPE_LINEAR_ACCELERATION) {
            float a=(float)Math.sqrt(event.values[0]*event.values[0]+event.values[1]*event.values[1]+event.values[2]*event.values[2]);
            if(a > 2.2f) motionHoldUntil=SystemClock.elapsedRealtime()+850;
            return;
        }
        if(event.sensor.getType() != Sensor.TYPE_MAGNETIC_FIELD) return;
        x=event.values[0]; y=event.values[1]; z=event.values[2];
        if(!Float.isFinite(x)||!Float.isFinite(y)||!Float.isFinite(z)) return;
        float mag=(float)Math.sqrt((double)x*x+(double)y*y+(double)z*z);
        if(!Float.isFinite(filtered)) filtered=mag;
        // Weak signal uses moderate integration to keep faint signals visible during slow sweeps.
        filtered += (activeMode==3 ? 0.085f : 0.12f)*(mag-filtered);
        if(!ready) {
            samples++; calSum += filtered; calSq += (double)filtered*filtered;
            if(samples>=85) {
                float trialNoise=(float)Math.sqrt(Math.max(0,calSq/samples-(calSum/samples)*(calSum/samples)));
                if(trialNoise > 3.0f) {
                    samples=0; calSum=0; calSq=0;
                    stateText.setText("Kalibrasyon sırasında hareket var. Telefonu sabit tutun.");
                } else {
                    base=(float)(calSum/samples);
                    noise=trialNoise;
                    ready=true;
                    stateText.setText("Kalibrasyon tamam. Yavaşça tarayın.");
                }
            }
        }
        long time=SystemClock.elapsedRealtime();
        boolean moving=time<motionHoldUntil;
        boolean unreliable = magnetAccuracy==SensorManager.SENSOR_STATUS_UNRELIABLE;
        float effective=Math.max(threshold,noise*(activeMode==3 ? 3.5f : 4f));
        float delta=ready ? Math.abs(filtered-base) : 0f;
        boolean over=ready && !moving && !unreliable && delta>=effective;
        if(over) {
            if(alarmStart==0) alarmStart=time;
            belowSince=0;
        } else {
            alarmStart=0;
            // Yalnızca sinyal gerçekten düştüğünde yeniden alarm kur.
            if(ready && !moving && !unreliable && delta < effective*0.55f) {
                if(belowSince==0) belowSince=time;
                if(time-belowSince>=1700) alarmArmed=true;
            } else belowSince=0;
        }
        boolean confirmed=over && alarmStart>0 && time-alarmStart>=(activeMode==3 ? 1200 : 1100);
        if(ready) {
            peak=Math.max(peak,delta);
            if(!moving && !unreliable && delta<effective*0.4f) {
                // Sessiz zemini çok yavaş izle; büyük anomalileri yutma.
                base += 0.002f*(filtered-base);
            }
            if(confirmed && alarmEnabled && alarmArmed) {
                alarmArmed=false;
                playFeedback(false);
            }
        }
        long now=SystemClock.elapsedRealtime();
        if(now-lastUi>=95) {
            lastUi=now;
            fieldText.setText(String.format(Locale.US,"%.1f µT",filtered));
            axesText.setText(String.format(Locale.US,"X: %.1f    Y: %.1f    Z: %.1f µT",x,y,z));
            if(ready) {
                diffText.setText(String.format(Locale.US,"%.2f µT",delta));
                peakText.setText(String.format(Locale.US,"En yüksek fark: %.2f µT  •  Gürültü: %.2f",peak,noise));
                if(unreliable) stateText.setText("Sensör doğruluğu düşük: telefonun manyetik sensörünü kalibre edin.");
                else if(moving) stateText.setText("Telefon hareketi algılandı. Tarama sırasında yavaş ve sabit ilerleyin.");
                else if(confirmed) stateText.setText("Manyetik fark görüldü. Bu, altın veya metal türü tespiti değildir.");
                else if(over) stateText.setText(activeMode==3 ? "Zayıf sinyal 1,2 sn doğrulanıyor..." : "1,1 saniyelik sinyal doğrulanıyor...");
                else stateText.setText("Tarama aktif. Manyetik değişim izleniyor.");
                updateSignal(delta,confirmed,over,moving || unreliable);
                graph.push(delta);
            } else {
                diffText.setText("Kalibrasyon");
                peakText.setText("Örnek: "+samples+"/85");
                updateSignal(0f,false,false,false);
                graph.push(0f);
            }
        }
    }
    static class Graph extends View {
        private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
        private final float[] data=new float[110];
        private int size=0, head=0;
        private float th=2f;
        Graph(Context c) { super(c); }
        void setThreshold(float t) { th=t; invalidate(); }
        void clear() {size=0;head=0;invalidate();}
        void push(float v) { data[head]=v;head=(head+1)%data.length;size=Math.min(data.length,size+1);invalidate();}
        @Override protected void onDraw(Canvas c) {
            super.onDraw(c);
            float den=getResources().getDisplayMetrics().density;
            float L=6*den,T=12*den,R=getWidth()-6*den,B=getHeight()-11*den;
            p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(den);p.setColor(0xff284257);
            for(int i=0;i<5;i++) {float y=T+(B-T)*i/4f;c.drawLine(L,y,R,y,p);}
            float max=Math.max(4f,th*1.65f);
            for(int i=0;i<size;i++) max=Math.max(max,data[(head-size+i+data.length)%data.length]*1.18f);
            float level=B-(th/max)*(B-T);
            p.setColor(0xffe8a84f); p.setStrokeWidth(den); c.drawLine(L,level,R,level,p);
            Path path=new Path();
            for(int i=0;i<size;i++) {
                float v=data[(head-size+i+data.length)%data.length];
                float px=L+(R-L)*i/(data.length-1f);float py=B-(v/max)*(B-T);
                if(i==0) path.moveTo(px,py); else path.lineTo(px,py);
            }
            p.setColor(0xff4ee9b9);p.setStrokeWidth(2.8f*den);p.setStyle(Paint.Style.STROKE);
            c.drawPath(path,p);
        }
    }
}
