import { _decorator, Component, Vec3, CharacterController, input, Input, EventKeyboard, KeyCode } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 第三人称角色移动：WASD / 方向键控制，使用 CharacterController.move() 移动。
 * inputEnabled 由 GameManager 控制：开始界面/结束界面时置 false，角色不动。
 */
@ccclass('PlayerController')
export class PlayerController extends Component {
    @property({ tooltip: '移动速度（米/秒）' })
    moveSpeed = 5;

    @property({ tooltip: '是否接受键盘输入（GameManager 在开始/结束时控制）' })
    inputEnabled = true;

    private _cc: CharacterController = null!;
    private _input = new Vec3();

    onLoad() {
        this._cc = this.getComponent(CharacterController)!;
    }

    onEnable() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDisable() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private onKeyDown(e: EventKeyboard) {
        switch (e.keyCode) {
            case KeyCode.KEY_W: case KeyCode.ARROW_UP: this._input.z = 1; break;
            case KeyCode.KEY_S: case KeyCode.ARROW_DOWN: this._input.z = -1; break;
            case KeyCode.KEY_A: case KeyCode.ARROW_LEFT: this._input.x = -1; break;
            case KeyCode.KEY_D: case KeyCode.ARROW_RIGHT: this._input.x = 1; break;
        }
    }

    private onKeyUp(e: EventKeyboard) {
        switch (e.keyCode) {
            case KeyCode.KEY_W: case KeyCode.ARROW_UP: this._input.z = 0; break;
            case KeyCode.KEY_S: case KeyCode.ARROW_DOWN: this._input.z = 0; break;
            case KeyCode.KEY_A: case KeyCode.ARROW_LEFT: this._input.x = 0; break;
            case KeyCode.KEY_D: case KeyCode.ARROW_RIGHT: this._input.x = 0; break;
        }
    }

    update(dt: number) {
        // 开始界面 / 结束界面时不响应输入
        if (!this.inputEnabled) return;

        const dir = this._input.clone();
        if (dir.lengthSqr() > 0) dir.normalize();

        // move() 的位移参数需要先乘以时间增量 dt
        const motion = new Vec3(dir.x * this.moveSpeed * dt, 0, dir.z * this.moveSpeed * dt);
        this._cc.move(motion, dt);

        // 有输入时让角色面朝移动方向
        if (dir.lengthSqr() > 0) {
            this.node.forward = dir;
        }
    }
}
