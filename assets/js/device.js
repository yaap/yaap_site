async function loadDevice() {
    const params = new URLSearchParams(window.location.search);
    const codename = params.get("codename");
    const deviceContainer = document.getElementById("device-container");

    try {
        const deviceInfo = await fetch(`https://raw.githubusercontent.com/yaap/device-info/master/${codename}/${codename}.json`).then(r => r.json());
        const otaBranch = deviceInfo["ota-branch"]
        const otaInfo = await fetch(`https://raw.githubusercontent.com/yaap/ota-info/${otaBranch}/${codename}/${codename}.json`).then(r => r.json());
        const vanillaOtaBranch = deviceInfo["ota-branch-vanilla"]
        const vanillaOtaInfo = await fetch(`https://raw.githubusercontent.com/yaap/ota-info/${vanillaOtaBranch}/${codename}/${codename}.json`).then(r => r.json());

        let ts = otaInfo.datetime ?? otaInfo.response ?. [0] ?. datetime;
        let vanillaTs = otaInfo.datetime ?? otaInfo.response ?. [0] ?. datetime;
        if (vanillaTs > ts) {
            ts = vanillaTs;
        }
        if (typeof ts === "string") {
            ts = parseInt(ts, 10);
        }

        const lastUpdated = ts ? new Date(ts * (ts < 1e12 ? 1000 : 1)).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : "Unknown";

        const latestGapps = otaInfo.filename ?? otaInfo.response ?. [0] ?. filename
        const latestVanilla = vanillaOtaInfo.filename ?? vanillaOtaInfo.response ?. [0] ?. filename

        const changelog = await fetch(`https://raw.githubusercontent.com/yaap/ota-info/${otaBranch}/${codename}/Changelog.txt`).then(r => r.text());

        deviceContainer.innerHTML = `
            <div class="device-card" style="padding-top: 30px;">
            <img src="${
                    deviceInfo.image || 'placeholder.jpg'
                }" alt="${
                    deviceInfo.name
                }">
                <div class="device-info">
                    <h2>${
                            deviceInfo.name
                        } (${codename})</h2>
                    <title>YAAP for ${
                            deviceInfo.name
                        }</title>
                        <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
                    <p class="device-meta">Maintainer: ${
                            deviceInfo.maintainer || "Unknown"
                        } | Last Updated: ${lastUpdated}</p>
                    <a class="download-btn" href="https://mirror.codebucket.de/yaap/${codename}/">Download</a>
                    <a class="download-btn" href="${
                            deviceInfo.group
                        }">Support Group</a>
                </div>
            </div>
            <div class="changelog-card">
            <h4>Latest Changelog</h4>
${changelog}

Latest GApps build: <code>${latestGapps}</code>
Latest Vanilla build: <code>${latestVanilla}</code>
            </div>
            <div class="changelog-card">
                <h2>Flashing Instructions</h2>
                <div id="instructions-list">Loading instructions...</div>

                </div>
            </div>
        `;

        fetch(`https://raw.githubusercontent.com/yaap/device-info/master/${codename}/${codename}.md`).then(res => res.text()).then(md => {
            const container = document.getElementById('instructions-list');
            if (!container)
                return;
            const parsed = window.markdownit({html: true, linkify: true, typographer: true, breaks: true}).render(md);
            container.innerHTML = parsed;
        }).catch(err => {
            const container = document.getElementById('instructions-list');
            if (container)
                container.innerHTML = "<p>Failed to load instructions.</p>";
        });
    } catch (err) {
        console.error(err);
        deviceContainer.innerHTML = "<p>Failed to load device info.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadDevice);
