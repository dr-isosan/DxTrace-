# DxTrace idea.md

**Doktor denetimli erken teşhis ve klinik karar destek için kanıta kilitli klinik LLM platformu.**

> DxTrace bir “AI doktor” değildir.  
> DxTrace, doktorun klinik akıl yürütme sürecinin arkasındaki kanıt izini görünür hale getiren bir klinik zekâ platformudur.

---

## 1. Vizyon

DxTrace’in vizyonu, yapay zekâyı doktorların yerine karar veren bir sistem olarak değil, doktorların klinik karar sürecini güçlendiren bir **ikinci klinik beyin** olarak konumlandırmaktır.

Sağlık alanında temel problemlerden biri, verinin çok fazla ama dağınık olmasıdır. Bir hastaya ait laboratuvar sonuçları, radyoloji raporları, epikrizler, poliklinik notları, geçmiş başvurular, ilaç geçmişi ve klinik gözlemler farklı yerlerde bulunabilir. Doktorun bu verileri kısa sürede okuyup anlamlandırması oldukça zordur.

DxTrace bu noktada devreye girer.

Amaç, doktora şunu sağlamaktır:

- hastanın karmaşık geçmişini hızlıca anlamak,
- laboratuvar ve klinik bulguların zaman içindeki değişimini görmek,
- erken teşhis açısından dikkat edilmesi gereken örüntüleri yakalamak,
- hangi bulgunun hangi kaynağa dayandığını göstermek,
- eksik veya çelişkili verileri belirtmek,
- ayırıcı tanı düşüncesini sistematik hale getirmek,
- konsültasyon notlarını kaynaklı şekilde hazırlamak,
- tüm AI çıktılarının doktor tarafından incelenebilir olmasını sağlamak.

DxTrace’in temel hedefi teşhis koymak değildir. Temel hedef, doktorun mevcut kanıtları daha hızlı, daha güvenli ve daha izlenebilir şekilde değerlendirmesine yardımcı olmaktır.

---

## 2. Problem

### 2.1 Klinik Verinin Dağınık Olması

Bir hastaya ait bilgiler farklı sistemlerde bulunabilir:

- Elektronik sağlık kayıtları,
- laboratuvar sistemleri,
- radyoloji raporları,
- PACS/DICOM arşivleri,
- PDF belgeleri,
- epikrizler,
- doktor notları,
- konsültasyon notları,
- ilaç geçmişi,
- önceki tanılar,
- takip planları.

Bu verilerin her biri klinik açıdan önemlidir; fakat tek başına bakıldığında bütün resmi göstermeyebilir.

### 2.2 Doktorların Zaman Kısıtı

Doktorların çoğu zaman bir hastanın geçmişini incelemek için çok sınırlı süresi vardır. Özellikle kompleks hastalarda yıllara yayılan tahlil sonuçlarını, başvuruları ve raporları okumak ciddi zaman alır.

Bu nedenle bazı küçük ama önemli değişimler gözden kaçabilir.

### 2.3 Erken Teşhis Sinyallerinin Zor Fark Edilmesi

Erken teşhis çoğu zaman tek bir belirgin bulguya dayanmaz. Genellikle zaman içindeki küçük değişimlerin birleşimiyle ortaya çıkar.

Örneğin:

- hafif ama istemsiz kilo kaybı,
- zaman içinde yükselen glukoz değeri,
- epigastrik ağrı,
- “belirgin akut patoloji yok” şeklinde raporlanan önceki bir görüntüleme,
- eksik takip tetkikleri.

Bu bulgular tek tek çok güçlü görünmeyebilir. Fakat birlikte değerlendirildiğinde doktorun dikkatini çekmesi gereken bir **klinik dikkat sinyali** oluşturabilir.

### 2.4 LLM Halüsinasyon Riski

Genel amaçlı büyük dil modelleri güçlüdür; fakat tıbbi alanda serbest bırakıldığında tehlikeli olabilir. Çünkü LLM’ler bazen:

