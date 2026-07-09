---
title: JavaScript 学习笔记
published: 2026-07-10
description: ''
image: ''
tags: [JavaScript]
category: 前端
draft: false
lang: ''
---

# JavaScript 学习笔记

## 一、JS是什么，什么时候用，怎么用

JS：轻量级前端脚本。可以与html、java产生联动。

### 范例：使用 Javascript 在前端进行输出。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的网页</title>
    <style>
        /* 在这里编写 CSS 样式 */
    </style>
</head>
<body>
    <p>这是一个网页。</p>
    <script>
        document.write("<h1>这是一个标题</h1>");
        document.write("<p>这是一个段落。</p>");
    </script>
</body>
</html>
```

> 注：只能在内嵌代码里用，从别的地方引入会导致html被覆盖。

### 范例：改变前端内容

```javascript
<p id="demo">
JavaScript 能改变 HTML 元素的内容。
</p>
<script>
function myFunction() {
	x=document.getElementById("demo");  // 找到元素
	x.innerHTML="Hello JavaScript!";    // 改变内容
}
</script>
<button type="button" onclick="myFunction()">点击这里</button>         //改变样式
```

> `x=document.getElementById("demo");`十分常用，可用于搜索带特定标签的内容。

### 嵌入方法

1. 直接写在`<script>`中：

   ```html
   <!DOCTYPE html>
   <html>
   <body>
   <h1>我的 Web 页面</h1>
   <p id="demo">一个段落</p>
   <button type="button" onclick="myFunction()">尝试一下</button>
   <script>
   function myFunction()
   {
       document.getElementById("demo").innerHTML="我的第一个 JavaScript 函数";
   }
   </script>
   </body>
   </html>
   ```

2. 引用外部文件

   ```html
   <!DOCTYPE html>
   <html>
   <body>
   <script src="myScript.js"></script>
   </body>
   </html>
   ```

   

# 二、JavaScript的内容输出

### 控制台输出

主要使用 `console`模块。

```html
<script>
    a = 1;
    b = 2;
    console.log(a + b);
</script>
```

此时点击F12->console就可以看到一个数字3。

常用的有：

- **`console.log()`**：最基础的标准输出。
- **`console.error()`**：输出错误信息（红色样式），会显示调用堆栈。
- **`console.warn()`**：输出警告信息（黄色样式）。
- **`console.table()`**：将数组或对象以表格形式结构化打印，非常适合查看复杂 JSON 数据。
- **`console.dir()`**：输出 DOM 元素或对象的详细属性结构（不同于 `log` 的 HTML 展示）。
- **`console.time()` / `timeEnd()`**：配对使用，用于计算代码执行耗时。
- **`console.trace()`**：输出当前的调用堆栈信息。

### html输出

如前文所说，使用 `document.write("text")` 可以实现注入html。

- **`document.write()`**：最原始的方式，直接将字符串写入 HTML 文档流。**注意**：若在页面加载完成后调用，会**覆盖整个页面**，实际开发中严禁使用。
- **修改元素内容（最常用）**：
  - **`element.innerHTML`**：解析 HTML 标签并渲染（有 XSS 安全风险，需谨慎处理用户输入）。
  - **`element.innerText`**：只修改纯文本（会触发重排，性能略差）。
  - **`element.textContent`**：只修改纯文本（性能优于 `innerText`，且不会解析 HTML），**推荐使用**。
- **动态创建节点**：使用 `document.createElement()` 配合 `appendChild()` 或 `insertBefore()` 精细控制 DOM 树。

### 弹出窗口

主要使用 `window` 。

```html
<script>
    window.alert("114514");
</script>
```

注意这一段代码弹框时，即使前面有内容，也不会被绘制出来。事实上，那一部分内容的绘制被阻断了（但已经存在于内存中）。

- **`alert()`**：单纯展示一段警告文本。
- **`confirm()`**：带有"确定"和"取消"的对话框，返回布尔值（`true`/`false`）。
- **`prompt()`**：带有输入框的对话框，返回用户输入的字符串。
