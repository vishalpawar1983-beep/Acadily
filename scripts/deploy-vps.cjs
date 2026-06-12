const { Client } = require('ssh2');

const VPS = {
  host: '66.116.207.89',
  port: 22,
  username: 'root',
  password: 'zQ>iaRo',
};

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`[VPS] $ ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '', stderr = '';
      stream.on('data', d => { stdout += d; process.stdout.write(d); });
      stream.stderr.on('data', d => { stderr += d; process.stderr.write(d); });
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Command exited with code ${code}\n${stderr}`));
        else resolve(stdout);
      });
    });
  });
}

async function deploy() {
  const conn = new Client();

  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(VPS);
  });
  console.log('[LOCAL] Connected to VPS');

  try {
    // Check if repo exists
    try {
      await exec(conn, 'test -d /opt/flex-academy/repo/.git && echo "REPO_EXISTS"');
      console.log('[LOCAL] Repo exists, pulling latest...');
      await exec(conn, 'cd /opt/flex-academy/repo && git pull origin main');
    } catch {
      console.log('[LOCAL] No repo found, cloning...');
      await exec(conn, 'mkdir -p /opt/flex-academy/repo');
      await exec(conn, 'cd /opt/flex-academy/repo && git clone https://bitbucket.org/aiinfox-wrk/ims-fullstack.git .');
    }

    // Install dependencies
    console.log('\n[LOCAL] Installing dependencies...');
    await exec(conn, 'cd /opt/flex-academy/repo && npm ci --omit=dev 2>&1 | tail -5');

    // Build TypeScript
    console.log('\n[LOCAL] Building TypeScript...');
    await exec(conn, 'cd /opt/flex-academy/repo && npx tsc 2>&1 | tail -10');

    // Rebuild Docker image on VPS
    console.log('\n[LOCAL] Building Docker image on VPS...');
    await exec(conn, 'cd /opt/flex-academy/repo && docker build -f docker/Dockerfile -t flex-academy-api:amd64 . 2>&1 | tail -20');

    // Stop old container and start new one
    console.log('\n[LOCAL] Restarting container...');
    await exec(conn, 'docker rm -f flex-academy-api 2>/dev/null || true');

    const runCmd = `docker run -d \\
      --name flex-academy-api \\
      --restart unless-stopped \\
      --memory 800m \\
      --network observability_flex-monitor \\
      -p 3002:3002 \\
      -v /opt/flex-academy/uploads:/app/uploads \\
      -v /opt/flex-academy/images:/app/images \\
      --health-cmd='node -e "require(\\"http\\").get(\\"http://localhost:\\"+(process.env.PORT||3001)+\\"/health\\",r=>process.exit(r.statusCode===200?0:1))"' \\
      --health-interval=30s \\
      --health-timeout=10s \\
      --health-retries=3 \\
      -e NODE_ENV=production \\
      -e PORT=3002 \\
      -e LOG_LEVEL=info \\
      -e MONGO_URI="mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims" \\
      -e JWT_ACCESS_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" \\
      -e JWT_REFRESH_SECRET="f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1" \\
      -e JWT_ACCESS_EXPIRES_IN=1h \\
      -e JWT_REFRESH_EXPIRES_IN=7d \\
      -e CORS_ORIGINS="https://acadily.com,https://www.acadily.com,https://app.acadily.com,https://api.acadily.com,https://health.acadily.com,http://localhost:3002" \\
      -e RATE_LIMIT_WINDOW_MS=900000 \\
      -e RATE_LIMIT_MAX=100000 \\
      -e AUTH_RATE_LIMIT_MAX=10000 \\
      -e OTP_RATE_LIMIT_MAX=1000 \\
      -e SKIP_OTP=false \\
      -e SMTP_USER=visualmediatechnology@gmail.com \\
      -e SMTP_PASS=vdjojwhjxvhsgijt \\
      -e SMTP_FROM=visualmediatechnology@gmail.com \\
      -e USER_EMAIL=visualmediatechnology@gmail.com \\
      -e USER_PASSWORD=vdjojwhjxvhsgijt \\
      -e FRONTEND_URL=https://app.acadily.com \\
      flex-academy-api:amd64`;
    await exec(conn, runCmd);

    // Wait and check health
    console.log('\n[LOCAL] Waiting for container to start...');
    await new Promise(r => setTimeout(r, 12000));
    await exec(conn, 'docker ps --format "{{.Names}}: {{.Status}}" | grep flex-academy-api');
    await exec(conn, 'docker logs flex-academy-api --tail 10 2>&1');

    console.log('\n[LOCAL] Deploy complete!');
  } catch (err) {
    console.error('[ERROR]', err.message);
  } finally {
    conn.end();
  }
}

deploy();
