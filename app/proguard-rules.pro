# AracımPro R8 / DEX optimizasyon kuralları
# WebView JavaScript -> AndroidBridge çağrıları korunur.

-keepattributes RuntimeVisibleAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod

-keepclassmembers,allowoptimization class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.aracimpro.app.MainActivity$AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}

-keep public class com.aracimpro.app.MainActivity {
    public <init>();
}
