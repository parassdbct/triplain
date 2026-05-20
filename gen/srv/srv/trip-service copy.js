const cds = require('@sap/cds');

const TRIPPIN = 'https://services.odata.org/V4/TripPinServiceRW';

module.exports = class TripAppService extends cds.ApplicationService {

    async init() {

        // READ People from TripPin
        this.on('READ', 'People', async (req) => {
            try {
                const res = await fetch(
                    `${TRIPPIN}/People?$format=json`
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

                // Get from TripPin
                const res = await fetch(
                    `${TRIPPIN}/People('${userName}')?$format=json`
                );
                if (!res.ok) {
                    return req.error(404,
                        `Person '${userName}' not found`
                    );
                }
                const person = await res.json();

                // Get from SQLite / HANA Cloud
                const custom = await SELECT.one
                    .from('tripapp.PersonCustomData')
                    .where({ userName });

                // Return combined
                return {
                    userName : person.UserName,
                    firstName: person.FirstName,
                    lastName : person.LastName,
                    gender   : person.Gender,
                    email    : person.Emails?.[0] || '',
                    comments : custom?.comments  || '',
                    status   : custom?.status    || 'New',
                    createdBy: custom?.createdBy || '',
                    createdAt: custom?.createdAt || null
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

                // Validate required fields
                if (!userName || !firstName || !lastName) {
                    return req.error(400,
                        'userName, firstName, lastName are required'
                    );
                }

                // Step 1 - Create in TripPin
                const res = await fetch(`${TRIPPIN}/People`, {
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
                // Using string reference NOT this.entities
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
                // TripPin response fields can be null
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

                // Check if record exists
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

                // Return updated combined data
                return await this.send(
                    'getPersonDetails', { userName }
                );

            } catch (err) {
                req.error(500, 'Update error: ' + err.message);
            }
        });

        await super.init();
    }
}