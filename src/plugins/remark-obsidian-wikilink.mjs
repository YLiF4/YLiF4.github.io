import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visit } from "unist-util-visit";

const POSTS_DIR = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../content/posts",
);

const IGNORE_DIR_PREFIX = ".";
const IMAGE_EXTS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".svg",
	".bmp",
	".ico",
	".apng",
]);
const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}-/;
/** Matches `[[target]]`, `[[target|alias]]`, `[[target#heading]]`, `![[img.png]]`, etc. */
const WIKI_LINK_RE =
	/(!)?\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([^\]]+))?\]\]/g;

/**
 * @param {string} value
 */
function normalizeKey(value) {
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Approximate rehype-slug / github-slugger for heading anchors.
 * @param {string} text
 */
function slugifyHeading(text) {
	return text
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\p{L}\p{N}\p{M}-]+/gu, "");
}

/**
 * @param {string} content
 * @returns {string | null}
 */
function extractTitle(content) {
	const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!fm) return null;
	const titleLine = fm[1].match(/^title:\s*(.*)$/m);
	if (!titleLine) return null;
	let title = titleLine[1].trim();
	if (
		(title.startsWith('"') && title.endsWith('"')) ||
		(title.startsWith("'") && title.endsWith("'"))
	) {
		title = title.slice(1, -1);
	}
	return title || null;
}

/**
 * @param {string} dir
 * @param {(fullPath: string) => void} onFile
 */
function walkFiles(dir, onFile) {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry.name.startsWith(IGNORE_DIR_PREFIX)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(full, onFile);
		} else {
			onFile(full);
		}
	}
}

/**
 * @returns {{
 *   posts: Map<string, { slug: string, title: string }>,
 *   images: Map<string, string>,
 * }}
 */
function buildIndexes() {
	/** @type {Map<string, { slug: string, title: string }>} */
	const posts = new Map();
	/** @type {Map<string, string>} */
	const images = new Map();

	walkFiles(POSTS_DIR, (fullPath) => {
		const ext = path.extname(fullPath).toLowerCase();
		const rel = path.relative(POSTS_DIR, fullPath).replace(/\\/g, "/");

		if (IMAGE_EXTS.has(ext)) {
			const base = path.basename(fullPath).toLowerCase();
			if (!images.has(base)) images.set(base, fullPath);
			images.set(rel.toLowerCase(), fullPath);
			return;
		}

		if (ext !== ".md" && ext !== ".mdx") return;

		const slug = rel.replace(/\.(md|mdx)$/i, "");
		const stem = path.posix.basename(slug);
		let title = stem;
		try {
			title = extractTitle(fs.readFileSync(fullPath, "utf-8")) || stem;
		} catch {
			/* ignore unreadable files */
		}

		const entry = { slug, title };
		const keys = [
			stem,
			stem.replace(DATE_PREFIX_RE, ""),
			title,
			slug,
			path.posix.basename(slug).replace(DATE_PREFIX_RE, ""),
		];
		for (const key of keys) {
			const normalized = normalizeKey(key);
			if (normalized && !posts.has(normalized)) {
				posts.set(normalized, entry);
			}
		}
	});

	return { posts, images };
}

const indexes = buildIndexes();

/**
 * @param {string} target
 */
function resolvePost(target) {
	const cleaned = target
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\.\//, "")
		.replace(/\.(md|mdx)$/i, "");
	if (!cleaned) return null;

	const candidates = [
		cleaned,
		path.posix.basename(cleaned),
		path.posix.basename(cleaned).replace(DATE_PREFIX_RE, ""),
		cleaned.replace(DATE_PREFIX_RE, ""),
	];

	for (const candidate of candidates) {
		const hit = indexes.posts.get(normalizeKey(candidate));
		if (hit) return hit;
	}
	return null;
}

/**
 * @param {string} target
 * @param {string | undefined} fromFile
 */
