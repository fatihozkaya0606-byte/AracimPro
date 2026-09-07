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
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.hardware.biometrics.BiometricPrompt;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
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
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import java.util.Collections;
import java.util.Comparator;

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
    private boolean speedTracking = false;
    private String pendingLocationAction = "";

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

        @JavascriptInterface public void requestLocationPermission() {
            runOnUiThread(() -> ensureLocationPermission("permission"));
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
                    out = fetchCarQuerySpecs(make, model, year, engine, fuel, transmission);
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

    private void ensureLocationPermission(String action) {
        pendingLocationAction = action == null ? "" : action;
        if (hasLocationPermission()) {
            if ("speed".equals(pendingLocationAction)) startSpeedTrackingNative();
            return;
        }
        requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_PERMISSION_REQUEST);
    }

    @SuppressWarnings("MissingPermission")
    private Location bestLastLocation() {
        if (!hasLocationPermission()) return null;
        try {
            if (locationManager == null) locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
            if (locationManager == null) return null;
            Location gps = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            Location net = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            if (gps == null) return net;
            if (net == null) return gps;
            return gps.getTime() >= net.getTime() ? gps : net;
        } catch (Throwable ignored) { return null; }
    }

    @SuppressWarnings("MissingPermission")
    private void startSpeedTrackingNative() {
        if (!hasLocationPermission()) { ensureLocationPermission("speed"); return; }
        if (locationManager == null) locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        if (locationManager == null) return;
        stopSpeedTrackingNative();
        speedLocationListener = new LocationListener() {
            @Override public void onLocationChanged(Location location) { emitSpeed(location); }
            @Override public void onProviderEnabled(String provider) {}
            @Override public void onProviderDisabled(String provider) {}
        };
        speedTracking = true;
        try { locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 700L, 0.5f, speedLocationListener, Looper.getMainLooper()); } catch (Throwable ignored) {}
        try { locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 1200L, 1.0f, speedLocationListener, Looper.getMainLooper()); } catch (Throwable ignored) {}
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
        try {
            Location loc = bestLastLocation();
            String base = loc == null ? "geo:0,0?q=" : "geo:" + loc.getLatitude() + "," + loc.getLongitude() + "?q=";
            Uri uri = Uri.parse(base + Uri.encode(q));
            Intent i = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(Intent.createChooser(i, "Haritada aç"));
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

    private JSONObject fetchCarQuerySpecs(String make, String model, int year, String engine, String fuel, String transmission) throws Exception {
        String mk = make == null ? "" : make.trim(), mdl = model == null ? "" : model.trim();
        if (mk.isEmpty() || mdl.isEmpty() || year < 1941) throw new IllegalArgumentException("Araç bilgisi eksik");
        JSONArray trims = null; String usedMake=mk, usedModel=mdl; Exception lastErr=null;
        for (String mkTry: makeCandidates(mk)) {
            for (String modelTry: modelCandidates(mk, mdl)) {
                try {
                    String apiMake = mkTry.toLowerCase(Locale.ROOT).replace(" ", "-");
                    String url = "https://www.carqueryapi.com/api/0.3/?cmd=getTrims&full_results=1&year=" + year +
                            "&make=" + URLEncoder.encode(apiMake, "UTF-8") + "&model=" + URLEncoder.encode(modelTry, "UTF-8");
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(9000); c.setReadTimeout(12000); c.setRequestProperty("User-Agent", "AracimPro/5.3 Android vehicle-specs");
                    int code=c.getResponseCode(); InputStream stream=code>=200&&code<300?c.getInputStream():c.getErrorStream();
                    BufferedReader br=new BufferedReader(new InputStreamReader(stream,StandardCharsets.UTF_8)); StringBuilder raw=new StringBuilder(); String line;
                    while((line=br.readLine())!=null) raw.append(line); br.close(); c.disconnect();
                    String txt=raw.toString().trim(); if(txt.startsWith("?(")&&txt.endsWith(");")) txt=txt.substring(2,txt.length()-2); else if(txt.startsWith("(")&&txt.endsWith(")")) txt=txt.substring(1,txt.length()-1);
                    JSONObject rootJson=new JSONObject(txt); JSONArray a=rootJson.optJSONArray("Trims");
                    if(a!=null&&a.length()>0){trims=a;usedMake=mkTry;usedModel=modelTry;break;}
                } catch(Exception ex){ lastErr=ex; }
            }
            if(trims!=null&&trims.length()>0) break;
        }
        if (trims == null || trims.length() == 0) throw new IllegalStateException("Bu model/yıl için açık teknik katalog kaydı bulunamadı");
        String engNeed=normalizeApiText(engine), engCompact=compactApiText(engine), fuelNeed=normalizeApiText(fuel), transNeed=normalizeApiText(transmission);
        JSONObject best=null; int bestScore=Integer.MIN_VALUE; String wantedLiters="";
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("(\\d(?:[\\.,]\\d)?)").matcher(engine==null?"":engine); if(m.find()) wantedLiters=m.group(1).replace(',','.');
        for(int i=0;i<trims.length();i++){
            JSONObject t=trims.optJSONObject(i); if(t==null)continue; int score=0;
            String rawBlob=t.optString("model_trim","")+" "+t.optString("model_engine_fuel","")+" "+t.optString("model_transmission_type","")+" "+t.optString("model_name","");
            String blob=normalizeApiText(rawBlob), compact=compactApiText(rawBlob);
            if(!engNeed.isEmpty()&&(blob.contains(engNeed)||(!engCompact.isEmpty()&&compact.contains(engCompact)))) score+=80;
            if(!wantedLiters.isEmpty()){double l=num(t,"model_engine_l");try{if(Math.abs(l-Double.parseDouble(wantedLiters))<0.12)score+=35;}catch(Exception ignored){}}
            if(fuelNeed.contains("dizel")&&normalizeApiText(t.optString("model_engine_fuel","")).contains("diesel"))score+=20;
            if(fuelNeed.contains("benzin")&&normalizeApiText(t.optString("model_engine_fuel","")).contains("gasoline"))score+=20;
            if((transNeed.contains("otomatik")||transNeed.contains("dct")||transNeed.contains("cvt"))&&normalizeApiText(t.optString("model_transmission_type","")).contains("automatic"))score+=15;
            if(transNeed.contains("manuel")&&normalizeApiText(t.optString("model_transmission_type","")).contains("manual"))score+=15;
            if(score>bestScore){bestScore=score;best=t;}
        }
        if(best==null)best=trims.optJSONObject(0); JSONObject out=new JSONObject();
        out.put("source","CarQuery ("+usedMake+" / "+usedModel+")"); out.put("confidence",Math.max(20,Math.min(95,bestScore+25))); out.put("matchedTrim",best.optString("model_trim",""));
        copyNum(best,out,"model_engine_cc","engineCc"); copyNum(best,out,"model_engine_power_hp","powerHp"); copyNum(best,out,"model_engine_torque_nm","torqueNm");
        copyNum(best,out,"model_0_to_100_kph","zeroTo100"); copyNum(best,out,"model_top_speed_kph","topSpeedKph"); copyNum(best,out,"model_weight_kg","weightKg");
        copyNum(best,out,"model_length_mm","lengthMm"); copyNum(best,out,"model_width_mm","widthMm"); copyNum(best,out,"model_height_mm","heightMm"); copyNum(best,out,"model_wheelbase_mm","wheelbaseMm");
        copyNum(best,out,"model_lkm_mixed","avgConsumptionL"); copyNum(best,out,"model_lkm_city","cityConsumptionL"); copyNum(best,out,"model_lkm_hwy","hwyConsumptionL"); copyNum(best,out,"model_fuel_cap_l","fuelTankL");
        copyNum(best,out,"model_doors","doors"); copyNum(best,out,"model_seats","seats");
        out.put("body",best.optString("model_body","")); out.put("drive",best.optString("model_drive","")); out.put("apiTransmission",best.optString("model_transmission_type","")); out.put("engineFuel",best.optString("model_engine_fuel","")); out.put("brandCountry",best.optString("make_country",""));
        out.put("specUpdatedAt",new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date())); return out;
    }

    private static void copyNum(JSONObject src, JSONObject dst, String from, String to) throws Exception {
        String s = src.optString(from, "").trim(); if (!s.isEmpty()) dst.put(to, Double.parseDouble(s));
    }

    private JSONObject fetchVinDetails(String vin) throws Exception {
        String v = vin == null ? "" : vin.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (v.length() != 17) throw new IllegalArgumentException("VIN 17 karakter olmalı");
        String api = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/" + URLEncoder.encode(v, "UTF-8") + "?format=json";
        HttpURLConnection c = (HttpURLConnection) new URL(api).openConnection();
        c.setConnectTimeout(9000); c.setReadTimeout(12000); c.setRequestProperty("User-Agent", "AracimPro/5.3 Android VIN");
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
            if (ok && "speed".equals(pendingLocationAction)) startSpeedTrackingNative();
            if (webView != null) webView.evaluateJavascript("window.onLocationPermissionResult && window.onLocationPermissionResult(" + (ok ? "true" : "false") + ")", null);
            pendingLocationAction = "";
        }
    }

    @Override protected void onDestroy() {
        stopSpeedTrackingNative();
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
