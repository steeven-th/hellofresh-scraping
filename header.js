// Function to scrape title
export async function scrapeTitle(page) {
    const elmtTitle = await page.$('.jeetYO');

    const h1 = await elmtTitle.$eval('h1', node => node.textContent);
    const h2 = await elmtTitle.$eval('h2', node => node.textContent);

    return h1 + ' ' + h2;
}

// Function to scrape Hero image
export async function scrapImage(page) {
    const elmtImage = await page.$('.KGVMo');

    return await elmtImage.$eval('img', node => node.src);
}