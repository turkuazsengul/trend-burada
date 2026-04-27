const MEGA_MENU_CATEGORIES = [
    {
        id: 'kadin',
        label: 'Kadın',
        items: [
            {slug: 'elbise', label: 'Elbise'},
            {slug: 'tisort', label: 'Tişört'},
            {slug: 'gomlek', label: 'Gömlek'},
            {slug: 'pantolon', label: 'Pantolon'},
            {slug: 'ceket', label: 'Ceket'},
            {slug: 'triko', label: 'Triko'}
        ]
    },
    {
        id: 'erkek',
        label: 'Erkek',
        items: [
            {slug: 'erkek-tisort', label: 'Tişört'},
            {slug: 'erkek-gomlek', label: 'Gömlek'},
            {slug: 'jean', label: 'Jean'},
            {slug: 'erkek-pantolon', label: 'Pantolon'},
            {slug: 'sweatshirt', label: 'Sweatshirt'},
            {slug: 'mont', label: 'Mont'}
        ]
    },
    {
        id: 'cocuk',
        label: 'Çocuk',
        items: [
            {slug: 'kiz-cocuk', label: 'Kız Çocuk'},
            {slug: 'erkek-cocuk', label: 'Erkek Çocuk'},
            {slug: 'bebek-giyim', label: 'Bebek Giyim'},
            {slug: 'okul-kombinleri', label: 'Okul Kombinleri'}
        ]
    },
    {
        id: 'ayakkabi',
        label: 'Ayakkabı',
        items: [
            {slug: 'sneaker', label: 'Sneaker'},
            {slug: 'bot', label: 'Bot'},
            {slug: 'topuklu-ayakkabi', label: 'Topuklu Ayakkabı'},
            {slug: 'loafer', label: 'Loafer'},
            {slug: 'sandalet', label: 'Sandalet'}
        ]
    },
    {
        id: 'aksesuar',
        label: 'Aksesuar',
        items: [
            {slug: 'canta', label: 'Çanta'},
            {slug: 'kemer', label: 'Kemer'},
            {slug: 'cuzdan', label: 'Cüzdan'},
            {slug: 'taki', label: 'Takı'},
            {slug: 'sapka', label: 'Şapka'}
        ]
    },
    {
        id: 'spor-giyim',
        label: 'Spor Giyim',
        items: [
            {slug: 'esofman', label: 'Eşofman'},
            {slug: 'tayt', label: 'Tayt'},
            {slug: 'spor-sutyeni', label: 'Spor Sütyeni'},
            {slug: 'hoodie', label: 'Hoodie'},
            {slug: 'kosu-urunleri', label: 'Koşu Ürünleri'}
        ]
    }
];

