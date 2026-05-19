namespace tripapp;

entity PersonCustomData {
    key ID        : UUID;
        userName  : String(100);
        comments  : String(500);
        status    : String(20);
        createdBy : String(100);
        createdAt : DateTime;
        updatedBy : String(100);
        updatedAt : DateTime;
}

entity StatusValues {
    key code        : String(20);
        description : String(50);
}
