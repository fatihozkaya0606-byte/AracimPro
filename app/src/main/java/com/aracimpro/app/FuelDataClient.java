package com.aracimpro.app;

import android.text.Html;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Akaryakıt + piyasa HTTP istemcisi.
 *
 * V15.4 öncelik sırası:
 *   1) LIVE_DATA_API_URL ayarlıysa güvenli JSON gateway (/fuel)
 *   2) EPDK'nın resmi il bazlı XML/SOAP servisi (benzin + motorin)
 *   3) Petrol Ofisi şehir sayfası yedek kaynak (özellikle LPG / eksik alan)
 *
 * Piyasa değeri, lisanslı ayrı bir sağlayıcı/Worker gerektirir. Uygulama fiyat uydurmaz.
 */
public final class FuelDataClient {
    private FuelDataClient() {}

    private static final String EPDK_PETROL_SOAP =
            "https://lisansws.epdk.gov.tr/services/bildirimPetrolAkaryakitFiyatlari.bildirimPetrolAkaryakitFiyatlariHttpSoap11Endpoint";
    private static final String EPDK_NS = "http://genel.service.ws.epvys.g222.tubitak.gov.tr/";

    public static JSONObject fetchDashboard(String city, String fuelType) throws Exception {
        return fetchDashboard(city, fuelType, "");
    }

    public static JSONObject fetchDashboard(String city, String fuelType, String liveDataBaseUrl) throws Exception {
        JSONObject out = new JSONObject();
        String c = city == null || city.trim().isEmpty() ? "Ankara" : city.trim();
        String selected = fuelType == null || fuelType.trim().isEmpty() ? "Benzin" : fuelType.trim();
        out.put("city", c);
        out.put("selectedType", selected);
        out.put("updatedAt", System.currentTimeMillis());

        double gasoline = 0d, diesel = 0d, lpg = 0d;
        List<String> sources = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        boolean live = false;

        // 1) Opsiyonel güvenli gateway. API anahtarları APK içine konmaz.
        if (liveDataBaseUrl != null && !liveDataBaseUrl.trim().isEmpty()) {
            try {
                JSONObject g = fetchGatewayFuel(liveDataBaseUrl, c, selected);
                gasoline = positive(g.optDouble("gasoline", g.optDouble("benzin", 0d)));
                diesel = positive(g.optDouble("diesel", g.optDouble("motorin", 0d)));
                lpg = positive(g.optDouble("lpg", 0d));
                String src = g.optString("source", "Canlı veri gateway");
                if (gasoline > 0 || diesel > 0 || lpg > 0) {
                    sources.add(src);
                    live = true;
                    long providerUpdated = parseEpoch(g.opt("updatedAt"));
                    if (providerUpdated > 0) out.put("updatedAt", providerUpdated);
                }
                String w = g.optString("warning", "");
                if (!w.isEmpty()) warnings.add(w);
            } catch (Exception e) {
                warnings.add("Canlı veri gateway: " + safeMessage(e));
            }
        }

        // 2) EPDK resmi il bazlı XML servisi. Gateway yoksa veya alanlar eksikse tamamla.
        if (gasoline <= 0 || diesel <= 0) {
            try {
                JSONObject epdk = fetchEpdkPetrolPrices(c);
                if (gasoline <= 0) gasoline = positive(epdk.optDouble("gasoline", 0d));
                if (diesel <= 0) diesel = positive(epdk.optDouble("diesel", 0d));
                if (epdk.optDouble("gasoline", 0d) > 0 || epdk.optDouble("diesel", 0d) > 0) {
                    sources.add("EPDK il bazlı bayi fiyatları");
                    live = true;
                }
            } catch (Exception e) {
                warnings.add("EPDK: " + safeMessage(e));
            }
        }

        // 3) Yedek kaynak. LPG için gateway yoksa bu kaynak kullanılabilir.
        if (gasoline <= 0 || diesel <= 0 || lpg <= 0) {
            try {
                JSONObject po = fetchPetrolOfisiPrices(c);
                if (gasoline <= 0) gasoline = positive(po.optDouble("gasoline", 0d));
                if (diesel <= 0) diesel = positive(po.optDouble("diesel", 0d));
                if (lpg <= 0) lpg = positive(po.optDouble("lpg", 0d));
                if (po.optDouble("gasoline", 0d) > 0 || po.optDouble("diesel", 0d) > 0 || po.optDouble("lpg", 0d) > 0) {
                    sources.add("Petrol Ofisi şehir fiyatları (yedek)");
                }
            } catch (Exception e) {
                warnings.add("Yedek fiyat kaynağı: " + safeMessage(e));
            }
        }

        out.put("gasoline", gasoline);
        out.put("diesel", diesel);
        out.put("lpg", lpg);
        out.put("live", live);
        out.put("source", sources.isEmpty() ? "Canlı fiyat alınamadı" : joinUnique(sources, " + "));
        if (!warnings.isEmpty()) out.put("warning", joinUnique(warnings, " | "));

        double selectedPrice = "Motorin".equalsIgnoreCase(selected) ? diesel :
                ("LPG".equalsIgnoreCase(selected) ? lpg : gasoline);
        out.put("selectedPrice", selectedPrice);
        out.put("news", fetchFuelNews());
        return out;
    }

