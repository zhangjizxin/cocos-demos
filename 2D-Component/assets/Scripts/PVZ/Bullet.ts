import { _decorator, Component, Graphics, Color } from 'cc';
import { GameRoot } from './GameRoot';
import { ObjectPool } from './ObjectPool';

const { ccclass } = _decorator;

@ccclass('Bullet')
export class Bullet extends Component {
    speed = 500;
    damage = 25;
    row = 0;

    setup(row: number, x: number, y: number) {
        this.row = row;
        this.node.setPosition(x, y);
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(90, 220, 90);
        g.circle(0, 0, 9);
        g.fill();
        g.strokeColor = new Color(40, 120, 50);
        g.lineWidth = 1.5;
        g.circle(0, 0, 9);
        g.stroke();
        g.fillColor = new Color(190, 255, 190);
        g.circle(-3, 3, 3);
        g.fill();
    }

    update(dt: number) {
        const p = this.node.position;
        this.node.setPosition(p.x + this.speed * dt, p.y);
        const z = GameRoot.instance.findZombieHit(this.row, this.node.position.x, 15);
        if (z) {
            z.takeDamage(this.damage);
            ObjectPool.instance.put(this.node, 'bullet');
            return;
        }
        if (this.node.position.x > 480) ObjectPool.instance.put(this.node, 'bullet');
    }
}
