# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Mozilla Thunderbird MailExtension (Manifest V2, `strict_min_version` 78.0) that adds a message-display-action button showing extra info for emails forwarded by SimpleLogin. Plain JS/HTML/CSS with no build tooling, dependencies, linter, or tests. Published at https://addons.thunderbird.net/en-US/thunderbird/addon/additional-info-simplelogin/.

## Build

The extension root is `source/`, not the repo root. Package it with:

```bash
cd source
zip -r ../additional-info-for-simplelogin.xpi *
```

For local testing, load `source/manifest.json` as a temporary add-on in Thunderbird (Tools → Developer Tools → Debug Add-ons). Bump `version` in `source/manifest.json` for each release.

## Architecture

There are two independent scripts. Both use the `messenger.*` API and the `messagesRead` permission.

- `source/background.js` listens for `messageDisplay.onMessageDisplayed` and enables or disables the toolbar button based on whether the message is a SimpleLogin forward.
- `source/messagePopup/popup.js` runs when the button is clicked. It gets the displayed message for the active tab and reads its headers. It fills the `<dl>` in `popup.html` or adds the `not-forwarded` class to `<body>` (and `popup.css` toggles which block is shown).

Both scripts use the same check to detect a forward: `x-simplelogin-type` equals `"Forward"`. It is duplicated, so keep the two copies in sync. The popup reads these headers:
- `x-simplelogin-envelope-from` → original sender. This header only exists if the user enabled "Include original sender in email headers" in SimpleLogin, so it falls back to `"unknown"`.
- `x-simplelogin-envelope-to` → alias
- `delivered-to` → final mailbox
- `x-simplelogin-unsub-behaviour` → decides what `list-unsubscribe` means. With `original-behaviour` it is the sender's own header (often absent). Otherwise (`alias-disable`, or older mails without the header) it is SimpleLogin's mailto link that disables the alias, and the sender's header is moved to `x-simplelogin-original-list-unsubscribe`.
- The popup shows up to two links, "Disable this alias" and "Unsubscribe from the sender's list", and each one only appears when its URL is available.

`github/` holds the README screenshots only.

Mozilla's automatic add-on review has flagged things before (see the commit history). Avoid leftover `console.log` calls and unsafe DOM APIs like `innerHTML`, and use `textContent` instead.
