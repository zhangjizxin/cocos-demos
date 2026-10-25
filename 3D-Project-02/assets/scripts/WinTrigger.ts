import { _decorator, Component, Node, Vec3, director } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

/**
 * 终点判定（距离检测版）：不依赖物理触发器，
 * 每帧计算与 Player 的距离，够近即触发判定。
 */
@ccclass('WinTrigger')
export class WinTrigger extends Component {
    @property({ tooltip: '判定半径' })
    triggerRadius = 1.5;

    private _player: Node | null = null;

    onLoad() {
        this._player = director.getScene()?.getChildByName('Player') ?? null;
    }

    update() {
        if (!this._player) return;
        const dist = Vec3.distance(this.node.worldPosition, this._player.worldPosition);
        if (dist < this.triggerRadius) {
            GameManager.Instance?.checkWin();
        }
    }
}
