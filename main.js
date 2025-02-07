
// const searchTermCLI = process.argv >= 3 ? process.argv[2] : null;

import fs from 'fs';
import csv from 'csv-parser';
import puppeteer from "puppeteer";

const filePath = './input.csv';

// Define the object structure
class Person {
    constructor(uuid, sex, ageyears, height, weight) {
      this.uuid = uuid;
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
    const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] } );
    const page = await browser.newPage();
    await page.setViewport({width: 1512, height: 982, isMobile: false, hasTouch: false, deviceScaleFactor: 1});
    await page.goto("https://www.cdc.gov/bmi/child-teen-calculator/index.html");
    for (const person of people) {
        // console.log("Attempting to parse - " + row);
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
        await page.click('.back_btn');
    }
    console.log(people)
    await browser.close();
})();