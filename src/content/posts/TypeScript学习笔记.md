---
title: TypeScript学习笔记
published: 2026-07-12
description: ''
image: ''
tags: [TypeScript, Vue3]
category: '前端'
draft: false 
lang: ''
---

# TypeScript学习笔记

## TypeScript概述

### TypeScript做了什



### 与JavaScript的区别

TypeScript = 带静态类型检查的JavaScript。

TypeScript兼容JavaScript，也就是说，所有的JavaScript在TypeScript中均合法。

### 何为“静态类型检查”？

TypeScript在编码和编译阶段，区分不同变量的类型。比如，定义一个 `number` 类型 `let a: number = 0` ，然后试图令 `a = "Hello, world!"` 。此时 TS 编译器会立即报错，因为在**形式上**0和"Hello, world!" 属于不同的类型。

然而，TS编译器在编译期做完类型检查后，会对所有的变量进行“**类型擦除**”：TS编译器会将TS源代码编译成JS代码，在JS中被直接翻译为`let a = 0` 。因此，TS在运行时是完全不关注类型的。

> 在 C++ 中，“强制类型”意味着**内存布局和指令生成是绑定的**。`int` 占 4 字节，有固定的加法指令；你绝对没办法在运行时把一个 `std::string` 塞进一个 `int` 变量里，因为内存根本对不上。
>
> 在 TS/JS 中，所有变量底层都是 **C++ 级别的 `void\*` 或 `std::any`**，它们只存引用，不在乎指向什么类型。**TS 的“强制”只是一层贴在编译阶段的“便签纸”**，运行时这张纸就撕掉了。

既然TS有静态类型检查，为什么还能兼容JS呢？原因在于：

1. TS中引入了类型 `any` ：一切未指定类型的变量在TS中都被理解为 `any` 类型，TS编译器会自动忽略这一块的检查。
2. TS代码总是会转译成一份JS代码来运行。尽管tsc工具会报错，他仍然会坚持输出一份JS代码。

## TypeScript类型

### 后置类型声明

在JavaScript的基础上，TypeScript 使用后置 `: typename` 进行类型的声明。

```typescript
let a: string = "Hello, world!";
```

多数情况并不需要我们显式指定变量的值，因为编译器会**自动推断。** 我们仍然可以直接写成

```ts
let a = "Hello, world!";
a = 123; // 报错，因为发生了类型推断，a被判定为string类型
```

我们可以为一个变量指定多种可能的类型：

```ts
let a: string | number = "Hello, world!";
a = 123
```

### 函数功能

函数的参数、返回值同样可以指定类型：

```ts
let add = function(x: number, y: number) : number {
    return x + y;
}
```

同样的，通常并不需要**返回类型注解**（但是推荐开启）。**参数类型注解往往是必要的**。

对于匿名函数，往往**可以省略大部分类型注解**（当然也可以手动添加），原因是编译器会自动进行上下文推断：

```ts
// ✅ 完美！x 自动推断为 string，无需写 :string
const arr = ['a', 'b', 'c'];
arr.map(x => x.toUpperCase()); 

// ✅ 完美！e 自动推断为 React.MouseEvent，无需写注解
button.addEventListener('click', (e) => {
  console.log(e.target);
});
```

### 枚举类型

TypeScript引入了枚举类型 `enum` 。与C++类似。

### 元组 Tuples

TypeScript引入了元组 `tuples` ，是一种固定类型与长度的数组。

```ts
let point: [number, number] = [10, 20];
```

### 类型别名

TS可以给类型打包，例如：

```ts
type StringOrNumber = string | number;
```

## TypeScript语法

### 循环

`forEach` 与 `every` ：都是传入一个函数，对数组每一个元素进行操作。不一样的是，every的函数允许选择 `return true/false'` 。当返回值为false时，循环中断。

## TypeScript 面向对象

### 对象与类

对象是类的一个具体实例。

JS和TS使用 `class` 定义类。

```ts
class node {
    from?: number;
    to: number;
    nxt: number;
    weight: number = 1;
    static count: number = 0;
    constructor(to: number, nxt: number) {
        this.to = to;
        this.nxt = nxt;
        node.count++;
    }
}
```

关于类型注记：

- 直接`:` ：必须在实例化前被赋值。可以直接赋值，也可以在构造函数 constructor 中赋值。
- 使用可选参数 `?:` ：这个参数有可能不存在。
- 使用非空断言 `!:` ：这个参数认为保证非空。
- `static` 参数：不检查，但是建议赋值。

### 访问控制修饰符

TS与C++一样具有 `public`、`protected`、 `private` 修饰符。

### 抽象类 `abstract class` 与接口 `interface` 

TS允许定义抽象类。

```ts
abstract class Shape {
    static count: number = 0;
    abstract shappeName: string;
    abstract getArea(): number;
}
```

对于 `abstract class` ，可以给成员加上 `abstract` 修饰。对于没有被修饰的成员，与普通类相同，必须进行初始化处理。

而对于具有 `abstract` 修饰的属性，则需要在派生的子类里进行处理。

特别的，抽象类也可以定义构造函数。在子类中，这个函数将以 `super()` 形式被执行。

```ts
abstract class Shape {
    name: string;
    static count: number = 0;
    abstract shappeName: string;
    abstract getArea(): number;
    constructor(name: string) {
        this.name = name;
        Shape.count++;
    }
}
class circle extends Shape {
    radius: number;
    shappeName: string = "circle";
    getArea(): number {
        return Math.PI * this.radius * this.radius;
    }
    constructor(radius: number) {
        super("Circle");
        this.radius = radius;
    }
}
```

很遗憾，TS只允许单继承，即 `extend` 后只能跟一个类。但是，TS允许继承自多个接口，使用 `implements` ：

```ts
interface Shape {
    name: string;
    shappeName: string;
    getArea(): number;
}

// 静态计数器 — interface 不支持 static 成员，改用模块级变量
let shapeCount: number = 0;

class circle implements Shape {
    name: string;
    radius: number;
    shappeName: string = "circle";
    getArea(): number {
        return Math.PI * this.radius * this.radius;
    }
    constructor(radius: number) {
        this.name = "Circle";
        this.radius = radius;
        shapeCount++;
    }
}
```

> **interface 为什么允许多继承？**
>
> 因为多继承本来就是一个问题。C++使用virtual解决但效果不好。TS直接禁止。
>
> 但是interface承诺不实现，因此不会引发冲突。

interface只用于TS静态检查，运行时会擦除，零开销。而abstract class会被保留。

## TypeScript开发

### 模块化编程

