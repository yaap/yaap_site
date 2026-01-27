// Team data with GitHub usernames and additional info
const teamMembers = [
  {
    github: 'idoybh',
    telegram: 'idoybh',
    role: 'Lead Developer & Co-Founder',
    fallbackBio: 'CS student, hobbyist programmer, lead developer at YAAP'
  },
  {
    github: 'RealJohnGalt',
    telegram: 'realjohngalt',
    role: 'Lead Developer & Kernel Expert',
    fallbackBio: ''
  },
  {
    github: 'poad42',
    telegram: 'poad42',
    role: 'Lead Developer & Co-Founder',
    fallbackBio: 'Lead Developer at YAAP, Doing things at CU Boulder'
  }
];

const websiteTeam = [
  {
    github: 'grepfox',
    telegram: 'grepfox',
    role: 'Website Developer',
    fallbackBio: ''
  },
  {
    github: 'idoybh',
    telegram: 'idoybh',
    role: 'Website Maintainer',
    fallbackBio: 'CS student, hobbyist programmer, lead developer at YAAP'
  }
];

const designTeam = [
  {
    github: 'Lacentix',
    telegram: 'Lacentix',
    role: 'UI/UX Designer',
    fallbackBio: ''
  }
];

// GitHub and Telegram SVG icons
const icons = {
  github: `<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-1.135 6.392-1.604 8.48-.199.879-.589 1.172-0.966 1.201-.819.075-1.439-.54-2.232-1.061-1.239-.812-1.928-1.316-3.127-2.107-1.383-.912-.487-1.414.302-2.235.206-.214 3.789-3.473 3.858-3.771.009-.037.017-.175-.066-.248s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.098.154.228.170.32.016.092.036.301.020.465z"/></svg>`
};

// Cache for faster loading
let deviceCache = null;
let maintainerDevicesCache = new Map();

