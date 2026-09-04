# OGameX Auto Expedition v1.1.0

## Sağ kaynak paneli

Gezegen listesinin yerinde kaynak özeti gösterilir; Normal liste düğmesi eski görünümü geri getirir. Sayfaya gömülü başlangıç kaynakları yalnızca seçili gezegen kimliğiyle eşleştiğinde kaydedilir; JavaScript metni çalıştırılmaz. Üretim, araç ipucundaki saatlik üretimden hesaplanır. ≈ tahmin anlamındadır; harcamalar ve filo getirileri sonraki ziyarette düzelir. Depo üstündeki mevcut kaynak silinmez; 24 saatten eski kayıt ilerletilmez. Diğer gezegenleri ziyaret ederek veya mevcut kaynak turuyla kayıtları güncelleyin. Arka planda gezegen değiştiren istek gönderilmez. Ay kaynakları bilinmiyor olarak kalır. Canlı oyunda görsel doğrulama yapılmadı.

## Köşede sabit hedef listesi

Oyuncu kartındaki veya Gezegen defterindeki “Hedef olarak sabitle” düğmesini kullanın. Sol alt köşede oyuncunun kayıtlı koordinatları kalıcı olarak görünür. Koordinata tek tık ilgili Galaksi sistemini açar; saldırı veya casusluk göndermez. Liste tarama kayıtlarıyla güncellenir; tüm gezegenlerin bulunmuş olduğu garanti edilmez. Ay simgesi yalnızca kayıttaki ay bilgisini gösterir, ayrı bir ay görev düğmesi değildir. Liste −/+ ile küçültülüp açılabilir. Keşif otomasyonu sekmesinde konuma gitme engellenir; başka oyun sekmesini kullanın.

## Kontrol merkezi

Oyun ekranının sol altındaki **Kontrol merkezi**; çoklu oyuncu takibi, gezegen/isim/ittifak/ay/durum değişiklikleri, istatistik farkları, keşif raporu özeti, kaynak tablosu, JSON yedekleme/geri yükleme ve eski kayıt temizleme araçlarını içerir.

Keşif raporları yalnızca mesaj sayfasında tarayıcıya yüklenmiş metinlerden alınır. Görülmeyen raporlar veya açılmamış istatistik kategorileri tahmin edilmez.

## Arka planda dönüş kontrolü

- Otomasyon sekmesi açık kaldığı sürece başında olmanız gerekmez.
- Uzantı sekmeden düzenli canlılık sinyali alır. Arka plan sekmesi tarayıcı tarafından yavaşlatılırsa kontrollü olarak yeniler.
- Çoklu Keşif sayfası en geç yaklaşık bir dakikalık aralıklarla yeniden doğrulanır. Filo satırı kaybolup boş keşif slotu doğrulanmadan gönderim yapılmaz.
- Oyunun “filo gönderildi” bildirimi tek başına başarı kanıtı sayılmaz; yeni filo satırları kontrol edilir.

Oyunun oturumu kapanırsa, tarayıcı tamamen kapatılırsa veya otomasyon sekmesi kapatılırsa uzantı gönderim yapamaz.

## Hedef oyuncu istatistikleri

İstatistikler sayfasında oyuncu kategorisini seçin. Puan, Bina, Araştırma, Filo ve Savunma sekmelerini ziyaret ettikçe, o anda yüklenen sayfadaki oyuncuların değerleri ve sıralamaları kaydedilir. Kayıt için tablonun 1,2 saniye kararlı kalması gerekir; normalde birkaç saniye içinde sayfa altında OGX kayıt mesajı görünür. Tüm sıralama sayfaları veya kategoriler otomatik dolaşılmaz.

Veriler sunucu + oyuncu kimliği + kategori bazında ayrılır; oyuncu adlarıyla yaklaşık eşleştirme yapılmaz. İttifak kategorisi kaydedilmez. Kategori/sayfa değişiminde eski tablo düğümleri yenilenmeden veri kaydedilmez. Arayüz tablosu yerinde güncellenirse kayıt güvenlik için bekleyebilir; o durumda sayfayı yenileyin.

Galaksi veya İstatistikler ekranında oyuncu adının üzerine gelince istatistikler ve bilinen gezegenler gösterilir. Gezegen defteri > Hedef oyuncu bölümünde de aynı özet vardır. İstatistikler ekranında görülmüş ama gezegenleri taranmamış oyuncular da aranabilir. Her kategori kendi kayıt tarihini gösterir. Okunmamış veri sıfır sayılmaz.

