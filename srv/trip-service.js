const cds = require('@sap/cds');

// ─────────────────────────────────────
// TripPin Session Manager
// Gets session once and caches it
// Auto refreshes if expired
// ─────────────────────────────────────
const TRIPPIN_BASE = 'https://services.odata.org/V4/TripPinServiceRW';
let sessionUrl = null;
let sessionExpiry = null;

async function getTripPinSession() {

    // Return cached session if still valid
    if (sessionUrl && sessionExpiry && new Date() < sessionExpiry) {
        return sessionUrl;
    }

    try {
        console.log('Getting new TripPin session...');

        // Call TripPin — it redirects to session URL
        const res = await fetch(
            `${TRIPPIN_BASE}/People?$top=1`,
            { redirect: 'follow' }
        );

        // Get the final redirected URL
        const finalUrl = res.url;
        console.log('TripPin redirected to:', finalUrl);

        // Extract session URL
        // e.g. https://services.odata.org/V4/(S(abc123))/TripPinServiceRW
        const match = finalUrl.match(
            /(https:\/\/services\.odata\.org\/V4\/\(S\([^)]+\)\)\/TripPinServiceRW)/
        );

        if (match) {
            sessionUrl = match[1];
            // Cache session for 10 minutes
            sessionExpiry = new Date(Date.now() + 10 * 60 * 1000);
            console.log('Session cached:', sessionUrl);
            console.log('Expires at:', sessionExpiry);
        } else {
            // Fallback to base URL
            sessionUrl = TRIPPIN_BASE;
            sessionExpiry = new Date(Date.now() + 5 * 60 * 1000);
        }

        return sessionUrl;

    } catch (err) {
        console.log('Session error:', err.message);
        return TRIPPIN_BASE;
    }
}

module.exports = class TripAppService extends cds.ApplicationService {

    async init() {

        // READ People from TripPin
        this.on('READ', 'People', async (req) => {
            try {
                const BASE = await getTripPinSession();
                console.log('Using session:', BASE);

                const res = await fetch(
                    `${BASE}/People?$format=json`
                );
                if (!res.ok) {
                    return req.error(res.status, 'TripPin read failed');
                }
                const data = await res.json();
                return data.value.map(p => ({
                    UserName : p.UserName,
                    FirstName: p.FirstName,
                    LastName : p.LastName,
                    Gender   : p.Gender,
                    Email    : p.Emails?.[0] || ''
                }));
            } catch (err) {
                req.error(500, 'TripPin read error: ' + err.message);
            }
        });

        // FUNCTION - Get combined person details
        this.on('getPersonDetails', async (req) => {
            try {
                const { userName } = req.data;
                const BASE = await getTripPinSession();

                // Try TripPin
                let person = null;
                try {
                    const res = await fetch(
                        `${BASE}/People('${userName}')?$format=json`
                    );
                    if (res.ok) {
                        const text = await res.text();
                        if (text && text.trim() !== '') {
                            person = JSON.parse(text);
                        }
                    }
                } catch (e) {
                    console.log('TripPin person fetch failed:', e.message);
                }

                // Get from SQLite / HANA Cloud
                const custom = await SELECT.one
                    .from('tripapp.PersonCustomData')
                    .where({ userName });

                if (!person && !custom) {
                    return req.error(404,
                        `Person '${userName}' not found`
                    );
                }

                return {
                    userName : person?.UserName    || userName,
                    firstName: person?.FirstName   || '',
                    lastName : person?.LastName    || '',
                    gender   : person?.Gender      || '',
                    email    : person?.Emails?.[0] || '',
                    comments : custom?.comments    || '',
                    status   : custom?.status      || 'New',
                    createdBy: custom?.createdBy   || '',
                    createdAt: custom?.createdAt   || null
                };

            } catch (err) {
                req.error(500,
                    'Error getting details: ' + err.message
                );
            }
        });

        // ACTION - Create person in TripPin + save to SQLite/HANA
        this.on('createPerson', async (req) => {
            try {
                const {
                    userName, firstName, lastName,
                    gender, email, comments, status
                } = req.data;

                // Validate
                if (!userName || !firstName || !lastName) {
                    return req.error(400,
                        'userName, firstName, lastName are required'
                    );
                }

                // Get same session
                const BASE = await getTripPinSession();
                console.log('Creating in TripPin session:', BASE);

                // Step 1 - Create in TripPin
                const res = await fetch(`${BASE}/People`, {
                    method : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept'      : 'application/json'
                    },
                    body: JSON.stringify({
                        UserName : userName,
                        FirstName: firstName,
                        LastName : lastName,
                        Gender   : gender || 'Male',
                        Emails   : email ? [email] : []
                    })
                });

                console.log('TripPin POST status:', res.status);

                // Step 2 - Save to SQLite / HANA Cloud
                await INSERT.into('tripapp.PersonCustomData')
                    .entries({
                        ID       : cds.utils.uuid(),
                        userName,
                        comments : comments || '',
                        status   : status   || 'New',
                        createdBy: req.user?.id || 'system',
                        createdAt: new Date()
                    });

                // Step 3 - Return using request data
                return {
                    userName,
                    firstName,
                    lastName,
                    gender   : gender   || 'Male',
                    email    : email    || '',
                    comments : comments || '',
                    status   : status   || 'New',
                    createdBy: req.user?.id || 'system',
                    createdAt: new Date()
                };

            } catch (err) {
                req.error(500, 'Create error: ' + err.message);
            }
        });

        // ACTION - Update custom data (SQLite / HANA Cloud only)
        this.on('updateCustomData', async (req) => {
            try {
                const { userName, comments, status } = req.data;

                if (!userName) {
                    return req.error(400, 'userName is required');
                }

                const existing = await SELECT.one
                    .from('tripapp.PersonCustomData')
                    .where({ userName });

                if (existing) {
                    await UPDATE('tripapp.PersonCustomData')
                        .where({ userName })
                        .with({
                            comments : comments || existing.comments,
                            status   : status   || existing.status,
                            updatedBy: req.user?.id || 'system',
                            updatedAt: new Date()
                        });
                } else {
                    await INSERT.into('tripapp.PersonCustomData')
                        .entries({
                            ID       : cds.utils.uuid(),
                            userName,
                            comments : comments || '',
                            status   : status   || 'New',
                            createdBy: req.user?.id || 'system',
                            createdAt: new Date()
                        });
                }

                return await this.send(
                    'getPersonDetails', { userName }
                );

            } catch (err) {
                req.error(500, 'Update error: ' + err.message);
            }
        });
// // Person 2 was here
        await super.init();
    }
}