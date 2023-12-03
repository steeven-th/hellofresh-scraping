const puppeteer = require("puppeteer");
const request = require("request");

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

    await browser.close();

    const fs = require('fs');
    const PDFDocument = require('pdfkit');

    // Create a PDF document
    const doc = new PDFDocument({
        layout: 'landscape', // Set layout to landscape
        size: 'letter',       // Set paper size to letter
    });

    // Pipe the PDF content to a writable stream
    const stream = fs.createWriteStream('output.pdf');
    doc.pipe(stream);

    doc.margins = { top: 0, bottom: 0, left: 0, right: 0 };

    // Function to add a new page with content
    function addPageWithContent(content) {
        doc.addPage(); // Add a new page
        doc.text(content, 50, 50); // Add content to the page
    }

    function downloadImage(url) {
        return new Promise((resolve, reject) => {
            request.get(url, { encoding: 'binary' }, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const base64Image = Buffer.from(body, 'binary').toString('base64');
                    resolve(`data:image/jpeg;base64,${base64Image}`);
                } else {
                    reject(error || 'Failed to download image');
                }
            });
        });
    }

    async function addFirstPageContent(datas) {

        // Add title to the first page
        if (datas.title) {
            doc.fontSize(18).text(datas.title, 340, 20, { width: 400, align: 'left', continued: false, indent: 0 });
        }

        // Add image to the first page
        if (datas.image) {
            try {
                const imageData = await downloadImage(datas.image);
                doc.image(imageData, 340, 60, { width: 400 });
            } catch (error) {
                console.error('Error:', error);
            }
        }

        // Add information to the first page
        if (datas.informations && datas.informations.length > 0) {

            doc.strokeColor('#228800').lineWidth(2); // Red color

            // Draw a rectangle around the text
            doc.rect(20, 20, 300, 225).stroke();

            doc.fontSize(14).text('Informations:', 25, 25, {continued: false, indent: 0});
            doc.moveDown(); // Move down after the section title

            datas.informations.forEach((info) => {
                const key = Object.keys(info)[0];
                const value = info[key];
                doc.text(`${key}: ${value}`, {indent: 25});
            });
        }

        // Add ingredients to the first page
        if (datas.ingredients && datas.ingredients.length > 0) {

            doc.strokeColor('#228800').lineWidth(2); // Red color

            // Draw a rectangle around the text
            doc.rect(20, 250, 300, 340).stroke();

            doc.fontSize(14).text('Ingrédients:', 25, 255, {continued: false, indent: 0});
            doc.moveDown(); // Move down after the section title

            datas.ingredients.forEach((ingredient) => {
                const key = Object.keys(ingredient)[0];
                const value = ingredient[key];
                doc.text(`${key}: ${value}`, {continued: false, indent: 25});
            });
        }

        // Add ustensils to the first page
        if (datas.ustensils && datas.ustensils.length > 0) {

            doc.strokeColor('#228800').lineWidth(2); // Red color

            // Draw a rectangle around the text
            doc.rect(340, 350, 300, 240).stroke();

            doc.fontSize(14).text('Ustensils:', 345, 355, {continued: true});
            doc.moveDown().moveDown(); // Move down after the section title

            datas.ustensils.forEach((ustensil) => {
                doc.text(ustensil, {continued: false, indent: 25});
            });

            doc.moveDown(); // Move down after the ustensils section
        }
    }

    // Add content to the first page
    await addFirstPageContent(datas);

    // Add content to the second page
    addPageWithContent('Page 2 Content');

    // Save the PDF
    doc.end();

    // Close the stream when the PDF generation is complete
    stream.on('finish', () => {
        console.log('PDF created successfully.');
    });
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

        const buttonFor2Portions = await page.$('[aria-label="2"]');
        await buttonFor2Portions.click();

    // Si l'url est en .fr
    if (page.url().includes('.fr')) {
        const buttonFor100g = await page.$('[aria-label="per-100g"]');
        await buttonFor100g.click();
    }
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
