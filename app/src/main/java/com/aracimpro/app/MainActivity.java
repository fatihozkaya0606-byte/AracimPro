package com.aracimpro.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Insets;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.pdf.PdfDocument;
import android.hardware.biometrics.BiometricPrompt;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;
import org.json.JSONArray;

import java.io.ByteArrayOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Iterator;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.Executor;

public class MainActivity extends Activity {
    private static final int CREATE_FILE_REQUEST = 7701;
    private static final int OPEN_BACKUP_REQUEST = 7702;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7703;
    private static final int PICK_IMAGE_REQUEST = 7704;
    private static final int PICK_DOCUMENT_REQUEST = 7705;

    private WebView webView;
    private FrameLayout root;
    private String pendingFileName;
    private String pendingMime;
    private String pendingContent;
    private byte[] pendingBinary;
    private String pendingPickerContext;
    private boolean pageReady = false;
    private boolean appWasBackgrounded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);

        root = new FrameLayout(this);
        root.setBackgroundColor(0xFFF4F8FF);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFFF4F8FF);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (Build.VERSION.SDK_INT >= 30) {
            try { getWindow().setDecorFitsSystemWindows(false); } catch (Throwable ignored) {}
        }

        final int fallbackTop = systemDimen("status_bar_height", dp(28));
        final int fallbackBottom = systemDimen("navigation_bar_height", dp(44));
        applyWebMargins(0, fallbackTop, 0, fallbackBottom);

        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left = 0, top = fallbackTop, right = 0, bottom = fallbackBottom;
            try {
                if (Build.VERSION.SDK_INT >= 30) {
                    Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    Insets ime = insets.getInsets(WindowInsets.Type.ime());
                    left = bars.left;
                    top = Math.max(fallbackTop, bars.top);
                    right = bars.right;
                    bottom = Math.max(Math.max(fallbackBottom, bars.bottom), ime.bottom);
                } else {
                    left = insets.getSystemWindowInsetLeft();
                    top = Math.max(fallbackTop, insets.getSystemWindowInsetTop());
                    right = insets.getSystemWindowInsetRight();
                    bottom = Math.max(fallbackBottom, insets.getSystemWindowInsetBottom());
                }
            } catch (Throwable ignored) {}
            applyWebMargins(left, top, right, bottom);
            return insets;
        });

        root.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
            int left = 0, top = fallbackTop, right = 0, bottom = fallbackBottom;
            try {
                if (Build.VERSION.SDK_INT >= 30 && root.getRootWindowInsets() != null) {
                    WindowInsets wi = root.getRootWindowInsets();
                    Insets bars = wi.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    Insets ime = wi.getInsets(WindowInsets.Type.ime());
                    left = bars.left;
                    top = Math.max(fallbackTop, bars.top);
                    right = bars.right;
                    bottom = Math.max(Math.max(fallbackBottom, bars.bottom), ime.bottom);
                }
                Rect visible = new Rect();
                View decor = getWindow().getDecorView();
                decor.getWindowVisibleDisplayFrame(visible);
                int screenHeight = decor.getRootView().getHeight();
                int hiddenBottom = Math.max(0, screenHeight - visible.bottom);
                if (hiddenBottom > dp(120)) bottom = Math.max(bottom, hiddenBottom);
            } catch (Throwable ignored) {}
            applyWebMargins(left, top, right, bottom);
        });
        root.post(root::requestApplyInsets);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pageReady = true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.loadUrl("file:///android_asset/index.html");
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private int systemDimen(String name, int fallback) {
        int id = getResources().getIdentifier(name, "dimen", "android");
        return id > 0 ? getResources().getDimensionPixelSize(id) : fallback;
    }

    private void applyWebMargins(int left, int top, int right, int bottom) {
        if (webView == null) return;
        FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) webView.getLayoutParams();
        if (lp.leftMargin != left || lp.topMargin != top || lp.rightMargin != right || lp.bottomMargin != bottom) {
            lp.setMargins(left, top, right, bottom);
            webView.setLayoutParams(lp);
        }
    }

    @Override public void onBackPressed() {
        if (webView != null) webView.evaluateJavascript("window.appBack && window.appBack()", null);
        else super.onBackPressed();
    }

    @Override protected void onPause() {
        super.onPause();
        appWasBackgrounded = true;
    }

    @Override protected void onResume() {
        super.onResume();
        if (appWasBackgrounded && pageReady && webView != null) {
            webView.postDelayed(() -> webView.evaluateJavascript("window.appShouldLock && window.appShouldLock()", null), 250);
        }
        appWasBackgrounded = false;
    }

    public class AndroidBridge {
        @JavascriptInterface public void shareText(String title, String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, title);
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, title));
            });
        }

        @JavascriptInterface public void saveFile(String filename, String mime, String content) {
            runOnUiThread(() -> launchCreateDocument(filename, mime, content, null));
        }

        @JavascriptInterface public void savePdf(String filename, String title, String content) {
            runOnUiThread(() -> {
                try {
                    byte[] pdf = createSimplePdf(title, content);
                    launchCreateDocument(filename, "application/pdf", null, pdf);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "PDF oluşturulamadı", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface public void openBackupFile() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(intent, OPEN_BACKUP_REQUEST);
            });
        }

        @JavascriptInterface public void pickImage(String contextId) {
            runOnUiThread(() -> {
                pendingPickerContext = contextId;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                intent.setType("image/*");
                startActivityForResult(intent, PICK_IMAGE_REQUEST);
            });
        }

        @JavascriptInterface public void pickDocument(String contextId) {
            runOnUiThread(() -> {
                pendingPickerContext = contextId;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                intent.setType("*/*");
                startActivityForResult(intent, PICK_DOCUMENT_REQUEST);
            });
        }

        @JavascriptInterface public void openUri(String uriText, String mime) {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uriText));
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    if (mime != null && !mime.isEmpty()) intent.setDataAndType(Uri.parse(uriText), mime);
                    startActivity(Intent.createChooser(intent, "Belgeyi aç"));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Belge açılamadı", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface public void dial(String phone) {
            runOnUiThread(() -> {
                try { startActivity(new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phone))); }
                catch (Exception ignored) {}
            });
        }

        @JavascriptInterface public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST));
            }
        }

        @JavascriptInterface public void scheduleMaintenanceReminder(String id, String title, String dueDate) {
            runOnUiThread(() -> scheduleReminder(id, title, dueDate));
        }

        @JavascriptInterface public void cancelMaintenanceReminder(String id) {
            runOnUiThread(() -> cancelReminder(id));
        }

        @JavascriptInterface public void showNotification(String title, String text, String key) {
            runOnUiThread(() -> postInstantNotification(title, text, Math.abs(key.hashCode())));
        }

        @JavascriptInterface public void updateWidget(String title, String subtitle, String detail) {
            runOnUiThread(() -> AracimWidgetProvider.storeAndRefresh(MainActivity.this, title, subtitle, detail));
        }

        @JavascriptInterface public boolean biometricAvailable() {
            return Build.VERSION.SDK_INT >= 28;
        }

        @JavascriptInterface public void authenticateBiometric() {
            runOnUiThread(MainActivity.this::startBiometricAuth);
        }

        @JavascriptInterface public void toast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface public void fetchVehicleModels(String make, int year) {
            new Thread(() -> {
                JSONArray out = new JSONArray();
                String error = "";
                try {
                    String brand = make == null ? "" : make.trim();
                    if (brand.isEmpty() || year < 1996) throw new IllegalArgumentException("Çevrimdışı katalog kullanılıyor");
                    String api = "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/" +
                            URLEncoder.encode(brand, "UTF-8") + "/modelyear/" + year + "?format=json";
                    HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
                    c.setConnectTimeout(7000); c.setReadTimeout(10000);
                    c.setRequestProperty("User-Agent", "AracimPro/4.0 Android");
                    int code = c.getResponseCode();
                    InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
                    BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
                    StringBuilder raw = new StringBuilder(); String line;
                    while ((line = br.readLine()) != null) raw.append(line);
                    br.close(); c.disconnect();
                    JSONObject rootJson = new JSONObject(raw.toString());
                    JSONArray results = rootJson.optJSONArray("Results");
                    java.util.TreeSet<String> names = new java.util.TreeSet<>(String.CASE_INSENSITIVE_ORDER);
                    if (results != null) {
                        for (int i = 0; i < results.length(); i++) {
                            JSONObject item = results.optJSONObject(i); if (item == null) continue;
                            String name = item.optString("Model_Name", "").trim();
                            if (!name.isEmpty()) names.add(name);
                        }
                    }
                    for (String name : names) out.put(name);
                } catch (Exception e) {
                    error = e.getMessage() == null ? "Geniş araç kataloğuna ulaşılamadı" : e.getMessage();
                }
                final String payload = out.toString(), err = error;
                final String brandOut = make == null ? "" : make.trim();
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onVehicleModelsResult && window.onVehicleModelsResult(" +
                                    JSONObject.quote(brandOut) + "," + year + "," +
                                    JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
        }

        @JavascriptInterface public void searchVehicleImages(String query) {
            new Thread(() -> {
                JSONArray out = new JSONArray();
                String error = "";
                try {
                    String q = query == null ? "" : query.trim();
                    if (q.isEmpty()) throw new IllegalArgumentException("Araç bilgisi boş");
                    String api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
                            "&gsrnamespace=6&gsrlimit=10&gsrsearch=" + URLEncoder.encode(q + " automobile car filetype:bitmap", "UTF-8") +
                            "&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1000&format=json&formatversion=2&origin=*";
                    HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
                    c.setConnectTimeout(9000); c.setReadTimeout(12000);
                    c.setRequestProperty("User-Agent", "AracimPro/4.0 Android");
                    int code = c.getResponseCode();
                    InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
                    BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
                    StringBuilder raw = new StringBuilder(); String line;
                    while ((line = br.readLine()) != null) raw.append(line);
                    br.close(); c.disconnect();
                    JSONObject rootJson = new JSONObject(raw.toString());
                    JSONObject queryObj = rootJson.optJSONObject("query");
                    JSONArray pages = queryObj == null ? null : queryObj.optJSONArray("pages");
                    if (pages != null) {
                        for (int i = 0; i < pages.length(); i++) {
                            JSONObject page = pages.optJSONObject(i); if (page == null) continue;
                            JSONArray info = page.optJSONArray("imageinfo"); if (info == null || info.length() == 0) continue;
                            JSONObject ii = info.optJSONObject(0); if (ii == null) continue;
                            String thumb = ii.optString("thumburl", ii.optString("url", ""));
                            if (thumb.isEmpty()) continue;
                            JSONObject meta = ii.optJSONObject("extmetadata");
                            JSONObject item = new JSONObject();
                            item.put("url", thumb);
                            item.put("fullUrl", ii.optString("url", thumb));
                            item.put("page", ii.optString("descriptionurl", ""));
                            item.put("title", page.optString("title", "").replaceFirst("^File:", ""));
                            item.put("artist", metaValue(meta, "Artist"));
                            item.put("credit", metaValue(meta, "Credit"));
                            item.put("license", metaValue(meta, "LicenseShortName"));
                            out.put(item);
                        }
                    }
                } catch (Exception e) { error = e.getMessage() == null ? "Görsel aranamadı" : e.getMessage(); }
                final String payload = out.toString(); final String err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onVehicleImageSearchResult && window.onVehicleImageSearchResult(" + JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
        }

        @JavascriptInterface public void cacheRemoteImage(String contextId, String imageUrl) {
            new Thread(() -> {
                String dataUrl = ""; String error = "";
                try {
                    HttpURLConnection c = (HttpURLConnection) new URL(imageUrl).openConnection();
                    c.setConnectTimeout(9000); c.setReadTimeout(12000);
                    c.setRequestProperty("User-Agent", "AracimPro/4.0 Android");
                    try (InputStream in = c.getInputStream()) {
                        Bitmap src = BitmapFactory.decodeStream(in);
                        if (src == null) throw new IllegalStateException("Görsel okunamadı");
                        int max = 1100;
                        float scale = Math.min(1f, (float) max / Math.max(src.getWidth(), src.getHeight()));
                        Bitmap scaled = src;
                        if (scale < 1f) scaled = Bitmap.createScaledBitmap(src, Math.round(src.getWidth()*scale), Math.round(src.getHeight()*scale), true);
                        ByteArrayOutputStream bout = new ByteArrayOutputStream();
                        scaled.compress(Bitmap.CompressFormat.JPEG, 76, bout);
                        dataUrl = "data:image/jpeg;base64," + Base64.encodeToString(bout.toByteArray(), Base64.NO_WRAP);
                    }
                    c.disconnect();
                } catch (Exception e) { error = e.getMessage() == null ? "Görsel kaydedilemedi" : e.getMessage(); }
                final String data = dataUrl, err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onRemoteVehicleImageCached && window.onRemoteVehicleImageCached(" + JSONObject.quote(contextId) + "," + JSONObject.quote(data) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
        }
    }


    private static String metaValue(JSONObject meta, String key) {
        if (meta == null) return "";
        JSONObject o = meta.optJSONObject(key);
        return o == null ? "" : o.optString("value", "").replaceAll("<[^>]+>", "").trim();
    }

    private void launchCreateDocument(String filename, String mime, String content, byte[] binary) {
        pendingFileName = filename;
        pendingMime = mime;
        pendingContent = content;
        pendingBinary = binary;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        startActivityForResult(intent, CREATE_FILE_REQUEST);
    }

    private byte[] createSimplePdf(String title, String content) throws Exception {
        PdfDocument doc = new PdfDocument();
        Paint titlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        titlePaint.setTextSize(18f);
        titlePaint.setFakeBoldText(true);
        Paint body = new Paint(Paint.ANTI_ALIAS_FLAG);
        body.setTextSize(11f);
        int pageNo = 1;
        int y = 54;
        PdfDocument.Page page = doc.startPage(new PdfDocument.PageInfo.Builder(595, 842, pageNo).create());
        Canvas canvas = page.getCanvas();
        canvas.drawText(title == null ? "Aracım Pro Raporu" : title, 42, y, titlePaint);
        y += 28;
        for (String raw : (content == null ? "" : content).split("\\n")) {
            String line = raw;
            while (line.length() > 88) {
                int cut = line.lastIndexOf(' ', 88);
                if (cut < 20) cut = 88;
                String part = line.substring(0, cut);
                if (y > 800) {
                    doc.finishPage(page);
                    pageNo++;
                    page = doc.startPage(new PdfDocument.PageInfo.Builder(595, 842, pageNo).create());
                    canvas = page.getCanvas(); y = 48;
                }
                canvas.drawText(part, 42, y, body); y += 17;
                line = line.substring(cut).trim();
            }
            if (y > 800) {
                doc.finishPage(page);
                pageNo++;
                page = doc.startPage(new PdfDocument.PageInfo.Builder(595, 842, pageNo).create());
                canvas = page.getCanvas(); y = 48;
            }
            canvas.drawText(line, 42, y, body); y += 17;
        }
        doc.finishPage(page);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        doc.writeTo(out);
        doc.close();
        return out.toByteArray();
    }

    private void scheduleReminder(String id, String title, String dueDate) {
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            parser.setLenient(false);
            Date parsed = parser.parse(dueDate);
            if (parsed == null) return;
            Calendar due = Calendar.getInstance();
            due.setTime(parsed);
            due.set(Calendar.HOUR_OF_DAY, 9); due.set(Calendar.MINUTE, 0); due.set(Calendar.SECOND, 0); due.set(Calendar.MILLISECOND, 0);
            cancelReminder(id);
            int[] days = new int[]{30, 15, 7, 1, 0};
            for (int slot = 0; slot < days.length; slot++) {
                Calendar when = (Calendar) due.clone();
                when.add(Calendar.DAY_OF_MONTH, -days[slot]);
                if (when.getTimeInMillis() <= System.currentTimeMillis()) continue;
                String text = days[slot] == 0
                        ? "Bugün " + title + " zamanı. Aracım Pro kaydını kontrol et."
                        : title + " için " + days[slot] + " gün kaldı. Hedef: " + formatTrDate(dueDate);
                setAlarm(id, slot + 1, when.getTimeInMillis(), title, text);
            }
        } catch (Exception ignored) {}
    }

    private void setAlarm(String id, int slot, long when, String title, String text) {
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am == null) return;
        int requestCode = Math.abs((id + "-" + slot).hashCode());
        Intent intent = new Intent(this, ReminderReceiver.class);
        intent.putExtra("notification_id", requestCode);
        intent.putExtra("title", title);
        intent.putExtra("text", text);
        PendingIntent pi = PendingIntent.getBroadcast(this, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
    }

    private void cancelReminder(String id) {
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am == null) return;
        for (int slot = 1; slot <= 5; slot++) {
            int requestCode = Math.abs((id + "-" + slot).hashCode());
            PendingIntent pi = PendingIntent.getBroadcast(this, requestCode, new Intent(this, ReminderReceiver.class),
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) { am.cancel(pi); pi.cancel(); }
        }
    }

    private void postInstantNotification(String title, String text, int id) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        String channelId = "smart_alerts";
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel c = new NotificationChannel(channelId, "Akıllı araç uyarıları", NotificationManager.IMPORTANCE_DEFAULT);
            nm.createNotificationChannel(c);
        }
        PendingIntent contentIntent = PendingIntent.getActivity(this, 98,
                new Intent(this, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, channelId) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_notification).setContentTitle(title).setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text)).setAutoCancel(true).setContentIntent(contentIntent);
        nm.notify(id, b.build());
    }

    private String formatTrDate(String iso) {
        try {
            Date d = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso);
            return new SimpleDateFormat("dd.MM.yyyy", new Locale("tr", "TR")).format(d);
        } catch (Exception e) { return iso; }
    }

    private void startBiometricAuth() {
        if (Build.VERSION.SDK_INT < 28) {
            webView.evaluateJavascript("window.onBiometricResult && window.onBiometricResult(false,'Desteklenmiyor')", null);
            return;
        }
        try {
            Executor executor = getMainExecutor();
            CancellationSignal signal = new CancellationSignal();
            BiometricPrompt prompt = new BiometricPrompt.Builder(this)
                    .setTitle("Aracım Pro")
                    .setSubtitle("Uygulamanın kilidini aç")
                    .setDescription("Parmak izi veya kayıtlı biyometrik doğrulamanı kullan")
                    .setNegativeButton("PIN kullan", executor, (d, w) ->
                            webView.evaluateJavascript("window.onBiometricResult && window.onBiometricResult(false,'PIN')", null))
                    .build();
            prompt.authenticate(signal, executor, new BiometricPrompt.AuthenticationCallback() {
                @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    super.onAuthenticationSucceeded(result);
                    webView.evaluateJavascript("window.onBiometricResult && window.onBiometricResult(true,'')", null);
                }
                @Override public void onAuthenticationError(int errorCode, CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    webView.evaluateJavascript("window.onBiometricResult && window.onBiometricResult(false," + JSONObject.quote(String.valueOf(errString)) + ")", null);
                }
            });
        } catch (Exception e) {
            webView.evaluateJavascript("window.onBiometricResult && window.onBiometricResult(false,'Biyometri başlatılamadı')", null);
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == CREATE_FILE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                if (out != null) {
                    if (pendingBinary != null) out.write(pendingBinary);
                    else out.write((pendingContent == null ? "" : pendingContent).getBytes(StandardCharsets.UTF_8));
                    out.flush();
                    Toast.makeText(this, "Dosya kaydedildi", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) { Toast.makeText(this, "Dosya kaydedilemedi", Toast.LENGTH_SHORT).show(); }
            pendingFileName = pendingMime = pendingContent = null; pendingBinary = null;
        }

        if (requestCode == OPEN_BACKUP_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            try (InputStream in = getContentResolver().openInputStream(data.getData()); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                if (in == null) throw new IllegalStateException();
                byte[] buffer = new byte[8192]; int n;
                while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
                String content = out.toString(StandardCharsets.UTF_8.name());
                webView.evaluateJavascript("window.restoreBackupFromNative && window.restoreBackupFromNative(" + JSONObject.quote(content) + ")", null);
            } catch (Exception e) { Toast.makeText(this, "Yedek dosyası okunamadı", Toast.LENGTH_SHORT).show(); }
        }

        if (requestCode == PICK_IMAGE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            Uri uri = data.getData();
            try {
                getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (Exception ignored) {}
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                Bitmap src = BitmapFactory.decodeStream(in);
                if (src == null) throw new IllegalStateException();
                int max = 960;
                float scale = Math.min(1f, (float) max / Math.max(src.getWidth(), src.getHeight()));
                Bitmap scaled = src;
                if (scale < 1f) scaled = Bitmap.createScaledBitmap(src, Math.round(src.getWidth()*scale), Math.round(src.getHeight()*scale), true);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                scaled.compress(Bitmap.CompressFormat.JPEG, 72, out);
                String dataUrl = "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
                webView.evaluateJavascript("window.onNativeImagePicked && window.onNativeImagePicked(" + JSONObject.quote(pendingPickerContext) + "," + JSONObject.quote(dataUrl) + ")", null);
            } catch (Exception e) { Toast.makeText(this, "Fotoğraf okunamadı", Toast.LENGTH_SHORT).show(); }
            pendingPickerContext = null;
        }

        if (requestCode == PICK_DOCUMENT_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            Uri uri = data.getData();
            try { getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (Exception ignored) {}
            String name = "Belge"; long size = 0;
            try (Cursor c = getContentResolver().query(uri, null, null, null, null)) {
                if (c != null && c.moveToFirst()) {
                    int ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int si = c.getColumnIndex(OpenableColumns.SIZE);
                    if (ni >= 0) name = c.getString(ni);
                    if (si >= 0 && !c.isNull(si)) size = c.getLong(si);
                }
            } catch (Exception ignored) {}
            String mime = getContentResolver().getType(uri);
            String js = "window.onNativeDocumentPicked && window.onNativeDocumentPicked(" +
                    JSONObject.quote(pendingPickerContext) + "," +
                    JSONObject.quote(uri.toString()) + "," + JSONObject.quote(name) + "," +
                    JSONObject.quote(mime == null ? "application/octet-stream" : mime) + "," + size + ")";
            webView.evaluateJavascript(js, null);
            pendingPickerContext = null;
        }
    }
}
