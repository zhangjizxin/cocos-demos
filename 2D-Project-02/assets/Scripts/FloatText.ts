import { _decorator, Component, Label, Color, tween, Vec3 } from 'cc';
const { ccclass } = _decorator;

/**
 * FloatText —— 接金币时的飘字特效（挂在 FloatText.prefab 根节点上）
 *
 * 效果：显示 "+10"，先快后慢向上飘 80px，同时放大，0.8 秒后自动销毁。
 * 缓动曲线：cubicOut（先快后慢，像扔东西上去的感觉）
 */
@ccclass('FloatText')
export class FloatText extends Component {

    private _label: Label | null = null;

    onLoad() {
        this._label = this.getComponent(Label);
        if (this._label) {
            this._label.string = '+10';
            this._label.fontSize = 40;
            this._label.color = new Color(255, 220, 50, 255);
        }

        // —— 向上飘：先快后慢（cubicOut）——
        tween(this.node)
            .by(0.8, { position: new Vec3(0, 80, 0) }, { easing: 'cubicOut' })
            .start();

        // —— 放大：先快后慢（backOut，带一点回弹）——
        tween(this.node)
            .to(0.8, { scale: new Vec3(1.5, 1.5, 1) }, { easing: 'backOut' })
            .start();

        // 0.8 秒后自动销毁
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0.8);
    }
}
