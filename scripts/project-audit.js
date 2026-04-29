const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://ko-workspace.com";
const REQUIRED_TOOL_PAGE_IDS = [
  "heroEyebrow",
  "pageTitle",
  "pageDescription",
  "toolSearch",
  "categoryFilters",
  "toolList",
  "toolOverview",
  "toolWorkspace",
  "toolGuideList",
  "helpBtn",
  "helpDialog",
  "helpCloseBtn",
  "selectionCopyBtn",
];

function main() {
  const problems = [
    ...auditAssetVersion(),
    ...auditToolPages(),
    ...auditCategoryPages(),
    ...auditLibraryCsp(),
    ...auditSupportContact(),
  ];

  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }

  console.log("project audit passed");
}

function auditAssetVersion() {
  const problems = [];
  const versions = new Map();

  for (const file of collectFiles([".html", ".webmanifest"])) {
    const relative = toRelative(file);
    const text = read(file);
    for (const match of text.matchAll(/\/(?:app\.js|styles\.css|favicon\.svg|site\.webmanifest)\?v=([0-9]{8}-[0-9]+)/g)) {
      addVersion(versions, match[1], relative);
    }
  }

  if (versions.size !== 1) {
    problems.push(`asset version mismatch: ${[...versions].map(([version, files]) => `${version} (${files.size} files)`).join(", ")}`);
  }

  const [version] = versions.keys();
  const spec = read(path.join(ROOT, "PROJECT_SPEC.md"));
  if (version && !spec.includes(`Current static asset cache version: \`${version}\``)) {
    problems.push(`PROJECT_SPEC.md: current cache version does not match ${version}`);
  }

  return problems;
}

function addVersion(map, version, file) {
  if (!map.has(version)) map.set(version, new Set());
  map.get(version).add(file);
}

function auditToolPages() {
  const problems = [];
  const app = read(path.join(ROOT, "app.js"));
  const tools = parseRegistry(app, "TOOL_DEFS");
  const sitemap = read(path.join(ROOT, "sitemap.xml"));
  const home = read(path.join(ROOT, "index.html"));
  const rendererIds = parseObjectKeys(app, "TOOL_RENDERERS");
  const visualIds = parseObjectKeys(app, "TOOL_VISUALS");
  const exampleIds = parseObjectKeys(app, "TOOL_USE_EXAMPLES");
  const faqIds = parseObjectKeys(app, "TOOL_EXTRA_FAQS");

  problems.push(...findDuplicateIds(tools, "TOOL_DEFS"));

  for (const tool of tools) {
    if (!tool.path.startsWith("/tools/") || !tool.path.endsWith("/")) {
      problems.push(`app.js: ${tool.id} has invalid path ${tool.path}`);
      continue;
    }

    const pagePath = path.join(ROOT, tool.path, "index.html");
    if (!fs.existsSync(pagePath)) {
      problems.push(`${tool.id}: missing ${toRelative(pagePath)}`);
      continue;
    }

    const html = read(pagePath);
    const relative = toRelative(pagePath);
    const url = `${ORIGIN}${tool.path}`;

    if (!html.includes(`data-tool="${tool.id}"`)) problems.push(`${relative}: missing data-tool="${tool.id}"`);
    if (!html.includes(`<link rel="canonical" href="${url}"`)) problems.push(`${relative}: missing canonical ${url}`);
    for (const id of REQUIRED_TOOL_PAGE_IDS) {
      if (!html.includes(`id="${id}"`)) problems.push(`${relative}: missing #${id}`);
    }
    if (!sitemap.includes(`<loc>${url}</loc>`)) problems.push(`sitemap.xml: missing ${url}`);
    if (!home.includes(`"${url}"`) && !home.includes(`href="${tool.path}"`) && !home.includes(tool.path)) {
      problems.push(`index.html: missing ${tool.path}`);
    }
    if (!rendererIds.has(tool.id)) problems.push(`app.js: missing TOOL_RENDERERS entry for ${tool.id}`);
    if (!visualIds.has(tool.id)) problems.push(`app.js: missing TOOL_VISUALS entry for ${tool.id}`);
    if (!exampleIds.has(tool.id)) problems.push(`app.js: missing TOOL_USE_EXAMPLES entry for ${tool.id}`);
    if (!faqIds.has(tool.id)) problems.push(`app.js: missing TOOL_EXTRA_FAQS entry for ${tool.id}`);
  }

  return problems;
}

