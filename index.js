import puppeteer from 'puppeteer'

const url = 'https://practicetestautomation.com/practice-test-login/'
const username = 'student'
const password = 'Password123'

async function main() {
    console.log('Launching browser in headless mode, full HD window...');
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--window-size=1920,1080',
        ],
        defaultViewport: {
            width: 1920,
            height: 1080,
        }
    });
    const page = await browser.newPage();

    console.log('Navigating to login page...');
    await page.goto(url);

    console.log('Filling username and password...');
    await page.waitForSelector('#username');
    await page.type('#username', username);
    await page.type('#password', password);

    console.log('Submitting login form...');
    const [res] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 45000 }).catch(e => e),
        page.click('#submit'),
    ]);
    if (res instanceof Error) {
        console.warn('Navigation did not occur after login, checking URL and content directly...');
    }
    console.log(`Current URL: ${page.url()}`);

    if (!page.url().includes('logged-in-successfully')) {
        // Try to check for success message on page to handle non-navigation SPA logins
        const content = await page.content();
        if (!content.includes('Congratulations student. You successfully logged in!')) {
            throw new Error('Login failed: Did not navigate to success page and success text not found!');
        }
    }
    console.log('Login appears successful, navigating to Courses tab...');

    console.log('At Courses page, taking screenshot...');
    await page.screenshot({ path: 'courses-page.png' });

    console.log('Ready to use agentql on the courses page');
    await browser.close();
    console.log('Browser closed, script complete.');
}

main();
