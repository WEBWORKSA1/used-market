# Used.Market

The neutral command centre for the used economy — where to sell, what it's worth, what every platform takes, and how to stay safe. A fast, fully static site for GitHub Pages (free plan, `main` branch).

## What's inside

- **11 tools** (vanilla JS, run in the browser): Where-to-Sell Router, Fee & Payout Calculator, Used Value Estimator, Scam Message Checker, Recall Checker, Inspection Checklists, Listing Builder, Safe Meetup & Payment Planner, Buy Used vs New, Declutter Cash Calculator, Condition Grader.
- **Marketplace directory** of 51 platforms with fees, protection and a trust score.
- **14 category hubs**, **20 long-form guides**, Video Academy, News & Recalls (auto-updated).
- **Revenue**: AdSense (`ca-pub-6620975821265271`) on every content page + `ads.txt`; Get Offers lead funnel (4-step); Partners/advertising; Support (donations); Contests; Careers.
- **Forms** post via FormSubmit; the inbox is stored encoded in `assets/js/config.js` and assembled only at submit time.

## Build

```bash
python3 _build/build.py      # renders all pages from _build/content + data/*.json
python3 _build/refresh.py    # pulls latest CPSC recalls + headlines (needs internet)
```

No dependencies. Edit content in `_build/content/pages/*.html` and `_build/content/guides/*.html` (JSON meta header + HTML body), data in `data/*.json`, then rebuild and commit.

## Automation

`.github/workflows/auto-refresh.yml` runs daily (and on every push to `main`): refreshes recalls and headlines, rebuilds pages and the sitemap, commits changes, and mirrors `main` to `gh-pages`.

## Launch checklist

1. **Settings → Pages**: Source = *Deploy from a branch*, Branch = `main` / `(root)`.
2. **Forms**: submit any form once on the live site, then click **Activate** in the FormSubmit email. Optional: paste the random alias FormSubmit gives you into `formAlias` in `assets/js/config.js`.
3. **Custom domain `used.market`**: DNS A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` CNAME → `webworksa1.github.io`. Add the domain in Settings → Pages and tick *Enforce HTTPS*.
4. **AdSense**: add `used.market` under Sites, enable Auto ads, and turn on the Google consent message for EEA/UK. Optional fixed units: paste slot IDs into `adSlots` in `config.js`.
5. **Search Console**: verify the domain and submit `https://used.market/sitemap.xml`.
6. **Donations**: the Support page opens a PayPal donation page for the site inbox; that inbox needs a PayPal account to receive funds.

See `PROMPT.md` for the phase-wise build prompt and `RESEARCH.md` for the 39-site competitive research.
