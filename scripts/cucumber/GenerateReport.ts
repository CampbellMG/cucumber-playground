import {generate} from "cucumber-html-reporter";

generate({
    theme: 'bootstrap',
    jsonFile: './report.json',
    output: './report.html',
    reportSuiteAsScenarios: true,
    launchReport: false
})
