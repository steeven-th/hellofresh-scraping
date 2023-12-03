// Function to scrape preparation steps
export async function scrapeSteps(page) {
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