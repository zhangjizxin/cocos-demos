import { _decorator, Component, Node, Prefab, instantiate, UITransform, Label, view, input, Input, KeyCode, EventKeyboard } from 'cc';
const { ccclass, property } = _decorator;

/**
 * GameManager —— 2D「接金币」主控（组件接线版，自适应屏幕尺寸）
 *
 * 引用都在编辑器检查器里拖好：
 *   @property playerNode   玩家节点（把层级里的 Player 拖进来）
 *   @property coinPrfb     金币预制体（把 assets/Prefab/Coin.prefab 拖进来）
 *   @property scoreLabel   得分文本（把 ScoreLabel 的 Label 组件拖进来）
 *
 * 玩法：金币从屏幕顶部随机下落，玩家接到加分；
 *       漏掉一个金币（掉出屏幕底部）→ 游戏结束。
 * 出生/判定边界按当前可见尺寸动态计算，任何设计分辨率都能玩。
 *
 * 配合 GameUI：
 *   - 开局先显示开始界面，须调用 startGame() 才会开始生成金币；
 *   - 游戏结束时通过 onGameOver 回调通知 UI 弹出结束界面（不再用文字提示+空格重开，空格仍可重开）。
 */
@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Node })
    public playerNode: Node | null = null;      // 玩家节点（检查器拖入）
    @property({ type: Prefab })
    public coinPrfb: Prefab | null = null;      // 金币预制体（检查器拖入）
    @property({ type: Label })
    public scoreLabel: Label | null = null;     // 得分文本（检查器拖入）

    @property
    public coinFallSpeed = 320;                 // 金币下落速度 px/s（越小越简单）
    @property
    public spawnInterval = 0.9;                 // 每几秒出一个金币（越大越简单）
    @property
    public scorePerCoin = 10;                   // 每枚金币得分

    /** 游戏结束回调（由 GameUI 注入，参数为最终得分） */
    public onGameOver: ((score: number) => void) | null = null;

    private _coins: Node[] = [];
    private _score = 0;
    private _spawnTimer = 0;
    private _gameOver = false;
    private _started = false;                   // 是否已开始（开局显示开始界面，未开始前不生成金币）

    // 当前设计分辨率的可见半宽/半高（中心为原点），动态适配横竖屏
    private get _halfW() { return view.getVisibleSize().width / 2; }
    private get _halfH() { return view.getVisibleSize().height / 2; }

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    /** 开始 / 重新开始一局：清空场上残留金币、重置得分，随后开始生成 */
    public startGame() {
        for (const c of this._coins) c.destroy();
        this._coins.length = 0;
        this._score = 0;
        this._spawnTimer = 0;
        this._gameOver = false;
        this._started = true;
        if (this.scoreLabel) this.scoreLabel.string = '得分: 0';
    }

    update(deltaTime: number) {
        if (!this._started || this._gameOver) return;   // 未开始或已结束则不再生成/下落
        this._spawnTimer += deltaTime;
        if (this._spawnTimer >= this.spawnInterval) {
            this._spawnTimer = 0;
            this._spawnCoin();
        }
        this._updateCoins(deltaTime);
    }

    // 在屏幕顶部上方随机 X 位置生成一个金币
    private _spawnCoin() {
        if (!this.coinPrfb) return;
        const coin = instantiate(this.coinPrfb);
        this.node.addChild(coin);               // 金币作为 Game 节点的子节点
        const x = (Math.random() * 2 - 1) * (this._halfW - 40);
        coin.setPosition(x, this._halfH + 60, 0);   // 出生在屏幕上方看不见的位置
        this._coins.push(coin);
    }

    // 金币下落 + 接取判定 + 漏接结束
    private _updateCoins(dt: number) {
        const remove: Node[] = [];
        for (const coin of this._coins) {
            const pos = coin.position;
            const newY = pos.y - this.coinFallSpeed * dt;
            coin.setPosition(pos.x, newY, 0);

            // 接住金币 → 加分
            if (this.playerNode && this._overlap(this.playerNode, coin)) {
                this._score += this.scorePerCoin;
                if (this.scoreLabel) this.scoreLabel.string = '得分: ' + this._score;
                remove.push(coin);
                continue;
            }
            // 漏出屏幕底部 → 游戏结束
            if (newY < -this._halfH - 60) {
                remove.push(coin);
                this._gameOver = true;
                this._started = false;
                if (this.scoreLabel) this.scoreLabel.string = '游戏结束';
                if (this.onGameOver) this.onGameOver(this._score);
                break;
            }
        }
        for (const c of remove) {
            const idx = this._coins.indexOf(c);
            if (idx >= 0) this._coins.splice(idx, 1);
            c.destroy();
        }
    }

    // 简易 AABB 重叠检测（玩家和金币都是 Canvas 下的节点，坐标可直接比）
    private _overlap(a: Node, b: Node): boolean {
        const ta = a.getComponent(UITransform);
        const tb = b.getComponent(UITransform);
        if (!ta || !tb) return false;
        return Math.abs(a.position.x - b.position.x) < (ta.width + tb.width) / 2
            && Math.abs(a.position.y - b.position.y) < (ta.height + tb.height) / 2;
    }

    // 游戏结束后按空格重新开始（快捷方式，与 UI 按钮等价）
    private onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.SPACE && this._gameOver) {
            this.startGame();
        }
    }
}
