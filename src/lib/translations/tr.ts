import { createTranslationDictionary } from './createTranslationDictionary';

export const trTree = {
    title: 'Türkçe',
    app: {
        version: 'Uygulama sürümü {{version}}'
    },
    bloodborne: {
        meta: {
            titleLabel: 'Oyun Başlığı',
            titleIdLabel: 'Title ID',
            contentIdLabel: 'Content ID',
            appVerLabel: 'Oyun Sürümü'
        },
        info: {
            eyebrow: 'Oyun Bilgisi',
            title: 'Bloodborne Detayları',
            description: 'Kaydedilen Bloodborne yapılandırmasından okunan launcher metadata bilgileri.',
            installPathLabel: 'Kurulum Yolu',
            unavailable: 'Yok'
        }
    },
    virtualKeyboard: {
        title: 'Gamepad Klavyesi',
        space: 'Boşluk',
        backspace: 'Sil',
        clear: 'Temizle',
        paste: 'Yapıştır',
        done: 'Onayla'
    },
    splash: {
        eyebrow: 'LanternLauncher',
        title: 'Launcher hazırlanıyor',
        loadingConfig: 'Yapılandırma denetleniyor',
        checkingSettings: 'Ayarlar denetleniyor',
        checkingShadps4Availability: 'shadPS4 denetleniyor',
        preparingShadps4UserData: 'shadPS4 kullanıcı verileri hazırlanıyor',
        initializingShadps4Runtime: 'shadPS4 ilk kez sessizce başlatılıyor',
        downloadingShadps4Patches: "Patch'ler indiriliyor",
        checkingShadps4Release: 'shadPS4 sürümü denetleniyor',
        preparingShadps4: 'shadPS4 hazırlanıyor',
        downloadingShadps4: 'shadPS4 indiriliyor',
        extractingShadps4: 'shadPS4 arşivi açılıyor',
        finalizingShadps4: 'shadPS4 kurulumu tamamlanıyor',
        usingCachedShadps4: 'Önbellekteki shadPS4 kullanılıyor',
        needsBloodbornePath: 'Devam etmek için Bloodborne klasörünü seç.',
        pickFolder: 'Bloodborne klasörünü seç',
        selectedFolder: 'Seçili klasör',
        noFolderSelected: 'Henüz bir klasör seçilmedi.',
        allowedLabels: 'Geçerli title ID',
        invalidTitleId: 'Seçilen klasör geçerli bir Bloodborne title ID değil.',
        missingEboot: 'Seçilen klasörde eboot.bin bulunamadı.',
        pathNotFound: 'Kayıtlı klasör bulunamadı.',
        notDirectory: 'Seçilen yol bir klasör değil.',
        openingMainMenu: 'Ana menü açılıyor',
        selectingFolder: 'Klasör seçici açılıyor',
        validatingBloodbornePath: 'Bloodborne klasörü doğrulanıyor',
        savingLauncherConfig: 'Launcher ayarları kaydediliyor',
        localeLabel: 'Dil',
        validationReady: 'Bloodborne bulundu, ana menü hazırlanıyor.',
        platformUnavailable: 'Electron köprüsü bulunamadı.',
        unexpectedError: 'Beklenmeyen bir hata oluştu.'
    },
    menu: {
        main: {
            start: 'Oyunu Başlat',
            savedGames: 'Kayıtlı Oyunlar',
            modManager: 'Mod Yöneticisi',
            exit: 'Çıkış'
        },
        system: {
            title: 'Sistem Ayarları',
            general: {
                $: 'Genel',
                consoleLanguage: 'Konsol Dili',
                discordRpc: 'Discord Rich Presence',
                trophyKey: 'Kupa Anahtarı',
                trophyPopupDisabled: 'Kupa Bildirimlerini Kapat',
                trophyPopupSide: 'Bildirim Konumu',
                trophyPopupDuration: 'Bildirim Süresi',
                volume: 'Ses Düzeyi',
                deleteShaderCache: 'Shader Önbelleğini Sil'
            },
            graphics: {
                $: 'Grafik',
                presets: {
                    $: 'Hazır Ayar',
                    ultraQuality: 'Ultra Kalite',
                    quality: 'Kalite',
                    performance: 'Performans',
                    ultraPerformance: 'Ultra Performans'
                },
                custom: {
                    $: 'Özel',
                    readbacks: 'Readbacks',
                    resolution: 'Çözünürlük',
                    extraDmem: 'Ek DMEM',
                    pipelineCache: 'Pipeline Cache'
                },
                directMemoryAccess: 'Direct Memory Access'
            },
            patches: "Patch'ler",
            emulator: 'Emülatör',
            controls: 'Kontroller',
            interface: 'Arayüz'
        },
        state: {
            active: 'Seçili',
            enabled: 'Açık',
            disabled: 'Kapalı',
            configured: 'Kaydedildi',
            notConfigured: 'Boş',
            confirmDelete: 'Sil',
            cancel: 'İptal',
            trophySide: {
                right: 'Sağ',
                left: 'Sol',
                topLeft: 'Sol üst',
                topRight: 'Sağ üst',
                bottomLeft: 'Sol alt',
                bottomRight: 'Sağ alt'
            },
            consoleLanguage: {
                japanese: 'Japonca',
                englishUs: 'İngilizce (ABD)',
                french: 'Fransızca',
                spanish: 'İspanyolca',
                german: 'Almanca',
                italian: 'İtalyanca',
                dutch: 'Felemenkçe',
                portuguesePt: 'Portekizce (Portekiz)',
                russian: 'Rusça',
                korean: 'Korece',
                chineseTraditional: 'Çince (Geleneksel)',
                chineseSimplified: 'Çince (Basitleştirilmiş)',
                finnish: 'Fince',
                swedish: 'İsveççe',
                danish: 'Danca',
                norwegian: 'Norveççe',
                polish: 'Lehçe',
                portugueseBr: 'Portekizce (Brezilya)',
                englishGb: 'İngilizce (Birleşik Krallık)',
                turkish: 'Türkçe',
                spanishLa: 'İspanyolca (Latin Amerika)',
                arabic: 'Arapça',
                frenchCa: 'Fransızca (Kanada)',
                czech: 'Çekçe',
                hungarian: 'Macarca',
                greek: 'Yunanca',
                romanian: 'Rumence',
                thai: 'Tayca',
                vietnamese: 'Vietnamca',
                indonesian: 'Endonezce',
                ukrainian: 'Ukraynaca'
            },
            readbacks: {
                relaxed: 'Relaxed'
            },
            resolution1080p: '1080p',
            resolution1440p: '1440p',
            resolution2160p: '2160p',
            extraDmem2048: '2048 MB',
            extraDmem4096: '4096 MB',
            extraDmem8196: '8196 MB',
            extraDmem12288: '12288 MB',
            extraDmem16384: '16384 MB'
        },
        description: {
            graphics: {
                presets: {
                    ultraQuality:
                        'Ultra Kalite, üst düzey sistemler için optimize edilmiş hazır ayardır. 4K iç işleme kalitesini hedefler; keskinlik, materyal netliği ve genel sahne doğruluğu önceliklendirilir.',
                    quality:
                        'Kalite, orta-üst düzey sistemler için optimize edilmiş hazır ayardır. 1440p iç işleme kalitesi sunar ve görüntü kalitesi ile performans arasında dengeli bir profil hedefler.\n\nNot: Ultra Kalite dışında, monitör çözünürlüğünüzün altında bir hedef seçildiğinde FSR keskinleştirme otomatik olarak açık tutulur.',
                    performance:
                        'Performans, giriş-orta düzey sistemler için optimize edilmiş hazır ayardır. 1080p iç işleme kalitesi sunar ve çoğu sahnede orijinal PS4 görüntüsünden daha temiz bir sonuç verir.\n\nNot: Ultra Kalite dışında, monitör çözünürlüğünüzün altında bir hedef seçildiğinde FSR keskinleştirme otomatik olarak açık tutulur.',
                    ultraPerformance:
                        'Ultra Performans, giriş düzeyi sistemler için optimize edilmiş hazır ayardır. 1080p iç işleme kalitesi korunur ancak performans kazanımı için bazı sahne efektleri kısıtlanır; buna rağmen fark çoğu durumda gözle zor fark edilir.\n\nNot: Ultra Kalite dışında, monitör çözünürlüğünüzün altında bir hedef seçildiğinde FSR keskinleştirme otomatik olarak açık tutulur.'
                },
                custom: {
                    $: 'Özel mod, hazır ayarların dışına çıkarak iç işleme kalitesi, ek bellek kullanımı ve shader davranışı gibi ayarları elle belirlemenize olanak tanır.',
                    readbacks:
                        "Readbacks, geri işleme kalitesini belirler. Önerilen varsayılan seçenek Relaxed'dir ve Bloodborne için en dengeli sonuç genellikle bu modda alınır. Relaxed etkin olduğunda Vertex Explosion modu devre dışı kalır.",
                    resolution:
                        'Çözünürlük, oyunun iç işleme hedefini belirler. En tutarlı sonuç için genellikle monitör çözünürlüğünüze en yakın seçeneğin seçilmesi önerilir.',
                    extraDmem:
                        'Ek DMEM, emülatöre sistem belleğinden daha geniş bir çalışma alanı tanır. 1080p için 2048 MB, daha yüksek hedefler için ise genellikle 4096 MB yeterlidir; daha yüksek değerler yalnızca gerçekten ihtiyaç duyulduğunda tercih edilmelidir.',
                    pipelineCache:
                        "Pipeline Cache, shader derlemesi sırasında oluşan anlık takılmaları azaltmak için derlenen shader'ları diskte saklar. Genellikle açık bırakılır; yalnızca yavaş bir HDD kullanıyorsanız kapatmak mantıklı olabilir."
                },
                directMemoryAccess:
                    'DMA, verinin GPU tarafında nasıl erişildiğini değiştirir. Standart Bloodborne oynanışında çoğu zaman gerekli değildir; ancak Bloodborne Remaster gibi modlarda hem performans hem de görüntü tutarlılığı açısından fayda sağlayabilir.'
            },
            patches:
                "Bloodborne patch'lerini yönetin. Patch'ler oyunun 1.09 sürümü için geçerlidir ve seçilen hazır ayarlara göre daha sonra otomatik öneri sistemiyle ilişkilendirilebilir.",
            emulator:
                'Launcher tarafından kullanılan etkin shadPS4 sürümünü, release kanalını, çalıştırılabilir dosya yolunu ve GitHub kaynağını görüntüleyin.',
            general:
                'Bloodborne için oyuna özel shadPS4 genel ayarlarını, kupa bildirimlerini, ses düzeyini ve shader önbelleğini yönetin.'
        }
    },
    generalSettings: {
        title: 'Genel Ayarlar',
        description:
            'Bu ayarlar Bloodborne özel yapılandırma dosyasına yazılır. Global emülatör ayarlarına dokunmadan yalnızca bu oyun için davranışı değiştirir.',
        consoleLanguage: {
            label: 'Konsol Dili',
            description: 'shadPS4 console_language değeridir. Mevcut JSON değeri korunur ve buradan sayısal olarak düzenlenir.'
        },
        discord: {
            label: 'Discord Rich Presence',
            description: 'Oyun çalışırken Discord durum bilgisini etkin tutar.'
        },
        trophy: {
            key: {
                label: 'Kupa Anahtarı',
                placeholder: 'ReleaseTrophyKey',
                prompt: 'ReleaseTrophyKey gir',
                description: 'Kupa anahtarı, oyunda kupaların çalışması için gereklidir. Sahip olduğunuz konsoldan bu anahtarı kopyalayıp yapıştırabilirsiniz.'
            },
            disablePopup: {
                label: 'Kupa Bildirimlerini Kapat',
                description: 'Kupa bildirim penceresini devre dışı bırakır.'
            },
            duration: {
                label: 'Bildirim Süresi',
                description: 'Kupa bildiriminin ekranda ne kadar kalacağını milisaniye cinsinden belirler.'
            },
            side: {
                label: 'Bildirim Konumu',
                description: 'Kupa bildiriminin ekrandaki konumunu belirler.',
                right: 'Sağ',
                left: 'Sol',
                topLeft: 'Sol üst',
                topRight: 'Sağ üst',
                bottomLeft: 'Sol alt',
                bottomRight: 'Sağ alt'
            }
        },
        volume: {
            label: 'Ses Düzeyi',
            description: 'Bloodborne için ses düzeyini belirler. En yüksek değer 200, varsayılan değer ise 100\'dür.'
        },
        shaderCache: {
            description: 'Shader önbelleği klasörünün içeriğini siler. Sonraki açılışta shader\'lar yeniden oluşturulabilir.',
            confirmTitle: 'Shader cache silinsin mi?',
            confirmMessage:
                'Bu işlem shadPS4 shader cache klasörünü temizler. Oyun bir sonraki açılışta shader\'ları yeniden oluşturabilir ve ilk dakikalarda kısa takılmalar yaşanabilir.'
        },
        units: {
            duration: 'ms'
        },
        actions: {
            save: 'Kaydet',
            deleteShaderCache: 'Shader Önbelleğini Sil'
        },
        status: {
            loading: 'Ayarlar okunuyor',
            saving: 'Ayarlar kaydediliyor',
            saved: 'Kaydedildi',
            deletingCache: 'Shader önbelleği siliniyor',
            deletedCache: 'Shader önbelleği silindi',
            failed: 'İşlem başarısız'
        }
    },
    emulator: {
        title: 'shadPS4 Emülatör',
        eyebrow: 'Emülatör Çalışma Ortamı',
        repository: 'Depo',
        update: {
            button: 'Güncelle',
            previewEyebrow: 'Release Changelog',
            previewTitle: 'Güncellemeden önce değişiklikleri incele',
            previewDescription:
                'Lantern, güncelleme başlamadan önce mevcut sürüm ile en güncel release arasındaki commit aralığını gösterebilir.',
            checking: 'GitHub denetleniyor...',
            complete: 'Güncelleme tamamlandı',
            failed: 'Güncelleme başarısız',
            currentVersion: 'Mevcut Sürüm',
            targetVersion: 'Hedef Sürüm',
            commitList: 'Commit Listesi',
            compareLink: 'Compare Aç',
            loadingChangelog: 'GitHub changelog yükleniyor...',
            failedToLoad: 'Changelog şu anda yüklenemedi.',
            upToDate: 'Bu kanal zaten mevcut en güncel release sürümünde.',
            firstInstall: 'Henüz önceki bir shadPS4 sürümü yapılandırılmamış. Onay verirsen etkin kanal için en güncel release indirilecek.',
            noCommits: 'GitHub compare bu güncelleme aralığı için commit listesi döndürmedi.',
            confirmButton: 'Güncellemeyi Başlat'
        },
        labels: {
            channel: 'Kanal',
            version: 'Sürüm',
            commit: 'Commit',
            executable: 'Çalıştırılabilir Dosya',
            status: 'Durum'
        },
        status: {
            available: 'Hazır',
            missing: 'Eksik',
            unavailable: 'Kullanılamaz'
        },
        valueUnavailable: 'Yok',
        description:
            'Lantern, Bloodborne başlatılırken seçili shadPS4 kanalını kullanır. Güncelleme, etkin kanal için en son release sürümünü denetler ve çalıştırılabilir dosya yolunu launcher yapılandırmasıyla senkronize tutar.'
    },
    patch: {
        author: 'Yazar: {{author}}',
        update: {
            button: 'Güncelle',
            channel: 'Kanal: {{channel}}',
            idle: 'Hazır',
            downloading: 'İndiriliyor...',
            writing: 'Yazılıyor...',
            complete: 'Güncel',
            failed: 'Güncelleme başarısız'
        },
        sync: {
            button: 'Senkronize',
            syncing: 'Senkronize ediliyor...',
            complete: 'Senkronize edildi',
            failed: 'Senkronizasyon başarısız'
        },
        search: {
            placeholder: 'Patch ara',
            clear: 'Temizle',
            empty: 'Aramaya uygun patch bulunamadı.',
            emptyTitle: 'Sonuç yok',
            emptyDescription: 'Başka bir anahtar kelime deneyebilir veya aramayı temizleyebilirsin.'
        },
        descriptionUnavailable: 'Bu patch için henüz açıklama yok.',
        'skip-intro': {
            name: 'Girişi atla'
        },
        performance: {
            name: 'Performans patch\'i',
            note: 'Daha iyi performans için oyunun bazı debug parametrelerini değiştirir. Bazı görseller etkilenebilir.'
        },
        'disable-motion-blur': {
            name: 'Motion blur kapat',
            note: 'Motion blur bileşenini devre dışı bırakır. Velomap render\'ını da kapattığı için performans artışı sağlayabilir.'
        },
        'disable-dynamic-light-shadows': {
            name: 'Dinamik ışık gölgelerini kapat',
            note: 'Dinamik ışık gölgelerini kapatır ve yoğun draw call sayısını azaltarak performans artışı sağlayabilir.'
        },
        'disable-chromatic-aberration': {
            name: 'Chromatic aberration kapat'
        },
        'disable-aa': {
            name: 'Anti-aliasing kapat',
            note: 'Anti-aliasing bileşenini devre dışı bırakır.'
        },
        'disable-dof': {
            name: 'Depth of field kapat',
            note: 'Depth of field efektini devre dışı bırakır.'
        },
        'disable-ssao': {
            name: 'SSAO kapat',
            note: 'Screen space ambient occlusion bileşenini devre dışı bırakır.'
        },
        'enable-ssr': {
            name: 'Screen space reflections aç',
            note: 'Performansı düşürür ancak temel oyunda normalde etkin olmayan screen space reflections özelliğini açarak yansıtıcı yüzeylerde daha iyi yansımalar sağlar.'
        },
        'text-scale-50': {
            name: 'Yazı ölçeği %50',
            note: 'Yazıları küçültür ve yüksek çözünürlüklerde daha iyi görünebilir.\nDiğer değerler: 90%:6666663F, 80%:CDCC4C3F, 70%:3333333F, 60%:9A99193F, 50%:0000003F'
        },
        'fmod-crash-fix': {
            name: 'FMOD çökme düzeltmesi',
            note: 'Bazı seslerin çalışmasını istemeden engelleyebilir.'
        },
        'model-lod-lowest': {
            name: 'Model LOD 2 en düşük',
            note: 'Model detayını en düşük seviyeye indirir. Performansı artırır ancak görselleri etkiler.'
        },
        'model-lod-lower': {
            name: 'Model LOD 1 düşük',
            note: 'Model detayını biraz düşürür. Performansı artırır ancak görselleri etkiler.'
        },
        'model-lod-highest': {
            name: 'Model LOD -2 en yüksek',
            note: 'Model detayını en yüksek seviyeye çıkarır. Görselleri etkiler ve daha ağır olabilir.'
        },
        'increased-graphics-heap-sizes': {
            name: 'Graphics heap boyutlarını artır',
            note: 'Grafik heap boyutunu artırarak daha fazla bellek kullanılmasına izin verir. Increased DMEM ile birlikte kullanılmalıdır. 1080p üstü çözünürlük patch\'lerinde bu zaten bulunabilir.'
        },
        'intel-12th-gen-sfx-workaround': {
            name: 'Intel 12. nesil ve üzeri SFX çözümü',
            note: 'Yeni Intel işlemcilerde Windows üzerinde görülen çökme için SFX ile ilgili kodun bir kısmını devre dışı bırakır.'
        },
        'intel-black-tonemap-fix': {
            name: 'Intel siyah tonemap düzeltmesi',
            note: 'Intel CPU kullanırken özellikle DLC bölgelerinde görülen siyah tonemap renklerini düzeltir.'
        },
        'disable-http-requests': {
            name: 'HTTP isteklerini kapat'
        },
        'ds1-like-physics': {
            name: 'DS1 benzeri fizik',
            note: 'Cesetlerin ve bazı nesnelerin daha rahat savrulmasına izin verir.'
        },
        'lower-object-corpse-physics': {
            name: 'Düşük nesne ve ceset fiziği',
            note: 'Cesetlerin oyuncu veya diğer etkilerle daha az hareket etmesini sağlar.'
        },
        'fps-30-plusplus': {
            name: '30 FPS++',
            note: 'Frame skip, vsync ve tearing gibi bazı frame ayarlarını değiştirir. 30 FPS için input gecikmesini iyileştirmeye yardımcı olur.'
        },
        'fps-60-no-deltatime': {
            name: '60 FPS deltatime yok',
            note: 'Yalnızca timestep kullanır, deltatime kullanmaz. Takılma veya FPS düşüşü olduğunda kumaş ve ceset fizikleri zıplamaz; ancak 60 FPS altında oyun hızı yavaşlayabilir.'
        },
        'fps-60-plusplus': {
            name: '60 FPS++',
            note: 'Frame skip, vsync ve tearing gibi bazı frame ayarlarını değiştirir. 60 FPS için input gecikmesini iyileştirmeye yardımcı olur.'
        },
        'fps-90-plusplus': {
            name: '90 FPS++',
            note: '90 FPS için frame ayarlarını değiştirir ve input gecikmesini iyileştirmeye yardımcı olur. Vblank değerini 90 veya üzerine almayı unutmayın.'
        },
        'uncap-fps-plusplus': {
            name: 'FPS kilidini kaldır++',
            note: 'Dalgalanan FPS ile timestep düzeltmeleri değişebileceği için genelde önerilmez. Vblank frekansını artırmayı unutmayın.'
        },
        'restore-debug-menu': {
            name: 'Debug menüyü geri getir',
            note: 'Bu patch, debug font dosyaları gerektirir. Dosyalar yoksa çökme yaşanabilir. Menüye touchpad\'in sol tarafıyla erişilir.'
        },
        'disable-camera-auto-rotation': {
            name: 'Hareketle kameranın otomatik dönmesini kapat',
            note: 'Karakter hareket ederken kameranın otomatik dönmesini kapatır. Manuel kamera ve lock-on çalışmaya devam eder.'
        },
        'increased-camera-distance': {
            name: 'Kamera mesafesini artır',
            note: 'Oyuncu kamerasını karakterden daha uzağa alır.'
        },
        'no-rally-decay': {
            name: 'Rally decay kapat',
            note: 'Rally süresi azalmaz.'
        },
        'disable-rally': {
            name: 'Rally kapat',
            note: 'HP regain yani rally mekaniğini devre dışı bırakır.'
        },
        'player-no-dead': {
            name: 'Oyuncu ölmez',
            note: 'Hasar alırsınız ancak canınız 1 HP\'nin altına düşmez.'
        },
        'player-stealth': {
            name: 'Oyuncu gizli',
            note: 'Düşmanlar saldırılmadıkça sizi görmez veya tepki vermez.'
        },
        'player-silent': {
            name: 'Oyuncu sessiz',
            note: 'Düşmanlar sizi duymaz fakat görmeye devam edebilir.'
        },
        'sensitive-analog-input': {
            name: 'Hassas analog girişi',
            note: 'Normalde koşmak için analog çubuğun yaklaşık %90 itilmesi gerekir. Bu eşiği yaklaşık %70 seviyesine indirir.'
        },
        'unlock-game-region': {
            name: 'Oyun bölgesini aç',
            note: 'Ek dil seçenekleri için oyun bölgesini açar. X ve Circle tuşlarını değiştirmez.'
        },
        'bookmark-and-capture-outputs': {
            name: 'Bookmark ve capture çıktıları'
        },
        'enemy-control': {
            name: 'Düşman kontrolü',
            note: 'Hedeflenen düşmanı kontrol etmek için R3, geri dönmek için L3 kullanılır.'
        },
        'light-grid-1280x800-steamdeck': {
            name: '1280x800 SteamDeck light grid',
            note: 'Light grid draw call sayısını azaltarak performansı artırır. Render çözünürlüğü patch\'i değildir; pencere veya tam ekran çözünürlüğünüzle eşleşen sürümü kullanın.'
        },
        'light-grid-1080p': {
            name: '1080p light grid',
            note: 'Light grid draw call sayısını azaltarak performansı artırır. Render çözünürlüğü patch\'i değildir; pencere veya tam ekran çözünürlüğünüzle eşleşen sürümü kullanın. 1080p light grid, performans patch\'inin içinde de bulunur.'
        },
        'light-grid-1440p': {
            name: '1440p light grid',
            note: 'Light grid draw call sayısını azaltarak performansı artırır. Render çözünürlüğü patch\'i değildir; pencere veya tam ekran çözünürlüğünüzle eşleşen sürümü kullanın.'
        },
        'light-grid-4k': {
            name: '4K light grid',
            note: 'Light grid draw call sayısını azaltarak performansı artırır. Render çözünürlüğü patch\'i değildir; pencere veya tam ekran çözünürlüğünüzle eşleşen sürümü kullanın.'
        },
        'optimal-1080p': {
            name: 'Optimal 1080p',
            note: 'Global 360p, ana render\'lar 1080p olacak şekilde ayarlanır.'
        },
        'resolution-640x360-16-9': {
            name: 'Çözünürlük 640x360 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 640x360 çözünürlük patch\'i.'
        },
        'resolution-960x540-16-9': {
            name: 'Çözünürlük 960x540 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 960x540 çözünürlük patch\'i.'
        },
        'resolution-1280x720-16-9': {
            name: 'Çözünürlük 1280x720 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 1280x720 çözünürlük patch\'i.'
        },
        'resolution-1440x810-16-9': {
            name: 'Çözünürlük 1440x810 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 1440x810 çözünürlük patch\'i.'
        },
        'resolution-1600x900-16-9': {
            name: 'Çözünürlük 1600x900 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 1600x900 çözünürlük patch\'i.'
        },
        'resolution-2560x1440-16-9': {
            name: 'Çözünürlük 2560x1440 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 2560x1440 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-3840x2160-16-9': {
            name: 'Çözünürlük 3840x2160 16:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 3840x2160 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-1280x800-16-10': {
            name: 'Çözünürlük 1280x800 16:10',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 1280x800 çözünürlük patch\'i.'
        },
        'resolution-1920x1200-16-10': {
            name: 'Çözünürlük 1920x1200 16:10',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 1920x1200 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-2560x1600-16-10': {
            name: 'Çözünürlük 2560x1600 16:10',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 2560x1600 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-2560x1080-21-9': {
            name: 'Çözünürlük 2560x1080 21:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 2560x1080 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-3440x1440-21-9': {
            name: 'Çözünürlük 3440x1440 21:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 3440x1440 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-5120x2160-21-9': {
            name: 'Çözünürlük 5120x2160 21:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 5120x2160 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-3840x1080-32-9': {
            name: 'Çözünürlük 3840x1080 32:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 3840x1080 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-5180x1440-32-9': {
            name: 'Çözünürlük 5180x1440 32:9',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 5180x1440 çözünürlük patch\'i. Oyun özel ayarlarında DMEM değerini yaklaşık +8000 MB artırmayı unutmayın.'
        },
        'resolution-1280x960-4-3': {
            name: 'Çözünürlük 1280x960 4:3',
            note: 'Lock-on, düşman ve dost can barı koordinatları düzeltilmiş 1280x960 çözünürlük patch\'i.'
        }
    },
    prompt: {
        select: 'Seç',
        back: 'Geri',
        info: 'Bilgi'
    }
} as const;

export const tr = createTranslationDictionary(trTree);
export type TranslationDictionaryShape = Record<keyof typeof tr, string>;