    private static JSONObject fetchGatewayFuel(String base, String city, String fuelType) throws Exception {
        String b = base.trim();
        while (b.endsWith("/")) b = b.substring(0, b.length() - 1);
        String endpoint = b.endsWith("/fuel") ? b : b + "/fuel";
        StringBuilder u = new StringBuilder(endpoint);
        u.append(endpoint.contains("?") ? "&" : "?");
        u.append("city=").append(URLEncoder.encode(city, "UTF-8"));
        u.append("&fuelType=").append(URLEncoder.encode(fuelType == null ? "" : fuelType, "UTF-8"));
        String raw = get(u.toString(), 15000);
        JSONObject root = new JSONObject(raw);
        JSONObject d = root.optJSONObject("data");
        return d != null ? mergeMeta(root, d) : root;
    }

    private static JSONObject mergeMeta(JSONObject root, JSONObject d) {
        try {
            if (!d.has("source") && root.has("source")) d.put("source", root.optString("source"));
            if (!d.has("updatedAt") && root.has("updatedAt")) d.put("updatedAt", root.opt("updatedAt"));
            if (!d.has("warning") && root.has("warning")) d.put("warning", root.optString("warning"));
        } catch (Exception ignored) {}
        return d;
    }

    /** EPDK servis çağrısı: sorguNo=72, parametreler=il trafik kodu. */
    private static JSONObject fetchEpdkPetrolPrices(String city) throws Exception {
        String plate = plateForCity(city);
        if (plate.isEmpty()) throw new IllegalArgumentException("İl trafik kodu eşleşmedi: " + city);

        String soap = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
                "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:gen=\"" + EPDK_NS + "\">" +
                "<soapenv:Header/><soapenv:Body><gen:genelSorgu>" +
                "<sorguNo>72</sorguNo><parametreler>" + plate + "</parametreler>" +
                "</gen:genelSorgu></soapenv:Body></soapenv:Envelope>";
        String raw = postSoap(EPDK_PETROL_SOAP, soap, "genelSorgu", 18000);
        String decoded = decodeXmlEntities(raw);

        double gasoline = averageFuelPrice(decoded, "gasoline");
        double diesel = averageFuelPrice(decoded, "diesel");
        JSONObject out = new JSONObject();
        out.put("gasoline", gasoline);
        out.put("diesel", diesel);
        if (gasoline <= 0 && diesel <= 0) {
            String fault = firstTag(decoded, "faultstring");
            throw new IllegalStateException(fault.isEmpty() ? "EPDK yanıtında kullanılabilir fiyat bulunamadı" : fault);
        }
        return out;
    }

