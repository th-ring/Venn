import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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

async function findDebuggerUrl(port) {
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

async function runDetailedOverlapTest() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9555;
  const userDir = path.join(os.tmpdir(), 'venn_chrome_overlap_' + Date.now());

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
    const browserCdp = new CdpClient(wsUrl);
    const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    const pageWsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`;
    const pageCdp = new CdpClient(pageWsUrl);

    await pageCdp.send('Page.enable');
    await pageCdp.send('DOM.enable');
    await pageCdp.send('Runtime.enable');

    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      mobile: true,
      fitWindow: false
    });
    await pageCdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });

    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2500));

    // Dismiss walkthrough
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          try { localStorage.setItem('venn_walkthrough_seen', 'true'); } catch(e){}
          const skipBtn = document.querySelector('button[aria-label="Einführung beenden"]');
          if (skipBtn) skipBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 500));

    // Turn on Rental Overlay + Only Intersection
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          // Click rental overlay quick toggle
          const rentalBtn = document.querySelector('#btn-toggle-rental-overlay');
          if (rentalBtn) rentalBtn.click();
          
          // Click sidebar button to toggle only intersection
          const sidebarBtn = document.querySelector('#btn-expand-sidebar');
          if (sidebarBtn) sidebarBtn.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 600));

    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const onlyIntersectBtn = document.querySelector('#btn-sidebar-only-intersection');
          if (onlyIntersectBtn) onlyIntersectBtn.click();
          const backdrop = document.querySelector('#sidebar-mobile-backdrop');
          if (backdrop) backdrop.click();
        })()
      `
    });
    await new Promise((r) => setTimeout(r, 600));

    // Inspect on map
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

    const shot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(process.cwd(), 'scratch_audit_screenshots', 'overlap_test_bottom_clutter.png'), Buffer.from(shot.data, 'base64'));

    pageCdp.close();
    browserCdp.close();
  } finally {
    chromeProc.kill();
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  }
}

runDetailedOverlapTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
