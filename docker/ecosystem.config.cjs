module.exports = {
  apps: [{
    name: 'flex-academy-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '400M',
    env: {
      NODE_ENV: 'production'
    },
    kill_timeout: 5000,
    listen_timeout: 10000,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }]
};
