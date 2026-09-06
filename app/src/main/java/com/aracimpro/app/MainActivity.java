package com.aracimpro.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int CREATE_FILE_REQUEST = 7701;
    private static final int OPEN_BACKUP_REQUEST = 7702;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 7703;

    private WebView webView;
    private FrameLayout root;
    private String pendingFileName;
    private String pendingMime;
    private String pendingContent;
    private int safeTop = 0;
    private int safeBottom = 0;
    private boolean pageReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // V4: HyperOS/Android 16 keyboard + edge-to-edge fix.
        // adjustResize is kept on, and native margins are also updated from IME insets
        // with a global-layout fallback for devices where WebView does not resize itself.
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            getWindow().getInsetsController().setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        }

        root = new FrameLayout(this);
        root.setBackgroundColor(0xFFF4F8FF);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFFF4F8FF);
        FrameLayout.LayoutParams webLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        root.addView(webView, webLp);
        setContentView(root);

        // Give the WebView safe margins immediately. This fallback is important on
        // some HyperOS builds where the first WindowInsets callback is late or missing.
        final int fallbackTop = systemDimen("status_bar_height", dp(28));
        final int fallbackBottom = systemDimen("navigation_bar_height", dp(44));
        applyWebMargins(0, fallbackTop, 0, fallbackBottom);

        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left = 0, top = fallbackTop, right = 0, bottom = fallbackBottom;
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
            applyWebMargins(left, top, right, bottom);
            return insets;
        });

        // HyperOS fallback: force a relayout whenever the visible window changes.
        // This catches the numeric keyboard even when IME insets are not re-dispatched.
        root.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
            int left = 0, top = fallbackTop, right = 0, bottom = fallbackBottom;
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
            root.getWindowVisibleDisplayFrame(visible);
            int screenHeight = root.getRootView().getHeight();
            int hiddenBottom = Math.max(0, screenHeight - visible.bottom);
            // A large hidden area means a keyboard is open.
            if (hiddenBottom > dp(120)) bottom = Math.max(bottom, hiddenBottom);
            applyWebMargins(left, top, right, bottom);
        });
        root.requestApplyInsets();

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pageReady = true;
                sendInsetsToWeb();
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.loadUrl("file:///android_asset/index.html");
    }


    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

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
        safeTop = 0;
        safeBottom = 0;
        sendInsetsToWeb();
    }

    private void sendInsetsToWeb() {
        if (!pageReady || webView == null) return;
        webView.post(() -> webView.evaluateJavascript(
                "window.setNativeInsets && window.setNativeInsets(" + safeTop + "," + safeBottom + ")", null));
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else if (webView != null) webView.evaluateJavascript("window.appBack && window.appBack()", null);
        else super.onBackPressed();
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void shareText(String title, String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_SUBJECT, title);
                i.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(i, title));
            });
        }

        @JavascriptInterface
        public void saveFile(String filename, String mime, String content) {
            runOnUiThread(() -> {
                pendingFileName = filename;
                pendingMime = mime;
                pendingContent = content;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(mime == null || mime.isEmpty() ? "text/plain" : mime);
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                startActivityForResult(intent, CREATE_FILE_REQUEST);
            });
        }

        @JavascriptInterface
        public void openBackupFile() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(intent, OPEN_BACKUP_REQUEST);
            });
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST));
            }
        }

        @JavascriptInterface
        public void scheduleMaintenanceReminder(String id, String title, String dueDate) {
            runOnUiThread(() -> scheduleReminder(id, title, dueDate));
        }

        @JavascriptInterface
        public void cancelMaintenanceReminder(String id) {
            runOnUiThread(() -> cancelReminder(id));
        }

        @JavascriptInterface
        public void toast(String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show());
        }
    }

    private void scheduleReminder(String id, String title, String dueDate) {
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            parser.setLenient(false);
            Date parsed = parser.parse(dueDate);
            if (parsed == null) return;

            Calendar due = Calendar.getInstance();
            due.setTime(parsed);
            due.set(Calendar.HOUR_OF_DAY, 9);
            due.set(Calendar.MINUTE, 0);
            due.set(Calendar.SECOND, 0);
            due.set(Calendar.MILLISECOND, 0);

            cancelReminder(id);
            Calendar early = (Calendar) due.clone();
            early.add(Calendar.DAY_OF_MONTH, -30);

            long now = System.currentTimeMillis();
            if (early.getTimeInMillis() > now) {
                setAlarm(id, 1, early.getTimeInMillis(), title,
                        title + " için 30 gün kaldı. Hedef tarih: " + formatTrDate(dueDate));
            }
            if (due.getTimeInMillis() > now) {
                setAlarm(id, 2, due.getTimeInMillis(), title,
                        "Bugün " + title + " zamanı. Aracım Pro'daki kaydını kontrol et.");
            }
        } catch (Exception ignored) {
        }
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
        for (int slot = 1; slot <= 2; slot++) {
            int requestCode = Math.abs((id + "-" + slot).hashCode());
            Intent intent = new Intent(this, ReminderReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(this, requestCode, intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }
    }

    private String formatTrDate(String iso) {
        try {
            Date d = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(iso);
            return new SimpleDateFormat("dd.MM.yyyy", new Locale("tr", "TR")).format(d);
        } catch (Exception e) {
            return iso;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == CREATE_FILE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            Uri uri = data.getData();
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                if (out != null) {
                    out.write(pendingContent.getBytes(StandardCharsets.UTF_8));
                    out.flush();
                    Toast.makeText(this, "Dosya kaydedildi", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Dosya kaydedilemedi", Toast.LENGTH_SHORT).show();
            }
            pendingFileName = pendingMime = pendingContent = null;
        }

        if (requestCode == OPEN_BACKUP_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            try (InputStream in = getContentResolver().openInputStream(data.getData());
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                if (in == null) throw new IllegalStateException();
                byte[] buffer = new byte[8192];
                int n;
                while ((n = in.read(buffer)) != -1) out.write(buffer, 0, n);
                String content = out.toString(StandardCharsets.UTF_8.name());
                String js = "window.restoreBackupFromNative && window.restoreBackupFromNative(" + JSONObject.quote(content) + ")";
                webView.evaluateJavascript(js, null);
            } catch (Exception e) {
                Toast.makeText(this, "Yedek dosyası okunamadı", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
