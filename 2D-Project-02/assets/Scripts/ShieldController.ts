import { _decorator, Component, Graphics, Color, UITransform, tween } from 'cc';
const { ccclass } = _decorator;

/**
 * ShieldController —— 护盾道具外观（挂在 Shield 预制体上）
 * 接到后可以挡一次炸弹（接到炸弹不扣分）。
 * 外观：蓝色圆形，里面画一个盾牌形状。
 */
@ccclass('ShieldController')
export class ShieldController extends Component {

    onLoad() {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        const ui = this.getComponent(UITransform);
        if (!ui) return;
        const w = ui.width;
        const h = ui.height;
        const r = Math.min(w, h) / 2 - 2;

        // 画蓝色圆形背景
        g.clear();
        g.circle(0, 0, r);
        g.fillColor = new Color(80, 160, 255, 255);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor = new Color(40, 100, 200, 255);
        g.circle(0, 0, r);
        g.stroke();

        // 画盾牌形状（简化版：倒三角）
        g.moveTo(-10, 8);
        g.lineTo(10, 8);
        g.lineTo(0, -12);
        g.close();
        g.fillColor = new Color(255, 255, 255, 200);
        g.fill();

        // 待机动画：轻微旋转
        tween(this.node)
            .by(1, { angle: 15 })
            .by(1, { angle: -15 })
            .repeatForever()
            .start();
    }

    onDestroy() {
        tween(this.node).stop();
    }
}
