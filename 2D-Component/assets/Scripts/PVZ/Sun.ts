import { _decorator, Component, Graphics, Color, UITransform, Vec3, tween, Button } from 'cc';
import { GameRoot } from './GameRoot';

const { ccclass } = _decorator;

@ccclass('Sun')
export class Sun extends Component {
    value = 25;
    private collected = false;

    setup(x: number, y: number, value: number, fallFrom: number) {
        this.value = value;
        this.collected = false;
        this.node.setPosition(x, fallFrom);
        const ui = this.getComponent(UITransform) || this.addComponent(UITransform);
        ui.setContentSize(56, 56);
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(255, 230, 90, 80);
        g.circle(0, 0, 30);
        g.fill();
        g.fillColor = new Color(255, 220, 60);
        g.circle(0, 0, 22);
        g.fill();
        g.fillColor = new Color(255, 245, 160);
        g.circle(-6, 6, 7);
        g.fill();
        const btn = this.getComponent(Button) || this.addComponent(Button);
        btn.node.off(Button.EventType.CLICK, this.collect, this);
        btn.node.on(Button.EventType.CLICK, this.collect, this);
        tween(this.node)
            .to(0.8, { position: new Vec3(x, y, 0) })
            .delay(8)
            .call(() => {
                if (!this.collected) this.node.destroy();
            })
            .start();
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        GameRoot.instance.addSun(this.value);
        this.node.destroy();
    }
}
