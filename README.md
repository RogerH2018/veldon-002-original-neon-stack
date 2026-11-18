# NEON STACK · 霓虹堆栈

赛博朋克俄罗斯方块小游戏。Vite、原生 JavaScript、Canvas 2D 与 Web Audio，支持键盘、触屏按钮与滑动手势。

运行 `npm install` 安装依赖，`npm run dev` 启动开发模式，`npm run build` 构建到 `dist/`，`npm test` 检查核心玩法规则。OhMyGame 编辑器会管理预览服务器。

← → 移动，↑ / X 顺时针旋转，Z 逆时针旋转，↓ 软降，空格硬降，C / Shift 暂存，P / Esc 暂停，Enter 开始或重开。

最高分通过 OhMyGame SDK 的 `game.storage` 保存。设计文档与生成素材位于 `canvas/`，实际使用的城市背景位于 `public/art/`。运行时资源不依赖素材生成目录。