**Filo istatistiği gemi adedi değildir:** Oyun birimi ayrıca doğrulanmadığından değer aynen gösterilir. Gemi türleri, kesin gemi adedi veya gezegenlere dağılım bu verilerden çıkarılmaz. İstatistik sayfasını yeni sekmede açan bağlantı mevcuttur. Bu sürüm pasif veri okuma ekler, gizli bilgi veya casusluk raporu toplamaz.

Sözdizimi, kategori ayırma, ittifak dışlama, sıfır değerini koruma, puan değişimi satırını dışlama ve eski tabloyu yanlış kategoriye kaydetmeme için taklit DOM testleri vardır. Gerçek oyunda canlı UI doğrulaması henüz yapılmadı.

## Tıklanabilir oyuncu kartı ve sabit hedef

- Galaksi'de oyuncu adının üzerine gelin. Kartın içine fareyi taşıyıp koordinat düğmelerine tıklayabilirsiniz; kart hemen kapanmaz.
- **Bu oyuncuyu hedef olarak sabitle** oyuncuyu sunucu bazında yerel olarak hatırlar. **Gezegen defteri > Hedef oyuncu** bölümünden kayıtlı oyuncuları adla arayıp seçebilirsiniz. Hedefi kaldırmak gezegen kayıtlarını silmez.
- **Konuma git** ilgili galaksi ve sistemi oyun kontrolleriyle açar; hedef gezegen satırını altı saniye vurgular. Casusluk/saldırı/filo göndermez. Galaksi dışında, oyunun kendi Galaksi bağlantısıyla önce ekran açılır.
- Devam eden tarama veya aynı sekmede keşif varsa konuma gitme engellenir. Önce durdurun veya keşif için ayrı sekme kullanın.
- Listede yalnızca bu sunucuda taranmış/kaydedilmiş gezegenler vardır. Tam evren taraması bile geçmiş kayıtların güncelliğini garanti etmez; son görülme tarihlerini kontrol edin. Görülmemiş veya silinmiş gezegenlerin varlığı hakkında iddia edilmez.
- JS sözdizimi ve mevcut otomatik testler kontrol edilir; kart etkileşimi ve gerçek oyunda konuma gitme canlı doğrulama gerektirir.

## Otomatik galaksi ve kaynak taraması

Oyun sayfasının sol altındaki **Otomatik tarama** düğmesini açın.

### Galaksi: 1 → son sistem

Galaksi ekranında taranacak ilk/son galaksiyi ve 1–60 saniye adım beklemesini seçin. Sistem 1'den başlar; sistemler bittikçe sonraki galaksiye geçer. Üst sınırlar `#galaxyInput` ve `#systemInput` alanlarının `max-value` değerlerinden okunur. Görüntülerdeki 6 galaksi ve 499 sistem için toplam 2994 sistem taranır: 1:1 → 1:499 → 2:1 → … → 6:499. Hızlı mod 1 saniye bekleme ve 0,5 saniye yeni tablo doğrulaması kullanır. Oyun yavaşsa beklemeyi artırın. Galaksi taraması mevcut oyun ekranındaki Git düğmesini kullanır; doğrudan API isteği, casusluk veya saldırı göndermez.

Liste yenilenmesi ve satırların kendi koordinatları doğrulanmadan sistem tamamlandı sayılmaz. Boş sistem için de yeni liste düğümleri beklenir. 25 saniyede yükleme doğrulanmazsa hata ile durur; ilerleme göstergesinde son tamamlanan sistem kalır. Yeniden Başlat düğmesi 1'den başlar. Aynı tarama sekmesinin normal yenilenmesinde son tamamlanan sistemden devam edilir; tarayıcı tamamen kapatılırsa durur.

### Kendi gezegenlerinin kaynak turu

