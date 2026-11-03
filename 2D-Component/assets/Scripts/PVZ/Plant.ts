import { _decorator, Component } from 'cc';
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
