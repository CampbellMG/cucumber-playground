import {defineFeature, loadFeature} from "jest-cucumber";

const feature = loadFeature('./src/features/app.feature')

defineFeature(feature, test => {
    
    test('Opening the home screen', ({ given, and, when, then }) => {
        
        given('that the app is running', () => {
        })
        
        and('new test', () => {
        })
        
        when('Campbell opens the app', () => {
        })
        
        and('another condition', () => {
        })
        
        then('the app shows home screen', () => {
        })
    })
    
    test('Another test scenario', ({ given, when, then, pending }) => {
        
        given('a new scenario', () => {
        })
        
        when('adding the value', () => {
        })
        
        then('value should be in test', () => {
            expect("An expected result").toEqual("An expected result")
        })
    })
})