async function fetchGitHubUser(username) {
  try {
    const response = await fetch(`https://yaaprom-device-info.idoybh2.workers.dev/users/${username}`);
    if (!response.ok) throw new Error('GitHub API error');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GitHub data for ${username}:`, error);
    return null;
  }
}

// Function to parse multiple maintainers from a string
function parseMaintainers(maintainerString) {
  if (!maintainerString) return [];
// Split by common delimiters: &, and, ,, +
  const delimiters = /\s*(?:&|and|,|\+)\s*/i;
  return maintainerString
    .split(delimiters)
    .map(m => m.trim())
    .filter(m => m.length > 0);
}

async function buildMaintainerDeviceMap({useCache = true, cacheTTLms = 1000 * 60 * 5, owner = 'yaap', repo = 'device-info', branch = 'main'} = {}) {
  if (deviceCache) return deviceCache;

  try {
    const cacheKey = `yaap_maintainer_devices_v2_${owner}_${repo}_${branch}`;
    if (useCache) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() - parsed.ts < cacheTTLms) {
            deviceCache = parsed.data;
            return deviceCache;
          }
        }
      } catch (e) {
        console.warn('localStorage parse error', e);
      }
    }

    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    let treeResp;
    try {
      treeResp = await fetch(treeUrl);
      if (!treeResp.ok) throw new Error(`GitHub trees request failed ${treeResp.status}`);
    } catch (err) {
      console.warn('trees API failed, falling back to directory crawl', err);

      return await buildMaintainerDeviceMapFallback({useCache, cacheTTLms});
    }

    const treeJson = await treeResp.json();
    if (!treeJson.tree) throw new Error('Unexpected tree response format');

    const jsonPaths = treeJson.tree
      .filter(item => item.path && item.type === 'blob' && item.path.endsWith('.json'))
      .map(item => item.path);


    async function mapWithConcurrencyLimit(list, mapper, limit = 12) {
      const results = new Array(list.length);
      let idx = 0;

      async function worker() {
        while (true) {
          const i = idx++;
          if (i >= list.length) return;
          try {
            results[i] = await mapper(list[i], i);
          } catch (err) {
            console.error('mapper error', err);
            results[i] = null;
          }
        }
      }

      const workers = Array(Math.min(limit, list.length)).fill().map(() => worker());
      await Promise.all(workers);
      return results;
    }

    const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
    const fetched = await mapWithConcurrencyLimit(jsonPaths, async (path) => {
      try {
        const url = rawBase + path;
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      } catch (e) {
        console.error('fetch json error', path, e);
        return null;
      }
    }, 12);


    const maintainerDevices = {};
    for (let i = 0; i < jsonPaths.length; i++) {
      const deviceInfo = fetched[i];
      if (!deviceInfo) continue;
      const path = jsonPaths[i];

      const codename = path.split('/')[0] || path.replace('.json', '').split('/').pop();

      if (deviceInfo.maintainer) {
        const maintainers = parseMaintainers(deviceInfo.maintainer);
        maintainers.forEach(maintainer => {
          if (!maintainerDevices[maintainer]) maintainerDevices[maintainer] = [];
          maintainerDevices[maintainer].push({
            codename,
            filename: path.split('/').pop(),
            ...deviceInfo,
            tg_id: deviceInfo.tg_id || maintainer
          });
        });
      }
    }

    deviceCache = maintainerDevices;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: maintainerDevices }));
    } catch (e) {
    }

    return maintainerDevices;
  } catch (error) {
    console.error('Error building maintainer device map:', error);
    return {};
  }
}

async function buildMaintainerDeviceMapFallback({useCache = true, cacheTTLms = 1000 * 60 * 5} = {}) {
  if (deviceCache) return deviceCache;
  try {
    const cacheKey = 'yaap_maintainer_devices_fallback';
    if (useCache) {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts < cacheTTLms) {
          deviceCache = parsed.data;
          return deviceCache;
        }
      }
    }

    const response = await fetch('https://yaaprom-device-info.idoybh2.workers.dev/repos/yaap/device-info/contents/');
    if (!response.ok) throw new Error('Failed to fetch device list');
    const folders = await response.json();

    const maintainerDevices = {};
    const batchSize = 10;
    for (let i = 0; i < folders.length; i += batchSize) {
      const batch = folders.slice(i, i + batchSize);
      await Promise.all(batch.filter(f => f.type === 'dir').map(async folder => {
        try {
          const folderResponse = await fetch(`https://yaaprom-device-info.idoybh2.workers.dev/repos/yaap/device-info/contents/${folder.name}`);
          if (!folderResponse.ok) return;
          const folderContents = await folderResponse.json();
          const jsonFiles = folderContents.filter(file => file.type === 'file' && file.name.endsWith('.json'));

          await Promise.all(jsonFiles.map(async jsonFile => {
            try {
              const fileResponse = await fetch(jsonFile.download_url);
              if (!fileResponse.ok) return;
              const deviceInfo = await fileResponse.json();
              if (deviceInfo.maintainer) {
                const maintainers = parseMaintainers(deviceInfo.maintainer);
                maintainers.forEach(maintainer => {
                  if (!maintainerDevices[maintainer]) maintainerDevices[maintainer] = [];
                  maintainerDevices[maintainer].push({
                    codename: folder.name,
                    filename: jsonFile.name,
                    ...deviceInfo,
                    tg_id: deviceInfo.tg_id || maintainer
                  });
                });
              }
            } catch (error) {
              console.error(`Error processing ${jsonFile.name}:`, error);
            }
          }));
        } catch (error) {
          console.error(`Error processing folder ${folder.name}:`, error);
        }
      }));
    }

    deviceCache = maintainerDevices;
    try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: maintainerDevices })); } catch (e) {}
    return maintainerDevices;
  } catch (error) {
    console.error('fallback error building maintainer device map:', error);
    return {};
  }
}

