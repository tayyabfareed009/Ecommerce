// api/index.js  → This makes your entire server.js work on Vercel
import next from 'next';

// We are NOT using Next.js, but we borrow Vercel's node server trick
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Real trick: import your Express app
import '../server.js'; // This starts your server and exports "app"

// But wait! Your server.js does app.listen() → that kills Vercel
// So we must prevent app.listen() in serverless mode

// SOLUTION: Modify your server.js slightly (only 3 lines)