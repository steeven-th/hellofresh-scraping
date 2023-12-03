// Function to scrape ingredients from an element
export async function scrapeIngredients(page) {

    // ATTENTION : ne fonctionne que si { headless: false } est activé dans le launch de puppeteer
    const buttonFor2Portions = await page.$('[aria-label="2"]');
    await buttonFor2Portions.click();

    const elmtIngredients = await page.$$('.eOyORz');
    const ingredients = [];
    let imgSrc = '';
    for (const elmt of elmtIngredients) {
        const subElmts = await elmt.$$('*');

        for (const subElmt of subElmts) {
            const img = await subElmt.$$('img');

            if (img.length) {
                imgSrc = await img[0].evaluate(node => node.getAttribute('src'));
            }

            const p = await subElmt.$$('p');

            if (p.length) {
                const ingredient = await p[1].evaluate(node => node.textContent);
                const ingredientQty = await p[0].evaluate(node => node.textContent);

                const ingredientData = {};
                ingredientData[ingredient] = [imgSrc, ingredientQty];
                ingredients.push(ingredientData);
            }
        }
    }

    return ingredients;
}