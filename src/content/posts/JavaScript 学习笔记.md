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
| **判断基本类型**               |              `typeof`              | `typeof "abc"` → `"string"`；`typeof true` → `"boolean"` （`typeof []`，`typeof null` 只会返回 `"object"`）。 |
| **判断数组**                   |         `Array.isArray()`          | `Array.isArray([])` → `true`                                 |
| **判断 null**                  |             `=== null`             | `let x = null; x === null` → `true`（因为 `typeof` 有 Bug）  |
| **判断某个对象是否属于特定类** |            `instanceof`            | `[] instanceof Array` → `true`；`{} instanceof Object` → `true` |
| **万能精准判断（原始+引用）**  | `Object.prototype.toString.call()` | `Object.prototype.toString.call(null)` → `"[object Null]"`； `Object.prototype.toString.call([])` → `"[object Array]"` |

JavaScript中有一种特殊的类型 `undefined` ，当一个变量没有被赋值时为这个类型。

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

### JavaScript对象与方法

JavaScript的对象可以看作是 key->value 的映射，参考 python 的 `dict` 。

#### 对象的定义与操作

如何定义一个对象：

```javascript
// ✅ 方式一：对象字面量（最推荐，简洁高效）
const user = {
    name: '张三',
    age: 18,
    sayHi() { // ES6 方法简写，等价于sayHi: function()
        console.log('Hi');
    }
};

// ⚠️ 方式二：new Object()（不推荐，多写了 7 个字符且性能略差）
const obj = new Object();
obj.name = '李四';
```

对象基本操作：

|     操作     | 语法                                    | 示例                                                         |
| :----------: | :-------------------------------------- | :----------------------------------------------------------- |
| **增 / 改**  | `对象.属性 = 值` 或 `对象['属性'] = 值` | `user.age = 20;` `user['gender'] = '男';`                    |
| **查（读）** | `对象.属性` 或 `对象['属性']`           | `console.log(user.name);` // 张三 `console.log(user['age']);` // 18 |
|    **删**    | `delete 对象.属性`                      | `delete user.age;` `console.log(user.age);` // undefined     |

访问对象成员有两种方法：`.` 和 `[]` 。**其中方括号更灵活，里面可以填表达式。**

#### 对象遍历

- **`for...in`,`for...of`循环**（会遍历原型链上的可枚举属性，通常需要配合 `hasOwnProperty` 过滤）。其中，前者遍历key，后者遍历value。
- **`Object.keys()` / `values()` / `entries()`**+**`forEach`**（数组的方法，只返回对象**自身**的属性，不涉及原型链）。


```javascript
const user = { name: '赵六', city: '深圳' };

// 方式一：for...in（注意：会包含原型链上的属性，慎用）
for (let key in user) {
    if (user.hasOwnProperty(key)) { // 标准安全写法，过滤掉原型属性
        console.log(key, user[key]);
    }
}

// 方式二：ES6 新方法（更干净，推荐）
Object.keys(user).forEach(key => {
    console.log(key, user[key]); // name 赵六, city 深圳
});

// 直接获取值数组
Object.values(user); // ['赵六', '深圳']
// 获取键值对数组
Object.entries(user); // [['name', '赵六'], ['city', '深圳']]
```

如何取出 key,value：

| 方法               | 返回值            | 结果                                           |
| ------------------ | ----------------- | ---------------------------------------------- |
| `Object.keys()`    | 键的数组          | `["name", "age", "sayHi"]`                     |
| `Object.values()`  | 值的数组          | `["Alice", 18, ƒ]`                             |
| `Object.entries()` | `[键, 值]` 的数组 | `[["name","Alice"], ["age",18], ["sayhi", ƒ]]` |

```javascript
// Object.keys()   → 返回所有键
console.log("keys:", Object.keys(user));
// keys: ["name", "age", "sayHi"]

// Object.values() → 返回所有值
console.log("values:", Object.values(user));
// values: ["Alice", 18, ƒ]

// Object.entries() → 返回 [键, 值] 对
console.log("entries:", Object.entries(user));
// entries: [["name","Alice"], ["age",18], ["sayHi", ƒ]]
```

`forEach` 是数组的方法，因此必须先取出元素的数组。

**关于 `forEach` ：**

```javascript
arr.forEach(function(currentValue, index, array) {
    // currentValue：当前元素（必选）
    // index：当前索引（可选）
    // array：正在遍历的整个数组（可选）
}, thisArg); // thisArg：可选，指定回调函数里 this 的指向
const arr = ['a', 'b', 'c'];
arr.forEach((item, index) => {
    console.log(`索引${index}：${item}`);
});
// 输出：索引0：a  索引1：b  索引2：c
```

