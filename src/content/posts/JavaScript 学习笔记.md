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

   

## 二、JavaScript的内容输出

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

## 三、JavaScript的基本语法

JavaScript使用分号 `;` 进行语句的分隔。忽略空格。

### JavaScript字面量与变量

JavaScript中有一下几种基本字面量：

```javascript
var a = 1, b = 2; // 数字
var str = "Hello, World!"; // 字符串
var arr = [1, 2, 3, 4, 5]; // 数组
var obj = { name: "John", age: 30, city: "New York" }; //对象
function add(x, y) { // 函数
    return x + y;
}
```

把他们输出：

```html
<script src="src.js"></script>
<script>
    // 输出 src.js 中定义的所有变量
    document.write("<h2>JS 变量输出</h2>");
    document.write("<p>a = " + a + ", b = " + b + "</p>");
    document.write("<p>a + b = " + add(a, b) + "</p>");
    document.write("<p>str = " + str + "</p>");
    document.write("<p>arr = [" + arr.join(", ") + "]</p>");
    document.write("<p>obj = { name: \"" + obj.name + "\", age: " + obj.age + ", city: \"" + obj.city + "\" }</p>");
    document.write("<p>a + str = " + (a + str) + "</p>"); // 这一行输出1Hello, World!
</script>
```

注意这里 `var` 和 `let` 的区别。考虑以下代码：

```javascript
if (true) {
    var a = 1;
    let b = 2;
}
console.log(a); // 1 （var 穿透了 if 块）
console.log(b); // ReferenceError: b is not defined（let 被块锁住了）
```

- **`var`：函数作用域（Function Scope）**。只有在函数内部才会形成隔离，在 `if`、`for` 等代码块中无法隔离。
- **`let`：块级作用域（Block Scope）**。只要被 `{}` 包裹，就是一个独立的作用域。

| 对比维度          | `var`                      | `let`                          |
| :---------------- | :------------------------- | :----------------------------- |
| **作用域**        | 函数作用域                 | **块级作用域**（`{}`）         |
| **变量提升**      | 提升并初始化为 `undefined` | 提升但**不初始化**（存在 TDZ） |
| **挂载 `window`** | **会**（`window.xxx`）     | **不会**                       |
| **重复声明**      | 允许                       | **禁止**                       |
| **循环绑定**      | 共用同一个引用             | **每次迭代独立绑定**           |

在现在的实际项目开发中（尤其是 Vue / React 工程化环境），**请彻底放弃 `var`**。

- **默认使用 `const`**（常量引用，确保变量不会意外被重新赋值）。
- **只有当你确定变量后续会重新赋值时（如循环计数器、累加变量），才改用 `let`**。

这样做不仅能避免 `var` 带来的作用域污染和 TDZ 报错，还能让代码的可读性（意图表达）大幅提升。

### JavaScript的关键字

基本与 C/C++ 相同，除了几个：

- `let/var` 定义变量。
- `function` 定义函数
- `for ... in` 迭代器循环。

### JavaScript数据类型

#### 1. 原始类型（基本类型）

这些类型直接存储在**栈内存**中，赋值时是“值拷贝”。它们本身无法被修改（修改其实是旧值销毁，新值创建）。

目前一共有 **7 种**（ES6 之后）：

- **`number`**：整数、浮点数，特殊值 `Infinity`、`NaN` 也属于它。
- **`string`**：字符串（不可变，比如 `str[0]='a'` 是无效的）。
- **`boolean`**：`true` / `false`。
- **`undefined`**：声明了变量但未赋值时的默认值。
- **`null`**：空值，表示“此处本应有对象，但故意为空”（注意：`typeof null === 'object'` 是 JS 遗留的著名 Bug）。
- **`symbol`**（ES6）：创建绝对唯一的标识符（即使描述相同也不相等），常用于对象私有属性键。
- **`bigint`**（ES2020）：表示大于 `2^53-1` 的整数，后缀加 `n`，如 `9007199254740993n`。

#### 2. 引用类型（对象类型）

它们存储在**堆内存**中，变量实际保存的是指向该内存块的**指针（地址）**。赋值时是“引用拷贝”，修改会相互影响。

- **`Object`**：普通对象（`{ }`）。
- **`Array`**：数组（本质是特殊的对象）。
- **`Function`**：函数（可调用对象，也是对象）。
- **`Date`**、**`RegExp`**、**`Map`**、**`Set`**、**`WeakMap`** 等内置对象。

当定义一个新数组类型时，应当使用 `let arr = new Array()` 。