- olmayan bilgi üretebilir,
- eksik veriyi varmış gibi gösterebilir,
- kesin tanı dili kullanabilir,
- olmayan laboratuvar değerleri uydurabilir,
- yanlış kılavuz bilgisi verebilir,
- gereğinden fazla güvenli konuşabilir.

Bu yüzden DxTrace’in temel yaklaşımı şudur:

> **Kanıt yoksa iddia yok.**

---

## 3. Ürün Tezi

Klinik not sonucu saklar.  
DxTrace sonuca götüren kanıt yolunu saklar.

Geleneksel klinik notta doktorun ulaştığı sonuç yazılır. Ancak çoğu zaman şu soruların izi net şekilde korunmaz:

- Hangi bulgu bu düşünceyi destekledi?
- Hangi veri eksikti?
- Hangi bulgu çelişkiliydi?
- Hangi laboratuvar trendi dikkat çekti?
- Hangi rapor yeniden gözden geçirilmeli?
- AI hangi kaynaklara dayanarak çıktı üretti?
- Doktor hangi AI çıktısını onayladı, düzenledi veya reddetti?

DxTrace bu kanıt yolunu görünür hale getirmeyi amaçlar.

Bu nedenle DxTrace’in ürün tezi:

> **Tıbbi alanda güvenli LLM kullanımı, ancak kanıta kilitli ve doktor denetimli bir mimariyle mümkündür.**

---

## 4. Hedef Kullanıcılar

### 4.1 Aile Hekimleri ve Dahiliye Uzmanları
Kompleks hasta geçmişlerini hızlı incelemek, kronik hastalık trendlerini takip etmek ve erken klinik dikkat sinyallerini fark etmek için kullanabilirler.

### 4.2 Asistan Doktorlar ve Tıp Öğrencileri
Klinik akıl yürütmeyi öğrenmek, vakaları sistematik incelemek, eksik veriyi görmek ve kanıta dayalı düşünme alışkanlığı kazanmak için kullanabilirler.

### 4.3 Uzman Doktorlar
Konsültasyonla gelen hastalarda önceki tetkikleri, laboratuvar trendlerini, radyoloji raporlarını ve yönlendirme gerekçesini hızlıca özetlemek için kullanabilirler.

### 4.4 Radyologlar
Klinik bağlamla birlikte önceki raporları karşılaştırmak, zaman içinde değişen ifadeleri görmek ve gerekirse ikinci bakış gerektiren durumları fark etmek için kullanabilirler.

### 4.5 Klinik Kurullar
Tümör konseyleri, multidisipliner vaka toplantıları ve kompleks hasta değerlendirmelerinde vaka kanıtlarını organize etmek için kullanabilirler.

### 4.6 Hastane AI / Dijital Sağlık Ekipleri
Güvenli, izlenebilir ve doktor denetimli klinik LLM sistemleri geliştirmek için araştırma prototipi olarak kullanabilirler.

---

## 5. Hedef Dışı Alanlar

DxTrace şu işleri yapmaz:

- Otonom teşhis koymaz.
- Hastaya “şu hastalık var” demez.
- Tedavi önermez.
- İlaç veya doz önermez.
- Tetkik istemez.
- Hastayı kendi başına triyaj yapmaz.
- Doktorun yerine karar vermez.
- Hastaya doğrudan tıbbi tavsiye veren bir chatbot olarak çalışmaz.
- Regülasyon süreci tamamlanmadan tıbbi cihaz gibi konumlandırılmaz.

Kullanılması gereken doğru dil:
- “Doktor değerlendirmesi gerektirebilir.”
- “Klinik dikkat sinyali oluşturur.”
- “Bu bulgu tanısal değildir.”
- “Mevcut verilere göre…”
- “Eksik veri nedeniyle belirsizlik vardır.”
- “Hekim incelemesi gerekir.”

