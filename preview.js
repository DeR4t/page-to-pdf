const saveButton = document.getElementById("save");
const status = document.getElementById("status");

const allowedTags = new Set(
  ("a abbr b blockquote br caption cite code dd del div dl dt em figcaption figure " +
   "h1 h2 h3 h4 h5 h6 hr i img kbd li mark ol p pre q s samp section small span " +
   "strong sub sup table tbody td tfoot th thead tr u ul var").split(" ")
);
const droppedTags = new Set(
  "aside audio button embed form iframe input noscript object script select style template textarea video"
    .split(" ")
);
const httpProtocols = ["http:", "https:"];
const inlineImage = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z\d+/=]+$/i;

function webUrl(value, base) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value, base);
    return httpProtocols.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function copyContent(source, target, baseUrl) {
  for (const child of source.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.append(document.createTextNode(child.textContent));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE || child.namespaceURI !== "http://www.w3.org/1999/xhtml") {
      continue;
    }

    const tag = child.localName;
    if (droppedTags.has(tag) || child.hidden || child.getAttribute("aria-hidden") === "true") {
      continue;
    }
    if (!allowedTags.has(tag)) {
      copyContent(child, target, baseUrl);
      continue;
    }

    const element = document.createElement(tag);
    if (tag === "a") {
      const href = webUrl(child.getAttribute("href"), baseUrl);
      if (href) element.href = href;
    }
    if (tag === "img") {
      const src = child.getAttribute("src")?.trim();
      const safeSrc = inlineImage.test(src ?? "") ? src : webUrl(src, baseUrl);
      const alt = child.getAttribute("alt") ?? "";
      if (!safeSrc) {
        if (alt) target.append(document.createTextNode(alt));
        continue;
      }
      element.alt = alt;
      element.referrerPolicy = "no-referrer";
      element.addEventListener("error", () => element.replaceWith(document.createTextNode(alt)));
      element.src = safeSrc;
    }
    if (tag === "td" || tag === "th") {
      element.colSpan = Math.min(child.colSpan, 100);
      element.rowSpan = Math.min(child.rowSpan, 1000);
    }
    if (tag === "ol" && child.hasAttribute("start")) element.start = child.start;
    if (tag === "ol") element.reversed = child.reversed;
    if (tag === "li" && child.hasAttribute("value")) element.value = child.value;

    copyContent(child, element, baseUrl);
    target.append(element);
  }
}

function removeDuplicateTitle(content, title) {
  const firstHeading = content.querySelector("h1, h2");
  const normalize = (text) => text.trim().replace(/\s+/g, " ");
  if (firstHeading && normalize(firstHeading.textContent) === normalize(title)) {
    firstHeading.remove();
  }
}

async function loadPreview() {
  const tabId = new URLSearchParams(location.search).get("tab");
  if (!/^\d+$/.test(tabId ?? "")) {
    status.textContent = "Open a regular web page, then click the Page to PDF extension.";
    return;
  }

  let page;
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: Number(tabId) },
      files: ["vendor/Readability.js", "extract.js"]
    });
    page = injection?.result;
  } catch {
    status.textContent = "This tab is unavailable or the browser blocks extensions on this page.";
    return;
  }

  const content = document.getElementById("content");
  if (page?.html) {
    // Parse in an inert template. Rebuild the output using only the tags and
    // attributes above, so page scripts, styles and event handlers stay inert.
    const template = document.createElement("template");
    template.innerHTML = page.html;
    copyContent(template.content, content, page.baseUrl);
  }
  if (!content.textContent.trim() && !content.querySelector("img")) {
    status.textContent = "No readable content was found. Let the original page finish loading and try again.";
    return;
  }

  removeDuplicateTitle(content, page.title);
  const paper = document.getElementById("paper");
  if (page.lang) paper.lang = page.lang;
  paper.dir = ["ltr", "rtl"].includes(page.dir) ? page.dir : "auto";
  document.title = page.title;
  document.getElementById("title").textContent = page.title;
  const source = document.getElementById("source");
  source.href = webUrl(page.url) ?? "";
  source.textContent = page.url;
  if (page.byline) {
    const byline = document.getElementById("byline");
    byline.textContent = page.byline;
    byline.hidden = false;
  }

  status.hidden = true;
  paper.hidden = false;
  const images = Array.from(content.querySelectorAll("img"));
  let timer;
  await Promise.race([
    Promise.allSettled(images.map((image) => image.decode())),
    new Promise((resolve) => { timer = setTimeout(resolve, 4000); })
  ]);
  clearTimeout(timer);
  saveButton.disabled = false;
}

saveButton.addEventListener("click", () => window.print());
loadPreview().catch(() => {
  status.hidden = false;
  status.textContent = "The page could not be prepared. Try exporting it again from the original tab.";
});
