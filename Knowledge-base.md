# DxTrace Knowledge Base (knowledge-base.md)

Bu doküman, DxTrace platformunun arkasındaki klinik mantığı, veri doğrulama kurallarını, çelişki algılama matrislerini ve LLM (Büyük Dil Modeli) yönlendirme standartlarını içermektedir. Projeyi geliştirecek mühendislerin ve sistem ajanlarının (Agents) uyması gereken kuralların teknik ve klinik referans kaynağıdır.

---

## 1. Klinik Veri Standartları ve JSON Modelleri

Sistemdeki tüm ham metinler (doktor notları, epikrizler, laboratuvar raporları) Clinical Case Brain tarafından ayrıştırılarak belirli bir şemaya oturtulur. Aşağıdaki veri modelleri backend mimarisinde (Node.js/Express) ve veri tabanında (Evidence Store) eksiksiz olarak uygulanmalıdır.

### 1.1 Klinik Kanıt (Evidence) Şeması

Her kanıt, kaynağına kilitlenmek zorundadır. Statik etiketler yerine dinamik güven puanlaması (Confidence Scorer) içerir.

    {
      "evidenceId": "string (Örn: ev_001)",
      "sourceId": "string (Örn: doc_2026_A)",
      "sourceType": "enum (physician_note | lab_report | radiology_report | epicrisis | patient_history)",
      "date": "string (YYYY-MM-DD)",
      "category": "enum (symptom | laboratory | radiology | medication | risk_factor | family_history)",
      "clinicalKey": "string (Örn: glucose | weight_loss | smoking_status)",
      "value": "string / number (Örn: 145 | 'epigastrik ağrı' | 'aktif içici')",
      "unit": "string / null (Örn: mg/dL)",
      "confidenceScore": "number (0 - 100)",
      "scoreFactors": "array of strings",
      "rawTextSnippet": "string (Belgeden aynen alınan cümle)"
    }

### 1.2 Güven Puanı (Confidence Scorer) Algoritma Kuralları

Bir kanıtın `confidenceScore` değeri hesaplanırken aşağıdaki ağırlıklar temel alınır:

1. **Kaynak Türü Etkisi (Base Score):**
   * Resmi laboratuvar ve radyoloji raporları: +50 puan.
   * Uzman hekim imzalı poliklinik/konsültasyon notları: +40 puan.
   * Hasta sözlü beyanı veya anamnez formu: +20 puan.

2. **Zaman Aşımı Etkisi (Temporal Decay):**
   * Son 30 gün içinde üretilen veriler: Değişim yok (+10 puan bonus).
   * 1 - 6 ay arası eski veriler: -10 puan.
   * 6 aydan eski veriler: -25 puan (kronik durumlar hariç).

3. **Çelişki Cezası (Contradiction Penalty):**
   * Eğer kanıt Contradiction Engine tarafından "çelişkili" olarak işaretlenmişse: Doğrudan -40 puan uygulanır.

---

## 2. Contradiction Engine (Çelişki Motoru) Kurallar Matrisi

Sistem, farklı zamanlarda veya farklı kaynaklarda girilmiş anlamsal zıtlıkları tarar. Bir çelişki yakalandığında, her iki kanıtın da arayüzdeki güven puanı düşürülür ve üst veri (metadata) düzeyinde birbirine bağlanır.

### 2.1 Temel Çelişki Şeması

    {
      "conflictId": "string (Örn: con_001)",
      "conflictingEvidences": ["ev_004", "ev_012"],
      "conflictCategory": "string (Örn: smoking_status_mismatch)",
      "severity": "enum (high | medium)",
      "description": "string (Doktora gösterilecek açıklama metni)"
    }

### 2.2 Çerçevenin Tarayacağı Öncelikli Çelişki Alanları

* **Alışkanlıklar ve Risk Faktörleri:** Bir notta "Aktif sigara/alkol kullanımı yok" denirken, daha yeni veya eski bir notta "Günde 1 paket sigara" ifadesinin bulunması.
* **Diyabet ve Glukoz Geçmişi:** Anamnezde "Bilinen diyabet öyküsü yok" yazmasına rağmen, laboratuvar geçmişinde ardışık olarak `glucose > 126 mg/dL` veya `HbA1c > 6.5%` tespiti.
* **Alerji Kayıtları:** Bir epikrizde "Bilinen ilaç alerjisi yok" ibaresi yer alırken, başka bir konsültasyon notunda "Penisilin alerjisi mevcut" notunun düşülmüş olması.
* **Bulgu Zıtlıkları:** Fizik muayene notunda aynı gün içinde hem "Karın rahat, defans yok" hem de "Epigastrik bölgede derin palpasyonla hassasiyet" ifadelerinin çakışması.