Kullanılmaması gereken dil:
- “Hasta X hastalığına sahiptir.”
- “DxTrace kanseri tespit etti.”
- “Kesin tanı budur.”
- “Tedavi şu olmalıdır.”
- “Bu durum tamamen dışlanmıştır.”
- “Endişe edilecek bir şey yoktur.”

---

## 6. Temel Sistem Konsepti: Clinical Case Brain

DxTrace’in merkezinde **Clinical Case Brain** bulunur.

Bu yapı, hastaya ait tüm klinik verileri tek bir anlamlı vaka hafızasına dönüştürür.

### 6.1 Kanıt Çıkarma ve Confidence Scorer (Güven Puanlayıcı)

Sistem belgelerden klinik gerçekleri çıkarır:

- semptom,
- tarih,
- laboratuvar değeri,
- görüntüleme bulgusu,
- doktor notu,
- önceki tanı,
- ilaç,
- risk faktörü,
- aile öyküsü,
- eksik bilgi,
- çelişkili bilgi.

**Confidence Scorer:** Her kanıtın salt "high", "medium", "low" olarak işaretlenmesi yerine dinamik bir puanlama sistemi çalışır. Verinin yaşı, kaynağın türü, çelişkiyle çakışıp çakışmadığı gibi faktörler değerlendirilerek 0–100 arası bir skor üretilir. Doktor arayüzde en güvenilir kanıtları ilk olarak görür.

Her kanıt şu bilgileri taşımalıdır:

- kanıt ID,
- kaynak ID,
- belge türü,
- tarih,
- kategori,
- değer,
- güven düzeyi ve puanı (Score),
- kaynak metin aralığı.

Örnek Veri Çıktısı:

    {
      "id": "ev_001",
      "category": "symptom",
      "value": "epigastrik ağrı",
      "date": "2026-03-18",
      "sourceId": "note_2026_03_18",
      "confidenceScore": 85,
      "confidence": "high"
    }

### 6.2 Klinik Grafik Yapısı ve Contradiction Engine (Çelişki Motoru)

Kanıtlar sadece liste halinde tutulmaz. Birbirleriyle ilişkilendirilir.

Örneğin:
- epigastrik ağrı → başvuru notu → tarih,
- glukoz yükselişi → laboratuvar trendi → önceki değerlerle karşılaştırma,
- kilo kaybı → semptom notu → takip gereksinimi.

**Contradiction Engine:** Sistemde farklı belgeler arasında oluşabilecek uyumsuzluklar bu motor tarafından denetlenir. Örneğin, bir doktor notunda "hasta sigara içmiyor" yazarken, başka bir notta "aktif sigara kullanımı" geçiyorsa, motor bu zıtlığı yakalar. Her iki verinin güven skorunu düşürerek bunu doktora bir "Çelişki Uyarı Sinyali" olarak gösterir.

### 6.3 Zaman Çizelgesi ve Evidence Timeline Görselleştirmesi

DxTrace, klinik olayları zaman sırasına koyar. 

Düz metin yerine, bu zaman çizelgesi sistem arayüzünde **renk kodlu görsel bir şeride** dönüştürülür:
- **Mavi:** Laboratuvar işlemleri ve test sonuçları
- **Sarı:** Klinik semptomlar ve hasta şikayetleri
- **Kırmızı:** Erken teşhis/dikkat sinyalleri
- **Gri:** Eksik veriler ve belirsizlikler

Örnek (Arka Plandaki Zaman Algısı):

    2025-10: Glukoz normal seyrediyor
    2026-01: Glukoz yükselmeye başlıyor
    2026-02: Epigastrik rahatsızlık kaydı var
    2026-03: İstemsiz kilo kaybı belgeleniyor
    2026-04: Abdomen BT’de belirgin akut patoloji izlenmiyor
    2026-05: DxTrace klinik dikkat sinyali oluşturuyor

Bu sayede doktor, yıllara yayılan örüntüyü tek bir görsel çizelge üzerinde anında yakalayabilir.

### 6.4 Followup Tracker (Takip Takipçisi) ve Eksik Veri Uyarı Bandı

