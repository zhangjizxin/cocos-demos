import { _decorator, Component, Graphics, Color } from 'cc';
import { GridManager } from './GridManager';
import { GameRoot } from './GameRoot';

const { ccclass } = _decorator;

@ccclass('Plant')
export class Plant extends Component {
    type = 'sunflower';
    row = 0;
    col = 0;
    hp = 200;
    private shootT = 0;
    private sunT = 0;

    get cost() {
        return this.type === 'shooter' ? 100 : 50;
    }

    setup(type: string, row: number, col: number) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.hp = type === 'wallnut' ? 800 : 200;
        const g = this.getComponent(Graphics) || this.addComponent(Graphics);
        g.clear();
        if (type === 'sunflower') {
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                g.fillColor = new Color(255, 210, 60);
                g.ellipse(Math.cos(a) * 15, Math.sin(a) * 15, 7, 13);
                g.fill();
            }
            g.fillColor = new Color(150, 90, 30);
            g.circle(0, 0, 10);
            g.fill();
            g.fillColor = new Color(60, 150, 60);
            g.rect(-4, -32, 8, 26);
            g.fill();
            g.fillColor = new Color(70, 170, 70);
            g.ellipse(-16, -24, 11, 5);
            g.fill();
            g.ellipse(16, -24, 11, 5);
            g.fill();
        } else if (type === 'shooter') {
            g.fillColor = new Color(60, 150, 60);
            g.rect(-4, -30, 8, 26);
            g.fill();
            g.fillColor = new Color(70, 170, 70);
            g.ellipse(-14, -22, 10, 5);
            g.fill();
            g.fillColor = new Color(50, 170, 60);
            g.ellipse(0, -4, 16, 18);
            g.fill();
            g.fillColor = new Color(90, 200, 70);
            g.circle(8, 9, 12);
            g.fill();
            g.fillColor = new Color(60, 130, 60);
            g.circle(5, 12, 6);
            g.fill();
            g.fillColor = new Color(150, 150, 140);
            g.rect(16, 3, 15, 7);
            g.fill();
            g.fillColor = new Color(60, 60, 60);
            g.circle(30, 6.5, 3);
            g.fill();
        } else {
            g.fillColor = new Color(150, 110, 60);
            g.ellipse(0, -2, 26, 28);
            g.fill();
            g.strokeColor = new Color(110, 78, 40);
            g.lineWidth = 2;
            g.ellipse(0, -2, 26, 28);
            g.stroke();
            g.fillColor = new Color(190, 150, 90);
            g.ellipse(-10, 8, 8, 10);
            g.fill();
        }
    }

    update(dt: number) {
        if (this.type === 'sunflower') {
            this.sunT += dt;
            if (this.sunT >= 7) {
                this.sunT = 0;
                GameRoot.instance.spawnPlantSun(this.node.position.x, this.node.position.y);
            }
        } else if (this.type === 'shooter') {
            this.shootT += dt;
            if (this.shootT >= 1.3 && GameRoot.instance.hasZombieInRow(this.row, this.node.position.x)) {
                this.shootT = 0;
                GameRoot.instance.spawnBullet(this.row, this.node.position.x + 40, this.node.position.y);
            }
        }
    }

    takeDamage(dmg: number) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            GridManager.instance.release(this.row, this.col);
            this.node.destroy();
        }
    }
}