function resolveImage(target, fromFile) {
	const cleaned = target.trim().replace(/\\/g, "/").replace(/^\.\//, "");
	if (!cleaned) return null;

	const ext = path.extname(cleaned).toLowerCase();
	if (!IMAGE_EXTS.has(ext)) return null;

	const byRel = indexes.images.get(cleaned.toLowerCase());
	const byBase = indexes.images.get(path.posix.basename(cleaned).toLowerCase());
	const abs = byRel || byBase;
	if (!abs) return null;

	if (fromFile) {
		const rel = path.relative(path.dirname(fromFile), abs).replace(/\\/g, "/");
		return rel.startsWith(".") ? rel : `./${rel}`;
	}
	return path.relative(POSTS_DIR, abs).replace(/\\/g, "/");
}

/**
 * @param {string} href
 * @param {string} text
 * @param {boolean} broken
 */
function makeLinkNode(href, text, broken) {
	if (broken) {
		return {
			type: "html",
			value: `<span class="wiki-link wiki-link-broken" title="Unresolved wiki link">${escapeHtml(text)}</span>`,
		};
	}
	return {
		type: "link",
		url: href,
		data: {
			hProperties: {
				className: ["wiki-link"],
			},
		},
		children: [{ type: "text", value: text }],
	};
}

/**
 * @param {string} text
 */
function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * @param {string} url
 * @param {string} alt
 */
function makeImageNode(url, alt) {
	return {
		type: "image",
		url,
		alt,
		title: null,
	};
}

/**
 * Remark plugin: turn Obsidian `[[wikilinks]]` into internal links / images.
 */
export function remarkObsidianWikilink() {
	return (tree, file) => {
		const fromFile = file.path || file.history?.[0];

		visit(tree, "text", (node, index, parent) => {
			if (!parent || typeof index !== "number") return;
			if (parent.type === "link" || parent.type === "linkReference") return;
			if (!node.value.includes("[[")) return;

			/** @type {import('mdast').Nodes[]} */
			const nodes = [];
			let lastIndex = 0;
			WIKI_LINK_RE.lastIndex = 0;

			let match = WIKI_LINK_RE.exec(node.value);
			while (match) {
				const [full, embedFlag, rawTarget = "", heading = "", alias = ""] =
					match;
				const start = match.index;

				if (start > lastIndex) {
					nodes.push({
						type: "text",
						value: node.value.slice(lastIndex, start),
					});
				}

				const isEmbed = Boolean(embedFlag);
				const target = rawTarget.trim();
				const headingText = heading.trim();
				const aliasText = alias.trim();

				if (isEmbed) {
					const imageUrl = resolveImage(target, fromFile);
					if (imageUrl) {
						nodes.push(
							makeImageNode(imageUrl, aliasText || path.posix.basename(target)),
						);
					} else {
						const label = aliasText || target || full;
						console.warn(
							`[remark-obsidian-wikilink] unresolved embed: ${full}`,
						);
						nodes.push(makeLinkNode("", label, true));
					}
				} else if (!target && headingText) {
					const href = `#${slugifyHeading(headingText)}`;
					const text = aliasText || headingText;
					nodes.push(makeLinkNode(href, text, false));
				} else {
					const post = resolvePost(target);
					const text =
						aliasText || (post ? post.title : target) || headingText || full;

					if (!post) {
						console.warn(
							`[remark-obsidian-wikilink] unresolved link: ${full}`,
						);
						nodes.push(makeLinkNode("", text, true));
					} else {
						let href = `/posts/${post.slug}/`;
						if (headingText) {
							href += `#${slugifyHeading(headingText)}`;
						}
						nodes.push(makeLinkNode(href, text, false));
					}
				}

				lastIndex = start + full.length;
				match = WIKI_LINK_RE.exec(node.value);
			}

			if (nodes.length === 0) return;

			if (lastIndex < node.value.length) {
				nodes.push({ type: "text", value: node.value.slice(lastIndex) });
			}

			parent.children.splice(index, 1, ...nodes);
			return index + nodes.length;
		});
	};
}