关于箭头函数：格式 `(args) => {operations}` 。后续详细探讨。

#### 方法

和C++ `class` 一样，JavaScript也可以给对象定义方法。

```javascript
const user = {
    name: "Alice",
    age: 18,
    // 1. 方法简写（ES6，最常用）
    sayHi() {
        console.log("Hi, I'm " + this.name);
    },
    // 2. 传统函数表达式
    greet: function () {
        console.log("Hello, " + this.name);
    },
    // 3. 箭头函数（注意：没有自己的 this！）
    arrowHi: () => {
        console.log("Arrow Hi, " + this.name); // ← this 指向外层，不是 user
    },
};
// 4. 创建后动态添加
user.sayBye = function () { // 前面用冒号是key:value，这里用=。思考这里的逻辑。
    console.log("Bye, " + this.name);
};
// 5. Object.defineProperty
Object.defineProperty(user, "sayHey", {
    value: function () {
        console.log("Hey, " + this.name);
    },
    writable: true,
});

// 测试调用
user.sayHi();    // Hi, I'm Alice
user.greet();    // Hello, Alice
user.arrowHi();  // Arrow Hi, undefined  ← 箭头函数没有 this！
user.sayBye();   // Bye, Alice
user.sayHey();   // Hey, Alice
```

特别注意第五种的区别：

|        特性        |         直接赋值          |  `Object.defineProperty`   |
| :----------------: | :-----------------------: | :------------------------: |
|  **`enumerable`**  | 默认为 `true`（可被遍历） | 默认为 `false`（不可遍历） |
| **`configurable`** |  默认为 `true`（可删除）  | 默认为 `false`（不可删除） |
|   **`writable`**   |  默认为 `true`（可修改）  |       默认为 `false`       |

### JavaScript函数

函数使用 `function` 定义。

```javascript
function add(x, y) {
    return x + y;
}
function gcd(x, y) {
    if (y === 0) return x;
    return gcd(y, x % y);
}
```

#### 函数声明，函数表达式与函数提升

```js
console.log(square(5)); // 25

function square(n) {
    return n * n;
}
```

这一段代码可以正确运行，原因是函数square的声明被提升到了作用域的最顶部。

然而，下面这一段代码是错误的：

```js
console.log(square(5)); // ReferenceError: Cannot access 'square' before initialization
const square = function (n) {
    return n * n;
};
```

在ES6以后严格模式下禁止在块级作用域下声明函数。

| 场景                                        | 写法示例                           | 提升机制                                  | 块级作用域 (`{}`) 影响         | 能否在定义前调用      | 挂载 `window` (全局) |
| :------------------------------------------ | :--------------------------------- | :---------------------------------------- | :----------------------------- | :-------------------- | :------------------- |
| **1. 函数声明**                             | `function a(){}`                   | **整体提升**（函数体一起提）              | 诡异（ES6严格模式禁止）        | ✅ 可以                | ✅ 是                 |
| **2. `var` + 函数表达式（全局/函数内）**    | `var a = function(){}`             | **变量提升**（`undefined`），赋值留在原地 | 无视 `{}`，穿透到函数/全局     | ❌ 报错（类型错误）    | ✅ 是                 |
| **3. `var` + 函数表达式（块级 `if` 内）**   | `if(true){ var a = function(){} }` | 变量提升到**外部函数**，赋值留在块内      | **穿透**，污染外部作用域       | ❌ 报错（`undefined`） | ✅ 是                 |
| **4. `let/const` + 函数表达式（任何位置）** | `let a = function(){}`             | **变量提升但处于 TDZ**，赋值留在原地      | **严格隔离**，只在 `{}` 内有效 | ❌ 报错（引用错误）    | ❌ 否                 |
| **5. 箭头函数 + `const`**                   | `const a = () => {}`               | 同 `let/const`（TDZ）                     | **严格隔离**                   | ❌ 报错                | ❌ 否                 |

#### 箭头函数 `=>`

箭头函数提供了极致的简写模式，有 3 个记忆点：

- **去掉 `function`**，在参数和函数体之间加 `=>`。
- **如果只有一个参数**，可以省略参数括号 `()`。
- **如果函数体只有一行 `return`**，可以省略 `{}` 和 `return` 关键字（这叫**隐式返回**）。

