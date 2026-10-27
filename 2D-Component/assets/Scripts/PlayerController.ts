import { _decorator, Component, Label, RigidBody2D, Vec2, input, Input, EventKeyboard, KeyCode, Graphics } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property({ type: Label })
    scoreLabel: Label = null!;

    @property
    moveSpeed = 400;

    private _score = 0;
    private _rb: RigidBody2D = null!;
    private _moveLeft = false;
    private _moveRight = false;

    onLoad() {
        this._rb = this.getComponent(RigidBody2D)!;
        this._rb.gravityScale = 0;
        const g = this.getComponent(Graphics);
        if (g) {
            g.fillColor.set(0, 150, 255, 255);
            g.rect(-60, -20, 120, 40);
            g.fill();
        }
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(e: EventKeyboard) {
        if (e.keyCode === KeyCode.ARROW_LEFT || e.keyCode === KeyCode.KEY_A) this._moveLeft = true;
        if (e.keyCode === KeyCode.ARROW_RIGHT || e.keyCode === KeyCode.KEY_D) this._moveRight = true;
    }

    onKeyUp(e: EventKeyboard) {
        if (e.keyCode === KeyCode.ARROW_LEFT || e.keyCode === KeyCode.KEY_A) this._moveLeft = false;
        if (e.keyCode === KeyCode.ARROW_RIGHT || e.keyCode === KeyCode.KEY_D) this._moveRight = false;
    }

    update() {
        let dir = 0;
        if (this._moveLeft) dir -= 1;
        if (this._moveRight) dir += 1;
        this._rb.linearVelocity = new Vec2(dir * this.moveSpeed, 0);
    }

    addScore(n: number) {
        this._score += n;
        if (this.scoreLabel) {
            this.scoreLabel.string = '金币：' + this._score;
        }
    }
}
