// ==UserScript==
// @name         Hath or Die
// @namespace    https://github.com/FlandreDaisuki/hath-or-die
// @description  hath or die
// @version      0.0.1
// @author       FlandreDaisuki
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @grant        none
// @noframes
// ==/UserScript==

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async() => {

  while(true) {
    await sleep(1000);
    const uncheckedGalleryEls = Array.from(document.querySelectorAll('.gl1t:not([data-gid])'));
    if(uncheckedGalleryEls.length === 0) { continue; }

    const gidList = [];
    for(const galleryEl of uncheckedGalleryEls) {
      const gid = galleryEl.firstElementChild.href.replaceAll(/^.*[/]g[/](\d+).*$/g, '$1');
      galleryEl.setAttribute('data-gid', gid)
      gidList.push(gid);
    }

    const api = new URL('/api/v1/status', __APP_HOSTNAME__);
    api.searchParams.set('gid', gidList.join(','));
    const result = await fetch(api).then((resp) => resp.json());
    if(result.ok) {
      const gidGalleryMap = Object.fromEntries(result.galleries.map((g) => [g.gid, g]));
      console.log('gidGalleryMap', gidGalleryMap);
      for(const galleryEl of uncheckedGalleryEls) {
        if(galleryEl.querySelector('.ir.irb')) { galleryEl.classList.add('⭐'); }

        const g = gidGalleryMap[galleryEl.getAttribute('data-gid')];
        if(g) {
          if(g.self_rating && !g.rated_then_deleted_at) { galleryEl.classList.add('📦'); }
          if(g.file_path && !g.rated_then_deleted_at) { galleryEl.classList.add('🛖'); }
        }
      }
    }
  }
})();

const styleEl = document.createElement('style');
document.head.appendChild(styleEl);
styleEl.textContent=`
.gld > .gl1t:is(.📦, .🛖, .⭐) {
  position: relative;
}
.gld > .gl1t:is(.📦, .🛖, .⭐)::after {
  display: grid;
  height: 100%;
  width: 100%;
  position: absolute;
  font-size: 4rem;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px black, 1px -1px black, -1px 1px black, -1px -1px black;
  visibility: visible;
}
.gld > .gl1t:is(.📦, .🛖, .⭐):hover::after {
  display: none;
}

.gld > .gl1t:is(.🛖:not(.⭐):not(.📦))::after {
  content: "下載ㄌ";
  background-color: hsla(125, 90%, 70%, 0.7);
}
.gld > .gl1t:is(.⭐:not(.📦))::after {
  content: "評分過ㄌ";
  background-color: hsla(65, 90%, 70%, 0.7);
}
.gld > .gl1t:is(.📦)::after {
  content: "封存ㄌ";
  background-color: hsla(0, 0%, 0%, 0.7);
}
`;
