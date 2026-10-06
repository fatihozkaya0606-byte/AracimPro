# AracımPro 7.6.0 - R8 full optimization
# WebView Javascript bridge yöntemleri JavaScript tarafından isimle çağrılır;
# sadece bu üyeler korunur, uygulamanın geri kalanı R8 tarafından optimize edilir.

-keepattributes RuntimeVisibleAnnotations,AnnotationDefault,Signature,InnerClasses,EnclosingMethod

-keepclassmembers,allowoptimization class com.aracimpro.app.MainActivity$AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}
