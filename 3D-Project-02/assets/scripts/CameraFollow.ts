import { _decorator, Component, Node, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 第三人称相机跟随：平滑跟随目标节点，并始终朝向目标。
 * 挂载到主相机，把 target 拖到 Player 节点。
 */
@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property({ type: Node, tooltip: '跟随目标（Player）' })
    target: Node | null = null;

    @property({ tooltip: '相机相对目标的偏移（越高越远）' })
    offset = new Vec3(0, 8, -10);

    @property({ tooltip: '平滑系数，越大跟随越紧' })
    smooth = 0.15;

    lateUpdate(dt: number) {
        if (!this.target) return;

        // 期望位置 = 目标位置 + 偏移
        const desired = this.target.worldPosition.clone().add(this.offset);

        // 指数平滑插值（与帧率无关）
        const t = 1 - Math.pow(1 - this.smooth, dt * 60);
        const current = this.node.worldPosition.clone();
        current.lerp(desired, t);
        this.node.setWorldPosition(current);

        // 相机看向目标
        this.node.lookAt(this.target.worldPosition);
    }
}