function auditCategoryPages() {
  const problems = [];
  const app = read(path.join(ROOT, "app.js"));
  const pages = parseRegistry(app, "CATEGORY_PAGE_DEFS");
  const sitemap = read(path.join(ROOT, "sitemap.xml"));

  problems.push(...findDuplicateIds(pages, "CATEGORY_PAGE_DEFS"));

  for (const page of pages) {
    const pagePath = path.join(ROOT, page.path, "index.html");
    const url = `${ORIGIN}${page.path}`;
    if (!fs.existsSync(pagePath)) {
      problems.push(`${page.id}: missing ${toRelative(pagePath)}`);
      continue;
    }

    const html = read(pagePath);
    const relative = toRelative(pagePath);
    if (!html.includes(`data-category-page="${page.id}"`)) problems.push(`${relative}: missing data-category-page="${page.id}"`);
    if (!html.includes(`<link rel="canonical" href="${url}"`)) problems.push(`${relative}: missing canonical ${url}`);
    if (!sitemap.includes(`<loc>${url}</loc>`)) problems.push(`sitemap.xml: missing ${url}`);
  }

  return problems;
}

function auditLibraryCsp() {
  const app = read(path.join(ROOT, "app.js"));
  const headers = read(path.join(ROOT, "_headers"));
  const libraries = parseLibraries(app);
  const problems = [];

  for (const src of libraries) {
    const origin = new URL(src).origin;
    if (!headers.includes(origin)) {
      problems.push(`_headers: CSP does not allow ${origin}`);
    }
  }

  return problems;
}

function auditSupportContact() {
  const problems = [];
  const app = read(path.join(ROOT, "app.js"));
  const playbook = read(path.join(ROOT, "CHANGE_PLAYBOOK.md"));

  if (!app.includes("dayway.ict@gmail.com")) {
    problems.push("app.js: missing user-facing support email");
  }

  if (!app.includes("SUPPORT_ERROR_PATTERNS") || !app.includes("formatUserNotice")) {
    problems.push("app.js: missing support contact error notice helpers");
  }

  if (!playbook.includes("dayway.ict@gmail.com")) {
    problems.push("CHANGE_PLAYBOOK.md: missing support email guidance");
  }

  return problems;
}

function parseRegistry(app, name) {
  const startToken = `const ${name} = [`;
  const start = app.indexOf(startToken);
  if (start === -1) return [];

  const arrayStart = app.indexOf("[", start);
  const arrayEnd = findMatchingBracket(app, arrayStart, "[", "]");
  const body = app.slice(arrayStart + 1, arrayEnd);
  const entries = [];

  for (const objectText of splitTopLevelObjects(body)) {
    const id = readStringProperty(objectText, "id");
    const toolPath = readStringProperty(objectText, "path");
    const title = readStringProperty(objectText, "title");
    if (id && toolPath) entries.push({ id, path: toolPath, title });
  }

  return entries;
}

function parseLibraries(app) {
  const startToken = "const LIBRARIES = {";
  const start = app.indexOf(startToken);
  if (start === -1) return [];

  const objectStart = app.indexOf("{", start);
  const objectEnd = findMatchingBracket(app, objectStart, "{", "}");
  const body = app.slice(objectStart + 1, objectEnd);
  return [...body.matchAll(/src:\s*"([^"]+)"/g)].map((match) => match[1]).filter((src) => src.startsWith("https://"));
}

function parseObjectKeys(app, name) {
  const startToken = `const ${name} = {`;
  const start = app.indexOf(startToken);
  if (start === -1) return new Set();

  const objectStart = app.indexOf("{", start);
  const objectEnd = findMatchingBracket(app, objectStart, "{", "}");
  const body = app.slice(objectStart + 1, objectEnd);
  return new Set([...body.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]));
}

function splitTopLevelObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let quote = "";
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quote) {
      escaped = char === "\\" && !escaped;
      if (char === quote && !escaped) quote = "";
      if (char !== "\\") escaped = false;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function findMatchingBracket(text, start, open, close) {
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (quote) {
      escaped = char === "\\" && !escaped;
      if (char === quote && !escaped) quote = "";
      if (char !== "\\") escaped = false;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error(`No matching ${close} found`);
}

function readStringProperty(text, property) {
  const match = new RegExp(`${property}:\\s*"([^"]+)"`).exec(text);
  return match?.[1] || "";
}

function findDuplicateIds(entries, label) {
  const seen = new Set();
  const problems = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) problems.push(`app.js: duplicate ${label} id ${entry.id}`);
    seen.add(entry.id);
  }
  return problems;
}

function collectFiles(extensions) {
  const files = [];
  walk(ROOT, (file) => {
    if (extensions.includes(path.extname(file)) && !isIgnoredCopy(file)) files.push(file);
  });
  return files;
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", ".browser-profile", ".cloudflare-dist", ".cloudflare-dist-smoke", ".wrangler", "node_modules"].includes(entry.name)) {
        continue;
      }
      walk(fullPath, onFile);
    } else {
      onFile(fullPath);
    }
  }
}

function isIgnoredCopy(file) {
  return /\s\(\d+\)\.[^.]+$/i.test(path.basename(file));
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function toRelative(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

main();