    private static double averageFuelPrice(String xml, String wanted) {
        String src = decodeXmlEntities(xml == null ? "" : xml);
        Pattern typeP = Pattern.compile("(?is)<(?:[A-Za-z0-9_]+:)?YakitTipi[^>]*>(.*?)</(?:[A-Za-z0-9_]+:)?YakitTipi>");
        Pattern priceP = Pattern.compile("(?is)<(?:[A-Za-z0-9_]+:)?Fiyat[^>]*>(.*?)</(?:[A-Za-z0-9_]+:)?Fiyat>");
        Matcher tm = typeP.matcher(src);
        List<Double> preferred = new ArrayList<>();
        List<Double> broad = new ArrayList<>();
        while (tm.find()) {
            String type = normalize(decodeXmlEntities(stripTags(tm.group(1))));
            int from = tm.end();
            int to = Math.min(src.length(), from + 1400);
            Matcher pm = priceP.matcher(src.substring(from, to));
            if (!pm.find()) continue;
            double price = parsePrice(stripTags(pm.group(1)));
            if (price <= 5 || price >= 250) continue;

            if ("gasoline".equals(wanted)) {
                if (type.contains("KURSUNSUZ BENZIN 95")) {
                    broad.add(price);
                    if (!type.contains("E10") && !type.contains("DIGER") && !type.contains("ETANOL")) preferred.add(price);
                }
            } else {
                if (type.contains("MOTORIN")) {
                    broad.add(price);
                    if (!type.contains("DIGER") && !type.contains("BIYODIZEL")) preferred.add(price);
                }
            }
        }
        List<Double> use = preferred.isEmpty() ? broad : preferred;
        if (use.isEmpty()) return 0d;
        double sum = 0d;
        for (double d : use) sum += d;
        return Math.round((sum / use.size()) * 100d) / 100d;
    }

    private static JSONObject fetchPetrolOfisiPrices(String city) throws Exception {
        JSONObject out = new JSONObject();
        String html = get("https://www.petrolofisi.com.tr/akaryakit-fiyatlari", 12000);
        String plain;
        try {
            plain = Html.fromHtml(html, Html.FROM_HTML_MODE_LEGACY).toString();
        } catch (Throwable t) {
            plain = html.replaceAll("(?is)<script.*?</script>", " ")
                    .replaceAll("(?is)<style.*?</style>", " ")
                    .replaceAll("(?s)<[^>]+>", " ");
        }
        plain = normalize(plain);
        String target = normalize(city);
        int idx = plain.indexOf(target);
        if (idx < 0 && target.startsWith("ISTANBUL")) {
            idx = plain.indexOf(target.contains("ANADOLU") ? "ISTANBUL (ANADOLU)" : "ISTANBUL (AVRUPA)");
        }
        if (idx >= 0) {
            String chunk = plain.substring(idx, Math.min(plain.length(), idx + 2600));
            Matcher m = Pattern.compile("(?<!\\d)(\\d{2,3}[\\.,]\\d{2})(?!\\d)").matcher(chunk);
            List<Double> nums = new ArrayList<>();
            while (m.find() && nums.size() < 18) {
                double d = parsePrice(m.group(1));
                if (d >= 10 && d <= 200) nums.add(d);
            }
            // Site tablosu değişirse bu alanlar yalnızca yedek amaçlıdır; resmi EPDK/gateway önceliklidir.
            if (nums.size() >= 11) {
                out.put("gasoline", nums.get(0));
                out.put("diesel", nums.get(2));
                out.put("lpg", nums.get(10));
            }
        }
        return out;
    }

    public static JSONArray fetchFuelNews() {
        JSONArray arr = new JSONArray();
        try {
            String q = URLEncoder.encode("benzin motorin akaryakıt zam indirim Türkiye", "UTF-8");
            String xml = get("https://news.google.com/rss/search?q=" + q + "&hl=tr&gl=TR&ceid=TR:tr", 12000);
            Matcher itemMatcher = Pattern.compile("(?is)<item>(.*?)</item>").matcher(xml);
            while (itemMatcher.find() && arr.length() < 8) {
                String item = itemMatcher.group(1);
                String title = tag(item, "title");
                String link = tag(item, "link");
                String pubDate = tag(item, "pubDate");
                if (title.isEmpty()) continue;
                JSONObject n = new JSONObject();
                n.put("title", decode(title));
                n.put("link", decode(link));
                n.put("pubDate", prettyRssDate(pubDate));
                arr.put(n);
            }
        } catch (Exception ignored) {}
        return arr;
    }

    public static JSONObject fetchMarketValue(String endpoint, JSONObject vehicle) throws Exception {
        if (endpoint == null || endpoint.trim().isEmpty()) throw new IllegalArgumentException("Canlı değerleme sunucusu ayarlanmamış");
        StringBuilder u = new StringBuilder(endpoint.trim());
        u.append(endpoint.contains("?") ? "&" : "?");
        String[] keys = new String[]{"year","make","model","engine","trim","km","fuel","transmission"};
        boolean first = true;
        for (String k : keys) {
            if (!first) u.append('&');
            first = false;
            u.append(URLEncoder.encode(k, "UTF-8")).append('=').append(URLEncoder.encode(vehicle.optString(k, ""), "UTF-8"));
        }
        String raw = get(u.toString(), 18000);
        JSONObject root = new JSONObject(raw);
        if (root.has("error") && !root.optString("error").isEmpty()) throw new IllegalStateException(root.optString("error"));
        JSONObject d = root.optJSONObject("data");
        return d != null ? mergeMeta(root, d) : root;
    }

