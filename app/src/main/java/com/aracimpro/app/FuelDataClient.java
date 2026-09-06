package com.aracimpro.app;

import android.text.Html;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class FuelDataClient {
    private FuelDataClient() {}

    public static JSONObject fetchDashboard(String city, String fuelType) throws Exception {
        JSONObject out = new JSONObject();
        out.put("city", city == null || city.trim().isEmpty() ? "Ankara" : city.trim());
        out.put("selectedType", fuelType == null || fuelType.trim().isEmpty() ? "Benzin" : fuelType.trim());
        out.put("updatedAt", System.currentTimeMillis());

        JSONObject price = fetchPetrolOfisiPrices(out.getString("city"));
        double gasoline = price.optDouble("gasoline", 0);
        double diesel = price.optDouble("diesel", 0);
        double lpg = price.optDouble("lpg", 0);
        out.put("gasoline", gasoline);
        out.put("diesel", diesel);
        out.put("lpg", lpg);
        out.put("source", price.optString("source", "Petrol Ofisi + haber akışı"));

        String selected = out.getString("selectedType");
        double selectedPrice = "Motorin".equalsIgnoreCase(selected) ? diesel : ("LPG".equalsIgnoreCase(selected) ? lpg : gasoline);
        out.put("selectedPrice", selectedPrice);
        out.put("news", fetchFuelNews());
        return out;
    }

    private static JSONObject fetchPetrolOfisiPrices(String city) {
        JSONObject out = new JSONObject();
        try {
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
                String chunk = plain.substring(idx, Math.min(plain.length(), idx + 2400));
                Matcher m = Pattern.compile("(?<!\\d)(\\d{2,3}[\\.,]\\d{2})(?!\\d)").matcher(chunk);
                List<Double> nums = new ArrayList<>();
                while (m.find() && nums.size() < 16) {
                    try {
                        double d = Double.parseDouble(m.group(1).replace(',', '.'));
                        if (d >= 10 && d <= 200) nums.add(d);
                    } catch (Exception ignored) {}
                }
                // Petrol Ofisi tablosunda KDV dahil / hariç değerler art arda gelir.
                // İlk, üçüncü ve on birinci sayılar sırasıyla benzin, motorin ve LPG KDV dahil pompa fiyatıdır.
                if (nums.size() >= 11) {
                    out.put("gasoline", nums.get(0));
                    out.put("diesel", nums.get(2));
                    out.put("lpg", nums.get(10));
                }
            }
            out.put("source", "Petrol Ofisi şehir fiyatları");
        } catch (Exception ignored) {
            try { out.put("source", "Akaryakıt haber akışı"); } catch (Exception ignored2) {}
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
        String raw = get(u.toString(), 15000);
        return new JSONObject(raw);
    }

    private static String get(String url, int timeout) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(timeout);
        c.setReadTimeout(timeout);
        c.setRequestProperty("User-Agent", "AracimPro/5.0 Android");
        c.setRequestProperty("Accept-Language", "tr-TR,tr;q=0.9,en;q=0.6");
        int code = c.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
        if (stream == null) throw new IllegalStateException("HTTP " + code);
        BufferedReader br = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line).append('\n');
        br.close();
        c.disconnect();
        if (code < 200 || code >= 300) throw new IllegalStateException("HTTP " + code);
        return sb.toString();
    }

    private static String tag(String body, String tag) {
        Matcher m = Pattern.compile("(?is)<" + tag + ">(.*?)</" + tag + ">").matcher(body);
        if (!m.find()) return "";
        return m.group(1).replace("<![CDATA[", "").replace("]]>", "").trim();
    }

    private static String decode(String s) {
        try { return Html.fromHtml(s, Html.FROM_HTML_MODE_LEGACY).toString().trim(); }
        catch (Throwable t) { return s.replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'"); }
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
        x = x.replace('Ç','C').replace('Ğ','G').replace('İ','I').replace('Ö','O').replace('Ş','S').replace('Ü','U');
        x = x.replaceAll("\\s+", " ");
        return x;
    }
}
