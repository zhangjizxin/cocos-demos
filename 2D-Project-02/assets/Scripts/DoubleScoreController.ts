import { _decorator, Component, Graphics, Color, UITransform, tween } from 'cc';
const { ccclass } = _decorator;

/**
 * DoubleScoreController —— 双倍积分道具外观（挂在 DoubleScore 预制体上）
 * 接到后 10 秒内金币得分翻倍。
 * 外观：绿色圆形，里面写"x2"。
 */
@ccclass('DoubleScoreController')
export class DoubleScoreController extends Component {

    onLoad() {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        const ui = this.getComponent(UITransform);
        if (!ui) return;
        const w = ui.width;
        const h = ui.height;
        const r = Math.min(w, h) / 2 - 2;

        // 画绿色圆形
        g.clear();
        g.circle(0, 0, r);
        g.fillColor = new Color(80, 220, 100, 255);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor = new Color(40, 160, 60, 255);
        g.circle(0, 0, r);
        g.stroke();

        // 待机动画：轻微上下浮动
        tween(this.node)
            .by(0.5, { position: { x: 0, y: 10 } })
            .by(0.5, { position: { x: 0, y: -10 } })
            .repeatForever()
            .start();
    }

    onDestroy() {
        tween(this.node).stop();
    }
}
