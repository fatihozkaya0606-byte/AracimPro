/**
 * Aracım Pro V15.3 - Araç Data Merkezi güvenli piyasa değerleme proxy'si
 * Worker secret: ADM_API_KEY
 * Uygulama yalnızca Worker URL'sini görür; ADM token APK içine girmez.
 */
export default {
  async fetch(request, env) {
    if (request.method !== 'GET') return json({ error: 'Yalnız GET desteklenir' }, 405);
    if (!env.ADM_API_KEY) return json({ error: 'ADM_API_KEY Worker secret ayarlanmamış' }, 500);
    const u = new URL(request.url);
    const year = Number(u.searchParams.get('year') || 0);
    const make = (u.searchParams.get('make') || '').trim();
    const model = (u.searchParams.get('model') || '').trim();
    const km = Math.max(0, Number(u.searchParams.get('km') || 0));
    if (!year || !make || !model) return json({ error: 'year/make/model gerekli' }, 400);

    const q = new URL('https://api.aracdatamerkezi.com/v1/market/price');
    q.searchParams.set('marka', make.toLocaleLowerCase('tr-TR'));
    q.searchParams.set('model', model.toLocaleLowerCase('tr-TR'));
    q.searchParams.set('yil', String(year));
    if (km > 0) q.searchParams.set('km_max', String(km));

    try {
      const r = await fetch(q, { headers: { 'accept': 'application/json', 'authorization': `Bearer ${env.ADM_API_KEY}` } });
      let data = {}; try { data = await r.json(); } catch (_) {}
      if (!r.ok) return json({ error: data?.message || data?.error || `ADM HTTP ${r.status}` }, r.status);
      const d = data?.data || {};
      const f = d?.fiyat || {};
      const avg = Number(f?.ortalama || 0);
      if (!avg) return json({ error: 'Piyasa sağlayıcısı ortalama değer döndürmedi' }, 422);
      return json({
        avg,
        min: Number(f?.minimum || 0),
        max: Number(f?.maksimum || 0),
        count: Number(d?.ilan_adedi || 0),
        trend: d?.trend || '',
        updated: d?.guncelleme || new Date().toISOString().slice(0,10),
        source: 'Araç Data Merkezi'
      });
    } catch (e) {
      return json({ error: e?.message || 'Piyasa değerleme servisi hatası' }, 502);
    }
  }
};
function json(obj, status=200){return new Response(JSON.stringify(obj),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
