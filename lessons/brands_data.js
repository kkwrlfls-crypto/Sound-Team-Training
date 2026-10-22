/* =============================================================================
   장비 브랜드 알아보기 — 데이터 (2026-10-23)
   - 화면은 lessons/brands.js 가 그립니다. 여기에는 내용만 있어요.
   - 모든 사실(나라·소속 회사·제품군)은 2026년 10월에 제조사 사이트·신뢰할 만한 자료로 확인했고,
     각 분류의 sources 에 근거를 적었습니다. 확인하지 못한 소속(모회사) 정보는 일부러 적지 않았어요.
   - 로고·제품 사진은 넣지 않습니다(상표·저작권). 브랜드 이름은 글자로만 보여 줍니다.
   - ours: 우리 교회에서 실제로 쓰는 장비 → 「우리 교회 장비」 배지
   ============================================================================= */
window.STA_BRANDS = {
  asOf: '2026년 10월',
  dateNote: '브랜드·제품 정보는 2026년 10월 기준으로 확인했고, 바뀔 수 있어요. 회사 소속(모회사)은 자주 바뀌니, 확인된 경우에만 적었어요.',
  lead: '현장에서 장비 이름표를 보면 브랜드가 먼저 눈에 들어와요. 브랜드마다 잘하는 분야와 쓰는 방식이 조금씩 달라요. 순위를 매기려는 게 아니라, 「이 장비는 어떤 회사가 어떤 용도로 만든 것인지」 알아보는 게 목적이에요.',

  categories: [
    { id: 'mic', title: '마이크(유선)', short: '마이크', icon: 'mic',
      modules: [{ id: 'mic', label: '마이크 모듈' }],
      intro: '유선 마이크는 브랜드마다 주력 분야가 달라요. 라이브 보컬용 다이내믹 마이크가 강한 회사도 있고, 스튜디오용 콘덴서나 몸에 붙이는 작은 마이크가 강한 회사도 있어요.',
      look: ['다이내믹인지 콘덴서인지 (콘덴서는 팬텀 전원 필요)', '지향성 — 카디오이드·슈퍼카디오이드·무지향', '용도 — 보컬, 악기, 설교용 헤드셋·핀마이크, 성가대', '현장에서 떨어뜨려도 버티는 내구성'],
      sources: [
        { t: 'Shure — Wikipedia (본사·제품군 연혁)', u: 'https://en.wikipedia.org/wiki/Shure' },
        { t: 'Shure SM58S (스위치 있는 SM58) — Full Compass 제품 페이지', u: 'https://fullcompass.com/prod/019046-shure-sm58s-cardioid-dynamic-vocal-mic-with-on-off-switch' },
        { t: 'Sennheiser — Wikipedia (창업·본사·Neumann 인수)', u: 'https://en.wikipedia.org/wiki/Sennheiser' },
        { t: 'Sennheiser Group Facts & Figures (그룹 회사 목록)', u: 'https://cdn.uc.assets.prezly.com/14bbdbc0-1c39-4f7b-88c0-c3be38aca2cb/-/inline/no/Sennheiser%20Group_FactsFigures_en.pdf' },
        { t: 'Sennheiser evolution 시리즈 리뷰 — Sound On Sound', u: 'https://www.soundonsound.com/reviews/sennheiser-evolution-series' },
        { t: 'Audio-Technica — Our Story (제조사)', u: 'https://www.audio-technica.com/en-eu/our-story' },
        { t: 'Audio-Technica Pro Live 카탈로그 (제조사)', u: 'https://www.audio-technica.com/uploads/Pro_Live_Catalog-2019-L00069ENG_V1.0_web.pdf' },
        { t: 'AKG — Wikipedia (빈에서 시작·HARMAN 소속)', u: 'https://en.wikipedia.org/wiki/AKG_(company)' },
        { t: 'HARMAN Professional 브랜드 목록 (제조사)', u: 'https://pro.harman.com/media-coverage/soundcraft' },
        { t: 'Neumann KMS 104/105 소개 — Expandore', u: 'https://expandore.com/professional-audio/Neumann/Current_Microphones/cm_28.htm' },
        { t: 'Neumann KM 184 — Vintage King', u: 'https://vintageking.com/products/neumann-km-184-ni' },
        { t: 'DPA 본사(덴마크 Allerød) — ProSoundWeb', u: 'https://www.prosoundweb.com/rcf-group-acquires-dpa-microphones/' },
        { t: 'DPA 제품군 (d:fine·d:screet·4099·성가대용) — CCI Solutions', u: 'https://shop.ccisolutions.com/StoreFront/category/dpa-microphones' }
      ] },
    { id: 'wireless', title: '무선 마이크·인이어 모니터', short: '무선·인이어', icon: 'wireless',
      modules: [{ id: 'mic', label: '마이크 모듈' }],
      intro: '무선은 마이크 소리만큼 「전파」가 중요해요. 브랜드와 시리즈마다 쓰는 주파수 대역, 디지털 방식, 동시에 쓸 수 있는 채널 수, 배터리 관리 방법이 달라요.',
      look: ['국내에서 쓸 수 있는 주파수 대역인지, 국내 전파 인증(KC)을 받은 정식 유통 제품인지', '디지털/아날로그 방식과 동시에 쓸 채널 수', '배터리 — 건전지인지 충전식인지, 남은 양이 수신기에 보이는지', '수신기 출력 — 아날로그(XLR)만인지, Dante 같은 네트워크 출력도 있는지'],
      sources: [
        { t: 'Shure — Wikipedia (ULX-D·SLX-D·Axient Digital·PSM 연혁)', u: 'https://en.wikipedia.org/wiki/Shure' },
        { t: 'Shure ULX-D 발표 — ProSoundWeb (기업·교육·예배·공연 시설용)', u: 'https://www.prosoundweb.com/shure-unveils-ulx-d-digital-wireless-system/' },
        { t: 'Shure PSM 300 발표 — Shure Newsroom', u: 'https://www.shure.com/en-US/newsroom/shure-introduces-psm-300-stereo-personal-monitor-systems' },
        { t: 'Sennheiser EW-DX 리뷰 (EW-D·Digital 6000 과 비교) — AudioTechnology', u: 'https://www.audiotechnology.com/?p=77258' },
        { t: 'Sennheiser ew IEM G4 (제조사)', u: 'https://sennheiser.com/en-ae/catalog/products/wireless-systems/ew-iem-g4-twin' },
        { t: 'Audio-Technica Pro Live 카탈로그 — 3000 시리즈·System 10·M3 (제조사)', u: 'https://www.audio-technica.com/uploads/Pro_Live_Catalog-2019-L00069ENG_V1.0_web.pdf' },
        { t: 'Sony Pro Audio — DWX·UWP-D (제조사)', u: 'https://pro.sony/en_GL/products/audio/pro-audio' },
        { t: '해외직구 무선 마이크 전파 안전성 시험 — 경향신문(2025-11)', u: 'https://www.khan.co.kr/article/202511181442001/' }
      ] },
    { id: 'console', title: '콘솔(믹서)', short: '콘솔', icon: 'console',
      modules: [{ id: 'console', label: '콘솔 모듈' }, { id: 'gain-structure', label: 'Gain Structure 모듈' }],
      intro: '콘솔은 기본 원리(GAIN → EQ → 페이더 → 버스)는 같지만, 브랜드마다 화면 구성과 메뉴 이름, 스테이지박스 연결 방식이 달라요. 한 브랜드에 익숙해지면 같은 브랜드의 다른 모델은 금방 배워요.',
      look: ['필요한 입력·출력(AUX·모니터) 채널 수', '아날로그인지 디지털인지 — 디지털은 씬 저장·불러오기 가능', '스테이지박스 연결 방식(Dante·AES50·전용 방식)이 맞는지', '봉사자가 배우기 쉬운지, 교육 자료가 있는지'],
      sources: [
        { t: 'Yamaha 믹서 제품군 (CL·QL 단종 표시 포함) — 제조사', u: 'https://usa.yamaha.com/products/proaudio/mixers/' },
        { t: 'Yamaha 회사 개요 (하마마쓰 본사) — 제조사', u: 'https://www.yamaha.com/en/about/profile' },
        { t: 'Allen & Heath 회사 소개 — 제조사', u: 'https://www.allen-heath.com/company/allen-heath/' },
        { t: 'Allen & Heath 제품군 — 제조사', u: 'https://www.allen-heath.com/hardware' },
        { t: 'Audiotonix 브랜드 목록(Allen & Heath·DiGiCo) — SVG (2026-02)', u: 'https://www.sportsvideo.org/2026/02/02/audiotonix-acquires-dpa-microphones-wisycom-and-austrian-audio/' },
        { t: 'Midas Consoles — Wikipedia', u: 'https://en.wikipedia.org/wiki/Midas_Consoles' },
        { t: 'Midas M32·DL32 발표 — rAVe', u: 'https://ravepubs.com/midas-m32-digital-console/' },
        { t: 'Behringer — Wikipedia', u: 'https://en.wikipedia.org/wiki/Behringer' },
        { t: 'Music Tribe — Wikipedia (브랜드 목록)', u: 'https://en.wikipedia.org/wiki/Music_Tribe' },
        { t: 'X32 과 S16 연결(AES50) — Sweetwater', u: 'https://www.sweetwater.com/sweetcare/articles/behringer-x32-s16-setup/' },
        { t: 'Behringer WING 과 X32/M32 비교 — Drew Brashler', u: 'https://drewbrashler.com/2025/behringer-wing-vs-x32-m32/' },
        { t: 'Soundcraft — Wikipedia', u: 'https://en.wikipedia.org/wiki/Soundcraft' },
        { t: 'DiGiCo — Wikipedia', u: 'https://en.wikipedia.org/wiki/DiGiCo' },
        { t: 'Avid Technology — Wikipedia (본사)', u: 'https://en.wikipedia.org/wiki/Avid_Technology' },
        { t: 'Avid VENUE | S6L — Avid 보도자료', u: 'https://ir.avid.com/news-releases/news-release-details/avid-expands-venue-s6l-live-sound-platform-delivers-promise' },
        { t: 'Avid NAMM 2026 (VENUE | S6L 시연) — SVG', u: 'https://www.sportsvideo.org/2026/01/14/namm-2026-avid-powers-art-of-sound-with-immersive-intelligent-and-integrated-audio-tools/' }
      ] },
    { id: 'amp', title: '파워앰프', short: '파워앰프', icon: 'amp',
      modules: [{ id: 'amp', label: '앰프 모듈' }],
      intro: '파워앰프는 「얼마나 큰 힘을 몇 채널로 내는지」가 기본이고, 브랜드에 따라 스피커 전용 설정(프리셋), 네트워크 원격 감시, 설치용·투어용 구분이 달라요. 어떤 스피커 회사는 자기 스피커에 맞춘 전용 앰프를 함께 만들어요.',
      look: ['출력(W)과 스피커 임피던스(Ω)가 맞는지', '채널 수 — 2채널, 4채널, 8채널', '스피커 회사 전용 설정이 필요한지 (전용 앰프)', '설치용(랙 고정·원격 감시)인지 이동·투어용인지'],
      sources: [
        { t: 'Crown XLi 1500 (2채널, 예배당·이동 PA 등) — JBL Pro/HARMAN', u: 'https://jblpro.com/en/products/xli-1500' },
        { t: 'Crown International — Wikipedia', u: 'https://en.wikipedia.org/wiki/Crown_International' },
        { t: 'Crown 설치용 앰프 가이드(DCi·I-Tech HD) — Sound Technology', u: 'https://soundtech.co.uk/pro-blog/our-guide-to-harmans-crown-audio-install-amplifier-range' },
        { t: 'Powersoft 브랜드 정보 — Equipboard', u: 'https://equipboard.com/brands/powersoft' },
        { t: 'Powersoft X 시리즈 투어링 앰프 — 제조사', u: 'https://powersoft.com/en/products/touring-amps/x-series' },
        { t: 'QSC 인수(Acuity Brands, 2025-01) — Orange County Business Journal', u: 'https://www.ocbj.com/technology/costa-mesa-av-firm-qsc-thrives-under-new-owners/' },
        { t: 'QSC CX-Q 네트워크 앰프 — Q-SYS', u: 'https://in.qsys.com/resources/news/detail/qsc-introduces-cx-q-series-network-amplifiers-for-the-q-sys-ecosystem/' },
        { t: 'QSC K.2 시리즈 — 제조사', u: 'https://qsc.com/k.2' },
        { t: 'Lab.gruppen — Wikipedia', u: 'https://en.wikipedia.org/wiki/Lab_Gruppen' },
        { t: 'Lab.gruppen D 시리즈 DSP 앰프 — SVG Europe', u: 'https://www.svgeurope.org/blog/headlines/lab-gruppen-eyes-sports-stadia-potential-with-new-d-series-dsp-amps/' },
        { t: 'd&b 40D 설치용 4채널 앰프 — 제조사', u: 'https://www.dbaudio.com/global/de/produkte/verstaerker/40d-verstaerker' },
        { t: 'd&b 10D·30D 설치용 앰프 발표 — 제조사', u: 'https://www.dbaudio.com/global/en/about-db/press/newsroom/15062015-infocomm-marks-the-launch-of-the-eagerly-anticipated-installation-specific-db-amplifiers' },
        { t: 'd&b D40 이동용 앰프 — 제조사', u: 'https://www.dbaudio.com/global/en/products/amplifiers/d40/' }
      ] },
    { id: 'speaker', title: '스피커(라이브·설치용)', short: '스피커', icon: 'speaker',
      modules: [{ id: 'speaker', label: '스피커 모듈' }],
      intro: '스피커 브랜드는 대형 공연용 라인 어레이부터 예배당에 고정하는 설치용, 들고 다니는 파워드 스피커까지 주력 분야가 달라요. 같은 브랜드 안에서도 시리즈마다 용도가 뚜렷하게 나뉘어요.',
      look: ['공간 크기와 소리가 퍼지는 각도(커버리지)', '앰프 내장(파워드)인지, 따로 앰프가 필요한(패시브) 것인지', '설치용(고정·색상 맞춤)인지 이동용인지', '전용 앰프·소프트웨어로 설정하는 시스템인지'],
      sources: [
        { t: 'd&b audiotechnik — Wikipedia', u: 'https://en.wikipedia.org/wiki/D%26b_audiotechnik' },
        { t: 'd&b E8 (시리즈 목록 포함) — 제조사', u: 'https://www.dbaudio.com/global/en/products/series/e-series/e8/' },
        { t: 'd&b Y-Series 소개 — AudioTechnology', u: 'https://www.audiotechnology.com/news/db-audiotechnik-y-series' },
        { t: 'd&b Vi7P·Vi10P 설치용 포인트 소스 — 제조사', u: 'https://dbaudio.com/global/en/about-db/press/newsroom/08042016-v-series-point-sources-pick-up-best-of-show-award-at-prolight-sound-2016' },
        { t: 'L-Acoustics — Wikipedia', u: 'https://en.wikipedia.org/wiki/L-Acoustics' },
        { t: 'L-Acoustics 카탈로그 2025-12 — Bestec Audio', u: 'https://www.bestecaudio.com/wp/wp-content/uploads/LA_Catalogue_2512.pdf' },
        { t: 'Meyer Sound Laboratories — Wikipedia', u: 'https://en.wikipedia.org/wiki/Meyer_Sound_Laboratories' },
        { t: 'Meyer Sound 제품(PANTHER·LEOPARD·ULTRA-X) — Sweetwater', u: 'https://www.sweetwater.com/brand/meyer-sound' },
        { t: 'JBL EON700 발표 (EON 1995년부터) — JBL Pro', u: 'https://jblpro.com/en/news/jbl-professional-introduces-eon700-series-portable-pa-loudspeakers-and-subwoofer-with-bluetooth' },
        { t: 'JBL PRX·SRX 비교 — SoundPro', u: 'https://soundpro.com/pages/featured/jbl-may-2026' },
        { t: 'JBL VTX A12 — JBL Pro', u: 'https://jblpro.com/products/vtx-a12' },
        { t: 'Electro-Voice 연혁 (Keenfinity 소속) — 제조사', u: 'https://www.electrovoice.com/our-history' },
        { t: 'Keenfinity, Bosch 에서 매각 완료(2025-06) — Keenfinity', u: 'https://www.keenfinity-group.com/xm/en/news/press-room/sale-of-keenfinity-group-from-bosch-completed' },
        { t: 'Electro-Voice ZXA1 (앰프 내장 8인치) — Full Compass', u: 'https://www.fullcompass.com/prod/189905-electro-voice-zxa1-w-8-2-way-800w-powered-loudspeaker-white' },
        { t: 'Electro-Voice ZX1 (패시브 8인치) — SoundPro', u: 'https://soundpro.com/products/electro-voice-zx1-90-8-inch-passive-speaker' },
        { t: 'Electro-Voice EVOLVE — 제조사', u: 'https://products.electrovoice.com/emea/zh/evolve' },
        { t: 'RCF audio — Wikipedia', u: 'https://en.wikipedia.org/wiki/RCF_audio' },
        { t: 'NEXO 연혁 (Yamaha 인수 2008) — 제조사', u: 'https://www.nexo-sa.com/about-us/history' },
        { t: 'Martin Audio 라이브 제품군 — 제조사', u: 'https://martin-audio.com/live' },
        { t: 'Focusrite 그룹의 Martin Audio 인수 — Focusrite', u: 'https://us.focusrite.com/articles/the-focusrite-group-announces-the-acquisition-of-martin-audio-ltd/' }
      ] },
    { id: 'stagebox', title: '스테이지박스·네트워크 오디오·DI', short: '스테이지박스·DI', icon: 'stagebox',
      modules: [{ id: 'cable', label: '케이블 모듈 (네트워크 오디오)' }, { id: 'console', label: '콘솔 모듈' }],
      intro: '스테이지박스는 무대의 마이크 신호를 디지털로 바꿔 랜선 하나로 콘솔까지 보내 줘요. 브랜드마다 쓰는 연결 방식(Dante, AES50, 전용 방식)이 달라서, 대개 「콘솔과 짝이 맞는 것」을 골라야 해요. DI 박스는 건반·기타 같은 악기 신호를 마이크 입력에 맞게 바꿔 주는 작은 상자예요.',
      look: ['콘솔과 같은 연결 방식인지 — Dante, AES50, dSnake 등', '필요한 입력·출력 채널 수', 'DI 는 액티브(팬텀 전원 사용)인지 패시브인지', '네트워크 장비(스위치)와 설정 프로그램을 누가 관리하는지'],
      sources: [
        { t: 'Yamaha Dante 인터페이스 (Rio-D2 단종·Rio-D3·Tio) — Canford', u: 'https://www.canford.co.uk/YAMAHA-DANTE-INTERFACES' },
        { t: 'Dante 의 역사와 Audinate — ProSoundWeb', u: 'https://www.prosoundweb.com/nearly-two-decades-of-dante-the-history-evolution-of-audinates-networking-platforn/' },
        { t: 'Dante Controller 무료 제공 — LSi', u: 'https://lsionline.co.uk/news/dante-controller-updated-dark-mode' },
        { t: 'Radial Engineering 연혁 — 제조사', u: 'https://www.radialeng.com/history' },
        { t: 'Allen & Heath 제품군(I/O 확장·네트워킹) — 제조사', u: 'https://www.allen-heath.com/hardware' },
        { t: 'Allen & Heath DX168 dSnake 스테이지박스 — Andertons', u: 'https://www.andertons.co.uk/looms-multicores/allen-heath-dx168-dsnake-stagebox' },
        { t: 'X32 과 S16 연결(AES50) — Sweetwater', u: 'https://www.sweetwater.com/sweetcare/articles/behringer-x32-s16-setup/' },
        { t: 'Midas DL32 (AES50 포트) — rAVe', u: 'https://ravepubs.com/midas-m32-digital-console/' }
      ] }
  ],

  /* ------------------------------------------------------------------ 브랜드 */
  brands: [
    /* ===== 마이크(유선) ===== */
    { id: 'shure-mic', cat: 'mic', name: 'Shure', ko: '슈어', country: '미국',
      identity: '1925년 시카고에서 시작한 마이크 전문 회사예요. 본사는 일리노이주 나일스에 있어요.',
      known: 'SM58(1966년)·SM57(1965년) 같은 다이내믹 마이크로 잘 알려져 있어요. 교회·공연장·학교 어디서나 흔히 만나요.',
      families: [
        { n: 'SM 시리즈 (SM58·SM57 등)', d: '보컬·악기용 다이내믹 마이크. SM58S 는 손잡이에 ON/OFF 스위치가 달린 SM58 이에요.' },
        { n: 'Beta 시리즈', d: '지향성이 좁은(슈퍼카디오이드) 라이브용 마이크 — 큰 무대 소리 속에서 목소리를 따로 잡을 때.' },
        { n: 'KSM 시리즈', d: '녹음용 고급 마이크(1999년 KSM32 부터).' }
      ],
      meet: ['교회 강단', '찬양팀', '공연장', '학교·강당'],
      tip: 'SM58S 의 스위치를 끄면 콘솔에서는 「신호 없음」처럼 보여요. 소리가 안 나면 콘솔보다 마이크 스위치를 먼저 확인해요.',
      ours: { label: 'SM58S', where: '확성 실습·강단' } },
    { id: 'sennheiser-mic', cat: 'mic', name: 'Sennheiser', ko: '젠하이저', country: '독일',
      identity: '1945년 하노버 근처 베데마르크에서 시작한 가족 경영 음향 회사예요.',
      known: '라이브용 evolution 마이크, 오래 쓰여 온 악기용 MD 421, 방송용 MKH 샷건 마이크로 알려져 있어요.',
      families: [
        { n: 'evolution 시리즈 (e 835·e 845 등)', d: '보컬·악기용 라이브 마이크. e 845 는 슈퍼카디오이드라 주변 소리·피드백을 줄이는 데 도움이 돼요.' },
        { n: 'MD 421', d: '1960년부터 이어진 다이내믹 마이크 — 드럼·앰프 등 악기 수음에 많이 써요.' },
        { n: 'MKH 시리즈', d: '방송·영상용 콘덴서(샷건) 마이크.' }
      ],
      meet: ['찬양팀', '공연장', '방송·영상'],
      tip: '스튜디오 마이크로 유명한 Neumann 은 Sennheiser 그룹 회사예요(1991년 인수).',
      group: 'Sennheiser 그룹 (Neumann 포함)' },
    { id: 'audiotechnica-mic', cat: 'mic', name: 'Audio-Technica', ko: '오디오테크니카', country: '일본',
      identity: '1962년 도쿄에서 시작했고, 본사는 도쿄 마치다에 있어요.',
      known: '라이브 마이크, 녹음용 콘덴서, 헤드폰까지 폭넓게 만들어요.',
      families: [
        { n: 'Artist Elite (AE) 시리즈', d: '보컬·악기용 라이브 마이크.' },
        { n: 'Artist 시리즈 (ATM 등)', d: '드럼·악기 수음용 마이크.' },
        { n: '40 시리즈 (AT4033 등)', d: '녹음 스튜디오용 콘덴서 마이크.' }
      ],
      meet: ['교회', '학교·강당', '녹음실'],
      tip: '무선 마이크(3000 시리즈·System 10)도 만들어요 — 「무선·인이어」 분류에서 볼 수 있어요.' },
    { id: 'akg-mic', cat: 'mic', name: 'AKG', ko: '에이케이지', country: '오스트리아에서 시작',
      identity: '1947년 오스트리아 빈에서 시작했어요. 지금은 HARMAN(삼성전자 자회사)의 전문 음향 브랜드예요.',
      known: '여러 지향성을 고를 수 있는 콘덴서 마이크 C414, 킥드럼용 D112 로 알려져 있어요.',
      families: [
        { n: 'C414', d: '지향성 패턴을 여러 개 고를 수 있는 대형 진동판 콘덴서 — 피아노·성가대·악기 녹음.' },
        { n: 'D112', d: '대형 진동판 다이내믹 — 킥드럼(베이스 드럼)에 많이 써요.' },
        { n: 'DMS 등 무선 시스템', d: '무선 마이크 시스템도 만들어요.' }
      ],
      meet: ['찬양팀(드럼·피아노)', '녹음실', '공연장'],
      tip: '빈의 본사·공장은 2017년에 문을 닫았고, 브랜드는 HARMAN 안에서 이어지고 있어요.',
      group: 'HARMAN Professional (삼성전자 자회사)' },
    { id: 'neumann-mic', cat: 'mic', name: 'Neumann', ko: '노이만', country: '독일',
      identity: '독일 베를린에 있는 마이크 회사로, 1991년부터 Sennheiser 그룹 회사예요.',
      known: '녹음 스튜디오용 콘덴서 마이크로 잘 알려져 있고, 무대용 콘덴서 보컬 마이크도 만들어요.',
      families: [
        { n: 'KMS 104 / KMS 105', d: '무대용 콘덴서 보컬 마이크. KMS 105 는 슈퍼카디오이드라 뒤쪽 소리를 더 잘 막아요.' },
        { n: 'KM 184 등 소형 진동판 콘덴서', d: '카디오이드 소형 진동판 콘덴서 — 녹음·악기 수음.' }
      ],
      meet: ['녹음실', '고급 공연', '방송'],
      tip: '콘덴서 마이크라서 팬텀 전원(+48V)이 꼭 필요해요.',
      group: 'Sennheiser 그룹' },
    { id: 'dpa-mic', cat: 'mic', name: 'DPA Microphones', ko: '디피에이', country: '덴마크',
      identity: '덴마크 알레뢰드(Allerød)에 있는 마이크 회사예요.',
      known: '몸에 붙이는 아주 작은 마이크(헤드셋·핀마이크)와 악기에 붙이는 클립형 마이크로 알려져 있어요.',
      families: [
        { n: 'd:fine 헤드셋', d: '귀에 거는 헤드셋 마이크 — 설교·뮤지컬·강연.' },
        { n: 'd:screet 미니어처', d: '옷에 다는 아주 작은 무지향 마이크(핀마이크).' },
        { n: '4099 악기용', d: '악기에 클립으로 붙이는 콘덴서 마이크.' },
        { n: '성가대용 마이크', d: '성가대·합창 수음용 마이크.' }
      ],
      meet: ['설교자 헤드셋', '뮤지컬·연극', '방송'],
      tip: '이런 작은 마이크는 무선 바디팩 송신기에 연결해 쓰는 경우가 많아요. 송신기 브랜드에 맞는 커넥터(어댑터)를 확인해요.' },

    /* ===== 무선 마이크·인이어 ===== */
    { id: 'shure-wl', cat: 'wireless', name: 'Shure', ko: '슈어', country: '미국',
      identity: '유선 마이크와 함께 무선 마이크·인이어 모니터 시스템도 오래 만들어 온 회사예요.',
      known: '디지털 무선 ULX-D·SLX-D·Axient Digital 과 인이어 모니터 PSM 시리즈로 알려져 있어요.',
      families: [
        { n: 'ULX-D', d: '2012년에 나온 디지털 무선. 기업·교육·예배·공연 시설용으로 만들어졌고, 암호화와 배터리 관리 기능이 있어요.' },
        { n: 'SLX-D / SLX-D+', d: '보급형 디지털 무선(2020년). 2026년 2월에 후속 SLX-D+ 가 나왔어요.' },
        { n: 'Axient Digital', d: '대형 공연·방송용 상위 무선 시스템(2017년).' },
        { n: 'PSM 시리즈 (PSM 300·900·1000)', d: '무선 인이어 모니터 — 찬양팀이 귀로 자기 모니터 소리를 들을 때.' }
      ],
      meet: ['교회 강단·찬양팀', '공연장', '방송'],
      tip: '무선 마이크 소리가 끊기면 송신기 배터리와 수신기의 RF(전파) 표시를 먼저 봐요.',
      ours: { label: 'ULX-D 수신기', where: '3층 예배당' } },
    { id: 'sennheiser-wl', cat: 'wireless', name: 'Sennheiser', ko: '젠하이저', country: '독일',
      identity: '독일의 가족 경영 음향 회사로, 무선 마이크와 인이어 시스템을 폭넓게 만들어요.',
      known: '보급형부터 공연·방송용까지 단계별 디지털 무선 라인이 있어요.',
      families: [
        { n: 'Evolution Wireless Digital (EW-D)', d: '디지털 무선의 기본 라인.' },
        { n: 'EW-DX', d: 'EW-D 보다 채널·대역이 넓고, 다채널 수신기·암호화·Dante 옵션이 있는 중간 단계.' },
        { n: 'Digital 6000 / 9000', d: '공연·방송용 상위 무선 시스템.' },
        { n: 'ew IEM G4', d: '라이브용 무선 인이어 모니터 시스템.' }
      ],
      meet: ['교회', '공연장', '방송·행사'],
      tip: '같은 브랜드라도 시리즈가 다르면 송신기와 수신기가 서로 연결되지 않을 수 있어요.' },
    { id: 'audiotechnica-wl', cat: 'wireless', name: 'Audio-Technica', ko: '오디오테크니카', country: '일본',
      identity: '일본 도쿄의 음향 회사로, 무선 마이크와 인이어 시스템도 만들어요.',
      known: 'UHF 무선 3000·5000 시리즈와 디지털 무선 System 10 으로 알려져 있어요.',
      families: [
        { n: '3000 시리즈', d: '주파수를 바꿔 쓸 수 있는 UHF 무선 마이크.' },
        { n: '5000 시리즈', d: '주파수를 바꿔 쓸 수 있는 UHF 무선(트루 다이버시티).' },
        { n: 'System 10 / System 10 PRO', d: '디지털 무선 시스템.' },
        { n: 'M3', d: '무선 인이어 모니터 시스템.' }
      ],
      meet: ['교회', '학교·강당', '행사'],
      tip: '여러 대를 함께 쓸 때는 제조사 설명서의 채널(주파수) 조합표를 따라 설정해요.' },
    { id: 'sony-wl', cat: 'wireless', name: 'Sony', ko: '소니', country: '일본',
      identity: '전자 회사 소니의 전문 음향 제품군이에요. 방송·영상 현장에서 자주 만나요.',
      known: '카메라와 함께 쓰는 소형 무선 UWP-D 와 디지털 무선 DWX 로 알려져 있어요.',
      families: [
        { n: 'UWP-D', d: '작고 가벼운 무선 — 뉴스 취재, 다큐, 결혼식 같은 영상 현장.' },
        { n: 'DWX', d: '스튜디오·라이브용 디지털 무선.' }
      ],
      meet: ['교회 영상·방송팀', '촬영 현장'],
      tip: '영상팀이 카메라에 무선 마이크를 바로 연결하는 경우가 많아요. 음향팀 무선과 주파수가 겹치지 않게 미리 이야기해요.' },

    /* ===== 콘솔(믹서) ===== */
    { id: 'yamaha-console', cat: 'console', name: 'Yamaha', ko: '야마하', country: '일본',
      identity: '일본 하마마쓰에 본사를 둔 악기·음향 회사예요(1887년 시작).',
      known: '작은 아날로그 믹서부터 대형 디지털 콘솔까지 폭넓게 만들어서, 교회와 공연장에서 자주 만나요.',
      families: [
        { n: 'MG 시리즈 (MG12XU 등)', d: '작은 아날로그 믹서. MG12XU 는 SPX 이펙트와 USB 가 들어 있어요.' },
        { n: 'TF · DM3 · DM5 · DM7', d: '지금 판매 중인 디지털 콘솔 라인.' },
        { n: 'CL · QL 시리즈', d: 'Dante 기반 디지털 콘솔. 제조사 미국 사이트에는 「단종」으로 표시돼 있지만 현장에서는 여전히 많이 써요.' },
        { n: 'RIVAGE PM', d: '대형 공연·방송용 디지털 콘솔.' }
      ],
      meet: ['교회', '공연장', '학교·강당', '행사'],
      tip: '「단종」은 못 쓴다는 뜻이 아니라 새로 만들지 않는다는 뜻이에요. 부품·수리 지원 기간은 따로 확인해요.',
      ours: { label: 'MG12XU · CL5', where: 'MG12XU 실습 · 3층 방송실 CL5' } },
    { id: 'allenheath-console', cat: 'console', name: 'Allen & Heath', ko: '앨런앤히스', country: '영국',
      identity: '1969년 런던에서 시작했고, 지금은 영국 콘월에서 믹서를 설계해요. Audiotonix 그룹 브랜드예요.',
      known: '소형부터 대형까지 디지털 믹서 라인이 다양해서 교회·공연장에서 자주 만나요.',
      families: [
        { n: 'CQ · Qu · SQ', d: '소형·중형 디지털 믹서.' },
        { n: 'Avantis · dLive', d: '중대형 디지털 믹싱 시스템.' },
        { n: 'ZED', d: '아날로그 믹서.' },
        { n: 'ME', d: '연주자가 직접 모니터를 섞는 개인 모니터 시스템.' }
      ],
      meet: ['교회', '공연장', '행사'],
      group: 'Audiotonix 그룹' },
    { id: 'midas-console', cat: 'console', name: 'Midas', ko: '마이다스', country: '영국',
      identity: '1970년 런던에서 시작한 콘솔 회사예요. 지금은 Music Tribe 그룹 브랜드예요.',
      known: '1970년대부터 공연용 콘솔을 만들어 왔고, M32 같은 디지털 콘솔도 만들어요.',
      families: [
        { n: 'M32', d: '40입력·25버스 디지털 콘솔(2014년).' },
        { n: 'PRO 시리즈 · Heritage-D (HD96)', d: '대형 공연용 디지털 콘솔.' },
        { n: 'DL 스테이지박스', d: 'AES50 으로 콘솔과 연결되는 스테이지박스(DL16·DL32 등).' }
      ],
      meet: ['교회', '공연장', '렌탈 업체'],
      tip: 'M32 와 Behringer X32 는 같은 그룹 제품이라 화면 구성이 비슷해요.',
      group: 'Music Tribe 그룹' },
    { id: 'behringer-console', cat: 'console', name: 'Behringer', ko: '베링거', country: '독일',
      identity: '1989년 독일 빌리히에서 울리 베링거가 세운 회사예요. Music Tribe 그룹 브랜드예요.',
      known: '디지털 믹서 X32·WING 과 소형 X AIR 를 교회·소규모 공연장에서 자주 만나요.',
      families: [
        { n: 'X32', d: '디지털 콘솔. AES50 으로 S16 같은 스테이지박스를 연결해요.' },
        { n: 'WING', d: 'X32 다음 세대 디지털 콘솔 — 48채널(모노·스테레오 선택), 터치 화면.' },
        { n: 'X AIR (XR18 등)', d: '소형 디지털 믹서.' }
      ],
      meet: ['교회', '소규모 공연장', '행사'],
      tip: '태블릿·와이파이로 조작하는 믹서를 쓴다면, 와이파이가 끊길 때를 대비해 유선 연결이나 다른 조작 방법을 준비해요.',
      group: 'Music Tribe 그룹' },
    { id: 'soundcraft-console', cat: 'console', name: 'Soundcraft', ko: '사운드크래프트', country: '영국',
      identity: '1973년 영국에서 시작한 콘솔 회사예요. 지금은 HARMAN(삼성전자 자회사) 브랜드예요.',
      known: '아날로그 믹서와 디지털 콘솔을 함께 만들어요.',
      families: [
        { n: 'Signature · EPM', d: '아날로그 믹서.' },
        { n: 'Ui 시리즈 (Ui24R 등)', d: '무선(태블릿 등)으로 조작하는 디지털 믹서.' },
        { n: 'Si 시리즈 (Si Impact 등)', d: '디지털 콘솔.' },
        { n: 'Vi 시리즈', d: '디지털 콘솔.' }
      ],
      meet: ['교회', '행사', '공연장'],
      group: 'HARMAN Professional (삼성전자 자회사)' },
    { id: 'digico-console', cat: 'console', name: 'DiGiCo', ko: '디지코', country: '영국',
      identity: '2002년에 생긴 영국 체싱턴의 디지털 콘솔 회사예요. Audiotonix 그룹 브랜드예요.',
      known: '공연·투어 현장의 디지털 콘솔로 알려져 있어요.',
      families: [
        { n: 'SD 시리즈 (SD9·SD10·SD11 등)', d: '2007년 SD7 부터 이어진 디지털 콘솔.' },
        { n: 'Quantum 시리즈', d: 'SD 시리즈를 잇는 디지털 콘솔 라인.' }
      ],
      meet: ['대형 공연장', '투어', '대형 교회'],
      group: 'Audiotonix 그룹' },
    { id: 'avid-console', cat: 'console', name: 'Avid', ko: '아비드', country: '미국',
      identity: '녹음 프로그램 Pro Tools 로 알려진 회사로, 본사는 미국 매사추세츠주 벌링턴에 있어요.',
      known: '라이브 콘솔 VENUE | S6L 은 Pro Tools 와 연동돼요.',
      families: [
        { n: 'VENUE | S6L', d: '공연·모니터·방송·공연장용 모듈형 라이브 콘솔. Pro Tools 와 연동돼요.' }
      ],
      meet: ['대형 공연', '방송', '투어'] },

    /* ===== 파워앰프 ===== */
    { id: 'crown-amp', cat: 'amp', name: 'Crown', ko: '크라운', country: '미국',
      identity: '1947년 미국에서 시작한 앰프 회사예요. 지금은 HARMAN(삼성전자 자회사) 브랜드예요.',
      known: '파워앰프 전문 브랜드로, 이동용 PA 부터 설치용까지 다양한 앰프를 만들어요.',
      families: [
        { n: 'XLi 시리즈 (XLi 800·1500·2500·3500)', d: '2채널 앰프. 네 모델은 출력만 달라요. 연주자·DJ·예배당·이동 PA 용.' },
        { n: 'DCi · I-Tech HD', d: 'Q-SYS 같은 시스템에서 상태를 감시할 수 있는 앰프(제조사가 감시용 플러그인 제공).' }
      ],
      meet: ['교회', '행사', '공연장'],
      tip: 'XLi 1500 의 제조사 표기 출력은 4Ω 에서 450W 예요. 스피커 임피던스와 출력이 맞는지 먼저 확인해요.',
      ours: { label: 'XLi 1500', where: '확성 실습' },
      group: 'HARMAN Professional (삼성전자 자회사)' },
    { id: 'powersoft-amp', cat: 'amp', name: 'Powersoft', ko: '파워소프트', country: '이탈리아',
      identity: '1995년에 생긴 이탈리아 피렌체 근처 스칸디치의 앰프 회사예요.',
      known: '투어용과 설치용 파워앰프를 나눠서 만들어요.',
      families: [
        { n: 'X 시리즈 · T 시리즈 · K 시리즈', d: '투어·공연용 앰프.' },
        { n: 'Quattrocanali · Ottocanali · Duecanali · Mezzo', d: '설치용 앰프(이름이 채널 수를 뜻해요: 4·8·2채널).' }
      ],
      meet: ['공연장', '설치 현장', '대형 교회'] },
    { id: 'qsc-amp', cat: 'amp', name: 'QSC', ko: '큐에스씨', country: '미국',
      identity: '캘리포니아 코스타메사에 있는 회사예요. 2025년 1월 Acuity Brands 에 인수됐어요.',
      known: '앰프, 파워드 스피커, 네트워크 음향 시스템 Q-SYS 를 함께 만들어요.',
      families: [
        { n: 'CX-Q · CXD-Q', d: 'Q-SYS 와 바로 연결되는 4·8채널 네트워크 앰프.' },
        { n: 'Q-SYS', d: '오디오·영상·제어를 소프트웨어로 다루는 시스템.' },
        { n: 'K.2 시리즈', d: '앰프가 들어 있는 파워드 스피커.' }
      ],
      meet: ['교회', '회의실·강당', '행사'],
      group: 'Acuity Brands' },
    { id: 'labgruppen-amp', cat: 'amp', name: 'Lab.gruppen', ko: '랩그루펜', country: '스웨덴',
      identity: '1979년 스웨덴 쿵스바카에서 시작한 앰프 회사예요. 지금은 Music Tribe 그룹 브랜드예요.',
      known: '파워앰프 전문 브랜드예요.',
      families: [
        { n: 'PLM+ · FP+', d: '주요 파워앰프 라인.' },
        { n: 'D 시리즈', d: 'DSP 가 들어 있는 설치용 앰프.' },
        { n: 'C 시리즈 · IPD', d: '그 밖의 앰프 라인.' }
      ],
      meet: ['공연장', '투어', '설치 현장'],
      group: 'Music Tribe 그룹' },
    { id: 'db-amp', cat: 'amp', name: 'd&b audiotechnik', ko: '디앤비 오디오테크닉', country: '독일',
      identity: '스피커 회사이면서, 자기 스피커를 구동하는 전용 앰프도 함께 만들어요.',
      known: 'd&b 앰프는 d&b 스피커를 구동하도록 만들어요. 예를 들어 D40 은 KSL·V·Y·T 시리즈를 구동하는 앰프예요.',
      families: [
        { n: '10D · 30D · 40D', d: '설치용 4채널 앰프(2U). 10D 는 작은 공간, 30D 는 중대형 공간용이에요(제조사 설명).' },
        { n: 'D40 등', d: '이동·투어용 4채널 앰프.' },
        { n: 'R1 소프트웨어', d: '앰프를 원격으로 보고 조정하는 프로그램.' }
      ],
      meet: ['대형 교회', '공연장', '렌탈 업체'],
      tip: '10D·30D 는 아날로그 입력 4개와 디지털(AES/EBU) 입력 4개를 받아 어느 출력으로든 보낼 수 있어요.',
      ours: { label: '10D · 40D', where: '3층 앰프 랙' } },

    /* ===== 스피커 ===== */
    { id: 'db-spk', cat: 'speaker', name: 'd&b audiotechnik', ko: '디앤비 오디오테크닉', country: '독일',
      identity: '1981년에 생긴 독일 바크낭의 스피커 회사예요.',
      known: '렌탈·설치 시장에서 주로 쓰이고, 스피커·앰프·설계 소프트웨어를 하나의 시스템으로 묶어 만들어요.',
      families: [
        { n: 'E 시리즈 (E8 등)', d: '작은 2웨이 스피커. E8 은 8인치 동축형으로, 말·음악용 단독 시스템이나 무대 모니터로도 써요.' },
        { n: 'Y 시리즈 (Y7P 등, 설치용 Yi)', d: '중소형 공간용 포인트 소스·라인 소스. Yi 는 설치용 버전이에요.' },
        { n: 'V 시리즈 (설치용 Vi7P·Vi10P)', d: 'Vi7P·Vi10P 는 설치용 포인트 소스예요. 작은 라인 어레이 대신 쓸 수 있을 만큼 큰 소리를 내요.' },
        { n: 'SL 시리즈 · A 시리즈', d: '라인 어레이 계열(SL 시리즈에는 GSL 등이 있어요).' }
      ],
      meet: ['대형 교회', '공연장', '렌탈 업체'],
      tip: 'Y 시리즈의 설치용(Yi) 모델은 이동용과 통 만듦새·설치 부품만 달라요. 설치용은 색상 맞춤·방수 옵션도 있어요.',
      ours: { label: 'E8 · Yi7P · Vi10P', where: '3층 예배당' } },
    { id: 'lacoustics-spk', cat: 'speaker', name: 'L-Acoustics', ko: '엘어쿠스틱스', country: '프랑스',
      identity: '1984년 크리스티안 하일 박사가 세운 회사로, 본사는 파리 남쪽 마르쿠시에 있어요.',
      known: '대형 공연용 라인 어레이와 몰입형 음향 기술 L-ISA 로 알려져 있어요.',
      families: [
        { n: 'K 시리즈 (K1·K2·K3·Kara II·Kiva II)', d: '공연용 라인 어레이.' },
        { n: 'L 시리즈 · A 시리즈', d: 'L 시리즈(2023년~)는 라인 소스 어레이, A 시리즈는 Wide·Focus 모델로 나뉘어요.' },
        { n: 'X 시리즈 (X8·X12 등)', d: '동축형 스피커.' },
        { n: 'LA 앰프 컨트롤러 (LA4X·LA12X 등)', d: '전용 앰프.' }
      ],
      meet: ['대형 공연장', '페스티벌', '대형 교회'] },
    { id: 'meyer-spk', cat: 'speaker', name: 'Meyer Sound', ko: '마이어 사운드', country: '미국',
      identity: '1979년 존·헬렌 마이어 부부가 세운 회사로, 본사는 캘리포니아 버클리에 있어요.',
      known: '앰프가 들어 있는 파워드 공연용 스피커를 많이 만들어요.',
      families: [
        { n: 'PANTHER · LEOPARD', d: '라인 어레이.' },
        { n: 'ULTRA-X 시리즈', d: '포인트 소스 스피커.' }
      ],
      meet: ['공연장', '극장', '대형 교회'] },
    { id: 'jbl-spk', cat: 'speaker', name: 'JBL Professional', ko: '제이비엘', country: '미국',
      identity: 'HARMAN(삼성전자 자회사)의 전문 스피커 브랜드예요.',
      known: '들고 다니는 파워드 스피커부터 투어용 라인 어레이까지 폭넓게 만들어요.',
      families: [
        { n: 'EON 시리즈 (EON700 등)', d: '1995년부터 이어진 이동용 파워드 스피커.' },
        { n: 'PRX 시리즈', d: '이동용 파워드 스피커(포인트 소스).' },
        { n: 'SRX 시리즈', d: '쌓거나 매달아 쓰는 파워드 라인 어레이.' },
        { n: 'VTX 시리즈 (VTX A12 등)', d: '중대형 투어·고급 설치용 라인 어레이.' }
      ],
      meet: ['교회', '행사', '공연장'],
      group: 'HARMAN Professional (삼성전자 자회사)' },
    { id: 'ev-spk', cat: 'speaker', name: 'Electro-Voice', ko: '일렉트로보이스', country: '미국',
      identity: '1927년 미국 인디애나주 사우스벤드에서 시작했어요. 2025년 7월부터 Keenfinity 그룹 브랜드예요.',
      known: '스피커와 마이크를 함께 만들어요. 방송용 마이크 RE20 도 이 회사 제품이에요.',
      families: [
        { n: 'ZX · ZXA (ZX1·ZXA1)', d: '8인치 2웨이 소형 스피커. ZXA1 은 앰프 내장(파워드), ZX1 은 앰프가 따로 필요한 패시브예요.' },
        { n: 'ZLX', d: '2013년부터 나온 스피커 시리즈.' },
        { n: 'EVOLVE', d: '들고 다니는 기둥(컬럼)형 파워드 스피커.' },
        { n: 'EVERSE', d: '배터리로 움직이는 이동용 스피커.' }
      ],
      meet: ['교회', '행사', '소규모 공연'],
      tip: '모델 이름의 「A」는 앰프 내장(Active)을 뜻하는 경우가 많아요. ZXA1 은 전원 코드, ZX1 은 앰프의 스피커 케이블이 필요해요.',
      ours: { label: 'ZXA1 · ZX1', where: '확성 실습' },
      group: 'Keenfinity 그룹 (2025년 Bosch 에서 분리)' },
    { id: 'rcf-spk', cat: 'speaker', name: 'RCF', ko: '알씨에프', country: '이탈리아',
      identity: '1949년 이탈리아 레조에밀리아에서 시작한 스피커 회사예요.',
      known: '이동용 파워드 스피커와 설치용 스피커를 폭넓게 만들어요.',
      families: [
        { n: 'ART 시리즈', d: '이동용 파워드 스피커.' },
        { n: 'HDL 시리즈', d: '전문가용 이동형 스피커.' },
        { n: 'EVOX', d: '기둥(컬럼)형 이동용 스피커.' },
        { n: 'COMPACT · NX', d: '설치용·전문가용 스피커.' }
      ],
      meet: ['교회', '행사', '공연장'],
      group: 'RCF 그룹' },
    { id: 'nexo-spk', cat: 'speaker', name: 'NEXO', ko: '넥쏘', country: '프랑스',
      identity: '1979년에 생긴 프랑스 플라이의 스피커 회사로, 2008년부터 Yamaha 회사예요.',
      known: '라인 어레이와 포인트 소스, 전용 앰프·프로세서를 함께 만들어요.',
      families: [
        { n: 'GEO 시리즈 · Alpha+', d: '라인 어레이.' },
        { n: 'P+ · ID · EPS 시리즈', d: '포인트 소스·소형 스피커.' },
        { n: 'NXAMP', d: '전용 앰프 겸 프로세서.' }
      ],
      meet: ['공연장', '교회', '행사'],
      group: 'Yamaha' },
    { id: 'martin-spk', cat: 'speaker', name: 'Martin Audio', ko: '마틴 오디오', country: '영국',
      identity: '영국 버킹엄셔에 있는 스피커 회사로, 2019년 Focusrite 그룹에 들어갔어요.',
      known: '공연용 라인 어레이와 설치용 스피커를 만들어요.',
      families: [
        { n: 'Wavefront Precision', d: '라이브 제품군의 대표 시리즈.' },
        { n: 'TORUS', d: '라이브용 스피커 시리즈.' },
        { n: 'CDD-LIVE! · BlacklineX', d: '라이브용 스피커 시리즈.' }
      ],
      meet: ['공연장', '행사', '렌탈 업체'],
      group: 'Focusrite 그룹' },

    /* ===== 스테이지박스·네트워크·DI ===== */
    { id: 'yamaha-io', cat: 'stagebox', name: 'Yamaha', ko: '야마하', country: '일본',
      identity: 'Yamaha 디지털 콘솔과 짝을 이루는 Dante 스테이지박스를 만들어요.',
      known: 'Rio 시리즈 스테이지박스는 CL·QL 같은 Yamaha 디지털 콘솔과 Dante 로 연결돼요.',
      families: [
        { n: 'Rio 시리즈 (Rio3224·Rio1608)', d: '무대용 Dante 스테이지박스. D2 세대는 단종됐고 지금은 D3 세대가 나와요.' },
        { n: 'Tio1608-D2', d: 'TF·DM3 콘솔에서 GAIN 을 원격 조정하는 16입력 Dante 스테이지박스.' }
      ],
      meet: ['교회', '공연장'],
      tip: '스테이지박스의 마이크 GAIN 은 무대가 아니라 콘솔에서 원격으로 조정해요.',
      ours: { label: 'Rio3224-D', where: '3층 무대' } },
    { id: 'audinate-io', cat: 'stagebox', name: 'Audinate (Dante)', ko: '오디네이트 · 단테', country: '호주',
      identity: '2006년 호주 시드니에서 생긴 회사로, 네트워크 오디오 기술 Dante 를 만들었어요.',
      known: 'Dante 는 일반 이더넷(랜) 네트워크로 여러 채널의 오디오를 보내는 기술이에요. 여러 브랜드의 장비가 Dante 를 넣어 서로 연결해요.',
      families: [
        { n: 'Dante Controller', d: '어느 장비의 소리를 어디로 보낼지 정하는 무료 설정 프로그램.' },
        { n: 'Dante Virtual Soundcard', d: '추가 장비 없이 컴퓨터를 Dante 네트워크에 연결하는 프로그램.' },
        { n: 'AVIO 어댑터', d: '예전 아날로그·디지털 장비를 Dante 에 연결하는 작은 어댑터.' },
        { n: 'Dante Domain Manager', d: '큰 네트워크를 관리·보안하는 프로그램.' }
      ],
      meet: ['교회', '공연장', '방송', '회의실'],
      tip: 'Audinate 는 콘솔이나 스피커를 만드는 회사가 아니에요. Yamaha·Shure 같은 회사의 장비 안에 Dante 기술이 들어가요.' },
    { id: 'radial-io', cat: 'stagebox', name: 'Radial Engineering', ko: '레이디얼', country: '캐나다',
      identity: '1996년 캐나다 밴쿠버에서 시작한 회사로, 지금은 포트코퀴틀람에 있어요.',
      known: 'DI 박스로 잘 알려져 있어요.',
      families: [
        { n: 'JDI', d: '패시브 DI (트랜스포머 사용).' },
        { n: 'J48', d: '액티브 DI (팬텀 전원으로 동작).' },
        { n: 'ProDI 등 Pro 시리즈', d: '부담 없는 가격의 DI.' }
      ],
      meet: ['찬양팀 건반·베이스·어쿠스틱 기타', '공연장'],
      tip: '액티브 DI 는 콘솔의 팬텀 전원(+48V)을 켜야 동작해요. 「소리 안 남」 문제에서 자주 놓치는 부분이에요.' },
    { id: 'allenheath-io', cat: 'stagebox', name: 'Allen & Heath', ko: '앨런앤히스', country: '영국',
      identity: 'Allen & Heath 디지털 믹서와 짝을 이루는 스테이지박스를 만들어요.',
      known: '자체 연결 방식(dSnake 등)과 Dante 같은 네트워크 카드를 함께 지원해요.',
      families: [
        { n: 'AR2412 · AB168', d: 'SQ·Qu·Avantis 같은 믹서와 연결하는 스테이지박스(AudioRack).' },
        { n: 'DX168 · GX4816', d: 'dLive·Avantis·SQ 용 스테이지박스(I/O 확장).' },
        { n: '네트워킹 카드', d: 'Dante, MADI, Waves 등 다른 시스템과 연결하는 확장 카드.' }
      ],
      meet: ['교회', '공연장'],
      group: 'Audiotonix 그룹' },
    { id: 'behringer-io', cat: 'stagebox', name: 'Behringer · Midas', ko: '베링거 · 마이다스', country: '독일 · 영국',
      identity: '같은 Music Tribe 그룹의 두 브랜드로, AES50 방식 스테이지박스를 만들어요.',
      known: 'X32·M32 콘솔은 AES50 포트로 차폐 랜선(Cat5e) 하나만 연결하면 스테이지박스를 쓸 수 있어요.',
      families: [
        { n: 'Behringer S16 · SD8 · SD16', d: 'X32·WING 과 연결하는 AES50 스테이지박스.' },
        { n: 'Midas DL16 · DL32', d: 'M32 등과 연결하는 AES50 스테이지박스.' }
      ],
      meet: ['교회', '소규모 공연장'],
      tip: 'AES50 은 랜선을 쓰지만 Dante 와는 다른 방식이에요. Dante 스테이지박스(예: Yamaha Rio)를 X32 에 바로 꽂으면 동작하지 않아요.',
      group: 'Music Tribe 그룹' }
  ],

  /* ---------------------------------------------------- 브랜드보다 중요한 것 */
  principles: [
    { t: '우리 공간과 용도에 맞는지', d: '유명한 브랜드라도 예배당 크기, 소리가 퍼지는 범위, 쓰는 사람(설교·찬양·성가대)에 맞지 않으면 좋은 소리가 나지 않아요.' },
    { t: '국내 지원과 수리', d: '고장 났을 때 국내 정식 수입·서비스 업체가 있는지, 부품을 구할 수 있는지가 오래 쓰는 데 더 중요해요. 무선 장비는 국내 전파 인증(KC) 제품인지도 꼭 봐요.' },
    { t: '지금 시스템과의 짝', d: '콘솔과 스테이지박스, 앰프와 스피커처럼 서로 짝이 맞아야 하는 장비가 많아요. 새 장비는 「지금 있는 장비와 연결되는지」부터 확인해요.' },
    { t: '봉사자가 배울 수 있는지', d: '봉사자가 바뀌어도 이어서 쓸 수 있도록, 조작이 익숙하고 교육 자료가 있는 장비가 운영에 유리해요. 결국 소리를 만드는 건 장비보다 사람이에요.' }
  ],

  /* ---------------------------------------------------------------- 퀴즈 */
  quiz: [
    { q: '우리 교회 3층 예배당의 무선 마이크 수신기는 어느 브랜드의 어떤 제품일까요?',
      options: [{ t: 'Sennheiser EW-D' }, { t: 'Audio-Technica 3000 시리즈' }, { t: 'Shure ULX-D', ok: true }, { t: 'Sony UWP-D' }],
      why: '3층은 Shure 의 디지털 무선 ULX-D 수신기를 써요. 기업·교육·예배·공연 시설을 위해 만든 시리즈예요.' },
    { q: 'Electro-Voice ZXA1 과 ZX1 의 차이로 맞는 것은?',
      options: [{ t: 'ZXA1 은 마이크, ZX1 은 스피커' }, { t: 'ZXA1 은 앰프 내장(파워드), ZX1 은 앰프가 따로 필요한 패시브', ok: true }, { t: '둘은 이름만 다른 같은 제품' }, { t: 'ZX1 이 앰프 내장, ZXA1 이 패시브' }],
      why: 'ZXA1 은 앰프가 들어 있어 전원만 연결하면 되고, ZX1 은 Crown XLi 1500 같은 파워앰프에서 스피커 케이블로 받아야 소리가 나요.' },
    { q: 'Behringer X32 콘솔에 스테이지박스를 연결하려고 해요. 바로 쓸 수 있는 것은?',
      options: [{ t: 'Dante 스테이지박스 Yamaha Rio3224' }, { t: 'Allen & Heath DX168' }, { t: '랜선만 꽂히면 어느 브랜드든 된다' }, { t: 'AES50 으로 연결하는 Behringer S16', ok: true }],
      why: '스테이지박스는 랜선을 써도 연결 방식(AES50·Dante·dSnake)이 달라요. X32 는 AES50 이라 S16 같은 AES50 스테이지박스와 짝이 맞아요.' },
    { q: 'Dante 를 바르게 설명한 것은?',
      options: [{ t: '일반 이더넷(랜) 네트워크로 여러 채널의 오디오를 보내는 기술', ok: true }, { t: 'Yamaha 가 만든 스피커 시리즈' }, { t: '무선 마이크가 쓰는 주파수 대역 이름' }, { t: '마이크 케이블 커넥터 종류' }],
      why: 'Dante 는 호주의 Audinate 가 만든 네트워크 오디오 기술이에요. CL5 와 Rio3224-D 도 Dante 로 연결돼요.' },
    { q: '해외 쇼핑몰에서 싸고 좋아 보이는 무선 마이크를 찾았어요. 교회에 들이기 전에 가장 먼저 볼 것은?',
      options: [{ t: '유명 브랜드 이름이 붙어 있는지만' }, { t: '국내 전파 인증(KC)을 받은 정식 유통 제품인지, 국내에서 수리할 수 있는지', ok: true }, { t: '디자인이 예배당과 어울리는지' }, { t: '가장 비싼 모델인지' }],
      why: '해외 직구 무선 제품 중에는 국내 전파 안전성 시험에서 부적합 판정을 받은 사례가 있어요. 무선 장비는 인증과 국내 지원부터 확인해요.' }
  ]
};
