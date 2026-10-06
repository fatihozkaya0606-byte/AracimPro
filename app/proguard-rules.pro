# AracımPro R8 / ProGuard rules
# WebView JavaScript, AndroidBridge metodlarını isimleriyle çağırır.

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