---

## 3. Erken Teşhis ve Klinik Dikkat Sinyali Örüntüleri

DxTrace kesinlikle tanı koymaz. Belirli zaman aralıklarında ortaya çıkan mikro bulguları birleştirerek **Klinik Dikkat Sinyali (Clinical Attention Signal - CAS)** üretir.

### 3.1 Sinyal Formülü: Gastrointestinal / Pankreatobiliyer Risk Örüntüsü

Aşağıdaki 4 kriterden en az 3'ü son 6 ay içinde tetiklenmişse sistem bir `CAS_GI_01` uyarısı üretmek zorundadır:

1. **Kriter A (Semptom):** Epigastrik bölgede yerleşik, sırta vurabilen dirençli ağrı veya dolgunluk hissi.
2. **Kriter B (Metabolik):** Son 3 ayda belgelenmiş diyet dışı, istemsiz kilo kaybı (Örn: >%5 vücut ağırlığı).
3. **Kriter C (Laboratuvar):** Daha önce normal seyreden glukoz değerlerinin son 2 tahlilde bozulmaya başlaması (Yeni başlangıçlı glukoz intoleransı).
4. **Kriter D (Radyoloji):** Yakın tarihli batın ultrasonografi veya BT raporunda "belirgin akut patoloji izlenmedi" yazmasına rağmen, klinik şikayetlerin devam ediyor olması.

### 3.2 Sinyal Çıktı Dil Standardı

Sistem bu örüntüyü birleştirdiğinde kesinlikle *"Hastada X hastalığı düşünülmektedir"* demez. Kullanılacak şablon sabittir:

> "Klinik kayıtlardaki istemsiz kilo kaybı, yeni başlangıçlı glukoz regülasyon bozukluğu ve dirençli epigastrik ağrı bulguları birlikte değerlendirildiğinde; üst gastrointestinal veya pankreatobiliyer sistemler açısından hekim incelemesi gerektirebilecek bir klinik dikkat sinyali oluşmaktadır. Mevcut kayıtlarda bu örüntüyü netleştirecek spesifik biyobelirteçler eksiktir."

---

## 4. Followup Tracker ve Eksik Veri Matrisi

Eksik Veri Dedektörü (Missing Data Detector) sadece anlık eksiklikleri bulurken, Followup Tracker bu eksikliklerin zamansal takibini ve süreç takibini yapar.

### 4.1 Kritik Tetkik ve Takip Takvimi Kuralları

Eğer bir hastada Üst GI/Pankreatobiliyer dikkat sinyali (`CAS_GI_01`) tetiklenmişse, sistem aşağıdaki matrise göre eksik veri kontrolü yapar:

| Klinik Parametre | Kritiklik Derecesi | Kabul Edilebilir Güncelliği | Eksiklik Durumunda Aksiyon |
| :--- | :--- | :--- | :--- |
| **CA 19-9** | Yüksek | Son 45 Gün | Eksik Veri Bandına Ekle & Followup Tracker'ı Başlat |
| **Amilaz / Lipaz** | Yüksek | Son 7 Gün | Eksik Veri Bandına Ekle |
| **Total/Direkt Bilirubin** | Orta | Son 30 Gün | Eksik Veri Bandına Ekle (Sarılık Kontrolü) |
| **Abdomen BT / USG** | Yüksek | Son 90 Gün | Tetkik İnceleme Durumunu Takip Et |

### 4.2 Followup Tracker Veri İzleme Mantığı

Sistem doktor notlarını tarayarak *"CA 19-9 tahlili istendi"*, *"Kontrol ultrasonu planlandı"* gibi geleceğe yönelik istek ifadelerini yakalar. 
* Eğer bu ifadenin üzerinden **14 gün** geçmiş ve sisteme ilgili laboratuvar/radyoloji sonucu yüklenmemişse, Followup Tracker durumu şu şekilde işaretler:
  `[AÇIK DÖNGÜ]: 14 gün önce istenen CA 19-9 testi henüz sonuçlanmadı veya sisteme işlenmedi.`

---

## 5. LLM Operasyon ve R.V.R.C.E. Protokol Kılavuzu

Yapay zeka katmanının halüsinasyon görmesini engellemek için prompt ve veri besleme süreçlerinde uygulanacak teknik kurallar şunlardır:

