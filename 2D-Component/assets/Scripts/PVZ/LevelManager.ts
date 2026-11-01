import { _decorator, Component } from 'cc';
import { GameRoot } from './GameRoot';

const { ccclass } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    waves = [
        { count: 5, interval: 3.2 },
        { count: 8, interval: 2.4 },
        { count: 12, interval: 1.8 },
    ];
    private waveIndex = 0;
    private spawned = 0;
    private t = 8;
    private done = false;

    update(dt: number) {
        if (this.done) return;
        if (this.waveIndex >= this.waves.length) {
            if (GameRoot.instance.noEnemies()) {
                this.done = true;
                GameRoot.instance.win();
            }
            return;
        }
        this.t += dt;
        const wave = this.waves[this.waveIndex];
        if (this.spawned < wave.count && this.t >= wave.interval) {
            this.t = 0;
            this.spawned++;
            GameRoot.instance.spawnZombie(Math.floor(Math.random() * 5));
        }
        if (this.spawned >= wave.count) {
            this.waveIndex++;
            this.spawned = 0;
            this.t = 4;
        }
    }
}
