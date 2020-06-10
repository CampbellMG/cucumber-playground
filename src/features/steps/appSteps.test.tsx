import {defineFeature, loadFeature} from "jest-cucumber";

const feature = loadFeature('./src/features/app.feature')

defineFeature(feature, test => {
    
    test('Opening the home screen', ({ given, and, when, then }) => {
        
        given('that the app is running', () => {
            throw new Error("TODO - fill feature step")
        })
        
        and('new test', () => {
            throw new Error("TODO - fill feature step")
        })
        
        when('Campbell opens the app', () => {
            throw new Error("TODO - fill feature step")
        })
        
        and('another condition', () => {
            throw new Error("TODO - fill feature step")
        })
        
        then('the app shows home screen', () => {
            throw new Error("TODO - fill feature step")
        })
    })
    
    test('Another test scenario', ({ given, when, then }) => {
        
        given('a new scenario', () => {
            throw new Error("TODO - fill feature step")
        })
        
        when('adding the value', () => {
            throw new Error("TODO - fill feature step")
        })
        
        then('value should be in test', () => {
            throw new Error("TODO - fill feature step")
        })
    })
})
