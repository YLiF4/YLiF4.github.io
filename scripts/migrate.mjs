/**
 * 博客文章迁移工具 + 图形化编辑器 v2
 *
 * 用法: node scripts/migrate.mjs  或  双击 迁移工具.vbs
 * 浏览器打开 http://localhost:3456
 *
 * v2 新功能:
 *   - 源文件原地打标记（写入 frontmatter），二次打开记忆配置
 *   - 已配置的文章显示"更新"按钮
 *   - 搜索框 + 排序（未分类在前，最近修改在前）
 */

import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ─── 配置 ────────────────────────────────────────────────
const PORT = 3456;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SOURCE_DIR = process.env.SOURCE_DIR || "D:\\OSDisk\\Blog";
const TARGET_DIR = join(PROJECT_ROOT, "src", "content", "posts");
const SHUTDOWN_GRACE_MS = Number(process.env.MIGRATE_SHUTDOWN_GRACE_MS || 12000);

let lastHeartbeatAt = 0;
let shuttingDown = false;

function markPageAlive() {
  lastHeartbeatAt = Date.now();
}

function shutdownServer(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`迁移工具正在退出: ${reason}`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

setInterval(() => {
  if (!lastHeartbeatAt) return;
  if (Date.now() - lastHeartbeatAt > SHUTDOWN_GRACE_MS) {
    shutdownServer("浏览器页面已关闭或失去连接");
  }
}, 2000).unref();

// ─── 工具函数 ────────────────────────────────────────────

/** 解析 YAML frontmatter，返回 { frontmatter, body } 或 null */
function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  const lines = m[1].split(/\r?\n/);
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let val = kv[2].trim();
    // 去掉引号包裹
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // 解析 tags 数组
    if (kv[1] === "tags" && val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map(t => t.trim()).filter(Boolean).join(", ");
    }
    // 解析布尔值
    if (val === "true") val = true;
    else if (val === "false") val = false;
    // 空字符串
    if (val === "''" || val === '""') val = "";
    fm[kv[1]] = val;
  }
  return { frontmatter: fm, body: m[2] };
}

/** 读取 UTF-8 文件（跳过 BOM） */
function readUtf8(filePath) {
  try {
    const buf = readFileSync(filePath);
    const start = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? 3 : 0;
    return buf.toString("utf-8", start);
  } catch {
    return "";
  }
}

/** 从正文提取第一个 # 标题 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+?)(?:\r?\n|$)/m);
  if (match) return match[1].trim();
  return "";
}

/** 生成 slug：直接使用文章标题 */
function generateSlug(title, date) {
  return title;
}