Tur sonunda dönülecek gezegeni seçin, **Tüm gezegenlerin kaynaklarını güncelle** düğmesine basın. Liste yalnızca `#other-planets a.planet-select` bağlantılarından alınır; aylar dahil değildir. Her gezegenin Genel Bakış sayfası sırayla açılır; sayfa adresi ve Genel Bakış koordinatı hedef gezegenle eşleştirilir. Kaynak sayaçları okunup kaydedilir; en az 5 saniye beklenerek sonraki gezegene geçilir. Sonunda seçtiğiniz dönüş gezegenine gidilir. Gezegen defterini açarak tabloyu ve toplamı görebilirsiniz. Bu, farklı saniyelerde alınmış son kayıtların toplamıdır; eşzamanlı canlı toplam değildir.

### Güvenlik

- İki tarama aynı anda çalışmaz. Keşif gönderimi belirsiz veya devam ediyorsa tarama başlamaz.
- Başlangıçta keşif otomasyonu durdurulur; tarama bitince doğru gezegende kendiniz yeniden başlatın. Otomatik yeniden başlatma yoktur.
- Tarama esnasında aynı sekmede gezinmeyin. Galaksi/sistem veya hedef kaynak sayfası değişirse durur.
- **Taramayı durdur** bir sonraki eylemi iptal eder; gönderilmiş bir sayfa isteğini geri alamaz. Popup'taki **Tüm otomasyonu durdur** taramayı da durdurur.
- Sekme kapatılınca, tarayıcı yeniden açılınca veya üç dakika ilerleme olmayınca tarama durur. Son durum yerel depoda saklanır.
- Tarama boyunca uyku engelleme tercihi uygulanır; bu kesin zamanlama veya kesintisiz çalışma garantisi değildir.
- Önce birkaç sistemi gözlemleyerek deneyin. Sözdizimi ve taklit Chrome API testleri geçti; gerçek sunucuda 1–499 turu veya tüm kaynak turu çalıştırılmadı.

## Oyuncu kartı ve kaynak defteri

- Galaksi ekranında gezindikçe ekranda yüklenen oyuncu/gezegen satırları yerel olarak kaydedilir. Oyuncu adının üzerine gelince aynı sunucuda o oyuncu kimliği için görülen gezegenler ve son görülme tarihleri gösterilir. Oyunun mevcut oyuncu tıklama davranışı değiştirilmez.
- Sadece görülen gezegenler listelenir; tüm evren taranmaz, ağ isteği veya casusluk gönderimi yapılmaz. Kayıtlı konum başka oyuncuda görülürse yeni sahibiyle güncellenir. Tekrar ziyaret edilmeyen kayıtlar eski olabilir.
- Sol alttaki **Gezegen defteri** düğmesini açın. Oyunda kendi gezegeninize geçtikten sonra defterde aynı gezegeni seçip **Ekrandaki kaynakları bu gezegene kaydet** düğmesine basın. Bu seçim oyundaki gezegeni değiştirmez. Aktif gezegen işareti doğrulanmadığı için manuel eşleştirme ve onay kullanılır.
- Kaynaklar `#metal-amount`, `#crystal-amount`, `#deuterium-amount` sayaçlarından okunur; tooltip içinde kalmış eski sayılar kullanılmaz.
- Kayıtlar sunucu ve gezegen kimliğiyle ayrılır. Tablo yalnızca mevcut hesapta kenar çubuğunda listelenen gezegenleri gösterir. Ay kaynakları dahil değildir. Bilinmeyen miktar sıfır sayılmaz; yalnızca kayıtlı gezegenlerin toplamı gösterilir. Toplam canlı değildir, farklı tarihlerdeki kayıtların toplamıdır.
- Kaynak kayıtları JSON indirilebilir. Keşif otomasyonu kapalıyken de defter ve oyuncu kartı çalışır. Keşif otomasyonunun çalıştığı sekmede gezegen değiştirmeyin; bunun için ayrı oyun sekmesi kullanın.

## Yükleme / güncelleme

1. Önce eski otomasyonu durdurun; aynı anda iki sürümü çalıştırmayın.
2. ZIP'i çıkarın. Chrome/Edge uzantılar sayfasında Geliştirici modu > Paketlenmemiş öğe yükle ile klasörü seçin; mevcut klasörü güncellediyseniz uzantıyı yeniden yükleyin.
3. Yeni `power` ve `alarms` izinlerini onaylayın. OGameX sekmesini yenileyin.
4. Doğru hesap ve gezegende `/fleet/autoexpedition` adresini açın. Popup'tan ayarları kontrol edip otomasyonu başlatın.

