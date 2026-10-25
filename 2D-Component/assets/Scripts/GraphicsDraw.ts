import { _decorator, Component, Graphics } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GraphicsDraw')
export class GraphicsDraw extends Component {
    start() {
        const g = this.getComponent(Graphics)!;
        // 画一个实心圆
        g.fillColor.set(255, 0, 0, 255);
        g.circle(0, 0, 80);
        g.fill();
        // 画一条蓝色直线
        g.strokeColor.set(0, 100, 255, 255);
        g.moveTo(-100, -60);
        g.lineTo(100, 60);
        g.lineWidth = 4;
        g.stroke();
    }
}
