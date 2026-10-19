import { _decorator, Component, Graphics, Color, UITransform } from 'cc';
const { ccclass } = _decorator;

/**
 * CoinController —— 金币外观（挂在 Coin 预制体上）
 * 用 Graphics 画一个金色圆环。下落与接取判定由 GameManager 负责。
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
    }
}
