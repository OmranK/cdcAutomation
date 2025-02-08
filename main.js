
// const searchTermCLI = process.argv >= 3 ? process.argv[2] : null;

import fs from 'fs';
import csv from 'csv-parser';
import puppeteer from "puppeteer";

const filePath = './input.csv';

// Define the object structure
class Person {
    constructor(uuid, sex, ageyears, height, weight) {
      this.uuid = uuid
      this.sex = sex
      this.age = ageyears
      this.height = height
      this.weight = weight
      this.healthy = ""
      this.underweight = ""
      this.overweight = ""
      this.obesity = ""
      this.severeObesity = ""
    }
}
  
const people = [];

fs.createReadStream(filePath)
.pipe(csv())
.on('data', (row) => {
    const person = new Person(row.uuid, row.sex, row.ageyears, row.height, row.weight);
    people.push(person);
})
.on('end', () => {
    console.log("Sucessfully mapped input");
});

(async() => {
    createCSVFile()
    const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] } );
    const page = await browser.newPage();
    await page.setViewport({width: 1512, height: 982, isMobile: false, hasTouch: false, deviceScaleFactor: 1});
    await page.goto("https://www.cdc.gov/bmi/child-teen-calculator/index.html");
    for (const person of people) {
        if (!person.height, !person.weight, !person.age, !person.sex) {
            person.healthy = "error";
            appendPersonToCSV(person)
        } else {
            await page.waitForSelector('#metric_units_radio', {visible: true});
            await page.click('#metric_units_radio');
            if (person.sex === "1") {
                await page.waitForSelector('#sex_boy_radio');
                await page.click('#sex_boy_radio');
            } else if (person.sex === "2") {
                await page.waitForSelector('#sex_girl_radio');
                await page.click('#sex_girl_radio');
            }

            await page.waitForSelector('#age_years_input');
            await page.type('#age_years_input', person.age);
            await page.waitForSelector('#height_cm_input');
            await page.type('#height_cm_input', person.height);
            await page.waitForSelector('#weight_kg_input');
            await page.type('#weight_kg_input', person.weight);
            await page.waitForSelector('#calculate_btn');
            await page.click('#calculate_btn');
            await page.waitForSelector('#calc_results', {visible: true});
            let element = await page.waitForSelector('.bmi_category', {visible: true});
            let bmiCategory = await element.evaluate(el => el.textContent);
            switch (bmiCategory) {
                case "Healthy Weight":
                    person.healthy = "1"
                    break;
                case "Obesity":
                    person.obesity = "1"
                    break;
                case "Overweight":
                    person.overweight = "1"
                    break;
                case "Underweight":
                    person.underweight = "1"
                    break;
                case "Severe Obesity":
                    person.severeObesity = "1"
                    break;
            }
            appendPersonToCSV(person)
            await page.click('.back_btn');
        }
    }
    await browser.close();
})();

function createCSVFile() {
    const headers = [
        'uuid', 'sex', 'age', 'height', 'weight', 
        'healthy', 'underweight', 'overweight', 'obesity', 'severeObesity'
    ];
    const csvString = headers.join(',') + '\n';  // Create the CSV string with headers

    // Write the CSV file with headers, creating the file if it doesn't exist
    fs.writeFileSync('output.csv', csvString, 'utf8');
}

// Function to append a person to the CSV file
function appendPersonToCSV(person) {
    const row = [
        person.uuid,
        person.sex,
        person.age,
        person.height,
        person.weight,
        person.healthy,
        person.underweight,
        person.overweight,
        person.obesity,
        person.severeObesity
    ];
    const csvRow = row.join(',') + '\n';  // Join values with commas and add newline

    // Append the person data to the CSV file
    fs.appendFileSync('output.csv', csvRow, 'utf8');
    console.log(`Person ${person.uuid} data appended to output.csv`);
}