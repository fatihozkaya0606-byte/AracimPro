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
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.hardware.biometrics.BiometricPrompt;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.os.Handler;
import android.os.SystemClock;
import android.os.CancellationSignal;
import android.provider.OpenableColumns;
import android.provider.Settings;
import android.util.Base64;
import android.view.View;
import android.view.Gravity;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;
import org.json.JSONArray;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.DocumentSnapshot;

import java.io.ByteArrayOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Iterator;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

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
    private static final int LOCATION_PERMISSION_REQUEST = 7706;

    private WebView webView;
    private FrameLayout root;
    private String pendingFileName;
    private String pendingMime;
    private String pendingContent;
    private byte[] pendingBinary;
    private String pendingPickerContext;
    private boolean pageReady = false;
    private boolean appWasBackgrounded = false;
    private LocationManager locationManager;
    private LocationListener speedLocationListener;
    private LocationListener nearbyLocationListener;
    private boolean speedTracking = false;
    private String pendingLocationAction = "";
    private String pendingNearbyQuery = "";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private View launchSplash;
    private long splashStartedAt = 0L;
    private FirebaseApp communityFirebaseApp;
    private FirebaseAuth communityAuth;
    private FirebaseFirestore communityDb;
    private boolean communityConfigured = false;

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
        showLaunchSplash();

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
                hideLaunchSplashWhenReady();
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        initCommunityFirebase();
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void showLaunchSplash() {
        splashStartedAt = SystemClock.elapsedRealtime();
        FrameLayout splash = new FrameLayout(this);
        splash.setBackgroundColor(Color.rgb(8, 35, 66));

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(28), dp(28), dp(28), dp(28));

        TextView title = new TextView(this);
        title.setText("ARACIM PRO");
        title.setTextColor(Color.WHITE);
        title.setTextSize(34f);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);

        TextView slogan = new TextView(this);
        slogan.setText("Aracın için ne ararsan, hepsi burada.");
        slogan.setTextColor(Color.rgb(221, 235, 249));
        slogan.setTextSize(18f);
        slogan.setGravity(Gravity.CENTER);
        slogan.setPadding(0, dp(16), 0, 0);

        TextView features = new TextView(this);
        features.setText("Teknik veri • bakım • piyasa • topluluk");
        features.setTextColor(Color.rgb(154, 190, 224));
        features.setTextSize(13f);
        features.setGravity(Gravity.CENTER);
        features.setPadding(0, dp(10), 0, 0);

        box.addView(title, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        box.addView(slogan, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        box.addView(features, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        FrameLayout.LayoutParams boxLp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        splash.addView(box, boxLp);
        launchSplash = splash;
        root.addView(splash, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
    }

    private void hideLaunchSplashWhenReady() {
        long elapsed = Math.max(0L, SystemClock.elapsedRealtime() - splashStartedAt);
        long delay = Math.max(0L, 4200L - elapsed);
        mainHandler.postDelayed(() -> {
            final View v = launchSplash;
            if (v == null) return;
            v.animate().alpha(0f).setDuration(450L).withEndAction(() -> {
                try { if (root != null) root.removeView(v); } catch (Throwable ignored) {}
                if (launchSplash == v) launchSplash = null;
            }).start();
        }, delay);
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
        if (hasLocationPermission() && isLocationServiceEnabled() && pendingLocationAction != null && !pendingLocationAction.isEmpty()) {
            mainHandler.postDelayed(this::resumePendingLocationAction, 300L);
        }
        appWasBackgrounded = false;
    }

    private void initCommunityFirebase() {
        String apiKey = BuildConfig.FIREBASE_API_KEY == null ? "" : BuildConfig.FIREBASE_API_KEY.trim();
        String projectId = BuildConfig.FIREBASE_PROJECT_ID == null ? "" : BuildConfig.FIREBASE_PROJECT_ID.trim();
        String appId = BuildConfig.FIREBASE_APP_ID == null ? "" : BuildConfig.FIREBASE_APP_ID.trim();
        if (apiKey.isEmpty() || projectId.isEmpty() || appId.isEmpty()) {
            communityConfigured = false;
            return;
        }
        try {
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setApiKey(apiKey)
                    .setProjectId(projectId)
                    .setApplicationId(appId)
                    .build();
            try {
                communityFirebaseApp = FirebaseApp.getInstance("AracimProCommunity");
            } catch (Exception ignored) {
                communityFirebaseApp = FirebaseApp.initializeApp(this, options, "AracimProCommunity");
            }
            if (communityFirebaseApp != null) {
                communityAuth = FirebaseAuth.getInstance(communityFirebaseApp);
                communityDb = FirebaseFirestore.getInstance(communityFirebaseApp);
                communityConfigured = true;
            }
        } catch (Exception ignored) {
            communityConfigured = false;
        }
    }

    private JSONObject communityStatusJson() {
        JSONObject out = new JSONObject();
        try {
            out.put("configured", communityConfigured);
            FirebaseUser u = communityAuth == null ? null : communityAuth.getCurrentUser();
            out.put("signedIn", u != null);
            if (u != null) {
                out.put("uid", u.getUid());
                out.put("email", u.getEmail() == null ? "" : u.getEmail());
                out.put("name", u.getDisplayName() == null ? "" : u.getDisplayName());
                out.put("emailVerified", u.isEmailVerified());
            }
        } catch (Exception ignored) {}
        return out;
    }

    private void sendCommunityJs(String callback, String payload, String error) {
        runOnUiThread(() -> {
            if (webView == null) return;
            String js = "window." + callback + " && window." + callback + "(" +
                    JSONObject.quote(payload == null ? "" : payload) + "," +
                    JSONObject.quote(error == null ? "" : error) + ")";
            webView.evaluateJavascript(js, null);
        });
    }

    private JSONObject commentToJson(DocumentSnapshot d) {
        JSONObject o = new JSONObject();
        try {
            o.put("id", d.getId());
            String[] textKeys = new String[]{"modelKey","make","model","engine","trim","userId","userName","text","pros","cons","issue"};
            for (String k : textKeys) {
                Object v = d.get(k);
                if (v != null) o.put(k, String.valueOf(v));
            }
            String[] numKeys = new String[]{"year","rating","mileage","realConsumption","createdAt","likes"};
            for (String k : numKeys) {
                Object v = d.get(k);
                if (v instanceof Number) o.put(k, ((Number) v).doubleValue());
            }
        } catch (Exception ignored) {}
        return o;
    }

    public class AndroidBridge {
        @JavascriptInterface public String communityStatus() {
            return communityStatusJson().toString();
        }

        @JavascriptInterface public void communitySignUp(String name, String email, String password) {
            if (!communityConfigured || communityAuth == null) {
                sendCommunityJs("onCommunityAuthResult", "", "Kullanıcı sistemi henüz yapılandırılmadı");
                return;
            }
            String n = name == null ? "" : name.trim();
            String e = email == null ? "" : email.trim();
            String p = password == null ? "" : password;
            if (n.length() < 2 || e.isEmpty() || p.length() < 6) {
                sendCommunityJs("onCommunityAuthResult", "", "Ad, e-posta ve en az 6 karakter şifre gerekli");
                return;
            }
            communityAuth.createUserWithEmailAndPassword(e, p).addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    String err = task.getException() == null ? "Kayıt oluşturulamadı" : task.getException().getMessage();
                    sendCommunityJs("onCommunityAuthResult", "", err);
                    return;
                }
                FirebaseUser u = communityAuth.getCurrentUser();
                if (u == null) {
                    sendCommunityJs("onCommunityAuthResult", "", "Kullanıcı oturumu açılamadı");
                    return;
                }
                UserProfileChangeRequest profile = new UserProfileChangeRequest.Builder().setDisplayName(n).build();
                u.updateProfile(profile).addOnCompleteListener(t -> {
                    u.sendEmailVerification();
                    sendCommunityJs("onCommunityAuthResult", communityStatusJson().toString(), "");
                });
            });
        }

        @JavascriptInterface public void communityLogin(String email, String password) {
            if (!communityConfigured || communityAuth == null) {
                sendCommunityJs("onCommunityAuthResult", "", "Kullanıcı sistemi henüz yapılandırılmadı");
                return;
            }
            String e = email == null ? "" : email.trim();
            String p = password == null ? "" : password;
            communityAuth.signInWithEmailAndPassword(e, p).addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    String err = task.getException() == null ? "Giriş yapılamadı" : task.getException().getMessage();
                    sendCommunityJs("onCommunityAuthResult", "", err);
                    return;
                }
                sendCommunityJs("onCommunityAuthResult", communityStatusJson().toString(), "");
            });
        }

        @JavascriptInterface public void communityLogout() {
            if (communityAuth != null) communityAuth.signOut();
            sendCommunityJs("onCommunityAuthResult", communityStatusJson().toString(), "");
        }

        @JavascriptInterface public void communityFetchComments(String modelKey) {
            if (!communityConfigured || communityDb == null) {
                sendCommunityJs("onCommunityCommentsResult", "[]", "Yorum sunucusu henüz yapılandırılmadı");
                return;
            }
            String key = modelKey == null ? "" : modelKey.trim();
            communityDb.collection("vehicle_comments").whereEqualTo("modelKey", key).limit(100).get()
                    .addOnCompleteListener(task -> {
                        if (!task.isSuccessful() || task.getResult() == null) {
                            String err = task.getException() == null ? "Yorumlar alınamadı" : task.getException().getMessage();
                            sendCommunityJs("onCommunityCommentsResult", "[]", err);
                            return;
                        }
                        JSONArray arr = new JSONArray();
                        for (DocumentSnapshot d : task.getResult().getDocuments()) arr.put(commentToJson(d));
                        sendCommunityJs("onCommunityCommentsResult", arr.toString(), "");
                    });
        }

        @JavascriptInterface public void communityAddComment(String commentJson) {
            if (!communityConfigured || communityDb == null || communityAuth == null || communityAuth.getCurrentUser() == null) {
                sendCommunityJs("onCommunityCommentSaved", "", "Yorum yapmak için giriş yapmalısın");
                return;
            }
            try {
                JSONObject j = new JSONObject(commentJson == null ? "{}" : commentJson);
                FirebaseUser u = communityAuth.getCurrentUser();
                Map<String, Object> data = new HashMap<>();
                data.put("modelKey", j.optString("modelKey", ""));
                data.put("make", j.optString("make", ""));
                data.put("model", j.optString("model", ""));
                data.put("year", j.optInt("year", 0));
                data.put("engine", j.optString("engine", ""));
                data.put("trim", j.optString("trim", ""));
                data.put("rating", Math.max(1, Math.min(5, j.optInt("rating", 5))));
                data.put("mileage", Math.max(0, j.optLong("mileage", 0)));
                data.put("realConsumption", Math.max(0, j.optDouble("realConsumption", 0)));
                data.put("text", j.optString("text", "").trim());
                data.put("pros", j.optString("pros", "").trim());
                data.put("cons", j.optString("cons", "").trim());
                data.put("issue", j.optString("issue", "").trim());
                data.put("userId", u.getUid());
                data.put("userName", (u.getDisplayName() == null || u.getDisplayName().trim().isEmpty()) ? "Aracım Pro kullanıcısı" : u.getDisplayName().trim());
                data.put("createdAt", System.currentTimeMillis());
                data.put("createdAtServer", FieldValue.serverTimestamp());
                data.put("likes", 0);
                if (String.valueOf(data.get("text")).length() < 3) {
                    sendCommunityJs("onCommunityCommentSaved", "", "Yorum en az 3 karakter olmalı");
                    return;
                }
                communityDb.collection("vehicle_comments").add(data).addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        String err = task.getException() == null ? "Yorum kaydedilemedi" : task.getException().getMessage();
                        sendCommunityJs("onCommunityCommentSaved", "", err);
                    } else {
                        JSONObject out = new JSONObject();
                        try { out.put("ok", true); } catch (Exception ignored) {}
                        sendCommunityJs("onCommunityCommentSaved", out.toString(), "");
                    }
                });
            } catch (Exception e) {
                sendCommunityJs("onCommunityCommentSaved", "", "Yorum verisi okunamadı");
            }
        }

        @JavascriptInterface public void communityReportComment(String commentId, String reason) {
            if (!communityConfigured || communityDb == null || communityAuth == null || communityAuth.getCurrentUser() == null) {
                sendCommunityJs("onCommunityReportResult", "", "Şikayet için giriş yapmalısın");
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("commentId", commentId == null ? "" : commentId);
            data.put("reason", reason == null ? "Uygunsuz içerik" : reason);
            data.put("userId", communityAuth.getCurrentUser().getUid());
            data.put("createdAt", System.currentTimeMillis());
            data.put("createdAtServer", FieldValue.serverTimestamp());
            communityDb.collection("comment_reports").add(data).addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    String err = task.getException() == null ? "Şikayet gönderilemedi" : task.getException().getMessage();
                    sendCommunityJs("onCommunityReportResult", "", err);
                } else sendCommunityJs("onCommunityReportResult", "{\"ok\":true}", "");
            });
        }

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

        @JavascriptInterface public void requestLocationPermission() {
            runOnUiThread(() -> ensureLocationPermission("permission"));
        }

        @JavascriptInterface public void openLocationSettings() {
            runOnUiThread(MainActivity.this::openLocationSettingsNative);
        }

        @JavascriptInterface public boolean locationServiceEnabled() {
            return isLocationServiceEnabled();
        }

        @JavascriptInterface public String getDefaultMarketApiUrl() {
            return BuildConfig.MARKET_API_URL == null ? "" : BuildConfig.MARKET_API_URL.trim();
        }

        @JavascriptInterface public void startSpeedTracking() {
            runOnUiThread(() -> {
                if (!hasLocationPermission()) { ensureLocationPermission("speed"); return; }
                startSpeedTrackingNative();
            });
        }

        @JavascriptInterface public void stopSpeedTracking() {
            runOnUiThread(MainActivity.this::stopSpeedTrackingNative);
        }

        @JavascriptInterface public void openNearby(String query) {
            runOnUiThread(() -> openNearbyNative(query));
        }

        @JavascriptInterface public void fetchVehicleSpecs(String make, String model, int year, String engine, String fuel, String transmission) {
            new Thread(() -> {
                JSONObject out = new JSONObject();
                String error = "";
                try {
                    out = fetchOtoApiSpecs(make, model, year, engine, fuel, transmission);
                } catch (Exception e) {
                    error = e.getMessage() == null ? "Teknik özellik verisi alınamadı" : e.getMessage();
                }
                final String payload = out.toString(), err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onVehicleSpecsResult && window.onVehicleSpecsResult(" +
                                    JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
        }

        @JavascriptInterface public void decodeVin(String vin) {
            new Thread(() -> {
                JSONObject out = new JSONObject();
                String error = "";
                try {
                    out = fetchVinDetails(vin);
                } catch (Exception e) {
                    error = e.getMessage() == null ? "VIN bilgisi alınamadı" : e.getMessage();
                }
                final String payload = out.toString(), err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onVinDetailsResult && window.onVinDetailsResult(" +
                                    JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
        }

        @JavascriptInterface public void fetchFuelDashboard(String city, String fuelType) {
            new Thread(() -> {
                JSONObject out = new JSONObject();
                String error = "";
                try {
                    out = FuelDataClient.fetchDashboard(city, fuelType);
                } catch (Exception e) {
                    error = e.getMessage() == null ? "Akaryakıt verisi alınamadı" : e.getMessage();
                }
                final String payload = out.toString();
                final String err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onFuelDashboardResult && window.onFuelDashboardResult(" +
                                    JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
        }

        @JavascriptInterface public void configureFuelAlerts(boolean enabled, String city, String fuelType) {
            runOnUiThread(() -> FuelAlertScheduler.configure(MainActivity.this, enabled, city, fuelType));
        }

        @JavascriptInterface public void fetchMarketValue(String endpoint, String vehicleJson) {
            new Thread(() -> {
                JSONObject out = new JSONObject();
                String error = "";
                try {
                    JSONObject vehicle = new JSONObject(vehicleJson == null ? "{}" : vehicleJson);
                    out = FuelDataClient.fetchMarketValue(endpoint, vehicle);
                } catch (Exception e) {
                    error = e.getMessage() == null ? "Canlı değerleme alınamadı" : e.getMessage();
                }
                final String payload = out.toString();
                final String err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onMarketValueResult && window.onMarketValueResult(" +
                                    JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
                });
            }).start();
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
                    c.setRequestProperty("User-Agent", "AracimPro/5.2 Android");
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


        @JavascriptInterface public void searchVehicleImagesExact(String make, String model, int year, String engine) {
            new Thread(() -> {
                JSONArray out = new JSONArray();
                String error = "";
                try {
                    String brand = make == null ? "" : make.trim();
                    String mdl = model == null ? "" : model.trim();
                    if (brand.isEmpty() || mdl.isEmpty()) throw new IllegalArgumentException("Marka/model bilgisi eksik");

                    List<String> aliases = photoAliases(brand, mdl, year);
                    List<JSONObject> ranked = new ArrayList<>();
                    Set<String> seen = new HashSet<>();
                    List<String> queries = new ArrayList<>();
                    for (String alias : aliases) {
                        if (year > 0) queries.add(year + " " + brand + " " + alias);
                        queries.add(brand + " " + alias);
                    }

                    for (String term : queries) {
                        if (ranked.size() >= 36) break;
                        String api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
                                "&gsrnamespace=6&gsrlimit=35&gsrsearch=" + URLEncoder.encode(term, "UTF-8") +
                                "&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1400&format=json&formatversion=2&origin=*";
                        HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
                        c.setConnectTimeout(9000); c.setReadTimeout(12000);
                        c.setRequestProperty("User-Agent", "AracimPro/5.2 Android (exact-vehicle-photo-search)");
                        int code = c.getResponseCode();
                        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
                        BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
                        StringBuilder raw = new StringBuilder(); String line;
                        while ((line = br.readLine()) != null) raw.append(line);
                        br.close(); c.disconnect();

                        JSONObject rootJson = new JSONObject(raw.toString());
                        JSONObject queryObj = rootJson.optJSONObject("query");
                        JSONArray pages = queryObj == null ? null : queryObj.optJSONArray("pages");
                        if (pages == null) continue;
                        for (int i = 0; i < pages.length(); i++) {
                            JSONObject page = pages.optJSONObject(i); if (page == null) continue;
                            JSONArray info = page.optJSONArray("imageinfo"); if (info == null || info.length() == 0) continue;
                            JSONObject ii = info.optJSONObject(0); if (ii == null) continue;
                            String full = ii.optString("url", "");
                            String thumb = ii.optString("thumburl", full);
                            String title = page.optString("title", "").replaceFirst("^File:", "");
                            if (thumb.isEmpty() || full.isEmpty() || seen.contains(full)) continue;
                            String lower = full.toLowerCase(Locale.ROOT);
                            if (!(lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.contains(".jpg?") || lower.contains(".jpeg?") || lower.contains(".png?"))) continue;

                            int confidence = photoConfidence(brand, mdl, year, title);
                            if (confidence < 72) continue; // yanlış model göstermemek, fotoğraf göstermemekten daha kötü
                            seen.add(full);
                            JSONObject meta = ii.optJSONObject("extmetadata");
                            JSONObject item = new JSONObject();
                            item.put("url", thumb);
                            item.put("fullUrl", full);
                            item.put("page", ii.optString("descriptionurl", ""));
                            item.put("title", title);
                            item.put("artist", metaValue(meta, "Artist"));
                            item.put("credit", metaValue(meta, "Credit"));
                            item.put("license", metaValue(meta, "LicenseShortName"));
                            item.put("confidence", confidence);
                            ranked.add(item);
                        }
                    }

                    Collections.sort(ranked, new Comparator<JSONObject>() {
                        @Override public int compare(JSONObject a, JSONObject b) {
                            return Integer.compare(b.optInt("confidence", 0), a.optInt("confidence", 0));
                        }
                    });
                    for (int i = 0; i < ranked.size() && i < 12; i++) out.put(ranked.get(i));
                    if (out.length() == 0) error = "Bu model için doğruluğu yeterli açık lisanslı fotoğraf bulunamadı";
                } catch (Exception e) {
                    error = e.getMessage() == null ? "Görsel aranamadı" : e.getMessage();
                }
                final String payload = out.toString(); final String err = error;
                runOnUiThread(() -> {
                    if (webView != null) webView.evaluateJavascript(
                            "window.onVehicleImageSearchResult && window.onVehicleImageSearchResult(" + JSONObject.quote(payload) + "," + JSONObject.quote(err) + ")", null);
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
                    Set<String> seen = new HashSet<>();
                    java.util.ArrayList<String> queries = new java.util.ArrayList<>();
                    queries.add(q);
                    String noYear = q.replaceFirst("^\\d{4}\\s+", "").trim();
                    if (!noYear.equals(q)) queries.add(noYear);
                    queries.add(noYear + " car");
                    for (String term : queries) {
                        if (out.length() >= 12) break;
                        String api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
                                "&gsrnamespace=6&gsrlimit=20&gsrsearch=" + URLEncoder.encode(term, "UTF-8") +
                                "&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1200&format=json&formatversion=2&origin=*";
                        HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
                        c.setConnectTimeout(9000); c.setReadTimeout(12000);
                        c.setRequestProperty("User-Agent", "AracimPro/5.2 Android (vehicle-photo-search)");
                        int code = c.getResponseCode();
                        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
                        BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
                        StringBuilder raw = new StringBuilder(); String line;
                        while ((line = br.readLine()) != null) raw.append(line);
                        br.close(); c.disconnect();
                        JSONObject rootJson = new JSONObject(raw.toString());
                        JSONObject queryObj = rootJson.optJSONObject("query");
                        JSONArray pages = queryObj == null ? null : queryObj.optJSONArray("pages");
                        if (pages == null) continue;
                        for (int i = 0; i < pages.length() && out.length() < 12; i++) {
                            JSONObject page = pages.optJSONObject(i); if (page == null) continue;
                            JSONArray info = page.optJSONArray("imageinfo"); if (info == null || info.length() == 0) continue;
                            JSONObject ii = info.optJSONObject(0); if (ii == null) continue;
                            String full = ii.optString("url", "");
                            String thumb = ii.optString("thumburl", full);
                            if (thumb.isEmpty() || full.isEmpty() || seen.contains(full)) continue;
                            String lower = full.toLowerCase(Locale.ROOT);
                            if (!(lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.contains(".jpg?") || lower.contains(".jpeg?") || lower.contains(".png?"))) continue;
                            seen.add(full);
                            JSONObject meta = ii.optJSONObject("extmetadata");
                            JSONObject item = new JSONObject();
                            item.put("url", thumb);
                            item.put("fullUrl", full);
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
                    c.setRequestProperty("User-Agent", "AracimPro/5.2 Android");
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



    private static String normalizePhotoText(String s) {
        if (s == null) return "";
        String x = s.toLowerCase(Locale.ROOT)
                .replace('ı','i').replace('ş','s').replace('ğ','g').replace('ü','u').replace('ö','o').replace('ç','c');
        return x.replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static List<String> photoAliases(String make, String model, int year) {
        List<String> a = new ArrayList<>();
        String key = normalizePhotoText(make) + "|" + normalizePhotoText(model);
        if (key.equals("hyundai|elantra")) { a.add("Elantra"); a.add("Avante"); return a; }
        if (key.equals("mercedes benz|e serisi")) {
            a.add("E-Class");
            if (year >= 2009 && year <= 2016) a.add("W212");
            else if (year >= 2017 && year <= 2023) a.add("W213");
            else if (year >= 2024) a.add("W214");
            return a;
        }
        if (key.equals("mercedes benz|c serisi")) { a.add("C-Class"); if(year>=2014&&year<=2021)a.add("W205"); else if(year>=2022)a.add("W206"); return a; }
        if (key.equals("mercedes benz|a serisi")) { a.add("A-Class"); return a; }
        if (key.equals("mercedes benz|s serisi")) { a.add("S-Class"); return a; }
        if (key.equals("bmw|3 serisi")) { a.add("3 Series"); return a; }
        if (key.equals("bmw|5 serisi")) { a.add("5 Series"); return a; }
        if (key.equals("bmw|1 serisi")) { a.add("1 Series"); return a; }
        a.add(model);
        return a;
    }

    private static int photoConfidence(String make, String model, int year, String title) {
        String t = normalizePhotoText(title);
        String brand = normalizePhotoText(make);
        String mdl = normalizePhotoText(model);
        int score = 0;
        String brandCore = brand;
        if (brandCore.contains("mercedes")) brandCore = "mercedes";
        else if (brandCore.contains("volkswagen")) brandCore = "volkswagen";
        if (!brandCore.isEmpty() && t.contains(brandCore)) score += 28;

        List<String> aliases = photoAliases(make, model, year);
        boolean modelHit = false;
        for (String alias : aliases) {
            String na = normalizePhotoText(alias);
            if (!na.isEmpty() && t.contains(na)) { modelHit = true; score += 58; break; }
        }
        if (!modelHit) {
            String[] words = mdl.split(" ");
            for (String w : words) if (w.length() >= 3 && !w.equals("serisi") && t.contains(w)) { modelHit = true; score += 50; break; }
        }
        if (!modelHit) return 0;
        if (year > 0 && t.contains(String.valueOf(year))) score += 12;
        if (t.contains("interior") || t.contains("engine") || t.contains("dashboard") || t.contains("logo")) score -= 20;
        return Math.max(0, Math.min(100, score));
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

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean isLocationServiceEnabled() {
        try {
            if (locationManager == null) locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
            if (locationManager == null) return false;
            if (Build.VERSION.SDK_INT >= 28) return locationManager.isLocationEnabled();
            return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                    locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        } catch (Throwable ignored) { return false; }
    }

    private void notifyLocationStatus(String message) {
        if (webView == null) return;
        final String msg = message == null ? "" : message;
        webView.evaluateJavascript("window.onLocationStatus && window.onLocationStatus(" + JSONObject.quote(msg) + ")", null);
    }

    private void openLocationSettingsNative() {
        try {
            Intent i = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            startActivity(i);
        } catch (Throwable e) {
            try { startActivity(new Intent(Settings.ACTION_SETTINGS)); } catch (Throwable ignored) {}
        }
    }

    private void ensureLocationPermission(String action) {
        pendingLocationAction = action == null ? "" : action;
        if (hasLocationPermission()) {
            resumePendingLocationAction();
            return;
        }
        requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_PERMISSION_REQUEST);
    }

    private void resumePendingLocationAction() {
        String action = pendingLocationAction == null ? "" : pendingLocationAction;
        if (action.isEmpty()) return;
        if (!hasLocationPermission()) return;
        if ("permission".equals(action)) {
            pendingLocationAction = "";
            notifyLocationStatus("Konum izni verildi.");
            return;
        }
        if (!isLocationServiceEnabled()) {
            notifyLocationStatus("Konum hizmeti kapalı. Telefonun Konum/GPS ayarını aç.");
            Toast.makeText(this, "Konum hizmeti kapalı. Konum ayarları açılıyor.", Toast.LENGTH_LONG).show();
            openLocationSettingsNative();
            return;
        }
        pendingLocationAction = "";
        if ("speed".equals(action)) {
            startSpeedTrackingNative();
            return;
        }
        if (action.startsWith("nearby:")) {
            String q = action.substring("nearby:".length());
            requestFreshLocationAndOpenNearby(q);
        }
    }

    @SuppressWarnings("MissingPermission")
    private Location bestLastLocation() {
        if (!hasLocationPermission()) return null;
        try {
            if (locationManager == null) locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
            if (locationManager == null) return null;
            Location gps = null, net = null;
            try { gps = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER); } catch (Throwable ignored) {}
            try { net = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER); } catch (Throwable ignored) {}
            if (gps == null) return net;
            if (net == null) return gps;
            return gps.getTime() >= net.getTime() ? gps : net;
        } catch (Throwable ignored) { return null; }
    }

    @SuppressWarnings("MissingPermission")
    private void startSpeedTrackingNative() {
        if (!hasLocationPermission()) { ensureLocationPermission("speed"); return; }
        if (!isLocationServiceEnabled()) {
            pendingLocationAction = "speed";
            notifyLocationStatus("Konum/GPS kapalı. Açmak için ayarlara yönlendiriliyorsun.");
            openLocationSettingsNative();
            return;
        }
        if (locationManager == null) locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (locationManager == null) return;
        stopSpeedTrackingNative();
        speedLocationListener = new LocationListener() {
            @Override public void onLocationChanged(Location location) { emitSpeed(location); }
            @Override public void onProviderEnabled(String provider) { notifyLocationStatus("GPS aktif, konum alınıyor…"); }
            @Override public void onProviderDisabled(String provider) { notifyLocationStatus("Konum sağlayıcısı kapatıldı."); }
        };
        speedTracking = true;
        notifyLocationStatus("GPS aranıyor… Açık alanda birkaç saniye sürebilir.");
        try { if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 700L, 0.5f, speedLocationListener, Looper.getMainLooper()); } catch (Throwable ignored) {}
        try { if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1200L, 1.0f, speedLocationListener, Looper.getMainLooper()); } catch (Throwable ignored) {}
        Location last = bestLastLocation(); if (last != null) emitSpeed(last);
    }

    private void stopSpeedTrackingNative() {
        speedTracking = false;
        try { if (locationManager != null && speedLocationListener != null) locationManager.removeUpdates(speedLocationListener); } catch (Throwable ignored) {}
        speedLocationListener = null;
    }

    private void emitSpeed(Location loc) {
        if (loc == null || webView == null) return;
        double kmh = loc.hasSpeed() ? Math.max(0d, loc.getSpeed() * 3.6d) : 0d;
        double acc = loc.hasAccuracy() ? loc.getAccuracy() : -1d;
        String js = "window.onSpeedUpdate && window.onSpeedUpdate(" +
                String.format(Locale.US, "%.2f", kmh) + "," +
                String.format(Locale.US, "%.1f", acc) + "," +
                String.format(Locale.US, "%.7f", loc.getLatitude()) + "," +
                String.format(Locale.US, "%.7f", loc.getLongitude()) + ")";
        webView.evaluateJavascript(js, null);
    }

    private void openNearbyNative(String query) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) return;
        if (!hasLocationPermission()) {
            ensureLocationPermission("nearby:" + q);
            return;
        }
        if (!isLocationServiceEnabled()) {
            pendingLocationAction = "nearby:" + q;
            notifyLocationStatus("Yakındaki yerler için telefonun Konum/GPS özelliğini aç.");
            Toast.makeText(this, "Konum kapalı. Konum ayarları açılıyor.", Toast.LENGTH_LONG).show();
            openLocationSettingsNative();
            return;
        }
        requestFreshLocationAndOpenNearby(q);
    }

    @SuppressWarnings("MissingPermission")
    private void requestFreshLocationAndOpenNearby(String query) {
        if (locationManager == null) locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (locationManager == null) { openMapForQuery(query, null); return; }

        Location last = bestLastLocation();
        if (last != null && Math.abs(System.currentTimeMillis() - last.getTime()) <= 180000L) {
            openMapForQuery(query, last);
            return;
        }

        pendingNearbyQuery = query;
        notifyLocationStatus("Güncel konum alınıyor…");
        final boolean[] completed = {false};
        nearbyLocationListener = new LocationListener() {
            @Override public void onLocationChanged(Location location) {
                if (completed[0]) return;
                completed[0] = true;
                try { if (locationManager != null) locationManager.removeUpdates(this); } catch (Throwable ignored) {}
                nearbyLocationListener = null;
                pendingNearbyQuery = "";
                openMapForQuery(query, location);
            }
            @Override public void onProviderEnabled(String provider) {}
            @Override public void onProviderDisabled(String provider) {}
        };

        boolean requested = false;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, nearbyLocationListener, Looper.getMainLooper());
                requested = true;
            }
        } catch (Throwable ignored) {}
        try {
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, nearbyLocationListener, Looper.getMainLooper());
                requested = true;
            }
        } catch (Throwable ignored) {}

        if (!requested) {
            completed[0] = true;
            nearbyLocationListener = null;
            pendingNearbyQuery = "";
            openMapForQuery(query, last);
            return;
        }

        mainHandler.postDelayed(() -> {
            if (completed[0]) return;
            completed[0] = true;
            try { if (locationManager != null && nearbyLocationListener != null) locationManager.removeUpdates(nearbyLocationListener); } catch (Throwable ignored) {}
            nearbyLocationListener = null;
            pendingNearbyQuery = "";
            Location fallback = bestLastLocation();
            openMapForQuery(query, fallback);
        }, 4500L);
    }

    private void openMapForQuery(String query, Location loc) {
        try {
            Uri uri;
            if (loc != null) {
                uri = Uri.parse("geo:" + loc.getLatitude() + "," + loc.getLongitude() + "?q=" + Uri.encode(query));
                notifyLocationStatus("Konum alındı. Harita açılıyor…");
            } else {
                uri = Uri.parse("https://www.google.com/maps/search/?api=1&query=" + Uri.encode(query));
                notifyLocationStatus("Kesin konum alınamadı; harita araması açılıyor.");
            }
            Intent i = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(i);
        } catch (Throwable e) {
            Toast.makeText(this, "Harita açılamadı", Toast.LENGTH_SHORT).show();
        }
    }

    private static String normalizeApiText(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT).replace('ı','i').replace('ş','s').replace('ğ','g').replace('ü','u').replace('ö','o').replace('ç','c')
                .replaceAll("[^a-z0-9]+", " ").trim();
    }

    private static double num(JSONObject o, String key) {
        try { String s = o.optString(key, "").trim(); return s.isEmpty() ? 0d : Double.parseDouble(s); } catch (Exception e) { return 0d; }
    }

    private static String compactApiText(String s) { return normalizeApiText(s).replace(" ", ""); }

    private static java.util.List<String> modelCandidates(String make, String model) {
        java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
        String m = model == null ? "" : model.trim();
        if (!m.isEmpty()) set.add(m);
        if ("Mercedes-Benz".equalsIgnoreCase(make)) {
            if (m.endsWith(" Serisi")) { String l=m.substring(0,m.length()-7).trim(); set.add(l+"-Class"); set.add(l+" Class"); }
        }
        if ("BMW".equalsIgnoreCase(make) && m.endsWith(" Serisi")) {
            String n=m.substring(0,m.length()-7).trim(); set.add(n+"-Series"); set.add(n+" Series");
        }
        if ("Hyundai".equalsIgnoreCase(make) && (m.equalsIgnoreCase("Accent Era")||m.equalsIgnoreCase("Accent Blue"))) set.add("Accent");
        if ("Citroen".equalsIgnoreCase(make)) set.add(m.replace("C-", "C"));
        if (m.toLowerCase(Locale.ROOT).contains("pro max")) set.add(m.replaceAll("(?i)\\s*Pro Max", ""));
        if (m.toLowerCase(Locale.ROOT).contains("pro")) set.add(m.replaceAll("(?i)\\s*Pro", ""));
        return new java.util.ArrayList<>(set);
    }

    private static java.util.List<String> makeCandidates(String make) {
        java.util.LinkedHashSet<String> set=new java.util.LinkedHashSet<>();
        String m=make==null?"":make.trim(); if(!m.isEmpty()) set.add(m);
        if (m.equalsIgnoreCase("SsangYong/KGM")) { set.add("SsangYong"); set.add("KGM"); }
        if (m.equalsIgnoreCase("Mercedes-Benz")) { set.add("Mercedes-Benz"); set.add("Mercedes"); }
        if (m.equalsIgnoreCase("DS")) set.add("Citroen");
        return new java.util.ArrayList<>(set);
    }

    private static final String OTOAPI_BASE = "https://otoapi.net/api/v1";

    private JSONObject otoGet(String path) throws Exception {
        String key = BuildConfig.OTOAPI_KEY == null ? "" : BuildConfig.OTOAPI_KEY.trim();
        if (key.isEmpty()) throw new IllegalStateException("OtoAPI anahtarı tanımlı değil. GitHub Secret: OTOAPI_KEY");
        HttpURLConnection c = (HttpURLConnection) new URL(OTOAPI_BASE + path).openConnection();
        c.setConnectTimeout(10000); c.setReadTimeout(15000);
        c.setRequestProperty("User-Agent", "AracimPro/5.5 Android OtoAPI");
        c.setRequestProperty("Accept", "application/json"); c.setRequestProperty("X-API-Key", key);
        int code=c.getResponseCode(); InputStream stream=code>=200&&code<300?c.getInputStream():c.getErrorStream();
        BufferedReader br=new BufferedReader(new InputStreamReader(stream,StandardCharsets.UTF_8)); StringBuilder raw=new StringBuilder(); String line;
        while((line=br.readLine())!=null)raw.append(line); br.close(); c.disconnect();
        JSONObject root=raw.length()==0?new JSONObject():new JSONObject(raw.toString());
        if(code==429)throw new IllegalStateException(root.optString("error","OtoAPI limiti doldu"));
        if(code<200||code>=300||!root.optBoolean("ok",false))throw new IllegalStateException(root.optString("error","OtoAPI isteği başarısız (HTTP "+code+")"));
        return root;
    }

    private static JSONObject bestNamed(JSONArray arr,String wanted){
        if(arr==null||arr.length()==0)return null; String need=compactApiText(wanted); JSONObject best=null; int bestScore=Integer.MIN_VALUE;
        for(int i=0;i<arr.length();i++){JSONObject o=arr.optJSONObject(i);if(o==null)continue;String name=o.optString("name","");String n=compactApiText(name);int score=0;
            if(n.equals(need))score+=200;else if(!need.isEmpty()&&(n.contains(need)||need.contains(n)))score+=100;
            for(String tok:normalizeApiText(wanted).split(" "))if(tok.length()>1&&normalizeApiText(name).contains(tok))score+=5;
            if(score>bestScore){bestScore=score;best=o;}}
        return best;
    }

    private JSONObject findOtoBrand(String make)throws Exception{
        Exception last=null; for(String q:makeCandidates(make)){try{JSONObject r=otoGet("/brands?q="+URLEncoder.encode(q,"UTF-8")+"&offset=0");JSONObject b=bestNamed(r.optJSONArray("data"),q);if(b!=null)return b;}catch(Exception e){last=e;}Thread.sleep(220);} if(last!=null)throw last; throw new IllegalStateException("Marka bulunamadı: "+make);
    }
    private JSONObject findOtoModel(int brandId,String make,String model)throws Exception{
        Exception last=null; for(String q:modelCandidates(make,model)){try{JSONObject r=otoGet("/models?brand_id="+brandId+"&q="+URLEncoder.encode(q,"UTF-8")+"&offset=0");JSONObject m=bestNamed(r.optJSONArray("data"),q);if(m!=null)return m;}catch(Exception e){last=e;}Thread.sleep(220);} if(last!=null)throw last; throw new IllegalStateException("Model bulunamadı: "+model);
    }

    private static double[] numbersIn(String raw){java.util.ArrayList<Double> vals=new java.util.ArrayList<>();if(raw==null)return new double[0];java.util.regex.Matcher m=java.util.regex.Pattern.compile("(?<![A-Za-z0-9])(-?\\d+(?:[\\.,]\\d+)?)").matcher(raw);while(m.find()&&vals.size()<6){try{vals.add(Double.parseDouble(m.group(1).replace(',','.')));}catch(Exception ignored){}}double[] out=new double[vals.size()];for(int i=0;i<vals.size();i++)out[i]=vals.get(i);return out;}
    private static double firstNumber(String raw){double[] a=numbersIn(raw);return a.length==0?0:a[0];}
    private static double rangeAverage(String raw){double[] a=numbersIn(raw);if(a.length==0)return 0;if(a.length>1&&raw!=null&&raw.matches(".*\\d[\\.,]?\\d*\\s*[-–]\\s*\\d.*"))return(a[0]+a[1])/2d;return a[0];}
    private static String normKey(String s){return normalizeApiText(s).replace("ı","i").replace("ş","s").replace("ğ","g").replace("ü","u").replace("ö","o").replace("ç","c");}
    private static void flattenSpecs(JSONObject o,java.util.LinkedHashMap<String,String> out){if(o==null)return;Iterator<String>it=o.keys();while(it.hasNext()){String k=it.next();Object v=o.opt(k);if(v instanceof JSONObject)flattenSpecs((JSONObject)v,out);else if(v!=null&&v!=JSONObject.NULL)out.put(k,String.valueOf(v));}}
    private static String specValue(java.util.LinkedHashMap<String,String> flat,String... needles){for(java.util.Map.Entry<String,String>e:flat.entrySet()){String k=normKey(e.getKey());for(String n:needles)if(k.equals(normKey(n)))return e.getValue();}for(java.util.Map.Entry<String,String>e:flat.entrySet()){String k=normKey(e.getKey());for(String n:needles)if(k.contains(normKey(n)))return e.getValue();}return"";}
    private static void putNum(JSONObject out,String key,double v)throws Exception{if(v>0)out.put(key,Math.round(v*100d)/100d);}
    private static int variantScore(JSONObject c,String engine,String fuel,String transmission){String name=normalizeApiText(c.optString("name","")),compact=compactApiText(c.optString("name",""));int score=0;String e=normalizeApiText(engine),ec=compactApiText(engine);if(!e.isEmpty()&&(name.contains(e)||(!ec.isEmpty()&&compact.contains(ec))))score+=180;String f=normKey(fuel),cf=normKey(c.optString("fuel_type",""));if(!f.isEmpty()&&!cf.isEmpty()&&(cf.contains(f)||f.contains(cf)))score+=30;String tr=normKey(transmission),cn=normKey(c.optString("name",""));if((tr.contains("otomatik")||tr.contains("dct")||tr.contains("cvt"))&&(cn.contains("tronic")||cn.contains("otomatik")||cn.contains("dct")||cn.contains("cvt")||cn.contains("tiptronic")))score+=20;return score;}

    private JSONObject fetchOtoApiSpecs(String make,String model,int year,String engine,String fuel,String transmission)throws Exception{
        if(make==null||make.trim().isEmpty()||model==null||model.trim().isEmpty()||year<1941)throw new IllegalArgumentException("Araç bilgisi eksik");
        JSONObject brand=findOtoBrand(make.trim());int brandId=brand.optInt("id");Thread.sleep(220);JSONObject mod=findOtoModel(brandId,make,model);int modelId=mod.optInt("id");Thread.sleep(220);
        JSONObject best=null;int bestScore=Integer.MIN_VALUE,offset=0,pages=0;do{JSONObject r=otoGet("/cars?brand_id="+brandId+"&model_id="+modelId+"&year="+year+"&offset="+offset);JSONArray a=r.optJSONArray("data");if(a!=null)for(int i=0;i<a.length();i++){JSONObject c=a.optJSONObject(i);if(c==null)continue;int sc=variantScore(c,engine,fuel,transmission);if(sc>bestScore){bestScore=sc;best=c;}}JSONObject pg=r.optJSONObject("pagination");boolean more=pg!=null&&pg.optBoolean("has_more",false);int lim=pg==null?5:Math.max(1,pg.optInt("limit",5));offset+=lim;pages++;if(!more||pages>=8||bestScore>=210)break;Thread.sleep(230);}while(true);
        if(best==null)throw new IllegalStateException("Bu model/yıl için OtoAPI varyantı bulunamadı");int carId=best.optInt("id");Thread.sleep(230);JSONObject dr=otoGet("/cars/"+carId),d=dr.optJSONObject("data");if(d==null)throw new IllegalStateException("OtoAPI teknik detay boş");
        java.util.LinkedHashMap<String,String> flat=new java.util.LinkedHashMap<>();flattenSpecs(d.optJSONObject("specs"),flat);JSONObject out=new JSONObject();out.put("source","OtoAPI");out.put("confidence",Math.max(60,Math.min(99,bestScore/2+60)));out.put("matchedTrim",d.optString("name",best.optString("name","")));out.put("otoCarId",carId);
        double hp=firstNumber(specValue(flat,"Güç"));if(hp<=0)hp=d.optDouble("power_hp",best.optDouble("power_hp",0));putNum(out,"powerHp",hp);putNum(out,"torqueNm",firstNumber(specValue(flat,"Tork")));putNum(out,"engineCc",firstNumber(specValue(flat,"Motor hacmi")));putNum(out,"zeroTo100",firstNumber(specValue(flat,"Hızlanma 0 - 100 km/saat","Hızlanma 0-100 km/saat")));putNum(out,"topSpeedKph",firstNumber(specValue(flat,"Maksimum sürat","Maksimum hız")));
        putNum(out,"avgConsumptionL",rangeAverage(specValue(flat,"Ortalama yakıt tüketimi","Yakıt tüketimi, ORTALAMA (WLTP)","Ortalama yakıt tüketimi (NEDC)")));putNum(out,"cityConsumptionL",rangeAverage(specValue(flat,"Şehir içi yakıt tüketimi")));putNum(out,"hwyConsumptionL",rangeAverage(specValue(flat,"Şehir dışı yakıt tüketimi")));putNum(out,"weightKg",firstNumber(specValue(flat,"Ağırlık")));putNum(out,"trunkL",firstNumber(specValue(flat,"Bagaj hacmi en az","Bagaj hacmi")));putNum(out,"fuelTankL",firstNumber(specValue(flat,"Yakıt deposu hacmi","Yakıt deposu")));
        putNum(out,"lengthMm",firstNumber(specValue(flat,"Uzunluk")));putNum(out,"widthMm",firstNumber(specValue(flat,"Genişlik")));putNum(out,"heightMm",firstNumber(specValue(flat,"Yükseklik")));putNum(out,"wheelbaseMm",firstNumber(specValue(flat,"Dingil Mesafesi","Aks mesafesi")));putNum(out,"doors",firstNumber(specValue(flat,"Kapı sayısı")));putNum(out,"seats",firstNumber(specValue(flat,"Koltuk Sayısı","Koltuk sayısı")));putNum(out,"oilCapacityL",firstNumber(specValue(flat,"Motor yağı kapasitesi")));putNum(out,"coolantCapacityL",firstNumber(specValue(flat,"soğutma sıvısı","Soğutma sıvısı")));putNum(out,"adblueTankL",firstNumber(specValue(flat,"AdBlue tankı")));
        String body=d.optString("body_type",best.optString("body_type",""));if(body.isEmpty())body=specValue(flat,"Gövde tipi");if(!body.isEmpty())out.put("body",body);String drive=d.optString("drive_type",best.optString("drive_type",""));if(!drive.isEmpty())out.put("drive",drive);String ft=d.optString("fuel_type",best.optString("fuel_type",""));if(ft.isEmpty())ft=specValue(flat,"Yakıt Tipi");if(!ft.isEmpty())out.put("engineFuel",ft);
        String trans=specValue(flat,"Vites sayısı ve şanzıman tipi","Vites sayısı ve şanzıman türü","Şanzıman tipi");if(!trans.isEmpty())out.put("apiTransmission",trans);String ec=specValue(flat,"Motor Modeli/Kodu");if(!ec.isEmpty())out.put("engineCode",ec);String inj=specValue(flat,"Yakıt enjeksiyon sistemi");if(!inj.isEmpty())out.put("injectionSystem",inj);String asp=specValue(flat,"Motor aspirasyonu");if(!asp.isEmpty())out.put("aspiration",asp);String tire=specValue(flat,"Lastik boyutu","Ön lastikler");if(!tire.isEmpty())out.put("tireSizes",tire);String wheel=specValue(flat,"Jant boyutu","Jantlar");if(!wheel.isEmpty())out.put("wheelSizes",wheel);
        putNum(out,"batteryKwh",firstNumber(specValue(flat,"Brüt batarya kapasitesi","Net (kullanılabilir) batarya kapasitesi","Batarya kapasitesi")));putNum(out,"rangeKm",firstNumber(specValue(flat,"Tam elektrikli menzil","Elektrikli menzil","Menzil (WLTP)")));putNum(out,"avgConsumptionKwh",rangeAverage(specValue(flat,"Ortalama enerji tüketimi","Enerji tüketimi, ORTALAMA (WLTP)")));out.put("specUpdatedAt",new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date()));return out;
    }

    private JSONObject fetchVinDetails(String vin) throws Exception {
        String v = vin == null ? "" : vin.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (v.length() != 17) throw new IllegalArgumentException("VIN 17 karakter olmalı");
        String api = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/" + URLEncoder.encode(v, "UTF-8") + "?format=json";
        HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
        c.setConnectTimeout(9000); c.setReadTimeout(12000); c.setRequestProperty("User-Agent", "AracimPro/5.5 Android VIN");
        BufferedReader br = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8));
        StringBuilder raw = new StringBuilder(); String line; while((line=br.readLine())!=null) raw.append(line); br.close(); c.disconnect();
        JSONObject root = new JSONObject(raw.toString()); JSONArray arr = root.optJSONArray("Results");
        if (arr == null || arr.length()==0) throw new IllegalStateException("VIN çözümlenemedi");
        JSONObject r = arr.optJSONObject(0), out = new JSONObject();
        out.put("source", "NHTSA vPIC VIN");
        String[][] fields={{"PlantCountry","productionCountry"},{"PlantCity","productionCity"},{"Manufacturer","manufacturer"},{"Model","vinModel"},{"ModelYear","vinYear"},{"BodyClass","vinBody"},{"FuelTypePrimary","vinFuel"},{"TransmissionStyle","vinTransmission"},{"DriveType","vinDrive"}};
        for (String[] f:fields) { String val=r.optString(f[0],"").trim(); if(!val.isEmpty()) out.put(f[1],val); }
        String hp=r.optString("EngineHP","").trim(); if(!hp.isEmpty()) out.put("powerHp",Double.parseDouble(hp));
        String cc=r.optString("DisplacementCC","").trim(); if(!cc.isEmpty()) out.put("engineCc",Double.parseDouble(cc));
        return out;
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

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            boolean ok = hasLocationPermission();
            if (webView != null) webView.evaluateJavascript("window.onLocationPermissionResult && window.onLocationPermissionResult(" + (ok ? "true" : "false") + ")", null);
            if (ok) resumePendingLocationAction();
            else pendingLocationAction = "";
        }
    }

    @Override protected void onDestroy() {
        stopSpeedTrackingNative();
        try { if (locationManager != null && nearbyLocationListener != null) locationManager.removeUpdates(nearbyLocationListener); } catch (Throwable ignored) {}
        nearbyLocationListener = null;
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
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
