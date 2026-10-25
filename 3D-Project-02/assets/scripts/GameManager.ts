import { _decorator, Component, Node, Label, AudioSource, Button, director } from 'cc';
import { PlayerController } from './PlayerController';

const { ccclass, property } = _decorator;

/** 游戏状态机 */
enum GameState {
    READY = 0,   // 待开始（显示开始界面）
    PLAYING = 1, // 游戏中
    END = 2,     // 已结束（显示结束界面）
}

/**
 * 全局游戏管理：状态机 + 宝物计数 + 计时 + 开始/结束界面 + 音效。
 * 用到的 Cocos 组件：Label、Button、Node.active、AudioSource、director.loadScene。
 */
@ccclass('GameManager')
export class GameManager extends Component {
    public static Instance: GameManager | null = null;

    // —— 左上/右上 HUD ——
    @property({ type: Label, tooltip: '宝物计数 Label' })
    coinLabel: Label | null = null;
    @property({ type: Label, tooltip: '计时 Label' })
    timerLabel: Label | null = null;
    @property({ type: Label, tooltip: '中途提示 Label' })
    messageLabel: Label | null = null;

    // —— 开始 / 结束界面 ——
    @property({ type: Node, tooltip: '开始界面面板（含“开始游戏”按钮）' })
    startPanel: Node | null = null;
    @property({ type: Node, tooltip: '结束界面面板（含“重新开始”按钮）' })
    endPanel: Node | null = null;
    @property({ type: Label, tooltip: '结束界面的结果文本 Label' })
    endResultLabel: Label | null = null;

    // —— 音效（AudioSource）——
    @property({ type: AudioSource, tooltip: '背景音乐（循环）' })
    bgmAudio: AudioSource | null = null;
    @property({ type: AudioSource, tooltip: '拾取宝物音效' })
    coinAudio: AudioSource | null = null;
    @property({ type: AudioSource, tooltip: '通关音效' })
    winAudio: AudioSource | null = null;

    private _total = 0;
    private _collected = 0;
    private _time = 0;
    private _won = false;
    private _state: GameState = GameState.READY;
    private _playerCtrl: PlayerController | null = null;

    onLoad() {
        GameManager.Instance = this;
    }

    start() {
        // 从场景根节点找 Player 上的控制器
        const player = director.getScene()?.getChildByName('Player');
        this._playerCtrl = player?.getComponent(PlayerController) ?? null;

        // 自动绑定开始面板 / 结束面板里的按钮
        this.bindButton(this.startPanel, this.onStartClick);
        this.bindButton(this.endPanel, this.onRestartClick);

        // 初始状态：显示开始界面，暂停角色
        this._state = GameState.READY;
        this.setPlayerInput(false);
        if (this.startPanel) this.startPanel.active = true;
        if (this.endPanel) this.endPanel.active = false;
        if (this.messageLabel) this.messageLabel.node.active = false;
        if (this.timerLabel) this.timerLabel.string = '时间: 0.0s';
        this.updateCoinUI();
    }

    /** 在指定面板里找 Button 并绑定点击 */
    private bindButton(panel: Node | null, cb: () => void) {
        if (!panel) return;
        const btn = panel.getComponentInChildren(Button);
        if (btn) btn.node.on(Button.EventType.CLICK, cb, this);
    }

    /** 点击“开始游戏”按钮 */
    onStartClick() {
        if (this._state !== GameState.READY) return;
        this._state = GameState.PLAYING;
        this.setPlayerInput(true);
        if (this.startPanel) this.startPanel.active = false;
        if (this.messageLabel) this.messageLabel.node.active = false;
        // 开始播放循环 BGM
        if (this.bgmAudio) {
            this.bgmAudio.loop = true;
            this.bgmAudio.play();
        }
    }

    /** 点击“重新开始”按钮：重新加载当前场景 */
    onRestartClick() {
        director.loadScene('Maze');
    }

    /** 由 GameManager 控制角色输入开关 */
    private setPlayerInput(enable: boolean) {
        if (this._playerCtrl) this._playerCtrl.inputEnabled = enable;
    }

    /** 宝物节点创建时注册，累计总数 */
    registerCoin() {
        this._total++;
        this.updateCoinUI();
    }

    /** 玩家拾取宝物 */
    collectCoin(node: Node) {
        this._collected++;
        node.destroy();
        this.updateCoinUI();
        // 播放拾取音效
        if (this.coinAudio) this.coinAudio.playOneShot(this.coinAudio.clip);
    }

    /** 到达终点时判定是否通关 */
    checkWin() {
        if (this._state !== GameState.PLAYING || this._won) return;
        if (this._collected >= this._total) {
            this._won = true;
            this.endGame('恭喜通关！用时 ' + this._time.toFixed(1) + ' 秒');
        } else {
            if (this.messageLabel) {
                this.messageLabel.node.active = true;
                this.messageLabel.string = '还差 ' + (this._total - this._collected) + ' 个宝物，继续探索！';
            }
        }
    }

    /** 通关 → 显示结束界面，停角色、停 BGM、播通关音效 */
    private endGame(resultText: string) {
        this._state = GameState.END;
        this.setPlayerInput(false);
        if (this.bgmAudio) this.bgmAudio.stop();
        if (this.winAudio) this.winAudio.playOneShot(this.winAudio.clip);
        if (this.endResultLabel) this.endResultLabel.string = resultText;
        if (this.endPanel) this.endPanel.active = true;
        if (this.messageLabel) this.messageLabel.node.active = false;
    }

    update(dt: number) {
        // 只有“游戏中”才计时
        if (this._state !== GameState.PLAYING) return;
        this._time += dt;
        if (this.timerLabel) this.timerLabel.string = '时间: ' + this._time.toFixed(1) + 's';
    }

    private updateCoinUI() {
        if (this.coinLabel) this.coinLabel.string = '宝物: ' + this._collected + ' / ' + this._total;
    }
}
