/**
 * Aracım Pro V15 - OtoApi.com güvenli piyasa değerleme proxy'si
 *
 * Cloudflare Worker secret:
 *   OTOAPI_MARKET_KEY = OtoApi.com X-Api-Key değeri
 *
 * Uygulama anahtarı APK içine koymaz. App yalnızca Worker URL'sine istek atar.
 * App isteği: ?year=2023&make=Peugeot&model=508&engine=1.5%20BlueHDi&trim=Allure&km=50000&fuel=Dizel&transmission=Tam%20Otomatik
 *
 * Sağlayıcı dokümanı: https://otoapi.com/api-dokumani
 */
const BASE = 'https://otoapi.com/api/vehicles';

export default {
  async fetch(request, env) {
    if (request.method !== 'GET') return json({ error: 'Yalnız GET desteklenir' }, 405);
    if (!env.OTOAPI_MARKET_KEY) return json({ error: 'OTOAPI_MARKET_KEY Worker secret ayarlanmamış' }, 500);

    const u = new URL(request.url);
    const vehicle = {
      year: Number(u.searchParams.get('year') || 0),
      make: (u.searchParams.get('make') || '').trim(),
      model: (u.searchParams.get('model') || '').trim(),
      engine: (u.searchParams.get('engine') || '').trim(),
      trim: (u.searchParams.get('trim') || '').trim(),
      km: String(Math.max(0, Number(u.searchParams.get('km') || 0))),
      fuel: (u.searchParams.get('fuel') || '').trim(),
      transmission: (u.searchParams.get('transmission') || '').trim(),
      tramer: String(Math.max(0, Number(u.searchParams.get('tramer') || 0)))
    };
    if (!vehicle.year || !vehicle.make || !vehicle.model) {
      return json({ error: 'year/make/model gerekli' }, 400);
    }

    try {
      const filters = { year: [vehicle.year] };

      const brands = await group(env, 'brands', filters);
      const brand = bestItem(brands, vehicle.make);
      if (!brand) return json({ error: `Piyasa sağlayıcısında marka bulunamadı: ${vehicle.make}` }, 404);
      filters.brand_id = [brand.id];

      const series = await group(env, 'series', filters);
      const serie = bestItem(series, vehicle.model);
      if (!serie) return json({ error: `Piyasa sağlayıcısında seri/model bulunamadı: ${vehicle.model}` }, 404);
      filters.serie_id = [serie.id];

      const transmissions = await group(env, 'transmission', filters);
      const wantedTransmission = mapTransmission(vehicle.transmission);
      const transmission = bestItem(transmissions, wantedTransmission);
      if (transmission) filters.transmission = [String(transmission.id ?? transmission.field)];

      const fuels = await group(env, 'fuel_type', filters);
      const wantedFuel = mapFuel(vehicle.fuel);
      const fuel = bestItem(fuels, wantedFuel);
      if (fuel) filters.fuel_type = [String(fuel.id ?? fuel.field)];

      const models = await group(env, 'models', filters);
      const model = bestItem(models, vehicle.engine) || (models.length === 1 ? models[0] : null);
      if (model && model.id !== undefined && model.id !== null) filters.model_id = [model.id];

      if (filters.model_id && vehicle.trim) {
        const variants = await group(env, 'variants', filters);
        const variant = bestItem(variants, vehicle.trim);
        if (variant && variant.id !== undefined && variant.id !== null) filters.variant_id = [variant.id];
      }

      filters.km = vehicle.km || '0';
      filters.tramer = vehicle.tramer || '0';

      const result = await provider(env, `${BASE}/evaluate_vehicle`, {
        filters,
        order: 'ad_date DESC'
      });
      if (result?.status === 'error') return json({ error: result.message || 'Değerleme yapılamadı' }, 422);

      const p = result?.prices || {};
      const avg = Number(p.average_price || p.retail_sell_price || 0);
      if (!avg) return json({ error: result?.message || 'Sağlayıcı fiyat döndürmedi' }, 422);

      return json({
        avg,
        min: Number(p.min_price || p.quick_sell_price || 0),
        max: Number(p.max_price || p.tough_sell_price || 0),
        quickSell: Number(p.quick_sell_price || 0),
        retailSell: Number(p.retail_sell_price || 0),
        toughSell: Number(p.tough_sell_price || 0),
        count: Number(result.total_ads || 0),
        updated: new Date().toISOString(),
        source: 'OtoApi.com piyasa değerleme',
        matched: {
          brand: brand.field || vehicle.make,
          series: serie.field || vehicle.model,
          transmission: transmission?.field || '',
          fuel: fuel?.field || '',
          model: model?.field || '',
          variantId: filters.variant_id?.[0] || null
        }
      });
    } catch (e) {
      return json({ error: e?.message || 'Değerleme servisi hatası' }, 502);
    }
  }
};

async function group(env, field, filters) {
  const data = await provider(env, `${BASE}/getVehicleByGroup`, { field, filters });
  const list = data?.[field];
  return Array.isArray(list) ? list : [];
}

async function provider(env, url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'X-Api-Key': env.OTOAPI_MARKET_KEY
    },
    body: JSON.stringify(body)
  });
  let data = {};
  try { data = await r.json(); } catch (_) {}
  if (!r.ok) throw new Error(data?.message || data?.error || `OtoApi.com HTTP ${r.status}`);
  return data;
}

function bestItem(items, wanted) {
  if (!Array.isArray(items) || !items.length) return null;
  const w = norm(wanted);
  if (!w) return null;
  let best = null, score = -1;
  for (const item of items) {
    const text = norm(item?.field ?? item?.name ?? '');
    if (!text) continue;
    let s = 0;
    if (text === w) s = 100;
    else if (text.includes(w) || w.includes(text)) s = 75;
    else {
      const wt = new Set(w.split(' ').filter(Boolean));
      const tt = new Set(text.split(' ').filter(Boolean));
      const common = [...wt].filter(x => tt.has(x)).length;
      s = common * 12;
    }
    const ad = Number(item?.ad_count || 0);
    s += Math.min(10, Math.log10(ad + 1));
    if (s > score) { score = s; best = item; }
  }
  return score >= 12 ? best : null;
}

function mapTransmission(x) {
  const n = norm(x);
  if (n.includes('manuel') && !n.includes('yari')) return 'Manuel';
  if (n.includes('yari') || n.includes('amt')) return 'Yarı Otomatik';
  if (n.includes('otomatik') || n.includes('dct') || n.includes('cvt') || n.includes('ecvt')) return 'Otomatik';
  return x || '';
}

function mapFuel(x) {
  const n = norm(x);
  if (n.includes('dizel') || n.includes('motorin')) return 'Dizel';
  if (n.includes('lpg') && n.includes('benzin')) return 'Benzin & LPG';
  if (n.includes('lpg')) return 'Benzin & LPG';
  if (n.includes('plug') || n.includes('phev')) return 'Hybrid';
  if (n.includes('hibrit') || n.includes('hybrid')) return 'Hybrid';
  if (n.includes('elektrik')) return 'Elektrik';
  if (n.includes('benzin')) return 'Benzin';
  return x || '';
}

function norm(v) {
  return String(v || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
