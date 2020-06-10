import {appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from "fs";
import {relative, resolve, sep} from "path";
import gherkin from 'gherkin'
import {io} from "cucumber-messages/dist/src/cucumber-messages";
import handlebars, {registerPartial} from 'handlebars'
import IGherkinDocument = io.cucumber.messages.IGherkinDocument;

type OptionalString = string | null | undefined

type Step = {
    keyword: OptionalString
    text: OptionalString
}
type Scenario = {
    description: OptionalString
    requiredKeywords: OptionalString
    steps: Step[]
}
type Feature = {
    featureFile: OptionalString
    scenarios: Scenario[]
}

const TEMPLATE_FEATURE_NAME = '{{featureName}}'
const TEMPLATE_FEATURE = `${__dirname}/templates/Feature.handlebars`
const TEMPLATE_SCENARIO = `${__dirname}/templates/Scenario.handlebars`
const TEMPLATE_STEP = `${__dirname}/templates/Step.handlebars`

const DIR_FEATURES = './src/features/'
const OUTPUT_FILE_FORMAT = `./src/features/steps/${TEMPLATE_FEATURE_NAME}Steps.test.tsx`

function getFiles(directory: string = DIR_FEATURES): string[] {
    const entries = readdirSync(directory, {withFileTypes: true});
    const files: string[] = []

    for (const entry of entries) {
        const res = resolve(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...getFiles(res))
        } else {
            files.push(res)
        }
    }

    return files
}

function getFeatureDetails(document: IGherkinDocument) {
    const fileNameParts = document.uri?.split(sep) ?? ["unknown"]
    const fileName = fileNameParts[fileNameParts.length - 1].replace(".feature", "")
    const featureFile = DIR_FEATURES + document.uri?.replace(/\\/g, '/').split(DIR_FEATURES.replace('.', ''))[1]

    const scenarios = document.feature?.children?.map(({scenario}) => {
        const steps: Step[] = scenario?.steps?.map(({keyword, text}) =>
            ({keyword: keyword?.toLowerCase()?.trim(), text})) ?? []

        const requiredKeywords = Array.from(new Set(steps.map(step => step.keyword))).join(', ')

        return {
            description: scenario?.name,
            requiredKeywords,
            steps
        }
    }) ?? []

    return {fileName, featureFile, scenarios}
}

function createFeatureStepFile(filePath: string, feature: Feature) {
    const template = handlebars.compile(featureTemplate)
    const output = template(feature)

    writeFileSync(filePath, output, 'utf8')
}

function appendNewStepsToExistingFeatureFile(filePath: string, feature: Feature): string | undefined {
    const existingFile = readFileSync(filePath, 'utf8')
    const newData = getMissingFeatureData(feature, existingFile);

    if (newData.length > 0) {
        appendFileSync(filePath, newData.join('\n'), 'utf8')
        return filePath
    }
}

function getMissingFeatureData(feature: Feature, existingFileData: string): string[] {
    const newScenarios = ["// ---- New Scenarios ---"]
    const newSteps = ["// ---- New Steps ---"]

    feature.scenarios.forEach(scenario => {
        const missingScenarioBlock = getMissingScenarioBlock(scenario, existingFileData)
        if (missingScenarioBlock) {
            newScenarios.push(missingScenarioBlock)
            return
        }

        scenario.steps?.forEach(step => {
            const missingStepBlock = getMissingStepBlocks(scenario, step, existingFileData)
            if(missingStepBlock){
                newSteps.push(...missingStepBlock)
            }
        })
    })

    return [
        ...(newScenarios.length > 1 ? newScenarios : []),
        ...(newSteps.length > 1 ? newSteps : [])
    ]
}

function getMissingScenarioBlock(scenario: Scenario, existingFileData: string): string | undefined {
    if (scenario.description && !existingFileData.includes(scenario.description)) {
        const template = handlebars.compile(scenarioTemplate)
        return template(scenario)
    }
}

function getMissingStepBlocks(scenario: Scenario, step: Step, existingFileData: string): string[] | undefined {
    if (step.text && !existingFileData.includes(step.text)) {
        const template = handlebars.compile(stepTemplate)

        return [
            `// New step for scenario '${scenario.description}'`,
            template(step)
        ]
    }
}

function printUpdateDetails(createdFiles: string[], updatedFiles: string[]) {
    if (createdFiles.length > 0) {
        console.log(`
            The following files have been created: 
                ${createdFiles.join("\n")}
            `)
    }

    if (updatedFiles.length > 0) {
        console.log(`
            The following files have been updated:
            
                ${updatedFiles.join("\n")}
                
            As we cannot insert changed features into the correct code blocks, you will need to move them manually.
            New scenarios or steps for scenarios are listed at the bottom of each file.
            `)
    }

    if (createdFiles.length === 0 && updatedFiles.length === 0) {
        console.log("No updates required, all features match tests")
    }
}

const gherkinPaths = getFiles(DIR_FEATURES).filter(fileName => fileName.includes('.feature'))
const outputDir = OUTPUT_FILE_FORMAT.split(TEMPLATE_FEATURE_NAME)[0]

const features: Record<string, Feature> = {}

const featureTemplate = readFileSync(TEMPLATE_FEATURE, 'utf8')
const scenarioTemplate = readFileSync(TEMPLATE_SCENARIO, 'utf8')
const stepTemplate = readFileSync(TEMPLATE_STEP, 'utf8')

registerPartial('scenario', scenarioTemplate)
registerPartial('step', stepTemplate)

if (!existsSync(outputDir)) {
    mkdirSync(outputDir)
}

gherkin.fromPaths(gherkinPaths, {includePickles: false})
    .on('data', it => {
        if (it.gherkinDocument) {
            const {fileName, featureFile, scenarios} = getFeatureDetails(it.gherkinDocument as IGherkinDocument);
            features[fileName] = {featureFile, scenarios}
        }
    })
    .on('end', () => {
        const updatedFiles: string[] = []
        const createdFiles: string[] = []

        Object.keys(features).forEach(key => {
            const filePath = OUTPUT_FILE_FORMAT.replace(TEMPLATE_FEATURE_NAME, key)
            const feature = features[key]

            if (existsSync(filePath)) {
                const updatedFile = appendNewStepsToExistingFeatureFile(filePath, feature);

                if (updatedFile) {
                    updatedFiles.push(updatedFile)
                }

                return
            }

            createFeatureStepFile(filePath, feature);
            createdFiles.push(filePath)
        })

        printUpdateDetails(createdFiles, updatedFiles);
    })



