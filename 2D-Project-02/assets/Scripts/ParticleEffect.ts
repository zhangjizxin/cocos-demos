import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

/**
 * ParticleEffect —— 接金币时的粒子爆炸特效（挂在 ParticleEffect.prefab 根节点上）
 *
 * 粒子默认自动播放（Play On Load 勾选），不需要手动调用 play()。
 * 这个脚本只负责：1 秒后自动销毁节点。
 */
@ccclass('ParticleEffect')
export class ParticleEffect extends Component {

    onLoad() {
        // 粒子默认自动播放，这里不需要手动调用
        // 1 秒后自动销毁
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 1);
    }
}
