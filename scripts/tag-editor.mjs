/**
 * 博客文章标记工具 — 图形化标签/分类/描述编辑器
 *
 * 用法: node scripts/tag-editor.mjs  或  双击 标记工具.bat
 * 浏览器打开 http://localhost:3457
 *
 * 功能:
 *   - 扫描 src/content/posts/ 下所有 .md 文件
 *   - 标签云 + 点击筛选
 *   - 内联编辑标签、分类、描述、草稿状态
 *   - 批量操作（统一添加标签、设置分类）
 *   - 手术式 frontmatter 编辑（保留未知字段和原始格式）
 *   - 关闭浏览器后自动停服
 */

import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, extname, join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

// ─── 配置 ────────────────────────────────────────────────
const PORT = 3457;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const POSTS_DIR = join(PROJECT_ROOT, "src", "content", "posts");
const SHUTDOWN_GRACE_MS = 12000;

let lastHeartbeatAt = 0;
let shuttingDown = false;

function markPageAlive() {
  lastHeartbeatAt = Date.now();
}

function shutdownServer(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`标记工具正在退出: ${reason}`);
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
      const inner = val.slice(1, -1).trim();
      if (!inner) {
        val = [];
      } else {
        // 处理带引号的标签: ["foo bar", baz] → ["foo bar", "baz"]
        val = [];
        let current = "";
        let inQuote = false;
        let quoteChar = "";
        for (const ch of inner) {
          if (!inQuote && (ch === '"' || ch === "'")) {
            inQuote = true;
            quoteChar = ch;
          } else if (inQuote && ch === quoteChar) {
            inQuote = false;
            quoteChar = "";
          } else if (!inQuote && ch === ",") {
            val.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
        if (current.trim()) val.push(current.trim());
      }
    }
    // 解析布尔值
    else if (val === "true") val = true;
    else if (val === "false") val = false;
    // 空字符串
    else if (val === "''" || val === '""') val = "";
    fm[kv[1]] = val;
  }
  return { frontmatter: fm, body: m[2] };
}

/** 从正文提取第一个 # 标题 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+?)(?:\r?\n|$)/m);
  if (match) return match[1].trim();
  return "";
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
  if (Array.isArray(val)) {
    if (!val.length) return "[]";
    const parts = val.map(t => {
      const s = String(t).trim();
      if (/[:"{}[\]&*#?|\-<>=!%@`'\s]/.test(s) || /^\d/.test(s)) {
        return `"${s.replace(/"/g, '\\"')}"`;
      }
      return s;
    });
    return `[${parts.join(", ")}]`;
  }
  const s = String(val).trim();
  if (!s) return "''";
  if (/[:"{}[\]&*#?|\-<>=!%@`']/.test(s)) return `"${s.replace(/"/g, '\\"')}"`;
  if (/^\d+$/.test(s)) return `"${s}"`;
  return s;
}

/** 生成 HTML 转义 */
function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escAttr(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── 手术式 Frontmatter 编辑 ─────────────────────────────

/**
 * 更新 markdown 文件的 frontmatter 字段
 * 只修改指定字段的行，保留其他字段和原始格式不变
 * @param {string} content - 完整 markdown 内容
 * @param {object} updates - { key: newValue, ... }
 * @returns {string} 更新后的 markdown 内容
 */
function updateFrontmatter(content, updates) {
  const m = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/);
  if (!m) {
    // 无 frontmatter — 创建新的
    const lines = ["---"];
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      lines.push(`${key}: ${yamlValue(value)}`);
    }
    lines.push("---", "", content.trim());
    return lines.join("\n") + "\n";
  }

  const header = m[1];
  const fmBody = m[2];
  const separator = m[3];
  const contentBody = m[4];
  const lines = fmBody.split(/\r?\n/);
  const updatedKeys = new Set();

  const newLines = lines.map(line => {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv && Object.prototype.hasOwnProperty.call(updates, kv[1])) {
      updatedKeys.add(kv[1]);
      const val = updates[kv[1]];
      if (val === undefined) return line; // 跳过未提供的字段
      return `${kv[1]}: ${yamlValue(val)}`;
    }
    return line;
  });

  // 追加新字段（已有 frontmatter 但缺少该 key）
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || updatedKeys.has(key)) continue;
    newLines.push(`${key}: ${yamlValue(value)}`);
  }

  return `${header}${newLines.join("\n")}${separator}${contentBody}`;
}

// ─── 扫描文章目录（递归） ────────────────────────────────

function scanPostsDir() {
  const posts = [];
  const allTags = {}; // { tagName: count }
  const allCategories = {};
  let draftCount = 0;
  let untaggedCount = 0;
  let noDescCount = 0;

  function walk(dir) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (ext !== ".md" && ext !== ".mdx") continue;

        const rawContent = readUtf8(fullPath);
        const parsed = parseFrontmatter(rawContent);
        const relPath = relative(POSTS_DIR, fullPath).replace(/\\/g, "/");

        let post;
        if (parsed) {
          const tags = Array.isArray(parsed.frontmatter.tags) ? parsed.frontmatter.tags : [];
          const category = parsed.frontmatter.category || "";
          const description = parsed.frontmatter.description || "";
          const draft = parsed.frontmatter.draft === true;
          const title = parsed.frontmatter.title || extractTitle(parsed.body) || basename(entry, ext);

          post = {
            file: relPath,
            title,
            published: parsed.frontmatter.published
              ? (typeof parsed.frontmatter.published === "object" && parsed.frontmatter.published instanceof Date
                  ? formatDate(parsed.frontmatter.published)
                  : String(parsed.frontmatter.published))
              : formatDate(stat.mtime),
            description,
            tags,
            category,
            draft,
            lang: parsed.frontmatter.lang || "",
            fileSize: stat.size,
          };

          // 统计
          if (draft) draftCount++;
          if (!tags.length) untaggedCount++;
          if (!description) noDescCount++;
          for (const t of tags) {
            allTags[t] = (allTags[t] || 0) + 1;
          }
          if (category) {
            allCategories[category] = (allCategories[category] || 0) + 1;
          }
        } else {
          // 无 frontmatter
          const body = rawContent;
          const title = extractTitle(body) || basename(entry, ext);
          post = {
            file: relPath,
            title,
            published: formatDate(stat.mtime),
            description: "",
            tags: [],
            category: "",
            draft: false,
            lang: "",
            fileSize: stat.size,
          };
          untaggedCount++;
          noDescCount++;
        }
        posts.push(post);
      }
    }
  }

  walk(POSTS_DIR);

  // 排序：未标记在前，然后按日期倒序
  posts.sort((a, b) => {
    const aUntagged = a.tags.length === 0 ? 0 : 1;
    const bUntagged = b.tags.length === 0 ? 0 : 1;
    if (aUntagged !== bUntagged) return aUntagged - bUntagged;
    return (b.published || "").localeCompare(a.published || "");
  });

  return {
    posts,
    stats: {
      total: posts.length,
      tagged: posts.length - untaggedCount,
      untagged: untaggedCount,
      noDescription: noDescCount,
      drafts: draftCount,
      allTags,
      allCategories: Object.keys(allCategories).sort(),
    },
  };
}

