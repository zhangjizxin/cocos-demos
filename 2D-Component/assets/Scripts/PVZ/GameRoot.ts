import {
    _decorator, Component, Node, Graphics, Color, UITransform, Label, Layers, instantiate,
} from 'cc';
import { GameManager } from './GameManager';
import { GridManager } from './GridManager';
import { ObjectPool } from './ObjectPool';
import { UIManager } from './UIManager';
import { LevelManager } from './LevelManager';
import { SunSpawner } from './SunSpawner';
import { Plant } from './Plant';
import { Zombie } from './Zombie';
import { Bullet } from './Bullet';
import { Sun } from './Sun';

const { ccclass } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
    static instance: GameRoot = null!;
    plantLayer: Node = null!;
    zombieLayer: Node = null!;
    bulletLayer: Node = null!;
    sunLayer: Node = null!;
    gm: GameManager = null!;
    grid: GridManager = null!;
    pool: ObjectPool = null!;
    ui: UIManager = null!;
    private canvasUI: UITransform = null!;
    private plantTemplate: Node = null!;
    private plantTemplates: { [key: string]: Node } = {};
    private zombieTemplate: Node = null!;
    private bulletTemplate: Node = null!;
    private sunTemplate: Node = null!;
    private over = false;
    private won = false;

    onLoad() {
        GameRoot.instance = this;
        this.canvasUI = this.node.getComponent(UITransform)!;
        this.grid = this.node.getComponent(GridManager)!;
        this.pool = this.node.getComponent(ObjectPool)!;

        this.plantLayer = this.node.getChildByName('PlantLayer')!;
        this.zombieLayer = this.node.getChildByName('ZombieLayer')!;
        this.bulletLayer = this.node.getChildByName('BulletLayer')!;
        this.sunLayer = this.node.getChildByName('SunLayer')!;

        this.gm = this.node.getChildByName('GameManager')!.getComponent(GameManager)!;
        this.plantTemplates['sunflower'] = this.node.getChildByName('SunflowerTemplate')!;
        this.plantTemplates['shooter'] = this.node.getChildByName('ShooterTemplate')!;
        this.plantTemplates['wallnut'] = this.node.getChildByName('WallnutTemplate')!;
        this.zombieTemplate = this.node.getChildByName('ZombieTemplate')!;
        this.bulletTemplate = this.node.getChildByName('BulletTemplate')!;
        this.sunTemplate = this.node.getChildByName('SunTemplate')!;

        this.ui = this.node.getChildByName('UIManager')!.getComponent(UIManager)!;
    }

    start() {
        this.ui.setup(this.node);
    }

    spawnPlant(row: number, col: number, type: string) {
        const template = this.plantTemplates[type] || this.plantTemplates['sunflower'];
        const n = instantiate(template);
        this.plantLayer.addChild(n);
        n.active = true;
        const wp = this.grid.rcToWorld(row, col);
        n.setPosition(wp.x, wp.y);
        n.getComponent(Plant)!.setup(type, row, col);
    }

    spawnBullet(row: number, x: number, y: number) {
        const n = this.pool.get(this.bulletTemplate, 'bullet');
        this.bulletLayer.addChild(n);
        n.getComponent(Bullet)!.setup(row, x, y);
    }

    spawnZombie(row: number) {
        const n = this.pool.get(this.zombieTemplate, 'zombie');
        this.zombieLayer.addChild(n);
        n.setPosition(480, this.grid.rcToWorld(row, 0).y);
        n.getComponent(Zombie)!.setup(row);
    }

    spawnSun(x: number, y: number, value: number, fallFrom: number) {
        const n = instantiate(this.sunTemplate);
        this.sunLayer.addChild(n);
        n.active = true;
        n.getComponent(Sun)!.setup(x, y, value, fallFrom);
    }

    spawnSkySun() {
        this.spawnSun(-380 + Math.random() * 760, -200, 25, 280);
    }

    spawnPlantSun(x: number, y: number) {
        this.spawnSun(x, y - 40, 25, y + 160);
    }

    addSun(v: number) {
        this.gm.addSun(v);
    }

    hasZombieInRow(row: number, x: number): boolean {
        for (const c of this.zombieLayer.children) {
            const z = c.getComponent(Zombie);
            if (z && z.row === row && c.position.x > x) return true;
        }
        return false;
    }

    findZombieHit(row: number, x: number, r: number): Zombie | null {
        for (const c of this.zombieLayer.children) {
            const z = c.getComponent(Zombie);
            if (!z || z.row !== row) continue;
            if (Math.abs(c.position.x - x) <= r) return z;
        }
        return null;
    }

    findPlantInFront(x: number, row: number): Plant | null {
        let best: Plant | null = null;
        let bestX = -Infinity;
        for (const c of this.plantLayer.children) {
            const p = c.getComponent(Plant);
            if (!p || p.row !== row) continue;
            const px = c.position.x;
            if (px < x && px > bestX) {
                bestX = px;
                best = p;
            }
        }
        return best;
    }

    noEnemies(): boolean {
        return this.zombieLayer.children.length === 0;
    }

    gameOver() {
        if (this.over || this.won) return;
        this.over = true;
        this.showText('游戏结束', new Color(255, 60, 60));
    }

    win() {
        if (this.over || this.won) return;
        this.won = true;
        this.showText('通关成功', new Color(80, 220, 120));
    }

    showText(s: string, color: Color) {
        const n = new Node('Result');
        n.layer = Layers.Enum.UI_2D;
        const label = n.addComponent(Label);
        label.string = s;
        label.fontSize = 60;
        label.color = color;
        this.node.addChild(n);
        n.setPosition(0, 0);
    }
}
