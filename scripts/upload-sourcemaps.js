#!/usr/bin/env node
/**
 * 上传 source map 到后端 DB
 *
 * 用法:
 *   node scripts/upload-sourcemaps.js
 *
 * 依赖环境变量（可放在 .env.upload 或 CI/CD secrets）:
 *   BACKEND_URL            后端地址（.env 中配置为 VUE_APP_BACKEND_URL）
 *   SOURCEMAP_UPLOAD_SECRET 与后端 .env 中同名变量保持一致
 *   UPLOAD_APIKEY          项目 apikey
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 优先从 .env.upload 加载（本地开发），CI 中直接注入环境变量即可
const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
}

const BACKEND_URL = process.env.VUE_APP_BACKEND_URL || process.env.BACKEND_URL;
const SECRET      = process.env.SOURCEMAP_UPLOAD_SECRET;
const APIKEY      = process.env.UPLOAD_APIKEY;
const DIST_DIR    = path.join(__dirname, '../dist/js');

if (!SECRET || !APIKEY) {
  console.error('缺少必要环境变量: SOURCEMAP_UPLOAD_SECRET / UPLOAD_APIKEY');
  process.exit(1);
}

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const jsName   = fileName.replace(/\.map$/, '');
    const content  = fs.readFileSync(filePath);

    const boundary = `----FormBoundary${Date.now()}`;
    const head = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/json\r\n\r\n`,
      'utf-8',
    );
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const body = Buffer.concat([head, content, tail]);

    const url = new URL(`${BACKEND_URL}/api/uploadmap?apikey=${APIKEY}`);
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: 'POST',
        headers: {
          'X-Upload-Secret': SECRET,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`  ✓ ${jsName}`);
          } else {
            console.error(`  ✗ ${jsName}  (${res.statusCode}) ${data}`);
          }
          resolve();
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist/js 目录不存在，请先执行 npm run build');
    process.exit(1);
  }

  const maps = fs.readdirSync(DIST_DIR).filter((f) => f.endsWith('.map'));
  if (maps.length === 0) {
    console.error('dist/js 中没有找到 .map 文件');
    process.exit(1);
  }

  // 脱敏 apikey,避免明文打进 CI 日志
  const maskedKey = APIKEY ? `${APIKEY.slice(0, 4)}****${APIKEY.slice(-4)}` : '(未设置)';
  console.log(`上传 ${maps.length} 个 source map → ${BACKEND_URL} (apikey=${maskedKey})`);
  for (const f of maps) {
    await uploadFile(path.join(DIST_DIR, f));
  }
  // 上传后从 dist 删除 .map, 避免源码随静态站公开泄露(与 vue.config.js 的 hidden-source-map 配套)
  for (const f of maps) {
    fs.unlinkSync(path.join(DIST_DIR, f));
  }
  console.log(`完成, 已从 dist 删除 ${maps.length} 个 .map`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
