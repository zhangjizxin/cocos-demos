import { _decorator, Component, Graphics, Color, UITransform } from 'cc';
const { ccclass, property } = _decorator;

/**
 * UIBox —— 通用 UI 圆角/直角矩形背景绘制器（纯组件，无美术资源）
 * 挂到需要画背景/遮罩/按钮底色的节点上：
 *   节点必须有 UITransform（尺寸决定图形大小），本组件自动补 Graphics 并绘制。
 *   @property fillColor   填充色（遮罩可设黑色 + 低透明度）
 *   @property strokeColor 描边色（lineWidth>0 时生效）
 *   @property radius      圆角半径（0 表示直角）
 */
@ccclass('UIBox')
export class UIBox extends Component {

    @property
    public fillColor: Color = new Color(0, 0, 0, 160);
    @property
    public strokeColor: Color = new Color(255, 255, 255, 255);
    @property
    public lineWidth = 0;
    @property
    public radius = 0;

    onLoad() {
        this._draw();
    }

    private _draw() {
        const g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        const ui = this.getComponent(UITransform);
        if (!ui) return;
        const w = ui.width;
        const h = ui.height;

        g.clear();
        if (this.radius > 0) {
            g.roundRect(-w / 2, -h / 2, w, h, this.radius);
        } else {
            g.rect(-w / 2, -h / 2, w, h);
        }
        g.fillColor = this.fillColor;
        g.fill();

        if (this.lineWidth > 0) {
            g.lineWidth = this.lineWidth;
            g.strokeColor = this.strokeColor;
            if (this.radius > 0) g.roundRect(-w / 2, -h / 2, w, h, this.radius);
            else g.rect(-w / 2, -h / 2, w, h);
            g.stroke();
        }
    }
}