/** 格式化日期 */
function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** YAML 值序列化 */
function yamlValue(val) {
  if (val === null || val === undefined) return "''";
  if (typeof val === "boolean") return val ? "true" : "false";
  const s = String(val).trim();
  if (!s) return "''";
  if (/[:"{}[\]&*#?|\-<>=!%@`']/.test(s)) return `"${s.replace(/"/g, '\\"')}"`;
  if (/^\d+$/.test(s)) return `"${s}"`;
  return s;
}

/** 扫描源目录 */
function scanSourceDir() {
  const results = [];
  if (!existsSync(SOURCE_DIR)) {
    return { error: `源目录不存在: ${SOURCE_DIR}`, posts: [] };
  }
  try {
    const entries = readdirSync(SOURCE_DIR);
    for (const entry of entries) {
      const fullPath = join(SOURCE_DIR, entry);
      const ext = extname(entry).toLowerCase();
      if (ext !== ".md" && ext !== ".mdx") continue;
      const stat = statSync(fullPath);
      if (!stat.isFile()) continue;

      const rawContent = readUtf8(fullPath);
      const parsed = parseFrontmatter(rawContent);

      let post;
      if (parsed) {
        // 已有 frontmatter → 使用已有配置
        post = {
          sourceFile: entry,
          sourcePath: fullPath,
          title: parsed.frontmatter.title || extractTitle(parsed.body) || basename(entry, ext),
          published: parsed.frontmatter.published || formatDate(stat.mtime),
          updated: parsed.frontmatter.updated || "",
          description: parsed.frontmatter.description || "",
          image: parsed.frontmatter.image || "",
          tags: Array.isArray(parsed.frontmatter.tags) ? parsed.frontmatter.tags.join(", ") : String(parsed.frontmatter.tags || ""),
          category: parsed.frontmatter.category || "",
          draft: parsed.frontmatter.draft === true || parsed.frontmatter.draft === "true",
          lang: parsed.frontmatter.lang || "",
          slug: generateSlug(parsed.frontmatter.title || extractTitle(parsed.body) || basename(entry, ext), parsed.frontmatter.published || formatDate(stat.mtime)),
          content: parsed.body,
          fileSize: stat.size,
          _hasFrontmatter: true,
          _mtime: stat.mtimeMs,
        };
      } else {
        // 无 frontmatter → 自动提取
        const body = rawContent;
        const title = extractTitle(body) || basename(entry, ext);
        const date = formatDate(stat.mtime);
        post = {
          sourceFile: entry,
          sourcePath: fullPath,
          title,
          published: date,
          updated: "",
          description: "",
          image: "",
          tags: "",
          category: "",
          draft: false,
          lang: "",
          slug: generateSlug(title, date),
          content: body,
          fileSize: stat.size,
          _hasFrontmatter: false,
          _mtime: stat.mtimeMs,
        };
      }
      results.push(post);
    }
  } catch (err) {
    return { error: `读取源目录失败: ${err.message}`, posts: [] };
  }

  // 排序：未分类在前，然后按修改时间倒序
  results.sort((a, b) => {
    const aCat = a.category ? 1 : 0;
    const bCat = b.category ? 1 : 0;
    if (aCat !== bCat) return aCat - bCat;
    return (b._mtime || 0) - (a._mtime || 0);
  });

  return { posts: results };
}

/** 构建完整 Markdown（frontmatter + body） */
function buildMarkdown(post) {
  const tagsArr = post.tags
    ? String(post.tags).split(",").map(t => t.trim()).filter(Boolean)
    : [];
  const tagsYaml = tagsArr.length > 0 ? `[${tagsArr.join(", ")}]` : "[]";

  const lines = [
    "---",
    `title: ${yamlValue(post.title)}`,
    `published: ${post.published}`,
  ];
  if (post.updated) lines.push(`updated: ${post.updated}`);
  lines.push(
    `description: ${yamlValue(post.description)}`,
    `image: ${yamlValue(post.image)}`,
    `tags: ${tagsYaml}`,
    `category: ${yamlValue(post.category)}`,
    `draft: ${post.draft ? "true" : "false"}`,
  );
  if (post.lang) lines.push(`lang: ${yamlValue(post.lang)}`);
  else lines.push(`lang: ''`);
  lines.push("---", "", (post.content || "").trim());

  return lines.join("\n") + "\n";
}

// ─── HTML GUI ──────────────────────────────────────────

const HTML_PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>📝 博客文章迁移工具</title>
<style>
  :root {
    --bg: #f6f7f9; --card-bg: #fff; --text: #2c2c2c;
    --border: #e2e4e8; --primary: #6366f1; --primary-hover: #4f46e5;
    --success: #22c55e; --success-bg: #f0fdf4; --danger: #ef4444;
    --muted: #888; --warning: #f59e0b; --warning-bg: #fffbeb;
    --radius: 10px; --shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1a1a2e; --card-bg: #222240; --text: #d4d4d8;
      --border: #333358; --muted: #8888aa;
      --success-bg: #052e16; --warning-bg: #422006;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font: 14px/1.6 -apple-system, "Microsoft YaHei", sans-serif;
    background: var(--bg); color: var(--text); padding: 20px;
  }
  .container { max-width: 900px; margin: 0 auto; }

  header {
    text-align: center; margin-bottom: 20px;
    padding: 20px 24px; background: var(--card-bg);
    border-radius: var(--radius); box-shadow: var(--shadow);
  }
  header h1 { font-size: 1.5em; margin-bottom: 4px; }
  header .meta { color: var(--muted); font-size: .82em; }
  header .meta code { background: var(--bg); padding: 2px 6px; border-radius: 4px; font-size: .9em; }

  .toolbar {
    display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
  }
  .search-box {
    flex: 1; min-width: 200px; position: relative;
  }
  .search-box input {
    width: 100%; padding: 10px 14px 10px 38px;
    border: 1px solid var(--border); border-radius: var(--radius);
    font-size: .95em; background: var(--card-bg); color: var(--text);
    box-shadow: var(--shadow);
  }
  .search-box input:focus { outline: none; border-color: var(--primary); }
  .search-box .search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--muted); pointer-events: none;
  }

  .progress-bar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px; padding: 10px 16px;
    background: var(--card-bg); border-radius: var(--radius); box-shadow: var(--shadow);
    font-size: .85em;
  }
  .progress-bar .bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .progress-bar .bar-fill { height: 100%; background: var(--success); transition: width .3s; }
  .progress-bar .count { font-weight: 600; white-space: nowrap; }

  .btn {
    padding: 8px 18px; border: none; border-radius: var(--radius);
    cursor: pointer; font-size: .9em; font-weight: 500; transition: all .15s;
    display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
  }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-success { background: var(--success); color: #fff; }
  .btn-success:hover { opacity: .85; }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-outline:hover { background: var(--bg); }
  .btn-sm { padding: 5px 12px; font-size: .82em; }

  .card {
    background: var(--card-bg); margin-bottom: 12px;
    border-radius: var(--radius); box-shadow: var(--shadow);
    transition: box-shadow .2s;
  }
  .card.configured { border-left: 4px solid var(--success); }
  .card.pending { border-left: 4px solid var(--warning); }
  .card.hidden { display: none; }

  .card-header {
    padding: 12px 18px; display: flex; justify-content: space-between;
    align-items: center; cursor: pointer; user-select: none;
    border-bottom: 1px solid transparent;
  }
  .card.open .card-header { border-bottom-color: var(--border); }
  .card-header:hover { background: var(--bg); }
  .card-header .info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .card-header .source-file { color: var(--muted); font-size: .78em; }

  .badge {
    font-size: .72em; padding: 3px 10px; border-radius: 12px; font-weight: 600;
  }
  .badge-pending { background: var(--warning-bg); color: #b45309; }
  .badge-configured { background: var(--success-bg); color: #166534; }
  .badge-uncategorized { background: #fce7f3; color: #9d174d; font-size: .7em; }

  .card-body { padding: 18px; display: none; }
  .card.open .card-body { display: block; }
  .row { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
  .field { flex: 1; min-width: 180px; }
  .field label {
    display: block; font-size: .76em; font-weight: 600;
    color: var(--muted); margin-bottom: 3px;
    text-transform: uppercase; letter-spacing: .4px;
  }
  .field input, .field textarea, .field select {
    width: 100%; padding: 8px 11px; border: 1px solid var(--border);
    border-radius: 6px; font-size: .9em; font-family: inherit;
    background: var(--bg); color: var(--text);
  }
  .field input:focus, .field textarea:focus {
    outline: none; border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(99,102,241,.12);
  }
  .field textarea { resize: vertical; min-height: 70px; }

  .preview-box {
    margin-top: 10px; padding: 12px; background: var(--bg);
    border-radius: 6px; max-height: 240px; overflow-y: auto;
    font: .84em/1.65 "JetBrains Mono","Consolas",monospace;
    white-space: pre-wrap; display: none;
  }
  .preview-box.show { display: block; }

  .card-actions { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }

  .batch-panel {
    background: var(--card-bg); padding: 14px 18px;
    border-radius: var(--radius); box-shadow: var(--shadow);
    margin-bottom: 14px; display: none;
  }
  .batch-panel.show { display: block; }

  .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-state .icon { font-size: 3em; margin-bottom: 10px; }

  .toast {
    position: fixed; bottom: 24px; left: 24px; z-index: 999;
    padding: 10px 20px; border-radius: var(--radius);
    color: #fff; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,.2);
    animation: slideUp .3s;
  }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .toast-success { background: var(--success); }
  .toast-error { background: var(--danger); }

  .sort-hint { color: var(--muted); font-size: .78em; }

  .float-btns {
    position: fixed; bottom: 28px; right: 28px; z-index: 999;
    display: flex; flex-direction: column; gap: 10px;
  }
  .float-btn {
    padding: 12px 22px; border: none; border-radius: 24px;
    cursor: pointer; font-size: .95em; font-weight: 600;
    box-shadow: 0 4px 14px rgba(0,0,0,.18);
    transition: all .15s; display: flex; align-items: center; gap: 6px;
  }
  .float-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,.24); }
  .float-btn-exit { background: #ef4444; color: #fff; }
  .float-btn-upload { background: #3b82f6; color: #fff; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>📝 博客文章迁移工具</h1>
    <div class="meta">
      源目录: <code>${SOURCE_DIR}</code> → <code>src/content/posts/</code>
    </div>
  </header>

  <div class="toolbar">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="search-input" placeholder="搜索文章 (标题/分类/标签)..." oninput="filterAndSort()">
    </div>
    <button class="btn btn-primary" onclick="loadPosts()">🔄 刷新</button>
    <button class="btn btn-outline" onclick="toggleBatchPanel()">✏️ 批量编辑</button>
    <button class="btn btn-success" onclick="migrateAll()">🚀 全部迁移</button>
    <button class="btn" onclick="gitPush()" style="background:#3b82f6;color:#fff;">☁ 一键上传</button>
  </div>

  <div class="batch-panel" id="batch-panel">
    <h3 style="margin-bottom:10px">批量设置</h3>
    <div class="row">
      <div class="field">
        <label>统一分类</label>
        <input id="batch-category" placeholder="应用于所有文章">
      </div>
      <div class="field">
        <label>追加标签</label>
        <input id="batch-tags" placeholder="用逗号分隔">
      </div>
      <div class="field" style="max-width:110px">
        <label>草稿</label>
        <select id="batch-draft">
          <option value="">不修改</option>
          <option value="false">否</option>
          <option value="true">是</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="applyBatch()" style="margin-top:8px">应用</button>
  </div>

  <div class="progress-bar">
    <span>进度</span>
    <div class="bar"><div class="bar-fill" id="bar-fill" style="width:0%"></div></div>
    <span class="count" id="progress-text">0 / 0</span>
    <span class="sort-hint">排序: 未分类优先 · 最近修改在前</span>
  </div>

  <div id="posts-container">
    <div class="empty-state"><div class="icon">📂</div><p>加载中...</p></div>
  </div>
</div>

<div id="toast-container"></div>

<div class="float-btns">
  <button class="float-btn float-btn-upload" onclick="gitPush()">☁ 一键上传到 GitHub</button>
  <button class="float-btn float-btn-exit" onclick="shutdown()">⏻ 退出程序</button>
</div>

<script>
  let postsData = [];
  let searchTerm = '';

  async function loadPosts() {
    document.getElementById('posts-container').innerHTML =
      '<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>';
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.error) {
        showToast(data.error, 'error');
        document.getElementById('posts-container').innerHTML =
          '<div class="empty-state"><div class="icon">⚠️</div><p>'+data.error+'</p></div>';
        return;
      }
      postsData = data.posts;
      filterAndSort();
    } catch (err) {
      showToast('加载失败: '+err.message, 'error');
    }
  }

  function filterAndSort() {
    searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const container = document.getElementById('posts-container');

    if (!postsData.length) {
      container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>源目录中没有 .md 文件</p></div>';
      updateProgress();
      return;
    }

    // 先过滤
    let filtered = postsData;
    if (searchTerm) {
      filtered = postsData.filter(p =>
        (p.title||'').toLowerCase().includes(searchTerm) ||
        (p.category||'').toLowerCase().includes(searchTerm) ||
        (p.tags||'').toLowerCase().includes(searchTerm) ||
        (p.sourceFile||'').toLowerCase().includes(searchTerm)
      );
    }

    // 排序（已在服务端排好，保留顺序）
    container.innerHTML = filtered.map((p, i) => {
      const realIdx = postsData.indexOf(p);
      const configured = p._hasFrontmatter;
      const cardClass = configured ? 'configured open' : 'pending open';
      const badgeHtml = configured
        ? '<span class="badge badge-configured">✓ 已配置</span>'
        : ['<span class="badge badge-pending">待处理</span>',
           p.category ? '' : '<span class="badge badge-uncategorized">未分类</span>'].join(' ');

      return \`
<div class="card \${cardClass}" id="card-\${realIdx}">
  <div class="card-header" onclick="toggleCard(\${realIdx})">
    <div class="info">
      <strong>\${escHtml(p.title || '(无标题)')}</strong>
      <div class="source-file">\${escHtml(p.sourceFile)} · \${fmtSize(p.fileSize)} · \${p.published}</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center">\${badgeHtml}</div>
  </div>
  <div class="card-body">
    <div class="row">
      <div class="field">
        <label>标题</label>
        <input id="title-\${realIdx}" value="\${escAttr(p.title)}" oninput="onChange(\${realIdx},'title')">
      </div>
      <div class="field" style="max-width:155px">
        <label>发布日期</label>
        <input type="date" id="published-\${realIdx}" value="\${p.published}" onchange="onChange(\${realIdx},'published')">
      </div>
      <div class="field" style="max-width:100px">
        <label>草稿</label>
        <select id="draft-\${realIdx}" onchange="onChange(\${realIdx},'draft')">
          <option value="false" \${!p.draft?'selected':''}>否</option>
          <option value="true" \${p.draft?'selected':''}>是</option>
        </select>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>分类</label>
        <input id="category-\${realIdx}" value="\${escAttr(p.category)}" oninput="onChange(\${realIdx},'category')" placeholder="如: 前端, 后端, 生活...">
      </div>
      <div class="field">
        <label>标签 (逗号分隔)</label>
        <input id="tags-\${realIdx}" value="\${escAttr(p.tags)}" oninput="onChange(\${realIdx},'tags')" placeholder="如: JavaScript, Vue, 教程">
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>描述 (SEO)</label>
        <input id="description-\${realIdx}" value="\${escAttr(p.description)}" oninput="onChange(\${realIdx},'description')" placeholder="简短摘要...">
      </div>
      <div class="field" style="max-width:200px">
        <label>封面图</label>
        <input id="image-\${realIdx}" value="\${escAttr(p.image)}" oninput="onChange(\${realIdx},'image')" placeholder="如: ./cover.jpg">
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>Slug (URL 标识)</label>
        <input id="slug-\${realIdx}" value="\${escAttr(p.slug)}" oninput="onChange(\${realIdx},'slug'); postsData[\${realIdx}]._slugEdited=true">
      </div>
      <div class="field" style="max-width:100px">
        <label>语言</label>
        <input id="lang-\${realIdx}" value="\${escAttr(p.lang)}" placeholder="zh_CN" oninput="onChange(\${realIdx},'lang')">
      </div>
    </div>
    <button class="btn btn-outline btn-sm" onclick="togglePreview(\${realIdx})" style="margin-top:4px">
      👁 预览原文
    </button>
    <div class="preview-box" id="preview-\${realIdx}">\${escHtml((p.content||'').substring(0, 3000))}\${(p.content||'').length>3000?'\\n\\n... (已截断)':''}</div>
    <div class="card-actions">
      <button class="btn btn-success" onclick="migrateOne(\${realIdx})">
        \${configured ? '🔄 更新' : '✓ 确认迁移'}
      </button>
    </div>
  </div>
</div>\`;
    }).join('');

    updateProgress();
  }

  function onChange(i, field) {
    const el = document.getElementById(field + '-' + i);
    if (!el) return;
    let val = field === 'draft' ? (el.value === 'true') : el.value;
    postsData[i][field] = val;
    if (field === 'title' && !postsData[i]._slugEdited) {
      const sEl = document.getElementById('slug-' + i);
      if (sEl) { sEl.value = autoSlug(val, postsData[i].published); postsData[i].slug = sEl.value; }
    }
  }

  function autoSlug(title, date) {
    return title;
  }

  function toggleCard(i) { document.getElementById('card-'+i).classList.toggle('open'); }
  function togglePreview(i) { document.getElementById('preview-'+i).classList.toggle('show'); }
  function toggleBatchPanel() { document.getElementById('batch-panel').classList.toggle('show'); }

  function applyBatch() {
    const cat = document.getElementById('batch-category').value.trim();
    const tags = document.getElementById('batch-tags').value.trim();
    const draft = document.getElementById('batch-draft').value;
    postsData.forEach((p, i) => {
      if (cat) { p.category = cat; const el = document.getElementById('category-'+i); if (el) el.value = cat; }
      if (tags) { p.tags = tags; const el = document.getElementById('tags-'+i); if (el) el.value = tags; }
      if (draft !== '') { p.draft = draft === 'true'; const el = document.getElementById('draft-'+i); if (el) el.value = draft; }
    });
    showToast('批量设置已应用', 'success');
  }

  async function migrateOne(i) {
    const post = { ...postsData[i] };
    if (!post.title || !post.slug) {
      showToast('错误: 标题或 Slug 不能为空', 'error');
      return;
    }
    post.tags = post.tags || '';
    // 显示处理中状态
    const btn = document.querySelector(\`#card-\${i} .btn-success\`);
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 处理中...'; }
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(post),
      });
      const result = await res.json();
      if (result.success) {
        postsData[i]._hasFrontmatter = true;
        postsData[i]._migrated = true;
        showToast('✓ '+post.title+' 迁移成功', 'success');
        filterAndSort();
      } else {
        showToast('✗ 迁移失败: '+result.error, 'error');
      }
    } catch (err) {
      console.error('[迁移失败]', post.title, err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        showToast('✗ 无法连接服务器，请确认迁移工具正在运行 (http://localhost:3456)', 'error');
      } else {
        showToast('✗ 请求失败: '+err.message, 'error');
      }
    }
    if (btn) { btn.disabled = false; btn.textContent = postsData[i]._hasFrontmatter ? '🔄 更新' : '✓ 确认迁移'; }
  }

  async function migrateAll() {
    const pending = postsData;
    if (!pending.length) { showToast('没有文章可迁移', 'error'); return; }
    if (!confirm('确认迁移/更新全部 '+pending.length+' 篇文章？')) return;
    let done = 0, failed = 0;
    const errors = [];
    for (let i = 0; i < postsData.length; i++) {
      const post = { ...postsData[i] };
      if (!post.title || !post.slug) { failed++; continue; }
      post.tags = post.tags || '';
      try {
        const res = await fetch('/api/migrate', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(post),
        });
        const r = await res.json();
        if (r.success) { postsData[i]._hasFrontmatter = true; postsData[i]._migrated = true; done++; }
        else { failed++; errors.push(post.sourceFile+': '+r.error); }
      } catch (err) {
        failed++;
        errors.push(post.sourceFile+': '+err.message);
        console.error('[全部迁移失败]', post.sourceFile, err);
      }
    }
    const msg = '完成: '+done+'/'+pending.length+' 篇' + (failed>0 ? '，'+failed+' 篇失败' : '');
    showToast(msg, done>0?'success':'error');
    if (errors.length) console.error('失败详情:', errors);
    filterAndSort();
  }

  function updateProgress() {
    const total = postsData.length;
    const done = postsData.filter(p => p._hasFrontmatter).length;
    const pct = total ? Math.round(done/total*100) : 0;
    document.getElementById('bar-fill').style.width = pct+'%';
    document.getElementById('progress-text').textContent = done+' / '+total;
  }

  function sendHeartbeat() {
    fetch('/api/ping', { method: 'POST', cache: 'no-store', keepalive: true }).catch(() => {});
  }

  sendHeartbeat();
  setInterval(sendHeartbeat, 2000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sendHeartbeat();
  });

  async function shutdown() {
    try { await fetch('/api/shutdown', { method: 'POST' }); } catch(e) {}
    window.close();
  }

  async function gitPush() {
    if (!confirm('将提交所有更改并推送到 GitHub，确认？')) return;
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ 上传中...';
    try {
      const res = await fetch('/api/upload', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✓ 上传成功！GitHub Actions 将自动部署', 'success');
      } else {
        showToast('上传失败: ' + (data.error || '未知错误'), 'error');
      }
    } catch (err) {
      showToast('请求失败: ' + err.message, 'error');
    }
    btn.disabled = false;
    btn.textContent = '☁ 一键上传到 GitHub';
  }

  function showToast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast toast-'+(type==='error'?'error':'success');
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function escHtml(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtSize(b) { return b>1024 ? (b/1024).toFixed(1)+' KB' : b+' B'; }

  loadPosts();
</script>
</body>
</html>`;

// ─── HTTP 服务器 ────────────────────────────────────────

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); }
    });
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  try {
    // GET /
    if (req.method === "GET" && path === "/") {
      markPageAlive();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(HTML_PAGE);
      return;
    }

    // POST /api/ping — 页面心跳，用于关闭浏览器后自动停服
    if ((req.method === "GET" || req.method === "POST") && path === "/api/ping") {
      markPageAlive();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // GET /api/posts
    if (req.method === "GET" && path === "/api/posts") {
      const result = scanSourceDir();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    // POST /api/migrate — 同时写入源文件（打标记）和目标文件
    if (req.method === "POST" && path === "/api/migrate") {
      const post = await parseJsonBody(req);
      if (!post.title || !post.slug) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "缺少必要字段 (title, slug)" }));
        return;
      }

      console.log(`[迁移] 开始处理: ${post.title} (${post.sourceFile || "unknown"})`);

      const markdown = buildMarkdown(post);

      // 1. 写回源文件（原地打标记）
      if (post.sourcePath && existsSync(post.sourcePath)) {
        writeFileSync(post.sourcePath, markdown, "utf-8");
        console.log(`[迁移] 源文件已更新: ${post.sourcePath}`);
      }

      // 2. 写入目标目录
      const { mkdirSync } = await import("node:fs");
      if (!existsSync(TARGET_DIR)) mkdirSync(TARGET_DIR, { recursive: true });
      const targetPath = join(TARGET_DIR, `${post.slug}.md`);
      writeFileSync(targetPath, markdown, "utf-8");
      console.log(`[迁移] 目标文件已写入: ${targetPath}`);

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, source: post.sourcePath, target: targetPath }));
      return;
    }

    // POST /api/shutdown — 停止服务
    if (req.method === "POST" && path === "/api/shutdown") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, message: "服务已停止" }));
      shutdownServer("收到页面关闭请求");
      return;
    }

    // POST /api/upload — Git 一键上传
    if (req.method === "POST" && path === "/api/upload") {
      const { execSync } = await import("node:child_process");
      try {
        const add = execSync('git add -A', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 });
        const status = execSync('git status --porcelain', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 5000 });
        if (!status.trim()) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: true, message: "没有需要提交的更改" }));
          return;
        }
        const commit = execSync('git commit -m "📝 迁移工具: 更新文章"', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 });
        const push = execSync('git push origin main', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 30000 });
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true, message: "上传成功", output: push }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: err.stderr || err.message }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error(`[错误] ${req.method} ${path}:`, err.message);
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

// ─── 启动 ───────────────────────────────────────────────

const server = createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`
  📝  博客文章迁移工具 v2
  源目录:  ${SOURCE_DIR}
  目标目录: ${TARGET_DIR}
  🌐  http://localhost:${PORT}
  `);
  // 浏览器由 .bat 启动脚本负责打开
});
