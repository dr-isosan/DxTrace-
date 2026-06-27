# DxTrace task.md

**Öğrenci Görevi: DxTrace için kanıta kilitli, çelişki denetimli ve doktor onaylı araştırma prototipini geliştirme**

---

## 1. Görev Tanımı

Bu görevde senden **DxTrace** adlı doktor odaklı klinik LLM platformunun temel yazılım iskeletini oluşturman beklenmektedir. 

Yeni nesil DxTrace prototipi; verileri sadece listelemekle kalmaz, onları **puanlar**, birbiriyle **çelişip çelişmediğini kontrol eder**, eksik testlerin **takibini yapar** ve üretilen her çıktının **doktor onayından geçmesini** zorunlu kılar.

Bu proje bir tıbbi cihaz değildir. Tanı koymaz, tedavi önermez ve doktorun yerine geçmez. Tüm veriler sentetiktir.

Temel prensip:
> **Kanıt yoksa iddia yok.**

---

## 2. Görevin Amacı

Bu görev sonunda çalışan bir Node.js tabanlı backend prototipi oluşturulmalıdır.

Prototip şunları yapabilmelidir:
1. Sentetik klinik verileri okuyup sisteme aktarmak.
2. Kanıtları 0-100 arası algoritmik bir güven puanıyla (Confidence Score) değerlendirmek.
3. Notlar arasındaki zıtlıkları (Örn: aktif içici vs içmiyor) tespit etmek (Contradiction Engine).
4. Zaman çizelgesini görselleştirilebilecek renk kodlu meta verilerle (Mavi, Sarı, Kırmızı, Gri) üretmek.
5. 4 kriterli özel matrise göre Erken Klinik Dikkat Sinyali (CAS) üretmek.
6. Hem eksik verileri bulmak hem de istenip yapılmayan testlerin gün takibini yapmak (Followup Tracker).
7. Mock LLM çıktıları üretip kaynaksız olanları (Verifier Agent ile) reddetmek.
8. Doktorun AI çıktılarına Onay/Red/Düzenleme (Feedback) verebileceği akışı kurmak ve diff (fark) kaydı tutmak.

---

## 3. Kullanılacak Teknolojiler

- Node.js, Express.js
- JavaScript, npm, Jest
- dotenv, uuid, dayjs, cors, helmet, morgan, zod
- nodemon, eslint, prettier

Kurulacak paketler:

    npm install express dotenv cors helmet morgan zod uuid dayjs diff chalk
    npm install -D nodemon jest eslint prettier

---

## 4. Oluşturulacak Proje Yapısı

