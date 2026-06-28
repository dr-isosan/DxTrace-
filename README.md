# DxTrace

> **Kanıta kilitli, çelişki denetimli ve doktor onaylı klinik LLM platformu**

DxTrace bir "AI doktor" değildir. Doktorun klinik karar sürecini güçlendiren, kanıt izini görünür kılan bir **ikinci klinik beyin** platformudur.

**Temel prensip: Kanıt yoksa iddia yok.**

---

## Proje Yapısı

```
DxTrace/
├── src/                  # Node.js/Express backend
├── client/               # React web dashboard
└── mobile/               # Expo React Native mobil uygulama
```

---

## Hızlı Başlangıç

### Backend

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # hot-reload
npm test
```

### Web Dashboard

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

### Mobil Uygulama (Expo)

```bash
cd mobile
npm install
npx expo start --clear
```

> **Gereksinim:** Expo Go uygulaması telefonunda kurulu olmalı. Telefon ve bilgisayar aynı Wi-Fi ağında olmalı.
> 
> LAN IP'yi `mobile/src/api/dxtrace.js` içindeki `BASE_URL`'den güncelleyebilirsin.

---

## Mobil Kurulum Notları

Expo SDK 54 ile React Native 0.81.5 kullanılmaktadır. Hermes engine için gerekli Babel yapılandırması hazır:

- `babel.config.js` — private class field transform plugin'leri aktif
- `metro.config.js` — `react-native` paketleri Babel ile transpile ediliyor
- `polyfill.js` — Hermes'te eksik Web API'leri (DOMRect, AbortController, vb.) tanımlı

---

## API Endpointleri

### `POST /cases/analyze`
Tüm analiz modüllerini çalıştırır.

```bash
curl -X POST http://localhost:3000/cases/analyze \
  -H "Content-Type: application/json" \
  -d '{"caseId": "case_001"}'
```

**Yanıt alanları:**
| Alan | Açıklama |
|------|----------|
| `clinicalSummary` | Verifier'dan geçmiş, kaynaklı klinik özet |
| `evidence[]` | Puanlanmış kanıtlar (0-100 confidenceScore) |
| `conflicts[]` | Çelişki uyarıları (sigara, alerji, glukoz vb.) |
| `missingData[]` | Eksik/eskimiş kritik tetkikler |
| `followups[]` | OPEN/CLOSED/PENDING tetkik takibi |
| `timeline[]` | Renk kodlu kronolojik olay şeridi |
| `earlySignals[]` | CAS_GI_01 klinik dikkat sinyali |
| `llmStatus` | `VERIFIED` / `REJECTED_BY_VERIFIER` |

> Halüsinasyon testi için `"forceHallucination": true` ekle.

---

### `POST /feedback/submit`
Doktor Onay / Düzenleme / Reddet aksiyonu.

```bash
curl -X POST http://localhost:3000/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{
    "componentId": "cas_gi_01_output",
    "action": "EDIT",
    "doctorId": "doc_889",
    "previousContent": "AI orijinal metni",
    "finalContent": "Doktor düzenlenmiş metin",
    "meta": { "hadContradiction": true, "missingDataCountAtExecution": 6 }
  }'
