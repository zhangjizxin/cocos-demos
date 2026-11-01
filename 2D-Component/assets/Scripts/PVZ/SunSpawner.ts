import { _decorator, Component } from 'cc';
import { GameRoot } from './GameRoot';

const { ccclass } = _decorator;

@ccclass('SunSpawner')
export class SunSpawner extends Component {
    interval = 8;
    private t = 0;

    update(dt: number) {
        this.t += dt;
        if (this.t >= this.interval) {
            this.t = 0;
            GameRoot.instance.spawnSkySun();
        }
    }
}
