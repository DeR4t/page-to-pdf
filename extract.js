(() => {
  const copy = document.cloneNode(true);
  const images = document.images;
  for (const [index, image] of Array.from(copy.images).entries()) {
    const source = images[index].currentSrc;
    if (/^https?:\/\//i.test(source)) {
      image.src = source;
      image.removeAttribute("srcset");
    }
  }

  for (const element of copy.querySelectorAll(
    "nav, footer, [role='navigation'], [role='banner'], [role='contentinfo'], " +
    "[hidden], [aria-hidden='true'], [inert], dialog, [role='dialog'], form"
  )) {
    element.remove();
  }
  for (const element of copy.querySelectorAll("[style]")) {
    if (element.style?.display === "none" || element.style?.visibility === "hidden") {
      element.remove();
    }
  }

  // Keep a copy of the semantic content in case Readability finds no article.
  const articles = copy.querySelectorAll("article");
  const semanticRoot = copy.querySelector("main, [role='main']")
    ?? (articles.length === 1 ? articles[0] : null);
  const fallback = semanticRoot ?? copy.body;
  const fallbackHtml = fallback?.innerHTML ?? "";
  const fallbackTitle = fallback?.querySelector("h1")?.textContent.trim();
  const article = new Readability(copy).parse();
  // Short pages benefit more from explicit landmarks than article scoring.
  const useArticle = article && (!semanticRoot || article.length >= 500);

  return {
    url: location.href,
    baseUrl: document.baseURI,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: (useArticle && article.title) || fallbackTitle || document.title || "Web page",
    byline: useArticle ? article.byline : null,
    html: useArticle ? article.content : fallbackHtml
  };
})();
