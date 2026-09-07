/**
 * Aracım Pro V11 - güvenli piyasa değerleme proxy örneği
 *
 * Amaç: API anahtarını APK içine koymamak.
 * Cloudflare Worker secret: ADM_API_KEY
 * Uygulamadaki Ayarlar > Piyasa Değeri alanına Worker URL'nizi yazın.
 *
 * Bu örnek Araç Data Merkezi'nin marka/model/yıl/km temelli endpoint'ini
 * normalize ederek Aracım Pro'nun beklediği avg/min/max/count alanlarına çevirir.
 */
export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    const make = u.searchParams.get('make') || '';
    const model = u.searchParams.get('model') || '';
    const year = u.searchParams.get('year') || '';
    const km = u.searchParams.get('km') || '';

    if (!make || !model || !year) {
      return json({ error: 'make/model/year gerekli' }, 400);
    }
    if (!env.ADM_API_KEY) {
      return json({ error: 'ADM_API_KEY secret ayarlanmamış' }, 500);
    }

    const api = new URL('https://api.aracdatamerkezi.com/v1/market/price');
    api.searchParams.set('marka', make);
    api.searchParams.set('model', model);
    api.searchParams.set('yil', year);
    if (km) api.searchParams.set('km_max', km);

    const r = await fetch(api, {
      headers: {
        'Authorization': `Bearer ${env.ADM_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    const body = await r.json();
    if (!r.ok || body?.status === 'error') {
      return json({ error: body?.message || `Sağlayıcı HTTP ${r.status}` }, r.status || 502);
    }

    const d = body?.data || {};
    const f = d?.fiyat || {};
    return json({
      avg: Number(f.ortalama || 0),
      min: Number(f.minimum || 0),
      max: Number(f.maksimum || 0),
      count: Number(d.ilan_adedi || 0),
      trend: d.trend || '',
      updated: d.guncelleme || '',
      source: 'Araç Data Merkezi'
    });
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
