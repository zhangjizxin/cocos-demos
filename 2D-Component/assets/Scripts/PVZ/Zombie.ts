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
        g.fillColor = new Color(70, 110, 60);
        g.roundRect(-11, -36, 9, 18, 3);
        g.fill();
        g.roundRect(2, -36, 9, 18, 3);
        g.fill();
        g.fillColor = new Color(110, 150, 85);
        g.roundRect(-16, -18, 32, 24, 6);
        g.fill();
        g.fillColor = new Color(90, 130, 70);
        g.roundRect(-22, 0, 12, 6, 2);
        g.fill();
        g.fillColor = new Color(120, 160, 90);
        g.circle(0, 10, 14);
        g.fill();
        g.fillColor = new Color(255, 255, 255);
        g.circle(-5, 13, 4.5);
        g.fill();
        g.circle(5, 13, 4.5);
        g.fill();
        g.fillColor = new Color(30, 30, 30);
        g.circle(-4.5, 13, 2.2);
        g.fill();
        g.circle(5.5, 13, 2.2);
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
