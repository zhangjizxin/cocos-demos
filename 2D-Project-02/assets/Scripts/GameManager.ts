import { _decorator, Component, Node, Prefab, instantiate, UITransform, Label, view, input, Input, KeyCode, EventKeyboard, AudioSource, AudioClip, tween, Vec3, director, sys } from 'cc';
import { GameEvent } from './GameEvent';
const { ccclass, property } = _decorator;

const HIGH_SCORE_KEY = 'coin_game_high_score';  // localStorage 存储键名

/**
 * GameManager —— 2D「接金币」主控（组件接线版，自适应屏幕尺寸）
 *
 * 引用都在编辑器检查器里拖好：
 *   @property playerNode   玩家节点（把层级里的 Player 拖进来）
 *   @property coinPrfb     金币预制体（把 assets/Prefab/Coin.prefab 拖进来）
 *   @property scoreLabel   得分文本（把 ScoreLabel 的 Label 组件拖进来）
 *   @property coinSound    接金币音效（assets/audio/coin.wav）
 *   @property failSound    失败音效（assets/audio/fail.wav）
 *   @property bgmClip      背景音乐（assets/audio/bgm.wav）
 */
@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Node })
    public playerNode: Node | null = null;
    @property({ type: Prefab })
    public coinPrfb: Prefab | null = null;
    @property({ type: Label })
    public scoreLabel: Label | null = null;
    @property({ type: AudioClip })
    public coinSound: AudioClip | null = null;
    @property({ type: AudioClip })
    public failSound: AudioClip | null = null;    // 失败音效
    @property({ type: AudioClip })
    public bgmClip: AudioClip | null = null;      // 背景音乐
    @property({ type: Prefab })
    public floatTextPrfb: Prefab | null = null;   // 接金币飘字特效预制体
    @property({ type: Prefab })
    public particleEffectPrfb: Prefab | null = null;  // 接金币粒子爆炸特效预制体
    @property({ type: Node })
    public cameraNode: Node | null = null;       // 相机节点（用于屏幕震动）
    @property({ type: Node })
    public pausePanel: Node | null = null;       // 暂停面板节点
    @property({ type: Prefab })
    public bombPrfb: Prefab | null = null;       // 炸弹预制体
    @property({ type: Prefab })
    public doubleScorePrfb: Prefab | null = null; // 双倍积分预制体
    @property({ type: Prefab })
    public shieldPrfb: Prefab | null = null;      // 护盾预制体

    @property
    public coinFallSpeed = 320;
    @property
    public spawnInterval = 0.9;
    @property
    public scorePerCoin = 10;

    public onGameOver: ((score: number) => void) | null = null;

    private _coins: Node[] = [];
    private _score = 0;
    private _displayScore = 0;   // 当前显示的分数（滚动动画用）
    private _highScore = 0;       // 历史最高分（从 localStorage 读取）
    private _spawnTimer = 0;
    private _gameOver = false;
    private _started = false;
    private _paused = false;      // 是否暂停中
    private _doubleScore = false; // 双倍积分是否激活
    private _hasShield = false;   // 是否有护盾
    private _sfxAudio: AudioSource | null = null;  // 音效用（接金币、失败）
    private _bgmAudio: AudioSource | null = null;   // 背景音乐用（循环播放）

    /** 获取历史最高分（GameUI 结束界面用） */
    public getHighScore(): number {
        return this._highScore;
    }

    private get _halfW() { return view.getVisibleSize().width / 2; }
    private get _halfH() { return view.getVisibleSize().height / 2; }

    onLoad() {
        // 音效 AudioSource：负责接金币、失败等一次性音效
        this._sfxAudio = this.getComponent(AudioSource) || this.addComponent(AudioSource);

        // 背景音乐 AudioSource：单独一个，因为 BGM 需要循环播放且不能被音效打断
        this._bgmAudio = this.addComponent(AudioSource);
        this._bgmAudio.loop = true;           // 循环播放
        this._bgmAudio.volume = 0.5;         // BGM 音量小一点，不要盖过音效

        // 从本地存储读取历史最高分
        this._highScore = Number(sys.localStorage.getItem(HIGH_SCORE_KEY)) || 0;

        // —— 监听接金币事件 ——
        GameEvent.on('coin-collected', (coinNode: Node) => {
            // 双倍积分激活时，得分翻倍
            const gain = this._doubleScore ? this.scorePerCoin * 2 : this.scorePerCoin;
            this._score += gain;
            if (this._score > this._highScore) {
                this._highScore = this._score;
                sys.localStorage.setItem(HIGH_SCORE_KEY, String(this._highScore));
            }
            this._updateScoreDisplay();
            this._playSfx(this.coinSound);
            this._spawnFloatText(coinNode.position);
            this._spawnParticleEffect(coinNode.position);
            this._shakeCamera();
        }, this);

        // —— 监听接炸弹事件：有护盾就挡掉，否则扣分 ——
        GameEvent.on('bomb-collected', (bombNode: Node) => {
            if (this._hasShield) {
                // 有护盾，挡掉炸弹，护盾消失
                this._hasShield = false;
                this._playSfx(this.coinSound);  // 用金币音效表示护盾挡掉
            } else {
                // 没护盾，扣分
                this._score = Math.max(0, this._score - 20);
                this._playSfx(this.failSound);
            }
            this._updateScoreDisplay();
            this._shakeCamera();
        }, this);

        // —— 监听接双倍积分事件：激活双倍 10 秒 ——
        GameEvent.on('double-score-collected', () => {
            this._doubleScore = true;
            this._playSfx(this.coinSound);
            // 10 秒后自动失效
            this.scheduleOnce(() => {
                this._doubleScore = false;
            }, 10);
        }, this);

        // —— 监听接护盾事件：获得护盾 ——
        GameEvent.on('shield-collected', () => {
            this._hasShield = true;
            this._playSfx(this.coinSound);
        }, this);
    }

    start() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        GameEvent.off('coin-collected', undefined, this);  // 取消事件监听
    }

    /** 开始 / 重新开始一局 */
    public startGame() {
        for (const c of this._coins) c.destroy();
        this._coins.length = 0;
        this._score = 0;
        this._displayScore = 0;
        this._spawnTimer = 0;
        this._gameOver = false;
        this._started = true;
        if (this.scoreLabel) this.scoreLabel.string = '得分: 0';

        // 开始播放背景音乐
        this._playBGM();
    }

    update(deltaTime: number) {
        if (!this._started || this._gameOver || this._paused) return;  // 暂停时不更新
        this._spawnTimer += deltaTime;
        if (this._spawnTimer >= this.spawnInterval) {
            this._spawnTimer = 0;
            this._spawnCoin();
        }
        this._updateCoins(deltaTime);
    }

    // 在屏幕顶部上方随机生成物品（金币/炸弹/双倍积分/护盾）
    private _spawnCoin() {
        // 随机决定生成什么：60% 金币，15% 炸弹，15% 双倍积分，10% 护盾
        const rand = Math.random();
        let prfb: Prefab | null = null;
        if (rand < 0.6) {
            prfb = this.coinPrfb;                    // 金币
        } else if (rand < 0.75) {
            prfb = this.bombPrfb;                    // 炸弹
        } else if (rand < 0.9) {
            prfb = this.doubleScorePrfb;            // 双倍积分
        } else {
            prfb = this.shieldPrfb;                  // 护盾
        }
        if (!prfb) return;

        const item = instantiate(prfb);
        this.node.addChild(item);
        const x = (Math.random() * 2 - 1) * (this._halfW - 40);
        item.setPosition(x, this._halfH + 60, 0);
        this._coins.push(item);
    }

    private _updateCoins(dt: number) {
        const remove: Node[] = [];
        for (const coin of this._coins) {
            const pos = coin.position;
            const newY = pos.y - this.coinFallSpeed * dt;
            coin.setPosition(pos.x, newY, 0);

            // 接住物品 → 根据名字发不同事件
            if (this.playerNode && this._overlap(this.playerNode, coin)) {
                const name = coin.name;
                if (name === 'Bomb') {
                    GameEvent.emit('bomb-collected', coin);
                } else if (name === 'DoubleScore') {
                    GameEvent.emit('double-score-collected', coin);
                } else if (name === 'Shield') {
                    GameEvent.emit('shield-collected', coin);
                } else {
                    GameEvent.emit('coin-collected', coin);   // 默认金币
                }
                remove.push(coin);
                continue;
            }
            // 漏出屏幕底部 → 游戏结束
            if (newY < -this._halfH - 60) {
                remove.push(coin);
                this._gameOver = true;
                this._started = false;
                if (this.scoreLabel) this.scoreLabel.string = '游戏结束';
                this._onGameOver();
                break;
            }
        }
        for (const c of remove) {
            const idx = this._coins.indexOf(c);
            if (idx >= 0) this._coins.splice(idx, 1);
            c.destroy();
        }
    }

    // 播放一次性音效（接金币、失败都用这个）
    private _playSfx(clip: AudioClip | null) {
        if (this._sfxAudio && clip) {
            this._sfxAudio.playOneShot(clip, 1);
        }
    }

    // 在指定位置弹出 "+10" 飘字特效
    private _spawnFloatText(pos: { x: number, y: number }) {
        if (!this.floatTextPrfb) return;
        const effect = instantiate(this.floatTextPrfb);
        this.node.addChild(effect);
        effect.setPosition(pos.x, pos.y, 0);
    }

    // 在指定位置爆出金色粒子
    private _spawnParticleEffect(pos: { x: number, y: number }) {
        if (!this.particleEffectPrfb) return;
        const effect = instantiate(this.particleEffectPrfb);
        this.node.addChild(effect);
        effect.setPosition(pos.x, pos.y, 0);
    }

    // 屏幕震动：相机左右抖动 0.2 秒，幅度 10px
    private _shakeCamera() {
        if (!this.cameraNode) return;
        const originPos = this.cameraNode.position;
        tween(this.cameraNode)
            .by(0.05, { position: new Vec3(10, 0, 0) })
            .by(0.05, { position: new Vec3(-10, 0, 0) })
            .by(0.05, { position: new Vec3(7, 0, 0) })
            .by(0.05, { position: new Vec3(-7, 0, 0) })
            .by(0.05, { position: new Vec3(4, 0, 0) })
            .by(0.05, { position: new Vec3(-4, 0, 0) })
            .call(() => {
                this.cameraNode?.setPosition(originPos);  // 回到原位
            })
            .start();
    }

    // 得分数字滚动：从当前显示值平滑滚动到目标值
    private _updateScoreDisplay() {
        if (!this.scoreLabel) return;
        const start = this._displayScore;
        const end = this._score;
        const duration = 0.3;  // 滚动动画时长 0.3 秒

        // 用 tween 做数字滚动：0.3 秒内从 start 滚到 end
        const obj = { val: start };
        tween(obj)
            .to(duration, { val: end }, {
                progress: (target, ratio) => {
                    // 每帧更新 Label 文字
                    const current = Math.floor(start + (end - start) * ratio);
                    this._displayScore = current;
                    if (this.scoreLabel) {
                        this.scoreLabel.string = '得分: ' + current;
                    }
                }
            })
            .call(() => {
                this._displayScore = end;
                if (this.scoreLabel) {
                    this.scoreLabel.string = '得分: ' + end;
                }
            })
            .start();
    }

    // 播放背景音乐
    private _playBGM() {
        if (this._bgmAudio && this.bgmClip) {
            this._bgmAudio.stop();           // 先停掉之前的
            this._bgmAudio.clip = this.bgmClip;
            this._bgmAudio.play();
        }
    }

    // 停止背景音乐
    private _stopBGM() {
        if (this._bgmAudio) {
            this._bgmAudio.stop();
        }
    }

    // 游戏结束：播放失败音效 + 停 BGM + 通知 UI
    private _onGameOver() {
        this._playSfx(this.failSound);
        this._stopBGM();
        if (this.onGameOver) this.onGameOver(this._score);
    }

    private _overlap(a: Node, b: Node): boolean {
        const ta = a.getComponent(UITransform);
        const tb = b.getComponent(UITransform);
        if (!ta || !tb) return false;
        return Math.abs(a.position.x - b.position.x) < (ta.width + tb.width) / 2
            && Math.abs(a.position.y - b.position.y) < (ta.height + tb.height) / 2;
    }

    // 空格：游戏结束时重新开始；P 键：暂停/继续
    private onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.SPACE && this._gameOver) {
            this.startGame();
        }
        // 按 P 键切换暂停状态（游戏中才生效）
        if (e.keyCode === KeyCode.KEY_P && this._started && !this._gameOver) {
            this._togglePause();
        }
    }

    // 切换暂停/继续
    private _togglePause() {
        this._paused = !this._paused;
        if (this.pausePanel) {
            this.pausePanel.active = this._paused;  // 显示/隐藏暂停面板
        }
        if (this._paused) {
            director.pause();    // 暂停游戏
        } else {
            director.resume();   // 继续游戏
        }
    }
}
