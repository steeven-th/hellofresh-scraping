// Function to scrape preparation time
export async function scrapeInformations(page) {

    // ATTENTION : ne fonctionne que si { headless: false } est activé dans le launch de puppeteer

    const buttonFor2Portions = await page.$('[aria-label="2"]');
    await buttonFor2Portions.click();

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