Sistemin arayüzü ve hasta takibi için iki kritik bileşen daha aktiftir:
- **Eksik Veri Uyarı Bandı:** Sayfanın en üstünde sabit kalan bir uyarı şerididir. Örneğin; *"Bu vakada 3 eksik veri var — CA 19-9, Amilaz/Lipaz, Sarılık değerlendirmesi"*. Doktor sayfayı kaydırsa bile bu şerit görünür kalır.
- **Followup Tracker:** Eksik verinin ne olduğunu söylemekle kalmaz; "Bu tetkik istendi mi, ne zaman istendi ve ne kadar süredir bekleniyor?" sorusunu sorarak süreci izler.

---

## 7. LLM Çalışma Prensibi: R.V.R.C.E.

DxTrace’in LLM katmanı şu döngü ile çalışmalıdır:

> **Retrieve → Verify → Reason → Cite → Escalate**

Türkçesi:

> **Getir → Doğrula → Akıl Yürüt → Kaynak Göster → Belirsizliği Yükselt**

### 7.1 Retrieve / Getir
Sistem önce ilgili kanıtları getirir (semptomlar, lab trendleri, eksik veri listesi vb.).

### 7.2 Verify / Doğrula
Getirilen kanıtların gerçekten kaynakta olup olmadığı kontrol edilir (Değer belgede var mı? Tarih doğru mu? Veri güncel/çelişkili mi?).

### 7.3 Reason / Akıl Yürüt
LLM yalnızca doğrulanmış kanıt üzerinden sentez yapar. Sentez yapar ancak kesin teşhis veya tedavi kararı veremez.

### 7.4 Cite / Kaynak Göster
Her klinik cümle bir kaynak ID’ye bağlanmalıdır. Kaynak yoksa cümle olmamalıdır.

### 7.5 Escalate / Belirsizliği Yükselt
Eğer veri eksikse, çelişkiliyse veya klinik risk yüksekse sistem bunu doktora açık şekilde bildirmelidir.

---

## 8. Halüsinasyon Kontrol Sistemi

DxTrace’in en kritik tarafı LLM güvenliğidir.

### 8.1 Closed-Book Mode
LLM kendi genel bilgisinden serbest cevap vermemelidir. Yalnızca sağlanan kanıtlar üzerinden cevap üretmelidir.

### 8.2 No Evidence, No Claim
Kanıt yoksa klinik iddia yoktur.

### 8.3 Cümle Bazlı Kaynak Zorunluluğu
Her klinik cümle kaynakla eşleşmelidir.

### 8.4 Verifier Agent
Ana LLM çıktısından sonra ikinci bir doğrulayıcı katman çalışır. Bu katman uydurma veri, kaynaksız cümle ve tedavi önerisi gibi ihlalleri arar.

### 8.5 Desteksiz Cümle Reddi
Kaynakla eşleşmeyen cümle final cevaptan çıkarılmalıdır.

### 8.6 Eksik Veri Bildirimi
Sistem eksik verileri açıkça belirtmelidir. (Örn: *Mevcut kayıtlarda CA 19-9 sonucu bulunamadı.*)

---

## 9. Erken Teşhis Odağı

DxTrace’in erken teşhis yaklaşımı tanı koymak değil, **örüntü görünürleştirmek** üzerine kuruludur.

Örnek örüntü:

    İstemsiz kilo kaybı
    + yeni glukoz bozukluğu
    + epigastrik ağrı
    + önceki görüntülemede belirgin akut bulgu olmaması
    = doktor incelemesi gerektirebilecek klinik dikkat sinyali

Doğru çıktı:

    Belgelenmiş istemsiz kilo kaybı, yeni glukoz bozukluğu ve epigastrik ağrı birlikte değerlendirildiğinde gastrointestinal veya pankreatobiliyer nedenler açısından hekim incelemesi gerektirebilecek bir klinik dikkat sinyali oluşmaktadır. Bu çıktı tanısal değildir.

---

