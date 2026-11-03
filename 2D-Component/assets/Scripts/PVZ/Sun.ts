import { _decorator, Component, Vec3, tween, Button } from 'cc';
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
