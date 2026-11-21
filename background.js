chrome.action.onClicked.addListener(async (tab) => {
  const preview = new URL(chrome.runtime.getURL("preview.html"));
  if (tab.id !== undefined && /^https?:\/\//i.test(tab.url ?? "")) {
    preview.searchParams.set("tab", tab.id);
  }
  await chrome.tabs.create({ url: preview.href });
});
