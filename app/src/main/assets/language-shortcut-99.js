/* Aracım Pro v99: restore visible global language selector in compact R8 header. */
(function(){
'use strict';
const previousHeader = header;
header = function(){
  const html = previousHeader();
  const currentLang = (typeof apLang === 'function' ? apLang() : 'tr').toUpperCase();
  // Original country/language modal is retained. Only reintroduce its entry point.
  const shortcut = '<button type="button" class="ap99LanguageButton" onclick="languageModal()" title="Dil ve ülke seç" aria-label="Uygulama dilini değiştir" data-no-translate="true">'+
    '<span aria-hidden="true">🌐</span><b>'+currentLang+'</b><span aria-hidden="true">▾</span></button>';
  return html.replace('<div class="apUtilityRow">', '<div class="apUtilityRow">'+shortcut);
};
render();
})();