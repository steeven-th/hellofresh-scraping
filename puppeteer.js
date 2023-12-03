import puppeteer from 'puppeteer';
import request from 'request';
import readlineSync from 'readline-sync'
import {scrapeTitle, scrapImage} from './header.js';
import {scrapeInformations} from './informations.js';
import {scrapeIngredients} from './ingredients.js';
import {scrapeUstensils} from './ustensils.js';
import {scrapeSteps} from './steps.js';
import fs from 'fs';
import PDFDocument from 'pdfkit';

// Function to get URL from user input
function getURLFromUser() {
     // Demande à l'utilisateur d'entrer l'URL
    return readlineSync.question('Entrez l\'URL : ');
}

// Because everything in Puppeteer is asynchronous,
// we wrap all of our code inside of an async IIFE
(async () => {

    // Get URL from user input
    const url = getURLFromUser();

    // Colors for the PDF
    const firstGreen = '#e6efc5';
    const secondGreen = '#8fc84e';
    const thirdGreen = '#5e9f43';


    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: false });

    // Create a new page
    const page = await browser.newPage();

    // Go to URL
    await page.goto(url);

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

    // Create a PDF document
    const doc = new PDFDocument({
        layout: 'landscape', // Set layout to landscape
        size: 'letter',       // Set paper size to letter
        margins: {
            top: 20,
            bottom: 20,
            left: 50,
            right: 50
        }
    });

    // Pipe the PDF content to a writable stream
    const stream = fs.createWriteStream('output.pdf');
    doc.pipe(stream);

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

    async function pageContent(datas) {

        // Add title to the first page
        if (datas.title) {
            doc.fillColor(thirdGreen).fontSize(18).text(datas.title, 340, 20, { width: 400, align: 'left', continued: false, indent: 0 });
        }

        doc.fillColor('#000000');

        // Add image to the first page
        if (datas.image) {
            try {
                const imageData = await downloadImage(datas.image);
                doc.image(imageData, 340, 60, { width: 425 });
            } catch (error) {
                console.error('Error:', error);
            }
        }

        // Add information to the first page
        if (datas.informations && datas.informations.length > 0) {

            doc.strokeColor(secondGreen).lineWidth(2); // Red color

            // Draw a rectangle around the text
            // doc.rect(20, 20, 300, 130).stroke();
            doc.rect(340, 355, 210, 150).stroke();

            doc.fontSize(10).text('Informations:', 345, 360, {continued: false, indent: 0});
            doc.moveDown(); // Move down after the section title

            datas.informations.forEach((info) => {
                const key = Object.keys(info)[0];
                const value = info[key];
                doc.fontSize(8).text(`${key}: ${value}`, {indent: 0});
            });
        }

        // Add ingredients to the first page
        if (datas.ingredients && datas.ingredients.length > 0) {

            doc.strokeColor(secondGreen).lineWidth(2); // Red color

            // Draw a rectangle around the text
            // doc.rect(20, 155, 300, 340).stroke();
            doc.rect(20, 20, 300, 570).stroke();

            doc.fontSize(10).text('Ingrédients pour 2 personnes:', 25, 25, {continued: false, indent: 0});
            doc.moveDown(); // Move down after the section title

            const downloadAndAddImage = async (imageURL) => {
                const imageData = await downloadImage(imageURL);
                doc.image(imageData, { width: 25 });
            };

            const processIngredients = async () => {
                let isFirstIteration = true;

                for (const ingredient of datas.ingredients) {
                    const key = Object.keys(ingredient)[0];
                    const value = ingredient[key];
                    await downloadAndAddImage(`${value[0]}`);// Appel de la fonction asynchrone pour le téléchargement de l'image

                    if (!isFirstIteration) {
                        doc.moveUp().moveUp() // Move up to the top of the image
                    } else {
                        doc.moveUp();
                        isFirstIteration = false;
                    }

                    doc.fontSize(8).text(`${key}: ${value[1]}`, { continued: false, indent: 35 });
                    doc.moveDown(); // Move down after the ingredient
                }
            };

            await processIngredients();
        }

        // Add ustensils to the first page
        if (datas.ustensils && datas.ustensils.length > 0) {

            doc.strokeColor(secondGreen).lineWidth(2); // Red color

            // Draw a rectangle around the text
            // doc.rect(340, 350, 300, 240).stroke();
            doc.rect(555, 355, 210, 150).stroke();

            doc.fontSize(10).text('Ustensils:', 560, 360, {continued: false});
            doc.moveDown(); // Move down after the section title

            datas.ustensils.forEach((ustensil) => {
                doc.fontSize(8).text(ustensil, {continued: false, indent: 0});
            });

            doc.moveDown(); // Move down after the ustensils section
        }

        doc.addPage(); // Add a new page

        // Add steps to the second page
        if (datas.steps && datas.steps.length > 0) {

            doc.strokeColor(secondGreen).lineWidth(2); // Red color

            // Draw a rectangle around the text
            // doc.rect(20, 20, 620, 570).stroke();
            doc.rect(20, 20, 745, 570).stroke();

            doc.fontSize(10).text('Préparation:', 25, 25, {continued: false});
            doc.moveDown(); // Move down after the section title

            const downloadAndAddImage = async (imageURL, y) => {
                const imageData = await downloadImage(imageURL);
                doc.image(imageData, 25, y, { width: 100 });
            };

            const processSteps = async () => {
                let loop = 1;
                let nextY = doc.y;

                for (const step of datas.steps) {
                    const key = Object.keys(step)[0];
                    const value = step[key];

                    if (loop > 1) {
                        nextY = nextY + 90;
                        loop++;
                    } else {
                        loop++;
                    }

                    if (value.img) {
                        await downloadAndAddImage(value.img, nextY);
                    }

                    // doc.fontSize(8).text(loop-1 + ':', 130, nextY, {continued: false, indent: 0});

                    doc.fontSize(8).text(value.description, 130, nextY, {continued: false, indent: 0});
                }
            };

            await processSteps();
        }
    }

    // Add content to the first page
    await pageContent(datas);

    // Save the PDF
    doc.end();

    // Close the stream when the PDF generation is complete
    stream.on('finish', () => {
        console.log('PDF created successfully.');
    });
})();
