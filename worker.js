if (!process.env.REDIS_URL) return
if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const os = require('os')
const Queue = require('bull')

const jobs = [{
  path: __dirname + '/jobs/expire-abandoned-carts.js',
  name: 'expireAbandonedCarts'
}]

for (const job of jobs) {

  const queue = new Queue(os.hostname + '-' + process.pid, process.env.REDIS_URL)

  queue.process('*', 1, job.path)

  // Repeat job once every minute
  queue.add(job.name, {}, { repeat: { cron: '* * * * *' } })

  queue.on('error', (error) => {
    console.log('queue error', error)
  })

  queue.on('completed', (job, result) => {
    console.log(result, `[queue completed at ${new Date().toISOString()}]`)
  })

  queue.on('failed', (job, err) => {
    console.log('queue failed', err)
  })

}