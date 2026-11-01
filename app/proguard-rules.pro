# AracımPro 7.6.1 - R8 full optimization
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod,Signature,InnerClasses,EnclosingMethod
-keepclassmembers,allowoptimization class com.aracimpro.app.MainActivity$AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# AGP 9 / strict R8: WorkManager + Room reflective constructors.
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

# Start.io SDK - required when shrinking/obfuscating the release build.
-keep class com.startapp.** { *; }
-keep class com.truenet.** { *; }
-keepattributes Exceptions,InnerClasses,Signature,Deprecated,SourceFile,LineNumberTable,*Annotation*,EnclosingMethod
-dontwarn com.startapp.**
-dontwarn org.jetbrains.annotations.**

# Yandex AdMob custom event adapters are instantiated by class name via mediation.
-keep class com.admob.mobileads.YandexBanner { *; }
-keep class com.admob.mobileads.YandexInterstitial { *; }
-keep class com.admob.mobileads.YandexNative { *; }
-keep class com.admob.mobileads.YandexRewarded { *; }
