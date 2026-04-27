# TrendBurada — CLAUDE.md (Monorepo)

This file governs how Claude works in this repository. Rules here OVERRIDE Claude's
default behavior. When a per-service `CLAUDE.md` exists (e.g. `services/be/CLAUDE.md`),
it adds detail for that service but cannot override the global rules below.

---

## 🔴 ÇEKİRDEK KURAL (en önemli)

Hiçbir kod değişikliğinden önce:

1. İsteği dikkatle oku.
2. İlgili dosyaları repo içinde bul. Artık 4 servis tek repoda — "öteki repo" diye
   bir şey yok; her şey görünür durumda.
3. Aşağıdaki 4 yüzeyde **Impact Analysis** çıkar:
   - `services/be` (Backend — Spring Boot modular monolith)
   - `services/fe` (Frontend — React SPA)
   - `services/gateway` (Gateway — Spring Cloud Gateway)
   - `services/config-server` + `services/config-server/config-repo` (Config)
4. Riskleri listele.
5. Implementation plan'ı yaz.
6. **ONAY OLMADAN KOD YAZMA.**

Impact Analysis şablonu (her görev için zorunlu):

```md
## Impact Analysis

- BE (services/be):
- FE (services/fe):
- Gateway (services/gateway):
- Config Server (services/config-server):
- DB / Migration:
- Env / Docker (infra/):
- Riskler:
```

---

## 🔁 İŞ AKIŞI (Claude için kesin sıralama)

Her görev şu fazlardan geçer; biri yeşil olmadan sonraki başlamaz.

### Faz 0 — Anlama & Plan
- Issue / talebi oku.
- 4-yüzeyli Impact Analysis.
- Açık sorular varsa kullanıcıya sor.
- Plan + onay.

### Faz 1 — Kod
- Onaylanan plana sadık kal.
- Etkilenen her servisin kendi convention'ına uy (per-service CLAUDE.md).
- Test'leri kodla birlikte yaz; "sonra-yazarım" yok.

### Faz 2 — Local CI (zorunlu, otomatik)
- `make ci` çalıştır.
- Komut etkilenen servisleri `git diff --name-only main` ile tespit eder, her biri
  için lint + test + build koşar, tek bloklu pass/fail özet basar.
- Yeşil değilse: işe DEVAM ETME, hatayı düzelt, tekrar koş.
- İstisna: sandbox'ta gerekli toolchain (JDK 17, node, docker) yoksa koşamayacağını
  açıkça söyle ve kullanıcıdan koşmasını iste — çıktıyı ona göre değerlendir.

### Faz 3 — Docker Stack
- `make up` ile tüm stack'i ayağa kaldır.
- `make health` ile her servisin /actuator/health (BE, GW, CS) ve / (FE) yeşil mi
  kontrol et. `health.sh` her servisi 30 deneme × 2 saniye ile bekler.
- Yeşil değilse: `make logs SVC=<name>` ile log'a bak, düzelt, tekrar koş.

### Faz 4 — Hand-off
Kullanıcıya tek bloklu özet ver. Her zaman şu 4 başlığı içersin:

```
✓ Yapılan iş: <1-2 cümle>
✓ Faz 2 (make ci): <PASS/FAIL özeti>
✓ Faz 3 (make health): <hangi servisler yeşil>
✓ Manuel test:
   - URL'ler:        http://localhost:3000  http://localhost:8090/...
   - Örnek curl:     curl -H "Authorization: Bearer ..." http://localhost:8090/api/v1/...
```

### Çekirdek davranış
- "İş tamam" demek = Faz 4 tamamlandı demek. Faz 2 veya 3 kırmızıysa "tamam" yok.
- Faz 2 / 3 lokal'de çalışmıyorsa açıkça söyle, kullanıcıdan koşmasını iste.

---

## 🌍 SİSTEM HARİTASI

Detaylı mimari için: [`docs/system-map.md`](docs/system-map.md).

Kısaca:

