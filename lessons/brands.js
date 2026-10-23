/* =============================================================================
   장비 브랜드 알아보기 — 화면 (2026-10-23)
   - 데이터: lessons/brands_data.js (window.STA_BRANDS)
   - #tabBrands 안의 #brandRoot 에 그립니다. CSS 는 한 번만 <style id="brands-css"> 로 넣어요(접두어 brd-).
   - 모듈 링크는 <button data-module="..."> — 클릭 처리는 modules.js 의 전역 핸들러가 해요.
   - 로고·제조사 제품 사진은 쓰지 않아요. 분류 아이콘은 직접 그린 단순한 SVG 예요.
   - 브랜드 카드마다 대표 제품 3단계(엔트리·중급·하이엔드) 줄을 펼치지 않아도 보여 줘요.
     brand.tiers[i].img 가 있으면 그 사진(자유 이용 사진, credit 표시)을, 없으면 분류 아이콘 자리표시 +
     「제조사 페이지에서 사진 보기 ↗」 링크를 보여 줘요. 사진을 못 불러오면 자동으로 자리표시로 바뀌어요.
   - 테스트용: window.STABrands = { state(), setCategory(id), search(q), setOursOnly(v) }
   ============================================================================= */
(function () {
  'use strict';
  var D = window.STA_BRANDS;
  if (!D) return;

  /* ------------------------------------------------------------------ CSS */
  var CSS = [
    '.game-container:has(#tabBrands.active) { max-width: 1180px; }',
    '.brd { --brd-accent: var(--sta-cyan, #0e7490); color: var(--sta-ink, #0f1f33); min-width: 0; }',
    '.brd *, .brd *::before, .brd *::after { box-sizing: border-box; }',
    '.brd-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }',
    '.brd-lead { display: flex; gap: 14px; align-items: flex-start; margin: 0 0 16px; padding: 14px 16px; border-radius: var(--sta-r, 12px); background: var(--sta-cyan-soft, #e6f6f9); border: 1px solid #b9e3ea; }',
    '.brd-lead p { margin: 0; font-size: 0.88rem; line-height: 1.7; color: var(--sta-ink-2, #51627a); word-break: keep-all; }',
    '.brd-lead small { display: block; margin-top: 6px; font-size: 0.76rem; color: #5b6f86; }',
    '.brd-lead__ico { flex: none; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: var(--sta-navy, #0f2747); color: var(--sta-cyan-bright, #22d3ee); }',
    '.brd-lead__ico svg { width: 20px; height: 20px; }',
    /* 도구 줄 */
    '.brd-tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }',
    '.brd-search { position: relative; flex: 1 1 260px; min-width: 0; }',
    '.brd-search svg { position: absolute; left: 12px; top: 50%; width: 16px; height: 16px; transform: translateY(-50%); color: #7a8aa0; pointer-events: none; }',
    '.brd-search input { width: 100%; font: inherit; font-size: 0.9rem; padding: 10px 36px 10px 36px; border: 1px solid var(--sta-line, #d6dee8); border-radius: 10px; background: var(--sta-surface, #fff); color: inherit; }',
    '.brd-search input:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 1px; border-color: var(--brd-accent); }',
    '.brd-search__clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border: 0; border-radius: 8px; background: none; cursor: pointer; color: #64748b; font-size: 1rem; line-height: 1; }',
    '.brd-search__clear:hover { background: #f1f5f9; } .brd-search__clear:focus-visible { outline: 2px solid var(--brd-accent); }',
    '.brd-switch { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px 8px 8px; border: 1px solid var(--sta-line, #d6dee8); border-radius: 999px; background: var(--sta-surface, #fff); font: inherit; font-size: 0.84rem; font-weight: 800; color: var(--sta-navy, #0f2747); cursor: pointer; white-space: nowrap; }',
    '.brd-switch__track { position: relative; width: 34px; height: 20px; border-radius: 999px; background: #cbd5e1; transition: background .15s; flex: none; }',
    '.brd-switch__track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: transform .15s; }',
    '.brd-switch[aria-checked="true"] { border-color: var(--brd-accent); background: var(--sta-cyan-soft, #e6f6f9); }',
    '.brd-switch[aria-checked="true"] .brd-switch__track { background: var(--brd-accent); }',
    '.brd-switch[aria-checked="true"] .brd-switch__track::after { transform: translateX(14px); }',
    '.brd-switch:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    /* 분류 칩 */
    '.brd-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; padding: 0; }',
    '.brd-chip { display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px 8px 10px; border-radius: 10px; border: 1px solid var(--sta-line, #d6dee8); background: var(--sta-surface, #fff); font: inherit; font-size: 0.86rem; font-weight: 800; color: #3b4c63; cursor: pointer; transition: border-color .15s, background .15s; }',
    '.brd-chip svg { width: 18px; height: 18px; flex: none; color: #64748b; }',
    '.brd-chip:hover { border-color: #9fb4cc; }',
    '.brd-chip[aria-selected="true"] { background: var(--sta-navy, #0f2747); border-color: var(--sta-navy, #0f2747); color: #fff; }',
    '.brd-chip[aria-selected="true"] svg { color: var(--sta-cyan-bright, #22d3ee); }',
    '.brd-chip:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    '.brd-chip__n { min-width: 22px; padding: 1px 7px; border-radius: 999px; background: #eef2f6; color: #475569; font-size: 0.74rem; font-variant-numeric: tabular-nums; text-align: center; }',
    '.brd-chip[aria-selected="true"] .brd-chip__n { background: rgba(255,255,255,.16); color: #e2ecf7; }',
    '.brd-chip.is-zero { opacity: .55; }',
    /* 분류 소개 */
    '.brd-cat { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 0; margin-bottom: 14px; border: 1px solid var(--sta-line, #d6dee8); border-radius: var(--sta-r-lg, 16px); overflow: hidden; background: var(--sta-surface, #fff); }',
    '.brd-cat__main { display: flex; gap: 14px; padding: 18px 20px; background: linear-gradient(120deg, #0a1c35, #12355f); color: #fff; }',
    '.brd-cat__ico { flex: none; width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: rgba(34,211,238,.14); color: var(--sta-cyan-bright, #22d3ee); }',
    '.brd-cat__ico svg { width: 30px; height: 30px; }',
    '.brd-cat__main h2 { margin: 0 0 6px; font-size: 1.12rem; font-weight: 800; letter-spacing: -0.01em; color: #fff; }',
    '.brd-cat__main p { margin: 0; font-size: 0.86rem; line-height: 1.7; color: #c6d3e3; word-break: keep-all; }',
    '.brd-cat__mods { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }',
    '.brd-modlink { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.4); background: rgba(255,255,255,.08); color: #fff; font: inherit; font-size: 0.78rem; font-weight: 800; cursor: pointer; }',
    '.brd-modlink:hover { background: rgba(255,255,255,.18); } .brd-modlink:focus-visible { outline: 2px solid var(--sta-cyan-bright, #22d3ee); outline-offset: 2px; }',
    '.brd-cat__look { padding: 16px 20px; background: var(--sta-surface-2, #f6f8fb); }',
    '.brd-cat__look h3 { margin: 0 0 8px; font-size: 0.86rem; font-weight: 800; color: var(--sta-navy, #0f2747); }',
    '.brd-cat__look ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }',
    '.brd-cat__look li { position: relative; padding-left: 18px; font-size: 0.82rem; line-height: 1.55; color: var(--sta-ink-2, #51627a); word-break: keep-all; }',
    '.brd-cat__look li::before { content: ""; position: absolute; left: 3px; top: 0.55em; width: 7px; height: 7px; border-radius: 2px; background: var(--brd-accent); transform: rotate(45deg); }',
    /* 결과 줄 */
    '.brd-status { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; margin: 4px 0 10px; font-size: 0.82rem; color: #5b6f86; }',
    '.brd-status b { color: var(--sta-navy, #0f2747); }',
    '.brd-status button { font: inherit; font-size: 0.78rem; font-weight: 800; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--sta-line, #d6dee8); background: #fff; color: var(--brd-accent); cursor: pointer; }',
    '.brd-status button:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    /* 카드 */
    '.brd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 470px), 1fr)); gap: 12px; align-items: start; margin-bottom: 28px; }',
    '.brd-card { position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 16px 16px 12px; border: 1px solid var(--sta-line, #d6dee8); border-radius: var(--sta-r, 12px); background: var(--sta-surface, #fff); transition: border-color .15s, box-shadow .15s; container: brdcard / inline-size; }',
    '.brd-card:hover { border-color: #9fb4cc; box-shadow: var(--sta-shadow); }',
    '.brd-card.is-ours { border-color: #7cc7d4; box-shadow: inset 0 3px 0 var(--brd-accent); }',
    '.brd-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }',
    '.brd-card h3 { margin: 0; min-width: 0; font-size: 1.08rem; font-weight: 800; letter-spacing: -0.01em; color: var(--sta-navy, #0f2747); line-height: 1.3; overflow-wrap: anywhere; }',
    '.brd-card h3 small { display: block; margin-top: 2px; font-size: 0.76rem; font-weight: 700; letter-spacing: 0; color: #7a8aa0; }',
    '.brd-country { flex: none; padding: 3px 9px; border-radius: 999px; background: #f1f5f9; border: 1px solid #e2e8f0; font-size: 0.72rem; font-weight: 800; color: #475569; white-space: nowrap; }',
    '.brd-catname { align-self: flex-start; font-size: 0.7rem; font-weight: 800; color: #6d4fc2; background: #f5f1ff; border-radius: 6px; padding: 2px 7px; }',
    '.brd-ours { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 8px; border-radius: 999px; background: var(--sta-cyan-soft, #e6f6f9); border: 1px solid #9fd8e2; color: #0b5f73; font-size: 0.74rem; font-weight: 800; }',
    '.brd-ours svg { width: 14px; height: 14px; }',
    '.brd-card__id { margin: 0; font-size: 0.85rem; line-height: 1.6; color: var(--sta-ink-2, #51627a); word-break: keep-all; }',
    '.brd-tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 0; padding: 0; list-style: none; }',
    '.brd-tags li { padding: 2px 8px; border-radius: 6px; background: #f6f8fb; border: 1px solid #e5eaf1; font-size: 0.72rem; font-weight: 700; color: #3b4c63; overflow-wrap: anywhere; }',
    '.brd-more { border-top: 1px dashed #e2e8f0; margin-top: 2px; padding-top: 6px; }',
    '.brd-more summary { display: flex; align-items: center; gap: 6px; padding: 4px 0; cursor: pointer; font-size: 0.82rem; font-weight: 800; color: var(--brd-accent); list-style: none; border-radius: 6px; }',
    '.brd-more summary::-webkit-details-marker { display: none; }',
    '.brd-more summary::before { content: ""; width: 7px; height: 7px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(-45deg); transition: transform .15s; margin: 0 3px 0 1px; }',
    '.brd-more[open] summary::before { transform: rotate(45deg); }',
    '.brd-more summary:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    '.brd-more__body { display: grid; gap: 10px; padding: 6px 0 4px; font-size: 0.84rem; line-height: 1.65; color: var(--sta-ink, #0f1f33); word-break: keep-all; }',
    '.brd-more__body h4 { margin: 0 0 4px; font-size: 0.76rem; font-weight: 800; color: #64748b; letter-spacing: 0.02em; }',
    '.brd-more__body p { margin: 0; }',
    '.brd-fams { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }',
    '.brd-fams li { padding: 7px 10px; border-radius: 8px; background: var(--sta-surface-2, #f6f8fb); border: 1px solid #edf1f6; }',
    '.brd-fams b { display: block; font-size: 0.82rem; color: var(--sta-navy, #0f2747); overflow-wrap: anywhere; }',
    '.brd-fams span { font-size: 0.8rem; color: var(--sta-ink-2, #51627a); }',
    '.brd-meet { display: flex; flex-wrap: wrap; gap: 5px; margin: 0; padding: 0; list-style: none; }',
    '.brd-meet li { padding: 2px 9px; border-radius: 999px; background: #eef6ff; color: #1e4f8a; font-size: 0.74rem; font-weight: 700; }',
    '.brd-tip { padding: 9px 12px; border-radius: 8px; background: var(--sta-warn-bg, #fefce8); border: 1px solid #f3e39a; font-size: 0.82rem; }',
    '.brd-tip b { color: var(--sta-warn, #a16207); }',
    '.brd-group { font-size: 0.76rem; color: #64748b; }',
    /* 대표 제품 3단계 */
    '.brd-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; margin: 0 0 10px; padding: 9px 12px; border-radius: 10px; background: var(--sta-surface-2, #f6f8fb); border: 1px solid #e5eaf1; font-size: 0.8rem; line-height: 1.55; color: var(--sta-ink-2, #51627a); word-break: keep-all; }',
    '.brd-legend__lvls { display: inline-flex; gap: 4px; flex: none; }',
    '.brd-lvl { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 800; line-height: 1.6; white-space: nowrap; border: 1px solid transparent; }',
    '.brd-lvl--entry { background: #ecfdf5; color: #047857; border-color: #b7ebd3; }',
    '.brd-lvl--mid { background: #eef6ff; color: #1e4f8a; border-color: #c4dbf5; }',
    '.brd-lvl--high { background: #f5f1ff; color: #5b3fb0; border-color: #dccff7; }',
    '.brd-tiers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 2px 0 0; padding: 0; list-style: none; }',
    '.brd-tier { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 8px; border-radius: 10px; border: 1px solid #e5eaf1; background: #fff; }',
    '.brd-tier.is-ours { border-color: #9fd8e2; background: #f5fcfd; }',
    '.brd-tier.is-empty { justify-content: flex-start; background: repeating-linear-gradient(135deg, #fafbfc 0 8px, #f4f6f9 8px 16px); border-style: dashed; }',
    '.brd-tier.is-empty p { margin: 0; font-size: 0.74rem; color: #7a8aa0; }',
    '.brd-tier__media { min-width: 0; }',
    '.brd-tier__fig { margin: 0; }',
    '.brd-img, .brd-ph { position: relative; aspect-ratio: 4 / 3; width: 100%; border-radius: 7px; background: #f3f6f9; border: 1px solid #e8edf3; overflow: hidden; }',
    '.brd-img img { display: block; width: 100%; height: 100%; object-fit: contain; }',
    '.brd-tier__fig figcaption { margin-top: 3px; font-size: 0.62rem; line-height: 1.35; color: #7a8aa0; overflow-wrap: anywhere; }',
    '.brd-ph { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 6px; text-align: center; }',
    '.brd-ph svg { width: 34%; max-width: 44px; height: auto; color: #a8b6c7; }',
    '.brd-ph a { font-size: 0.68rem; font-weight: 800; line-height: 1.35; color: #1d5fa8; text-decoration: none; word-break: keep-all; border-radius: 4px; }',
    '.brd-ph a:hover { text-decoration: underline; } .brd-ph a:focus-visible, .brd-tier__link:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    '.brd-tier__body { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; }',
    '.brd-tier__model { font-size: 0.86rem; font-weight: 800; line-height: 1.3; color: var(--sta-navy, #0f2747); overflow-wrap: anywhere; }',
    '.brd-tier__fam { font-size: 0.7rem; font-weight: 700; color: #7a8aa0; overflow-wrap: anywhere; }',
    '.brd-tier__txt { margin: 0; font-size: 0.76rem; line-height: 1.5; color: var(--sta-ink-2, #51627a); word-break: keep-all; overflow-wrap: anywhere; }',
    '.brd-tier__chips { display: flex; flex-wrap: wrap; gap: 4px; }',
    '.brd-tchip { display: inline-flex; align-items: center; gap: 3px; padding: 1px 7px; border-radius: 999px; font-size: 0.66rem; font-weight: 800; line-height: 1.6; white-space: nowrap; }',
    '.brd-tchip svg { width: 11px; height: 11px; }',
    '.brd-tchip--ours { background: var(--sta-cyan-soft, #e6f6f9); border: 1px solid #9fd8e2; color: #0b5f73; }',
    '.brd-tchip--disc { background: #fff4ec; border: 1px solid #f6cfb3; color: #9a3412; }',
    '.brd-tier__link { font-size: 0.68rem; font-weight: 700; color: #1d5fa8; text-decoration: none; border-radius: 4px; } .brd-tier__link:hover { text-decoration: underline; }',
    '.brd-tiernote { margin: 0; font-size: 0.74rem; line-height: 1.5; color: #64748b; word-break: keep-all; }',
    '.brd-tiernote::before { content: "※ "; }',
    '@container brdcard (max-width: 460px) {',
    '  .brd-tiers { grid-template-columns: minmax(0, 1fr); gap: 6px; }',
    '  .brd-tier { display: grid; grid-template-columns: 108px minmax(0, 1fr); gap: 10px; align-items: start; }',
    '  .brd-tier.is-empty { display: flex; flex-direction: row; align-items: center; gap: 8px; padding: 6px 8px; }',
    '}',
    '.brd-empty { grid-column: 1 / -1; padding: 28px 16px; text-align: center; border: 1px dashed var(--sta-line, #d6dee8); border-radius: var(--sta-r, 12px); color: #64748b; font-size: 0.88rem; }',
    /* 섹션 공통 */
    '.brd-sec { margin: 0 0 28px; }',
    '.brd-sec > h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: 1.08rem; font-weight: 800; color: var(--sta-navy, #0f2747); }',
    '.brd-sec > p { margin: 0 0 12px; font-size: 0.85rem; color: var(--sta-ink-2, #51627a); line-height: 1.6; word-break: keep-all; }',
    '.brd-princ { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; counter-reset: brdp; }',
    '.brd-princ li { counter-increment: brdp; padding: 14px 16px; border-radius: var(--sta-r, 12px); border: 1px solid var(--sta-line, #d6dee8); background: var(--sta-surface, #fff); }',
    '.brd-princ li::before { content: counter(brdp); display: inline-grid; place-items: center; width: 24px; height: 24px; margin-bottom: 8px; border-radius: 7px; background: var(--sta-navy, #0f2747); color: var(--sta-cyan-bright, #22d3ee); font-size: 0.8rem; font-weight: 800; }',
    '.brd-princ b { display: block; margin-bottom: 4px; font-size: 0.92rem; color: var(--sta-navy, #0f2747); }',
    '.brd-princ span { font-size: 0.82rem; line-height: 1.65; color: var(--sta-ink-2, #51627a); word-break: keep-all; }',
    /* 퀴즈 */
    '.brd-quiz { display: grid; gap: 12px; }',
    '.brd-q { margin: 0; padding: 14px 16px; border: 1px solid var(--sta-line, #d6dee8); border-radius: var(--sta-r, 12px); background: #f8fafc; min-width: 0; }',
    '.brd-q legend { float: left; width: 100%; padding: 0; margin-bottom: 10px; font-size: 0.9rem; font-weight: 800; color: var(--sta-navy, #0f2747); line-height: 1.5; word-break: keep-all; }',
    '.brd-q legend span { display: inline-grid; place-items: center; width: 22px; height: 22px; margin-right: 6px; border-radius: 6px; background: var(--brd-accent); color: #fff; font-size: 0.76rem; vertical-align: 1px; }',
    '.brd-opts { clear: both; display: grid; gap: 6px; }',
    '.brd-opt { display: flex; align-items: flex-start; gap: 9px; padding: 9px 12px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 0.86rem; line-height: 1.5; word-break: keep-all; }',
    '.brd-opt input { margin: 3px 0 0; flex: none; accent-color: var(--brd-accent); }',
    '.brd-opt:has(input:checked) { border-color: var(--brd-accent); background: var(--sta-cyan-soft, #e6f6f9); }',
    '.brd-opt:has(input:focus-visible) { outline: 2px solid var(--brd-accent); outline-offset: 1px; }',
    '.brd-opt.is-right, .brd-opt.is-right:has(input:checked) { border-color: var(--sta-ok-line, #6ee7b7); background: var(--sta-ok-bg, #ecfdf5); }',
    '.brd-q__row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }',
    '.brd-btn { font: inherit; font-size: 0.84rem; font-weight: 800; padding: 8px 16px; border-radius: 10px; border: 0; background: var(--brd-accent); color: #fff; cursor: pointer; }',
    '.brd-btn:hover { background: var(--sta-cyan-hover, #155e75); } .brd-btn:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    '.brd-btn.ghost { background: #fff; color: var(--brd-accent); border: 1px solid var(--sta-line, #d6dee8); }',
    '.brd-fb { font-size: 0.84rem; line-height: 1.6; word-break: keep-all; }',
    '.brd-fb:empty { display: none; }',
    '.brd-fb.ok { color: var(--sta-ok, #047857); } .brd-fb.no { color: var(--sta-bad, #c2410c); } .brd-fb.hint { color: #64748b; }',
    '.brd-fb b { margin-right: 4px; }',
    '.brd-fb p { margin: 4px 0 0; color: var(--sta-ink, #0f1f33); }',
    '.brd-score { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--sta-r, 12px); background: var(--sta-navy, #0f2747); color: #e2ecf7; font-size: 0.88rem; font-weight: 700; }',
    '.brd-score b { color: var(--sta-cyan-bright, #22d3ee); font-variant-numeric: tabular-nums; }',
    '.brd-score .brd-btn.ghost { margin-left: auto; }',
    /* 출처 */
    '.brd-src { border: 1px solid var(--sta-line, #d6dee8); border-radius: var(--sta-r, 12px); background: var(--sta-surface, #fff); }',
    '.brd-src > summary { padding: 12px 16px; cursor: pointer; font-size: 0.9rem; font-weight: 800; color: var(--sta-navy, #0f2747); border-radius: var(--sta-r, 12px); }',
    '.brd-src > summary:focus-visible { outline: 2px solid var(--brd-accent); outline-offset: 2px; }',
    '.brd-src__body { padding: 0 16px 14px; display: grid; gap: 14px; }',
    '.brd-src h3 { margin: 0 0 4px; font-size: 0.84rem; font-weight: 800; color: var(--sta-navy, #0f2747); }',
    '.brd-src ol { margin: 0; padding-left: 20px; display: grid; gap: 3px; }',
    '.brd-src li { font-size: 0.78rem; line-height: 1.5; color: #475569; overflow-wrap: anywhere; }',
    '.brd-src h4 { margin: 8px 0 3px; font-size: 0.76rem; font-weight: 800; color: #64748b; }',
    '.brd-src a { color: #1d5fa8; }',
    '.brd-date { margin: 10px 0 0; font-size: 0.78rem; color: #64748b; }',
    '@media (max-width: 760px) {',
    '  .brd-cat { grid-template-columns: minmax(0, 1fr); }',
    '  .brd-cat__main { padding: 16px; } .brd-cat__ico { width: 42px; height: 42px; } .brd-cat__ico svg { width: 24px; height: 24px; }',
    '  .brd-cat__look { padding: 14px 16px; }',
    '  .brd-chip { padding: 7px 10px 7px 8px; font-size: 0.82rem; }',
    '  .brd-switch { flex: 1 1 auto; justify-content: flex-start; }',
    '  .brd-lead { padding: 12px 14px; } .brd-lead__ico { display: none; }',
    '}',
    '@media (max-width: 420px) { .brd-legend { font-size: 0.76rem; } }',
    '@media (prefers-reduced-motion: reduce) { .brd-card, .brd-chip, .brd-switch__track, .brd-switch__track::after, .brd-more summary::before { transition: none; } }'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('brands-css')) return;
    var st = document.createElement('style'); st.id = 'brands-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- 아이콘 */
  var ICON = {
    mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    wireless: '<rect x="8.5" y="2.5" width="5" height="7" rx="2.5"/><path d="M9.3 9.5 10 21h2l.7-11.5"/><path d="M16.5 4.2a5 5 0 0 1 0 6.6M19.2 2.2a8.5 8.5 0 0 1 0 10.6"/>',
    console: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7.5 8v9M12 8v9M16.5 8v9"/><path d="M6 13h3M10.5 10h3M15 15h3"/>',
    amp: '<rect x="2.5" y="6.5" width="19" height="11" rx="1.5"/><circle cx="7" cy="12" r="2.2"/><circle cx="12.5" cy="12" r="2.2"/><path d="M16.8 10.5h2.6M16.8 13.5h2.6"/>',
    speaker: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="14.5" r="3.6"/><circle cx="12" cy="7" r="1.6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    church: '<path d="M12 2.5v4M10 4.5h4M6 21V11l6-4.5 6 4.5v10M3.5 21h17M10 21v-4.5a2 2 0 0 1 4 0V21"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>'
  };
  function ico(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICON[name] || '') + '</svg>'; }

  /* ------------------------------------------------------------- 도우미 */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s·\-_.,()&/|]+/g, ''); }
  var CATS = D.categories, BRANDS = D.brands, CAT = {};
  CATS.forEach(function (c) { CAT[c.id] = c; });
  BRANDS.forEach(function (b) {
    var c = CAT[b.cat] || {};
    b._hay = norm([b.name, b.ko, b.country, b.identity, b.known, b.tip, b.group, c.title, c.short, b.ours ? '우리교회장비 ' + b.ours.label + ' ' + b.ours.where : '']
      .concat((b.families || []).map(function (f) { return f.n + ' ' + f.d; }))
      .concat((b.tiers || []).map(function (t) { return t.model + ' ' + t.family + ' ' + t.text; })).concat(b.meet || []).join(' '));
  });
  var TIER_ORDER = ['entry', 'mid', 'high'];
  var TIER_LABEL = D.tierLabels || { entry: '엔트리', mid: '중급', high: '하이엔드' };

  var S = { category: CATS[0].id, query: '', oursOnly: false, quiz: D.quiz.map(function () { return { picked: null, ok: null }; }) };
  var root = null;

  function matchesQuery(b) { var q = norm(S.query); return !q || b._hay.indexOf(q) >= 0; }
  function inScope(b) { return (!S.oursOnly || !!b.ours) && matchesQuery(b); }
  function countFor(catId) { return BRANDS.filter(function (b) { return b.cat === catId && inScope(b); }).length; }
  function visibleBrands() {
    return BRANDS.filter(function (b) { return inScope(b) && (S.query ? true : b.cat === S.category); });
  }

  /* -------------------------------------------------------------- 그리기 */
  function placeholderHtml(b, t) {
    var c = CAT[b.cat] || {};
    return '<div class="brd-ph" data-ph="1">' + ico(c.icon) +
      '<a href="' + esc(t.url) + '" target="_blank" rel="noopener noreferrer">제조사 페이지에서 사진 보기 ↗<span class="brd-sr"> — ' + esc(b.name + ' ' + t.model) + ' (새 창)</span></a></div>';
  }
  function tierMediaHtml(b, t) {
    if (!t.img) return placeholderHtml(b, t);
    return '<figure class="brd-tier__fig"><div class="brd-img"><img src="' + esc(t.img) + '" alt="' + esc(b.name + ' ' + t.model) + '" loading="lazy" decoding="async" data-tierimg="' + esc(t.id) + '"></div>' +
      (t.credit ? '<figcaption>사진: ' + (t.creditUrl ? '<a href="' + esc(t.creditUrl) + '" target="_blank" rel="noopener">' + esc(t.credit) + '</a>' : esc(t.credit)) + '</figcaption>' : '') + '</figure>';
  }
  function tiersHtml(b) {
    var tiers = b.tiers || [];
    if (!tiers.length) return '';
    var by = {}; tiers.forEach(function (t) { by[t.tier] = t; });
    var h = '<ul class="brd-tiers" aria-label="' + esc(b.name) + ' 대표 제품: 엔트리 · 중급 · 하이엔드">';
    TIER_ORDER.forEach(function (lv) {
      var t = by[lv], lab = '<span class="brd-lvl brd-lvl--' + lv + '">' + esc(TIER_LABEL[lv]) + '</span>';
      if (!t) { h += '<li class="brd-tier is-empty" data-tier="' + lv + '">' + lab + '<p>이 단계 제품 없음</p></li>'; return; }
      h += '<li class="brd-tier' + (t.ours ? ' is-ours' : '') + '" data-tier="' + lv + '" data-tierid="' + esc(t.id) + '">' +
        '<div class="brd-tier__media">' + tierMediaHtml(b, t) + '</div>' +
        '<div class="brd-tier__body">' + lab +
          '<b class="brd-tier__model">' + esc(t.model) + '</b>' +
          (t.family ? '<span class="brd-tier__fam">' + esc(t.family) + '</span>' : '') +
          '<p class="brd-tier__txt">' + esc(t.text) + '</p>' +
          ((t.ours || t.discontinued) ? '<span class="brd-tier__chips">' +
            (t.ours ? '<span class="brd-tchip brd-tchip--ours" data-tierours="1">' + ico('church') + '우리 교회 장비</span>' : '') +
            (t.discontinued ? '<span class="brd-tchip brd-tchip--disc" data-tierdisc="1" title="제조사 사이트에 단종(또는 Legacy)으로 표시된 제품">단종</span>' : '') + '</span>' : '') +
          (t.img ? '<a class="brd-tier__link" href="' + esc(t.url) + '" target="_blank" rel="noopener noreferrer">제조사 페이지 ↗<span class="brd-sr"> (새 창)</span></a>' : '') +
        '</div></li>';
    });
    h += '</ul>';
    if (b.tierNote) h += '<p class="brd-tiernote">' + esc(b.tierNote) + '</p>';
    return h;
  }

  function cardHtml(b, showCat) {
    var c = CAT[b.cat];
    var h = '<article class="brd-card' + (b.ours ? ' is-ours' : '') + '" data-brand="' + esc(b.id) + '" data-cat="' + esc(b.cat) + '" aria-labelledby="brd-h-' + esc(b.id) + '">';
    h += '<div class="brd-card__top"><h3 id="brd-h-' + esc(b.id) + '">' + esc(b.name) + '<small>' + esc(b.ko) + '</small></h3><span class="brd-country" title="나라(본사·시작한 곳)">' + esc(b.country) + '</span></div>';
    if (showCat) h += '<span class="brd-catname">' + esc(c.title) + '</span>';
    if (b.ours) h += '<span class="brd-ours" data-ours="1">' + ico('church') + '우리 교회 장비 · ' + esc(b.ours.label) + '</span>';
    h += '<p class="brd-card__id">' + esc(b.identity) + '</p>';
    h += '<ul class="brd-tags" aria-label="대표 제품군">' + (b.families || []).map(function (f) { return '<li>' + esc(f.n) + '</li>'; }).join('') + '</ul>';
    h += tiersHtml(b);
    h += '<details class="brd-more"><summary>자세히 보기</summary><div class="brd-more__body">';
    h += '<div><h4>무엇으로 알려져 있나요</h4><p>' + esc(b.known) + '</p></div>';
    h += '<div><h4>대표 제품군과 쓰임새</h4><ul class="brd-fams">' + (b.families || []).map(function (f) { return '<li><b>' + esc(f.n) + '</b><span>' + esc(f.d) + '</span></li>'; }).join('') + '</ul></div>';
    if (b.meet && b.meet.length) h += '<div><h4>주로 만나는 곳</h4><ul class="brd-meet">' + b.meet.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>';
    if (b.ours) h += '<div><h4>우리 교회에서는</h4><p>' + esc(b.ours.label) + ' — ' + esc(b.ours.where) + '</p></div>';
    if (b.tip) h += '<div class="brd-tip"><b>알아 두면 좋은 점</b> ' + esc(b.tip) + '</div>';
    if (b.group) h += '<div class="brd-group">소속: ' + esc(b.group) + ' (' + esc(D.asOf) + ' 확인)</div>';
    h += '</div></details></article>';
    return h;
  }

  function renderChips() {
    var el = root.querySelector('.brd-chips');
    el.innerHTML = CATS.map(function (c) {
      var n = countFor(c.id), sel = !S.query && c.id === S.category;
      return '<button type="button" role="tab" class="brd-chip' + (n ? '' : ' is-zero') + '" id="brd-tab-' + c.id + '" data-brdcat="' + c.id + '" aria-selected="' + sel + '" aria-controls="brdPanel" tabindex="' + (sel || (S.query && c === CATS[0]) ? '0' : '-1') + '">' +
        ico(c.icon) + '<span>' + esc(c.short) + '</span><span class="brd-chip__n" aria-label="' + n + '개">' + n + '</span></button>';
    }).join('');
  }

  function renderCat() {
    var el = root.querySelector('.brd-catwrap');
    if (S.query) { el.innerHTML = ''; return; }
    var c = CAT[S.category];
    el.innerHTML = '<section class="brd-cat" data-catpanel="' + c.id + '" aria-labelledby="brd-cat-h">' +
      '<div class="brd-cat__main"><div class="brd-cat__ico">' + ico(c.icon) + '</div><div><h2 id="brd-cat-h">' + esc(c.title) + '</h2><p>' + esc(c.intro) + '</p>' +
      '<div class="brd-cat__mods">' + c.modules.map(function (m) { return '<button type="button" class="brd-modlink" data-module="' + esc(m.id) + '">📘 ' + esc(m.label) + ' 열기</button>'; }).join('') + '</div></div></div>' +
      '<div class="brd-cat__look"><h3>고를 때 이것을 봐요</h3><ul>' + c.look.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></section>';
  }

  function renderGrid() {
    var list = visibleBrands();
    var st = root.querySelector('.brd-status'), grid = root.querySelector('.brd-grid');
    var msg;
    if (S.query) msg = '「' + esc(S.query) + '」 검색 결과: 모든 분류에서 <b>' + list.length + '개</b>' + (S.oursOnly ? ' (우리 교회 장비만)' : '');
    else msg = esc(CAT[S.category].title) + ' — <b>' + list.length + '개 브랜드</b>' + (S.oursOnly ? ' (우리 교회 장비만)' : '');
    var btns = '';
    if (S.query) btns += '<button type="button" data-brdclear="q">검색 지우기</button>';
    if (S.oursOnly) btns += '<button type="button" data-brdclear="ours">모든 브랜드 보기</button>';
    st.innerHTML = '<span>' + msg + '</span>' + btns;
    grid.innerHTML = list.length ? list.map(function (b) { return cardHtml(b, !!S.query); }).join('') :
      '<p class="brd-empty">' + (S.oursOnly && !S.query ? '이 분류에는 우리 교회에서 쓰는 브랜드가 없어요. 다른 분류를 눌러 보거나 「모든 브랜드 보기」를 눌러요.' : '찾는 브랜드가 없어요. 다른 말로 검색해 보세요 (예: SM58, 무선, 독일).') + '</p>';
  }

  function renderQuiz() {
    var el = root.querySelector('.brd-quiz');
    el.innerHTML = D.quiz.map(function (q, i) {
      return '<fieldset class="brd-q" data-brdq="' + i + '"><legend><span>' + (i + 1) + '</span>' + esc(q.q) + '</legend><div class="brd-opts">' +
        q.options.map(function (o, j) { return '<label class="brd-opt"><input type="radio" name="brdq' + i + '" value="' + j + '"><span>' + esc(o.t) + '</span></label>'; }).join('') +
        '</div><div class="brd-q__row"><button type="button" class="brd-btn" data-brdchk="' + i + '">정답 확인</button><div class="brd-fb" role="status" aria-live="polite"></div></div></fieldset>';
    }).join('') + '<div class="brd-score" role="status" aria-live="polite"></div>';
    updateScore();
  }

  function updateScore() {
    var el = root.querySelector('.brd-score'); if (!el) return;
    var done = S.quiz.filter(function (x) { return x.ok !== null; }).length, right = S.quiz.filter(function (x) { return x.ok; }).length;
    el.innerHTML = '<span>' + D.quiz.length + '문제 중 <b>' + right + '</b>개 맞혔어요' + (done < D.quiz.length ? ' (확인한 문제 ' + done + '개)' : right === D.quiz.length ? ' — 모두 맞혔어요! 👏' : ' — 틀린 문제는 다시 골라 확인해 보세요.') + '</span>' +
      '<button type="button" class="brd-btn ghost" data-brdreset="1">다시 풀기</button>';
  }

  function checkQuiz(i) {
    var q = D.quiz[i], fs = root.querySelector('[data-brdq="' + i + '"]'), fb = fs.querySelector('.brd-fb');
    var picked = fs.querySelector('input:checked');
    fs.querySelectorAll('.brd-opt').forEach(function (l) { l.classList.remove('is-right'); });
    if (!picked) { fb.className = 'brd-fb hint'; fb.innerHTML = '먼저 답을 하나 골라 주세요.'; return; }
    var j = +picked.value, ok = !!q.options[j].ok;
    S.quiz[i] = { picked: j, ok: ok };
    if (ok) {
      fs.querySelectorAll('.brd-opt')[j].classList.add('is-right');
      fb.className = 'brd-fb ok'; fb.innerHTML = '<b>정답이에요!</b><p>' + esc(q.why) + '</p>';
    } else {
      fb.className = 'brd-fb no'; fb.innerHTML = '<b>다시 생각해 보세요.</b><p>' + esc(q.why) + '</p>';
    }
    updateScore();
  }

  function renderSources() {
    var el = root.querySelector('.brd-srcwrap');
    function link(u, t) { return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(t) + '</a></li>'; }
    var nTier = 0;
    var body = CATS.map(function (c) {
      var prods = [];
      BRANDS.forEach(function (b) {
        if (b.cat !== c.id) return;
        TIER_ORDER.forEach(function (lv) { (b.tiers || []).forEach(function (t) { if (t.tier === lv) prods.push(link(t.url, b.name + ' ' + t.model + ' — ' + TIER_LABEL[lv] + (t.discontinued ? ' (단종)' : ''))); }); });
      });
      nTier += prods.length;
      return '<div data-srccat="' + c.id + '"><h3>' + esc(c.title) + '</h3><ol>' + c.sources.map(function (s) { return link(s.u, s.t); }).join('') + '</ol>' +
        (prods.length ? '<h4>대표 제품 페이지 (제조사 · ' + esc(D.asOf) + ' 확인)</h4><ol>' + prods.join('') + '</ol>' : '') + '</div>';
    }).join('');
    var nSrc = CATS.reduce(function (n, c) { return n + c.sources.length; }, 0);
    el.innerHTML = '<details class="brd-src"><summary>출처 보기 (분류별 자료 ' + nSrc + '개 · 대표 제품 페이지 ' + nTier + '개)</summary><div class="brd-src__body">' + body + '</div></details>' +
      '<p class="brd-date">📅 ' + esc(D.dateNote) + ' 로고와 제조사 제품 사진은 상표·저작권 때문에 쓰지 않아요. 사진이 있는 칸은 자유 이용이 허락된 사진(위키미디어 공용 등)을 출처와 함께 넣은 것이고, 사진이 없는 칸은 제조사 페이지에서 볼 수 있어요.</p>';
  }

  function renderAll() {
    root.innerHTML =
      '<div class="brd">' +
        '<div class="brd-lead"><div class="brd-lead__ico">' + ico('tag') + '</div><div><p>' + esc(D.lead) + '</p><small>📅 ' + esc(D.dateNote) + '</small></div></div>' +
        '<div class="brd-tools">' +
          '<div class="brd-search" role="search">' + ico('search') + '<label class="brd-sr" for="brdSearch">브랜드·제품 검색</label>' +
            '<input id="brdSearch" type="search" autocomplete="off" placeholder="검색 (예: Shure, SM58, 독일)" value="' + esc(S.query) + '">' +
            '<button type="button" class="brd-search__clear" data-brdclear="q" aria-label="검색어 지우기"' + (S.query ? '' : ' hidden') + '>✕</button></div>' +
          '<button type="button" class="brd-switch" role="switch" id="brdOurs" aria-checked="' + S.oursOnly + '"><span class="brd-switch__track" aria-hidden="true"></span>우리 교회 장비만</button>' +
        '</div>' +
        '<div class="brd-chips" role="tablist" aria-label="장비 분류"></div>' +
        '<div id="brdPanel">' +
          '<div class="brd-catwrap"></div>' +
          '<p class="brd-legend" data-brdlegend="1"><span class="brd-legend__lvls" aria-hidden="true">' + TIER_ORDER.map(function (lv) { return '<span class="brd-lvl brd-lvl--' + lv + '">' + esc(TIER_LABEL[lv]) + '</span>'; }).join('') + '</span><span>' + esc(D.tierLegend || '엔트리 · 중급 · 하이엔드는 가격·용도 기준의 대략적인 구분이에요.') + '</span></p>' +
          '<div class="brd-status" aria-live="polite"></div>' +
          '<div class="brd-grid"></div>' +
        '</div>' +
        '<section class="brd-sec" aria-labelledby="brd-p-h"><h2 id="brd-p-h">💡 브랜드보다 중요한 것</h2><p>좋은 브랜드를 아는 것도 도움이 되지만, 실제로 장비를 고르고 쓸 때는 아래 네 가지가 더 중요해요.</p>' +
          '<ul class="brd-princ">' + D.principles.map(function (p) { return '<li><b>' + esc(p.t) + '</b><span>' + esc(p.d) + '</span></li>'; }).join('') + '</ul></section>' +
        '<section class="brd-sec" aria-labelledby="brd-q-h"><h2 id="brd-q-h">🧩 브랜드 퀴즈</h2><p>위에서 본 내용으로 풀어 봐요. 답을 고르고 「정답 확인」을 누르면 설명이 나와요.</p><div class="brd-quiz"></div></section>' +
        '<section class="brd-sec" aria-labelledby="brd-s-h"><h2 id="brd-s-h">📚 출처와 확인 날짜</h2><div class="brd-srcwrap"></div></section>' +
      '</div>';
    renderChips(); renderCat(); renderGrid(); renderQuiz(); renderSources();
  }

  function refresh() {
    renderChips(); renderCat(); renderGrid();
    var cl = root.querySelector('.brd-search__clear'); if (cl) cl.hidden = !S.query;
    var sw = root.querySelector('#brdOurs'); if (sw) sw.setAttribute('aria-checked', String(S.oursOnly));
  }

  /* ---------------------------------------------------------------- API */
  function setCategory(id) {
    if (!CAT[id]) return false;
    S.category = id; S.query = '';
    var inp = root && root.querySelector('#brdSearch'); if (inp) inp.value = '';
    if (root) refresh();
    return true;
  }
  function search(q) {
    S.query = String(q || '').trim();
    var inp = root && root.querySelector('#brdSearch'); if (inp && inp.value.trim() !== S.query) inp.value = S.query;
    if (root) refresh();
    return visibleBrands().map(function (b) { return b.id; });
  }
  function setOursOnly(v) { S.oursOnly = !!v; if (root) refresh(); return S.oursOnly; }
  function state() {
    var counts = {}; CATS.forEach(function (c) { counts[c.id] = countFor(c.id); });
    var totals = {}; CATS.forEach(function (c) { totals[c.id] = BRANDS.filter(function (b) { return b.cat === c.id; }).length; });
    return {
      category: S.category, query: S.query, oursOnly: S.oursOnly,
      visible: visibleBrands().map(function (b) { return b.id; }),
      rendered: root ? [].map.call(root.querySelectorAll('.brd-card'), function (c) { return c.getAttribute('data-brand'); }) : [],
      ours: BRANDS.filter(function (b) { return b.ours; }).map(function (b) { return b.id; }),
      tiers: BRANDS.reduce(function (n, b) { return n + (b.tiers || []).length; }, 0),
      counts: counts, totals: totals, total: BRANDS.length,
      quiz: { total: D.quiz.length, answered: S.quiz.filter(function (x) { return x.ok !== null; }).length, correct: S.quiz.filter(function (x) { return x.ok; }).length }
    };
  }

  /* ------------------------------------------------------------- 이벤트 */
  function bind() {
    root.addEventListener('click', function (e) {
      var t = e.target; if (!t || !t.closest) return;
      var chip = t.closest('[data-brdcat]'); if (chip) { setCategory(chip.getAttribute('data-brdcat')); var f = root.querySelector('#brd-tab-' + S.category); if (f) f.focus(); return; }
      var clr = t.closest('[data-brdclear]');
      if (clr) { if (clr.getAttribute('data-brdclear') === 'q') { search(''); var inp = root.querySelector('#brdSearch'); if (inp) inp.focus(); } else setOursOnly(false); return; }
      if (t.closest('#brdOurs')) { setOursOnly(!S.oursOnly); return; }
      var chk = t.closest('[data-brdchk]'); if (chk) { checkQuiz(+chk.getAttribute('data-brdchk')); return; }
      if (t.closest('[data-brdreset]')) { S.quiz = D.quiz.map(function () { return { picked: null, ok: null }; }); renderQuiz(); var q0 = root.querySelector('[data-brdq="0"]'); if (q0) q0.scrollIntoView({ block: 'nearest' }); return; }
    });
    // 사진을 못 불러오면(경로 오타·파일 없음) 자리표시 + 제조사 링크로 바꿔요.
    root.addEventListener('error', function (e) {
      var img = e.target; if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-tierimg')) return;
      var li = img.closest('.brd-tier'), card = img.closest('.brd-card'); if (!li || !card) return;
      var b = BRANDS.filter(function (x) { return x.id === card.getAttribute('data-brand'); })[0];
      var t = b && (b.tiers || []).filter(function (x) { return x.id === img.getAttribute('data-tierimg'); })[0];
      var media = li.querySelector('.brd-tier__media'); if (t && media) { media.innerHTML = placeholderHtml(b, t); li.setAttribute('data-imgfailed', '1'); }
    }, true);
    root.addEventListener('input', function (e) { if (e.target && e.target.id === 'brdSearch') { S.query = e.target.value.trim(); refresh(); } });
    root.addEventListener('keydown', function (e) {
      var chip = e.target && e.target.closest && e.target.closest('[data-brdcat]');
      if (chip && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End')) {
        e.preventDefault();
        var i = CATS.findIndex(function (c) { return c.id === chip.getAttribute('data-brdcat'); });
        i = e.key === 'Home' ? 0 : e.key === 'End' ? CATS.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + CATS.length) % CATS.length;
        setCategory(CATS[i].id); var f = root.querySelector('#brd-tab-' + CATS[i].id); if (f) f.focus();
      }
      if (e.target && e.target.id === 'brdSearch' && e.key === 'Escape' && S.query) { search(''); }
    });
  }

  function init() {
    root = document.getElementById('brandRoot');
    if (!root || root.getAttribute('data-brd-ready')) return;
    injectCss(); renderAll(); bind(); root.setAttribute('data-brd-ready', '1');
  }

  window.STABrands = { state: state, setCategory: setCategory, search: search, setOursOnly: setOursOnly };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