```javascript
// 传统写法
const add1 = function(a, b) {
    return a + b;
};
// 箭头函数写法（完整版）
const add2 = (a, b) => {
    return a + b;
};
// 箭头函数写法（极致简写：单表达式隐式返回）
const add3 = (a, b) => a + b; 
// 只有一个参数时，括号都可以省掉
const double = x => x * 2;
// 如果返回的是对象字面量，必须加括号包起来（否则 {} 会被误认为函数体）
const getObj = id => ({ id: id, name: 'test' });
```

总结函数的使用：

1. 彻底禁用 `var`

- **原因**：它带来的“穿透块级作用域”和“变量提升”好处极少，坏处极大。
- **替代**：全部替换为 `const`（默认）和 `let`（仅在需要重新赋值时）。

2. 函数定义一律采用表达式（赋值给变量），坚决不用声明

- **为什么？** 函数声明虽然整体提升，但它在 `if` 里的表现极其混乱。为了保证代码的**阅读顺序 == 执行顺序**，我们强制“先声明，后调用”。
- **写法**：`const fn = function() {};` 或 `const fn = () => {};`

3. 箭头函数优先（首选）

- 如果你不需要动态 `this`（大多数情况都不需要），直接无脑用 `const fn = () => {}`。
- 它没有 `this` 绑定困扰（继承外层），代码更简洁。

4. 代码组织规范（把规则锁死）

```javascript
// ✅ 正确的现代写法（严格遵循块级作用域）
function test() {
    // 1. 所有函数定义集中写在顶部（避免 TDZ 报错）
    const doA = () => { console.log('A'); };
    const doB = function() { console.log('B'); }; // 普通函数表达式也行

    // 2. 业务逻辑中调用
    if (true) {
        doA(); // 正常工作
        // 即使在这里重新定义 doA，也只影响块内（因为用的是 const）
        const doA = () => { console.log('内部 A'); }; 
        doA(); // 输出 "内部 A"
    }
    doA(); // 输出 "A"（没有被块内的污染，完美！）
}
```

#### `this` 指针

在JavaScript中存在一个动态的上下文对象 `this` 。与C++不同的是，JavaScript的this指针是在运行时确定的。主要有以下几种情况：

1. **默认绑定** ：当函数直接被调用时，this指向全局对象（在浏览器里为 `window` ，nodejs中是 `global` ）。

2. **隐式绑定**：指向调用者。

   > 把对象方法赋值给一个变量，再单独调用时，`this` 会丢失，变回默认绑定（指向 `window`）。
   >
   > ```javascript
   > const fn = obj.greet; // 把方法拿出来单独存
   > fn(); // 输出 undefined（非严格模式下 this 指向 window，window.name 不存在）
   > ```
   >
   > 这就是为什么 React 类组件里要手动 `bind(this)` 或使用箭头函数。

3. **显式绑定（强行指定）**—— `call`、`apply`、`bind`

   你可以强行把 `this` 指向你想要的任何对象。

   - **`call`**：立即执行，参数一个一个传。
   - **`apply`**：立即执行，参数以数组形式传。
   - **`bind`**：不立即执行，而是返回一个新函数，永久绑定 `this`。
   ```javascript
   const person = { name: '李四' };
   function intro(age) {
       console.log(this.name + age);
   }
   
   intro.call(person, 18);   // 输出 '李四18'（立即执行）
   intro.bind(person)(18);   // 输出 '李四18'（bind 返回新函数，稍后执行）
   ```

 4. **`new` 绑定（构造函数）**—— 指向新创建的实例

    当使用 `new` 关键字调用函数时，`this` 指向新创建的空对象。

    ```javascript
    function Car(color) {
        this.color = color; // 这里的 this 指向新创建的那个实例
    }
    const c = new Car('红色');
    console.log(c.color); // '红色'
    ```

5. **箭头函数**：永远指向**定义时的外层**。

   ```javascript
   const obj = {
       name: '王五',
       greetLater: function() {
           // 外层 this 指向 obj
           setTimeout(() => {
               console.log(this.name); // 箭头函数继承外层的 this，输出 '王五'
           }, 100);
           
           // 如果用普通函数，this 指向 window，输出 undefined
           setTimeout(function() {
               console.log(this.name); 
           }, 100);
       }
   };
   obj.greetLater();
   ```

#### arguments对象与剩余参数

函数的实际参数会被保存在一个类似数组的 arguments 对象中。在函数内，你可以通过`arguments[i]`找出传入的参数：