#### 3.判断类型

不同的类型需要使用不同的检查工具：

| 场景                           |              推荐方式              | 示例                                                         |
| :----------------------------- | :--------------------------------: | :----------------------------------------------------------- |
| **判断基本类型**               |              `typeof`              | `typeof "abc"` → `"string"`；`typeof true` → `"boolean"`     |
| **判断数组**                   |         `Array.isArray()`          | `Array.isArray([])` → `true`（`typeof []` 只会返回 `"object"`） |
| **判断 null**                  |             `=== null`             | `let x = null; x === null` → `true`（因为 `typeof` 有 Bug）  |
| **判断某个对象是否属于特定类** |            `instanceof`            | `[] instanceof Array` → `true`；`{} instanceof Object` → `true` |
| **万能精准判断（原始+引用）**  | `Object.prototype.toString.call()` | `Object.prototype.toString.call(null)` → `"[object Null]"`； `Object.prototype.toString.call([])` → `"[object Array]"` |

> 关于字符串：字符串会检测包围最外面的引号。内部其余的引号都会被认为是字符串的内容。

#### 原始类型的方法

JavaScript会自动给原始类型包装成对象。

**字符串（String）**—— 最常用

- **大小写转换**：`str.toUpperCase()`、`str.toLowerCase()`
- **去空白**：`str.trim()`（两端）、`trimStart()`、`trimEnd()`
- **查找**：`str.includes('a')`、`str.indexOf('a')`、`str.startsWith('H')`
- **截取与分割**：`str.slice(0, 5)`（截取）、`str.split(',')`（转为数组）
- **替换**：`str.replace('a', 'b')`（仅第一个）、`str.replaceAll('a', 'b')`（全部替换）
- **链式调用（极其优雅）**：`" Hello World ".trim().toLowerCase().replace('world', 'JS')`

**数字（Number）**

- **转字符串**：`num.toString(16)`（括号里可带进制，如转16进制）
- **保留小数**：`num.toFixed(2)`（保留两位，返回字符串，常用于金额格式化）
- **判断数字**：`Number.isNaN(value)`（严格判断）、`Number.isFinite(value)`（判断是否有限）
- **注意**：`123.toString()` 会报语法错误（因为点号被解析为小数点），必须用 `(123).toString()` 或 `123..toString()`。

虽然 String 可以看作一个对象，但是我们不建议使用 `new String()` ，而是直接使用字面量赋值。然而，`new Array()` 经常被使用。

### JavaScript的算符

#### JavaScript中的等号：

- **`==`（相等）**：比较前，如果**类型不同**，会强制将两边转换为**相同类型**再比数值。
- **`===`（严格相等）**：**类型不同**直接返回 `false`，类型相同才进一步比较值。
- **`!=`（不相等）**：等价于 `!(a == b)`，会触发隐式类型转换。
- **`!==`（严格不相等）**：等价于 `!(a === b)`，不会触发隐式类型转换。

隐式类型转换的逻辑：

| 情况                      | 转换逻辑                                                     |
| :------------------------ | :----------------------------------------------------------- |
| **布尔值 vs 其他**        | 布尔值转数字：`true` → `1`，`false` → `0`                    |
| **数字 vs 字符串**        | 字符串转数字（`'123'` → `123`）                              |
| **对象 vs 原始类型**      | 对象先调用 `toString()` 或 `valueOf()` 转为原始值            |
| **`null` 与 `undefined`** | **只有彼此相等**，且不等于其他任何值（包括 `0`、`false`、`''`） |

**不建议使用 `==` 和 `!=` ，永远写三个**。

example:

```javascript
// 1. 布尔值被转为数字
console.log(0 == false);   // true （false -> 0）
console.log('' == false);  // true （'' -> 0, false -> 0）
console.log('0' == false); // true （'0' -> 0, false -> 0）

// 2. 字符串和数字
console.log(1 == '1');     // true （字符串 '1' 转数字 1）
console.log('' == 0);      // true （'' 转数字 0）

// 3. null 和 undefined 的特殊性（非常特殊！）
console.log(null == undefined); // true
console.log(null == 0);         // false（虽然都是“空”，但规则锁死了）
console.log(undefined == false);// false

// 4. 数组的骚操作（涉及对象转原始值）
console.log([] == 0);      // true （[] 转字符串 ''，然后转数字 0）
console.log([] == ![]);    // true （![] 是 false，变成 [] == false，同上推导为 0 == 0）
console.log([1] == 1);     // true （[1] 转字符串 '1'，转数字 1）
```

