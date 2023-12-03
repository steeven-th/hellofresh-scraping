// Function to scrape preparation ustensils
export async function scrapeUstensils(page) {
    const ustensilsDatas = await page.$('[data-test-id="utensils"]');
    const elmtUstensils = await ustensilsDatas.$$('.fivcnB');
    const ustensils = [];

    for (const elmt of elmtUstensils) {
        const ustensil = await elmt.evaluate(node => node.textContent);
        ustensils.push(ustensil);
    }

    return ustensils;
}