其中 `i` 是参数的序号，从 `0` 开始。所以第一个传入函数的参数会是 `arguments[0]`。参数的数量由 `arguments.length` 表示。

使用 `arguments` 对象，你可以处理比声明更多的参数来调用函数。这在你事先不知道会需要将多少参数传递给函数时十分有用。你可以用 `arguments.length` 来获得实际传递给函数的参数的数量，然后用 `arguments` 对象来访问每个参数。

例如，考虑有一个用来连接字符串的函数。唯一正式的参数是在连接后的字符串中用来分隔各个连接部分的字符。该函数定义如下：


```js
function myConcat(separator) {
  let result = ""; // 初始化列表
  // 迭代 arguments
  for (let i = 1; i < arguments.length; i++) {
    result += arguments[i] + separator;
  }
  return result;
}
```

你可以给这个函数传递任意数量的参数，它会将各个参数连接成一个字符串“列表”：


```js
console.log(myConcat("、", "红", "橙", "蓝"));
// "红、橙、蓝、"

console.log(myConcat("；", "大象", "长颈鹿", "狮子", "猎豹"));
// "大象；长颈鹿；狮子；猎豹；"

console.log(myConcat("。", "智者", "罗勒", "牛至", "胡椒", "香菜"));
// "智者。罗勒。牛至。胡椒。香菜。"
```

**备注：**`arguments` 变量只是“类数组”，而不是数组。它与数组类似，有索引编号和 `length` 属性。尽管如此，它**并不具备** Array 对象的所有数组操作方法。

JavaScript中允许使用[剩余参数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/rest_parameters)将不确定数量的参数表示为数组。

在下面的示例中，`multiply` 函数使用剩余参数收集从第二个参数开始到最后的参数。然后，该函数将它们与第一个参数相乘。

```js
function multiply(multiplier, ...theArgs) {
    return theArgs.map((x) => multiplier * x);
}

const arr = multiply(2, 1, 2, 3);
console.log(arr); // [2, 4, 6]
```



### JavaScript作用域

作用域（Scope）定义了变量在代码中的可访问范围，即“在哪里能读取到这个变量”。JavaScript 采用**静态作用域（词法作用域）**，意味着作用域在**编写代码时（函数定义时）**就已经确定，而非在运行时动态决定（这与`this`的动态绑定恰好相反）。

#### 1. 核心分类：三大作用域

**全局作用域**：不在任何函数或块`{}`内部声明的变量（如`var a = 1;`）属于全局。在浏览器环境中，使用`var`和`function`声明的变量会挂载到`window`对象上，而`let/const`不会挂载，但依然在全局记录中。

**函数作用域**：由`function`定义产生。`var`声明的变量仅在函数内部有效，且不受`if`或`for`大括号的限制（即`var`无视块级）。

**块级作用域**：由`{}`（如`if`、`for`、`while`）产生。只有`let`和`const`能识别块级边界，`var`会直接穿透大括号跑到外层函数或全局中。

```javascript
if (true) {
    var a = 1;   // 函数/全局作用域
    let b = 2;   // 块级作用域（仅在if内）
}
console.log(a); // 1（穿透了）
console.log(b); // ReferenceError（被锁在块内）
```

#### 2. 作用域链（Scope Chain）：向上查找机制

当在某个作用域内访问变量时，JS 引擎会遵循**“由内向外”**的逐级查找规则：

1. 先在**当前作用域**查找。
2. 若未找到，则向**外层（父级）作用域**查找。
3. 一直延伸到**全局作用域**为止。
4. 若全局也找不到，非严格模式下返回`undefined`（赋值会隐式创建全局变量），严格模式直接报错`ReferenceError`。

```javascript
let global = '全局';
function outer() {
    let outerVar = '外层';
    function inner() {
        let innerVar = '内层';
        console.log(innerVar); // 当前作用域找到 -> '内层'
        console.log(outerVar); // 向上到 outer 找到 -> '外层'
        console.log(global);   // 再向上到全局找到 -> '全局'
    }
    inner();
}
outer();
```

#### 3. 变量提升（Hoisting）与暂时性死区（TDZ）——结合执行顺序

**`var`的提升**：声明被提升至**作用域顶部**（即函数或全局），并**初始化为`undefined`**，赋值操作停留在原地。

**`let/const`的 TDZ**：声明也被提升至顶部，但**未初始化**。从作用域顶部到声明行之间的区域称为“暂时性死区”，在此区域访问变量会直接报错（`Cannot access before initialization`）。