```

### `GET /feedback/logs` — Tüm audit logları
### `GET /feedback/logs/:componentId` — Bileşene göre loglar
### `POST /llm/query` — Verifier korumalı LLM sorgusu
### `GET /llm/status` — LLM bileşen durumu
### `GET /health` — Sistem sağlık kontrolü

---

## Mimari

```
src/
├── server.js                    # Express uygulama
├── config/index.js              # Ortam değişkenleri
├── data/                        # Sentetik JSON veriler
│   ├── sampleCase.json
│   ├── sampleNotes.json         # Çelişkili klinik notlar
│   ├── sampleLabs.json          # Lab trendi (CA 19-9 eksik!)
│   └── sampleRadiology.json     # USG raporu
├── core/
│   ├── evidenceStore.js         # Belge → Evidence dönüştürücü
│   ├── confidenceScorer.js      # 0-100 dinamik puanlama
│   ├── contradictionEngine.js   # Çelişki tespiti
│   ├── timelineEngine.js        # Kronolojik şerit
│   ├── riskSignalEngine.js      # CAS_GI_01 (4 kriterli matris)
│   ├── missingDataDetector.js   # Eksik tetkik dedektörü
│   ├── followupTracker.js       # Açık döngü takipçisi
│   └── auditLog.js              # Doktor onay kaydı + diff
├── llm/
│   ├── mockLlm.js               # Sentetik LLM yanıtı
│   ├── verifierAgent.js         # 3 aşamalı halüsinasyon engeli
│   └── prompts.js               # Closed-book system prompt
└── routes/
    ├── case.routes.js           # POST /cases/analyze
    ├── llm.routes.js            # POST /llm/query
    └── feedback.routes.js       # POST /feedback/submit

client/                          # React Web Dashboard
├── src/
│   ├── App.jsx                  # Ana uygulama
│   ├── components/              # UI bileşenleri
│   └── api/                     # Axios API katmanı

mobile/                          # Expo React Native
├── App.js                       # Navigation container
├── index.js                     # Polyfill + entry point
├── polyfill.js                  # Hermes Web API polyfill'leri
├── babel.config.js              # Private class field transforms
├── metro.config.js              # node_modules transpile config
└── src/
    ├── api/dxtrace.js           # Backend API bağlantısı
    ├── screens/                 # Dashboard & Tools ekranları
    ├── components/              # Klinik UI kartları
    └── theme/                   # Renk & tasarım token'ları
```

---

## Temel Modüller

### Confidence Scorer (§1.2)
Her kanıta 0-100 arası dinamik puan:
- **Kaynak türü:** Lab/radyoloji +50, uzman notu +40, hasta beyanı +20
- **Zaman aşımı:** <30g +10, 1-6ay -10, >6ay -25
- **Çelişki cezası:** -40

### Contradiction Engine (§2)
- Sigara/alkol risk faktörü uyumsuzluğu
- Diyabet/glukoz çelişkisi
- Alerji kaydı çelişkisi
- Aynı gün fizik muayene bulgu çakışması

### CAS_GI_01 — Erken Sinyal (§3.1)
4 kriterden ≥3'ü tetiklenirse:
- **A:** Epigastrik ağrı
- **B:** İstemsiz kilo kaybı
- **C:** Yeni glukoz intoleransı
- **D:** Radyoloji "belirgin akut patoloji yok" + semptomlar sürüyor

### Verifier Agent (§5.2)
1. Kaynaksız cümle → kaldır
2. Yasaklı kelime → reddet ("tanısı konulmuştur", "kesinlikle"...)
3. Girdi havuzunda olmayan sayı → halüsinasyon olarak reddet

### Followup Tracker (§4.2)
- Notlardaki "... istendi/planlandı" ifadelerini bulur
- >14 gün geçmişse ve sonuç yoksa → `[AÇIK DÖNGÜ]`

---

## Test Sonuçları

```
Test Suites: 4 passed, 4 total
Tests:       31 passed, 31 total
```

| Test Dosyası | Kapsam |
|---|---|
| `contradiction.test.js` | Sigara/alkol çelişkisi, puan düşümü |
| `followup.test.js` | Açık döngü tespiti, CLOSED kapalı döngü |
| `confidenceScorer.test.js` | Base score, temporal decay, contradiction penalty |
| `hallucinationGuard.test.js` | Lipaz:400 halüsinasyonu, yasaklı kelime filtresi |

---

## Güvenlik Modeli

- ✅ Doktor her zaman karar vericidir
- ✅ Her AI çıktısı kaynaklıdır
- ✅ Kesin tanı dili kullanılmaz
- ✅ Gerçek hasta verisi kullanılmaz (tüm veriler sentetik)
- ✅ LLM Closed-Book Mode — sadece Evidence Store'dan yanıt verir

---

*DxTrace — Klinik kanıt izini görünür kılar.*
