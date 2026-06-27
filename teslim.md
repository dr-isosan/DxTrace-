# DxTrace — Teslim Dokümanı

> **Proje:** DxTrace Clinical LLM Platform — Kanıta Kilitli, Çelişki Denetimli, Doktor Onaylı Araştırma Prototipi  
> **Repo:** https://github.com/dr-isosan/DxTrace-  
> **Tarih:** 27 Haziran 2026  
> **Versiyon:** 1.0.0

---

## 1. npm test Çıktısı

```
> dxtrace@1.0.0 test
> jest --runInBand --forceExit

PASS tests/contradiction.test.js
PASS tests/confidenceScorer.test.js
PASS tests/hallucinationGuard.test.js
PASS tests/followup.test.js

Test Suites: 4 passed, 4 total
Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        0.232 s
```

✅ **31/31 test başarıyla geçti.**

---

## 2. Çalışan API Çıktıları (curl)

### 2.1 POST /cases/analyze
```bash
curl -s -X POST http://localhost:3000/cases/analyze \
  -H "Content-Type: application/json" \
  -d '{"caseId": "case_001"}' | jq
```

**Yanıt (özet):**
```json
{
  "caseId": "case_001",
  "llmStatus": "VERIFIED",
  "clinicalSummary": "Hastada epigastrik bölgede dirençli ağrı...",
  "conflicts": [
    { "conflictId": "con_672361ff", "severity": "high",
      "description": "Farklı kaynaklarda sigara kullanımına ilişkin çelişkili ifadeler..." },
    { "conflictId": "con_9fff2a2f", "severity": "high",
      "description": "Alerji kaydında çelişki tespit edildi..." }
  ],
  "followups": [
    { "key": "ca19_9", "status": "OPEN",
      "message": "[AÇIK DÖNGÜ]: 101 gün önce istenen CA 19-9 testi henüz sonuçlanmadı." }
  ],
  "earlySignals": [
    { "signalId": "CAS_GI_01", "severity": "attention",
      "metCriteria": ["A", "B", "C", "D"] }
  ]
}
```

### 2.2 POST /feedback/submit
```bash
curl -s -X POST http://localhost:3000/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{
    "componentId": "cas_gi_01_output",
    "action": "EDIT",
    "doctorId": "doc_889",
    "previousContent": "AI ürettiği metin",
    "finalContent": "Doktorun düzenlediği metin"
  }' | jq
```

**Yanıt:**
```json
{
  "message": "Doktor geri bildirimi kaydedildi.",
  "logId": "log_7380efec",
  "action": "EDIT",
  "timestamp": "2026-06-27T10:09:10.891Z",
  "diff": [
    { "added": false, "removed": true,  "value": "AI ürettiği" },
    { "added": true,  "removed": false, "value": "Doktorun düzenlediği" },
    { "added": false, "removed": false, "value": " metin" }
  ]
}
```

