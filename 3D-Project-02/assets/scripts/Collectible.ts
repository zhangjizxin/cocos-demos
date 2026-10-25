import { _decorator, Component, Node, Vec3, director } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

/**
 * 宝物收集（距离检测版）：
 * 不依赖物理触发器，每帧计算与 Player 的距离，够近即收集。
 * 这样不受物理引擎 / Is Trigger 影响，100% 稳定。
 */
@ccclass('Collectible')
export class Collectible extends Component {
    @property({ tooltip: '收集判定半径' })
    collectRadius = 1.3;

    private _player: Node | null = null;
    private _collected = false;

    onLoad() {
        // 从场景根节点找 Player
        this._player = director.getScene()?.getChildByName('Player') ?? null;
    }

    start() {
        GameManager.Instance?.registerCoin();
    }

    update() {
        if (this._collected || !this._player) return;
        const dist = Vec3.distance(this.node.worldPosition, this._player.worldPosition);
        if (dist < this.collectRadius) {
            this._collected = true;
            GameManager.Instance?.collectCoin(this.node);
        }
    }
}