| Klasör | Ne | Tek satırda |
|---|---|---|
| `services/be` | Backend (Spring Boot modular monolith) | Java 17, Maven, Postgres, Keycloak |
| `services/fe` | Frontend (React SPA) | Node 18, npm, nginx (prod) |
| `services/gateway` | API Gateway (Spring Cloud Gateway) | JWT, Redis rate limit, CORS |
| `services/config-server` | Config Server (Spring Cloud Config) | reads `config-repo/` |
| `services/config-server/config-repo` | Ortam-spesifik property dosyaları | her servisin .yml'i |
| `infra/` | Meta-stack (docker-compose, keycloak realm, .env) | tek `make up` |
| `docs/` | Cross-cutting docs (system-map, ADR'ler) | |
| `scripts/` | CI / health helpers | `ci-local.sh`, `health.sh` |
| `.claude/commands/` | Claude slash command'leri | `/test-all`, `/new-endpoint` |

İstek akışı: User → FE (3000) → Gateway (8090) → BE (8080) → DB (5432).

---

## 🛠️ KOMUTLAR

`make help` her zaman güncel listeyi verir. Sıkça kullanılanlar:

| Komut | Ne yapar |
|---|---|
| `make up` | Tüm stack'i ayağa kaldırır (ilk build ~2-3 dk). |
| `make down` | Container'ları indirir, volume'ler durur. |
| `make clean` | Container + volume'ler silinir (DB sıfırlanır). |
| `make health` | Her servisin health endpoint'ini yoklar. |
| `make logs` veya `make logs SVC=app` | Log takibi (tüm stack veya tek servis). |
| `make ci` | Etkilenen servislerde lint + test + build. |
| `make ci.all` | Tüm servislerde lint + test + build (release öncesi). |
| `make rebuild SVC=app` | Tek servisi rebuild + restart (worldü kıpırdatmadan). |
| `make be.test` / `fe.test` / `gateway.test` / `config-server.test` | Servis-bazlı test. |

---

## 🌐 DİL KURALI

- Tüm internal reasoning, kod, commit mesajı, log, comment **İngilizce**.
- Kullanıcıya dönen mesajlar (chat, UI metni) **Türkçe**.

---

## 🚪 PORT MAP (host)

| Port | Servis | Notu |
|---|---|---|
| 3000 | FE (compose, nginx) | Vite dev için 5173 ayrı koşturulabilir |
| 5432 | postgres-app | BE veritabanı |
| 5433 | postgres-keycloak | Keycloak veritabanı |
| 6379 | redis | Gateway rate limit |
| 8025 | mailpit UI | Tüm dev mailleri buraya düşer |
| 8080 | BE | Direkt erişim — gateway'i atlatır |
| 8081 | Keycloak | admin / admin |
| 8090 | Gateway | İstemci asıl giriş noktası |
| 8888 | Config Server | |

---

## 🚫 YAPILMAYACAKLAR

- Onaysız code change.
- `make ci` kırmızıyken işi "tamam" deklare etmek.
- Cross-service değişiklikte sadece tek servisin testini koşup geçmek (etkilenen
  TÜM servisler test edilmeli).
- `git push --force` (history'yi temiz tut, ama yeniden yazma).
- Secret'i repo'ya yazmak (`infra/.env` gitignored — `infra/.env.example` üzerinden
  yönlendir).
- `infra/docker-compose.yml`'de yeni bir servis eklerken `healthcheck` ATLAMAK.
- Bir endpoint eklerken gateway'de route allowlist'i güncelleme — etkilenen yüzey,
  unutma.

---

## ✅ DEFINITION OF DONE (her PR / iş için)

Aşağıdakilerin hepsi yeşil olmadan iş "tamam" değildir:

- [ ] Impact Analysis yazıldı, kullanıcı onayı alındı.
- [ ] Etkilenen tüm servislerde testler eklendi/güncellendi.
- [ ] `make ci` yeşil.
- [ ] `make up && make health` tüm servislerde PASS.
- [ ] Yeni endpoint varsa: gateway route'u, FE API client'ı, system-map güncellendi.
- [ ] Yeni env değişkeni varsa: `infra/.env.example`'a eklendi.
- [ ] CLAUDE.md'de yer alan kuralların hiçbiri ihlal edilmedi.

---

## 📓 SERVİS-SPESİFİK CLAUDE.md'LER

Her servis kendi convention'larını kendi `CLAUDE.md`'sinde tutar:

- [`services/be/CLAUDE.md`](services/be/CLAUDE.md)
- [`services/fe/CLAUDE.md`](services/fe/CLAUDE.md)
- [`services/gateway/CLAUDE.md`](services/gateway/CLAUDE.md)
- [`services/config-server/CLAUDE.md`](services/config-server/CLAUDE.md)

Çakışma olursa root CLAUDE.md (bu dosya) öncelikli.

---

## 🔮 BACKLOG (unutulmasın)

- [ ] GitHub Actions: path-triggered CI per service (Faz 5 — şimdilik bilerek atlandı).
- [ ] `.claude/commands/new-endpoint.md`: BE + GW + FE'yi tek talimat halinde yapan
      slash command (Faz 6).
- [ ] Eski 4 reponun her birine `v0.1.0-pre-monorepo` tag'i + archive.
