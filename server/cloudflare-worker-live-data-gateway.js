/**
 * Aracım Pro V15.4 - Güvenli canlı veri gateway (Cloudflare Worker)
 *
 * Uygulama yalnızca Worker URL'sini görür. Sağlayıcı API anahtarları Worker secret'ta kalır.
 *
 * Rotalar:
 *   GET /fuel?city=Ankara&fuelType=Benzin
 *   GET /market?year=2023&make=Peugeot&model=508&km=50000&...
 *
 * Fuel env:
 *   FUEL_PROVIDER = "apibir" | "ucuzyakitbul"
 *   FUEL_API_KEY  = sağlayıcı anahtarı (secret)
 *
 * Market env (genel proxy):
 *   MARKET_ENDPOINT    = lisanslı sağlayıcının HTTPS endpoint'i
 *   MARKET_API_KEY     = token/anahtar (secret, gerekiyorsa)
 *   MARKET_AUTH_HEADER = örn. Authorization | X-Api-Key (varsayılan Authorization)
 *   MARKET_AUTH_PREFIX = örn. Bearer (Authorization için)
 *
 * Not: Sağlayıcı sözleşmesi/dokümanı farklı alan adları istiyorsa marketProviderRequest()
 *      ve normalizeMarket() bölümlerini sağlayıcının resmi dokümanına göre uyarlayın.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return json({ error: 'Yalnız GET desteklenir' }, 405);

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'AracimPro Live Data Gateway', version: '15.4' });
    }

    if (url.pathname === '/fuel') return fuelRoute(url, env);
    if (url.pathname === '/market') return marketRoute(url, env);
    return json({ error: 'Rota bulunamadı' }, 404);
  }
};

async function fuelRoute(url, env) {
  const city = (url.searchParams.get('city') || '').trim();
  if (!city) return json({ error: 'city gerekli' }, 400);
  if (!env.FUEL_PROVIDER || !env.FUEL_API_KEY) {
    return json({ error: 'FUEL_PROVIDER / FUEL_API_KEY Worker ayarı eksik' }, 503);
  }

  try {
    const provider = String(env.FUEL_PROVIDER).toLowerCase();
    let raw, source;
    if (provider === 'apibir') {
      const u = new URL('https://api.apibir.com/v1/fuel/prices');
      u.searchParams.set('city', city.toLocaleLowerCase('tr-TR'));
      const r = await fetch(u, {
        headers: { accept: 'application/json', authorization: `apikey ${env.FUEL_API_KEY}` }
      });
      raw = await safeJson(r);
      if (!r.ok) throw new Error(errorOf(raw) || `apibir HTTP ${r.status}`);
      source = 'apibir / şehir akaryakıt verisi';
    } else if (provider === 'ucuzyakitbul') {
      const u = new URL('https://ucuzyakitbul.com.tr/api/prices');
      u.searchParams.set('city', city);
      const r = await fetch(u, {
        headers: {
          accept: 'application/json',
          'x-api-key': env.FUEL_API_KEY,
          'user-agent': 'AracimPro/5.5.4 (+live-data-gateway)'
        }
      });
      raw = await safeJson(r);
      if (!r.ok) throw new Error(errorOf(raw) || `UcuzYakıtBul HTTP ${r.status}`);
      source = 'UcuzYakıtBul şehir akaryakıt verisi';
    } else {
      return json({ error: `Desteklenmeyen FUEL_PROVIDER: ${provider}` }, 400);
    }

    const n = normalizeFuel(raw);
    if (!n.gasoline && !n.diesel && !n.lpg) {
      return json({ error: 'Sağlayıcıdan kullanılabilir yakıt fiyatı gelmedi' }, 422);
    }
    return json({
      ...n,
      city,
      source,
      updatedAt: raw?.updatedAt || raw?.updated_at || raw?.date || Date.now()
    });
  } catch (e) {
    return json({ error: e?.message || 'Canlı akaryakıt sağlayıcısı hatası' }, 502);
  }
}

async function marketRoute(url, env) {
  const v = {
    year: Number(url.searchParams.get('year') || 0),
    make: (url.searchParams.get('make') || '').trim(),
    model: (url.searchParams.get('model') || '').trim(),
    engine: (url.searchParams.get('engine') || '').trim(),
    trim: (url.searchParams.get('trim') || '').trim(),
    km: Math.max(0, Number(url.searchParams.get('km') || 0)),
    fuel: (url.searchParams.get('fuel') || '').trim(),
    transmission: (url.searchParams.get('transmission') || '').trim()
  };
  if (!v.year || !v.make || !v.model) return json({ error: 'year/make/model gerekli' }, 400);
  if (!env.MARKET_ENDPOINT) {
    return json({ error: 'Piyasa değerleme sağlayıcısı henüz bağlanmadı (MARKET_ENDPOINT eksik)' }, 503);
  }

  try {
    const { response, data } = await marketProviderRequest(v, env);
    if (!response.ok) return json({ error: errorOf(data) || `Piyasa sağlayıcısı HTTP ${response.status}` }, response.status);
    const n = normalizeMarket(data);
    if (!n.avg) return json({ error: 'Piyasa sağlayıcısı ortalama değer döndürmedi; sağlayıcı alan eşlemesini kontrol edin' }, 422);
    return json({ ...n, source: data?.source || data?.provider || 'Lisanslı piyasa değerleme servisi' });
  } catch (e) {
    return json({ error: e?.message || 'Piyasa değerleme servisi hatası' }, 502);
  }
}

async function marketProviderRequest(v, env) {
  const endpoint = new URL(env.MARKET_ENDPOINT);
  const map = { year: 'year', make: 'make', model: 'model', engine: 'engine', trim: 'trim', km: 'km', fuel: 'fuel', transmission: 'transmission' };
  for (const [src, dst] of Object.entries(map)) {
    const value = v[src];
    if (value !== '' && value !== 0) endpoint.searchParams.set(dst, String(value));
  }

  const headers = { accept: 'application/json' };
  if (env.MARKET_API_KEY) {
    const name = env.MARKET_AUTH_HEADER || 'Authorization';
    const prefix = String(env.MARKET_AUTH_PREFIX || '').trim();
    headers[name] = prefix ? `${prefix} ${env.MARKET_API_KEY}` : env.MARKET_API_KEY;
  }
  const response = await fetch(endpoint, { headers });
  const data = await safeJson(response);
  return { response, data };
}

function normalizeFuel(root) {
  const d = root?.data ?? root?.result ?? root ?? {};
  const rows = Array.isArray(d) ? d : (Array.isArray(d?.prices) ? d.prices : null);
  if (rows) {
    let gasoline = 0, diesel = 0, lpg = 0;
    for (const row of rows) {
      const name = norm(row?.fuel_type ?? row?.fuelType ?? row?.type ?? row?.name ?? row?.product ?? '');
      const price = number(row?.price ?? row?.avg ?? row?.average ?? row?.value ?? row?.amount);
      if (!price) continue;
      if (!gasoline && (name.includes('benzin') || name.includes('gasoline'))) gasoline = price;
      if (!diesel && (name.includes('motorin') || name.includes('diesel'))) diesel = price;
      if (!lpg && (name.includes('lpg') || name.includes('otogaz'))) lpg = price;
    }
    return { gasoline, diesel, lpg };
  }
  return {
    gasoline: firstNumber(d, ['gasoline','benzin','gasoline95','kursunsuz95','petrol']),
    diesel: firstNumber(d, ['diesel','motorin','mazot']),
    lpg: firstNumber(d, ['lpg','autogas','otogaz'])
  };
}

function normalizeMarket(root) {
  const d = root?.data ?? root?.result ?? root ?? {};
  const f = d?.prices ?? d?.price ?? d?.fiyat ?? d;
  return {
    avg: firstNumber(f, ['avg','average','average_price','ortalama','retailSell','retail_sell_price']),
    min: firstNumber(f, ['min','minimum','min_price','quickSell','quick_sell_price']),
    max: firstNumber(f, ['max','maximum','max_price','toughSell','tough_sell_price']),
    count: firstNumber(d, ['count','total','total_ads','ilan_adedi','similarCount']),
    trend: d?.trend ?? d?.trend30 ?? d?.change30 ?? '',
    updated: d?.updated ?? d?.updatedAt ?? d?.guncelleme ?? new Date().toISOString()
  };
}

function firstNumber(obj, keys) {
  for (const k of keys) {
    const n = number(obj?.[k]);
    if (n) return n;
  }
  return 0;
}
function number(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : 0;
  const s = String(v ?? '').replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function norm(v) {
  return String(v || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');
}
async function safeJson(r) { try { return await r.json(); } catch (_) { return {}; } }
function errorOf(x) { return x?.error || x?.message || x?.detail || ''; }
function json(obj, status=200) {
  return new Response(JSON.stringify(obj), { status, headers: {
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'access-control-allow-origin':'*'
  }});
}
