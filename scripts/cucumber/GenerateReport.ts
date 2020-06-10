import {generate} from "cucumber-html-reporter";

generate({
    theme: 'bootstrap',
    jsonFile: './report.json',
    output: './reports/cucumber.html',
    reportSuiteAsScenarios: true,
    launchReport: false
})
