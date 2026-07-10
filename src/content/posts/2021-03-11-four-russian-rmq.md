---
title: "Four-Russian 算法求解 RMQ"
published: 2021-03-11
description: ''
image: ''
tags: [数据结构]
category: 算法
draft: false
lang: ''
---

# 普通做法

分块，设块长为 $len$。我们求出每个块内的ST表，再求出块之间的ST表。

当$len=\log n$时预处理复杂度最优，为$O(\dfrac{n}{\log n} \log n+\dfrac{n}{\log n} \log n\log\log n)=O(n\log\log n)$。

查询就可以直接分成左-中-右三段进行查询。

# 算法改进

左右两端本质上是对前后缀的操作。可以在预处理的时候 $O(n)$ 求出块内前后缀最大值。

这样查询的时候就只要访问一个 ST 表。

# 玄学优化

分块乱搞，设块大小为 $len$。

我们暴力预处理每个块前缀、后缀的最大值，用 ST表 求出任意连续块之间的最大值。

预处理复杂度为 $O(\dfrac{n}{len}\log\dfrac{n}{len}+n+n) = O(n)$。

查询的时候找中间夹着的块的最大值、左侧后缀和右侧前缀。

查询显然是 $O(1)$ 的。

但是这个做法有问题。当左右端点在同一块内时就假了。

两个端点在同一块内的概率是 $\dfrac{len}{n}$，每次查询的代价是 $len$，所以期望为 $O(\dfrac{len^2}{n})$。

令 $len = \sqrt n$  每次暴力查询期望复杂度为 $O(1)$。

这样我们就得到了一个 $O(n)$ 预处理， $O(1)$ 查询的做法。时间复杂度期望 $O(n)$。

但是出题人不会卡你吗？

可能会，但一般卡不掉，而且不敢卡。

因为我们可以对块的大小进行调整，而出题人不知道你的块长。而只要让两端尽量在不同块内就可以保证复杂度。

如果出题人刻意卡这种做法，就要让 $l,r$ 尽量接近。但这样暴力就很可能直接硬跑过去。

这个算法的复杂度接近下界，并且无论是复杂度还是常数、代码难度都较小，所以较实用。

# 例题

## [Luogu P3865 【模板】ST表](https://www.luogu.com.cn/problem/P3865)

ST 表板题，可以作为板子打。

```cpp
#include <cstdio>
#include <algorithm>
#include <cmath>
using namespace std;
const int N = 1e5 + 5;
int a[N], st[N/10][25];
int pre[N], suf[N];
int block, n, m;
int read() {
    register int n = 0, f = 1;
    register char ch = getchar();
    for (; ch < '0' || ch > '9'; ch = getchar()) if (ch == '-') f = -1;
    for (; ch >= '0' && ch <= '9'; ch = getchar()) n = (n << 3) + (n << 1) + (ch ^ '0');
    return n * f;
}
int getpos(int x) { return (x + block - 1) / block; }
int bf(int l, int r) {
    int res = a[l];
    for (int i = l; i <= r; i++)
        res = max(res, a[i]);
    return res;
}
void init() {
    int p = getpos(n);
    for (int len = 1; len <= 20; len++)
        for (int i = 1; i <= p - (1 << len) + 1; i++)
            st[i][len] = max(st[i][len - 1], st[i + (1 << (len - 1))][len - 1]);
    for (int i = 1; i <= n; i++)
        if (i % block != 1)
            pre[i] = max(pre[i - 1], a[i]);
        else
            pre[i] = a[i];
    for (int i = n; i >= 1; i--)
        if (i % block)
            suf[i] = max(suf[i + 1], a[i]);
        else
            suf[i] = a[i];
}
int query(int l, int r) {
    int e = log2(r - l - 1);
    int res = max(st[l + 1][e], st[r - (1 << e)][e]);
    return res;
}
int main() {
    n = read(), m = read();
    block = log2(n);
    for (int i = 1; i <= n; i++) {
        int j = getpos(i);
        a[i] = read();
        st[j][0] = max(a[i], st[j][0]);
    }
    init();
    for (int x, y; m; m--) {
        x = read(), y = read();
        int l = getpos(x), r = getpos(y);
        if (l == r) printf("%d\n", bf(x, y));
        else if (r - l == 1) {
            printf("%d\n", max(pre[y], suf[x]));
        } else {
            printf("%d\n", max(max(pre[y],suf[x]),query(l,r)));
        }
    }
    return 0;
}
```

## [Luogu P3793 由乃救爷爷](https://www.luogu.com.cn/problem/P3793)

详见 [Luogu P3793 由乃救爷爷](https://www.cnblogs.com/Lewis-Li/p/LG_P3793.html)