// ─── HTML GUI ──────────────────────────────────────────

const HTML_PAGE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🏷️ 博客文章标记工具</title>
<style>
  :root {
    --bg: #f6f7f9; --card-bg: #fff; --text: #2c2c2c;
    --border: #e2e4e8; --primary: #6366f1; --primary-hover: #4f46e5;
    --success: #22c55e; --success-bg: #f0fdf4; --danger: #ef4444;
    --warning: #f59e0b; --warning-bg: #fffbeb; --muted: #888;
    --tag-bg: #eef2ff; --tag-text: #4338ca; --tag-hover: #e0e7ff;
    --dirty-border: #f59e0b; --selected-bg: #f0f4ff;
    --radius: 8px; --shadow: 0 1px 3px rgba(0,0,0,.06);
    --pill-radius: 14px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f0f1a; --card-bg: #1a1a2e; --text: #c8c8d4;
      --border: #2a2a44; --muted: #6666aa;
      --success-bg: #052e16; --warning-bg: #422006;
      --tag-bg: #1e293b; --tag-text: #93c5fd; --tag-hover: #1e3a5f;
      --selected-bg: #1a1a3e;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font: 13px/1.5 -apple-system, "Microsoft YaHei", sans-serif;
    background: var(--bg); color: var(--text); padding: 16px;
  }
  .container { max-width: 1100px; margin: 0 auto; }

  header {
    text-align: center; margin-bottom: 14px;
    padding: 14px 20px; background: var(--card-bg);
    border-radius: var(--radius); box-shadow: var(--shadow);
  }
  header h1 { font-size: 1.3em; margin-bottom: 2px; }
  header .stats { color: var(--muted); font-size: .8em; }
  header .stats span { margin: 0 8px; }
  header .stats .num { font-weight: 600; color: var(--primary); }

  .toolbar {
    display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; align-items: center;
  }
  .search-box { flex: 1; min-width: 200px; position: relative; }
  .search-box input {
    width: 100%; padding: 7px 12px 7px 32px;
    border: 1px solid var(--border); border-radius: var(--radius);
    font-size: .9em; background: var(--card-bg); color: var(--text);
    box-shadow: var(--shadow);
  }
  .search-box input:focus { outline: none; border-color: var(--primary); }
  .search-box .si {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: var(--muted); font-size: .85em;
  }

  .btn {
    padding: 6px 14px; border: none; border-radius: var(--radius);
    cursor: pointer; font-size: .82em; font-weight: 500;
    transition: all .15s; white-space: nowrap;
  }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-outline:hover { background: var(--bg); }
  .btn-outline.active { background: var(--primary); color: #fff; border-color: var(--primary); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-success { background: var(--success); color: #fff; }
  .btn-sm { padding: 3px 10px; font-size: .76em; }

  .tag-cloud {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
    padding: 8px 12px; background: var(--card-bg);
    border-radius: var(--radius); box-shadow: var(--shadow); align-items: center;
  }
  .tag-cloud .label { font-size: .76em; color: var(--muted); margin-right: 4px; font-weight: 600; }
  .tag-cloud .tag-pill {
    font-size: .76em; padding: 3px 10px; border-radius: var(--pill-radius);
    cursor: pointer; border: 1px solid var(--tag-bg);
    background: var(--tag-bg); color: var(--tag-text);
    transition: all .15s; user-select: none;
  }
  .tag-cloud .tag-pill:hover { background: var(--tag-hover); }
  .tag-cloud .tag-pill.active {
    background: var(--primary); color: #fff; border-color: var(--primary);
  }
  .tag-cloud .tag-pill .count { opacity: .65; font-size: .85em; }

  .filter-bar {
    display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap; align-items: center;
  }
  .filter-bar .label { font-size: .78em; color: var(--muted); font-weight: 600; margin-right: 2px; }

  .batch-bar {
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
    padding: 8px 14px; background: var(--card-bg);
    border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 10px;
    font-size: .82em; border-left: 3px solid var(--primary);
  }
  .batch-bar.hidden { display: none; }
  .batch-bar input, .batch-bar select {
    padding: 5px 10px; border: 1px solid var(--border);
    border-radius: 4px; font-size: .9em; background: var(--bg); color: var(--text);
  }
  .batch-bar .count { font-weight: 600; color: var(--primary); }

  .posts-table {
    background: var(--card-bg); border-radius: var(--radius); box-shadow: var(--shadow);
    overflow: hidden;
  }
  .post-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 14px; border-bottom: 1px solid var(--border);
    transition: background .15s; flex-wrap: wrap;
  }
  .post-row:last-child { border-bottom: none; }
  .post-row:hover { background: var(--bg); }
  .post-row.selected { background: var(--selected-bg); }
  .post-row.dirty { border-left: 3px solid var(--dirty-border); }
  .post-row.saved-flash { animation: flashGreen .6s; }
  .post-row.draft-row { opacity: .7; }

  @keyframes flashGreen {
    0% { background: var(--success-bg); }
    100% { background: transparent; }
  }

  .post-row .cb { flex-shrink: 0; }
  .post-row .cb input { cursor: pointer; width: 15px; height: 15px; }

  .post-row .date {
    flex-shrink: 0; font-size: .78em; color: var(--muted); min-width: 80px;
  }
  .post-row .title {
    flex-shrink: 0; min-width: 140px; max-width: 220px;
    font-weight: 600; font-size: .88em; cursor: pointer; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .post-row .title:hover { color: var(--primary); }

  .post-row .tags-area {
    flex: 1; min-width: 180px; display: flex; align-items: center;
    gap: 4px; flex-wrap: wrap;
  }
  .post-row .tags-area .tp {
    font-size: .74em; padding: 2px 8px; border-radius: var(--pill-radius);
    background: var(--tag-bg); color: var(--tag-text);
    display: inline-flex; align-items: center; gap: 3px;
    white-space: nowrap;
  }
  .post-row .tags-area .tp .rm {
    cursor: pointer; font-weight: 700; font-size: 1.1em;
    opacity: .5; transition: opacity .15s;
  }
  .post-row .tags-area .tp .rm:hover { opacity: 1; color: var(--danger); }
  .post-row .tags-area .add-tag {
    font-size: .72em; padding: 2px 8px; border-radius: var(--pill-radius);
    cursor: pointer; border: 1px dashed var(--border); color: var(--muted);
    background: transparent; position: relative;
  }
  .post-row .tags-area .add-tag:hover { border-color: var(--primary); color: var(--primary); }

  .tag-suggest {
    position: absolute; top: 100%; left: 0; z-index: 99;
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: 0 4px 12px rgba(0,0,0,.15);
    min-width: 150px; max-height: 180px; overflow-y: auto; display: none;
  }
  .tag-suggest.show { display: block; }
  .tag-suggest .item {
    padding: 6px 12px; cursor: pointer; font-size: .82em;
    border-bottom: 1px solid var(--border);
  }
  .tag-suggest .item:last-child { border-bottom: none; }
  .tag-suggest .item:hover { background: var(--bg); }
  .tag-suggest .item .used { font-size: .75em; color: var(--muted); margin-left: 6px; }
  .tag-suggest .new-tag-input {
    padding: 6px 12px; border-bottom: 1px solid var(--border);
  }
  .tag-suggest .new-tag-input input {
    width: 100%; border: none; outline: none; font-size: .82em;
    background: transparent; color: var(--text);
  }

  .post-row .cat-select {
    flex-shrink: 0; min-width: 80px;
    padding: 4px 6px; border: 1px solid var(--border);
    border-radius: 4px; font-size: .8em; background: var(--bg); color: var(--text);
  }
  .post-row .desc-input {
    flex: 0.6; min-width: 120px;
    padding: 4px 8px; border: 1px solid var(--border);
    border-radius: 4px; font-size: .8em; background: var(--bg); color: var(--text);
  }
  .post-row .desc-input::placeholder { color: var(--muted); font-style: italic; }

  .post-row .draft-toggle {
    flex-shrink: 0; display: flex; align-items: center; gap: 3px; font-size: .76em;
    cursor: pointer; user-select: none; color: var(--muted);
  }
  .post-row .draft-toggle input { cursor: pointer; }
  .post-row .draft-toggle.draft-on { color: #f59e0b; font-weight: 600; }

  .post-row .actions {
    flex-shrink: 0; display: flex; gap: 4px;
  }

  .post-row .saved-indicator {
    flex-shrink: 0; font-size: .7em; color: var(--success); min-width: 50px; text-align: right;
  }

  .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-state .icon { font-size: 3em; margin-bottom: 10px; }

  .toast {
    position: fixed; bottom: 24px; left: 24px; z-index: 999;
    padding: 10px 20px; border-radius: var(--radius);
    color: #fff; font-weight: 500; font-size: .85em;
    box-shadow: 0 4px 12px rgba(0,0,0,.2);
    animation: slideUp .3s;
  }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .toast-success { background: var(--success); }
  .toast-error { background: var(--danger); }

  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,.5); z-index: 998; display: flex;
    align-items: center; justify-content: center; display: none;
  }
  .modal-overlay.show { display: flex; }
  .modal {
    background: var(--card-bg); border-radius: var(--radius);
    max-width: 700px; width: 90%; max-height: 80vh;
    overflow-y: auto; padding: 20px; box-shadow: 0 8px 30px rgba(0,0,0,.3);
  }
  .modal h3 { margin-bottom: 12px; }
  .modal pre {
    font: .82em/1.6 "JetBrains Mono","Consolas",monospace;
    white-space: pre-wrap; background: var(--bg);
    padding: 12px; border-radius: 6px; max-height: 50vh; overflow-y: auto;
  }
  .modal .close-btn { float: right; cursor: pointer; font-size: 1.3em; color: var(--muted); }

  .float-btns {
    position: fixed; bottom: 20px; right: 20px; z-index: 999;
    display: flex; flex-direction: column; gap: 8px;
  }
  .float-btn {
    padding: 10px 18px; border: none; border-radius: 20px;
    cursor: pointer; font-size: .85em; font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,.18);
    transition: all .15s; display: flex; align-items: center; gap: 5px;
  }
  .float-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.24); }
  .float-btn-exit { background: #ef4444; color: #fff; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🏷️ 博客文章标记工具</h1>
    <div class="stats" id="stats-bar">加载中...</div>
  </header>

  <div class="toolbar">
    <div class="search-box">
      <span class="si">🔍</span>
      <input type="text" id="search-input" placeholder="搜索标题 / 标签 / 分类 / 文件名..." oninput="applyFilters()">
    </div>
    <button class="btn btn-outline" onclick="loadPosts()">🔄 刷新</button>
    <button class="btn btn-outline" onclick="toggleSelectMode()" id="select-mode-btn">☐ 选择模式</button>
    <button class="btn btn-primary" onclick="saveAllDirty()" id="save-all-btn" style="display:none">💾 全部保存</button>
  </div>

  <div class="tag-cloud" id="tag-cloud"></div>

  <div class="filter-bar">
    <span class="label">快捷筛选:</span>
    <button class="btn btn-sm btn-outline active" onclick="setFilter('all', this)">全部</button>
    <button class="btn btn-sm btn-outline" onclick="setFilter('published', this)">已发布</button>
    <button class="btn btn-sm btn-outline" onclick="setFilter('draft', this)">草稿</button>
    <button class="btn btn-sm btn-outline" onclick="setFilter('untagged', this)">无标签</button>
    <button class="btn btn-sm btn-outline" onclick="setFilter('nodesc', this)">无描述</button>
    <span style="margin-left:8px;color:var(--muted);font-size:.78em" id="visible-count"></span>
  </div>

  <div class="batch-bar hidden" id="batch-bar">
    <span>已选 <span class="count" id="batch-count">0</span> 篇 →</span>
    <input type="text" id="batch-add-tags" placeholder="添加标签 (逗号分隔)" style="width:200px">
    <select id="batch-category" style="min-width:100px">
      <option value="">设分类...</option>
    </select>
    <select id="batch-draft">
      <option value="">草稿...</option>
      <option value="false">否</option>
      <option value="true">是</option>
    </select>
    <button class="btn btn-primary btn-sm" onclick="applyBatch()">应用</button>
    <button class="btn btn-sm btn-outline" onclick="clearSelection()">取消选择</button>
  </div>

  <div class="posts-table" id="posts-table">
    <div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>
  </div>
</div>

<div class="float-btns">
  <button class="float-btn float-btn-exit" onclick="shutdown()">⏻ 退出程序</button>
</div>

<div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal" id="modal-content"></div>
</div>

<div id="toast-container"></div>

<script>
  let postsData = [];
  let allTagsObj = {};       // { tagName: count }
  let allCategories = [];
  let activeTagFilters = new Set();
  let currentFilter = 'all';
  let selectMode = false;
  let selectedPosts = new Set();
  let dirtyPosts = {};       // { filename: { field: newValue, ... } }
  let originalData = {};     // { filename: { tags: [], category: '', ... } }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function loadPosts() {
    document.getElementById('posts-table').innerHTML =
      '<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>';
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.error) {
        showToast(data.error, 'error');
        return;
      }
      postsData = data.posts;
      allTagsObj = data.stats.allTags;
      allCategories = data.stats.allCategories;
      // 保存原始数据用于脏检测
      originalData = {};
      for (const p of postsData) {
        originalData[p.file] = {
          tags: [...p.tags],
          category: p.category,
          description: p.description,
          draft: p.draft,
        };
      }
      dirtyPosts = {};
      selectedPosts.clear();
      document.getElementById('save-all-btn').style.display = 'none';
      updateStats(data.stats);
      renderTagCloud();
      populateBatchCategory();
      applyFilters();
    } catch (err) {
      showToast('加载失败: ' + err.message, 'error');
    }
  }

  function updateStats(stats) {
    document.getElementById('stats-bar').innerHTML =
      '<span>共 <span class="num">' + stats.total + '</span> 篇</span>' +
      '<span>已标记 <span class="num">' + stats.tagged + '</span></span>' +
      '<span>未标记 <span class="num">' + stats.untagged + '</span></span>' +
      '<span>无描述 <span class="num">' + stats.noDescription + '</span></span>' +
      '<span>草稿 <span class="num">' + stats.drafts + '</span></span>' +
      '<span>分类 <span class="num">' + stats.allCategories.length + '</span> 个</span>';
  }

  function renderTagCloud() {
    const cloud = document.getElementById('tag-cloud');
    const entries = Object.entries(allTagsObj).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      cloud.innerHTML = '<span style="color:var(--muted);font-size:.78em">暂无标签</span>';
      return;
    }
    cloud.innerHTML = '<span class="label">标签筛选:</span> ' + entries.map(([tag, count]) => {
      const active = activeTagFilters.has(tag) ? ' active' : '';
      return '<span class="tag-pill' + active + '" data-action="filter-tag" data-tag="' + escAttr(tag) + '" title="点击筛选">' +
        escHtml(tag) + ' <span class="count">×' + count + '</span></span>';
    }).join('\\n');
  }

  function toggleTagFilter(tag, el) {
    if (activeTagFilters.has(tag)) {
      activeTagFilters.delete(tag);
      if (el) el.classList.remove('active');
    } else {
      activeTagFilters.add(tag);
      if (el) el.classList.add('active');
    }
    applyFilters();
  }

  function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.filter-bar .btn-outline').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // 清空标签筛选
    activeTagFilters.clear();
    renderTagCloud();
    applyFilters();
  }

  function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    let filtered = postsData;

    // 快捷筛选
    if (currentFilter === 'published') filtered = filtered.filter(p => !p.draft);
    else if (currentFilter === 'draft') filtered = filtered.filter(p => p.draft);
    else if (currentFilter === 'untagged') filtered = filtered.filter(p => !p.tags.length);
    else if (currentFilter === 'nodesc') filtered = filtered.filter(p => !p.description);

    // 搜索
    if (searchTerm) {
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(searchTerm) ||
        (p.category || '').toLowerCase().includes(searchTerm) ||
        (p.tags || []).some(t => t.toLowerCase().includes(searchTerm)) ||
        (p.file || '').toLowerCase().includes(searchTerm) ||
        (p.description || '').toLowerCase().includes(searchTerm)
      );
    }

    // 标签筛选 (AND)
    if (activeTagFilters.size > 0) {
      filtered = filtered.filter(p =>
        Array.from(activeTagFilters).every(t => p.tags.includes(t))
      );
    }

    document.getElementById('visible-count').textContent = '显示 ' + filtered.length + ' / ' + postsData.length + ' 篇';
    renderPosts(filtered);
    updateBatchBar();
  }

  function getDirtyFields(file) {
    if (!dirtyPosts[file]) return null;
    const dirty = {};
    const orig = originalData[file];
    const curr = dirtyPosts[file];
    // 获取当前内存中的值
    const post = postsData.find(p => p.file === file);
    if (!post) return null;

    for (const [field, val] of Object.entries(curr)) {
      const origVal = orig[field];
      if (field === 'tags') {
        if (JSON.stringify(origVal) !== JSON.stringify(val)) dirty[field] = val;
      } else if (origVal !== val) {
        dirty[field] = val;
      }
    }
    return Object.keys(dirty).length > 0 ? dirty : null;
  }

  function isRowDirty(file) {
    return !!getDirtyFields(file);
  }

  function renderPosts(posts) {
    const table = document.getElementById('posts-table');
    if (!posts.length) {
      table.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>没有匹配的文章</p></div>';
      return;
    }

    table.innerHTML = posts.map(p => {
      const file = p.file;
      const selected = selectedPosts.has(file) ? ' selected' : '';
      const dirty = isRowDirty(file) ? ' dirty' : '';
      const draftClass = p.draft ? ' draft-row' : '';
      const tagsHtml = (p.tags || []).map(t =>
        '<span class="tp">' + escHtml(t) + '<span class="rm" data-action="remove-tag" data-file="' + escAttr(file) + '" data-tag="' + escAttr(t) + '">&times;</span></span>'
      ).join('');

      const savedHtml = isRowDirty(file)
        ? '<span style="color:#f59e0b;font-size:.72em">已修改</span>'
        : '<span style="color:var(--success);font-size:.72em">✓</span>';

      const catOptions = ['<option value="">—</option>']
        .concat(allCategories.map(c => '<option value="' + escAttr(c) + '" ' + (p.category === c ? 'selected' : '') + '>' + escHtml(c) + '</option>'))
        .join('');

      return '<div class="post-row' + selected + dirty + draftClass + '" data-file="' + escAttr(file) + '" id="row-' + escAttr(file).replace(/[^a-zA-Z0-9-_.]/g, '_') + '">' +
        '<span class="cb"><input type="checkbox" ' + (selected ? 'checked' : '') + ' data-action="select" data-file="' + escAttr(file) + '"></span>' +
        '<span class="date">' + escHtml(p.published) + '</span>' +
        '<span class="title" data-action="preview" data-file="' + escAttr(file) + '" title="点击预览正文">' + escHtml(p.title) + '</span>' +
        '<span class="tags-area">' +
          tagsHtml +
          '<span class="add-tag" data-action="add-tag" data-file="' + escAttr(file) + '" title="添加标签">⊕</span>' +
        '</span>' +
        '<select class="cat-select" data-action="change-category" data-file="' + escAttr(file) + '">' + catOptions + '</select>' +
        '<input class="desc-input" value="' + escAttr(p.description) + '" placeholder="无描述..." data-action="change-description" data-file="' + escAttr(file) + '" style="' + (!p.description ? 'border-color:#f59e0b' : '') + '">' +
        '<span class="draft-toggle' + (p.draft ? ' draft-on' : '') + '" data-action="toggle-draft" data-file="' + escAttr(file) + '">' +
          '<input type="checkbox" ' + (p.draft ? 'checked' : '') + ' tabindex="-1"> 草稿' +
        '</span>' +
        '<span class="saved-indicator">' + savedHtml + '</span>' +
        '<span class="actions">' +
          (isRowDirty(file) ? '<button class="btn btn-sm btn-primary" data-action="save" data-file="' + escAttr(file) + '">保存</button>' +
           '<button class="btn btn-sm btn-outline" data-action="revert" data-file="' + escAttr(file) + '">还原</button>' : '') +
        '</span>' +
      '</div>';
    }).join('');
  }

  // ─── 事件委托 ──────────────────────────

  // 文章表格事件委托
  document.getElementById('posts-table').addEventListener('click', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const file = target.getAttribute('data-file');

    switch (action) {
      case 'remove-tag': {
        const tag = target.getAttribute('data-tag');
        removeTag(file, tag);
        break;
      }
      case 'add-tag':
        showTagSuggest(file, target);
        break;
      case 'select':
        toggleSelect(file, target.querySelector('input') ? target.querySelector('input').checked : target.checked);
        break;
      case 'preview':
        previewPost(file);
        break;
      case 'save':
        saveOne(file);
        break;
      case 'revert':
        revertOne(file);
        break;
      case 'toggle-draft':
        toggleDraft(file);
        break;
    }
  });

  document.getElementById('posts-table').addEventListener('change', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const file = target.getAttribute('data-file');
    if (action === 'change-category') {
      markDirty(file, 'category', target.value);
      target.className = 'cat-select modified';
    }
  });

  document.getElementById('posts-table').addEventListener('input', function(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const file = target.getAttribute('data-file');
    if (action === 'change-description') {
      markDirty(file, 'description', target.value);
    }
  });

  // 标签云事件委托
  document.getElementById('tag-cloud').addEventListener('click', function(e) {
    const target = e.target.closest('[data-action="filter-tag"]');
    if (!target) return;
    const tag = target.getAttribute('data-tag');
    if (activeTagFilters.has(tag)) {
      activeTagFilters.delete(tag);
      target.classList.remove('active');
    } else {
      activeTagFilters.add(tag);
      target.classList.add('active');
    }
    applyFilters();
  });

  // ─── 脏状态追踪 ──────────────────────────

  function markDirty(file, field, value) {
    if (!dirtyPosts[file]) dirtyPosts[file] = {};
    dirtyPosts[file][field] = value;
    // 同步更新内存
    const post = postsData.find(p => p.file === file);
    if (post) {
      if (field === 'tags') post[field] = value;
      else post[field] = value;
    }
    // 局部更新行
    refreshRow(file);
    updateSaveAllBtn();
  }

  function refreshRow(file) {
    const row = document.getElementById('row-' + file.replace(/[^a-zA-Z0-9-_.]/g, '_'));
    if (!row) { applyFilters(); return; }
    const post = postsData.find(p => p.file === file);
    if (!post) return;
    const dirty = isRowDirty(file);

    // 更新行类名
    row.classList.toggle('dirty', dirty);
    row.classList.toggle('draft-row', post.draft);

    // 更新标签（找到 tags-area）
    const tagsArea = row.querySelector('.tags-area');
    if (tagsArea) {
      const tagsHtml = (post.tags || []).map(t =>
        '<span class="tp">' + escHtml(t) + '<span class="rm" data-action="remove-tag" data-file="' + escAttr(file) + '" data-tag="' + escAttr(t) + '">&times;</span></span>'
      ).join('');
      const addBtn = '<span class="add-tag" data-action="add-tag" data-file="' + escAttr(file) + '" title="添加标签">⊕</span>';
      tagsArea.innerHTML = tagsHtml + addBtn;
    }

    // 更新 cate select
    const catSel = row.querySelector('.cat-select');
    if (catSel) catSel.classList.toggle('modified', dirtyPosts[file] && dirtyPosts[file].category !== undefined);

    // 更新 saved indicator
    const saved = row.querySelector('.saved-indicator');
    if (saved) saved.innerHTML = dirty
      ? '<span style="color:#f59e0b;font-size:.72em">已修改</span>'
      : '<span style="color:var(--success);font-size:.72em">✓</span>';

    // 更新 actions
    const actions = row.querySelector('.actions');
    if (actions) {
      actions.innerHTML = dirty
        ? '<button class="btn btn-sm btn-primary" data-action="save" data-file="' + escAttr(file) + '">保存</button>' +
          '<button class="btn btn-sm btn-outline" data-action="revert" data-file="' + escAttr(file) + '">还原</button>'
        : '';
    }
  }

  function updateSaveAllBtn() {
    const btn = document.getElementById('save-all-btn');
    const hasDirty = Object.keys(dirtyPosts).some(f => isRowDirty(f));
    btn.style.display = hasDirty ? '' : 'none';
  }

  // ─── 标签操作 ──────────────────────────

  function getCurrentTags(file) {
    if (dirtyPosts[file] && dirtyPosts[file].tags !== undefined) return dirtyPosts[file].tags;
    const post = postsData.find(p => p.file === file);
    return post ? [...post.tags] : [];
  }

  function addTag(file, tag) {
    tag = tag.trim();
    if (!tag) return;
    const tags = getCurrentTags(file);
    if (tags.includes(tag)) return;
    tags.push(tag);
    markDirty(file, 'tags', tags);
  }

  function removeTag(file, tag) {
    let tags = getCurrentTags(file);
    tags = tags.filter(t => t !== tag);
    markDirty(file, 'tags', tags);
  }

  function showTagSuggest(file, el) {
    // 移除已有下拉
    document.querySelectorAll('.tag-suggest').forEach(s => s.remove());

    const suggest = document.createElement('div');
    suggest.className = 'tag-suggest show';
    suggest.style.position = 'absolute';
    suggest.style.top = '100%';
    suggest.style.left = '0';
    suggest.setAttribute('data-file', file);

    const currentTags = getCurrentTags(file);
    const available = Object.entries(allTagsObj)
      .filter(([t]) => !currentTags.includes(t))
      .sort((a, b) => b[1] - a[1]);

    let html = '<div class="new-tag-input"><input type="text" data-action="suggest-input" placeholder="输入新标签..."></div>';
    if (available.length) {
      html += available.map(([tag, count]) =>
        '<div class="item" data-action="suggest-add-tag" data-tag="' + escAttr(tag) + '">' +
        escHtml(tag) + '<span class="used">(' + count + '篇)</span></div>'
      ).join('');
    } else {
      html += '<div class="item" style="color:var(--muted)">（无建议标签）</div>';
    }
    suggest.innerHTML = html;

    el.style.position = 'relative';
    el.appendChild(suggest);

    // 事件：点击建议标签
    suggest.querySelectorAll('[data-action="suggest-add-tag"]').forEach(item => {
      item.addEventListener('click', function() {
        const t = this.getAttribute('data-tag');
        addTag(file, t);
        suggest.remove();
      });
    });

    // 事件：输入框回车
    const input = suggest.querySelector('[data-action="suggest-input"]');
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          const val = this.value.trim();
          if (val) { addTag(file, val); this.value = ''; }
          e.preventDefault();
        }
      });
      setTimeout(() => input.focus(), 50);
    }

    // 点击外部关闭
    setTimeout(() => {
      document.addEventListener('click', function closeSuggest(e) {
        if (!suggest.contains(e.target) && e.target !== el) {
          suggest.remove();
          document.removeEventListener('click', closeSuggest);
        }
      });
    }, 100);
  }

  // ─── 草稿切换 ──────────────────────────

  function toggleDraft(file) {
    const post = postsData.find(p => p.file === file);
    if (!post) return;
    const newVal = !post.draft;
    markDirty(file, 'draft', newVal);
  }

  // ─── 选择模式 ──────────────────────────

  function toggleSelectMode() {
    selectMode = !selectMode;
    const btn = document.getElementById('select-mode-btn');
    btn.classList.toggle('active', selectMode);
    if (!selectMode) clearSelection();
  }

  function toggleSelect(file, checked) {
    if (checked) selectedPosts.add(file);
    else selectedPosts.delete(file);
    // 更新行样式
    const row = document.getElementById('row-' + file.replace(/[^a-zA-Z0-9-_.]/g, '_'));
    if (row) row.classList.toggle('selected', checked);
    updateBatchBar();
  }

  function clearSelection() {
    selectedPosts.clear();
    document.querySelectorAll('.post-row.selected').forEach(r => r.classList.remove('selected'));
    document.querySelectorAll('.post-row .cb input').forEach(cb => cb.checked = false);
    updateBatchBar();
  }

  function updateBatchBar() {
    const bar = document.getElementById('batch-bar');
    const count = selectedPosts.size;
    document.getElementById('batch-count').textContent = count;
    bar.classList.toggle('hidden', count === 0);
  }

  async function applyBatch() {
    const files = Array.from(selectedPosts);
    if (!files.length) { showToast('未选择文章', 'error'); return; }

    const addTagsStr = document.getElementById('batch-add-tags').value.trim();
    const category = document.getElementById('batch-category').value;
    const draftVal = document.getElementById('batch-draft').value;

    if (!addTagsStr && !category && draftVal === '') {
      showToast('未设置任何批量操作', 'error');
      return;
    }

    const payload = { files };
    if (addTagsStr) {
      const addTags = addTagsStr.split(',').map(t => t.trim()).filter(Boolean);
      if (addTags.length) payload.addTags = addTags;
    }
    if (category) payload.category = category;
    if (draftVal !== '') payload.draft = draftVal === 'true';

    try {
      const res = await fetch('/api/save-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        showToast('已更新 ' + result.updated + ' 篇文章', 'success');
        // 重新加载以获取最新状态
        await loadPosts();
        // 重新勾选
        for (const f of files) selectedPosts.add(f);
        updateBatchBar();
        applyFilters();
      } else {
        showToast('批量保存失败: ' + (result.error || '未知错误'), 'error');
      }
    } catch (err) {
      showToast('请求失败: ' + err.message, 'error');
    }

    // 清空输入
    document.getElementById('batch-add-tags').value = '';
    document.getElementById('batch-category').value = '';
    document.getElementById('batch-draft').value = '';
  }

  function populateBatchCategory() {
    const sel = document.getElementById('batch-category');
    const catOption = sel.querySelector('option[value=""]');
    sel.innerHTML = catOption ? catOption.outerHTML : '<option value="">设分类...</option>';
    sel.innerHTML += allCategories.map(c => '<option value="' + escAttr(c) + '">' + escHtml(c) + '</option>').join('');
  }

  // ─── 保存/还原 ──────────────────────────

  async function saveOne(file) {
    const dirty = getDirtyFields(file);
    if (!dirty) { showToast('没有需要保存的修改', 'error'); return; }

    try {
      const res = await fetch('/api/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, ...dirty }),
      });
      const result = await res.json();
      if (result.success) {
        // 更新 originalData
        const post = postsData.find(p => p.file === file);
        if (post) {
          originalData[file] = {
            tags: [...post.tags],
            category: post.category,
            description: post.description,
            draft: post.draft,
          };
        }
        // 清除脏标记
        delete dirtyPosts[file];
        refreshRow(file);
        updateSaveAllBtn();
        // 更新标签云（可能有新标签）
        if (dirty.tags) {
          await reloadTags();
        }
        showToast('✓ ' + (post ? post.title : file) + ' 已保存', 'success');
      } else {
        showToast('保存失败: ' + (result.error || '未知错误'), 'error');
      }
    } catch (err) {
      showToast('请求失败: ' + err.message, 'error');
    }
  }

  function revertOne(file) {
    const post = postsData.find(p => p.file === file);
    if (!post) return;
    const orig = originalData[file];
    if (!orig) return;

    post.tags = [...orig.tags];
    post.category = orig.category;
    post.description = orig.description;
    post.draft = orig.draft;

    delete dirtyPosts[file];
    refreshRow(file);
    updateSaveAllBtn();
    showToast('已还原 ' + post.title, 'success');
  }

  async function saveAllDirty() {
    const dirtyFiles = Object.keys(dirtyPosts).filter(f => isRowDirty(f));
    if (!dirtyFiles.length) { showToast('没有需要保存的修改', 'error'); return; }

    let saved = 0, failed = 0;
    for (const file of dirtyFiles) {
      await saveOne(file);
      // saveOne 成功后已清除 dirtyPosts[file]
      if (!dirtyPosts[file]) saved++; else failed++;
    }
    showToast('保存完成: ' + saved + ' 成功' + (failed > 0 ? ', ' + failed + ' 失败' : ''), saved > 0 ? 'success' : 'error');
  }

  async function reloadTags() {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.stats) {
        allTagsObj = data.stats.allTags;
        allCategories = data.stats.allCategories;
        renderTagCloud();
        populateBatchCategory();
      }
    } catch {}
  }

  // ─── 预览 ──────────────────────────

  async function previewPost(file) {
    const post = postsData.find(p => p.file === file);
    if (!post) return;
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = '<span class="close-btn" onclick="closeModal()">✕</span>' +
      '<h3>' + escHtml(post.title) + '</h3>' +
      '<p style="color:var(--muted);font-size:.8em;margin-bottom:8px">' +
      escHtml(file) + ' · ' + escHtml(post.published) + ' · ' +
      (post.tags.length ? post.tags.map(t => escHtml(t)).join(', ') : '无标签') +
      ' · ' + escHtml(post.category || '无分类') +
      (post.draft ? ' · <span style="color:#f59e0b">草稿</span>' : '') +
      '</p>' +
      '<pre id="preview-content">加载中...</pre>';

    modal.classList.add('show');

    // 加载文件内容
    try {
      const res = await fetch('/api/preview?file=' + encodeURIComponent(file));
      const data = await res.json();
      if (data.content) {
        document.getElementById('preview-content').textContent = data.content.substring(0, 5000) + (data.content.length > 5000 ? '\\n\\n... (已截断)' : '');
      } else {
        document.getElementById('preview-content').textContent = '(无内容)';
      }
    } catch {
      document.getElementById('preview-content').textContent = '(加载失败)';
    }
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('show');
  }

  // ─── 心跳 / 退出 ──────────────────────────

  function sendHeartbeat() {
    fetch('/api/ping', { method: 'POST', cache: 'no-store', keepalive: true }).catch(() => {});
  }
  sendHeartbeat();
  setInterval(sendHeartbeat, 2000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sendHeartbeat();
  });

  async function shutdown() {
    if (!confirm('确定要退出标记工具？未保存的修改将丢失。')) return;
    try { await fetch('/api/shutdown', { method: 'POST' }); } catch {}
    window.close();
  }

  // ─── Toast ──────────────────────────

  function showToast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ─── 键盘快捷键 ──────────────────────────

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveAllDirty();
    }
    if (e.key === 'Escape') closeModal();
  });

  // 页面关闭前警告
  window.addEventListener('beforeunload', function(e) {
    if (Object.keys(dirtyPosts).some(f => isRowDirty(f))) {
      e.preventDefault();
      e.returnValue = '有未保存的修改，确定离开？';
      return e.returnValue;
    }
  });

  // 初始化加载
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
    // GET / — HTML 页面
    if (req.method === "GET" && path === "/") {
      markPageAlive();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(HTML_PAGE);
      return;
    }

    // GET|POST /api/ping — 心跳
    if ((req.method === "GET" || req.method === "POST") && path === "/api/ping") {
      markPageAlive();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // GET /api/posts — 文章列表
    if (req.method === "GET" && path === "/api/posts") {
      markPageAlive();
      const result = scanPostsDir();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    // GET /api/preview?file=... — 文章正文预览
    if (req.method === "GET" && path === "/api/preview") {
      markPageAlive();
      const file = url.searchParams.get("file");
      if (!file) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "缺少 file 参数" }));
        return;
      }
      // 安全检查：防止目录遍历
      const resolved = resolve(POSTS_DIR, file);
      if (!resolved.startsWith(resolve(POSTS_DIR))) {
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "禁止访问" }));
        return;
      }
      if (!existsSync(resolved)) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "文件不存在" }));
        return;
      }
      const content = readUtf8(resolved);
      // 去掉 frontmatter 只返回正文
      const parsed = parseFrontmatter(content);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ content: parsed ? parsed.body : content }));
      return;
    }

    // POST /api/save — 保存单篇文章
    if (req.method === "POST" && path === "/api/save") {
      const body = await parseJsonBody(req);
      const file = body.file;
      if (!file) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "缺少 file 参数" }));
        return;
      }

      // 安全检查
      const resolved = resolve(POSTS_DIR, file);
      if (!resolved.startsWith(resolve(POSTS_DIR))) {
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "禁止访问" }));
        return;
      }
      if (!existsSync(resolved)) {
        res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "文件不存在: " + file }));
        return;
      }

      // 重新读取文件（防止并发编辑冲突）
      const content = readUtf8(resolved);

      // 构建更新对象
      const updates = {};
      if (body.tags !== undefined) updates.tags = body.tags;
      if (body.category !== undefined) updates.category = body.category;
      if (body.description !== undefined) updates.description = body.description;
      if (body.draft !== undefined) updates.draft = body.draft;
      if (body.lang !== undefined) updates.lang = body.lang;

      const newContent = updateFrontmatter(content, updates);
      writeFileSync(resolved, newContent, "utf-8");
      console.log(`[标记工具] 已保存: ${file}`);

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, file }));
      return;
    }

    // POST /api/save-batch — 批量保存
    if (req.method === "POST" && path === "/api/save-batch") {
      const body = await parseJsonBody(req);
      const files = body.files;
      if (!files || !Array.isArray(files) || !files.length) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: "缺少 files 参数" }));
        return;
      }

      let updated = 0;
      const errors = [];
      const baseDir = resolve(POSTS_DIR);

      for (const file of files) {
        const resolved = resolve(POSTS_DIR, file);
        if (!resolved.startsWith(baseDir)) {
          errors.push(`${file}: 禁止访问`);
          continue;
        }
        if (!existsSync(resolved)) {
          errors.push(`${file}: 文件不存在`);
          continue;
        }

        try {
          const content = readUtf8(resolved);
          const updates = {};
          // 添加标签（追加到现有）
          if (body.addTags && Array.isArray(body.addTags)) {
            const parsed = parseFrontmatter(content);
            const existing = (parsed && Array.isArray(parsed.frontmatter.tags)) ? parsed.frontmatter.tags : [];
            const merged = [...new Set([...existing, ...body.addTags])];
            updates.tags = merged;
          }
          if (body.category) updates.category = body.category;
          if (body.description !== undefined) updates.description = body.description;
          if (body.draft !== undefined) updates.draft = body.draft;

          const newContent = updateFrontmatter(content, updates);
          writeFileSync(resolved, newContent, "utf-8");
          updated++;
          console.log(`[标记工具] 批量保存: ${file}`);
        } catch (err) {
          errors.push(`${file}: ${err.message}`);
        }
      }

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, updated, errors: errors.length ? errors : undefined }));
      return;
    }

    // POST /api/shutdown — 停止服务
    if (req.method === "POST" && path === "/api/shutdown") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, message: "服务已停止" }));
      shutdownServer("收到页面关闭请求");
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
  🏷️  博客文章标记工具
  文章目录: ${POSTS_DIR}
  🌐  http://localhost:${PORT}
  `);
});
