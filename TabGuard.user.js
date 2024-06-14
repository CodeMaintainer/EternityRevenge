// ==UserScript==
// @name         TabGuard
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Isolation for Every Tab, Privacy at Every Click: Isolate cookies, localStorage, and IndexedDB per browser tab to enhance privacy and prevent tracking.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Prefix to isolate by tab
    const tabPrefix = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Override localStorage
    const originalLocalStorage = window.localStorage;
    const localStorageProxy = new Proxy(originalLocalStorage, {
        get(target, prop) {
            return target.getItem(`${tabPrefix}-${prop}`);
        },
        set(target, prop, value) {
            target.setItem(`${tabPrefix}-${prop}`, value);
            return true;
        },
        deleteProperty(target, prop) {
            target.removeItem(`${tabPrefix}-${prop}`);
            return true;
        },
        has(target, prop) {
            return target.getItem(`${tabPrefix}-${prop}`) !== null;
        }
    });
    Object.defineProperty(window, 'localStorage', {
        value: localStorageProxy,
        configurable: false,
        enumerable: false,
        writable: false
    });

    // Override IndexedDB
    const openDb = indexedDB.open;
    indexedDB.open = function(name, version) {
        arguments[0] = `${tabPrefix}-${name}`;
        return openDb.apply(this, arguments);
    };

    // Clear cookies
    document.cookie.split(';').forEach(function(c) {
        document.cookie = c.trim().split('=')[0] + '=;expires=' + new Date(0).toUTCString();
    });

    // Monitor changes to cookies and isolate
    const cookieProxy = {
        get: function(target, prop) {
            return target.getItem(`${tabPrefix}-${prop}`);
        },
        set: function(target, prop, value) {
            target.setItem(`${tabPrefix}-${prop}`, value);
            return true;
        }
    };

    const originalDocumentCookie = document.cookie;

    Object.defineProperty(document, 'cookie', {
        get: function() {
            return originalDocumentCookie.split(';').filter(cookie => cookie.startsWith(`${tabPrefix}-`)).join(';');
        },
        set: function(value) {
            const cookieName = value.split('=')[0];   
            originalLocalStorage.setItem(`${tabPrefix}-${cookieName}`, value);
            originalDocumentCookie = `${tabPrefix}-${value}`;
        },
        configurable: true
    });

})();