### 5.1 Closed-Book Mode Sınırları
* LLM'e sistem istemi (System Prompt) içerisinde medikal bilgi üretimi için kendi parametrik hafızasını kullanamayacağı kesin bir dille dikte edilir.
* Modele girdi olarak yalnızca doğrulanmış `Evidence Store` nesneleri verilir. Girdi nesnesinde bulunmayan hiçbir laboratuvar değeri, tarih veya semptom çıktı metninde yer alamaz.

### 5.2 Verifier Agent (Doğrulayıcı Ajan) Kontrol Listesi
Ana LLM bir özet veya klinik metin ürettiğinde, çıktı kullanıcıya gösterilmeden önce Verifier Agent tarafından bir regex ve semantik taramadan geçirilir:

1. **Cümle Bazlı Kaynak Kontrolü:** Metindeki her cümlenin sonunda bir kaynak belirteci (Örn: `[doc_2026_A]`) var mı? Kaynaksız cümleler doğrudan silinir.
2. **Yasaklı Kelime Filtresi:** Metin içinde *"kesinlikle"*, *"tanısı konulmuştur"*, *"tedavisi ... olmalıdır"*, *"teşhis edilmiştir"* gibi kesinlik bildiren kelimeler geçiyorsa metin reddedilir ve yeniden üretime gönderilir.
3. **Veri Eşleştirme:** Çıktıda geçen sayılar (Örn: "Glukoz: 150") girdi JSON'ındaki değerlerle birebir uyuşuyor mu? Uyuşmuyorsa halüsinasyon olarak işaretlenir.

---

## 6. Doktor Onay Döngüsü (Human-in-the-Loop) ve Audit Log Standartları

Sistem tarafından üretilen her özet, çelişki uyarısı veya erken teşhis sinyali, doktor paneli üzerinden doğrulanmak zorundadır. Doktorun verdiği kararlar sistemin en değerli verisidir.

### 6.1 Onay Durum Değişkenleri
* **APPROVED (Onaylandı):** Doktor çıktı metnini tamamen doğru bulmuştur. İlgili yapay zeka çıktısının güvenilirliği kesinleşir.
* **EDITED (Düzenlendi):** Doktor çıktı metni üzerinde manuel değişiklik yapmıştır. Düzenlenen yeni metin veri tabanına kaydedilirken, yapay zekanın orijinal metniyle arasındaki fark (diff) analiz edilerek saklanır.
* **REJECTED (Reddedildi):** Doktor çıktıyı hatalı, kaynaksız veya halüsinasyon olarak değerlendirmiştir. Bu durum sistem kalibrasyonu için loglanır.

### 6.2 Audit Log Kayıt Yapısı

Her onay aksiyonu veri tabanına şu şemada yazılır:

    {
      "logId": "string (Örn: log_9921)",
      "timestamp": "string (ISO 8601 - YYYY-MM-DDTHH:mm:ssZ)",
      "userId": "string (Doktor ID)",
      "componentId": "string (Örn: cas_gi_01_output)",
      "action": "enum (APPROVE | EDIT | REJECT)",
      "previousContent": "string (AI'ın ürettiği ham metin)",
      "finalContent": "string (Doktorun onayladığı veya düzenlediği son metin)",
      "metaData": {
        "hadContradiction": "boolean",
        "missingDataCountAtExecution": "number"
      }
    }

---

## 7. Öğrenci MVP Test Senaryoları (Ground Truth)

Öğrenci, geliştirdiği sistemin doğruluğunu test etmek için `knowledge-base.md` içerisinde yer alan aşağıdaki sentetik senaryoları test suitine (Unit/Integration tests) eklemelidir:

* **Test Case 1 (Çelişki Doğrulama):** `doc_1` içinde "Alkol kullanmıyor" ve `doc_2` içinde "Sosyal içici, haftada 1-2 kadeh" verileri girildiğinde `Contradiction Engine` bir conflict nesnesi üretmeli ve iki verinin de `confidenceScore` değerini düşürmelidir.
* **Test Case 2 (Eksik Veri Şeridi):** Hastanın tahlil geçmişinde `CA 19-9` girdisi olmadığında, frontend arayüzündeki persist şerit komponentinde `CA 19-9` kelimesi kırmızı/gri alarm durumunda listelenmelidir.
* **Test Case 3 (Halüsinasyon Engelleme):** Mock LLM yanıtı içinde girdi havuzunda olmayan hayali bir `Lipaz: 400 U/L` değeri döndürüldüğünde, `Verifier Agent` bunu yakalamalı ve kullanıcı arayüzüne basılmasını engellemelidir.