# Aracım Pro v239 - targeted R8 rules, preserving active ad mediation.
# R8 full mode + optimized resource shrinker are enabled in Gradle.
# Preserve annotations, stack trace line numbers, and reflective signatures.
-keepattributes Exceptions,InnerClasses,Signature,SourceFile,LineNumberTable,*Annotation*,EnclosingMethod

# Android JavaScript bridge is exposed to the local WebView by annotation.
# Keep only annotated entry points, allowing optimizer to process internals.
-keepclassmembers,allowoptimization class com.aracimpro.app.MainActivity$AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX WorkManager and Room instantiate these components reflectively.
# Retain their constructor entry points and class names.
-keep class * extends androidx.room.RoomDatabase {
    <init>();
}
-keep class androidx.work.impl.WorkDatabase_Impl {
    <init>();
}
-keep class * extends androidx.work.InputMerger {
    <init>();
}
-keep class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep class * implements androidx.startup.Initializer {
    public <init>();
}

# Yandex AdMob custom-event class names are configured in the AdMob console.
# Keep their public names and members, but permit R8 method optimization.
# Removing name retention here would break mediation's reflective loading.
-keep,allowoptimization class com.admob.mobileads.YandexBanner { *; }
-keep,allowoptimization class com.admob.mobileads.YandexInterstitial { *; }
-keep,allowoptimization class com.admob.mobileads.YandexNative { *; }
-keep,allowoptimization class com.admob.mobileads.YandexRewarded { *; }

# Old Start.io package-wide keep rules were removed after verifying v238's
# release mapping contains ZERO com.startapp/com.truenet classes.
# All active AdMob, Yandex, Unity, Mintegral, Liftoff and AdMost dependencies
# and the libraries' own consumer keep rules remain unchanged.
-dontwarn org.jetbrains.annotations.**
