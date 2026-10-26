import { _decorator, Component, Graphics } from 'cc';
const { ccclass } = _decorator;

@ccclass('PhysicsGround')
export class PhysicsGround extends Component {
    start() {
        // 用 Graphics 画一条水平地面，作为小球下落的碰撞平面
        const g = this.getComponent(Graphics)!;
        g.fillColor.set(90, 90, 100, 255);
        g.rect(-300, -15, 600, 30);
        g.fill();
    }
}
