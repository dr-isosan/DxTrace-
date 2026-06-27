# DxTrace — Yeni Modüllerin Açıklaması

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
