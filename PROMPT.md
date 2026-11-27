# Used.Market — Phase-wise build prompt

**Winning idea:** *Used.Market — the neutral command centre for the used economy.* Not another listings board (that fight is owned by eBay, Facebook, Kijiji, OLX and needs a backend, payments and millions of users). Instead, the one site every buyer and seller visits **before** they list or pay: where to sell it, what it's worth, what each platform takes, whether the deal is a scam, whether the product was recalled, and how to inspect it. That intent ("where to sell X", "X fee calculator", "is this a scam", "what is my X worth", "recall check") is evergreen, high-volume and attracts high-CPC advertisers (cars, phones, insurance, fintech, moving/delivery) — ideal for AdSense, lead generation and sponsorship on a free static host.

Use the prompts below in order. Each phase is self-contained and ends with an acceptance checklist.

---

## Phase 0 — Ground rules (paste first)

> You are building **Used.Market** (domain `used.market`), a modern, fast, fully static website (HTML/CSS/vanilla JS, no server, no database) that is hosted free on GitHub Pages from the `main` branch of `github.com/WEBWORKSA1/used-market`.
> Non-negotiables on **every** page:
> 1. A slim top bar reading exactly "Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership", linked to `https://web.works/contact` (new tab). The text `web.works` must never be displayed.
> 2. Google AdSense in `<head>`: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>` plus `<meta name="google-adsense-account" content="ca-pub-6620975821265271">`. Root `ads.txt`: `google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`.
> 3. One inbox for every form, inquiry and donation: the owner's private inbox. It must never appear in HTML, visible text, `mailto:` links or plain strings. Store it encoded in `assets/js/config.js` and assemble the FormSubmit endpoint and PayPal donate URL at runtime only.
> 4. Relative links everywhere so the site works at `webworksa1.github.io/used-market/` and later at `https://used.market/`.
> 5. AdSense-safe content: original, useful, no fake listings, no copied text, no other brands' logos, clear navigation, privacy/terms/cookies/disclaimer/about/contact pages, cookie consent, no ads on thank-you or error pages, no "click the ads" language.
> 6. Trademark: "Used.Market" is used as a descriptive domain. No affiliation with any marketplace named; third-party names are nominative references only. Publish a Trademark & Copyright Disclosure page.

## Phase 1 — Research & information architecture

> Open and read at least 38 world-class used-goods sites (marketplaces, buyback services, price guides, safety regulators). Record what each actually does in `RESEARCH.md`. From it, define the sitemap:
> Home · Tools (Where-to-Sell Router, Fee & Payout Calculator, Used Value Estimator, Scam Message Checker, Recall Checker, Inspection Checklists, Listing Builder, Safe Meetup & Payment Planner, Buy Used vs New, Declutter Cash Calculator, Condition Grader) · Marketplace Directory (45+ platforms, filter + compare + trust score) · Categories (12 hubs) · Guides (20+ long-form) · News & Recalls (auto) · Video Academy · Get Offers (lead gen) · Partners & Advertising · Support (donations) · Contests · Careers · About · Contact · legal set · HTML sitemap · 404.
> **Accept when:** RESEARCH.md lists 38+ sites with features adopted; sitemap approved.

## Phase 2 — Design system

> Distinctive "price-tag market" identity: deep market green `#0E3B2E`, tag yellow `#FFD23F`, coral `#FF5A3C`, paper `#FBF7EE`, ink `#15201B`. Display font Bricolage Grotesque, body Instrument Sans. Components: price-tag badges with punched hole, sticker chips, tool cards, comparison tables, stepper forms, accordion FAQ, toast, modal, dark mode, focus-visible states, `prefers-reduced-motion`. Mobile-first, 44px tap targets, WCAG AA contrast.
> **Accept when:** one `site.css` under 60 KB, Lighthouse accessibility ≥ 95.

## Phase 3 — Build system & shared layout

> A small Python generator (`_build/build.py`) renders every page from content fragments + JSON data into static HTML with: top contact bar, header with mega-menu, breadcrumb, JSON-LD (Organization, WebSite+SearchAction, BreadcrumbList, Article, FAQPage, HowTo where relevant), OpenGraph/Twitter tags, canonical to `https://used.market/...`, footer with all legal links, newsletter, cookie banner. Output `sitemap.xml`, `robots.txt`, `ads.txt`, `manifest.webmanifest`, `.nojekyll`, `404.html`.
> **Accept when:** `python3 _build/build.py` rebuilds the whole site deterministically; zero broken internal links.

## Phase 4 — Interactive tools (the traffic engine)

