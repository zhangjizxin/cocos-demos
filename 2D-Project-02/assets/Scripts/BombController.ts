import { _decorator, Component, Graphics, Color, UITransform, tween } from 'cc';
const { ccclass } = _decorator;

/**
 * BombController —— 炸弹外观 + 待机动画（挂在 Bomb 预制体上）
 * 接到炸弹会扣分。
 */
@ccclass('BombController')
export class BombController extends Component {

    onLoad() {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        const ui = this.getComponent(UITransform);
        if (!ui) return;
        const w = ui.width;
        const h = ui.height;

        // 画黑色圆形炸弹
        g.clear();
        g.circle(0, 0, Math.min(w, h) / 2 - 2);
        g.fillColor = new Color(40, 40, 40, 255);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor = new Color(100, 100, 100, 255);
        g.circle(0, 0, Math.min(w, h) / 2 - 2);
        g.stroke();

        // 画引线（小矩形）
        g.rect(-3, Math.min(w, h) / 2 - 2, 6, 10);
        g.fillColor = new Color(150, 100, 50, 255);
        g.fill();

        // 待机动画：轻微旋转
        tween(this.node)
            .by(1, { angle: 10 })
            .by(1, { angle: -10 })
            .repeatForever()
            .start();
    }

    onDestroy() {
        tween(this.node).stop();
    }
}
