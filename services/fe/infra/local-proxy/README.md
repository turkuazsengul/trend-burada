# Local Subdomain Proxy

Bu klasor, local ortamda `trendburada.local`, `seller.trendburada.local` ve `api.trendburada.local` hostlarini
tek makinede test etmek icin hazirlandi.

## 1. Hosts kayitlari

`/etc/hosts` dosyasina su satiri eklenmeli:

```txt
127.0.0.1 trendburada.local seller.trendburada.local admin.trendburada.local api.trendburada.local
```

## 2. Uygulama servislerini calistir

Frontend:

```bash
npm start
```

Backend gateway:

```bash
docker compose -f /Users/turkuzsengul/DEV/trend-burada-be/infra/docker-compose.yml up -d gateway app
```

## 3. Local proxy'yi baslat

```bash
docker compose -f infra/local-proxy/docker-compose.local-proxy.yml up -d
```

## 4. Test URL'leri

- http://trendburada.local
- http://seller.trendburada.local
- http://admin.trendburada.local
- http://api.trendburada.local

## Notlar

- `trendburada.local` customer shell acilir.
- `seller.trendburada.local` seller shell acilir ve gerekli ise `/seller` path'ine otomatik yonlenir.
- `admin.trendburada.local` simdilik customer shell'e duser; admin shell daha sonra ayrilacak.
- Bu yapi config bazli oldugu icin VDS ortaminda sadece host listeleri ve reverse proxy hedefleri degistirilerek tasinabilir.