## 10. Güvenlik Modeli ve Doktor Onay Akışı

DxTrace şu güvenlik ilkeleriyle çalışmalıdır:

- Doktor her zaman karar vericidir.
- AI yalnızca destek sağlar.
- Her çıktı kaynaklıdır.
- Her çıktı denetlenebilir olmalıdır.
- Eksik veri açıkça belirtilmelidir.
- Kesin tanı dili kullanılmamalıdır.
- Gerçek hasta verisi kullanılmamalıdır (Öğrenci MVP'si için).

**Doktor Onay Akışı (Human-in-the-Loop):**
Sistemin en hayati güvenlik adımlarından biri onay mekanizmasıdır. AI bir çıktı veya özet ürettikten sonra, doktorun bu çıktıya yönelik "Onayladım / Düzenledim / Reddettim" aksiyonunu alabileceği bir arayüz sunulur. Bu etkileşimler doğrudan `audit log` yapısına kaydedilir, böylece model ileride hangi veri setlerinin klinik olarak güvenilir bulunduğunu anlayabilir.

---

## 11. Öğrenci MVP Kapsamı

Öğrenciden beklenen ilk prototip tam bir medikal ürün değildir. Beklenen şey güvenli ve doğru mimariye sahip temel bir yazılım iskeletidir.

MVP şu özellikleri içermelidir:

- Node.js proje kurulumu ve Express API,
- sentetik vaka verisi yönetimi,
- evidence store ve timeline engine (görsel destekli),
- early signal engine ve missing data detector (uyarı bandı dahil),
- contradiction engine ve confidence scorer altyapısı,
- followup tracker (takip bekleyen testler için),
- doctor approval flow (onay mekanizması ve loglama),
- mock LLM response ve hallucination guard (verifier agent),
- audit log, README.md, idea.md, task.md, knowledge-base.md ve temel testler.

---

## 12. Yol Haritası

### Phase 0: Proje Temeli
- Klasör yapısı, package.json, README, idea.md, task.md, knowledge-base.md
- Sentetik veriler ve Express server kurulumu

### Phase 1: Kanıta Kilitli Soru-Cevap & Güven Puanlama
- Ask-case endpoint
- Kanıt doğrulama ve kaynaksız iddia reddi (Verifier)
- Confidence Scorer entegrasyonu (0-100 puanlama)

### Phase 2: Timeline Görselleştirmesi ve Lab Trendleri
- Klinik olayları tarihe göre sıralama
- Görsel, renk kodlu Evidence Timeline şeridinin UI üzerine eklenmesi

### Phase 3: Çelişki Motoru ve Takip Modülleri
- Contradiction Engine ile uyumsuz verilerin yakalanması
- Followup Tracker ile bekleyen tetkiklerin hesaplanması
- Eksik Veri Uyarı Bandı bileşeninin geliştirilmesi

### Phase 4: Erken Sinyal Motoru ve Doktor Onay Akışı
- Basit kural tabanlı klinik dikkat sinyali oluşturma
- Arayüze Onayladım/Düzenledim/Reddettim butonlarının eklenmesi ve Audit Log'a yazılması

### Phase 5: Kılavuz Yardımcısı ve Konsültasyon
- Sentetik eğitim protokolü
- Uzman hekime gönderilecek kaynaklı özet taslağı üretimi

### Phase 6: Doktor Paneli
- Vaka özeti, görsel timeline, evidence panel ve erken sinyal paneli

### Phase 7: Değerlendirme Altyapısı
- Hallucination, citation coverage, determinism ve missing data testleri

---

## 13. Final Konumlandırma

DxTrace bir AI doktor değildir.

DxTrace, doktorların hasta verilerini daha hızlı anlamasını, eksik veya çelişkili verileri anında fark etmesini, kanıtları güvenilirlik puanına göre filtrelemesini ve tüm AI çıktılarının kaynak izini **onaylayarak/denetleyerek** kontrol edebilmesini sağlayan kanıta kilitli klinik LLM platformudur.