> Build each as vanilla JS reading `data/*.json`:
> 1. **Where-to-Sell Router** — inputs: category, value, condition, speed vs price, local vs ship, effort; output: ranked platforms with estimated net payout and the reason.
> 2. **Fee & Payout Calculator** — sale price, shipping charged, shipping cost, item cost; side-by-side net payout for 15+ platforms; custom-fee row; "as of" date; links to official fee pages.
> 3. **Used Value Estimator** — category depreciation curves × age × condition × brand tier × demand × accessories; outputs fair range, list price, quick-sale price; links to sold-price research.
> 4. **Scam Message Checker** — paste a buyer/seller message; 25+ weighted red-flag rules (gift cards, wire, cashier's check, overpayment, courier pickup, verification codes, off-platform payment, crypto, fake payment emails, deposits); risk score + explanation + what to do + where to report.
> 5. **Recall Checker** — search the auto-refreshed CPSC recall dataset by product/brand/hazard; live API fallback.
> 6. **Inspection Checklists** — 12 categories, tick-through with progress, save to device, print.
> 7. **Listing Builder** — title/description generator with per-platform character limits, keywords, copy button.
> 8. **Safe Meetup & Payment Planner** — value + method → safest payment, meetup location type, what to bring/verify.
> 9. **Buy Used vs New** — total cost of ownership incl. warranty, risk, resale value.
> 10. **Declutter Cash Calculator** — add items, estimate total and best channel per item.
> 11. **Condition Grader** — 6-question quiz → standard grade (New/Like New/Excellent/Good/Fair/Parts) with listing wording.
> **Accept when:** each tool works offline after load, is keyboard accessible, and has an FAQ + guide links + ad slot + lead CTA.

## Phase 5 — Content for AdSense approval

> 20+ original long-form guides (900–1,500 words, sources linked), 12 category hubs, directory of 45+ platforms with trust scores, about/editorial policy. Each article: author box, "last reviewed" date, table of contents, FAQ schema, related tools, in-content ad breaks only between sections.
> **Accept when:** 60+ indexable pages of substantive original content.

## Phase 6 — Lead generation (dedicated, high-converting)

> `/sell/` "Get Offers" — 4-step stepper (What are you selling → condition & quantity → location & timing → contact) with progress bar, instant on-screen value hint, trust badges, testimonials-free honesty note, consent checkbox, spam honeypot. Lead types: single item, estate/bulk cleanout, vehicle, electronics buyback, business/dealer partnership. Every tool result shows a contextual "Get offers for this item" CTA prefilled with the tool's inputs. Exit-intent prompt on desktop. All submissions via FormSubmit AJAX to the hidden inbox with `_subject`, `_template=table`, `_captcha=false`, honeypot `_honey`.
> **Accept when:** form validates, submits, shows success; inbox address never visible.

## Phase 7 — Revenue stack

> - AdSense Auto ads + optional fixed slots (IDs in `config.js`).
> - `/partners/`: featured directory placement, category sponsorship, tool sponsorship, newsletter sponsorship, lead partnerships, domain/website acquisition interest — with price anchors and an inquiry form.
> - `/support/`: donations (one-time/monthly tiers, PayPal link assembled at runtime, pledge form fallback) with transparent allocation: operations, promotions & marketing, hiring talent, contests & prizes.
> - `/contests/`: monthly challenges with prizes, official rules (no purchase necessary), entry form.
> - `/careers/`: open roles (writers, deal researchers, video creators, community moderators, partnerships) + application form.
> - `/videos/`: YouTube Video Academy with privacy-enhanced, click-to-load embeds.

## Phase 8 — Self-updating automation

> GitHub Actions workflow (`.github/workflows/auto-refresh.yml`) runs daily and on push: fetch latest CPSC recalls → `data/recalls.json`; fetch resale/second-hand news headlines (title + link only) → `data/news.json`; rotate "tip of the day"; rebuild pages + sitemap `lastmod`; commit only when data changed; mirror `main` to `gh-pages`.
> **Accept when:** workflow succeeds and the News & Recalls page shows today's date.

## Phase 9 — QA, SEO & launch

> Link check, JS syntax check, Lighthouse (performance ≥ 90 mobile), headless screenshots desktop/mobile/dark, verify the private inbox string is absent from every file, AdSense script present on every page, top contact bar on every page. Push to `main`, publish on GitHub Pages, then: connect custom domain `used.market` (A records 185.199.108–111.153, `www` CNAME `webworksa1.github.io`), enforce HTTPS, submit `sitemap.xml` to Search Console, add the site in AdSense and enable the Google CMP message for EEA/UK.