const CATEGORY_META = {
    elbise: {
        parentId: 'kadin',
        title: 'Kadın Elbise',
        subtitle: 'Gündüzden geceye stilini tamamlayan elbise seçkisi',
        suffixLabel: 'Elbise',
        productWords: ['Midi', 'Maxi', 'Saten', 'Kruvaze', 'Drapeli', 'Askılı'],
        imagePool: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    tisort: {
        parentId: 'kadin',
        title: 'Kadın Tişört',
        subtitle: 'Basic ve statement parçalarla güçlü tişört koleksiyonu',
        suffixLabel: 'Tişört',
        productWords: ['Basic', 'Oversize', 'Crop', 'Ribana', 'Baskılı', 'Modal'],
        imagePool: [
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    gomlek: {
        parentId: 'kadin',
        title: 'Kadın Gömlek',
        subtitle: 'Ofisten hafta sonuna uyum sağlayan gömlek stilleri',
        suffixLabel: 'Gömlek',
        productWords: ['Poplin', 'Oxford', 'Saten', 'Keten', 'Çizgili', 'Oversize'],
        imagePool: [
            'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    pantolon: {
        parentId: 'kadin',
        title: 'Kadın Pantolon',
        subtitle: 'Jean, kumaş ve yüksek bel seçeneklerle modern pantolon koleksiyonu',
        suffixLabel: 'Pantolon',
        productWords: ['Straight', 'Mom Fit', 'Palazzo', 'Kargo', 'Yüksek Bel', 'Kumaş'],
        imagePool: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    ceket: {
        parentId: 'kadin',
        title: 'Kadın Ceket',
        subtitle: 'Katmanlı kombinler için şık ve fonksiyonel ceketler',
        suffixLabel: 'Ceket',
        productWords: ['Blazer', 'Bomber', 'Denim', 'Trençkot', 'Biker', 'Kapitone'],
        imagePool: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    triko: {
        parentId: 'kadin',
        title: 'Kadın Triko',
        subtitle: 'Yumuşak dokulu triko üstlerle mevsime hazır ol',
        suffixLabel: 'Triko',
        productWords: ['Balıkçı Yaka', 'Hırka', 'İnce', 'Fitilli', 'V Yaka', 'Yün Karışımlı'],
        imagePool: [
            'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'erkek-tisort': {
        parentId: 'erkek',
        title: 'Erkek Tişört',
        subtitle: 'Günlük kombinler için modern erkek tişört seçkisi',
        suffixLabel: 'Tişört',
        productWords: ['Basic', 'Polo', 'Oversize', 'Slim Fit', 'Baskılı', 'Çizgili'],
        imagePool: [
            'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'erkek-gomlek': {
        parentId: 'erkek',
        title: 'Erkek Gömlek',
        subtitle: 'Klasikten smart casual çizgiye erkek gömlekleri',
        suffixLabel: 'Gömlek',
        productWords: ['Oxford', 'Poplin', 'Oduncu', 'Slim Fit', 'Keten', 'Çizgili'],
        imagePool: [
            'https://images.unsplash.com/photo-1593032465171-8bd6d6f9f9f0?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1603251579431-8041402bdeda?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    jean: {
        parentId: 'erkek',
        title: 'Erkek Jean',
        subtitle: 'Slim, regular ve relaxed fit jean koleksiyonu',
        suffixLabel: 'Jean',
        productWords: ['Slim Fit', 'Regular Fit', 'Relaxed', 'Straight', 'Taşlanmış', 'Koyu Renk'],
        imagePool: [
            'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'erkek-pantolon': {
        parentId: 'erkek',
        title: 'Erkek Pantolon',
        subtitle: 'Ofis ve günlük kullanım için erkek pantolon modelleri',
        suffixLabel: 'Pantolon',
        productWords: ['Kumaş', 'Chino', 'Jogger', 'Kargo', 'Slim', 'Regular'],
        imagePool: [
            'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    sweatshirt: {
        parentId: 'erkek',
        title: 'Erkek Sweatshirt',
        subtitle: 'Rahat kesim ve sezon renklerinde sweatshirt modelleri',
        suffixLabel: 'Sweatshirt',
        productWords: ['Kapüşonlu', 'Basic', 'Oversize', 'Fermuarlı', 'Baskılı', 'Minimal'],
        imagePool: [
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1618354691341-e851c56960d1?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    mont: {
        parentId: 'erkek',
        title: 'Erkek Mont',
        subtitle: 'Mevsime uygun hafif ve koruyucu mont seçenekleri',
        suffixLabel: 'Mont',
        productWords: ['Şişme', 'Puffer', 'Parka', 'Bomber', 'Kapitone', 'Su Geçirmez'],
        imagePool: [
            'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'kiz-cocuk': {
        parentId: 'cocuk',
        title: 'Kız Çocuk',
        subtitle: 'Renkli ve rahat kız çocuk kombinleri',
        suffixLabel: 'Kız Çocuk',
        productWords: ['Elbise', 'Tişört', 'Tayt', 'Etek', 'Hırka', 'Pijama'],
        imagePool: [
            'https://images.unsplash.com/photo-1519340333755-c0dff8f7c6e2?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1604917018619-6dbdd6f0388a?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'erkek-cocuk': {
        parentId: 'cocuk',
        title: 'Erkek Çocuk',
        subtitle: 'Dinamik ve rahat erkek çocuk ürünleri',
        suffixLabel: 'Erkek Çocuk',
        productWords: ['Tişört', 'Eşofman', 'Şort', 'Gömlek', 'Sweatshirt', 'Takım'],
        imagePool: [
            'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1596159892044-39dcf4b4f8c8?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'bebek-giyim': {
        parentId: 'cocuk',
        title: 'Bebek Giyim',
        subtitle: 'Yumuşak dokulu ve konforlu bebek ürünleri',
        suffixLabel: 'Bebek',
        productWords: ['Body', 'Tulum', 'Zıbın', 'Takım', 'Pijama', 'Hırka'],
        imagePool: [
            'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'okul-kombinleri': {
        parentId: 'cocuk',
        title: 'Okul Kombinleri',
        subtitle: 'Okul günü için pratik ve dayanıklı kombin seçenekleri',
        suffixLabel: 'Okul Kombini',
        productWords: ['Takım', 'Sweatshirt', 'Jean', 'Gömlek', 'Tayt', 'Etek'],
        imagePool: [
            'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    sneaker: {
        parentId: 'ayakkabi',
        title: 'Sneaker',
        subtitle: 'Günlük stile uyumlu sneaker modelleri',
        suffixLabel: 'Sneaker',
        productWords: ['Koşu', 'Günlük', 'Chunky', 'Retro', 'Deri', 'Fileli'],
        imagePool: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    bot: {
        parentId: 'ayakkabi',
        title: 'Bot',
        subtitle: 'Mevsime uygun şık ve dayanıklı bot seçenekleri',
        suffixLabel: 'Bot',
        productWords: ['Chelsea', 'Postal', 'Süet', 'Deri', 'Bağcıklı', 'Kısa'],
        imagePool: [
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'topuklu-ayakkabi': {
        parentId: 'ayakkabi',
        title: 'Topuklu Ayakkabı',
        subtitle: 'Özel gün ve ofis stiline uygun topuklu modeller',
        suffixLabel: 'Topuklu',
        productWords: ['Stiletto', 'Kalın Topuk', 'Bilekten Bağlı', 'Saten', 'Rugan', 'Kısa Topuk'],
        imagePool: [
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    loafer: {
        parentId: 'ayakkabi',
        title: 'Loafer',
        subtitle: 'Günlük ve klasik kombinler için loafer koleksiyonu',
        suffixLabel: 'Loafer',
        productWords: ['Deri', 'Tokalı', 'Süet', 'Klasik', 'Kalın Taban', 'Minimal'],
        imagePool: [
            'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    sandalet: {
        parentId: 'ayakkabi',
        title: 'Sandalet',
        subtitle: 'Yaz sezonuna özel rahat sandalet seçenekleri',
        suffixLabel: 'Sandalet',
        productWords: ['Düz Taban', 'Topuklu', 'Parmak Arası', 'Bantlı', 'Hasır', 'Platform'],
        imagePool: [
            'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    canta: {
        parentId: 'aksesuar',
        title: 'Çanta',
        subtitle: 'Günlük ve özel gün için modern çanta modelleri',
        suffixLabel: 'Çanta',
        productWords: ['Omuz', 'Çapraz', 'Tote', 'Mini', 'Sırt', 'Portföy'],
        imagePool: [
            'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    kemer: {
        parentId: 'aksesuar',
        title: 'Kemer',
        subtitle: 'Kombinleri tamamlayan kemer koleksiyonu',
        suffixLabel: 'Kemer',
        productWords: ['Deri', 'Tokalı', 'Örgü', 'Minimal', 'Kalın', 'İnce'],
        imagePool: [
            'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1617038220299-2cf0f4e4b4a5?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    cuzdan: {
        parentId: 'aksesuar',
        title: 'Cüzdan',
        subtitle: 'Fonksiyonel ve şık cüzdan modelleri',
        suffixLabel: 'Cüzdan',
        productWords: ['Kartlık', 'Mini', 'Deri', 'Zincirli', 'Baskılı', 'Klasik'],
        imagePool: [
            'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    taki: {
        parentId: 'aksesuar',
        title: 'Takı',
        subtitle: 'Minimal ve iddialı takı alternatifleri',
        suffixLabel: 'Takı',
        productWords: ['Kolye', 'Bileklik', 'Küpe', 'Yüzük', 'Set', 'Charm'],
        imagePool: [
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    sapka: {
        parentId: 'aksesuar',
        title: 'Şapka',
        subtitle: 'Stiline karakter katan şapka modelleri',
        suffixLabel: 'Şapka',
        productWords: ['Bucket', 'Baseball', 'Hasır', 'Bere', 'Vizör', 'Fedora'],
        imagePool: [
            'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    esofman: {
        parentId: 'spor-giyim',
        title: 'Eşofman',
        subtitle: 'Antrenman ve günlük kullanım için eşofman ürünleri',
        suffixLabel: 'Eşofman',
        productWords: ['Takım', 'Alt', 'Üst', 'Dar Paça', 'Bol Kesim', 'Nefes Alan'],
        imagePool: [
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    tayt: {
        parentId: 'spor-giyim',
        title: 'Tayt',
        subtitle: 'Esnek yapılı spor tayt modelleri',
        suffixLabel: 'Tayt',
        productWords: ['Yüksek Bel', 'Dikişsiz', 'Performans', 'Koşu', 'Yoga', 'Toparlayıcı'],
        imagePool: [
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'spor-sutyeni': {
        parentId: 'spor-giyim',
        title: 'Spor Sütyeni',
        subtitle: 'Destek seviyesi farklı spor sütyeni seçenekleri',
        suffixLabel: 'Spor Sütyeni',
        productWords: ['Orta Destek', 'Yüksek Destek', 'Dikişsiz', 'Çapraz Askı', 'Nefes Alan', 'Soft'],
        imagePool: [
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1506629905607-d9f0d6d8ef26?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    hoodie: {
        parentId: 'spor-giyim',
        title: 'Hoodie',
        subtitle: 'Spor ve günlük stile uyumlu hoodie modelleri',
        suffixLabel: 'Hoodie',
        productWords: ['Kapüşonlu', 'Fermuarlı', 'Oversize', 'Basic', 'Polar', 'Nakışlı'],
        imagePool: [
            'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1800&q=90'
        ]
    },
    'kosu-urunleri': {
        parentId: 'spor-giyim',
        title: 'Koşu Ürünleri',
        subtitle: 'Koşu performansını artıran ürün koleksiyonu',
        suffixLabel: 'Koşu Ürünü',
        productWords: ['Koşu Tişörtü', 'Koşu Şortu', 'Rüzgarlık', 'Performans Tayt', 'Nefes Alan', 'Reflektörlü'],
        imagePool: [
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1800&q=90',
            'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1800&q=90'
        ]
    }
};

const PRICE_RANGES = [
    {value: '0-999', label: '0 - 999 TL', check: (price) => price <= 999},
    {value: '1000-1999', label: '1.000 - 1.999 TL', check: (price) => price >= 1000 && price <= 1999},
    {value: '2000+', label: '2.000 TL ve üzeri', check: (price) => price >= 2000}
];

const DEFAULT_BRANDS = ['Zara', 'Mango', 'Koton', 'Ipekyol', 'Mavi', 'Stradivarius', 'H&M', 'LCW Vision', 'Massimo'];
const DEFAULT_COLORS = ['Siyah', 'Beyaz', 'Bej', 'Lacivert', 'Haki', 'Kırmızı', 'Gri', 'Mavi'];
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const getCategoryMeta = (categoryKey = 'elbise') => CATEGORY_META[categoryKey] || CATEGORY_META.elbise;

const getMenuItemsByCategory = (categoryKey = 'elbise') => {
    const parentId = getCategoryMeta(categoryKey).parentId;
    const parent = MEGA_MENU_CATEGORIES.find((group) => group.id === parentId);
    return parent ? parent.items : MEGA_MENU_CATEGORIES[0].items;
};

const getParentCategoryIdBySlug = (categoryKey = 'elbise') => {
    return getCategoryMeta(categoryKey).parentId || MEGA_MENU_CATEGORIES[0].id;
};

const createSeedProducts = (categoryKey = 'elbise') => {
    const meta = getCategoryMeta(categoryKey);
    const words = meta.productWords || ['Koleksiyon'];
    const imagePool = meta.imagePool || [];

    return Array.from({length: 12}, (_, index) => {
        const price = 650 + (index * 170) + (categoryKey.length * 13);
        const oldPrice = price + 220 + ((index % 4) * 80);
        const discountRate = Math.max(0, Math.round(((oldPrice - price) / oldPrice) * 100));

        return {
            id: `${categoryKey}-seed-${index + 1}`,
            title: `${words[index % words.length]} ${meta.suffixLabel}`,
            mark: DEFAULT_BRANDS[index % DEFAULT_BRANDS.length],
            price,
            oldPrice,
            discountRate,
            rating: 3 + (index % 3),
            reviewCount: 60 + (index * 23),
            img: imagePool[index % Math.max(imagePool.length, 1)] || '',
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            size: DEFAULT_SIZES[index % DEFAULT_SIZES.length],
            isFreeCargo: index % 2 === 0,
            isFastDelivery: index % 3 !== 0,
            sellerScore: Number((8.8 + ((index % 8) * 0.1)).toFixed(1)),
            installmentText: ['Peşin fiyatına', '2 taksit', '3 taksit', '4 taksit'][index % 4]
        };
    });
};

const getCategoryData = (categoryKey = 'elbise') => {
    const meta = getCategoryMeta(categoryKey);
    return {
        ...meta,
        products: createSeedProducts(categoryKey)
    };
};

const getCategoryProducts = (categoryKey = 'elbise') => getCategoryData(categoryKey).products;

const countByKey = (items, key) => {
    return items.reduce((acc, item) => {
        const value = item[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
};

const toFacetOptions = (counts) => {
    return Object.keys(counts).map((value) => ({
        value,
        label: value,
        count: counts[value]
    }));
};

const getCategoryFacets = (categoryKey = 'elbise') => {
    const products = getCategoryProducts(categoryKey);

    return [
        {key: 'mark', title: 'Marka', options: toFacetOptions(countByKey(products, 'mark'))},
        {key: 'size', title: 'Beden', options: toFacetOptions(countByKey(products, 'size'))},
        {key: 'color', title: 'Renk', options: toFacetOptions(countByKey(products, 'color'))},
        {
            key: 'priceRange',
            title: 'Fiyat',
            options: PRICE_RANGES.map((range) => ({
                value: range.value,
                label: range.label,
                count: products.filter((product) => range.check(product.price)).length
            }))
        }
    ];
};

const WOMEN_MENU_ITEMS = MEGA_MENU_CATEGORIES.find((item) => item.id === 'kadin').items;
const getAllCategoryKeys = () => Object.keys(CATEGORY_META);

export {
    MEGA_MENU_CATEGORIES,
    CATEGORY_META,
    WOMEN_MENU_ITEMS,
    PRICE_RANGES,
    getAllCategoryKeys,
    getCategoryMeta,
    getMenuItemsByCategory,
    getParentCategoryIdBySlug,
    getCategoryData,
    getCategoryProducts,
    getCategoryFacets
};
