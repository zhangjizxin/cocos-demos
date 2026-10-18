import { _decorator, Component, tween, Vec3 } from 'cc';
const { ccclass } = _decorator;

/**
 * 金币旋转动画组件
 * 挂到金币节点上后，金币会绕自身 Y 轴无限旋转（约 1 秒转一圈）。
 * 用 Cocos 的 tween 缓动实现，比每帧改角度更平滑。
 */
@ccclass("CoinSpin")
export class CoinSpin extends Component {

    onLoad() {
        // repeatForever：无限循环；by(时长, 属性增量)：1 秒内绕 Y 轴转 360°
        tween(this.node)
            .repeatForever(
                tween().by(1.0, { eulerAngles: new Vec3(0, 360, 0) })
            )
            .start();
    }
}