    private static String postSoap(String url, String body, String soapAction, int timeout) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeout);
        c.setReadTimeout(timeout);
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
        c.setRequestProperty("SOAPAction", soapAction);
        c.setRequestProperty("User-Agent", "AracimPro/5.5.4 Android");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        c.setFixedLengthStreamingMode(bytes.length);
        try (OutputStream os = c.getOutputStream()) { os.write(bytes); }
        int code = c.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
        if (stream == null) throw new IllegalStateException("HTTP " + code);
        String raw = readAll(stream);
        c.disconnect();
        if (code < 200 || code >= 300) throw new IllegalStateException("HTTP " + code + " " + trimMessage(raw));
        return raw;
    }

    private static String get(String url, int timeout) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeout);
        c.setReadTimeout(timeout);
        c.setRequestProperty("User-Agent", "AracimPro/5.5.4 Android");
        c.setRequestProperty("Accept", "application/json,text/html,application/xml,text/xml,*/*");
        c.setRequestProperty("Accept-Language", "tr-TR,tr;q=0.9,en;q=0.6");
        int code = c.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
        if (stream == null) throw new IllegalStateException("HTTP " + code);
        String raw = readAll(stream);
        c.disconnect();
        if (code < 200 || code >= 300) throw new IllegalStateException("HTTP " + code + " " + trimMessage(raw));
        return raw;
    }

    private static String readAll(InputStream stream) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line).append('\n');
        br.close();
        return sb.toString();
    }

    private static String plateForCity(String city) {
        Map<String,String> m = new LinkedHashMap<>();
        String[][] rows = new String[][]{
                {"ADANA","01"},{"ADIYAMAN","02"},{"AFYONKARAHISAR","03"},{"AGRI","04"},{"AMASYA","05"},{"ANKARA","06"},{"ANTALYA","07"},{"ARTVIN","08"},{"AYDIN","09"},{"BALIKESIR","10"},
                {"BILECIK","11"},{"BINGOL","12"},{"BITLIS","13"},{"BOLU","14"},{"BURDUR","15"},{"BURSA","16"},{"CANAKKALE","17"},{"CANKIRI","18"},{"CORUM","19"},{"DENIZLI","20"},
                {"DIYARBAKIR","21"},{"EDIRNE","22"},{"ELAZIG","23"},{"ERZINCAN","24"},{"ERZURUM","25"},{"ESKISEHIR","26"},{"GAZIANTEP","27"},{"GIRESUN","28"},{"GUMUSHANE","29"},{"HAKKARI","30"},
                {"HATAY","31"},{"ISPARTA","32"},{"MERSIN","33"},{"ICEL","33"},{"ISTANBUL","34"},{"IZMIR","35"},{"KARS","36"},{"KASTAMONU","37"},{"KAYSERI","38"},{"KIRKLARELI","39"},
                {"KIRSEHIR","40"},{"KOCAELI","41"},{"KONYA","42"},{"KUTAHYA","43"},{"MALATYA","44"},{"MANISA","45"},{"KAHRAMANMARAS","46"},{"MARDIN","47"},{"MUGLA","48"},{"MUS","49"},
                {"NEVSEHIR","50"},{"NIGDE","51"},{"ORDU","52"},{"RIZE","53"},{"SAKARYA","54"},{"SAMSUN","55"},{"SIIRT","56"},{"SINOP","57"},{"SIVAS","58"},{"TEKIRDAG","59"},
                {"TOKAT","60"},{"TRABZON","61"},{"TUNCELI","62"},{"SANLIURFA","63"},{"USAK","64"},{"VAN","65"},{"YOZGAT","66"},{"ZONGULDAK","67"},{"AKSARAY","68"},{"BAYBURT","69"},
                {"KARAMAN","70"},{"KIRIKKALE","71"},{"BATMAN","72"},{"SIRNAK","73"},{"BARTIN","74"},{"ARDAHAN","75"},{"IGDIR","76"},{"YALOVA","77"},{"KARABUK","78"},{"KILIS","79"},{"OSMANIYE","80"},{"DUZCE","81"}
        };
        for (String[] r : rows) m.put(r[0], r[1]);
        String n = normalize(city);
        if (n.startsWith("ISTANBUL")) n = "ISTANBUL";
        return m.containsKey(n) ? m.get(n) : "";
    }

    private static String tag(String body, String tag) {
        Matcher m = Pattern.compile("(?is)<" + tag + ">(.*?)</" + tag + ">").matcher(body);
        if (!m.find()) return "";
        return m.group(1).replace("<![CDATA[", "").replace("]]>", "").trim();
    }

    private static String firstTag(String body, String tag) {
        Matcher m = Pattern.compile("(?is)<(?:[A-Za-z0-9_]+:)?" + Pattern.quote(tag) + "[^>]*>(.*?)</(?:[A-Za-z0-9_]+:)?" + Pattern.quote(tag) + ">").matcher(body == null ? "" : body);
        return m.find() ? stripTags(m.group(1)).trim() : "";
    }

    private static String decode(String s) {
        try { return Html.fromHtml(s, Html.FROM_HTML_MODE_LEGACY).toString().trim(); }
        catch (Throwable t) { return s.replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'"); }
    }

    private static String decodeXmlEntities(String s) {
        if (s == null) return "";
        String x = s;
        for (int i = 0; i < 2; i++) {
            x = x.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"")
                    .replace("&#39;", "'").replace("&apos;", "'").replace("&amp;", "&");
        }
        return x;
    }

    private static String prettyRssDate(String s) {
        if (s == null || s.trim().isEmpty()) return "";
        try {
            SimpleDateFormat in = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
            Date d = in.parse(s.trim());
            if (d == null) return s;
            return new SimpleDateFormat("dd.MM.yyyy HH:mm", new Locale("tr", "TR")).format(d);
        } catch (Exception e) { return s; }
    }

    private static String normalize(String s) {
        if (s == null) return "";
        String x = s.toUpperCase(new Locale("tr", "TR"));
        x = x.replace('Ç','C').replace('Ğ','G').replace('İ','I').replace('I','I')
                .replace('Ö','O').replace('Ş','S').replace('Ü','U');
        x = x.replaceAll("[^A-Z0-9() ]+", " ").replaceAll("\\s+", " ").trim();
        return x;
    }

    private static String stripTags(String s) {
        return s == null ? "" : s.replaceAll("(?s)<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    private static double parsePrice(String s) {
        if (s == null) return 0d;
        String x = stripTags(s).replace("TL", "").replace("₺", "").trim();
        Matcher m = Pattern.compile("(-?\\d+(?:[\\.,]\\d+)?)").matcher(x);
        if (!m.find()) return 0d;
        try { return Double.parseDouble(m.group(1).replace(',', '.')); }
        catch (Exception ignored) { return 0d; }
    }

    private static double positive(double d) { return Double.isFinite(d) && d > 0 ? d : 0d; }

    private static long parseEpoch(Object v) {
        if (v == null) return 0L;
        if (v instanceof Number) {
            long n = ((Number) v).longValue();
            return n < 100000000000L ? n * 1000L : n;
        }
        String s = String.valueOf(v).trim();
        try {
            long n = Long.parseLong(s);
            return n < 100000000000L ? n * 1000L : n;
        } catch (Exception ignored) {}
        return 0L;
    }

    private static String safeMessage(Throwable e) {
        String m = e == null ? "bilinmeyen hata" : e.getMessage();
        if (m == null || m.trim().isEmpty()) return e == null ? "bilinmeyen hata" : e.getClass().getSimpleName();
        return trimMessage(m);
    }

    private static String trimMessage(String s) {
        if (s == null) return "";
        String x = stripTags(s).replaceAll("\\s+", " ").trim();
        return x.length() > 220 ? x.substring(0, 220) + "…" : x;
    }

    private static String joinUnique(List<String> items, String sep) {
        List<String> u = new ArrayList<>();
        for (String x : items) if (x != null && !x.trim().isEmpty() && !u.contains(x.trim())) u.add(x.trim());
        StringBuilder sb = new StringBuilder();
        for (String x : u) {
            if (sb.length() > 0) sb.append(sep);
            sb.append(x);
        }
        return sb.toString();
    }
}