function createDeviceBadges(devices, maintainerIndex) {
  if (!devices || devices.length === 0) {
    return '<span class="device-badge">No devices</span>';
  }

  const visibleDevices = devices.slice(0, 3);
  const hiddenDevices = devices.slice(3);

  let html = visibleDevices.map(device =>
    `<a href="/device.html?codename=${encodeURIComponent(device.codename)}" class="device-badge" title="${escapeHtml(device.name || device.device || device.codename)}">
      ${escapeHtml(device.codename)}
    </a>`
  ).join('');

  if (hiddenDevices.length > 0) {
    html += `
      <div class="hidden-devices" id="hidden-devices-${maintainerIndex}" style="display: none;">
        ${hiddenDevices.map(device =>
          `<a href="/device.html?codename=${encodeURIComponent(device.codename)}" class="device-badge" title="${escapeHtml(device.name || device.device || device.codename)}">
            ${escapeHtml(device.codename)}
          </a>`
        ).join('')}
      </div>
      <button class="device-toggle-btn" onclick="toggleDevices(${maintainerIndex}, ${hiddenDevices.length})">
        +${hiddenDevices.length} more
      </button>
    `;
  }

  return html;
}

function toggleDevices(maintainerIndex, hiddenCount) {
  const hiddenDiv = document.getElementById(`hidden-devices-${maintainerIndex}`);
  const toggleBtn = document.querySelector(`button[onclick="toggleDevices(${maintainerIndex}, ${hiddenCount})"]`);
  if (!hiddenDiv || !toggleBtn) return;

  const isHidden = hiddenDiv.style.display === 'none';
  if (isHidden) {
    hiddenDiv.style.display = 'flex';
    toggleBtn.textContent = 'Show less';
    toggleBtn.classList.add('expanded');
  } else {
    hiddenDiv.style.display = 'none';
    toggleBtn.textContent = `+${hiddenCount} more`;
    toggleBtn.classList.remove('expanded');
  }
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createTeamCard(member, githubData) {
  const name = (githubData && (githubData.name || githubData.login)) || member.github;
  const bio = (githubData && (githubData.bio || member.fallbackBio)) || '';
  const avatar = (githubData && githubData.avatar_url) || `https://github.com/${member.github}.png`;

  return `
    <div class="team-card">
      <img src="${avatar}" alt="${escapeHtml(name)}" class="team-card__photo" loading="lazy" />
      <h3 class="team-card__name">${escapeHtml(name)}</h3>
      <p class="team-card__role">${escapeHtml(member.role)}</p>
      <p class="team-card__bio">${escapeHtml(bio)}</p>
      <div class="team-card__links">
        <a href="https://github.com/${encodeURIComponent(member.github)}" class="social-link github" target="_blank" aria-label="GitHub">
          ${icons.github}
        </a>
        <a href="https://t.me/${encodeURIComponent(member.telegram)}" class="social-link telegram" target="_blank" aria-label="Telegram">
          ${icons.telegram}
        </a>
      </div>
    </div>
  `;
}

function createMaintainerCard(maintainer, githubData, devices, index) {
  const name = (githubData && (githubData.name || githubData.login)) || maintainer;
  const bio = (githubData && (githubData.bio)) || `Maintains ${devices.length} device${devices.length > 1 ? 's' : ''} for YAAP`;
  const avatar = (githubData && githubData.avatar_url) || `https://github.com/${maintainer}.png`;
  const telegramId = (devices.find(d => d.tg_id) && devices.find(d => d.tg_id).tg_id) || maintainer;
  const telegramLink = telegramId ? `
    <a href="https://t.me/${encodeURIComponent(telegramId)}" class="social-link telegram" target="_blank" aria-label="Telegram">
      ${icons.telegram}
    </a>
  ` : '';

  return `
    <div class="maintainer-card">
      <img src="${avatar}" alt="${escapeHtml(name)}" class="maintainer-card__photo" loading="lazy" />
      <h3 class="maintainer-card__name">${escapeHtml(name)}</h3>
      <p class="maintainer-card__role">Device Maintainer</p>
      <div class="maintainer-card__devices">
        ${createDeviceBadges(devices, index)}
      </div>
      <p class="maintainer-card__bio">${escapeHtml(bio)}</p>
      <div class="maintainer-card__links">
        <a href="https://github.com/${encodeURIComponent(maintainer)}" class="social-link github" target="_blank" aria-label="GitHub">
          ${icons.github}
        </a>
        ${telegramLink}
      </div>
    </div>
  `;
}

async function loadTeamMembers({teamSelector = '#team-grid', maintainersSelector = '#maintainers-grid', showWebsiteTeam = true, showDesignTeam = true} = {}) {
  const teamGrid = document.querySelector(teamSelector);
  const maintainersGrid = document.querySelector(maintainersSelector);
  if (!teamGrid && !maintainersGrid) return;

  if (teamGrid) {
    teamGrid.innerHTML = teamMembers.map(() => '<div class="team-card loading"></div>').join('');
  }

  async function fetchProfiles(members) {
    const results = new Array(members.length);
    const limit = 6;
    let idx = 0;
    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= members.length) return;
        try {
          results[i] = await fetchGitHubUser(members[i].github);
        } catch (e) {
          results[i] = null;
        }
      }
    }
    const workers = Array(Math.min(limit, members.length)).fill().map(() => worker());
    await Promise.all(workers);
    return results;
  }

  const [teamProfiles, websiteProfiles, designProfiles] = await Promise.all([
    fetchProfiles(teamMembers),
    showWebsiteTeam ? fetchProfiles(websiteTeam) : Promise.resolve([]),
    showDesignTeam ? fetchProfiles(designTeam) : Promise.resolve([])
  ]);

  if (teamGrid) {
    const cards = teamMembers.map((m, i) => createTeamCard(m, teamProfiles[i]));
    teamGrid.innerHTML = cards.join('');
  }

  if (document.querySelector('#website-grid') && websiteTeam.length) {
    const grid = document.querySelector('#website-grid');
    grid.innerHTML = websiteTeam.map((m, i) => createTeamCard(m, websiteProfiles[i])).join('');
  }

  if (document.querySelector('#design-grid') && designTeam.length) {
    const grid = document.querySelector('#design-grid');
    grid.innerHTML = designTeam.map((m, i) => createTeamCard(m, designProfiles[i])).join('');
  }

  if (maintainersGrid) {
    maintainersGrid.innerHTML = '<div class="maintainer-card loading"></div>'; // initial skeleton

    const maintainerMap = await buildMaintainerDeviceMap();

    // sort alphabetically by maintainer name
    const maintainers = Object.keys(maintainerMap).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
    maintainersGrid.innerHTML = maintainers.map(() => '<div class="maintainer-card loading"></div>').join('');

    const limit = 8;
    let idx = 0;

    async function workerRender() {
      while (true) {
        const i = idx++;
        if (i >= maintainers.length) return;
        const name = maintainers[i];
        const devices = maintainerMap[name] || [];
        let gh = null;
        try { gh = await fetchGitHubUser(name); } catch(e) { gh = null; }
        const cardHtml = createMaintainerCard(name, gh, devices, i);
        const child = maintainersGrid.children[i];
        if (child) {
          const wrapper = document.createElement('div');
          wrapper.innerHTML = cardHtml;
          maintainersGrid.replaceChild(wrapper.firstElementChild, child);
        }
      }
    }

    const workers = Array(Math.min(limit, maintainers.length)).fill().map(() => workerRender());
    await Promise.all(workers);
  }
}

window.initTeam = function(options) {
  loadTeamMembers(options).catch(e => console.error('initTeam failed', e));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initTeam());
} else {
  window.initTeam();
}
