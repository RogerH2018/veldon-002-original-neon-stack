# NEON STACK · 霓虹堆栈

## 中文

赛博朋克方块消除游戏。堆叠方块，填满横行，每消除十行提升一级。支持键盘、触屏按钮和滑动手势。顶部按钮可切换中英文，最高分保存在当前浏览器。 [网页试玩](https://rogerh2018.github.io/veldon-002-original-neon-stack/?lang=zh)

`←` / `→` 移动，`↑` / `X` 顺转，`Z` 逆转，`↓` 软降，空格硬降，`C` / `Shift` 暂存，`P` / `Esc` 暂停或继续，`Enter` 开始或重开。

点击顶部「双人」进入同屏对决。两人使用相同的方块序列。一人结束后，另一人可以继续追分。两人都结束后，最终得分较高者获胜，同分平局。

| 操作 | 玩家 1 | 玩家 2 |
| --- | --- | --- |
| 移动 | A / D | ← / → |
| 顺转 / 逆转 | W / Q | ↑ / `/` |
| 软降 / 硬降 | S / F | ↓ / Enter |
| 暂存 | E | 右 Shift |

`P` 或 `Esc` 可同时暂停两块棋盘。触屏玩家用各自棋盘下的按钮操作。

## English

A cyberpunk falling-block puzzle. Stack pieces to clear rows and level up every ten lines. Play with a keyboard, touch buttons, or swipes. Switch languages from the toolbar. Your best score is saved in this browser. [Play in your browser](https://rogerh2018.github.io/veldon-002-original-neon-stack/?lang=en)

Use `←` / `→` to move, `↑` / `X` to rotate clockwise, `Z` to rotate counterclockwise, `↓` to soft drop, Space to hard drop, `C` / `Shift` to hold, `P` / `Esc` to pause or resume, and `Enter` to start or play again.

Choose **Two players** for a local match. Both players receive the same pieces. When one player finishes, the other keeps playing. The higher final score wins after both runs end. Equal scores are a draw.

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | ← / → |
| Rotate clockwise / counterclockwise | W / Q | ↑ / `/` |
| Soft drop / hard drop | S / F | ↓ / Enter |
| Hold | E | Right Shift |

Press `P` or `Esc` to pause both boards. On a touchscreen, use the buttons beneath each board.

## 本地开发 / Development

```sh
npm ci
npm run dev
npm test
npm run build
```

静态构建输出位于 `dist/`。游戏使用 Vite、原生 JavaScript、Canvas 2D 和 Web Audio。设计资料见 `canvas/`，运行时背景见 `public/art/`。

The static build is written to `dist/`. The game uses Vite, vanilla JavaScript, Canvas 2D, and Web Audio. Design files live in `canvas/` and runtime artwork in `public/art/`.

`gh-pages` 分支托管 `dist/` 的静态构建。 The `gh-pages` branch publishes the static build to GitHub Pages. [部署分支 / Deployment branch](https://github.com/RogerH2018/veldon-002-original-neon-stack/tree/gh-pages)
