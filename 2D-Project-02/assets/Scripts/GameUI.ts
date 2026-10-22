import { _decorator, Component, Node, Button, Label } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

/**
 * GameUI —— 开始界面 + 结束界面控制
 *
 * 引用都在编辑器检查器里拖好：
 *   @property gameManagerNode  挂 GameManager 的 Game 节点
 *   @property startPanel       开始界面节点（初始显示）
 *   @property endPanel         结束界面节点（初始隐藏）
 *   @property startButton      开始游戏按钮
 *   @property restartButton    重新开始按钮
 *   @property finalScoreLabel   结束界面的得分 Label
 *   @property highScoreLabel   结束界面的最高分 Label
 */
@ccclass('GameUI')
export class GameUI extends Component {

    @property({ type: Node })
    public gameManagerNode: Node | null = null;
    @property({ type: Node })
    public startPanel: Node | null = null;
    @property({ type: Node })
    public endPanel: Node | null = null;
    @property({ type: Node })
    public startButton: Node | null = null;
    @property({ type: Node })
    public restartButton: Node | null = null;
    @property({ type: Label })
    public finalScoreLabel: Label | null = null;
    @property({ type: Label })
    public highScoreLabel: Label | null = null;   // 最高分显示

    private _gm: GameManager | null = null;

    onLoad() {
        if (this.gameManagerNode) {
            this._gm = this.gameManagerNode.getComponent(GameManager);
        }

        if (this.startPanel) this.startPanel.active = true;
        if (this.endPanel) this.endPanel.active = false;

        this.startButton?.on(Button.EventType.CLICK, this._onStart, this);
        this.restartButton?.on(Button.EventType.CLICK, this._onRestart, this);

        if (this._gm) {
            this._gm.onGameOver = (score: number) => this._showEnd(score);
        }
    }

    onDestroy() {
        this.startButton?.off(Button.EventType.CLICK, this._onStart, this);
        this.restartButton?.off(Button.EventType.CLICK, this._onRestart, this);
        if (this._gm) this._gm.onGameOver = null;
    }

    private _onStart() {
        if (!this._gm) return;
        if (this.startPanel) this.startPanel.active = false;
        this._gm.startGame();
    }

    private _onRestart() {
        if (!this._gm) return;
        if (this.endPanel) this.endPanel.active = false;
        this._gm.startGame();
    }

    // 游戏结束：显示得分 + 最高分
    private _showEnd(score: number) {
        if (this.finalScoreLabel) this.finalScoreLabel.string = '得分: ' + score;
        // 从 GameManager 拿最高分显示
        if (this._gm && this.highScoreLabel) {
            const high = this._gm.getHighScore();
            this.highScoreLabel.string = '最高分: ' + high;
        }
        if (this.endPanel) this.endPanel.active = true;
    }
}