Yeni modüllerin entegre edildiği klasör mimarisi:

    DxTrace/
    ├── README.md
    ├── idea.md
    ├── task.md
    ├── knowledge-base.md
    ├── package.json
    ├── src/
    │   ├── server.js
    │   ├── config/
    │   ├── data/ (Sentetik JSON'lar)
    │   ├── core/
    │   │   ├── evidenceStore.js
    │   │   ├── confidenceScorer.js (YENİ)
    │   │   ├── contradictionEngine.js (YENİ)
    │   │   ├── timelineEngine.js
    │   │   ├── riskSignalEngine.js
    │   │   ├── missingDataDetector.js
    │   │   ├── followupTracker.js (YENİ)
    │   │   └── auditLog.js
    │   ├── llm/ (Verifier, Guards, Prompts)
    │   ├── routes/
    │   │   ├── case.routes.js
    │   │   ├── llm.routes.js
    │   │   └── feedback.routes.js (YENİ - Doktor Onayı İçin)
    │   └── utils/
    └── tests/
        ├── contradiction.test.js (YENİ)
        ├── followup.test.js (YENİ)
        ├── hallucinationGuard.test.js
        └── confidenceScorer.test.js (YENİ)

---

## 5. Gerekli API Endpointleri

### 5.1 Vaka Analiz Endpointi
`POST /cases/analyze`
Bu endpoint artık sadece özet dönmemeli; çelişkileri, skorları ve takip edilen döngüleri de dönmelidir.
Örnek Yanıt:

    {
      "clinicalSummary": "...",
      "evidence": [
        { "id": "ev_1", "confidenceScore": 85, "value": "epigastrik ağrı" }
      ],
      "conflicts": [
        { "conflictId": "con_01", "description": "Sigara kullanımı tutarsız." }
      ],
      "followups": [
        { "status": "OPEN", "message": "14 gün önce istenen CA 19-9 eksik." }
      ],
      "timeline": [],
      "earlySignals": []
    }

### 5.2 Doktor Onay / Geri Bildirim Endpointi (YENİ)
`POST /feedback/submit`
Doktorun arayüzde bastığı Onay/Düzenle/Reddet butonlarının verisini karşılar.
Örnek İstek:

    {
      "componentId": "cas_gi_01_output",
      "action": "EDIT",
      "doctorId": "doc_889",
      "previousContent": "AI'ın ürettiği ilk metin",
      "finalContent": "Doktorun düzenlediği son metin"
    }

---



### 6.1 confidenceScorer.js
Kanıtları puanlar.
- Uzman notuysa +40, lab sonucuysa +50, hasta beyanıysa +20.
- Son 30 gün ise tam puan, 6 aydan eskiyse -25 puan (kronik hariç).
- `contradictionEngine` bu veriyi çelişkili bulduysa anında -40 puan cezası uygular.

### 6.2 contradictionEngine.js
Farklı id'lere sahip dokümanları semantik/kural bazlı tarar.
Örn: `doc_A`'da "diyabet yok" ile `doc_B`'deki "Glukoz: 150" çakışırsa, bir `conflictId` üretir ve her iki kanıtın skorunu ezer.

### 6.3 followupTracker.js
Geçmiş notlarda geçen istekleri arar (Örn: "BT önerildi", "Kontrol USG").
`dayjs` kullanarak o günden bugüne kaç gün geçtiğini sayar. Eğer sonuç `sampleLabs` veya `sampleRadiology` içinde yoksa `[AÇIK DÖNGÜ]` uyarısı üretir.

### 6.4 riskSignalEngine.js (Güncellendi)
Eski sistemdeki gibi 3 kuralı bulup hemen sinyal atmaz.
`knowledge-base.md` içindeki 4 Kriterli Matrisi kullanır. En az 3 kriter karşılanıyorsa `CAS_GI_01` sinyalini üretir. Kesin tanı dili kullanamaz.

### 6.5 auditLog.js (Güncellendi)
Sadece sistem loğlarını değil, `POST /feedback/submit` endpoint'inden gelen Onay ve Düzenleme (Diff) metinlerini kalıcı olarak kaydeder.

---

## 7. Sentetik Veri Kuralları

Gerçek hasta verisi kesinlikle kullanılmayacaktır. Test senaryoları `knowledge-base.md` Bölüm 7'ye (Ground Truth) uygun olarak hazırlanmalıdır. İçeriğinde mutlaka çelişkili iki not (sigara örneği) ve sonucu gelmemiş bir test isteği (Followup örneği) bulundurulmalıdır.

---

## 8. Test Gereksinimleri

Yeni modüllerin doğruluk testleri yazılmalıdır:
- **`contradiction.test.js`**: Zıt veriler girildiğinde conflict objesi dönüyor mu ve puanlar düşüyor mu?
- **`followup.test.js`**: 15 gün önce istenmiş testin sonucu JSON'da yoksa sistem açık döngü uyarısı veriyor mu?
- **`confidenceScorer.test.js`**: Tarihi çok eski olan bir laboratuvar sonucunun puanı beklenen algoritmaya göre düşüyor mu?

---

## 9. Kabul Kriterleri

- [x] Node.js/Express MVP ayağa kalktı.
- [x] Yeni klasör yapısı ve modüller oluşturuldu.
- [x] `confidenceScorer` dinamik puanlama yapıyor.
- [x] `contradictionEngine` çelişki yakalıyor.
- [x] `followupTracker` açık döngüleri tespit ediyor.
- [x] `POST /feedback/submit` doktor onayını logluyor.
- [x] Tüm testler (`npm test`) başarıyla geçiyor.
- [x] Tüm veriler sentetik, halüsinasyon kontrolü aktif.

---

## 10. Teslim Formatı
Proje reposu, çalışır haldeki postman/curl isteklerinin ekran görüntüleri, çalıştırılmış `npm test` terminal çıktısı ve yeni modüllerin nasıl kodlandığını özetleyen kısa bir doküman.