```javascript
// 对应你之前问的执行顺序
console.log(v); // undefined（var 提升并初始化了）
var v = 1;

console.log(l); // ❌ ReferenceError（let 提升但处于 TDZ）
let l = 2;
```

> 为什么我们需要 TDZ？
>
> 在逻辑正确的情况下，**运行到某一行再声明** 跟 **先声明，不允许访问直到某一行**没有本质差别。但是，如果我们在定义之前不小心误用了：
>
> - 若没有TDZ，JavaScript会一直向上寻找该变量。
> - 有TDZ，JavaScript直接报错。

#### 4. 闭包（Closure）：作用域的“活体延伸”

闭包是**“函数 + 其周围状态（词法环境）”**的组合。当内部函数引用了外部函数的变量时，即使外部函数已执行完毕，这些变量也不会被垃圾回收（GC），而是继续存活在内存中。

```javascript
function createCounter() {
    let count = 0; // 1. 这是一个局部变量
    // 2. 内部定义了一个小函数
    function inner() {
        count++;      // 3. 这个小函数用了外层的 count
        console.log(count);
    }
    return inner;     // 4. 把小函数作为“快递”返回出去
}
// 5. 执行外部函数，并把返回的小函数存进变量 fn 里
const fn = createCounter(); 
// 6. 神奇的事情发生了：外部函数早就执行完了，但内部的 count 居然还活着！
fn(); // 输出 1
fn(); // 输出 2
```

这里 `createCounter()` 返回了一个函数 `inner()` 。正常来讲，`count` 应该被销毁。但是由于 `fn=inner()` 还保有对 `count` 的引用，因此垃圾回收器GC不会销毁这一段内存。

