const puppeteer = require("puppeteer");

// Because everything in Puppeteer is asynchronous,
// we wrap all of our code inside of an async IIFE
(async () => {
    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: false });

    // Create a new page
    const page = await browser.newPage();

    // Go to URL
    await page.goto("https://www.hellofresh.fr/recipes/bowl-de-saumon-teriyaki-and-avocat-64fae7c632e9107c6db86ea7");

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    // Initialize the object that will contain the datas
    const datas = {};

    // Call the function to scrape Hero image
    datas.image = await scrapImage(page);

    // Call the function to scrape title
    datas.title = await scrapeTitle(page);

    // Call the function to scrape preparation time
    datas.informations = await scrapeInformations(page);

    // Call the function to scrape ingredients
    datas.ingredients = await scrapeIngredients(page);

    // Call the function to scrape preparation ustensils
    datas.ustensils = await scrapeUstensils(page);

    // Call the function to scrape preparation steps
    datas.steps = await scrapeSteps(page);

    // Afficher dans la console les datas
    console.log(datas);

    // Afficher en JSON
    console.log(JSON.stringify(datas));

    await browser.close();
})();

// Function to scrape Hero image
async function scrapImage(page) {
    const elmtImage = await page.$('.KGVMo');

    return await elmtImage.$eval('img', node => node.src);
}

// Function to scrape title
async function scrapeTitle(page) {
    const elmtTitle = await page.$('.jeetYO');

    const h1 = await elmtTitle.$eval('h1', node => node.textContent);
    const h2 = await elmtTitle.$eval('h2', node => node.textContent);

    return h1 + ' ' + h2;
}

// Function to scrape preparation time
async function scrapeInformations(page) {

    // ATTENTION : ne fonctionne que si { headless: false } est activé dans le launch de puppeteer
    const buttonFor100g = await page.$('[aria-label="per-100g"]');
    await buttonFor100g.click();

    const elmtInformations = await page.$$('.kimgtP');
    const informations = [];

    for (const elmt of elmtInformations) {
        const title = await elmt.$eval('.kUCRYF', node => node.textContent);
        const info = await elmt.$eval('.eZjiGJ', node => node.textContent);

        const information = {};
        information[title] = info;
        informations.push(information);
    }

    return informations;
}

// Function to scrape ingredients from an element
async function scrapeIngredients(page) {

    // ATTENTION : ne fonctionne que si { headless: false } est activé dans le launch de puppeteer
    const buttonFor2Portions = await page.$('[aria-label="2"]');
    await buttonFor2Portions.click();

    const elmtIngredients = await page.$$('.eOyORz');
    const ingredients = [];

    for (const elmt of elmtIngredients) {
        const subElmts = await elmt.$$('*');

        for (const subElmt of subElmts) {
            const p = await subElmt.$$('p');

            if (p.length) {
                const ingredient = await p[1].evaluate(node => node.textContent);
                const ingredientQty = await p[0].evaluate(node => node.textContent);

                const ingredientData = {};
                ingredientData[ingredient] = ingredientQty;
                ingredients.push(ingredientData);
            }
        }
    }

    return ingredients;
}

// Function to scrape preparation ustensils
async function scrapeUstensils(page) {
    const ustensilsDatas = await page.$('[data-test-id="utensils"]');
    const elmtUstensils = await ustensilsDatas.$$('.fivcnB');
    const ustensils = [];

    for (const elmt of elmtUstensils) {
        const ustensil = await elmt.evaluate(node => node.textContent);
        ustensils.push(ustensil);
    }

    return ustensils;
}

// Function to scrape preparation steps
async function scrapeSteps(page) {
    const stepsDatas = await page.$('[data-test-id="instructions"]');
    const elmtSteps = await stepsDatas.$$('.ewFuly');

    const steps = [];
    let i = 0;
    for (const elmt of elmtSteps) {
        const img = await elmt.$eval('img', img => img.getAttribute('src'));
        const description = await elmt.$eval('ul', ul => ul.textContent);

        const step = {};
        step[i] = { img, description };
        steps.push(step);
        i++;
    }

    return steps;
}

// Function for convert get HTML from an element to text
async function getTextFromElement(page, elementSelector) {
    return await page.evaluate(elementSelector => elementSelector.outerHTML, elementSelector);
}