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

const icons = {
  github: `<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-1.135 6.392-1.604 8.48-.199.879-.589 1.172-0.966 1.201-.819.075-1.439-.54-2.232-1.061-1.239-.812-1.928-1.316-3.127-2.107-1.383-.912-.487-1.414.302-2.235.206-.214 3.789-3.473 3.858-3.771.009-.037.017-.175-.066-.248s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.098.154.228.170.32.016.092.036.301.020.465z"/></svg>`
};

const USER_CACHE_TTL = 86400000;
const DEVICE_CACHE_TTL = 86400000;
const userProfileCache = new Map();
const userFetchPromises = new Map();
let deviceMemoryCache = null;

function getCachedGitHubUser(username) {
  if (!username) return null;
  const key = username.toLowerCase();
  if (userProfileCache.has(key)) return userProfileCache.get(key);
  try {
    const raw = localStorage.getItem('yaap_gh_user_' + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && Date.now() < parsed.ts + USER_CACHE_TTL) {
        userProfileCache.set(key, parsed.data);
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
}

function updateCardWithGitHubData(username, data) {
  if (!data) return;
  const cards = document.querySelectorAll(`[data-gh="${CSS.escape ? CSS.escape(username) : username}"]`);
  cards.forEach(card => {
    if (data.name) {
      const nameEl = card.querySelector('.team-card__name, .maintainer-card__name');
      if (nameEl) nameEl.textContent = data.name;
    }
    if (data.bio) {
      const bioEl = card.querySelector('.team-card__bio, .maintainer-card__bio');
      if (bioEl) bioEl.textContent = data.bio;
    }
    if (data.avatar_url) {
      const imgEl = card.querySelector('.team-card__photo, .maintainer-card__photo');
      if (imgEl) imgEl.src = data.avatar_url;
    }
  });
}

async function fetchGitHubUser(username) {
  if (!username) return null;
  const key = username.toLowerCase();
  const cached = getCachedGitHubUser(key);
  if (cached) return cached;

  if (userFetchPromises.has(key)) {
    return userFetchPromises.get(key);
  }

  const promise = (async () => {
    try {
      const response = await fetch(`https://yaaprom-device-info.idoybh2.workers.dev/users/${encodeURIComponent(username)}`);
      if (!response.ok) return null;
      const data = await response.json();
      const profile = {
        name: data.name || data.login || username,
        bio: data.bio || '',
        avatar_url: data.avatar_url || `https://github.com/${username}.png`
      };
      userProfileCache.set(key, profile);
      try {
        localStorage.setItem('yaap_gh_user_' + key, JSON.stringify({ ts: Date.now(), data: profile }));
      } catch (e) {}
      updateCardWithGitHubData(username, profile);
      return profile;
    } catch (e) {
      return null;
    } finally {
      userFetchPromises.delete(key);
    }
  })();

  userFetchPromises.set(key, promise);
  return promise;
}

function parseMaintainers(maintainerString) {
  if (!maintainerString) return [];
  const delimiters = /\s*(?:&|and|,|\+)\s*/i;
  return maintainerString
    .split(delimiters)
    .map(m => m.trim())
    .filter(m => m.length > 0);
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
      <button class="device-toggle-btn" onclick="toggleDevices(${maintainerIndex}, ${hiddenDevices.length}, this)">
        +${hiddenDevices.length} more
      </button>
    `;
  }

  return html;
}

function toggleDevices(maintainerIndex, hiddenCount, btn) {
  const hiddenDiv = document.getElementById(`hidden-devices-${maintainerIndex}`);
  const toggleBtn = btn || document.querySelector(`button[onclick*="toggleDevices(${maintainerIndex}"]`);
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
window.toggleDevices = toggleDevices;

function createTeamCard(member, githubData) {
  const name = (githubData && (githubData.name || githubData.login)) || member.github;
  const bio = (githubData && (githubData.bio || member.fallbackBio)) || member.fallbackBio || '';
  const avatar = (githubData && githubData.avatar_url) || `https://github.com/${member.github}.png`;

  return `
    <div class="team-card" data-gh="${escapeHtml(member.github)}">
      <img src="${avatar}" alt="${escapeHtml(name)}" class="team-card__photo" loading="lazy" width="72" height="72" decoding="async" />
      <h3 class="team-card__name">${escapeHtml(name)}</h3>
      <p class="team-card__role">${escapeHtml(member.role)}</p>
      <p class="team-card__bio">${escapeHtml(bio)}</p>
      <div class="team-card__links">
        <a href="https://github.com/${encodeURIComponent(member.github)}" class="social-link github" target="_blank" rel="noopener" aria-label="GitHub">
          ${icons.github}
        </a>
        <a href="https://t.me/${encodeURIComponent(member.telegram)}" class="social-link telegram" target="_blank" rel="noopener" aria-label="Telegram">
          ${icons.telegram}
        </a>
      </div>
    </div>
  `;
}

function createMaintainerCard(maintainer, githubData, devices, index) {
  const name = (githubData && (githubData.name || githubData.login)) || maintainer;
  const bio = (githubData && githubData.bio) || `Maintains ${devices.length} device${devices.length > 1 ? 's' : ''} for YAAP`;
  const avatar = (githubData && githubData.avatar_url) || `https://github.com/${maintainer}.png`;
  const telegramId = (devices.find(d => d.tg_id) && devices.find(d => d.tg_id).tg_id) || maintainer;
  const telegramLink = telegramId ? `
    <a href="https://t.me/${encodeURIComponent(telegramId)}" class="social-link telegram" target="_blank" rel="noopener" aria-label="Telegram">
      ${icons.telegram}
    </a>
  ` : '';

  return `
    <div class="maintainer-card" data-gh="${escapeHtml(maintainer)}">
      <img src="${avatar}" alt="${escapeHtml(name)}" class="maintainer-card__photo" loading="lazy" width="72" height="72" decoding="async" />
      <h3 class="maintainer-card__name">${escapeHtml(name)}</h3>
      <p class="maintainer-card__role">Device Maintainer</p>
      <div class="maintainer-card__devices">
        ${createDeviceBadges(devices, index)}
      </div>
      <p class="maintainer-card__bio">${escapeHtml(bio)}</p>
      <div class="maintainer-card__links">
        <a href="https://github.com/${encodeURIComponent(maintainer)}" class="social-link github" target="_blank" rel="noopener" aria-label="GitHub">
          ${icons.github}
        </a>
        ${telegramLink}
      </div>
    </div>
  `;
}

function getCachedMaintainerDevices() {
  if (deviceMemoryCache) return deviceMemoryCache;
  try {
    const raw = localStorage.getItem('yaap_maintainer_devices_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && Date.now() < parsed.ts + DEVICE_CACHE_TTL) {
        deviceMemoryCache = parsed.data;
        return deviceMemoryCache;
      }
    }
  } catch (e) {}
  return null;
}

async function fetchMaintainerDeviceMap({owner = 'yaap', repo = 'device-info', branch = 'master'} = {}) {
  let jsonPaths = [];
  try {
    const treeResp = await fetch(`https://yaaprom-device-info.idoybh2.workers.dev/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (treeResp.ok) {
      const treeJson = await treeResp.json();
      if (treeJson && Array.isArray(treeJson.tree)) {
        jsonPaths = treeJson.tree
          .filter(item => item.path && item.type === 'blob' && item.path.endsWith('.json'))
          .map(item => item.path);
      }
    }
  } catch (e) {}

  if (!jsonPaths.length) {
    try {
      const contentsResp = await fetch(`https://yaaprom-device-info.idoybh2.workers.dev/repos/${owner}/${repo}/contents`);
      if (contentsResp.ok) {
        const folders = await contentsResp.json();
        if (Array.isArray(folders)) {
          jsonPaths = folders
            .filter(f => f.type === 'dir')
            .map(f => `${f.name}/${f.name}.json`);
        }
      }
    } catch (e) {}
  }

  if (!jsonPaths.length) return {};

  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  const fetched = await Promise.all(
    jsonPaths.map(path =>
      fetch(rawBase + path)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  const maintainerDevices = {};
  for (let i = 0; i < jsonPaths.length; i = i + 1) {
    const deviceInfo = fetched[i];
    if (!deviceInfo) continue;
    const path = jsonPaths[i];
    const codename = path.split('/')[0] || path.replace('.json', '');

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

  deviceMemoryCache = maintainerDevices;
  try {
    localStorage.setItem('yaap_maintainer_devices_v3', JSON.stringify({ ts: Date.now(), data: maintainerDevices }));
  } catch (e) {}

  return maintainerDevices;
}

function renderSection(gridSelector, members) {
  const grid = document.querySelector(gridSelector);
  if (!grid || !members.length) return;
  const cardsHtml = members.map(m => {
    const cached = getCachedGitHubUser(m.github);
    return createTeamCard(m, cached);
  }).join('');
  grid.innerHTML = cardsHtml;

  members.forEach(m => {
    if (!getCachedGitHubUser(m.github)) {
      fetchGitHubUser(m.github);
    }
  });
}

function renderMaintainers(maintainerMap, maintainersGrid) {
  if (!maintainersGrid) return;
  const maintainers = Object.keys(maintainerMap).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  if (!maintainers.length) {
    maintainersGrid.innerHTML = '<p class="error-message">No maintainers found</p>';
    return;
  }
  const cardsHtml = maintainers.map((name, i) => {
    const devices = maintainerMap[name] || [];
    const cached = getCachedGitHubUser(name);
    return createMaintainerCard(name, cached, devices, i);
  }).join('');
  maintainersGrid.innerHTML = cardsHtml;

  maintainers.forEach(name => {
    if (!getCachedGitHubUser(name)) {
      fetchGitHubUser(name);
    }
  });
}

async function loadTeamMembers({teamSelector = '#team-grid', maintainersSelector = '#maintainers-grid', showWebsiteTeam = true, showDesignTeam = true} = {}) {
  const teamGrid = document.querySelector(teamSelector);
  const maintainersGrid = document.querySelector(maintainersSelector);

  if (teamGrid) {
    renderSection(teamSelector, teamMembers);
  }

  if (showWebsiteTeam) {
    renderSection('#website-grid', websiteTeam);
  }

  if (showDesignTeam) {
    renderSection('#design-grid', designTeam);
  }

  if (maintainersGrid) {
    const cachedMap = getCachedMaintainerDevices();
    if (cachedMap) {
      renderMaintainers(cachedMap, maintainersGrid);
      fetchMaintainerDeviceMap().then(freshMap => {
        if (freshMap && Object.keys(freshMap).length > 0) {
          const freshKey = JSON.stringify(freshMap);
          const oldKey = JSON.stringify(cachedMap);
          if (freshKey !== oldKey) {
            renderMaintainers(freshMap, maintainersGrid);
          }
        }
      }).catch(() => {});
    } else {
      maintainersGrid.innerHTML = Array(6).fill('<div class="maintainer-card loading"></div>').join('');
      try {
        const freshMap = await fetchMaintainerDeviceMap();
        renderMaintainers(freshMap, maintainersGrid);
      } catch (e) {
        maintainersGrid.innerHTML = '<p class="error-message">Failed to load maintainers</p>';
      }
    }
  }
}

window.buildMaintainerDeviceMap = fetchMaintainerDeviceMap;
window.initTeam = function(options) {
  loadTeamMembers(options).catch(e => console.error('initTeam failed', e));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initTeam());
} else {
  window.initTeam();
}
