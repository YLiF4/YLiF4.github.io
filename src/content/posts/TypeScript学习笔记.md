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

### 与JavaScript的区别

TypeScript = 带静态类型检查的JavaScript。

TypeScript兼容JavaScript，也就是说，所有的JavaScript在TypeScript中均合法。

### 何为“静态类型检查”？

TypeScript在编码和编译阶段，区分不同变量的类型。比如，定义一个 `number` 类型 `let a: number = 0` ，然后试图令 `a = "Hello, world!"` 。此时 TS 编译器会立即报错，因为在**形式上**0和"Hello, world!" 属于不同的类型。

然而，TS编译器在编译期做完类型检查后，会对所有的变量进行“**类型擦除**”：TS编译器会将TS源代码编译成JS代码，在JS中被直接翻译为`let a = 0` 。因此，TS在运行时是完全不关注类型的。

> 在 C++ 中，“强制类型”意味着**内存布局和指令生成是绑定的**。`int` 占 4 字节，有固定的加法指令；你绝对没办法在运行时把一个 `std::string` 塞进一个 `int` 变量里，因为内存根本对不上。
>
> 在 TS/JS 中，所有变量底层都是 **C++ 级别的 `void\*` 或 `std::any`**，它们只存引用，不在乎指向什么类型。**TS 的“强制”只是一层贴在编译阶段的“便签纸”**，运行时这张纸就撕掉了。

既然TS有静态类型检查，为什么还能兼容JS呢？原因在于：TS中引入了类型 `any` ：一切未指定类型的变量在TS中都被理解为 `any` 类型，TS编译器会自动忽略这一块的检查。
