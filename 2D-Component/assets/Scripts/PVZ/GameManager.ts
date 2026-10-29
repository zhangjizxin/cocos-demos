import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    static instance: GameManager = null!;

    @property({ type: Label })
    sunLabel: Label = null!;

    @property
    sun = 200;

    selectedPlant = '';

    onLoad() {
        GameManager.instance = this;
        this.updateSunLabel();
    }

    onDestroy() {
        GameManager.instance = null!;
    }

    addSun(n: number) {
        this.sun += n;
        this.updateSunLabel();
    }

    canAfford(cost: number) {
        return this.sun >= cost;
    }

    spendSun(cost: number) {
        if (this.sun < cost) return false;
        this.sun -= cost;
        this.updateSunLabel();
        return true;
    }

    selectPlant(name: string) {
        this.selectedPlant = name;
    }

    updateSunLabel() {
        if (this.sunLabel) this.sunLabel.string = '阳光：' + this.sun;
    }
}
