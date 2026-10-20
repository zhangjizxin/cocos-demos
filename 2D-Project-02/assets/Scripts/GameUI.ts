import { _decorator, Component, Node, Button, Label } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

/**
 * GameUI —— 开始界面 + 结束界面控制（纯组件接线版，无美术资源）
 * 挂在 Canvas 下的 UI_Root 节点上。引用都在编辑器检查器里拖好：
 *   @property gameManagerNode  挂 GameManager 的 Game 节点
 *   @property startPanel       开始界面节点（初始显示）
 *   @property endPanel         结束界面节点（初始隐藏，需取消勾选 active）
 *   @property startButton      开始游戏按钮节点（带 Button 组件）
 *   @property restartButton    重新开始按钮节点（带 Button 组件）
 *   @property finalScoreLabel  结束界面里的得分 Label 组件
 *
 * 交互：开局显示开始界面 → 点“开始游戏”→ 隐藏并调用 GameManager.startGame()；
 *       漏接金币触发 GameManager.onGameOver 回调 → 显示结束界面（含最终得分）
 *       → 点“重新开始”→ 重新开始一局。
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

    private _gm: GameManager | null = null;

    onLoad() {
        if (this.gameManagerNode) {
            this._gm = this.gameManagerNode.getComponent(GameManager);
        }

        // 初始状态：显示开始界面，隐藏结束界面
        if (this.startPanel) this.startPanel.active = true;
        if (this.endPanel) this.endPanel.active = false;

        // 按钮点击（脚本绑定，无需在检查器里配 clickEvents）
        this.startButton?.on(Button.EventType.CLICK, this._onStart, this);
        this.restartButton?.on(Button.EventType.CLICK, this._onRestart, this);

        // 游戏结束时显示结束界面（由 GameManager 回调注入）
        if (this._gm) {
            this._gm.onGameOver = (score: number) => this._showEnd(score);
        }
    }

    onDestroy() {
        this.startButton?.off(Button.EventType.CLICK, this._onStart, this);
        this.restartButton?.off(Button.EventType.CLICK, this._onRestart, this);
        if (this._gm) this._gm.onGameOver = null;
    }

    // 点“开始游戏”
    private _onStart() {
        if (!this._gm) return;
        if (this.startPanel) this.startPanel.active = false;
        this._gm.startGame();
    }

    // 点“重新开始”
    private _onRestart() {
        if (!this._gm) return;
        if (this.endPanel) this.endPanel.active = false;
        this._gm.startGame();
    }

    // 游戏结束：更新得分并弹出结束界面
    private _showEnd(score: number) {
        if (this.finalScoreLabel) this.finalScoreLabel.string = '得分: ' + score;
        if (this.endPanel) this.endPanel.active = true;
    }
}
