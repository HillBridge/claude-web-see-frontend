import sourceMap from 'source-map-js';
import { Message } from 'element-ui';

// 解析 fileName，区分生产打包路径和开发 webpack-internal 路径
// 返回 { type: 'bundle', file } 或 { type: 'source', sourcePath } 或 null
function parseFileName(str) {
  if (!str) return null;

  // 开发环境: webpack-internal:///loader!./src/views/Foo.vue?vue&type=script&lang=js&
  if (str.startsWith('webpack-internal://')) {
    const resource = str.includes('!') ? str.split('!').pop() : str.slice('webpack-internal:///'.length);
    const sourcePath = resource.split('?')[0]; // ./src/views/Foo.vue
    return { type: 'source', sourcePath };
  }

  // 生产环境: https://cdn.com/js/app.abc123.js 或 app.abc123.js?v=xxx
  const cleanStr = str.split('?')[0].split('#')[0];
  if (cleanStr.endsWith('.js')) {
    return { type: 'bundle', file: cleanStr.substring(cleanStr.lastIndexOf('/') + 1) };
  }

  return null;
}

// 将所有的空格转化为实体字符
function repalceAll(str) {
  return str.replace(new RegExp(' ', 'gm'), '&nbsp;');
}

function loadSourceMap(file) {
  return new Promise((resolve) => {
    fetch(`${process.env.VUE_APP_BACKEND_URL}/getmap?fileName=${file}`).then((response) => {
      resolve(response.json());
    });
  });
}

function renderCode(codeList, row, source, callback) {
  let len = codeList.length - 1;
  let start = row - 5 >= 0 ? row - 5 : 0;
  let end = start + 9 >= len ? len : start + 9;
  let newLines = [];
  let j = 0;
  for (let i = start; i <= end; i++) {
    j++;
    newLines.push(
      `<div class="code-line ${i + 1 == row ? 'heightlight' : ''}" title="${
        i + 1 == row ? source : ''
      }">${j}. ${repalceAll(codeList[i])}</div>`
    );
  }
  let innerHTML = `<div class="errdetail"><div class="errheader">${source} at line ${row}</div><div class="errdetail">${newLines.join('')}</div></div>`;
  callback(innerHTML);
}

export const findCodeBySourceMap = async ({ fileName, line, column }, callback) => {
  console.log('fileName', fileName);
  if (!fileName) {
    return Message({ type: 'error', duration: 5000, message: '源码解析失败: 该错误缺少文件信息（fileName 为空）' });
  }

  const parsed = parseFileName(fileName);
  if (!parsed) {
    return Message({ type: 'error', duration: 5000, message: '源码解析失败: 无法识别的文件路径格式' });
  }

  // 开发环境: webpack-internal 路径已经是源码路径，直接从后端按路径取源码
  if (parsed.type === 'source') {
    const sourceData = await loadSourceMap(parsed.sourcePath);
    if (!sourceData) return;
    const codeList = sourceData.split('\n');
    return renderCode(codeList, Number(line), parsed.sourcePath, callback);
  }

  // 生产环境: 通过 .map 文件反查源码
  let sourceData = await loadSourceMap(parsed.file);
  if (!sourceData) return;
  let { sourcesContent, sources } = sourceData;
  let consumer = new sourceMap.SourceMapConsumer(sourceData);
  let result = consumer.originalPositionFor({
    line: Number(line),
    column: Number(column)
  });

  if (result.source && result.source.includes('node_modules')) {
    return Message({
      type: 'error',
      duration: 5000,
      message: `源码解析失败: 因为报错来自三方依赖，报错文件为 ${result.source}`
    });
  }

  let index = sources.indexOf(result.source);

  // 路径中带 /./ 的情况，如 webpack://web-see/./src/main.js
  if (index === -1) {
    let copySources = sources.map((item) => item.replace(/\/.\//g, '/'));
    index = copySources.indexOf(result.source);
  }
  console.log('index', index);
  if (index === -1) {
    return Message({ type: 'error', duration: 5000, message: '源码解析失败' });
  }

  let codeList = sourcesContent[index].split('\n');
  renderCode(codeList, result.line, result.source, callback);
};