### 2.3 POST /llm/generate
```bash
curl -s -X POST http://localhost:3000/llm/generate \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**Yanıt (özet):**
```json
{
  "passed": true,
  "clinicalSummary": "...[kaynak atıflı, doğrulanmış özet]...",
  "violations": [],
  "removedSentences": []
}
```

### 2.4 GET /llm/status
```bash
curl -s http://localhost:3000/llm/status | jq
```
```json
{
  "mode": "closed-book",
  "hallucinationGuard": "active",
  "verifierAgent": "active",
  "llmType": "mock"
}
```

### 2.5 GET /health
```bash
curl -s http://localhost:3000/health | jq
```
```json
{ "status": "ok", "platform": "DxTrace", "version": "1.0.0" }
```

---

## 3. Yeni Modüllerin Açıklaması

### 3.1 `confidenceScorer.js`
Her kanıtı 0–100 arası puanlar. Puanlama algoritması:

| Kaynak Tipi      | Taban Puan |
|-----------------|-----------|
| Lab raporu       | +50        |
| Uzman notu       | +40        |
| Hasta beyanı     | +20        |

| Zaman Koşulu       | Düzeltme |
|-------------------|---------|
| Son 30 gün         | +10     |
| 1–6 ay arası       | −10     |
| 6 aydan eski       | −25     |
| Çelişki cezası     | −40     |

**Örnek:** Son 30 gün içinde alınmış lab sonucu → 50 + 10 = **60 puan**  
**Örnek:** 6 aydan eski + çelişkili uzman notu → 40 − 25 − 40 = **0 puan** (negatife düşmez)

---

### 3.2 `contradictionEngine.js`
Farklı belge ID'lerine sahip kanıtlar arasında kural tabanlı çelişki taraması yapar.

**Tespit ettiği çelişki türleri:**
- `smoking_status_mismatch` — "Sigara kullanmıyor" vs "Aktif sigara içici"
- `alcohol_status_mismatch` — "Alkol yok" vs "Sosyal alkol kullanımı"
- `allergy_status_mismatch` — "Alerji yok" vs "Penisilin alerjisi mevcut"
- `physical_exam_same_day_mismatch` — Aynı günkü notta çelişkili muayene bulguları

Her çelişki için benzersiz bir `conflictId` üretir ve ilgili kanıtların puanına anında **−40 cezası** uygular.

---

### 3.3 `followupTracker.js`
Klinik notlarda geçen test isteklerini (`dayjs` ile) takip eder.

**Akış:**
1. `sampleNotes.json` içindeki notları tarar, "BT önerildi", "CA 19-9 istendi" gibi ifadeleri bulur.
2. İstek tarihinden bugüne kaç gün geçtiğini hesaplar.
3. Sonuç `sampleLabs` veya `sampleRadiology` içinde yoksa → `status: "OPEN"` ve `[AÇIK DÖNGÜ]` uyarısı üretir.
4. Sonuç bulunmuşsa → `status: "CLOSED"`

---

### 3.4 `riskSignalEngine.js` (4 Kriterli Matris)
`knowledge-base.md` içindeki CAS_GI_01 matrisine göre çalışır. En az **3 kriter** karşılanırsa sinyal tetiklenir.

| Kriter | Açıklama |
|--------|----------|
| A | Dirençli epigastrik ağrı (≥2 belgede) |
| B | İstemsiz kilo kaybı |
| C | Yeni başlangıçlı glukoz regülasyon bozukluğu |
| D | Aile öyküsünde pankreas hastalığı veya görüntülemede yetersiz değerlendirme |

> ⚠️ Kesin tanı dili kullanılamaz. Sinyal yalnızca "hekim incelemesi gerektirebilir" ifadesiyle sonlandırılır.

---

### 3.5 `auditLog.js` (Güncellendi)
Sistem loglarına ek olarak `POST /feedback/submit` endpoint'inden gelen:
- Doktor ID'si
- Onay/Red/Düzenleme aksiyonu
- AI öncesi metin (`previousContent`)
- Doktor sonrası metin (`finalContent`)
- Metin farkı (`diff` — `diff` paketi ile üretilir)

...kayıtlarını kalıcı olarak loglar.

---

### 3.6 `feedback.routes.js` (YENİ)
`POST /feedback/submit` endpoint'ini sunar. `zod` ile istek doğrulaması yapar:
- `componentId` (string, zorunlu)
- `action`: `"APPROVE" | "REJECT" | "EDIT"` (zorunlu)
- `doctorId` (string, zorunlu)
- `previousContent` / `finalContent` (EDIT durumunda zorunlu)

---

## 4. Proje Yapısı

```
DxTrace/
├── .gitignore
├── README.md
├── Knowledge-base.md
├── task.md
├── package.json
├── src/
│   ├── server.js
│   ├── config/
│   ├── data/
│   │   ├── sampleCase.json
│   │   ├── sampleLabs.json
│   │   ├── sampleNotes.json        ← çelişkili notlar (sigara örneği)
│   │   └── sampleRadiology.json
│   ├── core/
│   │   ├── evidenceStore.js
│   │   ├── confidenceScorer.js     ✅ YENİ
│   │   ├── contradictionEngine.js  ✅ YENİ
│   │   ├── timelineEngine.js
│   │   ├── riskSignalEngine.js     ✅ GÜNCELLENDİ (4 kriter)
│   │   ├── missingDataDetector.js
│   │   ├── followupTracker.js      ✅ YENİ
│   │   └── auditLog.js             ✅ GÜNCELLENDİ (diff kaydı)
│   ├── llm/
│   │   ├── mockLlm.js
│   │   ├── prompts.js
│   │   └── verifierAgent.js
│   ├── routes/
│   │   ├── case.routes.js
│   │   ├── llm.routes.js           ✅ GÜNCELLENDİ (/generate alias)
│   │   └── feedback.routes.js      ✅ YENİ
│   └── utils/
└── tests/
    ├── contradiction.test.js        ✅ YENİ (8 test)
    ├── followup.test.js             ✅ YENİ (8 test)
    ├── hallucinationGuard.test.js   (8 test)
    └── confidenceScorer.test.js     ✅ YENİ (7 test)
```

---

## 5. Kabul Kriterleri — Tamamlandı

- [x] Node.js/Express MVP ayağa kalktı.
- [x] Yeni klasör yapısı ve modüller oluşturuldu.
- [x] `confidenceScorer` dinamik puanlama yapıyor.
- [x] `contradictionEngine` çelişki yakalıyor.
- [x] `followupTracker` açık döngüleri tespit ediyor.
- [x] `POST /feedback/submit` doktor onayını logluyor.
- [x] Tüm testler (`npm test`) başarıyla geçiyor — **31/31 PASS**
- [x] Tüm veriler sentetik, halüsinasyon kontrolü aktif.

---

> **Not:** Bu proje bir tıbbi cihaz değildir. Tanı koymaz, tedavi önermez ve doktorun yerine geçmez. Tüm veriler sentetiktir.
