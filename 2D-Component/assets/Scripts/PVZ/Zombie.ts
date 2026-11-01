import { _decorator, Component, Graphics, Color } from 'cc';
import { GameRoot } from './GameRoot';
import { ObjectPool } from './ObjectPool';

const { ccclass } = _decorator;

@ccclass('Zombie')
export class Zombie extends Component {
    hp = 150;
    speed = 20;
    attackInterval = 0.6;
    attackDamage = 30;
    row = 0;
    private attackT = 0;

    setup(row: number) {
        this.row = row;
        this.hp = 150;
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(90, 160, 70);
        g.circle(0, 18, 14);
        g.fill();
        g.fillColor = new Color(120, 100, 90);
        g.roundRect(-14, -16, 28, 30, 8);
        g.fill();
    }

    update(dt: number) {
        const target = GameRoot.instance.findPlantInFront(this.node.position.x, this.row);
        if (target && target.node.isValid) {
            this.attackT += dt;
            if (this.attackT >= this.attackInterval) {
                this.attackT = 0;
                target.takeDamage(this.attackDamage);
            }
        } else {
            this.node.setPosition(this.node.position.x - this.speed * dt, this.node.position.y);
            if (this.node.position.x < -480) {
                GameRoot.instance.gameOver();
                return;
            }
        }
    }

    takeDamage(dmg: number) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            ObjectPool.instance.put(this.node, 'zombie');
        }
    }
}