> **注意不要重名**：如果一个闭包的函数定义了一个和外部的某个变量名称相同的变量，那么这个闭包将无法引用外部作用域中的这个变量。（内部作用域的变量“覆盖”外部作用域，直至程序退出内部作用域。可以将其视作[命名冲突](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Functions#命名冲突)。）

#### 有关全局变量

在浏览器中，全局对象是 `window`。

1. 只有用 `var` 和 `function` 在全局声明的变量，以及未声明直接赋值的变量（非严格模式），才会成为 `window` 的属性。
2. 用 `let` 和 `const` 在全局声明的变量，虽然属于全局作用域，但并不挂载到 `window` 对象上。
3. 函数内部用 `var`/`let`/`const` 声明的变量是局部变量，`window` 永远无法访问。

## 四、JavaScript的各种功能

### JavaScript字符串与模板字符串

我们首先明确：字符串一旦被创建就**不可更改**，所有操作都是**返回一个新的字符串**。

创建时永远**只用字面量**，不要用 `new String()` 。

String常用的方法主要分为四类：

1. 属性类：一些关于字符串的信息。

   - `str.length` ：获取字符串长度。
   - `str.at(index)` ：支持负数的 `str[]` ，虽然写起来长一点但更灵活。

2. 查找类：判断存在性与位置。

   - **`str.includes(sub)`**：是否包含子串（返回 `boolean`）。**（最常用）**
   - **`str.startsWith(sub)` / `str.endsWith(sub)`**：是否以某字符开头/结尾。
   - **`str.indexOf(sub)` / `str.lastIndexOf(sub)`**：查找第一次/最后一次出现的位置（找不到返回 `-1`）。注意它区分大小写。
   - **`str.search(/regex/)`**：支持正则查找位置。

3. 编辑类：清洗与转换。

   - **`str.trim()`**：去除两端空白。**（极高频，用于表单输入清洗）**
     - 变体：`trimStart()` / `trimEnd()`（ES10+）。
   - **`str.toUpperCase()` / `str.toLowerCase()`**：大小写转换。
   - **`str.replace(search, replacement)`**：替换。**（注意大坑：默认只替换第一个！）**
     - **`str.replaceAll(search, replacement)`**（ES2021+）：替换全部。
     - 如果要按正则全局替换：`str.replace(/ /g, '_')`。

4. 操作类：截取，分割，补全。

   - **`str.slice(start, end)`**：截取区间 `[start, end)`。**（最推荐，支持负数索引）**

     - 例：`"hello".slice(1, 3)` -> `"el"`；`"hello".slice(-2)` -> `"lo"`（从倒数第2个取到末尾）。**不建议用 `substring` 。**

   - **`str.split(separator)`**：将字符串拆成数组。**（与数组 `join` 是黄金搭档）**

     - 例：`"a,b,c".split(",")` -> `['a','b','c']`。

     ```javascript
     // 经典去重/反转字符串：先拆成数组，处理完再拼回去
     const str = "hello";
     const reversed = str.split('').reverse().join(''); // "olleh"
     ```

   - **`str.padStart(targetLen, padStr)` / `str.padEnd(...)`**：用于补齐位数（如显示时间戳、编号）。

     ```javascript
     let id = 5;
     console.log(String(id).padStart(3, '0')); // "005"（常用于生成序号）
     ```


当我们要拼接字符串时，不推荐使用 `+` 。作为替代，我们推荐使用**模板字符串**。

JavaScript 中的模板字符串是一种方便的字符串语法，允许你在字符串中嵌入表达式和变量。

模板字符串使用反引号 ` `` ` 作为字符串的定界符分隔的字面量。

模板字面量是用反引号 \` 分隔的字面量，允许多行字符串、带嵌入表达式的字符串插值和一种叫带标签的模板的特殊结构。

模板字符串的主要特性有：

1. 变量插值。

   ```javascript
   const name = "张三";
   const age = 25;
   // ✅ 模板字符串（${} 占位符）
   const newMsg = `我叫${name}，今年${age}岁。`;
   console.log(newMsg); // "我叫张三，今年25岁。"
   ```

   **注意**：`${}` 里面不只是变量，可以放**任何 JavaScript 表达式**（运算、三元判断、函数调用），如：

   ```javascript
   const price = 100;
   const tax = 0.06;
   console.log(`总价：${price * (1 + tax)}`); // "总价：106"
   console.log(`您${age >= 18 ? '已' : '未'}成年`); // 支持三元运算
   ```

   **注意：插值部分不可以进行变量声明。因为 `${}` 里只能是值（表达式）而不是语句。**

2. 多行字符串与引号。

   ```javascript
   const newHtml = `
   <div>
     <p>Hello</p>
   </div>`;
   console.log(newHtml);
   ```

   ```javascript
   let text = `He's often called "Runoob"`; // 单双引号不再需要转义。反引号可用\转义，但是反引号远远没有单双引号常用。
   ```

3. 标签函数（Tagged Templates）

   标签函数就是给普通函数传入一个模板字符串，此时不再需要打小括号，而是用反引号。比如：

   ```javascript
   function myTag(strings, ...values) {
       console.log('纯文本片段:', strings); // 输出一个数组 ['姓名：', '，年龄：', '。']
       console.log('插值变量:', values);    // 输出一个数组 ['张三', 25]
   }
   
   const name = '张三';
   const age = 25;
   myTag`姓名：${name}，年龄：${age}。`; 
   // 注意：这里没有括号 ()，而是直接跟反引号！
   ```
   对这一段代码的解释：
   
   **1. 拆解的“时机”（执行顺序）**
   
   当 JS 引擎执行 ```myTag`你好${name}` `` 时，底层严格遵循以下顺序：
   
   - **第一步（先计算）**：立即计算所有 `${}` 内部的表达式（如变量取值、函数调用）。这意味着 `values` 数组在进入函数体之前就已经是“最终计算结果”了。
   - **第二步（后切割）**：将模板字符串按 `${}` 切割成纯文本数组。
   - **第三步（最后调用）**：调用 `myTag` 函数，将上述结果传入。
   
   **2. `strings` 的隐藏结构（`raw` 属性）**
   
   `strings` 参数**不是**普通数组，它附带一个特殊的 `raw` 属性：
   
   - **作为数组**：存储经过转义处理的纯文本片段（如 `\n` 会被视为换行符）。
   - **`strings.raw` 属性**：存储**原始输入**的纯文本片段（如 `\n` 保留为反斜杠 `\` 和字母 `n`，不做转义）。
   - *用途*：内置函数 `String.raw` 就是通过读取 `strings.raw` 来还原原始字符串的（常用于处理 Windows 路径，防止反斜杠被转义）。

   **3. `...values` 的长度与索引对应关系**
   
   当模板字符串被传入时，它会被拆解成若干个值 ``` str, value1, value2, ...```。
   
   `...`（剩余参数）将后续所有零散的插值值“打包”成一个数组 `values`。
   
   - **长度规律**：`strings.length === values.length + 1`（因为文本片段总是比插值多 1）。
   - **索引对应**：
     - 模板字符串：`"文本0" ${值0} "文本1" ${值1} "文本2"`
     - `strings`：`["文本0", "文本1", "文本2"]`
     - `values`：`[值0, 值1]`
   - **还原公式**：手动拼接时，始终遵循 `strings[i] + values[i]` 的循环，最后补上 `strings[strings.length - 1]`。
   
   **4. 只读保护（冻结数组）**
   
   JS 引擎传递的 `strings` 数组是**冻结（Frozen）**的。你无法修改 `strings[0]` 的内容（严格模式下会报错，非严格模式下静默失败）。这确保了纯文本片段不会被恶意篡改。
   
   **全景图（编译 -> 运行时 -> 传参）**
   
   当你写下 ``` myTag`1${a}2${b}3` ``` 时，底层等价于执行：
   ```myTag( ['1', '2', '3'], a_val, b_val )```
   因为函数定义中使用了 `...values`，所以传入的 `a_val, b_val` 会被自动收集为 `values = [a_val, b_val]`。

### JavaScript的异常处理

与C++几乎一样：

```javascript
function divide(a, b) {
    try {
        if (b === 0) {
            throw new Error("除数不能为零！");
        }
        return a / b;
    } catch (error) {
        console.error("捕获到错误:", error.message);
    } finally {
        console.log("divide 调用结束");
    }
}

console.log(divide(10, 2)); // 5
console.log(divide(10, 0)); // 捕获错误，返回 undefined
```

注意JavaScript有一个特殊的语句 `finally` ，这个无论前面是否捕获到异常都会执行。原因是 JavaScript没有析构函数，因此需要手动清理。

如果 `finally` 块返回一个值，该值会是整个 `try…catch…finally` 流程的返回值，不管在 `try` 和 `catch` 块中的 `return` 语句返回了什么：

```javascript
function f() {
    try {
        console.log(0);
        throw "bogus";
    } catch (e) {
        console.log(1);
        // 这个 return 语句会被挂起直到 finally 块结束
        return true;
        console.log(2); // 不可达
    } finally {
        console.log(3);
        return false; // 覆盖前面的“return”
        console.log(4); // 不可达
    }
    // 现在执行“return false”
    console.log(5); // 不可达
}
console.log(f()); // 0、1、3、false
```

`finally` 块也可以用于重新抛出异常。

**有关于 `Error` 对象：**

根据错误类型，你也许可以用 `name` 和 `message` 属性获取更精炼的信息。

`name` 属性提供了常规的 `Error` 类（如 `DOMException` 或 `Error`），而 `message` 通常提供的信息比将错误对象转换成字符串得到的信息更简明。

在抛出自定义异常时，为了充分利用那些属性（比如 `catch` 块不能分辨是自定义异常还是系统异常时），你可以使用 `Error` 构造函数。

### JavaScript的Number对象与Math对象

与 String 一样，JavaScript会自动给数字创建 Number 对象。

Number 对象具有许多方法。其中之一是大量的静态常量：

| 属性                                                         | 描述                                                         |      |
| :----------------------------------------------------------- | :----------------------------------------------------------- | :--- |
| [`Number.MAX_VALUE`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_VALUE) | 可表示的最大正数（`1.7976931348623157e+308`）                |      |
| [`Number.MIN_VALUE`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_VALUE) | 可表示的最小正数（`5e-324`）                                 |      |
| [`Number.NaN`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/NaN) | 特殊值“非数值”                                               |      |
| [`Number.NEGATIVE_INFINITY`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/NEGATIVE_INFINITY) | 特殊值“负无穷”；在溢出时返回                                 |      |
| [`Number.POSITIVE_INFINITY`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/POSITIVE_INFINITY) | 特殊值“正无穷”；在溢出时返回                                 |      |
| [`Number.EPSILON`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON) | `1` 与能够表示为 [`Number`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number) 的最小大于 `1` 的值之间的差值（`2.220446049250313e-16`） |      |

以及一些静态方法：

| 方法                                                         | 描述                                                         |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| [`Number.parseFloat()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat) | 把字符串参数解析成浮点数，和全局方法 [`parseFloat()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/parseFloat) 作用一致。 |
| [`Number.parseInt()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt) | 把字符串解析成特定基数对应的整型数值，和全局方法 [`parseInt()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/parseInt) 作用一致。 |
| [`Number.isFinite()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite) | 判断传递的值是否为有限数值。                                 |
| [`Number.isInteger()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger) | 判断传递的值是否为整数。                                     |
| [`Number.isNaN()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN) | 判断传递的值是否为 [`NaN`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/NaN)。比原始全局函数 [`isNaN()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/isNaN) 更稳健（因为只有数字可以用）。 |
| [`Number.isSafeInteger()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) | 判断传递的值是否为*安全整数*。                               |

