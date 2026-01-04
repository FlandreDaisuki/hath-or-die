import { Database } from 'bun:sqlite';
import { $ } from 'bun'

const HOME_DIR = '/home/yomiko';
const db = new Database(`${HOME_DIR}/db.sqlite3`);

const ORIGIN_ALLOWLIST = Object.freeze([
  'https://exhentai.org',
  'https://e-hentai.org',
]);

const toCorsResponse = (req, res) => {
  const headerOrigin = req.headers.get('Origin');
  if(ORIGIN_ALLOWLIST.includes(headerOrigin)) {
    res.headers.append('Access-Control-Allow-Origin', headerOrigin);
  }

  const headerAccessControlRequestMethod = req.headers.get('Access-Control-Request-Method');
  if (headerAccessControlRequestMethod) {
    res.headers.append('Access-Control-Allow-Methods', headerAccessControlRequestMethod);
  }

  return res
}

const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);

    //#region APIs
    if (req.method === 'OPTIONS') {
      return toCorsResponse(req, new Response(''));
    }

    if (req.method === 'GET' && /^[/]api[/]v1[/]unrated-galleries$/.test(url.pathname)) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = 20;
      const offset = (page - 1) * perPage;

      const statement = `
        SELECT
          galleries.id,
          galleries.gid,
          galleries.token,
          galleries.title,
          galleries.title_jpn,
          galleries.rating,
          galleries.file_count,
          galleries.expunged,
          galleries.updated_at,
          galleries.file_path
        FROM galleries
        LEFT JOIN archived ON galleries.gid = archived.galleries_gid
        WHERE archived.galleries_gid IS NULL
        ORDER BY galleries.updated_at ASC
        LIMIT ? OFFSET ?
      `;
      const query = db.query(statement);
      const results = query.all(perPage, offset);
      query.finalize();

      return toCorsResponse(req, new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    if (req.method === 'GET' && /^[/]api[/]v1[/]download[/]\d+$/.test(url.pathname)) {
      const gid = url.pathname.split('/').at(-1);
      const statement = `SELECT file_path FROM galleries WHERE gid = ?`;
      const query = db.query(statement);
      const result = query.get(gid);
      query.finalize();

      if(!result) {
        return toCorsResponse(req, new Response('Not Found', { status: 404 }));
      }

      // NOTE: if file path has single quote, it will has surronding single quote.
      // e.g. "'[丸居まる] Cherry&GAL's↑↑ [中国翻訳].7z'"
      const file = Bun.file(`${HOME_DIR}/archived/${result.file_path.replace(/^'(.*)'$/, '$1')}`);
      if(! await file.exists()) {
        return toCorsResponse(req, new Response('Not Found', { status: 404 }));
      }

      return toCorsResponse(req, new Response(file));
    }
    if (req.method === 'PUT' && /^[/]api[/]v1[/]rate-gallery$/.test(url.pathname)) {
      /** @type {{gid: number; rating: 1|2|3|4|5|6|7|8|9|10|11;}} */
      const {gid, rating} = await req.json();

      const cmd = await $`rate-gid ${gid} ${rating}`.nothrow().quiet();
      if(cmd.exitCode !== 0) {
        return toCorsResponse(req, new Response(JSON.stringify({ error: cmd.stderr }), {
          status: 500
        }));
      }

      return toCorsResponse(req, new Response(JSON.stringify({ ok: true })));
    }
    if(req.method === 'GET' && /^[/]api[/]v1[/]status$/.test(url.pathname)) {
      const url = new URL(req.url);
      if(!url.searchParams.has('gid')) {
        return toCorsResponse(req, new Response(JSON.stringify({ error: 'you should query gid which concat by comma.' }), { status: 400 }));
      }
      const gidList = url.searchParams.get('gid')
        .split(',')
        .filter(maybeGid => /^\s*\d+\s*$/.test(maybeGid))
        .map(gid => gid.trim());

      const statement = `
        SELECT
          galleries.gid, galleries.token,
          galleries.title_jpn, archived.self_rating,
          galleries.expunged, galleries.updated_at,
          galleries.file_path, galleries.rated_then_deleted_at
        FROM galleries
        LEFT JOIN archived ON galleries.gid = archived.galleries_gid
        WHERE gid IN (${gidList.map(_ => '?').join(',')});
      `;
      const query = db.query(statement);
      const result = query.all(gidList);
      query.finalize();
      if(!result) {
        return toCorsResponse(req, new Response('Unknown error', { status: 400 }));
      }

      return toCorsResponse(req, new Response(JSON.stringify({ ok: true, galleries: result })));
    }
    //#endregion APIs


    //#region pages
    if (req.method === 'GET' && /^[/]$/.test(url.pathname)) {
      const file = Bun.file(`${import.meta.dir}/templates/index.html`);
      if(! await file.exists()) {
        return new Response('Not Found', { status: 404 });
      }

      return new Response(file);
    }
    if (req.method === 'GET' && /^[/]hath-or-die.user.js$/.test(url.pathname)) {
      const file = Bun.file(`${import.meta.dir}/templates/hath-or-die.user.js`);
      if(! await file.exists()) {
        return new Response('Not Found', { status: 404 });
      }
      const text = await file.text();
      const output = text.replaceAll('__APP_HOSTNAME__', JSON.stringify(process.env.APP_HOSTNAME))

      return new Response(output, {
        headers: {
          "Content-Type": "text/javascript; charset=utf-8",
        },
      });
    }
    //#endregion pages

    //#region public
    if (req.method === 'GET') {
      const file = Bun.file(`${import.meta.dir}/public${url.pathname}`);
      if(! await file.exists()) {
        return new Response('Not Found', { status: 404 });
      }

      return new Response(file);
    }
    //#endregion public

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
