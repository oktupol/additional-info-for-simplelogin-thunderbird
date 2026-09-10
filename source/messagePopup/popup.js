function firstHeader(headers, name) {
  return headers.hasOwnProperty(name) ? headers[name][0] : null;
}

// Picks one URL out of a List-Unsubscribe header value like "<mailto:...>, <https://...>".
// Web links are preferred over mailto links, anything else is ignored.
function parseListUnsubscribe(value) {
  if (!value) {
    return null;
  }
  let urls = (value.match(/<[^>]*>/g) || []).map(url => url.slice(1, -1).trim());
  return urls.find(url => /^https?:/i.test(url)) || urls.find(url => /^mailto:/i.test(url)) || null;
}

function showLink(selector, href) {
  let link = document.querySelector(selector);
  link.href = href;
  link.hidden = false;

  if (/^https?:/i.test(href) && messenger.windows.openDefaultBrowser) {
    link.addEventListener("click", event => {
      event.preventDefault();
      messenger.windows.openDefaultBrowser(href);
    });
  }
}

(async () => {
  let tabs = await messenger.tabs.query({ active: true, currentWindow: true });

  let message = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);
  let full = await messenger.messages.getFull(message.id);

  if (!full.headers.hasOwnProperty("x-simplelogin-type") || full.headers["x-simplelogin-type"][0] !== "Forward") {
    document.querySelector("body").classList.add("not-forwarded");
  } else {
    let from = full.headers.hasOwnProperty("x-simplelogin-envelope-from") ? full.headers["x-simplelogin-envelope-from"][0] : "unknown";
    let to = full.headers["x-simplelogin-envelope-to"][0];
    let deliveredTo = full.headers["delivered-to"][0];

    document.querySelector("#from").textContent = from;
    document.querySelector("#to").textContent = to;
    document.querySelector("#deliveredTo").textContent = deliveredTo;

    // With "alias-disable" (and on older mails without this header), SimpleLogin replaces
    // List-Unsubscribe with its own link and moves the sender's one to X-Simplelogin-Original-List-Unsubscribe.
    // With "original-behaviour", List-Unsubscribe is the sender's own header, if there was one.
    let listUnsubscribe = firstHeader(full.headers, "list-unsubscribe");
    let disableHref = null;
    let originalHref = null;
    if (firstHeader(full.headers, "x-simplelogin-unsub-behaviour") === "original-behaviour") {
      originalHref = parseListUnsubscribe(listUnsubscribe);
    } else {
      disableHref = parseListUnsubscribe(listUnsubscribe);
      originalHref = parseListUnsubscribe(firstHeader(full.headers, "x-simplelogin-original-list-unsubscribe"));
    }

    if (disableHref) {
      if (/^mailto:/i.test(disableHref)) {
        disableHref += (disableHref.includes("?") ? "&" : "?") + "body=" + encodeURIComponent("Send this e-mail to disable the alias <" + to + ">");
      }
      showLink("#disableAlias", disableHref);
    }
    if (originalHref) {
      showLink("#unsubscribe", originalHref);
    }
  }
})();