> 有关浮点数精度：为什么 `0.1 + 0.2 !== 0.3`？
> 因为 JS 使用 **IEEE 754 双精度浮点数**，二进制无法精确表示 `0.1`，所以计算结果是 `0.30000000000000004`。
>
> 解决方法主要有以下三种：
>
> 1. **方法一：`toFixed` 截断（展示时）**
>
>    ```js
>    (0.1 + 0.2).toFixed(2) === "0.30"; // 适合显示给用户
>    ```
>
> 2. **方法二：`Number.EPSILON` 容差比较（逻辑判断时）**
>
>    ```js
>    function isEqual(a, b) {
>        return Math.abs(a - b) < Number.EPSILON; // 极小容差
>    }
>    console.log(isEqual(0.1 + 0.2, 0.3)); // true
>    ```
> 
> 3. **方法三：转整数计算（金融敏感场景）**
>
>    ```js
>    // 将 0.1 和 0.2 乘以 10 变成整数 1 和 2，算完再除 10
>    (0.1 * 10 + 0.2 * 10) / 10 === 0.3; // true
>    ```

JavaScript有 Math 对象，提供了一些数学函数。与许多其他对象不同，你永远不会自己创建一个 `Math` 对象，而应总是使用内置的 `Math` 对象。

| 方法名                                                       | 描述                                                         |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| [`abs()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/abs) | 绝对值                                                       |
| [`sin()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/sin)、[`cos()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/cos)、[`tan()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/tan) | 标准三角函数。接受弧度制参数。                               |
| [`asin()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/asin)、[`acos()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/acos)、[`atan()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/atan)、[`atan2()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2) | 反三角函数。返回弧度制值。                                   |
| [`sinh()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh)、[`cosh()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh)、[`tanh()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/tanh) | 双曲函数。接受双曲角度。                                     |
| [`asinh()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/asinh)、[`acosh()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/acosh)、[`atanh()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/atanh) | 反双曲函数。返回双曲角度值。                                 |
| [`pow()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/pow)、[`exp()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/exp)、[`expm1()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1)、[`log()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/log)、[`log10()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/log10)、[`log1p()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p)、[`log2()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/log2) | 指数与对数函数。                                             |
| [`floor()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/floor)、[`ceil()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil) | 返回小于或等于给定参数的最大/最小整数。                      |
| [`min()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/min)、[`max()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/max) | 返回以逗号分隔的数字列表作为参数时的最小值或最大值（分别）。 |
| [`random()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/random) | 返回 0 到 1 之间的随机数。                                   |
| [`round()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/round)、[`fround()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/fround)、[`trunc()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc) | 舍入和截断函数。                                             |
| [`sqrt()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/sqrt)、[`cbrt()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt)、[`hypot()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot) | 平方根、立方根、平方和的平方根。                             |
| [`sign()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/sign) | 数字的符号，用于表示该数字是正数、负数还是零。               |
| [`clz32()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32)、 [`imul()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/imul) | 32 位二进制表示中的前导零位数。 两个参数按 C 语言风格进行 32 位乘法运算后的结果。 |

### Date对象

不好。

## 五、JavaScript HTML DOM

具体而言，HTML DOM就是指 html 中不同的块。他们带有不同的标签，且彼此通过嵌套关系形成了树形结构。借助这个结构，JavaScript可以方便的操作具体的块。

### 查找 html 元素

主要有几种方法：

1. 根据标签匹配：

   | 元素     | Tag                               | Class                                 | iD                         |
   | -------- | --------------------------------- | ------------------------------------- | :------------------------- |
   | **`document`方法** | **`getElementsByTagName('div')`** | **`getElementsByClassName('class')`** | **`getElementById('id')`** |
   | **唯一性** | **不唯一**（页面有无数个 `<div>`） | **不唯一**（多个元素可以共用同一个类） | **必须唯一**（同一个页面只能出现一次） |
   | **命名规则** | 固定的 HTML 标准词（`div`、`p`、`span`） | 你自己起名（`red`、`active`、`title`） | 你自己起名（`header`、`main-container`） |
   | **JS 返回类型** | `HTMLCollection`（多个） | `HTMLCollection` 或 `NodeList` | **单个元素** |
   | **JS 查找效率** | 较慢（要扫描整棵树找所有同名标签） | 中等（扫描所有标签过滤类名） | **最快**（直接通过哈希表定位，瞬间命中） |

   