İlk yüklemede veya tarayıcı yeniden açıldığında doğru sekmede Başlat'a basın. Birden fazla sekme aynı anda gönderemez. Ayarlar tarayıcı profilinde, loglar yalnızca yerel uzantı deposunda tutulur. Eski sürümü tamamen kaldırmak önceki logları silebilir; önce indirin.

## Manuel paylaşım yardımcısı

- Uzantı penceresine herkese açık, `https://` ile başlayan paket bağlantısını ve mesajınızı yazın. Bilgisayarınızdaki ZIP yolu başka oyuncularda çalışmaz; önce dosyayı güvenilir bir dosya paylaşım hizmetinde yayımlayın.
- **Mesajı kopyala ve sohbeti aç** düğmesi metni panoya kopyalar ve açık OGameX sekmesinde bulabildiği mesaj/sohbet sayfasını açar.
- Yardımcı alıcı seçmez, oyuncu listesini dolaşmaz ve mesajı göndermez. Alıcıyı seçme, yapıştırma ve son gönderme onayı sizdedir.

## Yeni güvenilirlik özellikleri

- Son 500 log kaydı sayfa yenilense bile korunur. Popup > Kalıcı logları indir ile JSON dışa aktarılır.
- Otomasyon çalışırken `chrome.power` sistem uyku engeli istenir; ekranın kapanmasına izin verilir. Durdurulduğunda veya sekme kapandığında kaldırılır.
- Dakikalık arka plan alarmı otomasyon sekmesini kontrol eder. Sekmenin otomatik bellekten atılması engellenir. Bu, tüm tarayıcı kısıtlamalarının aşılacağı garantisi değildir.
- Toparlanma açıkken en geç beş dakikada bir bağlı Çoklu Keşif sekmesi normal yenilenir. Bilinen dönüş sayaçları daha erken kontrol planlayabilir. Gönderim sırasında 90 saniyelik yenileme engeli vardır. Alarm gecikebilir; tam saniyeli zamanlama garantisi yoktur.
- Loglar ve bekleyen gönderim kaydı yenilemeden önce depolanır. Belirsiz/kısmi gönderimde tekrar tıklanmaz. Yeni filo kimlikleri yeterli olduğunda kilit otomatik çözülür; aksi halde kullanıcı filo hareketlerini inceleyip kilidi kaldırmalıdır.
- Hazırlık hataları sınırlı exponential backoff ile denenir. Deneme sınırı dolunca durulur; sayfa yenilemek bu kilidi kaldırmaz.
- Kapasite sayacı okunamıyorsa gönderilmez. Gemiler oyunun Tümünü seç düğmesiyle dağıtılır.

## Sınırlar

- Tarayıcı açık, bağlantı ve oturum geçerli olmalı. Bilgisayarın kapanması, kapak kapatma, zorunlu sistem uykusu veya ağ kesintisini önleyemez.
- Hesap/gezegen değiştirirken otomasyonu durdurun. Adres değişikliği arka plan kontrolünde otomasyonu ayırır. Aynı adres altında yapılan oyun içi gezegen değişikliğini güvenilir biçimde ayırt eden selector henüz yoktur.
- Bu sürüm eski sürümün varsayımsal yumuşak yenilemesini kullanmaz: toparlanma **gerçek sekme yenilemesi** yapar. İsterseniz popup'tan kapatabilirsiniz; bu durumda canlı DOM güncellemelerine bağımlıdır.
- Oyuncu kartı, manuel kaynak defteri ve otomatik kaynak turu dahildir. Otomatik turda hedef adresi ve Genel Bakış koordinatı doğrulanır; günlük gezinmede otomatik kaynak kaydı yapılmaz.
- Canlı sunucuda gece boyunca test edilmedi. Önce gözetim altında bir dönüş/gönderim döngüsü deneyin.

## Doğrulama

JS sözdizimi kontrolleri ve Node tabanlı taklit Chrome API testleri yapılır. Testler slot hesabı, tek sekme sahipliği, log sınırı, belirsiz gönderim kilidi, kısmi doğrulama, güvenli yenileme ve güç isteğinin kaldırılmasını kapsar. Gerçek oyun DOM'u ve Chrome uyku davranışı canlı test gerektirir.

API belgeleri: [Chrome Power](https://developer.chrome.com/docs/extensions/reference/api/power), [Chrome Alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms).
