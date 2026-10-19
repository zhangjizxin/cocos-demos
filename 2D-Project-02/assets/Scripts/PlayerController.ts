import { _decorator, Component, Graphics, Color, UITransform, input, Input, KeyCode, EventKeyboard, view } from 'cc';
const { ccclass, property } = _decorator;

/**
 * PlayerController —— 2D 玩家控制（挂在 Player 预制体上）
 * 用 Graphics 画一个蓝色圆角方块；← → / A D 左右移动，限制在屏幕内。
 */
@ccclass('PlayerController')
export class PlayerController extends Component {

    @property
    public speed = 400;                  // 移动速度 px/s

    private _g: Graphics | null = null;
    private _left = false;
    private _right = false;

    onLoad() {
        // Graphics 是 UIRenderer，会自动补 UITransform
        this._g = this.getComponent(Graphics) || this.node.addComponent(Graphics);
        this._draw();
    }

    onEnable() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDisable() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.ARROW_LEFT || e.keyCode === KeyCode.KEY_A) this._left = true;
        if (e.keyCode === KeyCode.ARROW_RIGHT || e.keyCode === KeyCode.KEY_D) this._right = true;
    }

    onKeyUp(e: EventKeyboard) {
        if (e.keyCode === KeyCode.ARROW_LEFT || e.keyCode === KeyCode.KEY_A) this._left = false;
        if (e.keyCode === KeyCode.ARROW_RIGHT || e.keyCode === KeyCode.KEY_D) this._right = false;
    }

    update(dt: number) {
        let dx = 0;
        if (this._left) dx -= 1;
        if (this._right) dx += 1;
        if (dx === 0) return;

        const ui = this.getComponent(UITransform);
        if (!ui) return;
        // 限制在屏幕可见宽度内（左右各留半个玩家宽度）
        const halfW = view.getVisibleSize().width / 2;
        const bound = Math.max(0, halfW - ui.width / 2);
        let x = this.node.position.x + dx * this.speed * dt;
        x = Math.max(-bound, Math.min(bound, x));
        this.node.setPosition(x, this.node.position.y, this.node.position.z);
    }

    private _draw() {
        const ui = this.getComponent(UITransform);
        if (!ui || !this._g) return;
        const w = ui.width;
        const h = ui.height;
        this._g.clear();
        this._g.roundRect(-w / 2, -h / 2, w, h, 10);
        this._g.fillColor = new Color(70, 150, 255, 255);
        this._g.fill();
        this._g.lineWidth = 4;
        this._g.strokeColor = new Color(30, 90, 200, 255);
        this._g.roundRect(-w / 2, -h / 2, w, h, 10);
        this._g.stroke();
    }
}
