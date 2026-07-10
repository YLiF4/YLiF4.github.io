---
title: 向量叉积在高中数学中的应用
published: 2025-03-02
description: ''
image: ''
tags: []
category: 数学
draft: false
lang: ''
---

# 向量的运算及性质

前置知识（也许）：[线性代数基础知识 - LewisLi](https://www.cnblogs.com/Lewis-Li/p/linear_preknowledge.html)

除非特殊说明，否则以下向量均默认指三维向量。

## 线性运算

包括加法与数乘。

## 点积（内积）——垂直与正交

### 模

设向量 $\vec{a}=(x,y,z)$，定义其模（2-范数）为 $|\vec a| = \sqrt{x^2+y^2+z^2}$，几何意义为向量所对应的有向线段的长度。

模是度量向量大小的方法，它满足：

1. 正定性：$|\vec a| > 0, |\vec 0|=0$。
2. 正齐次性：$|\lambda\vec a| = \lambda|\vec a|$。
3. 三角不等式：$|\vec a + \vec b| \leq |\vec a| + |\vec b|$。

若数域 $F$ 上的线性空间 $V$ 存在满足上述三条性质的映射 $||\cdot||:V\to F$，则称 $V$ 为一个**赋范空间**。这里不深入讨论。

利用模，我们可以定义向量的**单位化**：$\hat a=\frac{\vec a}{|\vec a|},|\hat a|=1$。

### 内积

两个向量张成一个平面，它们必然存在一个夹角。

定义两个向量的内积 $\vec a \cdot \vec b=a_1b_1+a_2b_2+a_3b_3$，并定义两个向量的夹角 $\cos<\vec a, \vec b> =\frac{\vec a \cdot \vec b}{|\vec a| |\vec b|}$。

容易验证这与我们熟知的夹角定义一致。

当 $\vec a \cdot \vec b=0$​​ 时，称这两个向量**正交**。

由定义不难推出内积是满足分配律的。

## 叉积（外积）——描述张成

设有不共线向量 $\vec a,\vec b$ 和 $\vec v$ 满足 $\vec v = \lambda \vec a + \mu \vec b$，即线性相关，那么，必然存在一个非令向量 $\vec n$，使得
$$
\begin{cases} \vec a \cdot \vec n = 0 \\
\vec b \cdot \vec n = 0
\end{cases}
$$
从而 $\vec v \cdot \vec n = \lambda \vec a\cdot\vec n + \mu\vec b\cdot\vec n = 0+0=0$。

于是我们就用一个向量 $\vec n$ 表示了 $\vec a, \vec b$​ 的张成。

现在我们来解上面的方程，把系数写开：
$$
\begin{cases}
n_1a_1+n_2a_2+n_3a_3=0 \\
n_1b_1+n_2b_2+n_3a_3=0
\end{cases}
$$
由定义 $n_i$ 不同时为零，不妨假设 $n_3 \neq 0$，同时除以 $n_3$​，于是方程组转化为
$$
\begin{cases}
\frac{n_1}{n_3}a_1+\frac{n_2}{n_3}a_2=-a_3 \\
\frac{n_1}{n_3}b_1+\frac{n_2}{n_3}b_2=-b_3
\end{cases}
$$
由 Cramer 法则得到
$$
\frac{n_1}{n_3}=\frac{\begin{vmatrix}-a_3&a_2\\-b_3&b_2\end{vmatrix}}{\begin{vmatrix}a_1&a_2\\b_1&b_2\end{vmatrix}},\frac{n_2}{n_3}=\frac{\begin{vmatrix}a_1&-a_3\\-b_1&-b_3\end{vmatrix}}{\begin{vmatrix}a_1&a_2\\b_1&b_2\end{vmatrix}}
$$
于是 $\vec n$ 的一个特解为
$$
\vec n =\begin{pmatrix} \begin{vmatrix}a_2&a_3\\b_2&b_3\end{vmatrix}, \begin{vmatrix}a_3&a_1\\b_3&b_1\end{vmatrix},\begin{vmatrix}a_1&a_2\\b_1&b_2\end{vmatrix}\end{pmatrix}
$$
将这个解作为 $\vec a$ 与 $\vec b$ 的叉积（外积），记为 $\vec a \times \vec b$​。约定当 $\vec a = \lambda \vec b$ 时 $\vec n=\vec 0$。

由行列式的性质也不难证明叉积**满足分配律**。

### 叉积的几何意义

$\vec n = \vec a\times \vec b$ 同时与 $\vec a$ 和 $\vec b$ 正交，因此 $\vec n$​ 代表两向量所张成的平面的法向量。

可以证明，$\vec a \times \vec b$ 的模 $|\vec n|$ 表示 $\vec a, \vec b$ 围成的平行四边形的面积。

### 叉积的性质

1. 反交换律：$\vec a \times \vec b=-\vec b \times \vec a$。
2. 分配律：$\vec a \times(\vec b+\vec c)=\vec a\times\vec b+\vec a\times\vec c$。
3. 线性性：$\lambda\vec a\times\vec b=\vec a\times\lambda\vec b=\lambda(\vec a\times\vec b)$。
4. 雅可比恒等式：$\vec a\times(\vec b\times\vec c)+\vec b\times(\vec c\times\vec a)+\vec c\times(\vec  a\times\vec b)=0$。
5. 叉积不满足结合律。
6. 混合积：$\vec a\cdot(\vec b\times\vec c)=|\vec a,\vec b,\vec c|$​。
7. 拉格朗日公式：$(\vec a\times\vec b)\times\vec c=(\vec c\cdot\vec a)\vec b-(\vec c\cdot\vec b)\vec a,\vec a\times(\vec b\times\vec c)=(\vec a\cdot\vec c)\vec b-(\vec a\cdot\vec b)\vec c$。

# 齐次坐标

## 无穷远元素的引入与射影平面

传统欧式平面下，任意两点确定一条直线，任意两线却不一定有一个交点。

我们引入无穷远这一理想概念：任意一组平行的直线系中的直线均交于同一个无穷远点，所有方向上的无穷远点在一条无穷远直线上。

这样一来，平面上就不再有平行这一概念。所有直线都将是封闭的，也不存在左右的概念。

受到平面直角坐标系的启发，我们尝试用坐标来抽象地定义平面，但是二维坐标已经无法表示这个新平面的所有元素，即使我们约定 $(\infty,\infty)$ 表示无穷远点。

因此我们引入一个新的维度：令 $(x,y,z)$ 表示原来的 $(\frac{x}{z},\frac{y}{z})$，并约定当 $z=0$ 时表示原来 $(x,y)$ 方向上的无穷远点。

这样一来，所有的 $A(\rho x,\rho y,\rho z)(\rho \in \R,\rho\neq0)$ 均表示同一元素，记为一个等价类 $A$。取 $A$ 的一个代表记为 $A^*$。把所有等价类的集合称为一个**射影平面**，上述坐标称为**绝对坐标**。$(0,0,0)$ 不表示任何元素，把它排除在平面外。

用新的坐标替换平面直角坐标系的直线：$\alpha\frac{x}{z}+\beta\frac{y}{z}+\gamma=0$ 得到射影平面上的直线方程 $\alpha x+\beta y+\gamma z=0$。如果把点看作向量，则直线表示为 $(\alpha, \beta, \gamma)\cdot(x,y,z)=0$。我们不妨用三元组 $[\alpha,\beta,\gamma]$ 来表示直线，方法与上面同理，当 $\alpha=\beta=0,\gamma\neq 0$​ 时表示无穷远线。

有意思的是，点与直线的形式在这个定义下完全一致，因此点与线之间是可以互换的，在一个命题中把点换成线，线换成点，不改变正确性。这被称作**对偶原理**。

## 齐次坐标下坐标系的选取与运算的几何意义

考察一条直线 $l$ 与其上两点 $A\cdot l=0,B\cdot l=0$，则有 $l\cdot(\lambda A+\mu B)=\lambda A\cdot l+\mu B\cdot l=0$，从而点 $\lambda A+\mu B$ 也在直线上。

同理，$\lambda \xi +\mu\zeta$ 也一定过 $\xi \cap \zeta$​。

因此，

在射影平面上取不共线三点 $A,B,C$，由定义它们线性无关，从而平面上任意一点 $D$ 可以用不全为零的实数 $\lambda,\mu,\sigma$ 表示为 $\lambda A+\mu B+\sigma C$，称三元组 $(\lambda,\mu,\sigma)$ 为点 $D$ 的相对坐标。

一旦 $ABC$​ 确定，每个点的相对坐标便确定了。但是无论坐标系如何选取，平面的定义始终与相对坐标无关，而平面上元素的关系（射影不变量）也不会随着坐标系的变化而变化。

![空间视角下的齐次坐标](https://pic.imgdb.cn/item/6602d8209f345e8d03d20793.png)

从三维空间上看，所谓“射影平面”实质上是用一个面在空间中去截从原点发出的线束。而无穷远元素，其实是这个平面的灭点与灭线

## 用向量描述几何关系

给定平面两点 $A,B$，他们确定一条直线 $l$，现在要根据点求出直线的坐标。

列方程 $A\cdot l=0,B\cdot l=0$，显然 $l=A\times B$。

同理两直线交点 $P=\xi\times\zeta$。

> 让我们把目光暂时放回平面直角坐标系，假设有两点 $(x_1,y_1)(x_2,y_2)$，在不涉及斜率的情况下，我们可以直接写出连线方程：$\begin{vmatrix}y_1&1\\y_2&1\end{vmatrix}x+\begin{vmatrix}1&x_1\\1&x_2\end{vmatrix}y+\begin{vmatrix}x_1&y_1\\x_2&y_2\end{vmatrix}=0$

让我们继续考虑直线 $AB$ 上的另一点 $C \cdot(A\times B)=0$，由叉积性质得 $|C,A,B|=0$，即行列式为零。

同理 $\xi,\zeta,\eta$ 共点当且仅当 $|\xi,\zeta,\eta|=0$。

## 例题：2025 武汉二调 T19

设 $P(x_1,y_1)$，$M(x_2,y_2)$，易知 $PM$ 过 $(-1,-4)$。

$\vec P=(x_1,y_1,1)$，$\vec M=(x_2,y_2,1)$，$l_{PM}=\vec P \times \vec M=[y_1-y_2,x_2-x_1,x_1y_2-x_2y_1]$。

$l_{PM} \times \overrightarrow{(-1,-4,1)}=0$，即
$$
-(y_1-y_2)-4(x_2-x_1)+x_1y_2-x_2y_1=0
$$
易知 $Q(-1,-\dfrac{4(x_1+1)}{y_1})$，$N(-1,-\dfrac{4(x_2+1)}{y_2})$。

$\vec Q=(y_1,4(x_1+1),-y_1)$，$\vec N=(y_2,4(x_2+1),-y_2)$。

于是同理有
$$
\begin{align}
l_{QM}=[4(x_1+1)-y_1y_2,-y_1x_2-y_1,y_1y_2-4(x_1+1)x_2] \\
l_{PN}=[4(x_2+1)-y_1y_2,-y_2x_1-y_2,y_1y_2-4(x_2+1)x_1]
\end{align}
$$
$(7)-(8)$ 得
$$
l_{QM}-l_{PN}=[4(x_1-x_2),(x_1y_2-x_2y_1)-(y_1-y_2),4(x_1-x_2)]
$$
将 $(6)$ 与 $(9)$ 对比发现 $l_{QM}-l_{PN}=[1,-1,1]$，即定直线是 $y=x+1$。

# 二次曲线

## 配极变换

称一个射影平面上的点到线，线到点的变换为一个对射变换。

可以证明对射变换具有射影不变性。

对于一个对射变换 $\gamma$，若满足 $\gamma^2=I$，则称这是一个**配极变换**。

二维射影平面上的配极可以写成三维对称矩阵 $M$，证明略。

于是有 $\gamma^T=\gamma^{-1}$。

### 极点与极线

记点 $A$ 变换后的直线为 $\xi=\gamma A$，称 $(A,\xi)$ 为一组极点极线。

显然，若 $A$ 的极线过点 $B$，那么 $B$ 的极线过点 $A$，这被称为 **配极原则**。满足配极原则的两点配极共轭。

若 $A \cdot \gamma A=0$，称其为自共轭点或自共轭直线。

## 由配极导出的二次曲线

射影平面上所有的自共轭点（直线）所组成（包络）的图形被称作一个二次曲线。

简单推导一下：

$$
Ax^2+2Bxy+Cy^2+2Dxz+2Eyz+Fz^2=0 \Leftrightarrow
(x,y,z)\begin{bmatrix}A&B&D\\B&C&E\\D&E&F\end{bmatrix}\begin{pmatrix}x\\y\\z\end{pmatrix}=0
$$

### 判断位置关系

### 配极曲线
