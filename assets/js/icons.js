/* ==========================================================================
   FleetSquad — Inline SVG icon registry
   Stroke-based 24x24 icons so a single `currentColor` drives every instance.
   Usage:  element.innerHTML = FS.icon('truck', 'kpi-svg')
   ========================================================================== */

(function (window) {
  'use strict';

  var FS = window.FS = window.FS || {};

  /* Each entry is the *inner* markup of a 24x24 viewBox. Icons that need a
     solid fill instead of a stroke are listed in SOLID below. */
  var PATHS = {
    /* --- navigation / chrome ------------------------------------------- */
    'chevron-down':  '<polyline points="6 9 12 15 18 9"/>',
    'chevron-up':    '<polyline points="18 15 12 9 6 15"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'chevron-left':  '<polyline points="15 18 9 12 15 6"/>',
    'arrow-right':   '<line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
    'arrow-left':    '<line x1="20" y1="12" x2="5" y2="12"/><polyline points="11 18 5 12 11 6"/>',
    'arrow-up':      '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/>',
    'arrow-down':    '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="18 13 12 19 6 13"/>',
    'external':      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    'close':         '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'menu':          '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    'more-vertical': '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
    'plus':          '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'minus':         '<line x1="5" y1="12" x2="19" y2="12"/>',
    'search':        '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
    'filter':        '<polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3"/>',
    'refresh':       '<polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/>',

    /* --- status / feedback --------------------------------------------- */
    'check':         '<polyline points="20 6 9 17 4 12"/>',
    'check-circle':  '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><polyline points="22 4 12 14.1 9 11.1"/>',
    'alert-triangle':'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'info':          '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    'x-circle':      '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    'help-circle':   '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'lock':          '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',

    /* --- fleet / service ------------------------------------------------ */
    'truck':         '<rect x="1" y="6" width="13" height="11" rx="1.5"/><path d="M14 10h4l3 3.2V17h-7z"/><circle cx="6" cy="19.5" r="1.9"/><circle cx="17.5" cy="19.5" r="1.9"/>',
    'truck-front':   '<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="17" y2="12"/><line x1="6" y1="16" x2="6" y2="19"/><line x1="18" y1="16" x2="18" y2="19"/>',
    'truck-wrench':  '<rect x="1.5" y="7" width="12" height="9" rx="1.5"/><path d="M13.5 10.5H17l3.5 3.3V16h-7z"/><circle cx="6" cy="18.5" r="1.7"/><circle cx="17" cy="18.5" r="1.7"/><path d="M9.6 3.2a2.6 2.6 0 0 0-3.4 3.4l-1.6 1.6 1.9 1.9L8.1 8.5a2.6 2.6 0 0 0 3.4-3.4L9.9 6.7 8.4 5.2z"/>',
    'tow-truck':     '<rect x="1.5" y="10" width="11" height="6" rx="1"/><path d="M12.5 12h4l4 2.6V16h-8z"/><circle cx="5.5" cy="18.5" r="1.7"/><circle cx="17" cy="18.5" r="1.7"/><polyline points="4 10 4 4 12 4"/><line x1="12" y1="4" x2="15" y2="8"/>',
    'gear-wrench':   '<circle cx="12" cy="12" r="3.1"/><path d="M19.6 14.6a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9.4a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/>',
    'wrench':        '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.3-.7-.7-2.3z"/>',
    'monitor-pulse': '<rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="6 11 9 11 10.5 8 13 14 14.5 11 18 11"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    'clipboard-check':'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><polyline points="9 12 11 14 15 10"/>',
    'clipboard-dollar':'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="12" y1="9.5" x2="12" y2="17.5"/><path d="M14 11.4a2 2 0 0 0-2-1.4c-1.1 0-2 .7-2 1.6s.9 1.4 2 1.6 2 .7 2 1.6-.9 1.6-2 1.6a2 2 0 0 1-2-1.4"/>',
    'calendar':      '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'calendar-clock':'<path d="M21 11V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="17.5" cy="17.5" r="4.3"/><polyline points="17.5 15.6 17.5 17.6 19 18.4"/>',
    'shield':        '<path d="M12 22s8-4 8-10V5.5L12 2 4 5.5V12c0 6 8 10 8 10z"/>',
    'shield-badge':  '<path d="M12 2 4 5.5V12c0 6 8 10 8 10s8-4 8-10V5.5z"/><circle cx="12" cy="11" r="2.6"/><line x1="12" y1="13.6" x2="12" y2="16"/>',
    'clock':         '<circle cx="12" cy="12" r="10"/><polyline points="12 6.5 12 12 15.8 14"/>',
    'globe':         '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z"/>',
    'map-pin':       '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.8"/>',
    'map':           '<polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/>',
    'building':      '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="15" y2="7"/><line x1="9" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="15" y2="12"/><path d="M10 22v-4h4v4"/>',
    'package':       '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/>',

    /* --- people / comms -------------------------------------------------- */
    'users':         '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    'user':          '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'user-plus':     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
    'phone':         '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    'phone-ring':    '<path d="M15.6 15.5v2.4a1.6 1.6 0 0 1-1.8 1.6 15.8 15.8 0 0 1-6.9-2.5 15.6 15.6 0 0 1-4.8-4.8A15.8 15.8 0 0 1 1.6 5.3 1.6 1.6 0 0 1 3.2 3.5h2.4a1.6 1.6 0 0 1 1.6 1.4c.1.8.3 1.5.6 2.2a1.6 1.6 0 0 1-.4 1.7L6.4 9.8a12.8 12.8 0 0 0 4.8 4.8l1-1a1.6 1.6 0 0 1 1.7-.4c.7.3 1.4.5 2.2.6a1.6 1.6 0 0 1 1.5 1.7z"/><path d="M16.8 8.2a4.6 4.6 0 0 0-2.8-2.8"/><path d="M19.6 5.4A9 9 0 0 0 13.9 2"/>',
    'mail':          '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="3 6.5 12 13 21 6.5"/>',
    'message':       '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>',
    'send':          '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    'bell':          '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    'review':        '<path d="M20 4H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3v4l5-4h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><polyline points="8.5 10.5 10.5 12.5 15 8"/>',
    'thumbs-up':     '<path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/><path d="M7 10l4.2-7.4A2 2 0 0 1 15 3.7l-.8 4.3h5a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17.7 19H7z"/>',
    'star-line':     '<polygon points="12 2.6 15 8.9 22 9.9 17 14.8 18.2 21.8 12 18.5 5.8 21.8 7 14.8 2 9.9 9 8.9"/>',
    'star':          '<polygon points="12 2.6 15 8.9 22 9.9 17 14.8 18.2 21.8 12 18.5 5.8 21.8 7 14.8 2 9.9 9 8.9"/>',

    /* --- money / documents ---------------------------------------------- */
    'dollar':        '<line x1="12" y1="1.5" x2="12" y2="22.5"/><path d="M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'credit-card':   '<rect x="1.5" y="4.5" width="21" height="15" rx="2.5"/><line x1="1.5" y1="10" x2="22.5" y2="10"/>',
    'wallet':        '<path d="M20 7V5.5A1.5 1.5 0 0 0 18.5 4H4.5A1.5 1.5 0 0 0 3 5.5v13A1.5 1.5 0 0 0 4.5 20h14a1.5 1.5 0 0 0 1.5-1.5V17"/><path d="M22 9.5h-5a2.5 2.5 0 0 0 0 5h5z"/>',
    'receipt':       '<path d="M5 2h14v20l-2.3-1.6L14.4 22l-2.4-1.6L9.6 22l-2.3-1.6L5 22z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12.5" x2="15" y2="12.5"/>',
    'file-text':     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    'link':          '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12.2 19"/>',
    'download':      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'upload':        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    'image':         '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.7" cy="8.7" r="1.8"/><polyline points="21 15.5 16.5 11 5.5 21"/>',
    'camera':        '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5L8.5 3h7l2 3H21a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.8"/>',
    'printer':       '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    'edit':          '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    'trash':         '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    'eye':           '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    'copy':          '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',

    /* --- dashboard ------------------------------------------------------- */
    'grid':          '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    'list':          '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3.5" y1="6" x2="3.5" y2="6"/><line x1="3.5" y1="12" x2="3.5" y2="12"/><line x1="3.5" y1="18" x2="3.5" y2="18"/>',
    'activity':      '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    'trending-up':   '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    'settings':      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.6l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.4 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    'log-out':       '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    'briefcase':     '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'sparkles':      '<path d="M12 2.5 13.8 8 19 9.8 13.8 11.6 12 17 10.2 11.6 5 9.8 10.2 8z"/><path d="M18.5 15 19.4 17.6 22 18.5 19.4 19.4 18.5 22 17.6 19.4 15 18.5 17.6 17.6z"/>',
    'play':          '<polygon points="6 3.5 20 12 6 20.5"/>',
    'pause':         '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    'facebook':      '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    'instagram':     '<rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><line x1="17.6" y1="6.4" x2="17.61" y2="6.4"/>'
  };

  /* Icons drawn with a fill rather than a stroke. */
  var SOLID = { star: 1, facebook: 1, play: 1, sparkles: 1, 'thumbs-up': 1, shield: 1, phone: 1 };

  /**
   * Build an inline SVG string.
   * @param {string} name  key from PATHS
   * @param {string} [cls] optional class attribute
   * @returns {string} svg markup ('' when the name is unknown)
   */
  FS.icon = function (name, cls) {
    var body = PATHS[name];
    if (!body) return '';
    var solid = SOLID[name];
    return '<svg viewBox="0 0 24 24" class="' + (cls || '') + '" aria-hidden="true" ' +
      'fill="' + (solid ? 'currentColor' : 'none') + '" ' +
      'stroke="' + (solid ? 'none' : 'currentColor') + '" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
  };

  /** Render N filled + (5-N) empty stars. */
  FS.stars = function (rating, cls) {
    var out = '<span class="stars ' + (cls || '') + '" role="img" aria-label="' + rating + ' out of 5">';
    for (var i = 1; i <= 5; i++) {
      out += FS.icon('star', i <= Math.round(rating) ? '' : 'is-empty');
    }
    return out + '</span>';
  };

  /* Replace every <i data-icon="name"></i> placeholder in a subtree. */
  FS.hydrateIcons = function (root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.dataset.iconDone) return;
      el.innerHTML = FS.icon(el.dataset.icon);
      el.dataset.iconDone = '1';
    });
  };
})(window);
