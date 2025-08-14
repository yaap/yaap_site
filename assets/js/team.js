// Team data with GitHub usernames and additional info
const teamMembers = [
  {
    github: 'idoybh',
    telegram: 'idoybh',
    role: 'Lead Developer & Co-Founder',
    fallbackBio: 'CS student, hobbyist programmer, and lead developer at YAAP. Passionate about clean AOSP experiences.'
  },
  {
    github: 'RealJohnGalt',
    telegram: 'jgop7t',
    role: 'Lead Developer & Kernel Expert',
    fallbackBio: ''
  },
  {
    github: 'poad42',
    telegram: 'poad42',
    role: 'Lead Developer & Co-Founder',
    fallbackBio: 'Embedded Software Developer at trinamiX GmbH and co-founder of YAAP. Building stable, feature-rich AOSP ROMs.'
  }
];

// GitHub and Telegram SVG icons
const icons = {
  github: `<svg viewBox="0 0 24 24">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>`,
  telegram: `<svg viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-1.135 6.392-1.604 8.48-.199.879-.589 1.172-0.966 1.201-.819.075-1.439-.54-2.232-1.061-1.239-.812-1.928-1.316-3.127-2.107-1.383-.912-.487-1.414.302-2.235.206-.214 3.789-3.473 3.858-3.771.009-.037.017-.175-.066-.248s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.098.154.228.170.32.016.092.036.301.020.465z"/>
  </svg>`
};

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

async function fetchDeviceInfo() {
  try {
    // Get the list of device folders
    const response = await fetch('https://yaaprom-device-info.idoybh2.workers.dev/repos/yaap/device-info/contents/');
    if (!response.ok) throw new Error('Failed to fetch device list');
    const folders = await response.json();
    const deviceData = [];

    // Fetch device info for each folder
    for (const folder of folders) {
      if (folder.type === 'dir') {
        try {
          // Get all files in the folder
          const folderResponse = await fetch(`https://yaaprom-device-info.idoybh2.workers.dev/repos/yaap/device-info/contents/${folder.name}`);
          if (folderResponse.ok) {
            const folderContents = await folderResponse.json();
            // Find JSON files
            const jsonFiles = folderContents.filter(file => 
              file.type === 'file' && file.name.endsWith('.json')
            );
            // Fetch each JSON file
            for (const jsonFile of jsonFiles) {
              try {
                const fileResponse = await fetch(jsonFile.download_url);
                if (fileResponse.ok) {
                  const deviceInfo = await fileResponse.json();
                  deviceData.push({
                    codename: folder.name,
                    filename: jsonFile.name,
                    ...deviceInfo
                  });
                }
              } catch (error) {
                console.error(`Error fetching ${jsonFile.name} for ${folder.name}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching device info for ${folder.name}:`, error);
        }
      }
    }
    return deviceData;
  } catch (error) {
    console.error('Error fetching device info:', error);
    return [];
  }
}

function createTeamCard(member, githubData) {
  const name = githubData?.name || githubData?.login || member.github;
  const bio = githubData?.bio || member.fallbackBio;
  const avatar = githubData?.avatar_url || `https://github.com/${member.github}.png`;

  return `
    <div class="team-card">
      <img src="${avatar}" alt="${name}" class="team-card__photo" />
      <h3 class="team-card__name">${name}</h3>
      <p class="team-card__role">${member.role}</p>
      <p class="team-card__bio">${bio}</p>
      <div class="team-card__links">
        <a href="https://github.com/${member.github}" class="social-link github" target="_blank" aria-label="GitHub">
          ${icons.github}
        </a>
        <a href="https://t.me/${member.telegram}" class="social-link telegram" target="_blank" aria-label="Telegram">
          ${icons.telegram}
        </a>
      </div>
    </div>
  `;
}

function createMaintainerCard(maintainer, githubData, devices) {
  const name = githubData?.name || githubData?.login || maintainer;
  const bio = githubData?.bio || `Maintains ${devices.length} device${devices.length > 1 ? 's' : ''} for YAAP`;
  const avatar = githubData?.avatar_url || `https://github.com/${maintainer}.png`;

  // Get telegram ID from device data - use tg_id if available, fallback to maintainer (github username)
  const telegramId = devices.find(d => d.tg_id)?.tg_id || maintainer;

  const deviceBadges = devices.slice(0, 3).map(device =>
    `<span class="device-badge" title="${device.name}">${device.codename}</span>`
  ).join('');

  const moreDevices = devices.length > 3 ? `<span class="device-count">+${devices.length - 3} more</span>` : '';

  const telegramLink = telegramId ?
    `<a href="https://t.me/${telegramId}" class="social-link telegram" target="_blank" aria-label="Telegram">
      ${icons.telegram}
    </a>` : '';

  return `
    <div class="maintainer-card">
      <img src="${avatar}" alt="${name}" class="maintainer-card__photo" />
      <h3 class="maintainer-card__name">${name}</h3>
      <p class="maintainer-card__role">Device Maintainer</p>
      <div class="maintainer-card__devices">
        ${deviceBadges}
        ${moreDevices}
      </div>
      <p class="maintainer-card__bio">${bio}</p>
      <div class="maintainer-card__links">
        <a href="https://github.com/${maintainer}" class="social-link github" target="_blank" aria-label="GitHub">
          ${icons.github}
        </a>
        ${telegramLink}
      </div>
    </div>
  `;
}

async function loadTeamMembers() {
  const teamGrid = document.getElementById('team-grid');

  teamGrid.innerHTML = teamMembers.map(() => '<div class="team-card loading"></div>').join('');

  const teamCards = await Promise.all(
    teamMembers.map(async (member) => {
      const githubData = await fetchGitHubUser(member.github);
      return createTeamCard(member, githubData);
    })
  );

  teamGrid.innerHTML = teamCards.join('');
}

async function loadMaintainers() {
  const maintainersGrid = document.getElementById('maintainers-grid');

  maintainersGrid.innerHTML = '<div class="maintainer-card loading"></div><div class="maintainer-card loading"></div>';

  const deviceData = await fetchDeviceInfo();

  if (deviceData.length === 0) {
    maintainersGrid.innerHTML = `
      <div class="maintainer-card">
        <img src="https://via.placeholder.com/100" alt="No Data" class="maintainer-card__photo" />
        <h3 class="maintainer-card__name">No Maintainers Found</h3>
        <p class="maintainer-card__role">Device Maintainer</p>
        <p class="maintainer-card__bio">Unable to load maintainer data at this time.</p>
        <div class="maintainer-card__links"></div>
      </div>
    `;
    return;
  }

  // Group devices by maintainer, handling multiple maintainers per device
  const maintainerDevices = {};

  deviceData.forEach(device => {
    if (device.maintainer) {
      // Parse multiple maintainers
      const maintainers = parseMaintainers(device.maintainer);

      maintainers.forEach(maintainer => {
        if (!maintainerDevices[maintainer]) {
          maintainerDevices[maintainer] = [];
        }

        // Add device info with telegram ID
        maintainerDevices[maintainer].push({
          ...device,
          // Keep tg_id from the device if it exists
          tg_id: device.tg_id || maintainer
        });
      });
    }
  });

  console.log('Maintainer devices:', maintainerDevices); // Debug log

  // Create maintainer cards
  const maintainerCards = await Promise.all(
    Object.entries(maintainerDevices).map(async ([maintainer, devices]) => {
      const githubData = await fetchGitHubUser(maintainer);
      return createMaintainerCard(maintainer, githubData, devices);
    })
  );

  maintainersGrid.innerHTML = maintainerCards.join('');
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadTeamMembers();
  loadMaintainers();
});
