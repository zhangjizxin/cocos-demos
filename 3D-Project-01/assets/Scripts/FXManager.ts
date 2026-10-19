import { _decorator, Component, Prefab, instantiate, Node, Vec3, ParticleSystem, Director } from 'cc';
const { ccclass, property } = _decorator;


const POOL_SIZE = 6;

@ccclass('FXManager')
export class FXManager extends Component {

    public static instance: FXManager | null = null;

    @property({ type: Prefab })
    public dustPrfb: Prefab | null = null;       // 角色落地尘土
    @property({ type: Prefab })
    public coinFxPrfb: Prefab | null = null;     // 捡金币闪光
    @property({ type: Prefab })
    public explodePrfb: Prefab | null = null;    // 踩坑/撞墙失败爆炸

    private _dustPool: Node[] = [];
    private _coinPool: Node[] = [];
    private _explodePool: Node[] = [];

    /** 确保全局只有一个 FXManager；场景里没有就自动创建一个（此时需手动拖预制体） */
    public static ensure(): FXManager | null {
        if (FXManager.instance) return FXManager.instance;
        const scene = Director.instance.getScene();
        if (!scene) return null;
        const node = new Node('FXManager');
        scene.addChild(node);
        return node.addComponent(FXManager);
    }

    onLoad() {
        FXManager.instance = this;
    }

    onDestroy() {
        if (FXManager.instance === this) FXManager.instance = null;
    }

    // ========== 对外接口 ==========
    spawnDust(worldPos: Vec3) {
        this._spawn(this._dustPool, this.dustPrfb, worldPos);
    }
    spawnCoin(worldPos: Vec3) {
        this._spawn(this._coinPool, this.coinFxPrfb, worldPos);
    }
    spawnExplosion(worldPos: Vec3) {
        this._spawn(this._explodePool, this.explodePrfb, worldPos);
    }

    // ========== 内部实现 ==========

    // 从池里取一个节点 → 放到目标世界坐标 → 播放 → 播完回池
    private _spawn(pool: Node[], prfb: Prefab | null, worldPos: Vec3) {
        if (!prfb) return;                       // 未拖入预制体则跳过，游戏不受影响

        let node = pool.pop();
        if (!node) {                             // 池空才新实例化
            node = instantiate(prfb);
            this.node.addChild(node);
        }

        const ps = node.getComponent(ParticleSystem);
        node.setWorldPosition(worldPos);
        node.active = true;
        if (ps) {
            ps.stop();
            ps.clear();
            ps.play();
        }

        // 粒子最长寿命 + 余量，到点隐藏回收
        const ttl = ps ? (ps.startLifetime.constant + 0.2) : 1.0;
        this.scheduleOnce(() => {
            if (ps) { ps.stop(); ps.clear(); }
            node.active = false;
            pool.push(node);
        }, ttl);
    }
}
