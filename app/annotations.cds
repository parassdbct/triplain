using TripAppService from '../srv/trip-service';

// ─────────────────────────────────────
// PEOPLE — List Page
// ─────────────────────────────────────
annotate TripAppService.People with @(

    UI.HeaderInfo: {
        TypeName      : 'Person',
        TypeNamePlural: 'People',
        Title         : { Value: UserName },
        Description   : { Value: FirstName }
    },

    UI.LineItem: [
        {
            $Type: 'UI.DataField',
            Value: UserName,
            Label: 'Username'
        },
        {
            $Type: 'UI.DataField',
            Value: FirstName,
            Label: 'First Name'
        },
        {
            $Type: 'UI.DataField',
            Value: LastName,
            Label: 'Last Name'
        },
        {
            $Type: 'UI.DataField',
            Value: Gender,
            Label: 'Gender'
        },
        {
            $Type: 'UI.DataField',
            Value: Email,
            Label: 'Email'
        }
    ],

    UI.SelectionFields: [
        UserName,
        FirstName,
        LastName
    ],

    UI.FieldGroup #PersonDetails: {
        Label: 'Person Details',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: UserName,
                Label: 'Username'
            },
            {
                $Type: 'UI.DataField',
                Value: FirstName,
                Label: 'First Name'
            },
            {
                $Type: 'UI.DataField',
                Value: LastName,
                Label: 'Last Name'
            },
            {
                $Type: 'UI.DataField',
                Value: Gender,
                Label: 'Gender'
            },
            {
                $Type: 'UI.DataField',
                Value: Email,
                Label: 'Email'
            }
        ]
    },

    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Person Details',
            Target: '@UI.FieldGroup#PersonDetails'
        }
    ]
);

// ─────────────────────────────────────
// CUSTOM DATA — List Page + Detail
// ─────────────────────────────────────
annotate TripAppService.CustomData with @(

    UI.HeaderInfo: {
        TypeName      : 'Custom Data',
        TypeNamePlural: 'Custom Data',
        Title         : { Value: userName },
        Description   : { Value: status }
    },

    UI.LineItem: [
        {
            $Type: 'UI.DataField',
            Value: userName,
            Label: 'Username'
        },
        {
            $Type: 'UI.DataField',
            Value: comments,
            Label: 'Comments'
        },
        {
            $Type: 'UI.DataField',
            Value: status,
            Label: 'Status'
        },
        {
            $Type: 'UI.DataField',
            Value: createdBy,
            Label: 'Created By'
        },
        {
            $Type: 'UI.DataField',
            Value: createdAt,
            Label: 'Created At'
        }
    ],

    UI.FieldGroup #CustomInfo: {
        Label: 'Custom Information',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: userName,
                Label: 'Username'
            },
            {
                $Type: 'UI.DataField',
                Value: comments,
                Label: 'Comments'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            },
            {
                $Type: 'UI.DataField',
                Value: createdBy,
                Label: 'Created By'
            },
            {
                $Type: 'UI.DataField',
                Value: createdAt,
                Label: 'Created At'
            },
            {
                $Type: 'UI.DataField',
                Value: updatedBy,
                Label: 'Updated By'
            },
            {
                $Type: 'UI.DataField',
                Value: updatedAt,
                Label: 'Updated At'
            }
        ]
    },

    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Custom Information',
            Target: '@UI.FieldGroup#CustomInfo'
        }
    ]
);
