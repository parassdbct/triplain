using { tripapp as db } from '../db/schema';

service TripAppService @(path: '/trip') {

    @readonly
    @cds.persistence.skip
    entity People {
        key UserName  : String(100);
            FirstName : String(100);
            LastName  : String(100);
            Gender    : String(10);
            Email     : String(100);
    }

    entity CustomData
        as projection on db.PersonCustomData;

    @readonly
    entity StatusValues
        as projection on db.StatusValues;

    type PersonDetails {
        userName  : String(100);
        firstName : String(100);
        lastName  : String(100);
        gender    : String(10);
        email     : String(100);
        comments  : String(500);
        status    : String(20);
        createdBy : String(100);
        createdAt : DateTime;
    }

    action createPerson(
        userName  : String(100),
        firstName : String(100),
        lastName  : String(100),
        gender    : String(10),
        email     : String(100),
        comments  : String(500),
        status    : String(20)
    ) returns PersonDetails;

    function getPersonDetails(
        userName : String(100)
    ) returns PersonDetails;

    action updateCustomData(
        userName : String(100),
        comments : String(500),
        status   : String(20)
    ) returns PersonDetails;
}
