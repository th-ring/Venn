import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Helper to make simple CDP requests over native WebSocket
class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();

    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    const msg = { id, method, params };
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(msg));
    });
  }

  close() {
    this.ws.close();
  }
}

async function findDebuggerUrl(port = 9222) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error('Could not connect to Chrome debugging port');
}

async function runMobileAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9444;
  // Use os.tmpdir() so Vite does NOT trigger hot reloads on Chrome profile files!
  const userDir = path.join(os.tmpdir(), 'venn_chrome_audit_' + Date.now());

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ]);

  try {
    const wsUrl = await findDebuggerUrl(port);
    console.log('Connected to Chrome DevTools Protocol at:', wsUrl);

    const browserCdp = new CdpClient(wsUrl);
    const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    const pageWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
    const pageCdp = new CdpClient(pageWsUrl);

    await pageCdp.send('Page.enable');
    await pageCdp.send('DOM.enable');
    await pageCdp.send('Runtime.enable');

    const viewports = [
      { name: 'iPhone-14-Pro', width: 393, height: 852, dpr: 3 },
      { name: 'iPhone-SE', width: 375, height: 667, dpr: 2 },
      { name: 'Small-Android', width: 360, height: 740, dpr: 2 }
    ];

    const screenshotsDir = path.join(process.cwd(), 'scratch_audit_screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    for (const vp of viewports) {
      console.log(`\n======================================================`);
      console.log(`Testing Mobile Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);
      
      await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: true,
        fitWindow: false
      });
      await pageCdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });

      // Navigate to app and wait for network/dom
      await pageCdp.send('Page.navigate', { url: 'http://localhost:3000' });
      await new Promise((r) => setTimeout(r, 2500));

      // Dismiss walkthrough if modal is open
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            try { localStorage.setItem('venn_walkthrough_seen', 'true'); } catch(e){}
            const skipBtn = document.querySelector('button[aria-label="Einführung beenden"]') || 
                            document.querySelector('button[title="Einführung beenden"]');
            if (skipBtn) skipBtn.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 600));

      // 1. Audit Map View (Default)
      const mapAudit = await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const elements = [
              { name: 'btn-expand-sidebar', sel: '#btn-expand-sidebar' },
              { name: 'btn-layer-manager-toggle', sel: '#btn-layer-manager-toggle' },
              { name: 'map-legend-btn', sel: 'button[aria-label="Kartenlegende öffnen"]' },
              { name: 'leaflet-zoom', sel: '.leaflet-control-zoom' },
              { name: 'layer-controls-dock', sel: '#btn-toggle-residential' }
            ];

            const found = [];
            for (const item of elements) {
              const el = document.querySelector(item.sel);
              if (el) {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                found.push({
                  name: item.name,
                  rect: { left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) },
                  display: style.display,
                  zIndex: style.zIndex
                });
              }
            }

            // Check for overlaps between all visible floating elements
            const overlaps = [];
            for (let i = 0; i < found.length; i++) {
              for (let j = i + 1; j < found.length; j++) {
                const a = found[i];
                const b = found[j];
                const xOverlap = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
                const yOverlap = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
                if (xOverlap > 1 && yOverlap > 1) {
                  overlaps.push({
                    a: a.name,
                    b: b.name,
                    xOverlap,
                    yOverlap,
                    rectA: a.rect,
                    rectB: b.rect
                  });
                }
              }
            }

            return {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              elements: found,
              overlaps,
              hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
            };
          })()
        `,
        returnByValue: true
      });

      console.log('1. Map View Audit:', JSON.stringify(mapAudit.result.value, null, 2));

      // Save Screenshot 1: Map View
      const mapShot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotsDir, `${vp.name}_01_map.png`), Buffer.from(mapShot.data, 'base64'));

      // 2. Open Legend and check overlap
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const btn = document.querySelector('button[aria-label="Kartenlegende öffnen"]');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 400));

      const legendAudit = await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const legend = document.querySelector('div[role="region"][aria-label="Kartenlegende"]');
            const zoom = document.querySelector('.leaflet-control-zoom');
            const rectL = legend ? legend.getBoundingClientRect() : null;
            const rectZ = zoom ? zoom.getBoundingClientRect() : null;
            let overlap = false;
            if (rectL && rectZ) {
              const xOverlap = Math.max(0, Math.min(rectL.right, rectZ.right) - Math.max(rectL.left, rectZ.left));
              const yOverlap = Math.max(0, Math.min(rectL.bottom, rectZ.bottom) - Math.max(rectL.top, rectZ.top));
              overlap = xOverlap > 0 && yOverlap > 0;
            }
            return {
              legendRect: rectL ? { left: Math.round(rectL.left), top: Math.round(rectL.top), width: Math.round(rectL.width), height: Math.round(rectL.height) } : null,
              zoomRect: rectZ ? { left: Math.round(rectZ.left), top: Math.round(rectZ.top), width: Math.round(rectZ.width), height: Math.round(rectZ.height) } : null,
              overlapWithZoom: overlap
            };
          })()
        `,
        returnByValue: true
      });
      console.log('2. Legend Open Audit:', JSON.stringify(legendAudit.result.value, null, 2));

      const legendShot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotsDir, `${vp.name}_02_legend_open.png`), Buffer.from(legendShot.data, 'base64'));

      // 3. Open Sidebar on Mobile
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const btn = document.querySelector('#btn-expand-sidebar');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 600));

      const sidebarShot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotsDir, `${vp.name}_03_sidebar.png`), Buffer.from(sidebarShot.data, 'base64'));

      const sidebarAudit = await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const sidebar = document.querySelector('#commute-sidebar');
            const rect = sidebar ? sidebar.getBoundingClientRect() : null;
            const headerBtns = Array.from(sidebar ? sidebar.querySelectorAll('.h-14 button') : []).map(b => ({
              id: b.id || b.title,
              rect: b.getBoundingClientRect()
            }));
            return {
              sidebarWidth: rect ? rect.width : 0,
              windowWidth: window.innerWidth,
              headerButtonsCount: headerBtns.length,
              hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
            };
          })()
        `,
        returnByValue: true
      });
      console.log('3. Sidebar Audit:', JSON.stringify(sidebarAudit.result.value, null, 2));

      // 4. Open Settings Modal from Sidebar
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const btn = document.querySelector('#btn-open-settings');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 600));

      const settingsShot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotsDir, `${vp.name}_04_settings.png`), Buffer.from(settingsShot.data, 'base64'));

      // Close Settings Modal
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const btn = document.querySelector('button[aria-label="Einstellungen schließen"]') ||
                        document.querySelector('button[title="Schließen"]');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 400));

      // Close sidebar (click backdrop)
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const backdrop = document.querySelector('#sidebar-mobile-backdrop');
            if (backdrop) backdrop.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 500));

      // 5. Open Layer Manager Panel
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const btn = document.querySelector('#btn-layer-manager-toggle');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 500));

      const layerShot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotsDir, `${vp.name}_05_layers.png`), Buffer.from(layerShot.data, 'base64'));

      // Close Layer Manager
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const backdrop = document.querySelector('#layer-manager-backdrop');
            if (backdrop) backdrop.click();
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 400));

      // 6. Click on Map to inspect a point
      await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const mapContainer = document.querySelector('#venn-map-stage');
            if (mapContainer) {
              const rect = mapContainer.getBoundingClientRect();
              const evt = new MouseEvent('click', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                bubbles: true
              });
              mapContainer.dispatchEvent(evt);
            }
          })()
        `
      });
      await new Promise((r) => setTimeout(r, 1000));

      const inspectShot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(screenshotsDir, `${vp.name}_06_inspection.png`), Buffer.from(inspectShot.data, 'base64'));

      const inspectAudit = await pageCdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const inspector = document.querySelector('#inspection-detail-panel');
            const legend = document.querySelector('button[aria-label="Kartenlegende öffnen"]') || document.querySelector('div[role="region"][aria-label="Kartenlegende"]');
            const zoom = document.querySelector('.leaflet-control-zoom');
            const topToggle = document.querySelector('#btn-expand-sidebar');
            const layerToggle = document.querySelector('#btn-layer-manager-toggle');

            const inspRect = inspector ? inspector.getBoundingClientRect() : null;
            const legendRect = legend ? legend.getBoundingClientRect() : null;
            const zoomRect = zoom ? zoom.getBoundingClientRect() : null;
            const topToggleRect = topToggle ? topToggle.getBoundingClientRect() : null;
            const layerToggleRect = layerToggle ? layerToggle.getBoundingClientRect() : null;

            // Check if inspector overlaps with bottom controls or legend
            let overlapsLegend = false;
            let overlapsZoom = false;
            let overlapsTopToggle = false;
            let overlapsLayerToggle = false;

            if (inspRect) {
              if (legendRect) {
                const x = Math.max(0, Math.min(inspRect.right, legendRect.right) - Math.max(inspRect.left, legendRect.left));
                const y = Math.max(0, Math.min(inspRect.bottom, legendRect.bottom) - Math.max(inspRect.top, legendRect.top));
                overlapsLegend = x > 0 && y > 0;
              }
              if (zoomRect) {
                const x = Math.max(0, Math.min(inspRect.right, zoomRect.right) - Math.max(inspRect.left, zoomRect.left));
                const y = Math.max(0, Math.min(inspRect.bottom, zoomRect.bottom) - Math.max(inspRect.top, zoomRect.top));
                overlapsZoom = x > 0 && y > 0;
              }
              if (topToggleRect) {
                const x = Math.max(0, Math.min(inspRect.right, topToggleRect.right) - Math.max(inspRect.left, topToggleRect.left));
                const y = Math.max(0, Math.min(inspRect.bottom, topToggleRect.bottom) - Math.max(inspRect.top, topToggleRect.top));
                overlapsTopToggle = x > 0 && y > 0;
              }
              if (layerToggleRect) {
                const x = Math.max(0, Math.min(inspRect.right, layerToggleRect.right) - Math.max(inspRect.left, layerToggleRect.left));
                const y = Math.max(0, Math.min(inspRect.bottom, layerToggleRect.bottom) - Math.max(inspRect.top, layerToggleRect.top));
                overlapsLayerToggle = x > 0 && y > 0;
              }
            }

            return {
              hasInspector: !!inspector,
              inspRect: inspRect ? { left: Math.round(inspRect.left), top: Math.round(inspRect.top), width: Math.round(inspRect.width), height: Math.round(inspRect.height) } : null,
              overlapsLegend,
              overlapsZoom,
              overlapsTopToggle,
              overlapsLayerToggle
            };
          })()
        `,
        returnByValue: true
      });
      console.log('6. Inspection Audit:', JSON.stringify(inspectAudit.result.value, null, 2));
    }

    console.log('\nAll mobile audits finished successfully!');
    pageCdp.close();
    browserCdp.close();
  } finally {
    chromeProc.kill();
    try {
      fs.rmSync(userDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

runMobileAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
