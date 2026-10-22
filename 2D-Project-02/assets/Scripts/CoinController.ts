import { _decorator, Component, Graphics, Color, UITransform, tween } from 'cc';
const { ccclass } = _decorator;

/**
 * CoinController —— 金币外观 + 待机动画（挂在 Coin 预制体上）
 * 用 Graphics 画一个金色圆环；下落与接取判定由 GameManager 负责。
 *
 * 动画：金币下落过程中做「缩放呼吸 + 绕 Z 轴旋转」的循环。
 */
@ccclass('CoinController')
export class CoinController extends Component {

    onLoad() {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        const ui = this.getComponent(UITransform);
        if (!ui) return;
        const r = Math.min(ui.width, ui.height) / 2 - 2;
        g.clear();
        g.circle(0, 0, r);
        g.fillColor = new Color(255, 200, 40, 255);
        g.fill();
        g.lineWidth = 5;
        g.strokeColor = new Color(220, 150, 0, 255);
        g.circle(0, 0, r);
        g.stroke();

        // —— tween 动画：缩放呼吸 + 旋转，无限循环 ——
        tween(this.node)
            .repeatForever(
                tween()
                    .to(0.3, { scale: { x: 1.2, y: 1.2 } })
                    .to(0.3, { scale: { x: 1.0, y: 1.0 } })
            )
            .start();

        tween(this.node)
            .by(1.5, { angle: 360 })
            .repeatForever()
            .start();
    }

    onDestroy() {
        tween(this.node).stop();
    }
}
