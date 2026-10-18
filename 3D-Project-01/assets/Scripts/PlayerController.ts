import { _decorator, Component, Vec3, input, Input, EventMouse, EventKeyboard, KeyCode, Animation, SkeletalAnimation, AudioSource, AudioClip, Slider } from 'cc';
const { ccclass, property } = _decorator;

@ccclass("PlayerController")
export class PlayerController extends Component {

    @property({type: Animation})
    public BodyAnim: Animation|null = null;
    @property({type: SkeletalAnimation})
    public CocosAnim: SkeletalAnimation|null = null;
    // 跳跃音效资源
    @property({type: AudioClip})
    public jumpAudio: AudioClip|null = null;

    // for fake tween
    private _startJump: boolean = false;
    private _jumpStep: number = 0;
    private _curJumpTime: number = 0;
    private _jumpTime: number = 0.3;
    private _curJumpSpeed: number = 0;
    private _jumpHeight: number = 1.2;   // 当前跳跃的抛物线高度（高跳时更大）
    private _curPos: Vec3 = new Vec3();
    private _deltaPos: Vec3 = new Vec3(0, 0, 0);
    private _targetPos: Vec3 = new Vec3();
    private _curMoveIndex = 0;

    //=====新增：长按蓄力跳=====
    @property({type: Slider})
    public powerSlider: Slider | null = null;   // 蓄力条（编辑器拖入 Slider 组件）

    private _charging: boolean = false;          // 是否正在按住蓄力
    private _power: number = 0;                  // 当前蓄力值 0~1

    start () {
    }

    reset() {
        this._curMoveIndex = 0;
    }

    setInputActive(active: boolean) {
        if (active) {
            input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
            input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        } else {
            input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
            input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
            input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        }
    }

    // 空格键 = 特殊高跳：一次跳 3 格且跳得更高，用于越过障碍物
    onKeyUp(event: EventKeyboard) {
        if (event.keyCode === KeyCode.SPACE) {
            this.jumpByStep(3, true);
        }
    }

    // 鼠标左键按下：开始蓄力
    onMouseDown(event: EventMouse) {
        if (event.getButton() === 0) {
            this._charging = true;
            this._power = 0;
            if (this.powerSlider) this.powerSlider.value = 0;
        }
    }

    // 鼠标左键松开：按蓄力值起跳；右键：直接跳 2 格
    onMouseUp(event: EventMouse) {
        if (event.getButton() === 0) {
            if (this._charging) {
                this._charging = false;
                this.doPowerJump();
            }
        } else if (event.getButton() === 2) {
            this.jumpByStep(2);
        }
    }

    // 根据蓄力值决定跳跃格数与高度
    doPowerJump() {
        const power = this._power;
        const step = Math.max(1, Math.round(power * 3)); // 蓄力 0~1 → 跳 1~3 格
        const high = power >= 0.6;                       // 蓄力超过 6 成 = 高跳
        this.jumpByStep(step, high);
        if (this.powerSlider) this.powerSlider.value = 0;
    }

    jumpByStep(step: number, high: boolean = false) {
        if (this._startJump) {
            return;
        }
        this._startJump = true;
        this._jumpStep = step;
        this._curJumpTime = 0;
        this._curJumpSpeed = this._jumpStep / this._jumpTime;
        // 高跳时抛物线更高，用于越过障碍物
        this._jumpHeight = high ? 2.6 : 1.2;
        this.node.getPosition(this._curPos);
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0));

        if (this.CocosAnim) {
            this.CocosAnim.getState('cocos_anim_jump').speed = high ? 5 : 3.5;
            this.CocosAnim.play('cocos_anim_jump');
        }

        // 播放音效，多层判空，杜绝报错
        if(this.jumpAudio){
            const audioSource = this.node.getComponent(AudioSource);
            if(audioSource){
                audioSource.playOneShot(this.jumpAudio);
            }
        }

        this._curMoveIndex += step;
    }

    onOnceJumpEnd() {
        if (this.CocosAnim) {
            this.CocosAnim.play('cocos_anim_idle');
        }
        this.node.emit('JumpEnd', this._curMoveIndex);
    }

    update (deltaTime: number) {
        // 蓄力：按住时蓄力值不断上涨，并同步到蓄力条
        if (this._charging) {
            this._power += deltaTime * 1.2;   // 约 0.83 秒蓄满
            if (this._power > 1) this._power = 1;
            if (this.powerSlider) this.powerSlider.value = this._power;
        }

        if (this._startJump) {
            this._curJumpTime += deltaTime;
            if (this._curJumpTime > this._jumpTime) {
                this.node.setPosition(this._targetPos);
                this._startJump = false;
                this.onOnceJumpEnd();
            } else {
                const t = this._curJumpTime / this._jumpTime;
                const jumpHeight = this._jumpHeight;
                const yOffset = -4 * jumpHeight * (t - 0.5) * (t - 0.5) + jumpHeight;
                this.node.setPosition(
                    this._curPos.x + this._jumpStep * t,
                    this._curPos.y + yOffset,
                    this._curPos.z
                );
            }
        }
    }
}