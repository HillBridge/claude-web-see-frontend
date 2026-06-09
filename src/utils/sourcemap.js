import sourceMap from "source-map-js";
import { Message } from "element-ui";

// 找到以.js结尾的fileName
function matchStr(str) {
  if (str.endsWith(".js")) return str.substring(str.lastIndexOf("/") + 1);
}

// 将所有的空格转化为实体字符
function repalceAll(str) {
  return str.replace(new RegExp(" ", "gm"), "&nbsp;");
}

// HTML 转义,防止源码内容/路径中的标签注入到 innerHTML 造成 XSS
function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function loadSourceMap(fileName) {
  let file = matchStr(fileName);
  if (!file) return;
  return new Promise((resolve) => {
    // /getmap 已改为需 JWT 鉴权(源码还原走后台登录态),带上 token(与 request.js 注入逻辑一致)
    const token = localStorage.getItem("auth-token");
    fetch(
      `${process.env.VUE_APP_BACKEND_URL}/getmap?fileName=${file}&apikey=${process.env.VUE_APP_APIKEY}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    ).then((response) => {
      resolve(response.json());
    });
  });
}

export const findCodeBySourceMap = async (
  { fileName, line, column },
  callback,
) => {
  let sourceData = await loadSourceMap(fileName);
  if (!sourceData) return;
  let { sourcesContent, sources } = sourceData;
  let consumer = await new sourceMap.SourceMapConsumer(sourceData);
  let result = consumer.originalPositionFor({
    line: Number(line),
    column: Number(column),
  });
  /**
   * result结果
   * {
   *   "source": "webpack://myapp/src/views/HomeView.vue",
   *   "line": 24,  // 具体的报错行数
   *   "column": 0, // 具体的报错列数
   *   "name": null
   * }
   * */
  if (result.source && result.source.includes("node_modules")) {
    // 三方报错解析不了，因为缺少三方的map文件，
    // 比如echart报错 webpack://web-see/node_modules/.pnpm/echarts@5.4.1/node_modules/echarts/lib/util/model.js
    return Message({
      type: "error",
      duration: 5000,
      message: `源码解析失败: 因为报错来自三方依赖，报错文件为 ${result.source}`,
    });
  }

  let index = sources.indexOf(result.source);

  // 未找到，将sources路径格式化后重新匹配 /./ 替换成 /
  // 测试中发现会有路径中带/./的情况，如 webpack://web-see/./src/main.js
  if (index === -1) {
    let copySources = JSON.parse(JSON.stringify(sources)).map((item) =>
      item.replace(/\/.\//g, "/"),
    );
    index = copySources.indexOf(result.source);
  }
  if (index === -1) {
    return Message({
      type: "error",
      duration: 5000,
      message: `源码解析失败`,
    });
  }
  let code = sourcesContent[index];
  let codeList = code.split("\n");
  var row = result.line,
    len = codeList.length - 1;
  var start = row - 5 >= 0 ? row - 5 : 0, // 将报错代码显示在中间位置
    end = start + 9 >= len ? len : start + 9; // 最多展示10行
  let newLines = [];
  let j = 0;
  for (var i = start; i <= end; i++) {
    j++;
    newLines.push(
      `<div class="code-line ${i + 1 == row ? "heightlight" : ""}" title="${
        i + 1 == row ? escapeHtml(result.source) : ""
      }">${j}. ${repalceAll(escapeHtml(codeList[i]))}</div>`,
    );
  }

  let innerHTML = `<div class="errdetail"><div class="errheader">${escapeHtml(
    result.source,
  )} at line ${escapeHtml(result.column)}:${escapeHtml(
    row,
  )}</div><div class="errdetail">${newLines.join("")}</div></div>`;
  callback(innerHTML);
};
