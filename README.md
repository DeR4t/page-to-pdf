# Page to PDF

Page to PDF is a local Chrome and Edge extension that extracts the main content of a web page into a print-ready preview. The PDF preserves selectable text, links, headings, lists, tables, code blocks, and images the preview can load.

## Install

1. Extract the ZIP. You can skip this step if you already have the `Page to PDF` folder.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Turn on **Developer mode** and choose **Load unpacked**.
4. Select the `Page to PDF` folder containing `manifest.json`.

## Use

1. Open a web page and let its content load.
2. Click **Page to PDF** in the browser's Extensions menu or toolbar.
3. Review the new preview tab and click **Save as PDF**.
4. Choose **Save as PDF** as the print destination and save the file. For a cleaner PDF, turn off **Headers and footers** in the print dialog.

The layout is simplified for reading. The extension works with HTML already loaded in the main page. Browser settings pages, embedded frames, and content that has yet to load are outside its scope. Images can fail to load if the original site requires a session or restricts image requests.

Page content is processed in the browser without an upload service. The preview may request images from their original URLs. The extension uses temporary access to the active tab after you click its action.

Main content is identified with [Mozilla Readability 0.6.0](https://github.com/mozilla/readability/releases/tag/0.6.0), bundled under the Apache 2.0 license in `vendor/LICENSE.md`.
