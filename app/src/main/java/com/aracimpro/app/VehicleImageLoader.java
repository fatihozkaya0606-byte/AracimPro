package com.aracimpro.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

/**
 * Bounded, sampled image decoding for user vehicle pictures.
 * Full-resolution network streams are never decoded into an in-memory bitmap.
 * All network data is downloaded to an app-private disk cache first.
 */
final class VehicleImageLoader {
    private static final long MAX_IMAGE_BYTES = 24L * 1024L * 1024L;
    private static final long MAX_DISK_CACHE_BYTES = 64L * 1024L * 1024L;
    private static final long CACHE_MAX_AGE_MS = 7L * 24L * 60L * 60L * 1000L;
    private static final int MAX_PREVIEW_PIXELS = 720;

    private VehicleImageLoader() {}

    static Bitmap loadRemote(Context context, String address) throws Exception {
        URL url = new URL(address);
        if (!"https".equalsIgnoreCase(url.getProtocol())) {
            throw new IOException("Görsel için HTTPS bağlantısı gerekli");
        }
        File directory = new File(context.getCacheDir(), "vehicle-img");
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("Görsel önbelleği açılamadı");
        }
        String key = sha256(address);
        File cached = new File(directory, key + ".img");
        long now = System.currentTimeMillis();
        if (cached.isFile() && cached.length() > 0 && cached.length() <= MAX_IMAGE_BYTES
                && now - cached.lastModified() < CACHE_MAX_AGE_MS) {
            Bitmap result = decodeSampled(cached);
            if (result != null) return result;
            cached.delete();
        }

        File temp = File.createTempFile("download-", ".tmp", directory);
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(8500);
            connection.setReadTimeout(15000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("User-Agent", "AracimPro/7.11 Android");
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) throw new IOException("Görsel HTTP " + code);
            try (InputStream input = connection.getInputStream()) {
                if (input == null) throw new IOException("Görsel boş");
                writeBounded(input, temp);
            }
            if (!temp.renameTo(cached)) {
                // Some filesystems cannot atomically rename; decode directly instead.
                Bitmap fallback = decodeSampled(temp);
                if (fallback == null) throw new IOException("Görsel çözülemedi");
                return fallback;
            }
            cleanupCache(directory, MAX_DISK_CACHE_BYTES);
            Bitmap result = decodeSampled(cached);
            if (result == null) { cached.delete(); throw new IOException("Görsel okunamadı"); }
            return result;
        } finally {
            if (connection != null) connection.disconnect();
            temp.delete();
        }
    }

    static Bitmap loadDocument(Context context, Uri uri) throws Exception {
        File temp = File.createTempFile("picked-", ".img", context.getCacheDir());
        try {
            try (InputStream input = context.getContentResolver().openInputStream(uri)) {
                if (input == null) throw new IOException("Fotoğraf bulunamadı");
                writeBounded(input, temp);
            }
            Bitmap result = decodeSampled(temp);
            if (result == null) throw new IOException("Fotoğraf okunamadı");
            return result;
        } finally {
            temp.delete();
        }
    }

    private static Bitmap decodeSampled(File file) {
        BitmapFactory.Options dimensions = new BitmapFactory.Options();
        dimensions.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(file.getAbsolutePath(), dimensions);
        int width = dimensions.outWidth, height = dimensions.outHeight;
        if (width <= 0 || height <= 0) return null;

        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inPreferredConfig = Bitmap.Config.RGB_565;
        int sample = 1;
        while (Math.max(width / sample, height / sample) > MAX_PREVIEW_PIXELS * 2) {
            sample *= 2;
        }
        opts.inSampleSize = Math.max(1, sample);
        Bitmap result = BitmapFactory.decodeFile(file.getAbsolutePath(), opts);
        if (result == null) return null;
        if (Math.max(result.getWidth(), result.getHeight()) <= MAX_PREVIEW_PIXELS) return result;
        float ratio = (float) MAX_PREVIEW_PIXELS / Math.max(result.getWidth(), result.getHeight());
        int outWidth = Math.max(1, Math.round(result.getWidth() * ratio));
        int outHeight = Math.max(1, Math.round(result.getHeight() * ratio));
        Bitmap scaled = Bitmap.createScaledBitmap(result, outWidth, outHeight, true);
        if (scaled != result) result.recycle();
        return scaled;
    }

    private static void writeBounded(InputStream input, File output) throws IOException {
        long total = 0;
        byte[] buffer = new byte[16 * 1024];
        try (FileOutputStream file = new FileOutputStream(output)) {
            int count;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > MAX_IMAGE_BYTES) throw new IOException("Görsel boyutu fazla");
                file.write(buffer, 0, count);
            }
        }
        if (total == 0) throw new IOException("Görsel dosyası boş");
    }

    private static String sha256(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes("UTF-8"));
        StringBuilder out = new StringBuilder();
        for (byte b : digest) out.append(String.format(java.util.Locale.ROOT, "%02x", b & 0xff));
        return out.toString();
    }

    private static void cleanupCache(File directory, long limit) {
        File[] files = directory.listFiles();
        if (files == null) return;
        java.util.Arrays.sort(files, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
        long size = 0;
        for (File f : files) size += f.length();
        for (File f : files) {
            if (size <= limit) break;
            long length = f.length();
            if (f.delete()) size -= length;
        }
    }
}
