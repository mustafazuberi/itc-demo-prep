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
        const content = await page.content();
        if (!content.includes('Congratulations student. You successfully logged in!')) {
            throw new Error('Login failed: Did not navigate to success page and success text not found!');
        }
    }
    console.log('Login appears successful, navigating to Courses tab...');

    await page.waitForSelector('a[href="https://practicetestautomation.com/courses/"]', { timeout: 20000 });
    await page.click('a[href="https://practicetestautomation.com/courses/"]');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => {
        console.warn('[Courses] Navigation (DOMContentLoaded) did not complete in time, checking URL directly');
    });

    if (!page.url().includes('courses')) {
        console.warn('Did not reach Courses page by URL check, continuing anyway...');
    } else {
        console.log('Confirmed navigation to Courses page!');
    }

    console.log('At Courses page, taking screenshot...');
    await page.screenshot({ path: 'courses-page.png' });

    // --- AGENTQL scraping would start here ---
    console.log('Ready to use agentql on the courses page');
    await browser.close();
    console.log('Browser closed, script complete.');
}

main();
