sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"people/test/integration/pages/PeopleList",
	"people/test/integration/pages/PeopleObjectPage"
], function (JourneyRunner, PeopleList, PeopleObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('people') + '/test/flp.html#app-preview',
        pages: {
			onThePeopleList: PeopleList,
			onThePeopleObjectPage: PeopleObjectPage
        },
        async: true
    });

    return runner;
});

