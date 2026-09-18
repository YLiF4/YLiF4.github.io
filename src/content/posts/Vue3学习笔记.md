---
title: Vue3学习笔记
published: 2026-07-13
description: 'Vue3, TypeScript, JavaScript'
image: ''
tags: []
category: '前端'
draft: false 
lang: ''
---

# Vue3学习笔记

## Vue3 模板语法

### 事件

| 事件名称（模板里写） | 触发时机                    | TS 类型（函数里写）                     |
| :------------------- | :-------------------------- | :-------------------------------------- |
| `@click`             | 点击（鼠标左键/触摸板按压） | **`MouseEvent`**                        |
| `@dblclick`          | 双击                        | **`MouseEvent`**                        |
| `@contextmenu`       | 点击鼠标右键（弹出菜单）    | **`MouseEvent`**                        |
| `@mouseenter`        | 鼠标进入元素（不冒泡）      | **`MouseEvent`**                        |
| `@mouseleave`        | 鼠标离开元素（不冒泡）      | **`MouseEvent`**                        |
| `@mousemove`         | 鼠标在元素内移动            | **`MouseEvent`**                        |
| `@wheel`             | 滚动滚轮                    | **`WheelEvent`**（注意不是 MouseEvent） |
