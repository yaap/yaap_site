async function loadDevice() {
    const params = new URLSearchParams(window.location.search);
    const codename = params.get("codename");
    const deviceContainer = document.getElementById("device-container");

    try {
        const deviceInfo = await fetch(`https://raw.githubusercontent.com/yaap/device-info/master/${codename}/${codename}.json`).then(r => r.json());
        const otaBranch = deviceInfo["ota-branch"]
        const otaInfo = await fetch(`https://raw.githubusercontent.com/yaap/ota-info/${otaBranch}/${codename}/${codename}.json`).then(r => r.json());
        const vanillaOtaBranch = deviceInfo["ota-branch-vanilla"]
        let vanillaOtaInfo = {};
        try {
            vanillaOtaInfo = await fetch(`https://raw.githubusercontent.com/yaap/ota-info/${vanillaOtaBranch}/${codename}/${codename}.json`).then(r => r.json());
        } catch (e) { console.warn("Vanilla not found", e); }


        let ts = otaInfo.datetime ?? otaInfo.response?.[0]?.datetime;
        const lastUpdated = ts ? new Date(ts * (ts < 1e12 ? 1000 : 1)).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : "Unknown";

        const changelog = await fetch(`https://raw.githubusercontent.com/yaap/ota-info/${otaBranch}/${codename}/Changelog.txt`).then(r => r.text());

        // Update Page Title
        document.title = `${deviceInfo.name} - YAAP`;

        deviceContainer.innerHTML = `
            <div class="device-header">
                <h1 class="device-title">${deviceInfo.name}</h1>
                <div class="device-codename">${codename}</div>
            </div>

            <div class="device-grid">
                <div class="info-card fade-in">
                    <img src="${deviceInfo.image || 'https://raw.githubusercontent.com/yaap/device-info/master/placeholder.png'}" alt="${deviceInfo.name}" class="device-image">
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Maintainer</span>
                            <span class="info-value">${deviceInfo.maintainer || "Unknown"}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Last Updated</span>
                            <span class="info-value">${lastUpdated}</span>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <a href="https://mirror.codebucket.de/yaap/${codename}/" class="btn-primary" target="_blank">
                            Download Build
                        </a>
                        <a href="${deviceInfo.group}" class="btn-secondary" target="_blank">
                            Support Group
                        </a>
                    </div>
                </div>
            </div>

            <div class="changelog-section fade-in" style="animation-delay: 0.1s;">
                 <h3 class="changelog-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Installation Instructions
                </h3>
                <div id="instructions-list" class="markdown-content changelog-content">
                    Loading instructions...
                </div>
            </div>

            <div class="changelog-section fade-in" style="animation-delay: 0.2s;">
                <h3 class="changelog-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Latest Changelog
                </h3>
                <div class="changelog-content markdown-content">
                    ${window.markdownit({ html: true, linkify: true, typographer: true, breaks: true }).render(changelog)}
                </div>
            </div>
        `;

        // Load Flashing Instructions
        fetch(`https://raw.githubusercontent.com/yaap/device-info/master/${codename}/${codename}.md`).then(res => res.text()).then(md => {
            const container = document.getElementById('instructions-list');
            if (container) {
                container.innerHTML = window.markdownit({ html: true, linkify: true, typographer: true, breaks: true }).render(md);
            }
        }).catch(() => {
            const container = document.getElementById('instructions-list');
            if (container) container.innerHTML = "No specific instructions found.";
        });

    } catch (err) {
        console.error(err);
        deviceContainer.innerHTML = `
            <div class="no-results">
                <h2>Device Not Found</h2>
                <p>We couldn't load information for this device.</p>
                <a href="/" class="btn-primary" style="margin-top: 20px; display: inline-block;">Go Back Home</a>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", loadDevice);
