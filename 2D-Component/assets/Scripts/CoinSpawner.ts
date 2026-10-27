import { _decorator, Component, NodePool, Prefab, instantiate, Vec3, Node } from 'cc';
import { Coin } from './Coin';
import { PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

@ccclass('CoinSpawner')
export class CoinSpawner extends Component {
    @property({ type: Prefab })
    coinPrefab: Prefab = null!;

    @property({ type: Node })
    player: Node = null!;

    @property
    spawnInterval = 1;

    @property
    spawnRangeX = 300;

    private _pool: NodePool = null!;

    onLoad() {
        this._pool = new NodePool();
        this.schedule(this.spawnOne, this.spawnInterval);
    }

    spawnOne() {
        if (!this.coinPrefab) {
            console.warn('CoinSpawner: 还没有设置 coinPrefab 预制体');
            return;
        }
        const node = this._pool.size() > 0 ? this._pool.get() : instantiate(this.coinPrefab);
        node.setParent(this.node.parent!);

        const pos = this.node.position.clone();
        pos.x += (Math.random() * 2 - 1) * this.spawnRangeX;
        node.setPosition(pos);
        node.active = true;

        const coin = node.getComponent(Coin)!;
        coin.init(this, this.player?.getComponent(PlayerController) ?? null);
    }

    recycle(coin: Coin) {
        coin.node.removeFromParent();
        this._pool.put(coin.node);
    }
}
