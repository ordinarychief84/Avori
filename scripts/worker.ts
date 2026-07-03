// Local background worker: processes the job queue and retries webhook
// deliveries on a loop. Run with `npm run worker`.
import { runPendingJobs } from '../src/lib/jobs';
import { retryDueWebhooks } from '../src/lib/webhooks';

const INTERVAL_MS = 10_000;

async function tick() {
  try {
    const { ran, failed } = await runPendingJobs(25);
    const retried = await retryDueWebhooks(25);
    if (ran + failed + retried > 0) {
      console.log(`[worker] jobs ran=${ran} failed=${failed} webhooks retried=${retried}`);
    }
  } catch (e) {
    console.error('[worker] tick failed', e);
  }
}

console.log('[worker] started — polling every 10s (ctrl-c to stop)');
void tick();
setInterval(tick, INTERVAL_MS);
