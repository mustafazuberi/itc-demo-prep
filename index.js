import puppeteer from 'puppeteer'
import axios from 'axios'

const url = 'https://practicetestautomation.com/practice-test-login/'
const username = 'student'
const password = 'Password123'
const AGENTQL_API_KEY = '1tRXrX42PW5UEHO_fr5PBRiXfUrs4HHueS1z7o0D7fNs2qK8R0UoTw';

// Now use list syntax to tell AgentQL to return an array of courses.
const FIELDS_QUERY = `{
  courses[] {
    title(The main title of a course as displayed on the page.)
    description(A visible description for the course, summary or details shown below or beside title.)
  }
}`;

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

    const coursesPageHtml = await page.content();
    
    console.log('Sending Courses page HTML to AgentQL to extract all course titles and descriptions...');
    try {
        const response = await axios.post(
            'https://api.agentql.com/v1/query-data',
            {
                query: FIELDS_QUERY,
                html: coursesPageHtml,
                params: { mode: 'fast' },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': AGENTQL_API_KEY,
                },
            }
        );
        if (response.data && response.data.data && Array.isArray(response.data.data.courses)) {
            console.log(`Found ${response.data.data.courses.length} course(s):`);
            console.log("Here is the scraped courses list: ", response.data.data.courses);
        } else {
            console.log('AgentQL raw response:', response.data);
        }
    } catch (error) {
        if (error.response) {
            console.error('AgentQL API error:', error.response.data);
        } else {
            console.error('AgentQL call failed:', error.message);
        }
    }

    await browser.close();
    console.log('Browser closed, script complete.');
}

main();
